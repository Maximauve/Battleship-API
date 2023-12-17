import {Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {User} from "../users/users.entity";

@Entity()
export class Message {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", nullable: false })
  message: string;

  @Column({ type: "boolean", nullable: false, default: false })
  deleted: boolean;

  @ManyToOne(() => User, (user) => user.messageSends)
  @JoinColumn({ name: "sender_id" })
  sender: User;

  @ManyToOne(() => User, (user) => user.messagesReceived)
  @JoinColumn({ name: "receiver_id" })
  receiver: User;

  @CreateDateColumn()
  creation_date: Date;
}