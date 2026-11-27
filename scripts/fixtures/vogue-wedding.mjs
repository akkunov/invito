import {readFile} from "node:fs/promises";
import {createServer} from "node:http";

const port = Number(process.env.VF02_FIXTURE_PORT ?? 4283);
const appOrigin = new URL(process.env.VF02_APP_ORIGIN ?? "http://127.0.0.1:4282").origin;
const packagePath = process.argv[2] ?? new URL("../../templates/packages/vogue-wedding.v1.json", import.meta.url);
const version = "9aa5a875-fff4-4d92-ba35-a7f43e00a306";
const catalog = "/api/v1/catalog/templates/vogue-wedding";
const guest = "/api/v1/public/customer-invitations/vogue-wedding";
const invitations = new Set([guest, guest + "-long", guest + "-closed", guest + "-unavailable"]);

createServer(async (request, response) => {
  const reply = (status, body) => response.writeHead(status, {"Content-Type": "application/json"}).end(JSON.stringify(body));
  response.setHeader("Access-Control-Allow-Origin", appOrigin);
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (request.method === "OPTIONS") return response.writeHead(204).end();

  try {
    const path = new URL(request.url, appOrigin).pathname;
    if (request.method === "GET" && path === "/api/v1/catalog/music") return reply(200, {tracks: []});
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
      if (path.endsWith("-long")) {
        document.values.coupleNames.value = {
          ru: "Александра Константинопольская\nи Тимур Абдрахманов",
          ky: "Айгүл Абдырахманова\nжана Темир Кыдыралиев",
        };
      }
      if (path.endsWith("-closed")) document.nodes.rsvpPage_rsvpWidget.block.deadline = "2024-01-01T00:00:00Z";
      return reply(200, {
        slug: path.split("/").at(-1), release: 1, sha256: "fixture", document, mediaUrls: {},
        rsvpEnabled: !path.endsWith("-unavailable"), turnstileSiteKey: null,
      });
    }
    return reply(404, {});
  } catch {
    return reply(500, {});
  }
}).listen(port, "127.0.0.1", () => console.log(`Vogue Wedding fixture at http://127.0.0.1:${port}`));
