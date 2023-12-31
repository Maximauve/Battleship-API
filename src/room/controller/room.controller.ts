import { Body, Controller, Delete, Param, Post } from "@nestjs/common";
import { RoomService } from "../service/room.service";
import { UseGuards, UsePipes } from "@nestjs/common/decorators";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { ValidationPipe } from "@nestjs/common/pipes";
import { HttpException } from "@nestjs/common/exceptions";
import { SimpleUser } from "../room.model";

@Controller("room")
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @UseGuards(JwtAuthGuard)
  @UsePipes(ValidationPipe)
  @Post("")
  async createRoom(@Body() host: SimpleUser): Promise<unknown> {
    return await this.roomService.createRoom(host);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("/:slug/close")
  async closeRoom(@Param("slug") slug: string): Promise<unknown> {
    try {
      return await this.roomService.closeRoom(slug);
    } catch (e) {
      throw new HttpException(e.message, e.status);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete("/:slug/kick/:username")
  async kickUser(
    @Param("slug") slug: string,
    @Param("username") username: string,
  ): Promise<void> {
    try {
      return await this.roomService.kickUser(slug, username);
    } catch (e) {
      throw new HttpException(e.message, e.status);
    }
  }
}
