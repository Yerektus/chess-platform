import { type Square } from "@chess-platform/chess-engine";
import { ForbiddenException, UsePipes, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { type JwtTokenPayload } from "../auth/auth.service";
import { JoinRoomDto, MoveRoomDto, ResignRoomDto } from "./dto/room-event.dto";
import { toRoomResponse } from "./rooms.controller";
import { RoomsService } from "./rooms.service";

@WebSocketGateway({
  namespace: "/rooms",
  cors: {
    origin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
    credentials: true
  }
})
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true
  })
)
export class RoomsGateway implements OnGatewayConnection {
  @WebSocketServer()
  private readonly server!: Server;

  constructor(
    private readonly roomsService: RoomsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      client.data.user = await this.verifyClient(client);
    } catch {
      client.emit("exception", { message: "Unauthorized" });
      client.disconnect(true);
    }
  }

  @SubscribeMessage("join")
  async handleJoin(@MessageBody() dto: JoinRoomDto, @ConnectedSocket() client: Socket): Promise<void> {
    const user = getSocketUser(client);

    assertPayloadUser(dto.userId, user.sub);

    const room = await this.roomsService.join(dto.code, user.sub);
    const response = toRoomResponse(room);

    await client.join(response.code);
    this.server.to(response.code).emit("room:state", response);
  }

  @SubscribeMessage("move")
  async handleMove(@MessageBody() dto: MoveRoomDto, @ConnectedSocket() client: Socket): Promise<void> {
    const user = getSocketUser(client);
    const room = await this.roomsService.applyPlayerMove(
      dto.code,
      user.sub,
      dto.from as Square,
      dto.to as Square,
      dto.promotion
    );
    const response = toRoomResponse(room);

    this.server.to(response.code).emit("room:state", response);

    if (response.status === "finished") {
      this.server.to(response.code).emit("room:finished", response);
    }
  }

  @SubscribeMessage("resign")
  async handleResign(@MessageBody() dto: ResignRoomDto, @ConnectedSocket() client: Socket): Promise<void> {
    const user = getSocketUser(client);

    assertPayloadUser(dto.userId, user.sub);

    const room = await this.roomsService.resign(dto.code, user.sub);
    const response = toRoomResponse(room);

    this.server.to(response.code).emit("room:finished", response);
  }

  private async verifyClient(client: Socket): Promise<JwtTokenPayload> {
    const token = extractToken(client);

    if (!token) {
      throw new WsException("Unauthorized");
    }

    return this.jwtService.verifyAsync<JwtTokenPayload>(token, {
      secret: this.configService.getOrThrow<string>("JWT_SECRET")
    });
  }
}

type AuthenticatedSocket = Socket & {
  data: {
    user?: JwtTokenPayload;
  };
};

function getSocketUser(client: AuthenticatedSocket): JwtTokenPayload {
  const user = client.data.user;

  if (!user) {
    throw new WsException("Unauthorized");
  }

  return user;
}

function assertPayloadUser(payloadUserId: string | undefined, tokenUserId: string): void {
  if (payloadUserId && payloadUserId !== tokenUserId) {
    throw new ForbiddenException("Payload user does not match token user");
  }
}

function extractToken(client: Socket): string | null {
  const auth = client.handshake.auth as Record<string, unknown>;
  const authHeader = typeof auth.authorization === "string" ? auth.authorization : null;
  const authToken = typeof auth.token === "string" ? auth.token : null;
  const header = client.handshake.headers.authorization ?? authHeader;
  const token = authToken ?? header;

  if (!token) {
    return null;
  }

  return token.startsWith("Bearer ") ? token.slice("Bearer ".length) : token;
}
