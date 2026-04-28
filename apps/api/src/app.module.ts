import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { PassportModule } from "@nestjs/passport";
import { AuthModule } from "./auth/auth.module";
import { GamesModule } from "./games/games.module";
import { LeaderboardModule } from "./leaderboard/leaderboard.module";
import { PaymentsModule } from "./payments/payments.module";
import { RoomsModule } from "./rooms/rooms.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"]
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>("MONGODB_URI"),
        lazyConnection: true
      })
    }),
    PassportModule.register({
      defaultStrategy: "jwt"
    }),
    JwtModule.register({}),
    AuthModule,
    UsersModule,
    GamesModule,
    RoomsModule,
    LeaderboardModule,
    PaymentsModule
  ]
})
export class AppModule {}
