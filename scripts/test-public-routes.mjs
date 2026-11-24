import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { setTimeout } from "node:timers/promises";

// Run after npm run build. Child server and HTTP checks share the same network.
const port = 3137;
const base = `http://127.0.0.1:${port}`;
const cloud = createServer((request, response) => {
  const url = new URL(request.url, base);
  const search = url.searchParams.get("search");
  const page = Number(url.searchParams.get("page"));
  if (url.pathname !== "/api/v1/catalog/templates") {
    response.writeHead(404).end();
    return;
  }
  const found = !search || search === "Cloud wedding";
  const items = found ? [{
    id: "catalog-ci", slug: page === 2 ? "cloud-second" : "cloud-wedding", name: "Cloud wedding",
    description: "", category: "WEDDING", tags: [], version: 1, coverUrl: null,
    updatedAt: "2026-11-24T00:00:00.000Z",
  }] : [];
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify({items, total: found ? 13 : 0, page, limit: 12, nextPage: found && page === 1 ? 2 : null}));
});
await new Promise(resolve => cloud.listen(0, "127.0.0.1", resolve));
const api = `http://127.0.0.1:${cloud.address().port}/api/v1`;
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  env: {...process.env, API_INTERNAL_URL: api},
  stdio: ["ignore", "pipe", "pipe"],
});
let logs = "";
server.stdout.on("data", chunk => { logs += chunk; });
server.stderr.on("data", chunk => { logs += chunk; });
const ids = ["editorial-riviera-wedding", "editorial-monochrome-wedding", "wedding-travel-santorini"];

async function read(path, expected = 200) {
  const response = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(5000) });
  assert.equal(response.status, expected, path);
  return response.text();
}

try {
  let ready = false;
  const deadline = Date.now() + 12_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(logs);
    try { if ((await fetch(`${base}/ru`, { signal: AbortSignal.timeout(1000) })).ok) { ready = true; break; } } catch {}
    await setTimeout(100);
  }
  assert.ok(ready, `Server did not become ready: ${logs}`);
  for (const locale of ["ru", "ky"]) {
    const home = await read(`/${locale}`);
    assert.match(home, /ed-showcase-stage/);
    assert.match(home, /aria-pressed="true"/);
    const catalog = await read(`/${locale}/templates`);
    for (const id of ids) assert.ok(catalog.includes(`/${locale}/templates/${id}`), `Missing ${id}`);
    const cloudOnly = await read(`/${locale}/templates?search=Cloud+wedding`);
    assert.ok(cloudOnly.includes(`/${locale}/catalog/cloud-wedding`));
    assert.doesNotMatch(cloudOnly, /catalog-empty/);
    assert.match(cloudOnly, /page=2/);
    const nextCloudPage = await read(`/${locale}/templates?search=Cloud+wedding&page=2`);
    assert.ok(nextCloudPage.includes(`/${locale}/catalog/cloud-second`));
    const priced = await read(`/${locale}/templates?search=Cloud+wedding&price=free`);
    assert.ok(!priced.includes(`/${locale}/catalog/cloud-wedding`));
    assert.match(priced, /catalog-empty/);
    const empty = await read(`/${locale}/templates?search=does-not-exist-37`);
    assert.match(empty, /catalog-empty/);
    for (const id of ids) {
      const detail = await read(`/${locale}/templates/${id}`);
      assert.ok(detail.includes(`/${locale}/editor?template=${id}`));
      const embed = await read(`/${locale}/templates/${id}?preview=1`);
      assert.match(embed, /invitation-embed/);
      assert.ok(!embed.includes('class="site-header"'), "Embedded invitation must omit navigation");
    }
    await read(`/${locale}/editor?template=${ids[0]}`);
    await read(`/${locale}/templates/unknown-template`, 404);
  }
  console.log("PASS: RU/KY home, catalog, empty results, all template/detail/embed routes, editor entry and 404");
} finally {
  server.kill("SIGTERM");
  cloud.close();
}
