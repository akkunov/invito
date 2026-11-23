import {Module} from "@nestjs/common";
import {CustomerInvitationsController} from "./customer-invitations.controller.js";
import {CustomerInvitationsService} from "./customer-invitations.service.js";
import {CustomerPublicationService} from "./customer-publication.service.js";
import {CustomerPublicationController} from "./customer-publication.controller.js";
import {MediaModule} from "../media/media.module.js";
@Module({
  imports:[MediaModule],
  controllers:[CustomerInvitationsController,CustomerPublicationController],
  providers:[CustomerInvitationsService,CustomerPublicationService],
})
export class CustomerInvitationsModule {}
