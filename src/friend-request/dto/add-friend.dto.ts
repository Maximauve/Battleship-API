import { IsNotEmpty, IsString } from "class-validator";

export class AddFriendDto {
  @IsNotEmpty()
  @IsString()
  userId: string;
}