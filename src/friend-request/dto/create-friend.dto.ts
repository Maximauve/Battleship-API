import { IsNotEmpty, IsString } from "class-validator";

export class CreateFriendDTO {
  @IsNotEmpty()
  @IsString()
  sender: string;

  @IsNotEmpty()
  @IsString()
  receiver: string;
}