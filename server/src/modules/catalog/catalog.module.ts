import {Module} from "@nestjs/common";
import {PrismaModule} from "../../database/prisma.module.js";
import {MediaModule} from "../media/media.module.js";
import {DocumentsModule} from "../documents/documents.module.js";
import {CatalogController} from "./catalog.controller.js";
import {CatalogService} from "./catalog.service.js";
import {MusicCatalogController} from "./music-catalog.controller.js";

@Module({
  imports:[PrismaModule,MediaModule,DocumentsModule],
  controllers:[CatalogController,MusicCatalogController],
  providers:[CatalogService],
})
export class CatalogModule {}
