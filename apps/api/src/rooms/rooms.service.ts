import {
  applyMove,
  getGameStatus,
  getLegalMoves,
  parseFEN,
  toFEN,
  type Color,
  type Square
} from "@chess-platform/chess-engine";
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { calculateEloPair } from "../users/elo";
import { User, type UserDocument } from "../users/schemas/user.schema";
import { Room, type RoomDocument, type RoomResult } from "./schemas/room.schema";

@Injectable()
export class RoomsService {
  private readonly initialFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  constructor(
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>
  ) {}

  async create(userId: string): Promise<RoomDocument> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException("Invalid user id");
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        return await this.roomModel.create({
          code: createRoomCode(),
          whiteId: new Types.ObjectId(userId),
          blackId: null,
          status: "waiting",
          fen: this.initialFen,
          pgn: "",
          result: null
        });
      } catch (error) {
        if (!isDuplicateKeyError(error)) {
          throw error;
        }
      }
    }

    throw new BadRequestException("Could not create room code");
  }

  async findByCode(code: string): Promise<RoomDocument | null> {
    return this.roomModel.findOne({ code: normalizeCode(code) }).exec();
  }

  async join(code: string, userId: string): Promise<RoomDocument> {
    const room = await this.getRoomOrThrow(code);
    const userObjectId = toObjectId(userId);
    const currentColor = getPlayerColor(room, userId);

    if (currentColor) {
      return room;
    }

    if (room.status !== "waiting" || room.blackId) {
      throw new ForbiddenException("Room is full");
    }

    const updatedRoom = await this.roomModel
      .findOneAndUpdate(
        {
          code: room.code,
          blackId: null,
          status: "waiting"
        },
        {
          $set: {
            blackId: userObjectId,
            status: "active"
          }
        },
        {
          new: true,
          runValidators: true
        }
      )
      .exec();

    if (!updatedRoom) {
      throw new ForbiddenException("Room is full");
    }

    return updatedRoom;
  }

  async applyPlayerMove(
    code: string,
    userId: string,
    from: Square,
    to: Square,
    promotion?: "queen" | "rook" | "bishop" | "knight"
  ): Promise<RoomDocument> {
    const room = await this.getRoomOrThrow(code);

    if (room.status !== "active") {
      throw new BadRequestException("Room is not active");
    }

    const playerColor = getPlayerColor(room, userId);

    if (!playerColor) {
      throw new ForbiddenException("User is not a room player");
    }

    const state = parseFEN(room.fen);

    if (state.turn !== playerColor) {
      throw new ForbiddenException("It is not this player's turn");
    }

    if (!getLegalMoves(state, from).includes(to)) {
      throw new BadRequestException("Illegal move");
    }

    const nextState = applyMove(state, from, to, promotion);
    const status = getGameStatus(nextState);

    room.fen = toFEN(nextState);
    room.pgn = appendPgnMove(room.pgn, state.fullmoveNumber, playerColor, from, to, promotion);

    if (status !== "ongoing") {
      room.status = "finished";
      room.result = toRoomResult(status, playerColor);
    }

    const savedRoom = await room.save();

    if (savedRoom.status === "finished") {
      await this.updateRoomRatings(savedRoom);
    }

    return savedRoom;
  }

  async resign(code: string, userId: string): Promise<RoomDocument> {
    const room = await this.getRoomOrThrow(code);
    const playerColor = getPlayerColor(room, userId);

    if (!playerColor) {
      throw new ForbiddenException("User is not a room player");
    }

    if (room.status === "finished") {
      return room;
    }

    room.status = "finished";
    room.result = playerColor === "white" ? "black" : "white";

    const savedRoom = await room.save();

    await this.updateRoomRatings(savedRoom);

    return savedRoom;
  }

  private async getRoomOrThrow(code: string): Promise<RoomDocument> {
    const room = await this.findByCode(code);

    if (!room) {
      throw new NotFoundException("Room not found");
    }

    return room;
  }

  private async updateRoomRatings(room: RoomDocument): Promise<void> {
    if (!room.blackId || !room.result) {
      return;
    }

    const [white, black] = await Promise.all([
      this.userModel.findById(room.whiteId).select({ elo: 1 }).exec(),
      this.userModel.findById(room.blackId).select({ elo: 1 }).exec()
    ]);

    if (!white || !black) {
      return;
    }

    const nextRatings = calculateEloPair(white.elo, black.elo, room.result);

    await Promise.all([
      this.userModel.findByIdAndUpdate(white._id, { elo: nextRatings.whiteElo }, { runValidators: true }).exec(),
      this.userModel.findByIdAndUpdate(black._id, { elo: nextRatings.blackElo }, { runValidators: true }).exec()
    ]);
  }
}

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function createRoomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let index = 0; index < 6; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return code;
}

function isDuplicateKeyError(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === 11000);
}

function toObjectId(userId: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(userId)) {
    throw new BadRequestException("Invalid user id");
  }

  return new Types.ObjectId(userId);
}

function getPlayerColor(room: RoomDocument, userId: string): Color | null {
  if (room.whiteId.toString() === userId) {
    return "white";
  }

  if (room.blackId?.toString() === userId) {
    return "black";
  }

  return null;
}

function appendPgnMove(
  currentPgn: string,
  moveNumber: number,
  color: Color,
  from: Square,
  to: Square,
  promotion?: "queen" | "rook" | "bishop" | "knight"
): string {
  const move = `${from}${to}${promotion ? promotion[0] : ""}`;
  const entry = color === "white" ? `${moveNumber}. ${move}` : move;

  return [currentPgn.trim(), entry].filter(Boolean).join(" ");
}

function toRoomResult(status: "checkmate" | "stalemate" | "draw", movingColor: Color): RoomResult {
  if (status === "checkmate") {
    return movingColor;
  }

  return "draw";
}
