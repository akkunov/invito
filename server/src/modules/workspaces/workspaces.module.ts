import {Module} from "@nestjs/common";
import {WorkspacesController} from "./workspaces.controller.js";
import {WorkspacesService} from "./workspaces.service.js";
import {WorkspaceAccessGuard} from "./workspace-access.guard.js";

@Module({
  controllers: [WorkspacesController],
  providers: [WorkspacesService, WorkspaceAccessGuard],
})
export class WorkspacesModule {}
