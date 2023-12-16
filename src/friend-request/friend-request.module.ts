import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendRequest } from './friend-request.entity';
import { FriendRequestController } from './controllers/friend-request.controller';
import { UsersModule } from 'src/users/users.module';
import { FriendRequestService } from './services/friend-request.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FriendRequest]),
    forwardRef(() => UsersModule)
  ],
  controllers: [FriendRequestController],
  providers: [FriendRequestService],
  exports: [FriendRequestService]
})
export class FriendRequestModule { }