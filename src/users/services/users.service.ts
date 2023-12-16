import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../users.entity";
import { CreatedUserDto } from "../dto/users.dto";
import { HttpException } from "@nestjs/common/exceptions";
import { UpdatedUsersDto } from "../dto/usersUpdate.dto";
import { FriendRequest } from "src/friend-request/friend-request.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }

  async GetAll(): Promise<User[]> {
    return await this.usersRepository.find();
  }

  async FindOneId(id: string): Promise<User> {
    return await this.usersRepository
      .createQueryBuilder("user")
      .where("user.id = :id", { id: id })
      .getOne();
  }

  async FindOneUsername(username: string): Promise<User> {
    return await this.usersRepository
      .createQueryBuilder("user")
      .where("user.username= :username", { username: username })
      .getOne();
  }

  async FindOneEmail(email: string): Promise<User> {
    return await this.usersRepository
      .createQueryBuilder("user")
      .where("user.email= :email", { email: email })
      .getOne();
  }

  // check if user already exists
  async checkUnknownUser(
    user: CreatedUserDto | UpdatedUsersDto,
  ): Promise<boolean> {
    const unknownUser = await this.usersRepository
      .createQueryBuilder("user")
      .where("user.username= :username", { username: user.username })
      .orWhere("user.email= :email", { email: user.email })
      .getOne();
    if (unknownUser == null) return false;
    return true;
  }
  async Create(user: CreatedUserDto): Promise<User> {
    const newUser = this.usersRepository.create(user);
    return this.usersRepository.save(newUser);
  }

  async Delete(userId: string) {
    const query = await this.usersRepository
      .createQueryBuilder()
      .delete()
      .from(User)
      .where("id= :id", { id: userId })
      .execute();
    if (query.affected == 0)
      throw new HttpException("L'utilisateur n'existe pas", 404);
    return {};
  }

  async Update(userId: string, user: UpdatedUsersDto) {
    const query = await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set(user)
      .where("id= :id", { id: userId })
      .execute();
    if (query.affected == 0)
      throw new HttpException("L'utilisateur n'existe pas", 404);
    return {};
  }

  async GetFriends(userId: string): Promise<User[]> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: {
        friends: true
      }
    });
    if (!user) throw new HttpException("L'utilisateur n'existe pas", 404);
    console.log(user);
    return user.friends;
  }

  async CheckIfAlreadyFriend(sender: User, receiver: User) {
    const friendRequest = await this.usersRepository.findOne({
      where: [
        { friends: { id: sender.id } },
        { friends: { id: receiver.id } }
      ],
      relations: {
        friends: true
      }
    })
    if (friendRequest == null) {
      return false;
    }
    return true;
  }


  async AddFriend(fr: FriendRequest) {
    const query = await this.usersRepository.update(fr.receiver)
  }
}