import { Controller, Get } from "@nestjs/common";

type HealthResponse = {
  status: "ok";
  service: "chess-platform-api";
};

@Controller()
export class HealthController {
  @Get()
  getRoot(): HealthResponse {
    return this.getHealth();
  }

  @Get("health")
  getHealth(): HealthResponse {
    return {
      status: "ok",
      service: "chess-platform-api"
    };
  }
}
