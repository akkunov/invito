import {Module} from "@nestjs/common";
import {DocumentsModule} from "../documents/documents.module.js";
import {MediaModule} from "../media/media.module.js";
import {RsvpChallengeService} from "./rsvp-challenge.service.js";
import {PublicationsService} from "./publications.service.js";
import {PublicationsController} from "./publications.controller.js";

@Module({
  imports:[DocumentsModule,MediaModule],
  providers:[RsvpChallengeService,PublicationsService],
  controllers:[PublicationsController],
})
export class PublicationsModule {}
