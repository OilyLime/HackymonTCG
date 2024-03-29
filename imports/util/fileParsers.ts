import {
  Card,
  Cards,
  CardCategory,
  CardType,
  PokemonCard,
  PokemonCat,
  Cost,
  AbilityReference,
  TrainerCard,
  TrainerCat,
  EnergyCard,
  EnergyCat
} from "../api/collections/Cards";
import {
  Ability,
  AbilityAction,
  AbilityType,
  Abilities,
  Target,
  AbilityFunction,
  Choice,
  Status,
  Condition
} from "../api/collections/abilities";

import{  
  Decks
} from "../api/collections/Deck";

export function parseCardString(data: string): void {
  Cards.remove({}); // drop all cards
  data.replace("\r", "");
  // data.replace("#\n", "");
  let ctr = 1;
  data.split("\n").forEach((cardStr: string) => {
    if (cardStr === "#") {
      ++ctr;
    } else {
      const tokens: string[] = cardStr.split(':');
      const name: string = tokens[0];
      const type: CardType = tokens[1] as CardType;
      let card: Card | undefined;
      switch (type) {
        case CardType.POKEMON:
          card = parsePokemon(ctr++, name, type, tokens);
          break;
        case CardType.TRAINER:
          card = parseTrainer(ctr++, name, type, tokens);
          break;
        case CardType.ENERGY:
          card = parseEnergy(ctr++, name, type, tokens);
          break;
      }
  
      console.log(card);
      if (card) {
        Cards.insert(card);
      }
    }
  });
}

export function parsePokemon(index: number, name: string, type: CardType, tokens: string[]): PokemonCard {
  if (type === CardType.POKEMON) {
    let category: PokemonCat;
    let healthPoints: number;
    let evolution: string | undefined;
    if (tokens[3] === PokemonCat.STAGE_ONE) {
      evolution = tokens[4];
      category = tokens[6] as PokemonCat;
      healthPoints = parseInt(tokens[7]);
    } else {
      category = tokens[5] as PokemonCat;
      healthPoints = parseInt(tokens[6]);
    }

    const retreatCost: Cost = {};
    const retreatTokens: string[] = tokens.slice(tokens.indexOf("retreat") + 1, tokens.indexOf("attacks"));
    for (let i = 0; i < retreatTokens.length; i += 3) {
      retreatCost[retreatTokens[i + 1] as EnergyCat] = parseInt(retreatTokens[i + 2]);
    }

    let costAcc: Cost = {};
    
    let abilities: AbilityReference[] = tokens.slice(tokens.indexOf("attacks") + 1).join(":").split(",").map((abilityString: string) => {
      const abilityTokens = abilityString.split(":");
      costAcc[abilityTokens[1] as EnergyCat] = parseInt(abilityTokens[2]);
      if (abilityTokens.length === 4) {
        const ability: AbilityReference =  {
          index: parseInt(abilityTokens[3]),
          cost: costAcc,
        }
        costAcc = {};

        return ability
      }
    }).filter(ref => !!ref) as AbilityReference[]; // filter should remove undefined
    // remove undefined entries
    let abilityIndex = 0;
    abilities = abilities.reduce((acc: AbilityReference[], val: AbilityReference | undefined) => {
      if (val) {
        acc[abilityIndex++] = val;
      }

      return acc;
    }, [])

    return {
      index,
      name,
      type,
      category,
      healthPoints,
      abilities,
      retreatCost,
      evolution,
    }
  } else {
    throw "invalid card type"
  }
}

export function parseTrainer(index: number,name: string, type: CardType, tokens: string[]): TrainerCard {
  if (type === CardType.TRAINER) {

    return {
      index,
      name,
      type,
      category: tokens[3] as TrainerCat,
      abilities: [{
        index: parseInt(tokens[4]),
      }],
    };
  } else {
    throw "invalid card type";
  }
}

export function parseEnergy(index: number,name: string, type: CardType, tokens: string[]): EnergyCard {
  if (type === CardType.ENERGY) {
    return {
      index,
      name,
      type,
      category: tokens[3] as EnergyCat,
    }
  } else {
    throw "invalid card type"
  }
  
}

export function parseAbilityString(data: string): void {
  Abilities.remove({});
  
  let ctr = 1;
  data.split("\n").forEach((abilityStr: string) => {
    const nameIndex = abilityStr.indexOf(':');
    const ability: Ability = {
      index: ctr++,
      name: abilityStr.substr(0, nameIndex),
      actions: parseAbility(abilityStr.substr(nameIndex + 1, abilityStr.length - (nameIndex + 1))),
    };

    // Abilities.insert(ability); // callback??
    console.log(ability);
    Abilities.insert(ability);
  });


}

