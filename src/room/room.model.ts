export interface RoomModel {
  slug: string;
  users: UserWithShip[];
  currentPlayers: number;
  host: SimpleUser;
  status: GameStatus;
  currentRound: number;
}

export interface SimpleUser {
  userId: string;
  username: string;
  socketId: string;
  isHost: boolean;
}

export interface User extends SimpleUser {
  hasToPlay: boolean;
}

export interface UserWithShip extends SimpleUser, User {
  playerBoats: string[][];
  battlePlace: string[][];
  shipsIndexes: { [key: string]: { x: number, y: number }[] };
}

export interface Shoot {
  x: number;
  y: number;
}

export enum GameStatus {
  UNSTARTED = "UNSTARTED",
  PLACE_SHIPS = "PLACE_SHIPS",
  PLAY = "PLAY",
  ENDED = "ENDED",
}

