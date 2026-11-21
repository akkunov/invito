import "reflect-metadata";
import "dotenv/config";
import {NestFactory} from "@nestjs/core";
import type {NestExpressApplication} from "@nestjs/platform-express";
import {AppModule} from "./app.module.js";
import {setupOpenApi} from "./openapi.js";

export async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {bodyParser: true});
  app.useBodyParser("json", {limit: "2mb"});
  app.setGlobalPrefix("api/v1");
  const allowedOrigins = (process.env.FRONTEND_ORIGINS ?? "http://localhost:3000")
    .split(",").map(origin => origin.trim()).filter(Boolean);
  app.enableCors({
    origin(origin: string | undefined, callback: (error: Error | null, allowed?: boolean) => void) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS_ORIGIN_DENIED"), false);
    },
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: false,
  });
  setupOpenApi(app);
  const port = Number(process.env.PORT ?? 4000);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("INVALID_PORT");
  await app.listen(port, "0.0.0.0");
  return app;
}
void bootstrap().catch(error => {
  console.error("eventiq API startup failed", error);
  process.exitCode = 1;
});
