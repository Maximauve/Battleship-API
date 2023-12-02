import { type Card } from "./Card";
import { type CardType } from "./CardType";

// Types of cards
const EscapeType: CardType = {
  slug: "escape",
  name: "Fuite",
  superior_to: [],
};

const GreenType: CardType = {
  slug: "green",
  name: "Vert",
  superior_to: ["escape"],
};

const YellowType: CardType = {
  slug: "yellow",
  name: "Jaune",
  superior_to: ["escape"],
};

const PurpleType: CardType = {
  slug: "purple",
  name: "Violet",
  superior_to: ["escape"],
};

const BlackType: CardType = {
  slug: "black",
  name: "Atout",
  superior_to: ["escape", "green", "yellow", "purple"],
};

const MermaidType: CardType = {
  slug: "mermaid",
  name: "Sirène",
  superior_to: ["escape", "green", "yellow", "purple", "black", "skull-king"],
};

const PirateType: CardType = {
  slug: "pirate",
  name: "Pirate",
  superior_to: ["escape", "green", "yellow", "purple", "black", "mermaid"],
};

const SkullKingType: CardType = {
  slug: "skull-king",
  name: "Skull King",
  superior_to: ["escape", "green", "yellow", "purple", "black", "pirate"],
};

const GreenCards: Card[] = [];
const YellowCards: Card[] = [];
const PurpleCards: Card[] = [];
const BlackCards: Card[] = [];

interface LoopUtility {
  color: string;
  type: CardType;
  deck: Card[];
}

const loopUtilities: LoopUtility[] = [
  { color: "green", type: GreenType, deck: GreenCards },
  { color: "yellow", type: YellowType, deck: YellowCards },
  { color: "purple", type: PurpleType, deck: PurpleCards },
  { color: "black", type: BlackType, deck: BlackCards },
];

loopUtilities.forEach((utility) => {
  for (let i = 1; i <= 14; i++) {
    utility.deck.push({
      id: `${utility.color}-${i}`,
      type: utility.type,
      value: i,
      imgPath: `/images/cards/${utility.color}/${i}.png`,
    });
  }
});

const EscapeCards: Card[] = [];
for (let i = 1; i <= 5; i++) {
  EscapeCards.push({
    id: `escape-${i}`,
    type: EscapeType,
    imgPath: "/images/cards/escape.png",
  });
}

const MermaidCards: Card[] = [];
for (let i = 1; i <= 2; i++) {
  MermaidCards.push({
    id: `mermaid-${i}`,
    type: MermaidType,
    imgPath: "/images/cards/mermaid.png",
  });
}

const PirateCards: Card[] = [];
for (let i = 1; i <= 5; i++) {
  PirateCards.push({
    id: `pirate-${i}`,
    type: PirateType,
    imgPath: `/images/cards/pirate/${i}.png`,
  });
}

const SkullKing: Card = {
  id: "skull-king",
  type: SkullKingType,
  imgPath: "/images/cards/skullKing.png",
};

const cards: Card[] = [];
cards.push(...EscapeCards);
cards.push(...GreenCards);
cards.push(...YellowCards);
cards.push(...PurpleCards);
cards.push(...BlackCards);
cards.push(...MermaidCards);
cards.push(...PirateCards);
cards.push(SkullKing);

export default cards;

// cards.forEach((card) => {
//   console.log(`o------------------------------------------------------------------o`);
//   console.log(`|                                                                  |`);
//   console.log(`| ${card.type.name + " " + (card.value ?? "") + " " + card.imgPath + " ".repeat(63 - (card.type.name.length + card.imgPath.length + (card.value !== undefined ? card.value.toString.length : 0)))}|`);
//   console.log(`|                                                            |`);
//   if (card.type.superior_to.length !== 0) {
//     console.log(`|                    ==== Is superior to : ====                    |`);
//     console.log(`|                                                                  |`);
//     card.type.superior_to.forEach((superiorCardType) => {
//       console.log(`| -> ${superiorCardType.name + ' '.repeat(62 - superiorCardType.name.length)}|`);
//       console.log(`|                                                                  |`);
//     });
//   }
//   console.log(`o------------------------------------------------------------------o`);
//   console.log(util.inspect(card, false, null, true /* enable colors */));
// });

// console.table(cards);
