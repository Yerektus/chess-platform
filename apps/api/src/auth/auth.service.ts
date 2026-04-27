import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { UsersService } from "../users/users.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RegisterDto } from "./dto/register.dto";
import { TokenResponseDto } from "./dto/token-response.dto";

@Injectable()
export class AuthService {
  private readonly saltRounds = 12;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async register(dto: RegisterDto): Promise<TokenResponseDto> {
    const existingEmail = await this.usersService.findByEmail(dto.email);

    if (existingEmail) {
      throw new ConflictException("Email is already registered");
    }

    const existingUsername = await this.usersService.findByUsername(dto.username);

    if (existingUsername) {
      throw new ConflictException("Username is already registered");
    }

    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);
    const user = await this.usersService.create({
      username: dto.username,
      email: dto.email.toLowerCase(),
      passwordHash
    });

    return this.issueTokens(user._id.toString(), user.username);
  }

  async login(dto: LoginDto): Promise<TokenResponseDto> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return this.issueTokens(user._id.toString(), user.username);
  }

  async refresh(refreshTokenOrDto: string | RefreshTokenDto): Promise<TokenResponseDto> {
    const refreshToken =
      typeof refreshTokenOrDto === "string" ? refreshTokenOrDto : refreshTokenOrDto.refreshToken;

    let payload: JwtTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtTokenPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>("JWT_REFRESH_SECRET")
      });
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const user = await this.usersService.findById(payload.sub);

    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const tokenMatches = await bcrypt.compare(refreshToken, user.refreshTokenHash);

    if (!tokenMatches) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    return this.issueTokens(user._id.toString(), user.username);
  }

  private async issueTokens(userId: string, username: string): Promise<TokenResponseDto> {
    const payload: JwtTokenPayload = { sub: userId, username };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>("JWT_SECRET"),
        expiresIn: "15m"
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>("JWT_REFRESH_SECRET"),
        expiresIn: "7d"
      })
    ]);
    const refreshTokenHash = await bcrypt.hash(refreshToken, this.saltRounds);

    await this.usersService.updateRefreshTokenHash(userId, refreshTokenHash);

    return {
      accessToken,
      refreshToken
    };
  }
}

export type JwtTokenPayload = {
  sub: string;
  username: string;
};
