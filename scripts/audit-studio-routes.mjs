import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";

const source=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const checks=[];
function includes(file,anchor,label){
 const content=source(file);
 assert.ok(content.includes(anchor),label+" — "+file);
 checks.push(label);
}
function exists(file,label){
 assert.ok(existsSync(new URL("../"+file,import.meta.url)),label+" — missing "+file);
 checks.push(label);
}

// Next.js route pages (dynamic invitations require server SSR, not static Pages).
for(const [path,label] of [
 ["src/app/[locale]/page.tsx","Landing RU/KY"],
 ["src/app/[locale]/admin/studio-v2/page.tsx","Studio v2"],
 ["src/app/[locale]/editor/page.tsx","Customer editor"],
 ["src/app/[locale]/templates/page.tsx","Templates"],
 ["src/app/[locale]/templates/[slug]/page.tsx","Template detail"],
 ["src/app/[locale]/i/[slug]/page.tsx","Public invitation"],
])exists(path,label);
includes("src/app/[locale]/i/[slug]/page.tsx",'export const dynamic="force-dynamic"',"Live invitation SSR");
includes("src/app/[locale]/i/[slug]/page.tsx",'cache:"no-store"',"No stale invitations");
includes("src/app/[locale]/i/[slug]/page.tsx","StudioV2PublicInvitation","Public renderer bound");
includes("src/components/studio-v2/studio-v2-public-invitation.tsx","StudioV2ProjectRenderer","One Studio/guest rendering engine");
includes("src/components/studio-v2/studio-v2-invitation-block.tsx","submitGuestResponse","Real RSVP widget connected");
includes("scripts/build-studio-pages.sh","'src/app/[locale]/i'","Pages static export excludes dynamic guest route");
includes(".github/workflows/studio-pages.yml","'src/app/[locale]/i'","GitHub Pages workflow excludes dynamic guest route");

// Entry points MUST be discoverable, even when no OIDC environment is configured.
const workspace="src/components/studio-v2/studio-v2-workspace.tsx";
for(const [action,label] of [
 ['aria-label="Экспорт и печать"',"Print/Export button"],
 ['StudioV2PrintDialog',"Print dialog mounted"],
 ['StudioPublishUnavailable',"Publish pre-auth information"],
 ['StudioCloudUnavailable',"Cloud pre-auth information"],
 ['aria-label="Опубликовать приглашение"',"Publish button"],
 ['aria-label="Синхронизация с сервером"',"Cloud button"],
 ['TemplateManager document=',"Template Manager mounted"],
 ['ResponsiveEditor document=',"Responsive editor mounted"],
 ['InspectorTabs value=',"Inspector navigation"],
 ['MotionControls',"Animation Inspector"],
 ['ColorPicker',"Color control"],
 ['AssetLibrary',"Asset manager"],
 ["useCloudAssetUrls","R2 read URL resolution"],
])includes(workspace,action,label);
includes("src/components/studio-v2/studio-v2-print-dialog.tsx","TemplateOutput","Print uses template-grade renderer");
includes("src/components/studio-v2/studio-v2-template-output.tsx","openVectorPrint","Vector print code reachable");
includes("src/components/studio-v2/studio-v2-template-output.tsx","prepareProfessionalPrint","Production print package reachable");

// Backend REST API route matrix: each client path exists in a Nest controller.
const docs="server/src/modules/documents/documents.controller.ts";
const media="server/src/modules/media/media.controller.ts";
const pub="server/src/modules/publications/publications.controller.ts";
const auth="server/src/app.module.ts";
includes("server/src/main.ts",'setGlobalPrefix("api/v1")',"API /api/v1 prefix");
for(const [file,route,label] of [
 [docs,'@Get("projects/:id")',"Project GET"],
 [docs,'@Get("projects/:id/revisions/:number")',"Revision GET"],
 [docs,'@Put("projects/:id/revisions")',"Revision CAS PUT"],
 [pub,'@Post("projects/:projectId/publish")',"Publish POST"],
 [pub,'@Post("projects/:projectId/unpublish")',"Unpublish POST"],
 [pub,'@Get("projects/:projectId/publication")',"Publication metadata GET"],
 [pub,'@Get("projects/:projectId/rsvp/summary")',"RSVP summary GET"],
 [pub,'@Get("projects/:projectId/rsvp")',"Private RSVP list GET"],
 [pub,'@Get("public/invitations/:slug")',"Guest invitation GET"],
 [pub,'@Post("public/invitations/:slug/rsvp")',"Guest RSVP POST"],
 [media,'@Post("uploads")',"R2 signed upload"],
 [media,'@Post(":assetId/complete")',"Media verification"],
 [media,'@Get(":assetId/read-url")',"R2 temporary read URL"],
])includes(file,route,label);
includes(media,'@Controller("workspaces/:workspaceId/media")',"Media route prefix");
includes(auth,"PublicationsModule","Publication dependency registered");
includes(auth,"MediaModule","Media dependency registered");
includes("server/src/modules/publications/publications.controller.ts","@Public()","Anonymous guest endpoints explicitly marked");
includes("src/features/studio-v2/browser/remote-sync.ts",'/rsvp/summary',"Client private RSVPs routed");
includes("src/features/studio-v2/browser/remote-sync.ts",'/revisions/',"Client revision routed");
includes("src/features/studio-v2/browser/remote-sync.ts",'/media/uploads',"Client R2 write routed");

// All Studio inspector number fields use a reusable draft-preserving native number.
for(const path of [
"src/components/studio-v2/studio-v2-workspace.tsx",
"src/components/studio-v2/studio-v2-advanced-properties.tsx",
"src/components/studio-v2/studio-v2-motion-controls.tsx",
"src/components/studio-v2/studio-v2-style-library.tsx",
"src/components/studio-v2/studio-v2-responsive-editor.tsx",
"src/components/studio-v2/studio-v2-invitation-controls.tsx",
"src/components/studio-v2/studio-v2-text-editor.tsx",
"src/components/studio-v2/studio-v2-color-picker.tsx",
"src/components/studio-v2/studio-v2-simple-fields.tsx",
]){
 const content=source(path);
 assert.ok(content.includes("StudioNumberInput"),"Missing shared numeric control: "+path);
 assert.ok(!/<input\b[^>]*\btype="number"/.test(content),"Legacy numeric input escaped audit: "+path);
 checks.push("Shared numeric fields in "+path.split("/").at(-1));
}
console.log("PASS: "+checks.length+" route and feature reachability assertions");
