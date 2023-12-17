import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule, TypeOrmModuleAsyncOptions } from "@nestjs/typeorm";
import { User } from "./users/users.entity";
import { UsersModule } from "./users/users.module";
import { RedisModule } from "./redis/redis.module";
import { RoomModule } from "./room/room.module";
import { APP_FILTER } from "@nestjs/core";
import { RoomWebsocketGateway } from "./room/room.websocket.gateway";
import { AuthExceptionFilter } from "./auth/exception-filter/exception-filter";
import { GameModule } from "./game/game.module";
import { WordsGlossaryModule } from "./words-glossary/words-glossary.module";
import { WordGlossary } from "./words-glossary/words-glossary.entity";
import { FriendRequestModule } from "./friend-request/friend-request.module";
import { FriendRequest } from "./friend-request/friend-request.entity";
import { MessageModule } from './message/message.module';
import {Message} from "./message/message.entity";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get("POSTGRES_HOST"),
        port: +configService.get<number>("POSTGRES_PORT"),
        username: configService.get("POSTGRES_USER"),
        password: configService.get("POSTGRES_PASSWORD"),
        database: configService.get("POSTGRES_DATABASE"),
        entities: [FriendRequest, User, WordGlossary, Message],
        synchronize: true,
        extra: {
          ssl: configService.get("POSTGRES_SSL") === "true",
        },
      }),
      inject: [ConfigService],
    } as TypeOrmModuleAsyncOptions),
    FriendRequestModule,
    UsersModule,
    RedisModule,
    WordsGlossaryModule,
    RoomModule,
    GameModule,
    MessageModule,
  ],
  controllers: [],
  providers: [
    RoomWebsocketGateway,
    {
      provide: APP_FILTER,
      useClass: AuthExceptionFilter,
    },
  ],
})
export class AppModule { }
