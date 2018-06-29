import './Hand.html';
import './Hand.css';
import '../Card/Card.ts';
import { Template } from 'meteor/templating'
import { CardType } from "../../../api/collections";
import { Session } from "meteor/session";
import { MoveStateController } from "../../layouts/PlayLayout/MoveState"

Template.Hand.helpers({
    isCardDefined:function(playableCard){
        console.log(playableCard)
        if(playableCard==undefined){
            return false;
        }
        if(Object.keys(playableCard).length === 0){
            return false;
        }
        if(Object.keys(playableCard.card).length === 0){
            return false;
        }
        else{
            return true;
        }
    }
});

Template.Hand.events({
    "click .playable-card":function(event){
        console.log("From Hand: " +JSON.stringify(this));
    },
    "click .hand-card":function(event){
        console.log("energy: "+this.energyPlayed);
        if(this.isNotInteractable && this.energyPlayed ){
            return;
        }
        let playableCardId =event.currentTarget.getElementsByClassName("playable-card")[0].getAttribute("data-playable-card-id")
        // console.log(playableCardName);
        let playableCard;
        this.hand.forEach((pc) => {
            // console.log(pc);
            // console.log("find: "+ playableCardId);
            if(!pc.card){
                return;
            }
            if(pc.id === parseInt(playableCardId)){
                playableCard=pc;
                console.log( "is active?: "+ this.active + " this.isFirstRound: "+this.isFirstRound)
                if((!this.active&&this.isFirstRound)|| !this.isFirstRound){
                    if(playableCard.card.type== CardType.POKEMON){
                        if(playableCard.card.evolution){
                            let ms = Session.get("move-state");                        
                            MoveStateController.setEvolutionPokemon(ms,playableCard);
                            Session.set("move-state",ms);
                        }else{
                            Meteor.call("benchPokemon",true, playableCard);
                            let ms = Session.get("move-state");                        
                            MoveStateController.resetMoveState(ms);
                            Session.set("move-state",ms);
                        }
                    }
                }
                if(this.isFirstRound){
                    return;
                }
                if(playableCard.card.type == CardType.ENERGY){
                    let ms = Session.get("move-state");
                    MoveStateController.setEnergy(ms,playableCard, this.energyPlayed);
                    Session.set("move-state",ms);
                }
            }
        });
    }
});