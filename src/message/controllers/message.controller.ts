import {Body, Controller, Delete, Get, Param, Post, Put, Req} from "@nestjs/common";
import {MessageService} from "../services/message.service";
import {CreatedMessageDto} from "../dto/message.dto";
import {UsersService} from "../../users/services/users.service";
import {UseGuards, UsePipes} from "@nestjs/common/decorators";
import {ValidationPipe} from "@nestjs/common/pipes";
import {HttpException} from "@nestjs/common/exceptions";
import {JwtAuthGuard} from "../../auth/guards/jwt-auth.guard";
import {User} from "../../users/users.entity";

@UseGuards(JwtAuthGuard)
@Controller("messages")
export class MessagesController {
  constructor(
    private messageService: MessageService,
    private usersService: UsersService,
  ) {}

  @Get("/")
  async GetAllMyMessages(@Req() req) {
    const me: User = await this.usersService.FindOneId(req.user.id);
    if (!me) throw new HttpException("L'utilisateur n'a pas été trouvé", 404);
    return this.messageService.GetAllMyMessages(me);
  }

  @Get('/all')
  async AllMessage() {
    return this.messageService.GetAll();
  }

  @UsePipes(ValidationPipe)
  @Post('/:id')
  async SendMessage(@Req() req, @Param("id") id: string, @Body() body: CreatedMessageDto) {
    const receiver = await this.usersService.FindOneId(id);
    const sender = await this.usersService.FindOneId(req.user.id);
    if (!receiver || !sender) throw new HttpException("L'utilisateur n'a pas été trouvé", 404);
    return this.messageService.CreateMessage(body.message, sender, receiver);
  }

  @Get('/:id')
  async GetMessages(@Req() req, @Param("id") id: string) {
    const receiver = await this.usersService.FindOneId(id);
    const sender = await this.usersService.FindOneId(req.user.id);
    if (!receiver || !sender) throw new HttpException("L'utilisateur n'a pas été trouvé", 404);
    return this.messageService.GetMessages(sender, receiver);
  }

  @Delete('/:id')
  async DeleteMessage(@Req() req, @Param("id") id: string) {
    const message = await this.messageService.GetMessage(id);
    if (!message) throw new HttpException("Le message n'a pas été trouvé", 404);
    return this.messageService.DeleteMessage(message);
  }

  @UsePipes(ValidationPipe)
  @Put('/:id')
  async UpdateMessage(@Req() req, @Param("id") id: string, @Body() body: CreatedMessageDto) {
    const message = await this.messageService.GetMessage(id);
    if (!message) throw new HttpException("Le message n'a pas été trouvé", 404);
    return this.messageService.UpdateMessage(message, body.message);
  }
}