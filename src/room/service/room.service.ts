import {Injectable} from "@nestjs/common";
import {RedisService} from "../../redis/service/redis.service";
import {GameStatus, RoomModel, SimpleUser, User, UserWithShip} from "../room.model";
import {HttpException} from "@nestjs/common/exceptions";
import {WordsGlossaryService} from "../../words-glossary/service/words-glossary.service";

@Injectable()
export class RoomService {
  constructor(
    private redisService: RedisService,
    private pirateGlossaryService: WordsGlossaryService,
  ) {}

  async createRoom(host: SimpleUser): Promise<RoomModel> {
    host.isHost = true;
    const newUser: UserWithShip = {
      ...host,
      hasToPlay: false,
      playerBoats: [],
      battlePlace: [],
      shipsIndexes: {},
    };
    const room: RoomModel = {
      slug: await this.pirateGlossaryService.GetThreeWord(),
      currentPlayers: 1,
      users: [newUser],
      host: host,
      status: GameStatus.UNSTARTED,
      currentRound: 0,
    };
    let roomKey = `room:${room.slug}`;
    // check if key exists in redis to not overwrite
    while ((await this.redisService.exists(roomKey)) == 1) {
      room.slug = await this.pirateGlossaryService.GetThreeWord();
      roomKey = `room:${room.slug}`;
    }
    await this.redisService.hset(roomKey, [
      "currentPlayers", room.currentPlayers.toString(),
      "users", JSON.stringify(room.users),
      "host", JSON.stringify(room.host),
      "slug", room.slug,
      "status", room.status,
      "currentRound", "0",
    ]);
    return room;
  }

  async closeRoom(slug: string): Promise<{ message: string }> {
    const roomKey: string = `room:${slug}`;
    if ((await this.redisService.exists(roomKey)) == 0) {
      throw new HttpException("La room n'existe pas", 404);
    }
    await this.redisService.del(roomKey);
    return {
      message: `La room ${slug} à été supprimé`,
    };
  }

  async addUserToRoom(slug: string, user: UserWithShip): Promise<void> {
    const room: RoomModel = await this.getRoom(slug);
    if (room) {
      if (room.status != GameStatus.UNSTARTED && !room.users.find((element: User) => user.userId == element.userId)) throw new Error("La partie à déjà commencé");
      if (room.currentPlayers >= 2 && !room.users.find((element: User) => user.userId === element.userId)) throw new Error("La room est pleine");
      if (room.host.userId == user.userId) {
        const host = room.users.find((element: UserWithShip) => element.userId == user.userId);
        if (!host) room.users.push(user);
        else host.socketId = user.socketId;
        await this.redisService.hset(`room:${slug}`, ["host", JSON.stringify(user), "users", JSON.stringify(room.users)]);
      } else if (room.users.find((element: User) => element.userId == user.userId)) {
        room.users.find((element: User) => element.userId == user.userId).socketId = user.socketId;
        await this.redisService.hset(`room:${slug}`, ["users", JSON.stringify(room.users),]);
      } else {
        await this.redisService.hset(`room:${slug}`, ["users", JSON.stringify([...room.users, user]), "currentPlayers", (room.currentPlayers + 1).toString()]);
      }
    } else {
      throw new Error(`La room ${slug} n'existe pas`);
    }
  }

  async removeUserFromRoom(socketId: string, slug: string): Promise<void> {
    const room: RoomModel = await this.getRoom(slug);
    room.users = room.users.filter((user: User) => user.socketId !== socketId);
    await this.redisService.hset(`room:${slug}`, ["users", JSON.stringify(room.users), "currentPlayers", (room.currentPlayers - 1).toString()]);
  }

  async getRoom(slug: string): Promise<RoomModel> {
    const roomKey: string = `room:${slug}`;
    if ((await this.redisService.exists(roomKey)) == 0) {
      throw new Error(`La room ${slug} n'existe pas`);
    }
    const roomData = await this.redisService.hgetall(roomKey);
    return {
      currentPlayers: parseInt(roomData.currentPlayers, 10),
      users: JSON.parse(roomData?.users || "[]"),
      host: JSON.parse(roomData.host),
      status: roomData.status,
      currentRound: parseInt(roomData.currentRound, 10),
    } as RoomModel;
  }

  async usersInRoom(slug: string): Promise<User[]> {
    const room: RoomModel = await this.getRoom(slug);
    return room.users.map((user: User) => {
      return {
        userId: user.userId,
        username: user.username,
        socketId: user.socketId,
        isHost: user.userId === room.host.userId,
        hasToPlay: user.hasToPlay,
      }
    }) as User[];
  }

  async kickUser(slug: string, username: string): Promise<void> {
    const room: RoomModel = await this.getRoom(slug);
    const user: User = room.users.find(
      (user: User) => user.username === username,
    );
    if (!user)
      throw new HttpException(
        `L'utilisateur ${username} n'existe pas dans la room`,
        404,
      );
    await this.removeUserFromRoom(user.socketId, slug);
  }

  async getGameStatus(slug: string): Promise<GameStatus> {
    const room: RoomModel = await this.getRoom(slug);
    return room.status;
  }
}
