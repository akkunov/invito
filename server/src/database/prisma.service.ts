import {Injectable, OnModuleDestroy, OnModuleInit} from "@nestjs/common";
import {PrismaPg} from "@prisma/adapter-pg";
import {PrismaClient} from "../generated/prisma/client.js";

/**
 * Prisma 7 uses the node-postgres adapter pool, not URL connection_limit.
 * Keep each NestJS process conservative for shared Supabase/Supavisor pools.
 * Vercel/serverless instances each have their OWN pool: tune concurrency separately.
 */
function poolMax(): number {
  const raw = process.env.DATABASE_POOL_MAX;
  if (raw === undefined || raw === "") return 3;
  const max = Number(raw);
  if (!Number.isInteger(max) || max < 1 || max > 10) {
    throw new Error("DATABASE_POOL_MAX must be an integer between 1 and 10");
  }
  return max;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is required");
    const url = new URL(connectionString);
    if (!["postgresql:", "postgres:"].includes(url.protocol)) {
      throw new Error("DATABASE_URL must be a PostgreSQL URL");
    }
    super({adapter: new PrismaPg({
      connectionString,
      max: poolMax(),
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 10_000,
      allowExitOnIdle: true,
    })});
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
