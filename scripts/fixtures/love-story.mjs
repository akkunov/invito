import {readFile} from "node:fs/promises";
import {createServer} from "node:http";

const port = Number(process.env.VF01_FIXTURE_PORT ?? 4281);
const appOrigin = process.env.VF01_APP_ORIGIN ?? "http://127.0.0.1:4280";
const packagePath = process.argv[2] ?? new URL("../../templates/packages/love-story.v1.json", import.meta.url);
const version = "692e3ce4-8b41-48be-b39b-c093be771c68";
const catalogPath = "/api/v1/catalog/templates/love-story";
const publicPath = "/api/v1/public/customer-invitations/love-story";
const views = new Set([publicPath, publicPath + "-long", publicPath + "-closed", publicPath + "-unavailable", publicPath + "-silent"]);
const demoSource = "asset:9f71594c-5a5c-4afa-aeee-9d06a5a6d645";
const demoAudio = new URL("./media/qa-tone.mp3", import.meta.url);

createServer(async (request, response) => {
  const reply = (status, body) => response.writeHead(status, {"Content-Type": "application/json"}).end(JSON.stringify(body));
  response.setHeader("Access-Control-Allow-Origin", appOrigin);
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (request.method === "OPTIONS") return response.writeHead(204).end();

  try {
    const path = new URL(request.url, appOrigin).pathname;
    if(request.method==="GET"&&path==="/qa-tone.mp3"){
      const audio=await readFile(demoAudio);
      return response.writeHead(200,{"Content-Type":"audio/mpeg","Content-Length":audio.length}).end(audio);
    }
    if(request.method==="GET"&&path==="/api/v1/catalog/music")return reply(200,{tracks:[]});
    if (request.method === "POST" && path === publicPath + "/rsvp") {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const {name} = JSON.parse(Buffer.concat(chunks).toString());
      await new Promise(resolve => setTimeout(resolve, 450));
      return reply(name === "Сбой" ? 503 : 201, {});
    }
    if (request.method === "GET" && (path === catalogPath || views.has(path))) {
      const {manifest, document, personalization} = JSON.parse(await readFile(packagePath, "utf8"));
      if (path === catalogPath) return reply(200, {...manifest, templateVersionId: version, document, personalization, mediaUrls: {}});
      if (path.endsWith("-long")) {
        document.values.coupleNames.value = {
          ru: "Александра Константинопольская\nи Тимур Абдрахманов",
          ky: "Айгүл Абдырахманова\nжана Темир Кыдыралиев",
        };
        document.values.meetingDescription.value = {
          ru: "Мы встретились в путешествии и продолжили общаться после возвращения. ".repeat(3).trim(),
          ky: "Биз саякатта жолугуп, үйгө келгенден кийин да байланышты уланттык. ".repeat(3).trim(),
        };
      }
      if (path.endsWith("-closed")) document.nodes.rsvpPage_rsvpWidget.block.deadline = "2024-01-01T00:00:00Z";
      const music=document.nodes.rsvpPage_music;
      const mediaUrls={};
      if(music?.appearance.preset==="stationery"&&!path.endsWith("-silent")){
        music.block.source=demoSource;
        mediaUrls[demoSource]="http://127.0.0.1:"+port+"/qa-tone.mp3";
      }
      return reply(200, {
        slug: path.split("/").at(-1), release: 1, sha256: "fixture", document,
        mediaUrls, rsvpEnabled: !path.endsWith("-unavailable"), turnstileSiteKey: null,
      });
    }
    return reply(404, {});
  } catch {
    return reply(500, {});
  }
}).listen(port, "127.0.0.1", () => console.log(`Love Story fixture at http://127.0.0.1:${port}`));
