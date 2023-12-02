import { type CardType } from "./CardType";

export interface Card {
  id: string;
  type: CardType;
  value?: number;
  imgPath: string;
}
