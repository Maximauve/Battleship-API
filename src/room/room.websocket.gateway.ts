import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Socket } from "socket.io";
import { RedisService } from "../redis/service/redis.service";
import { RoomService } from "./service/room.service";
import { Message } from "./dto/room.dto";
import { jwtDecode } from "jwt-decode";
import { GameService } from "../game/service/game.service";
import {GameStatus, Shoot, UserWithShip} from "./room.model";

@WebSocketGateway({ cors: "*", namespace: "room" })
export class RoomWebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly redisService: RedisService,
    private readonly roomService: RoomService,
    private readonly gameService: GameService,
  ) {}

  @WebSocketServer() server;

  handleConnection(socket: Socket): void {
    const socketId = socket.id;
    const tokenData: { username: string; id: string } = jwtDecode(
      socket.handshake.query.token as string,
    ); // todo: jwt decode
    socket.data.user = {
      socketId: socketId,
      username: tokenData.username,
      userId: tokenData.id,
      hasToPlay: false,
      playerBoats: [],
      battlePlace: [],
      shipsIndexes: {}
    };
    socket.data.slug = socket.handshake.query.slug as string;
    console.log(`New connecting... socket id:`, socketId);
  }

  handleDisconnect(socket: Socket): void {
    // gerer le cas si disconnect pendant une partie
    console.log(`Disconnecting... socket id:`, socket.id);
  }

  @SubscribeMessage("leaveRoom")
  async leaveRoom(@ConnectedSocket() client: Socket) {
    this.server.to(client.data.slug).emit('members', await this.roomService.usersInRoom(client.data.slug));
  }

  @SubscribeMessage("joinRoom")
  async joinRoom(@ConnectedSocket() client: Socket): Promise<unknown> {
    return this.handleAction(client.data.slug, async () => {
      await this.roomService.addUserToRoom(client.data.slug, client.data.user);
      client.join(client.data.slug);
      const users: UserWithShip[] = await this.roomService.getUsers(client.data.slug);
      for (const user of users) {
          await this.server.to(user.socketId).emit("playerBoats", user.playerBoats);
          await this.server.to(user.socketId).emit("battlePlace", user.battlePlace);
          if (await this.gameService.getGameStatus(client.data.slug) !== GameStatus.PLACE_SHIPS) {
            await this.server.to(user.socketId).emit("shipsIndexes", user.shipsIndexes);
          }
      }
      if (await this.gameService.getGameStatus(client.data.slug) === GameStatus.ENDED) {
        await this.server.to(client.data.slug).emit("winner", await this.gameService.getWinner(client.data.slug));
        for (const user of users) {
            await this.server.to(user.socketId).emit("playerBoats", user.playerBoats);
            await this.server.to(user.socketId).emit("shipsIndexes", user.shipsIndexes);
            await this.server.to(user.socketId).emit("opponentBoats", await this.gameService.getOpponentBoats(client.data.slug, user));
            await this.server.to(user.socketId).emit("opponentShipsIndexes", await this.gameService.getOpponentShipsIndexes(client.data.slug, user));
        }
      }
      await this.server.to(client.data.slug).emit("members", await this.roomService.usersInRoom(client.data.slug));
      return { gameStatus: await this.gameService.getGameStatus(client.data.slug) };
    });
  }

  @SubscribeMessage("chat")
  chat(@ConnectedSocket() client: Socket, @MessageBody() message: Message): { message: string } {
    this.server.to(client.data.slug).emit("chat", message, client.data.user); // broadcast messages
    return { message: "Message bien envoyé" };
  }

  @SubscribeMessage("startGame")
  async startGame(@ConnectedSocket() client: Socket): Promise<unknown> {
    return this.handleAction(client.data.slug, async () => {
      await this.gameService.startGame(client.data.slug, client.data.user);
      await this.server.to(client.data.slug).emit("members", await this.roomService.usersInRoom(client.data.slug));
      await this.server.to(client.data.slug).emit("gameStatus", await this.roomService.getGameStatus(client.data.slug));
    });
  }

  @SubscribeMessage("placeShips")
  async placeShips(@ConnectedSocket() client: Socket, @MessageBody() shipsIndexes: { [key: string]: { x: number, y: number }[] }): Promise<unknown> {
    return this.handleAction(client.data.slug, async () => {
      const users = await this.gameService.placeShips(client.data.slug, client.data.user, shipsIndexes);
      if (await this.gameService.checkAllPlacedShips(client.data.slug)) {
        await this.gameService.chooseWhoStart(client.data.slug);
        for (const user of users) {
            await this.server.to(user.socketId).emit("playerBoats", user.playerBoats);
            await this.server.to(user.socketId).emit("battlePlace", user.battlePlace);
        }
        await this.server.to(client.data.slug).emit("members", await this.roomService.usersInRoom(client.data.slug));
        await this.gameService.startBattle(client.data.slug);
        await this.server.to(client.data.slug).emit("gameStatus", await this.roomService.getGameStatus(client.data.slug));
      }
    });
  }

  @SubscribeMessage('replay')
  async replay(@ConnectedSocket() client: Socket): Promise<unknown> {
    return this.handleAction(client.data.slug, async () => {
      const users = await this.gameService.replay(client.data.slug);
      await this.server.to(client.data.slug).emit("members", await this.roomService.usersInRoom(client.data.slug));
      await this.server.to(client.data.slug).emit("gameStatus", await this.roomService.getGameStatus(client.data.slug));
      for (const user of users) {
        await this.server.to(user.socketId).emit("playerBoats", user.playerBoats);
        await this.server.to(user.socketId).emit("battlePlace", user.battlePlace);
        if (await this.gameService.getGameStatus(client.data.slug) !== GameStatus.PLACE_SHIPS) {
          await this.server.to(user.socketId).emit("shipsIndexes", user.shipsIndexes);
        }
      }
      return { gameStatus: await this.gameService.getGameStatus(client.data.slug) };
    });
  }

  @SubscribeMessage('shoot')
  async shoot(@ConnectedSocket() client: Socket, @MessageBody() shoot: Shoot): Promise<unknown> {
    return this.handleAction(client.data.slug, async () => {
      const [users, state] = await this.gameService.shoot(client.data.slug, client.data.user, shoot);
      for (const user of users) {
          await this.server.to(user.socketId).emit("battlePlace", user.battlePlace);
          await this.server.to(user.socketId).emit("playerBoats", user.playerBoats);
      }
      await this.server.to(client.data.slug).emit("members", await this.roomService.usersInRoom(client.data.slug));
      if (await this.gameService.checkEndGame(client.data.slug)) {
        const user: UserWithShip = await this.gameService.endGame(client.data.slug);
        await this.gameService.addStats(client.data.slug, client.data.user);
        await this.server.to(client.data.slug).emit("gameStatus", await this.roomService.getGameStatus(client.data.slug));
        await this.server.to(client.data.slug).emit("winner", user);
        for (const user of users) {
            await this.server.to(user.socketId).emit("playerBoats", user.playerBoats);
            await this.server.to(user.socketId).emit("shipsIndexes", user.shipsIndexes);
            await this.server.to(user.socketId).emit("opponentBoats", await this.gameService.getOpponentBoats(client.data.slug, user));
            await this.server.to(user.socketId).emit("opponentShipsIndexes", await this.gameService.getOpponentShipsIndexes(client.data.slug, user));
        }
      }
      return state;
    });
  }

  async handleAction(slug: string, callback: Function): Promise<unknown> {
    try {
      if (await this.redisService.exists(`room:${slug}`)) {
        return await callback();
      } else {
        throw new Error("La room n'existe pas");
      }
    } catch (e) {
      return {
        error: e.message,
      };
    }
  }
}
