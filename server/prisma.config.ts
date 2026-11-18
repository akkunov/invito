import "dotenv/config";
import {defineConfig,env} from "prisma/config";

/** Used by the Prisma CLI from the server/ directory.
 * Runtime traffic uses DATABASE_URL with PrismaPg, migration uses the DIRECT URL.
 * Never run migrations against a pooled connection string. */
export default defineConfig({
 schema:"prisma/schema.prisma",
 migrations:{path:"prisma/migrations"},
 datasource:{url:env("DIRECT_DATABASE_URL")},
});
