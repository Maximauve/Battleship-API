import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {Message} from "./message.entity";
import {MessageService} from "./services/message.service";
import {MessagesController} from "./controllers/message.controller";
import {forwardRef} from "@nestjs/common/utils";
import {UsersModule} from "../users/users.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Message]),
    forwardRef(() => UsersModule),
  ],
  controllers: [MessagesController],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule { }
