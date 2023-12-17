import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from "typeorm";
import { Role } from "./role.enum";
import { FriendRequest } from "src/friend-request/friend-request.entity";
import {Message} from "../message/message.entity";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", unique: true, nullable: false })
  username: string;

  @Column({ type: "varchar", unique: true, nullable: false })
  email: string;

  @Column({ type: "varchar", nullable: false })
  password: string;

  @Column({ type: "varchar", default: Role.Player })
  role: Role;

  @ManyToMany(() => User, (user) => user.friends)
  @JoinTable()
  friends: User[];

  @OneToMany(() => FriendRequest, (fr) => fr.sender)
  pendingFriendRequests: FriendRequest[];

  @OneToMany(() => FriendRequest, (fr) => fr.receiver)
  friendRequests: FriendRequest[];

  @OneToMany(() => Message, (message) => message.sender)
  messageSends: Message[];

  @OneToMany(() => Message, (message) => message.receiver)
  messagesReceived: Message[];

  @CreateDateColumn()
  creation_date: Date;
}
