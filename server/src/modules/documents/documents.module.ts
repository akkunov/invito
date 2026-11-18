import {Module} from "@nestjs/common";
import {DocumentsAccessService} from "./documents-access.service.js";
import {StudioDocumentsService} from "./documents.service.js";
import {DocumentsController} from "./documents.controller.js";

@Module({
  providers: [DocumentsAccessService, StudioDocumentsService],
  controllers: [DocumentsController],
})
export class DocumentsModule {}
