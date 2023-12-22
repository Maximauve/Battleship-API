import { Injectable } from "@nestjs/common";
import {
  GameStatus,
  RoomModel, Shoot,
  User, UserWithShip,
} from "../../room/room.model";
import { RedisService } from "../../redis/service/redis.service";
import { RoomService } from "../../room/service/room.service";

@Injectable()
export class GameService {
  constructor(
    private redisService: RedisService,
    private roomService: RoomService,
  ) {}

  async startGame(slug: string, user: User): Promise<void> {
    const room: RoomModel = await this.roomService.getRoom(slug);
    if (room.host.userId != user.userId) throw new Error("Vous n'êtes pas le créateur de la room");
    if (room.currentPlayers < 2) throw new Error("Il n'y a pas assez de joueurs");
    if (room.status != GameStatus.UNSTARTED) throw new Error("La partie à déjà commencé");
    room.status = GameStatus.PLACE_SHIPS;
    room.users.forEach((user: UserWithShip) => {
      user.hasToPlay = true;
      user.battlePlace = Array(10).fill(null).map(() => Array(10).fill('E'));
      user.playerBoats = Array(10).fill(null).map(() => Array(10).fill('E'));
    });
    await this.redisService.hset(`room:${slug}`, ['status', room.status, 'users', JSON.stringify(room.users)]);
  }

  async placeShips(slug: string, user: User, shipsIndexes: { [key: string]: { x: number, y: number }[] }): Promise<UserWithShip[]> {
    const room: RoomModel = await this.roomService.getRoom(slug);
    if (room.status != GameStatus.PLACE_SHIPS) throw new Error("La partie n'est pas en cours");
    if (!await this.checkPlaceShips(shipsIndexes)) throw new Error("Vous n'avez pas placé tous vos bateaux");
    room.users.find((element: UserWithShip) => element.userId == user.userId).playerBoats = this.convertIndexesToPlayerBoats(shipsIndexes);
    room.users.find((element: UserWithShip) => element.userId == user.userId).battlePlace = Array(10).fill(null).map(() => Array(10).fill('E'));
    room.users.find((element: UserWithShip) => element.userId == user.userId).hasToPlay = false;
    room.users.find((element: UserWithShip) => element.userId == user.userId).shipsIndexes = shipsIndexes;
    await this.redisService.hset(`room:${slug}`, ['users', JSON.stringify(room.users)]);
	return room.users;
  }

  async checkPlaceShips(shipsIndexes: { [key: string]: { x: number, y: number }[] }): Promise<boolean> {
    if (Object.keys(shipsIndexes).length != 5) return false;
    return shipsIndexes['5'].length == 2 &&
      shipsIndexes['4'].length == 3 &&
      shipsIndexes['3'].length == 3 &&
      shipsIndexes['2'].length == 4 &&
      shipsIndexes['1'].length == 5;
  }

  async startBattle(slug: string): Promise<void> {
    const room: RoomModel = await this.roomService.getRoom(slug);
    if (room.status != GameStatus.PLACE_SHIPS) throw new Error("La partie n'est pas en cours");
    room.status = GameStatus.PLAY;
    await this.redisService.hset(`room:${slug}`, ['status', room.status]);
  }

  async shoot(slug: string, simpleUser: UserWithShip, shoot: Shoot): Promise<[UserWithShip[], string]> {
    let state = "";
    const room: RoomModel = await this.roomService.getRoom(slug);
    if (room.status != GameStatus.PLAY) throw new Error("La partie n'est pas en cours");
    const user: UserWithShip = room.users.find((element: UserWithShip) => element.userId == simpleUser.userId);
    const userToShoot: UserWithShip = room.users.find((element: UserWithShip) => element.userId != user.userId);
    if (!user.hasToPlay) throw new Error("Ce n'est pas à votre tour de jouer");
    if (user.battlePlace[shoot.y][shoot.x] != 'E') throw new Error("Vous avez déjà tiré ici");
    if (userToShoot.playerBoats[shoot.y][shoot.x] != 'E') {
      const shipNumber: string = userToShoot.playerBoats[shoot.y][shoot.x];
      user.battlePlace[shoot.y][shoot.x] = 'H';
      userToShoot.playerBoats[shoot.y][shoot.x] = 'H';
      this.replaceShipDestroy(userToShoot, user, shipNumber)
      state = user.battlePlace[shoot.y][shoot.x];
    } else {
      user.battlePlace[shoot.y][shoot.x] = 'M';
      userToShoot.playerBoats[shoot.y][shoot.x] = 'M';
      user.hasToPlay = false;
      userToShoot.hasToPlay = true;
      state = "M";
    }
    await this.redisService.hset(`room:${slug}`, ['users', JSON.stringify(room.users)]);
	return [room.users, state];
  }