export function parseAbility(rawString: string) {
  // cannot split on comma only first comma must be taken into account so use substring
  const abilityStr = preparseAbilities(rawString);
  console.log("ABS: ", abilityStr);
  return abilityStr.split(',').map<AbilityAction>((actionStr: string) => {
    let looseAction: Partial<AbilityAction> = {};
    const typeIndex = actionStr.indexOf(':');
    const actionType = actionStr.substr(0, typeIndex);
    if (Object.values(AbilityType).includes(actionType)) {
      looseAction.type = actionType as AbilityType;
    } else {
      console.log(abilityStr);
      console.log(actionStr);
      console.error("invalid ability type")
      return looseAction as AbilityAction;
    }
    switch (looseAction.type) {
      case AbilityType.DAMAGE:
        return parseSingleTarget(looseAction, actionStr.substr(typeIndex + 1, actionStr.length)) as AbilityAction;
      case AbilityType.HEAL:
        return parseSingleTarget(looseAction, actionStr.substr(typeIndex + 1, actionStr.length)) as AbilityAction;
      case AbilityType.DEENERGIZE:
        return parseSingleTarget(looseAction, actionStr.substr(typeIndex + 1, actionStr.length)) as AbilityAction;
      case AbilityType.REENERGIZE:
        return parseSourceTarget(looseAction, actionStr.substr(typeIndex + 1, actionStr.length)) as AbilityAction;
      case AbilityType.REDAMAGE:
        return parseSourceTarget(looseAction, actionStr.substr(typeIndex + 1, actionStr.length)) as AbilityAction;
      case AbilityType.SWAP:
        return parseSourceTarget(looseAction, actionStr.substr(typeIndex + 1, actionStr.length)) as AbilityAction;
      case AbilityType.DESTAT:
        return parseTargetOnly(looseAction, actionStr.substr(typeIndex + 1, actionStr.length)) as AbilityAction;
      case AbilityType.DESTAT:
        return parseTargetOnly(looseAction, actionStr.substr(typeIndex + 1, actionStr.length)) as AbilityAction;
      case AbilityType.APPLY_STAT:
        return parseStatus(looseAction, actionStr.substr(typeIndex + 1, actionStr.length)) as AbilityAction;
      case AbilityType.DRAW:
        return parseDraw(looseAction, actionStr.substr(typeIndex + 1, actionStr.length)) as AbilityAction;
      case AbilityType.SEARCH:
        return parseSearch(looseAction,  actionStr.substr(typeIndex + 1, actionStr.length)) as AbilityAction;
      case AbilityType.DECK:
        return parseDeck(looseAction, actionStr.substr(typeIndex + 1, actionStr.length)) as AbilityAction;
      case AbilityType.SHUFFLE:
        return parseTargetOnly(looseAction, actionStr.substr(typeIndex + 1, actionStr.length)) as AbilityAction;
      case AbilityType.CONDITIONAL:
        return parseCondition(looseAction, actionStr.substr(typeIndex + 1, actionStr.length)) as AbilityAction;
    }
    
    if (looseAction.type) {
      return looseAction as AbilityAction; // ensures that ability is properly typed
    } else {
      throw "woops";
    }
  });
}

function parseSingleTarget(action: Partial<AbilityAction>, actionData: string): Partial<AbilityAction> {
  const tokens: string[] = actionData.split(':');
  if (tokens[1] === "choice") {
    action.choice = tokens[2] as Choice;
    action.target = tokens.length === 5 ? tokens[3] as Target : tokens[2] as Target;
    action = parseAmount(action, tokens.slice(tokens.length === 5? 4 : 3, tokens.length).join(":")); // append amount data
  } else {
    action.target = tokens[1] as Target;
    action = parseAmount(action, tokens.slice(2, tokens.length).join(":"));
  }

  return action; // should be a full action at this point
}

function parseTargetOnly(action: Partial<AbilityAction>, actionData: string): Partial<AbilityAction> {
  const tokens: string[] = actionData.split(':');
  if (tokens[1] === "choice") {
    action.choice = tokens[2] as Choice;
    action.target = tokens[3] ? tokens[3] as Target : Target.OPPONENT;
  } else {
    action.target = tokens[1] as Target;
  }

  return action;
}

function parseSource(action: Partial<AbilityAction>, actionData: string): Partial<AbilityAction> {
  const tokens: string[] = actionData.split(':');
  if (tokens[1] === "choice") {
    action.choice = tokens[2] as Choice;
    action.source = tokens[3] ? tokens[3] as Target : Target.OPPONENT;
  } else {
    action.source = tokens[1] as Target;
  }

  return action;
}

function parseSourceTarget(action: Partial<AbilityAction>, actionData: string): Partial<AbilityAction> {
  const destinationIndex = actionData.indexOf("destination");
  const sourceString: string = actionData.substr(0, destinationIndex);
  const targetString: string = actionData.substr(destinationIndex, actionData.length - destinationIndex);

  return parseSource(parseSingleTarget(action, targetString), sourceString);
}

