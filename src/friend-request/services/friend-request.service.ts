import { Injectable } from "@nestjs/common";
import { FriendRequest } from "../friend-request.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/users/users.entity";
import { UsersService } from "src/users/services/users.service";
import { CreateFriendDTO } from "../dto/create-friend.dto";

@Injectable()
export class FriendRequestService {
  constructor(
    @InjectRepository(FriendRequest)
    private friendRequestRepository: Repository<FriendRequest>,
    private userService: UsersService,
  ) { }

  async GetOneFriendRequest(id: string): Promise<FriendRequest> {
    return await this.friendRequestRepository
      .createQueryBuilder("friendRequest")
      .where("friendRequest.id = :id", { id: id })
      .leftJoinAndSelect("friendRequest.receiver", "receiver")
      .leftJoinAndSelect("friendRequest.sender", "sender")
      .getOne();
  }

  async AddFriendRequest(sender: User, receiver: User) {
    const newFriendRequest = this.friendRequestRepository.create({
      sender,
      receiver,
    });
    return this.friendRequestRepository.save(newFriendRequest);
  }

  async GetFriendRequests(user: User) {
    return this.friendRequestRepository
      .createQueryBuilder("friendRequest")
      .where("friendRequest.receiver = :user", { user: user.id })
      .leftJoinAndSelect("friendRequest.receiver", "receiver")
      .leftJoinAndSelect("friendRequest.sender", "sender")
      .getMany();
  }

  async GetPendingRequests(user: User) {
    return await this.friendRequestRepository
      .createQueryBuilder("friendRequest")
      .where("friendRequest.sender = :user", { user: user.id })
      .leftJoinAndSelect("friendRequest.receiver", "receiver")
      .leftJoinAndSelect("friendRequest.sender", "sender")
      .getMany();
  }

  async CheckIfReverseRequestIsPending(sender: User, receiver: User) {
    const friendRequest = await this.friendRequestRepository
      .createQueryBuilder("friendRequest")
      .leftJoinAndSelect("friendRequest.receiver", "receiver")
      .leftJoinAndSelect("friendRequest.sender", "sender")
      .where("friendRequest.sender = :sender", { sender: receiver.id })
      .andWhere("friendRequest.receiver = :receiver", { receiver: sender.id })
      .getOne();
    if (friendRequest == null) {
      return false;
    }
    return friendRequest;
  }

  async AcceptFriendRequest(fr: FriendRequest) {
    const sender = await this.userService.FindOneId(fr.sender.id);
    const receiver = await this.userService.FindOneId(fr.receiver.id);
    const friends: CreateFriendDTO = {
      sender: sender.id,
      receiver: receiver.id,
    };
    this.userService.AddFriend(friends);

    return this.friendRequestRepository
      .createQueryBuilder()
      .delete()
      .from(FriendRequest)
      .where("id = :id", { id: fr.id })
      .execute();
  }
}