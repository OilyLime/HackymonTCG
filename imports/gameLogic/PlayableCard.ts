import {Card, CardType, EnergyCard, EnergyCat, PokemonCat} from '../api/collections';


export class PlayableCard{
    id:number;
    card:Card;
    currentDamage:number;
    currentEnergy:[EnergyCard];
    
    constructor(id: number, card?:Card, playable?:PlayableCard){
        if(card !== undefined && playable !== undefined) {
            this.currentDamage = null;
        }
        else if(card !== undefined) {
            if(card.type == CardType.POKEMON){
                this.currentDamage = 0;
            }
            this.card = card;
        }
        else if(playable !== undefined) {
            if(playable.card.type == CardType.POKEMON){
                this.currentEnergy = playable.currentEnergy;
                this.currentDamage = playable.currentDamage;
            }
        }
        this.id = id;
    }

    isPokemon(){
        return this.card.type == CardType.POKEMON;
    }

    isEnergy(){
        return this.card.type == CardType.ENERGY;
    }

    isBasic(){
        return this.isPokemon() && this.card.category == PokemonCat.BASIC;
    }

    isEvolution(){
        return this.isPokemon() && this.card.category == PokemonCat.STAGE_ONE;
    }

    addEnergy(energyCard:PlayableCard){

        //TODO: check type is acceptable by pokemon
        this.currentEnergy.concat(<EnergyCard>energyCard.card);
    }

    countEnergyOfType(energyCat:EnergyCat){
        let energy=0;

        this.currentEnergy.forEach((eCard)=>{
            if(eCard.category = energyCat){
                energy++;
            }
        });

        return energy;
    }

    getAllEnergyList(){
        let eList={};
        Object.keys(EnergyCat).filter((key)=>{
            let eCount = this.countEnergyOfType(EnergyCat[key]);
            eList[EnergyCat[key]]=eCount;
        });
        return eList;
    }
    

}