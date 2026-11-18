import {Module} from "@nestjs/common";
import {MediaObjectStore} from "./media-object-store.js";
import {MediaService} from "./media.service.js";
import {MediaController} from "./media.controller.js";
import {DocumentsModule} from "../documents/documents.module.js";

@Module({
  imports: [DocumentsModule],
  providers: [MediaObjectStore, MediaService],
  controllers: [MediaController],
  exports: [MediaService],
})
export class MediaModule {}
