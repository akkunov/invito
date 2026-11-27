import {readFile} from "node:fs/promises";
import {createServer} from "node:http";

export function serveCollectionFixture({name, slug, port, appOrigin, packagePath, version, scenarios, configure, demoAudio}) {
  const catalog = "/api/v1/catalog/templates/" + slug;
  const guest = "/api/v1/public/customer-invitations/" + slug;
  const invitations = new Set(["", ...scenarios].map(suffix => guest + suffix));

  createServer(async (request, response) => {
    const reply = (status, body) => response.writeHead(status, {"Content-Type": "application/json"}).end(JSON.stringify(body));
    response.setHeader("Access-Control-Allow-Origin", appOrigin);
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");

    try {
      const path = new URL(request.url, appOrigin).pathname;
      if (request.method === "OPTIONS") return response.writeHead(204).end();
      if (request.method === "GET" && path === "/api/v1/catalog/music") return reply(200, {tracks: []});
      if (request.method === "GET" && path === "/qa-tone.mp3" && demoAudio) {
        return response.writeHead(200, {"Content-Type": "audio/mpeg"}).end(await readFile(demoAudio));
      }
      if (request.method === "POST" && path === guest + "/rsvp") {
        const chunks = [];
        for await (const chunk of request) chunks.push(chunk);
        const {name} = JSON.parse(Buffer.concat(chunks).toString());
        await new Promise(resolve => setTimeout(resolve, 450));
        return reply(name === "Сбой" ? 503 : 201, {});
      }
      if (request.method === "GET" && (path === catalog || invitations.has(path))) {
        const {manifest, document, personalization} = JSON.parse(await readFile(packagePath, "utf8"));
        if (path === catalog) return reply(200, {...manifest, templateVersionId: version, document, personalization, mediaUrls: {}});
        const suffix = path.slice(guest.length);
        const mediaUrls = configure(document, suffix) ?? {};
        if (suffix === "-closed") document.nodes.rsvpPage_rsvpWidget.block.deadline = "2024-01-01T00:00:00Z";
        return reply(200, {
          slug: path.split("/").at(-1), release: 1, sha256: "fixture", document, mediaUrls,
          rsvpEnabled: suffix !== "-unavailable", turnstileSiteKey: null,
        });
      }
      return reply(404, {});
    } catch {
      return reply(500, {});
    }
  }).listen(port, "127.0.0.1", () => console.log(`${name} fixture at http://127.0.0.1:${port}`));
}
