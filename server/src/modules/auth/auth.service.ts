import {ConflictException, ForbiddenException, Injectable, ServiceUnavailableException, UnauthorizedException, Inject} from "@nestjs/common";
import {createRemoteJWKSet, jwtVerify, type JWTPayload} from "jose";
import {PrismaService} from "../../database/prisma.service.js";
import type {AuthenticatedUser} from "./auth.types.js";

function uniqueViolation(error: unknown): boolean {
  return !!error && typeof error === "object" && "code" in error && error.code === "P2002";
}

@Injectable()
export class AuthService {
  private readonly issuer = process.env.AUTH_ISSUER;
  private readonly audience = process.env.AUTH_AUDIENCE;
  private readonly provider = process.env.AUTH_PROVIDER_ID ?? "oidc-primary";
  private readonly jwksUrl = process.env.AUTH_JWKS_URL;
  private readonly jwks: ReturnType<typeof createRemoteJWKSet> | null;

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    if (this.provider.length > 40 || !/^[a-z0-9-]+$/.test(this.provider)) {
      throw new Error("Invalid AUTH_PROVIDER_ID");
    }
    if (this.jwksUrl) {
      const url = new URL(this.jwksUrl);
      if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
        throw new Error("AUTH_JWKS_URL must use HTTPS in production");
      }
      if (!["https:", "http:"].includes(url.protocol)) throw new Error("Invalid JWKS protocol");
      this.jwks = createRemoteJWKSet(url);
    } else {
      this.jwks = null;
    }
  }

  async authenticate(authorization?: string): Promise<AuthenticatedUser> {
    if (!this.jwks || !this.issuer || !this.audience) {
      throw new ServiceUnavailableException("AUTH_NOT_CONFIGURED");
    }
    const match = /^Bearer ([A-Za-z0-9._~-]+)$/.exec(authorization ?? "");
    if (!match) throw new UnauthorizedException("BEARER_TOKEN_REQUIRED");
    let payload: JWTPayload;
    try {
      ({payload} = await jwtVerify(match[1]!, this.jwks, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ["RS256"],
        maxTokenAge: "15m",
        clockTolerance: 5,
      }));
    } catch {
      throw new UnauthorizedException("INVALID_ACCESS_TOKEN");
    }
    if (typeof payload.sub !== "string" || !payload.sub || payload.sub.length > 255 ||
      typeof payload.exp !== "number" || typeof payload.iat !== "number") {
      throw new UnauthorizedException("INVALID_TOKEN_CLAIMS");
    }

    const where = {provider_subject: {provider: this.provider, subject: payload.sub}};
    const current = await this.prisma.authIdentity.findUnique({where, include: {user: true}});
    if (current) return this.activeUser(current.user);

    const verifiedEmail = payload.email_verified === true && typeof payload.email === "string"
      ? payload.email.trim().toLowerCase().slice(0, 320) : null;
    const name = (typeof payload.name === "string" ? payload.name : "").trim().slice(0, 120) || "INVITO user";

    try {
      const created = await this.prisma.user.create({
        data: {
          email: verifiedEmail || null,
          displayName: name,
          identities: {create: {provider: this.provider, subject: payload.sub}},
        },
      });
      return this.activeUser(created);
    } catch (error) {
      // A parallel request may have provisioned the same verified subject.
      if (!uniqueViolation(error)) throw error;
      const raced = await this.prisma.authIdentity.findUnique({where, include: {user: true}});
      if (raced) return this.activeUser(raced.user);
      // Never silently link two identities using an email claim.
      throw new ConflictException("IDENTITY_CONFLICT");
    }
  }

  private activeUser(user: {id: string; email: string | null; displayName: string; status: string}): AuthenticatedUser {
    if (user.status !== "ACTIVE") throw new ForbiddenException("ACCOUNT_DISABLED");
    return {id: user.id, email: user.email, displayName: user.displayName};
  }
}
