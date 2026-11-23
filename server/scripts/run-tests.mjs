import {readdirSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {join} from "node:path";
import {fileURLToPath} from "node:url";

const root=fileURLToPath(new URL("../",import.meta.url));
const mode=process.argv[2]??"unit";
if(!["unit","e2e"].includes(mode)){
  console.error("Usage: node scripts/run-tests.mjs unit|e2e");
  process.exit(2);
}
if(mode==="e2e"&&(!process.env.DATABASE_URL||!process.env.DIRECT_DATABASE_URL)){
  console.error("E2E tests require DATABASE_URL and DIRECT_DATABASE_URL pointing to a disposable PostgreSQL database. Never point E2E tests at a production database.");
  process.exit(2);
}
const files=readdirSync(join(root,"test"))
  .filter(name=>name.endsWith(".test.ts")&&
    (mode==="e2e"?name.endsWith(".e2e.test.ts"):!name.endsWith(".e2e.test.ts")))
  .sort()
  .map(name=>join(root,"test",name));
if(!files.length){
  console.error("No "+mode+" test files found.");
  process.exit(2);
}
const result=spawnSync(process.execPath,["--import","tsx","--test",...files],{
  cwd:root,env:process.env,stdio:"inherit",shell:false,
});
if(result.error){console.error(result.error);process.exit(1);}
process.exit(result.status??1);
