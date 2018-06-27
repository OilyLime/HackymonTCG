import { Mongo } from "meteor/mongo";
import { CardType, CardCategory } from "./Cards";

export enum AbilityType {
  DECK = "deck",
  DAMAGE = "dam",
  REDAMAGE = "redamage",
  SWAP = "swap",
  CONDITIONAL = "cond",
  HEAL = "heal",
  APPLY_STAT = "applystat",
  DESTAT = "destat",
  SEARCH = "search",
  REENERGIZE = "reenergize",
  DEENERGIZE = "deenergize",
  DRAW = "draw",
  SHUFFLE = "shuffle",
  ADD = "add",
}

export enum Target {
  YOUR_ACTIVE = "your-active",
  OPPONENT_ACTIVE = "opponent-active",
  OPPONENT = "opponent",
  YOUR = "your",
  YOUR_BENCH = "your-bench",
  OPPONENT_BENCH = "opponent-bench",
  YOUR_POKEMON = "your-pokemon",
  THEM = "them",
  YOU = "you",
  DECK = "deck",
  DISCARD = "discard",
  LAST = "last",
  TOP = "top",
}

export enum Choice {
  YOURS = "yours",
  OPPONENT = "opponent",
  RANDOM = "random",
}

export enum Status {
  PARALYZED = "paralyzed",
  SLEEP = "sleep",
  STUCK = "stuck",
  POISONED = "poisoned",
}

export interface Ability {
  index: number;
  name: string;
  actions: AbilityAction[];
}

export enum AbilityFunction {
  COUNT = "count",
}

export enum Condition {
  FLIP = "flip",
  ABILITY = "ability",
  HEAL = "heal",
  CHOICE = "choice",
}

export interface AbilityAction {
  type: AbilityType;
  source?: Target;
  target?: Target;
  choice?: Choice;
  status?: Status;
  conditional?: {
    true?: AbilityAction;
    false?: AbilityAction;
    condition?: Condition;
    conditionAbility?: AbilityAction;
    healTarget?: Target;
  };
  filter?: {
    category?: CardCategory;
    type?: CardType;
    top?: boolean;
    count?: number;
    evolution?: boolean;
    evolutionTarget?: Target;
  }
  amount?: number;
  multiplierTarget?: Target;
  multiplierFunction?: AbilityFunction;
  specification?: string; // any additional data required for the action
}

let Abilities: Mongo.Collection<Ability>;
if(!Abilities) {
  Abilities = new Mongo.Collection<Ability>("abilities");
}

export { Abilities };