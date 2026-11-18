import {Controller, Get, Req} from "@nestjs/common";
import type {AuthenticatedRequest} from "./auth.types.js";

@Controller("me")
export class AuthController {
  @Get()
  me(@Req() request: AuthenticatedRequest) {
    return request.user;
  }
}
