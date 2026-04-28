import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true
  });
  const configService = app.get(ConfigService);
  const corsOrigins = [
    configService.get<string>("WEB_ORIGIN") ?? "http://localhost:3000",
    configService.get<string>("LANDING_ORIGIN") ?? "http://localhost:5000"
  ];
  const port = configService.get<number>("API_PORT") ?? configService.get<number>("PORT") ?? 8080;

  app.enableCors({
    origin: corsOrigins,
    credentials: true
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  await app.listen(port);
}

void bootstrap();
