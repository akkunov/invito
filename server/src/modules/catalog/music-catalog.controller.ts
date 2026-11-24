import {Controller,Get,ServiceUnavailableException} from "@nestjs/common";
import {Public} from "../auth/public.decorator.js";
import {musicCatalogSchema} from "../../../../src/features/invitations/music-catalog.schema.js";

@Controller("catalog/music")
export class MusicCatalogController {
  @Public()
  @Get()
  list(){
    try {
      const tracks=musicCatalogSchema.parse(JSON.parse(process.env.EVENTIQ_MUSIC_CATALOG_JSON??"[]"));
      return {tracks};
    } catch {
      // Configuration is private; do not expose malformed env values or parser details.
      throw new ServiceUnavailableException("MUSIC_CATALOG_UNAVAILABLE");
    }
  }
}
