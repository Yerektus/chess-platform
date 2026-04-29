import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types, type UpdateQuery } from "mongoose";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserPreferencesDto } from "./dto/update-user-preferences.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User, type UserDocument, type UserPlan } from "./schemas/user.schema";

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async create(dto: CreateUserDto): Promise<UserDocument> {
    return this.userModel.create(dto);
  }

  async findById(id: string): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async updateById(id: string, dto: UpdateUserDto): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const set: Partial<Pick<User, "city" | "email" | "username">> = {};
    const unset: Record<string, ""> = {};

    if (dto.username !== undefined) {
      set.username = dto.username;
    }

    if (dto.email !== undefined) {
      set.email = dto.email.toLowerCase();
    }

    if (dto.city !== undefined) {
      const city = dto.city.trim();

      if (city) {
        set.city = city;
      } else {
        unset.city = "";
      }
    }

    const update: UpdateQuery<UserDocument> = {};

    if (Object.keys(set).length > 0) {
      update.$set = set;
    }

    if (Object.keys(unset).length > 0) {
      update.$unset = unset;
    }

    return this.userModel.findByIdAndUpdate(id, update, { new: true, runValidators: true }).exec();
  }

  async updateRefreshTokenHash(id: string, refreshTokenHash: string | null): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const update = refreshTokenHash ? { refreshTokenHash } : { $unset: { refreshTokenHash: "" } };

    return this.userModel.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  async updatePlanById(id: string, plan: UserPlan): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    return this.userModel.findByIdAndUpdate(id, { plan }, { new: true, runValidators: true }).exec();
  }

  async updatePreferencesById(id: string, preferences: UpdateUserPreferencesDto): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const update = Object.fromEntries(
      Object.entries(preferences).map(([key, value]) => [`preferences.${key}`, value])
    );

    return this.userModel.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true }).exec();
  }
}
