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
    room.users.forEach((user: User) => {
      user.hasToPlay = true;
    });
    await this.redisService.hset(`room:${slug}`, ['status', room.status, 'users', JSON.stringify(room.users)]);
  }

  async placeShips(slug: string, user: User, playerBoats: string[][]): Promise<void> {
    const room: RoomModel = await this.roomService.getRoom(slug);
    if (room.status != GameStatus.PLACE_SHIPS) throw new Error("La partie n'est pas en cours");
    room.users.find((element: UserWithShip) => element.userId == user.userId).playerBoats = playerBoats;
    room.users.find((element: UserWithShip) => element.userId == user.userId).battlePlace = Array(10).fill(Array(10).fill(null));
    room.users.find((element: UserWithShip) => element.userId == user.userId).hasToPlay = false;
    const shipsIndexes = {};
    for (let y = 0; y < playerBoats.length; y++) {
      for (let x = 0; x < playerBoats[y].length; x++) {
        const shipNumber = playerBoats[y][x];
        if (shipNumber !== null) {
          if (!shipsIndexes[shipNumber]) {
            shipsIndexes[shipNumber] = [];
          }
          shipsIndexes[shipNumber].push({ x, y });
        }
      }
    }
    room.users.find((element: UserWithShip) => element.userId == user.userId).shipsIndexes = shipsIndexes;
    await this.redisService.hset(`room:${slug}`, ['users', JSON.stringify(room.users)]);
  }

  async checkPlaceShips(slug: string): Promise<boolean> {
    const room: RoomModel = await this.roomService.getRoom(slug);
    if (room.status != GameStatus.PLACE_SHIPS) throw new Error("La partie n'est pas en cours");
    return !room.users.some((user: UserWithShip) => user.playerBoats?.length == 0);
  }

  async startBattle(slug: string): Promise<void> {
    const room: RoomModel = await this.roomService.getRoom(slug);
    if (room.status != GameStatus.PLACE_SHIPS) throw new Error("La partie n'est pas en cours");
    room.status = GameStatus.PLAY;
    await this.redisService.hset(`room:${slug}`, ['status', room.status]);
  }

  async shoot(slug: string, user: UserWithShip, shoot: Shoot) {
    const room: RoomModel = await this.roomService.getRoom(slug);
    if (room.status != GameStatus.PLAY) throw new Error("La partie n'est pas en cours");
    const userToShoot: UserWithShip = room.users.find((element: UserWithShip) => element.userId != user.userId);
    if (user.battlePlace[shoot.y][shoot.x] != null) throw new Error("Vous avez déjà tiré ici");
    if (userToShoot.playerBoats[shoot.y][shoot.x] != null) {
      const shipNumber: string = userToShoot.playerBoats[shoot.y][shoot.x];
      user.battlePlace[shoot.y][shoot.x] = 'H';
      user = this.replaceShipDestroy(userToShoot, user, shipNumber)
    } else {
      user.battlePlace[shoot.y][shoot.x] = 'M';
      user.hasToPlay = false;
      userToShoot.hasToPlay = true;
    }
    await this.redisService.hset(`room:${slug}`, ['users', JSON.stringify(room.users)]);
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
    }
    return user;
  }

  async checkEndGame(slug: string): Promise<boolean> {
    const room: RoomModel = await this.roomService.getRoom(slug);
    if (room.status != GameStatus.PLAY) throw new Error("La partie n'est pas en cours");
    return room.users.some((user: UserWithShip) => user.battlePlace.every((line) => line.every((cell) => cell == 'D')));
  }

  async endGame(slug: string): Promise<UserWithShip> {
    const room: RoomModel = await this.roomService.getRoom(slug);
    if (room.status != GameStatus.PLAY) throw new Error("La partie n'est pas en cours");
    room.status = GameStatus.ENDED;
    const user = room.users.find((user: UserWithShip) => user.battlePlace.every((line) => line.every((cell) => cell == 'D')))
    await this.redisService.hset(`room:${slug}`, ['status', room.status]);
    return user;
  }

  // TODO: add stats in future with HUB
  async addStats(slug: string, user: UserWithShip): Promise<[string, UserWithShip]> {
    return [slug, user];
  }
}