import {SetMetadata} from "@nestjs/common";

export const PUBLIC_ROUTE_KEY = "invito:public-route";
export const Public = () => SetMetadata(PUBLIC_ROUTE_KEY, true);
