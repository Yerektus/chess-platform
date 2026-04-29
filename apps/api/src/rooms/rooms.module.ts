import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "../users/schemas/user.schema";
import { RoomsController } from "./rooms.controller";
import { RoomsGateway } from "./rooms.gateway";
import { RoomsService } from "./rooms.service";
import { Room, RoomSchema } from "./schemas/room.schema";

@Module({
  imports: [
    JwtModule.register({}),
    MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }, { name: User.name, schema: UserSchema }])
  ],
  controllers: [RoomsController],
  providers: [RoomsService, RoomsGateway],
  exports: [RoomsService]
})
export class RoomsModule {}
