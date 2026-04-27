import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User, type UserDocument } from "./schemas/user.schema";

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

    const update = {
      ...dto,
      email: dto.email?.toLowerCase()
    };

    return this.userModel.findByIdAndUpdate(id, update, { new: true, runValidators: true }).exec();
  }
}
