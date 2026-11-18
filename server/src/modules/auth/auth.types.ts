/** The authenticated principal comes only from a verified JWT + database identity. */
export interface AuthenticatedUser {
  id: string;
  email: string | null;
  displayName: string;
}

export interface AuthenticatedRequest {
  headers: {authorization?: string};
  user: AuthenticatedUser;
  params: Record<string, string>;
}
