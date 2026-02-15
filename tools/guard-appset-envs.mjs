import fs from "node:fs";
import path from "node:path";

const envs = ["dev", "sit", "uat", "prod"];
const roots = envs.map((env) => `app/manifests/${env}`);
const appsetFiles = [];

for (const root of roots) {
  if (!fs.existsSync(path.resolve(process.cwd(), root))) {
    console.error(`${root}: missing directory`);
    process.exit(1);
  }
  for (const name of fs.readdirSync(path.resolve(process.cwd(), root))) {
    if (name.endsWith("-appset.yaml")) {
      appsetFiles.push(`${root}/${name}`);
    }
  }
}

let failed = false;

for (const file of appsetFiles) {
  const expectedEnv = file.split("/")[2];
  const content = fs.readFileSync(path.resolve(process.cwd(), file), "utf8");
  const envLines = content.match(/^\s*-\s*env:\s*([A-Za-z0-9_-]+)\s*$/gm) || [];
  const parsed = envLines
    .map((line) => line.match(/^\s*-\s*env:\s*([A-Za-z0-9_-]+)\s*$/)?.[1])
    .filter(Boolean);

  if (parsed.length !== 1) {
    console.error(`${file}: expected exactly 1 env entry, found ${parsed.length}`);
    failed = true;
    continue;
  }

  if (parsed[0] !== expectedEnv) {
    console.error(`${file}: expected env "${expectedEnv}", found "${parsed[0]}"`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log("ApplicationSet guard passed: each environment manifest is single-env scoped.");
