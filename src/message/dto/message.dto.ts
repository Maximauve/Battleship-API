import {IsNotEmpty} from "class-validator";
export class CreatedMessageDto {
  @IsNotEmpty()
  message: string;
}
