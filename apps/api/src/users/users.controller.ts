import { Body, Controller, Get, NotFoundException, Param, Patch, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserResponseDto } from "./dto/user-response.dto";
import { type UserDocument } from "./schemas/user.schema";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  @UseGuards(AuthGuard("jwt"))
  async getMe(@Req() request: AuthenticatedRequest): Promise<UserResponseDto> {
    const user = await this.usersService.findById(getAuthenticatedUserId(request));

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return toUserResponse(user);
  }

  @Get(":id")
  async getById(@Param("id") id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findById(id);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return toUserResponse(user);
  }

  @Patch("me")
  @UseGuards(AuthGuard("jwt"))
  async updateMe(@Req() request: AuthenticatedRequest, @Body() dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.usersService.updateById(getAuthenticatedUserId(request), dto);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return toUserResponse(user);
  }
}

type AuthenticatedRequest = {
  user?: {
    sub?: string;
    userId?: string;
    id?: string;
    _id?: string;
  };
};

function getAuthenticatedUserId(request: AuthenticatedRequest): string {
  const userId = request.user?.sub ?? request.user?.userId ?? request.user?.id ?? request.user?._id;

  if (!userId) {
    throw new NotFoundException("User not found");
  }

  return userId;
}

function toUserResponse(user: UserDocument): UserResponseDto {
  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    elo: user.elo,
    plan: user.plan,
    city: user.city,
    createdAt: user.createdAt.toISOString()
  };
}