function parseStatus(action: Partial<AbilityAction>, actionData: string): Partial<AbilityAction> {
  const tokens: string[] = actionData.split(':');
  action.status = tokens[1] as Status;
  action.target = Target.OPPONENT_ACTIVE;

  return action;
}

function parseDraw(action: Partial<AbilityAction>, actionData: string): Partial<AbilityAction> {
  const tokens: string[] = actionData.split(':');
  if (tokens.length > 1) {
    action.target = tokens[0] as Target;
    action.amount = parseInt(tokens[1]);
  } else {
    action.amount = parseInt(tokens[0]);
  }
  return action;
}

function parseSearch(action: Partial<AbilityAction>, actionData: string): Partial<AbilityAction> {
  const tokens: string[] = actionData.split(':');
  let sourceIndex: number = 3;
  if (action.target === Target.YOUR_POKEMON) {
    action.specification = tokens.slice(2, 4).join(':');
    sourceIndex = 6;
  }
  action.target = `${tokens[1]}-${tokens[sourceIndex]}` as Target;
  const fileterTokens = tokens.slice(sourceIndex + 1, tokens.length);
  action = parseFilter(action, fileterTokens);

  action.amount = parseInt(tokens.pop() || "0");
  
   return action;
}

function parseAmount(action: Partial<AbilityAction>, data: string): Partial<AbilityAction> {
  // check if amount is function or number
  const functionIndex = data.indexOf('count'); // only function is count
  if (functionIndex === -1) {
    action.amount = parseInt(data);
  } else {
    // there is always only one operator so all non present operators will be -1 which is always less than 0
    const operatorIndex = Math.max(data.indexOf("*"), data.indexOf(">"), data.indexOf("<"));
    let number: string;
    let func: string;
    if (operatorIndex !== -1) {
      const operator = data.charAt(operatorIndex);
      const factors = data.split(operator);
      if (!isNaN(parseInt(factors[0]))) {
        number = factors[0];
        func = factors[1];
      } else {
        number = factors[1];
        func = factors[0];
      }
      action.amount = parseInt(number);
      action.amountOperator = operator;
    } else {
      func = data;
    }
    const multiplierInfo = func.split("(");
    action.amountFunction = multiplierInfo[0] as AbilityFunction;
    let functionTargetTokens: string[] = multiplierInfo[1].replace(')', '').split(":");
    if (functionTargetTokens.length === 1) {
      action.amountFunctionTarget = functionTargetTokens[0] as Target;
    } else {
      action.amountFunctionTarget = functionTargetTokens[1] as Target;
      if (functionTargetTokens.length > 2) {
        action.amountFunctionSpecification = functionTargetTokens.slice(2).join(":");
      }
    }
  }

  return action;
}

function parseDeck(action: Partial<AbilityAction>, data: string): Partial<AbilityAction> {
  const tokens: string[] = data.split(':');
  action.source = tokens[1] as Target;

  let destinationIndex = tokens.indexOf("destination");
  action.target = tokens[destinationIndex + 1] as Target;
  if (tokens[destinationIndex+2] === "bottom" || tokens[destinationIndex+2] === "top") {
    action.specification = tokens[destinationIndex+2];
  }

  let choiceIndex = tokens.indexOf("choice");
  if (choiceIndex != -1) {
    action.choice = tokens[choiceIndex + 1] as Choice;
  }

  action = parseAmount(action, tokens.pop() || "");
  
  return action;
}

function parseFilter(action: Partial<AbilityAction>, tokens: string[]): Partial<AbilityAction> {
  // TODO add evolves from and choice filter
  action.filter = {};
  const catIndex = tokens.indexOf("cat");
  if (catIndex !== -1) {
    action.filter.category = tokens[catIndex + 1] as CardCategory;
  }
  if (Object.values(CardType).includes(tokens[1])) {
    action.filter.type = tokens[1] as CardType;
  }

  return action;
}

