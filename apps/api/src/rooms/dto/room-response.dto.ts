import { type RoomResult, type RoomStatus } from "../schemas/room.schema";

export class RoomResponseDto {
  id!: string;
  code!: string;
  whiteId!: string;
  blackId!: string | null;
  status!: RoomStatus;
  fen!: string;
  pgn!: string;
  result!: RoomResult;
  createdAt!: string;
}
