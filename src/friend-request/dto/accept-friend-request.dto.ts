import { IsNotEmpty, IsString } from "class-validator";

export class AcceptFriendRequestDto {
  @IsNotEmpty()
  @IsString()
  frId: string;
}