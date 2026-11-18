import "reflect-metadata";
import "dotenv/config";
import {NestFactory} from "@nestjs/core";
import {AppModule} from "./app.module.js";

export async function bootstrap() {
  const app = await NestFactory.create(AppModule, {bodyParser: true});
  app.setGlobalPrefix("api/v1");
  const allowedOrigins = (process.env.FRONTEND_ORIGINS ?? "http://localhost:3000")
    .split(",").map(origin => origin.trim()).filter(Boolean);
  app.enableCors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS_ORIGIN_DENIED"), false);
    },
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: false,
  });
  const port = Number(process.env.PORT ?? 4000);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("INVALID_PORT");
  await app.listen(port, "0.0.0.0");
  return app;
}
void bootstrap().catch(error => {
  console.error("INVITO API startup failed", error);
  process.exitCode = 1;
});
