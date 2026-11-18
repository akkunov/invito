import {SetMetadata} from "@nestjs/common";
export type WorkspaceRole = "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";
export const WORKSPACE_ROLE_KEY = "invito:minimum-workspace-role";
export const MinimumWorkspaceRole = (role: WorkspaceRole) => SetMetadata(WORKSPACE_ROLE_KEY, role);
