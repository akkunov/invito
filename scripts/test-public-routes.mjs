import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout } from "node:timers/promises";

// Run after npm run build. Child server and HTTP checks share the same network.
const port = 3137;
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], { stdio: ["ignore", "pipe", "pipe"] });
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
  for (let attempt = 0; attempt < 10; attempt++) {
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
}
