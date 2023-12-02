import { IsInt, IsNotEmpty, IsOptional, Max, Min } from "class-validator";
import { User } from "../room.model";

export class CreatedRoomDto {
  @IsNotEmpty({ message: "L'hôte ne peut pas être vide" })
  host: User;
}

export class RoomDto {
  slug: string;
}

export class Message {
  timeSent: string;
  text: string;
}
