import {Module} from "@nestjs/common";
import {APP_GUARD} from "@nestjs/core";
import {PrismaModule} from "./database/prisma.module.js";
import {HealthController} from "./health.controller.js";
import {AuthModule} from "./modules/auth/auth.module.js";
import {JwtAuthGuard} from "./modules/auth/jwt-auth.guard.js";
import {WorkspacesModule} from "./modules/workspaces/workspaces.module.js";
import {DocumentsModule} from "./modules/documents/documents.module.js";
import {MediaModule} from "./modules/media/media.module.js";

@Module({
  imports: [PrismaModule, AuthModule, WorkspacesModule, DocumentsModule, MediaModule],
  controllers: [HealthController],
  providers: [{provide: APP_GUARD, useClass: JwtAuthGuard}],
})
export class AppModule {}
