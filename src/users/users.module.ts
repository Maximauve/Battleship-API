import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { UsersController } from "./controllers/users.controller";
import { UsersService } from "./services/users.service";
import { User } from "./users.entity";
import { forwardRef } from "@nestjs/common/utils";
import { RedisModule } from "../redis/redis.module";
import { FriendRequestModule } from "src/friend-request/friend-request.module";
import {MessageModule} from "../message/message.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => FriendRequestModule),
    forwardRef(() => AuthModule),
    forwardRef(() => RedisModule),
    forwardRef(() => MessageModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule { }
