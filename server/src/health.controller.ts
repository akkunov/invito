import {Controller, Get, Inject, ServiceUnavailableException} from "@nestjs/common";
import {PrismaService} from "./database/prisma.service.js";
import {Public} from "./modules/auth/public.decorator.js";

@Controller("health")
export class HealthController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  liveness() {
    return {status: "ok", service: "invito-api"};
  }

  @Public()
  @Get("ready")
  async readiness() {
    try {
      await this.prisma.$queryRawUnsafe("SELECT 1");
      return {status: "ready"};
    } catch {
      throw new ServiceUnavailableException("DATABASE_UNAVAILABLE");
    }
  }
}
