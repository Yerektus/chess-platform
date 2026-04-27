import { Controller, Get, NotFoundException, Param, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RoomResponseDto } from "./dto/room-response.dto";
import { type RoomDocument } from "./schemas/room.schema";
import { RoomsService } from "./rooms.service";

@Controller("rooms")
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Req() request: AuthenticatedRequest): Promise<RoomResponseDto> {
    const room = await this.roomsService.create(getAuthenticatedUserId(request));

    return toRoomResponse(room);
  }

  @Get(":code")
  async getByCode(@Param("code") code: string): Promise<RoomResponseDto> {
    const room = await this.roomsService.findByCode(code);

    if (!room) {
      throw new NotFoundException("Room not found");
    }

    return toRoomResponse(room);
  }
}

type AuthenticatedRequest = {
  user?: {
    sub?: string;
  };
};

function getAuthenticatedUserId(request: AuthenticatedRequest): string {
  const userId = request.user?.sub;

  if (!userId) {
    throw new NotFoundException("User not found");
  }

  return userId;
}

export function toRoomResponse(room: RoomDocument): RoomResponseDto {
  return {
    id: room._id.toString(),
    code: room.code,
    whiteId: room.whiteId.toString(),
    blackId: room.blackId?.toString() ?? null,
    status: room.status,
    fen: room.fen,
    pgn: room.pgn,
    result: room.result,
    createdAt: room.createdAt.toISOString()
  };
}
