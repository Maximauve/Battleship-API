import {Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {User} from "../../users/users.entity";
import {Repository} from "typeorm";
import {Message} from "../message.entity";

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
  ) {
  }

  async GetAll(): Promise<Message[]> {
    return await this.messagesRepository
      .createQueryBuilder("message")
      .leftJoinAndSelect("message.sender", "sender") // Joindre la table User associée comme "sender"
      .leftJoinAndSelect("message.receiver", "receiver") // Joindre la table User associée comme "receiver"
      .getMany();
  }

  async GetAllMessages(me: User): Promise<Message[]> {
    return await this.messagesRepository
      .createQueryBuilder("message")
      .leftJoinAndSelect("message.sender", "sender") // Joindre la table User associée comme "sender"
      .leftJoinAndSelect("message.receiver", "receiver") // Joindre la table User associée comme "receiver"
      .where("message.sender = :me OR message.receiver = :me", { me: me.id })
      .andWhere("message.deleted = :deleted", { deleted: false }) // Ajouter une condition pour exclure les messages supprimés si nécessaire
      .getMany();
  }

  async GetAllMyMessages(me: User): Promise<Record<string, any[]>> {
    const messages = await this.GetAllMessages(me);
    const allMessage = messages.reduce((result, message) => {
      const senderUsername = message.sender.username;
      const receiverUsername = message.receiver.username;
      if (!result[senderUsername]) {
        result[senderUsername] = [];
      }
      result[senderUsername].push(message);

      if (!result[receiverUsername]) {
        result[receiverUsername] = [];
      }
      result[receiverUsername].push(message);

      return result;

    }, {} as Record<string, any[]>)

    delete allMessage[me.username];
    return allMessage;
  }

  async GetMessages(sender: User, receiver: User): Promise<Message[]> {
    return await this.messagesRepository
      .createQueryBuilder("message")
      .leftJoinAndSelect("message.sender", "sender") // Joindre la table User associée comme "sender"
      .leftJoinAndSelect("message.receiver", "receiver") // Joindre la table User associée comme "receiver"
      .where("message.sender = :sender", {sender: sender.id})
      .andWhere("message.receiver = :receiver", {receiver: receiver.id})
      .orWhere("message.sender = :receiver", {receiver: sender.id})
      .andWhere("message.receiver = :sender", {sender: receiver.id})
      .getMany();
  }

  async GetMessage(id: string): Promise<Message> {
    return await this.messagesRepository
      .createQueryBuilder("message")
      .leftJoinAndSelect("message.sender", "sender") // Joindre la table User associée comme "sender"
      .leftJoinAndSelect("message.receiver", "receiver") // Joindre la table User associée comme "receiver"
      .where("message.id = :id", {id: id})
      .getOne();
  }

  async CreateMessage(message: string, sender: User, receiver: User): Promise<Message> {
    const newMessage: Message = this.messagesRepository.create({
      message: message,
      sender: sender,
      receiver: receiver
    });
    return this.messagesRepository.save(newMessage);
  }

  async DeleteMessage(message: Message): Promise<Message> {
    message.deleted = true;
    return this.messagesRepository.save(message);
  }

  async UpdateMessage(message: Message, newMessage: string): Promise<Message> {
    message.message = newMessage;
    return this.messagesRepository.save(message);
  }
}