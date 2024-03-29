import { Template } from 'meteor/templating';
import './PlayLayout.html';
import './PlayLayout.css';
import '../../gameComponents/Board/Board.ts'
import { GameStates } from "../../../api/collections";
import {MoveState} from "./MoveState";
import {Session} from "meteor/session";
import '../../partials/MulliganModal/MulliganModal';
import {MoveStateController} from "./MoveState";
declare let FlowRouter: any;
let PlayerVictory: any;

Template.PlayLayout.helpers({
    IsLoggedIn: function () {
      return Meteor.userId()!=null;
    },
    RedirectToLandingLayout:function(){
        FlowRouter.go('/');
    },
    getGameState:function(){
      return GameStates.find({"userid":Meteor.userId()}).fetch()[0];
    },
    isGameOver: function () {
        let state = GameStates.find({"userid":Meteor.userId()}).fetch()[0];
        return !(state.winner === undefined);
    },
    displayModal: function () {
        let modal = document.getElementById('GameOverModal');
        if(modal){
            modal.style.display = 'block';
        }
    }
  });

Template.GameOverModal.helpers({
    playerVictory: function () {
        if(PlayerVictory === undefined){
            let state = GameStates.find({"userid":Meteor.userId()}).fetch()[0];
            PlayerVictory = state.winner.id === state.player.id
        }
        return PlayerVictory;
    }
});

Template.PlayLayout.events({
    'click #endGame': function() {
        PlayerVictory = undefined;
        Meteor.call('upsertNewGameState');
        let ms = Session.get("move-state");
        MoveStateController.resetMoveState(ms);
        Session.set("move-state",ms);
        FlowRouter.go('/');
    }
});

Template.Board.onCreated(function(){
  let ms = new MoveState();
  Session.set("move-state",ms);
});