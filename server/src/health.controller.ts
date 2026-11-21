import {Controller, Get, Inject, Logger, ServiceUnavailableException} from "@nestjs/common";
import {PrismaService} from "./database/prisma.service.js";
import {Public} from "./modules/auth/public.decorator.js";

@Controller("health")
export class HealthController {
  private readonly logger = new Logger(HealthController.name);
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
      await this.prisma.$queryRaw`SELECT 1`;
      return {status: "ready"};
    } catch (error: unknown) {
      // Never echo connection URLs, usernames or credentials in public responses or logs.
      const code = error && typeof error === "object" && "code" in error
        ? String(error.code).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 30) : "unknown";
      this.logger.warn(`Database readiness failed (code: ${code}). Check DATABASE_URL, TLS, Supabase pooler and connectivity.`);
      throw new ServiceUnavailableException("DATABASE_UNAVAILABLE");
    }
  }
}
