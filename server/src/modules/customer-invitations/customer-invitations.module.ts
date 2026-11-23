import {Module} from "@nestjs/common";
import {CustomerInvitationsController} from "./customer-invitations.controller.js";
import {CustomerInvitationsService} from "./customer-invitations.service.js";
import {CustomerPublicationService} from "./customer-publication.service.js";
import {CustomerPublicationController} from "./customer-publication.controller.js";
import {MediaModule} from "../media/media.module.js";
import {RsvpChallengeService} from "../publications/rsvp-challenge.service.js";
import {CustomerRsvpService} from "./customer-rsvp.service.js";
import {CustomerRsvpController} from "./customer-rsvp.controller.js";
@Module({
  imports:[MediaModule],
  controllers:[CustomerInvitationsController,CustomerPublicationController,CustomerRsvpController],
  providers:[CustomerInvitationsService,CustomerPublicationService,CustomerRsvpService,RsvpChallengeService],
})
export class CustomerInvitationsModule {}
