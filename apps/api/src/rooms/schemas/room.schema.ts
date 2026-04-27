import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { User } from "../../users/schemas/user.schema";

export type RoomStatus = "waiting" | "active" | "finished";
export type RoomResult = "white" | "black" | "draw" | null;
export type RoomDocument = HydratedDocument<Room>;

@Schema({
  collection: "rooms",
  versionKey: false
})
export class Room {
  _id!: Types.ObjectId;

  @Prop({ required: true, trim: true, unique: true })
  code!: string;

  @Prop({ ref: User.name, required: true, type: Types.ObjectId })
  whiteId!: Types.ObjectId;

  @Prop({ default: null, ref: User.name, type: Types.ObjectId })
  blackId!: Types.ObjectId | null;

  @Prop({ default: "waiting", enum: ["waiting", "active", "finished"] })
  status!: RoomStatus;

  @Prop({ required: true, trim: true })
  fen!: string;

  @Prop({ default: "", trim: true })
  pgn!: string;

  @Prop({ default: null, enum: ["white", "black", "draw", null], type: String })
  result!: RoomResult;

  @Prop({ default: Date.now })
  createdAt!: Date;
}

export const RoomSchema = SchemaFactory.createForClass(Room);
