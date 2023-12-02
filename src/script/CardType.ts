export interface CardType {
  slug: string;
  name: string;
  superior_to: string[];
  circular_winner?: boolean;
}
