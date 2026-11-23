import {Module} from "@nestjs/common";
import {CustomerInvitationsController} from "./customer-invitations.controller.js";
import {CustomerInvitationsService} from "./customer-invitations.service.js";
import {MediaModule} from "../media/media.module.js";
@Module({
  imports:[MediaModule],
  controllers:[CustomerInvitationsController],
  providers:[CustomerInvitationsService],
})
export class CustomerInvitationsModule {}
