import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type UserPlan = "free" | "pro";
export type UserDocument = HydratedDocument<User>;

@Schema({ _id: false })
export class UserPreferences {
  @Prop({ default: "green", enum: ["green", "blue", "wood", "marble"] })
  boardTheme!: string;

  @Prop({ default: "classic", enum: ["classic", "neon", "pixel", "premium"] })
  pieceStyle!: string;

  @Prop({ default: "#81b64c" })
  highlightColor!: string;

  @Prop({ default: true })
  animations!: boolean;

  @Prop({ default: true })
  sounds!: boolean;
}

const UserPreferencesSchema = SchemaFactory.createForClass(UserPreferences);

@Schema({
  collection: "users",
  versionKey: false
})
export class User {
  @Prop({ required: true, trim: true, unique: true })
  username!: string;

  @Prop({ lowercase: true, required: true, trim: true, unique: true })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop()
  refreshTokenHash?: string;

  @Prop({ default: 1200, min: 0 })
  elo!: number;

  @Prop({ default: "free", enum: ["free", "pro"] })
  plan!: UserPlan;

  @Prop({ trim: true })
  city?: string;

  @Prop({ default: () => ({}), type: UserPreferencesSchema })
  preferences!: UserPreferences;

  @Prop({ default: Date.now })
  createdAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
