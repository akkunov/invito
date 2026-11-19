import {
  ForbiddenException, Injectable, ServiceUnavailableException,
} from "@nestjs/common";

/**
 * Server-side Cloudflare Turnstile. RSVP cannot be publicly submitted in production
 * unless BOTH site and secret keys have been explicitly configured.
 * The site key is public, the secret is backend-only.
 */
@Injectable()
export class RsvpChallengeService {
  siteKey(): string | null {
    const siteKey=process.env.RSVP_TURNSTILE_SITE_KEY?.trim();
    const secret=process.env.RSVP_TURNSTILE_SECRET?.trim();
    if (!siteKey || !secret) return null;
    return siteKey;
  }

  async verify(token: string | undefined): Promise<void> {
    const siteKey=process.env.RSVP_TURNSTILE_SITE_KEY?.trim();
    const secret=process.env.RSVP_TURNSTILE_SECRET?.trim();
    if (!siteKey || !secret) {
      if (process.env.NODE_ENV === "production") {
        throw new ServiceUnavailableException("RSVP_CHALLENGE_NOT_CONFIGURED");
      }
      return; // Local development / CI only.
    }
    if (!token || token.length < 10) throw new ForbiddenException("RSVP_CHALLENGE_REQUIRED");
    let verified=false;
    try {
      const response=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{
        method:"POST", headers:{"content-type":"application/x-www-form-urlencoded"},
        body:new URLSearchParams({secret,response:token}),cache:"no-store",
        signal:AbortSignal.timeout(5000),
      });
      if (!response.ok) throw new Error("TURNSTILE_HTTP");
      const result=await response.json() as {success?:boolean};
      verified=result.success===true;
    } catch {
      throw new ServiceUnavailableException("RSVP_CHALLENGE_UNAVAILABLE");
    }
    if (!verified) throw new ForbiddenException("RSVP_CHALLENGE_FAILED");
  }
}