  replaceShipDestroy(userToShoot: UserWithShip, user: UserWithShip, shipNumber: string) {
    const ships = userToShoot.shipsIndexes[shipNumber];
    const shipDestroyed = ships.every((position) => user.battlePlace[position.y][position.x] == 'H');
    if (shipDestroyed) {
      user.battlePlace = user.battlePlace.map((line, y) => line.map((cell, x) => {
        if (ships.some((position) => position.x == x && position.y == y)) {
          return 'D';
        }
        return cell;
      }));
      userToShoot.playerBoats = userToShoot.playerBoats.map((line, y) => line.map((cell, x) => {
        if (ships.some((position) => position.x == x && position.y == y)) {
          return 'D';
        }
        return cell;
      }));
    }
  }

  async checkEndGame(slug: string): Promise<boolean> {
    const room: RoomModel = await this.roomService.getRoom(slug);
    if (room.status != GameStatus.PLAY) throw new Error("La partie n'est pas en cours");
    return room.users.some((user: UserWithShip) => this.checkWin(room, user));
  }

  async endGame(slug: string): Promise<UserWithShip> {
    const room: RoomModel = await this.roomService.getRoom(slug);
    if (room.status != GameStatus.PLAY) throw new Error("La partie n'est pas en cours");
    room.status = GameStatus.ENDED;
    const user: UserWithShip = room.users.find((user: UserWithShip) => this.checkWin(room, user))
    await this.redisService.hset(`room:${slug}`, ['status', room.status]);
    return user;
  }

  async checkAllPlacedShips(slug: string): Promise<boolean> {
    const room: RoomModel = await this.roomService.getRoom(slug);
    if (room.status != GameStatus.PLACE_SHIPS) throw new Error("La partie n'est pas en cours");
    return room.users.every((user: UserWithShip) => !user.hasToPlay);
  }

  convertIndexesToPlayerBoats(shipsIndexes: { [key: string]: { x: number, y: number }[] }): string[][] {
    const playerBoats: string[][] = Array(10).fill(null).map(() => Array(10).fill('E'));
    for (const shipNumber in shipsIndexes) {
        for (const position of shipsIndexes[shipNumber]) {
            playerBoats[position.y][position.x] = shipNumber;
        }
    }
    return playerBoats;
  }

  async chooseWhoStart(slug: string): Promise<void> {
    const room: RoomModel = await this.roomService.getRoom(slug);
    if (room.status != GameStatus.PLACE_SHIPS) throw new Error("La partie n'est pas en cours");
    const userToStart: UserWithShip = room.users[Math.floor(Math.random() * room.users.length)];
    userToStart.hasToPlay = true;
    await this.redisService.hset(`room:${slug}`, ['users', JSON.stringify(room.users)]);
  }

  checkWin(room: RoomModel, user: UserWithShip): boolean {
    const userOpponent: UserWithShip = room.users.find((element: UserWithShip) => element.userId != user.userId);
    for (const shipNumber in userOpponent.shipsIndexes) {
      for (const position of userOpponent.shipsIndexes[shipNumber]) {
        if (user.battlePlace[position.y][position.x] != 'D') {
          return false;
        }
      }
    }
    return true;
  }

  async getGameStatus(slug: string): Promise<GameStatus> {
    const room: RoomModel = await this.roomService.getRoom(slug);
    return room.status;
  }

  async getOpponentBoats(slug: string, user: UserWithShip): Promise<string[][]> {
    const opponent: UserWithShip = await this.getOpponent(slug, user);
    return opponent.playerBoats;
  }

  async getOpponent(slug: string, user: UserWithShip): Promise<UserWithShip> {
    const room: RoomModel = await this.roomService.getRoom(slug);
    return room.users.find((element: UserWithShip) => element.userId != user.userId);
  }

  // TODO: add stats in future with HUB
  async addStats(slug: string, user: UserWithShip): Promise<[string, UserWithShip]> {
    return [slug, user];
  }
}
