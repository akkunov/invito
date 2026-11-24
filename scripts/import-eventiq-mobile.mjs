import {readFileSync, statSync} from "node:fs";

const [workspaceId] = process.argv.slice(2);
const token = process.env.EVENTIQ_ACCESS_TOKEN;
if (!workspaceId || !token) {
  throw new Error("Usage: EVENTIQ_ACCESS_TOKEN=… node scripts/import-eventiq-mobile.mjs <workspaceId>");
}

const api = new URL(process.env.EVENTIQ_API_BASE ?? "http://localhost:4000/api/v1");
const localHttp = api.protocol === "http:" && ["localhost", "127.0.0.1"].includes(api.hostname);
if ((!localHttp && api.protocol !== "https:") || api.username || api.password || api.search || api.hash) {
  throw new Error("Use HTTPS for a remote Eventiq API.");
}
const base = api.href.replace(/\/$/, "");
const pack = JSON.parse(readFileSync(new URL("../templates/packages/eventiq-mobile.v1.json", import.meta.url), "utf8"));

for (const asset of Object.values(pack.document.assets)) {
  const image = new URL("../public" + asset.storageKey, import.meta.url);
  if (statSync(image).size !== asset.sizeBytes) throw new Error("Unexpected image size: " + asset.storageKey);
}

const catalog = await fetch(base + "/catalog/music");
if (!catalog.ok) throw new Error("Music catalog returned HTTP " + catalog.status);
const {tracks} = await catalog.json();
const music = pack.personalization.fields.find(field => field.kind === "music");
const defaultTrackId = process.env.EVENTIQ_DEFAULT_MUSIC_ID;
const defaultTrack = tracks.find(track => track.id === defaultTrackId);
if (defaultTrackId && !defaultTrack) throw new Error("The default music ID is missing from the Eventiq catalog.");
const sources = tracks.map(track => track.source);
if (defaultTrack) {
  pack.document.nodes[music.nodeId].block.source = defaultTrack.source;
  sources.unshift(defaultTrack.source);
}
music.sources = [...new Set(sources)].slice(0, 50);

const response = await fetch(base + "/workspaces/" + encodeURIComponent(workspaceId) + "/template-packages/import", {
  method: "POST",
  headers: {"Authorization": "Bearer " + token, "Content-Type": "application/json"},
  body: JSON.stringify(pack),
});
if (response.status === 409) throw new Error("The workspace already contains the eventiq-mobile template.");
if (!response.ok) throw new Error("Template import returned HTTP " + response.status + ": " + await response.text());
const {id, slug, latestVersion} = await response.json();
console.log(JSON.stringify({id, slug, latestVersion}));
