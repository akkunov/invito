import {CanActivate, ExecutionContext, Inject, Injectable} from "@nestjs/common";
import {Reflector} from "@nestjs/core";
import {AuthService} from "./auth.service.js";
import {PUBLIC_ROUTE_KEY} from "./public.decorator.js";
import type {AuthenticatedRequest} from "./auth.types.js";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(Reflector) private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    request.user = await this.authService.authenticate(request.headers.authorization);
    return true;
  }
}