function parseConditionX(action: Partial<AbilityAction>, data: string): Partial<AbilityAction> {
  const tokens: string[] = data.split(":");
  action.conditional = {};
  action.conditional.condition = tokens[0] as Condition;
  switch (action.conditional.condition) {
    case Condition.ABILITY:
      action.conditional.conditionAbility = parseAbility(data.substr(data.indexOf(tokens[1]), data.indexOf(":(") - data.indexOf(tokens[2])))[0];
      action.conditional.true = parseAbility(data.substr(data.indexOf("(") + 1, data.length - data.indexOf("(")));
      break;
    case Condition.FLIP:
      if (data.indexOf("else") === -1) {
        action.conditional.true = parseAbility(data.substr(data.indexOf(tokens[1]), data.length - data.indexOf(tokens[1])));
      } else {
        action.conditional.true = parseAbility(data.substr(data.indexOf("(") + 1, data.indexOf(")")).replace("|", ","));
        action.conditional.false = parseAbility(data.substr(data.indexOf("|") + 1, data.indexOf(")") - data.indexOf("|")));
      }
      break;
    case Condition.HEAL:
      action.conditional.healTarget = tokens[2] as Target;
      if (data.indexOf("|") === -1) {
        action.conditional.true = parseAbility(data.substr(data.indexOf(tokens[1]), data.length - data.indexOf(tokens[1])));
      } else {
        action.conditional.true = parseAbility(data.substr(data.indexOf("(") + 1, data.indexOf("|") - data.indexOf("(")));
        action.conditional.false = parseAbility(data.substr(data.indexOf("|") + 1, data.indexOf(")") - data.indexOf("|")));
      }
      break;
    case Condition.CHOICE:
      if (data.indexOf("|") === -1) {
        action.conditional.true = parseAbility(data.substr(data.indexOf(tokens[1]), data.length - data.indexOf(tokens[1])));
      } else {
        action.conditional.true = parseAbility(data.substr(data.indexOf("(") + 1, data.indexOf("|") - data.indexOf("(")));
        action.conditional.false = parseAbility(data.substr(data.indexOf("|") + 1, data.indexOf(")") - data.indexOf("|")));
      }
  }

  return action;
}

function parseCondition(action: Partial<AbilityAction>, data: string): Partial<AbilityAction> {
  action.conditional = {};
  action.conditional.condition = data.split(":")[0] as Condition;
  let trueString: string;
  if (action.conditional.condition === Condition.ABILITY) {
    console.log("yolo", data.substr(data.indexOf(action.conditional.condition) + action.conditional.condition.length + 1, data.indexOf(":(") - (action.conditional.condition.length + 1)));
    action.conditional.conditionAbility = parseAbility(data.substr(data.indexOf(action.conditional.condition) + action.conditional.condition.length + 1, data.indexOf(":(") - (action.conditional.condition.length + 1)))[0];
    action.conditional.true = parseAbility(data.substr(data.indexOf("(") + 1, data.lastIndexOf(")") - data.indexOf("(") + 1).replace("|", ","));
  } else if (action.conditional.condition === Condition.HEAL) {
    const tokens = data.split(":");
    const elseIndex = tokens.indexOf("else");
    action.conditional.true = parseAbility(tokens.slice(3,  elseIndex !== -1 ? elseIndex : undefined).join(":"));
  } else if (data.indexOf("(") !== -1) {
    console.log("HELLO", data.substr(data.indexOf("(") + 1, data.lastIndexOf(")", data.indexOf("else") !== -1 ? data.indexOf("else") : data.length)).replace("|", ",").replace(")", ""));
    action.conditional.true = parseAbility(data.substr(data.indexOf("(") + 1, data.lastIndexOf(")", data.indexOf("else") !== -1 ? data.indexOf("else") : data.length)).replace("|", ",").replace(")", ""));
  } else {
    console.log(action.conditional.condition);
    const tokens = data.split(":");
    const elseIndex = tokens.indexOf("else");
    action.conditional.true = parseAbility(tokens.slice(1,  elseIndex !== -1 ? elseIndex : undefined).join(":"));
  }
  if (data.indexOf("else") !== -1) {
    // single else index
    action.conditional.false = parseAbility(data.substr(data.indexOf("else:") + "else:".length).replace("(", "").replace(")", "").replace("|", ","));
  } 

  return action;
}

export function parseDeckFile(fileString: string, name:string, id?: string) {
  let deckcardsString = fileString.split("\n");
  let deckcards: number[] = [];
  deckcardsString.forEach((cardString)=>{
    deckcards.push(parseInt(cardString));
  });
  if(id){
    Decks.remove({"userid":id});
    Decks.insert({"userid":id,"name":name, "deckcards":deckcards})
  }
  else{
    // Decks.remove({"userid":Meteor.userId()});  
    // GameStates.update({userid:Meteor.userId()},new GameState(Meteor.userId()),{upsert:true});
    Decks.insert({"userid":Meteor.userId(),"name":name,"deckcards":deckcards});
  }
}

//replace certain ',' with '|' only good for 2 action cond sub abilities
function preparseAbilities(data: string): string {
  console.log("Raw: ", data);
  const chunks = data.split(",");
  return chunks.reduce((final: string, chunk:string) => {
    if (!chunk.includes("(") && chunk.includes(")")) {
      return `${final}${final ? "|" : ""}${chunk}`;
    }
    return `${final}${final ? "," : ""}${chunk}`;
  }, "");
}