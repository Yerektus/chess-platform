import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { User } from "../../users/schemas/user.schema";

export type GameOpponent = "human" | "ai";
export type GameResult = "white" | "black" | "draw" | null;
export type GameDocument = HydratedDocument<Game>;

@Schema({ _id: false })
export class GameAnalysisEntry {
  @Prop({ required: true, min: 1 })
  move!: number;

  @Prop({ required: true })
  mistake!: boolean;

  @Prop({ required: true, trim: true })
  suggestion!: string;
}

const GameAnalysisEntrySchema = SchemaFactory.createForClass(GameAnalysisEntry);

@Schema({
  collection: "games",
  versionKey: false
})
export class Game {
  _id!: Types.ObjectId;

  @Prop({ ref: User.name, required: true, type: Types.ObjectId })
  whiteId!: Types.ObjectId;

  @Prop({ default: null, ref: User.name, type: Types.ObjectId })
  blackId!: Types.ObjectId | null;

  @Prop({ enum: ["human", "ai"], required: true })
  opponent!: GameOpponent;

  @Prop({ required: true, trim: true })
  pgn!: string;

  @Prop({ default: null, enum: ["white", "black", "draw", null], type: String })
  result!: GameResult;

  @Prop({ default: [], type: [GameAnalysisEntrySchema] })
  analysis!: GameAnalysisEntry[];

  @Prop({ default: Date.now })
  createdAt!: Date;
}

export const GameSchema = SchemaFactory.createForClass(Game);
