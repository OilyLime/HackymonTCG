import {GameState} from './GameState';
import {Player} from "./Player";
import {PlayableCard} from "./PlayableCard";
import {Cards, GameStates} from "../api/collections";

export module GameManager {
    /***
     * Generic coin flip method, used for abilities, trainer cards, and determining turn order. Heads is true, tails
     * is false.
     * @returns {boolean}
     */
    function coinFlip() {
        return (Math.floor(Math.random() * 2) == 0);
    }

    function shuffleDeck(deck: PlayableCard[]) {
        let i = deck.length, temp, random;
        while (i !== 0) {
            random = Math.floor(Math.random() * i);
            i--;

            temp = deck[i];
            deck[i] = deck[random];
            deck[random] = temp;
        }
        return deck;
    }

    export function placePrizeCards(player: Player) {
        for(let i = 0; i < 6; i++){
            player.prize.push(player.deck.pop());
        }
    }

    export function initializeGame(deck: number[], shuffle: boolean){
        let state = GameStates.find({userid: Meteor.userId()}).fetch()[0];
        state.humanFirst = coinFlip(); //Human always _chooses_ heads

        //TODO: Once the decks are uploaded to the DB (one per user) remove deck param and fetch deck from DB
        generateDeck(state.player, deck, shuffle);
        generateDeck(state.ai, deck, true);

        draw(false, 7);
        //TODO: Check for AI Mulligan

        GameStates.update({userid: Meteor.userId()}, state);

        draw(true, 7);
        //TODO: Check for human mulligan

        GameStates.update({userid: Meteor.userId()}, state);

        placePrizeCards(state.player);
        placePrizeCards(state.ai);

        GameStates.update({userid: Meteor.userId()}, state);
    }

    /***
     * Generating a deck from a list of numbers, which are the lookup indices for the defined card set in the DB. For
     * each card, a PlayableCard wrapper is created and added to the deck, with an ID, for referencing purposes when
     * the app is running.
     * @param {Player} player
     * @param {number[]} deck
     */
    export function generateDeck(player: Player, deck: number[], shuffle: boolean){
        let newDeck: PlayableCard[] = new Array(50);
        let counter: number = 0;
        for(let i in deck){
            let card = Cards.find({ i }).fetch()[0];
            newDeck.push(new PlayableCard(counter++, card));
        }
        if(shuffle){
            newDeck = shuffleDeck(newDeck);
        }
        player.deck = newDeck;
    }

    export function draw(humanPlayer: boolean, n?:number){
        let state = GameStates.find({userid: Meteor.userId()}).fetch()[0];
        let player: Player = humanPlayer ? state.player : state.ai;
        let toDraw: number = n ? n : 1; //Assigning number of cards to draw to n if passed, else 1
        for(let i = 0; i < toDraw; i++) {
            if(player.deck.length === 0){
                //TODO: End the game here (LOSS)
            }
            player.hand.push(player.deck.pop());
        }
        GameStates.update({userid: Meteor.userId()}, state);
    }

    export function attack(player:Player, opponent:Player, target?:PlayableCard){
        //TODO: Check if attack triggered a game ending condition: Drew all prize cards, knocked out all enemy pokemon
    }

    export function evolve(humanPlayer: boolean, toEvolve:PlayableCard, evolution:PlayableCard) {
        let state = GameStates.find({userid: Meteor.userId()}).fetch()[0];
        let player: Player = humanPlayer ? state.player : state.ai;
        if(toEvolve.isPokemon() && evolution.isPokemon()){
            toEvolve = mapCardCopy(player, toEvolve);
            evolution = mapCardCopy(player, evolution);
            if(player.hand.includes(evolution) && (player.bench.includes(toEvolve) ||
                player.bench.includes(toEvolve))){
                if (toEvolve.isBasic() && evolution.isEvolution()) {
                    //TODO: Additional check to validate that the two cards are compatible for evolution
                    toEvolve.card = evolution.card;
                    this.removeFromHand(player, evolution)
                }
            }
        }
        GameStates.update({userid: Meteor.userId()}, state);
    }

    export function addEnergy(humanPlayer: boolean, pokemon: PlayableCard, energy:PlayableCard){
        let state = GameStates.find({userid: Meteor.userId()}).fetch()[0];
        let player: Player = humanPlayer ? state.player : state.ai;
        if(pokemon.isPokemon() && energy.isEnergy()){
            pokemon = mapCardCopy(player, pokemon);
            energy = mapCardCopy(player, energy, true);
            if(pokemon !== null && energy !== null){
                //Pokemon must either be active or on the bench
                pokemon.addEnergy(energy);
                this.removeFromHand(player, energy);
            }
        }
        GameStates.update({userid: Meteor.userId()}, state);
    }

    export function placeActive(humanPlayer: boolean, card:PlayableCard){
        let state = GameStates.find({userid: Meteor.userId()}).fetch()[0];
        let player: Player = humanPlayer ? state.player : state.ai;
        card = mapCardCopy(player, card, true)
        if(!player.active && card.isPokemon()){
            //Only possible if there is no active Pokemon and the card is a Pokemon type
            player.active = card;
            this.removeFromHand(player, card);
        }
        return this.gameState;
    }

    export function placeBench(humanPlayer: boolean, card:PlayableCard){
        let state = GameStates.find({userid: Meteor.userId()}).fetch()[0];
        let player: Player = humanPlayer ? state.player : state.ai;
        card = mapCardCopy(player, card, true)
        if(player.bench.length < 5 && card.isPokemon()){
            //Only possible if player has less than 5 Pokemon on the bench
            player.bench.push(card);
            this.removeFromHand(player, card);
        }
        GameStates.update({userid: Meteor.userId()}, state);
    }

    /***
     * Helper function for removing a card from a players hand, using the Array filter method.
     * @param {Player} player
     * @param {PlayableCard} card
     */
    function removeFromHand(player:Player, card:PlayableCard){
        player.hand.filter(c => c !== card);
    }

    export function playTrainer(){
        //TODO: Implement simple (non-exceptional) trainer cards
    }

    /***
     * The Card objects passed by the client side code are merely copies, and so in order to accurately affect the game
     * state we need to map them to objects in the GameState object in memory using their IDs
     * @param {Player} player
     * @param {PlayableCard} card
     * @param {boolean} hand -> used for specifying that we are trying to get a card out of the hand
     * @returns {PlayableCard}
     */
    function mapCardCopy(player: Player, card: PlayableCard, hand?: boolean){
        if(hand) {
            let card: PlayableCard = player.bench.find(function (element) { return element.id === card.id });
            return card;
        }
        else {
            let pokemonCard: PlayableCard = (player.active.id === card.id) ? player.active :
                player.bench.find(function (element) {
                    return element.id === card.id
                });
            return pokemonCard;
        }
    }
}