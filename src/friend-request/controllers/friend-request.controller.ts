import {
  Controller,
  Req,
  UseGuards,
  Get,
  Post,
  Body,
} from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { UsersService } from "src/users/services/users.service";
import { AddFriendDto } from "../dto/add-friend.dto";
import { FriendRequestService } from "../services/friend-request.service";
import { AcceptFriendRequestDto } from "../dto/accept-friend-request.dto";

@Controller("friends")
export class FriendRequestController {
  constructor(
    private usersService: UsersService,
    private friendRequestService: FriendRequestService,
  ) { }

  @UseGuards(JwtAuthGuard)
  @Get("/me")
  GetMyFriends(@Req() req) {
    return this.usersService.GetFriends(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("/add")
  async AddFriend(@Req() req, @Body() body: AddFriendDto) {
    const sender = await this.usersService.FindOneId(req.user.id);
    const receiver = await this.usersService.FindOneId(body.userId);
    const fr = await this.friendRequestService.CheckIfReverseRequestIsPending(sender, receiver);
    if (fr) {
      return this.friendRequestService.AcceptFriendRequest(fr);
    }
    return this.friendRequestService.AddFriendRequest(sender, receiver);
  }

  @UseGuards(JwtAuthGuard)
  @Get("/requests")
  async GetFriendRequests(@Req() req) {
    const user = await this.usersService.FindOneId(req.user.id);
    return this.friendRequestService.GetFriendRequests(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post("/accept")
  async AcceptFriendRequest(@Body() body: AcceptFriendRequestDto) {
    const fr = await this.friendRequestService.GetOneFriendRequest(body.frId);
    if (!fr) {
      throw new Error("Friend request not found");
    }
    return this.friendRequestService.AcceptFriendRequest(fr);
  }

  @UseGuards(JwtAuthGuard)
  @Get("/pending")
  async GetPendingRequests(@Req() req) {
    const user = await this.usersService.FindOneId(req.user.id);
    return this.friendRequestService.GetPendingRequests(user);
  }
}