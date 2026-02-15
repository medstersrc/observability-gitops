import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const transitions = {
  dev: "sit",
  sit: "uat",
  uat: "prod",
};

function titleCase(env) {
  return env.charAt(0).toUpperCase() + env.slice(1);
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: false });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function copyFile(source, target) {
  const from = path.resolve(process.cwd(), source);
  const to = path.resolve(process.cwd(), target);
  if (!fs.existsSync(from)) {
    throw new Error(`Missing source file: ${source}`);
  }
  fs.copyFileSync(from, to);
}

function promotePolicyFile(sourceEnv, targetEnv) {
  const sourcePath = path.resolve(process.cwd(), "policies", "gateway", "env", `${sourceEnv}.mjs`);
  const targetPath = path.resolve(process.cwd(), "policies", "gateway", "env", `${targetEnv}.mjs`);
  const source = fs.readFileSync(sourcePath, "utf8");

  const fromUpper = sourceEnv.toUpperCase();
  const toUpper = targetEnv.toUpperCase();
  const fromTitle = titleCase(sourceEnv);
  const toTitle = titleCase(targetEnv);

  const promoted = source
    .replaceAll(`"${fromUpper}-`, `"${toUpper}-`)
    .replaceAll(`${fromTitle} `, `${toTitle} `)
    .replaceAll(` in ${sourceEnv} `, ` in ${targetEnv} `)
    .replaceAll(` in ${fromTitle} `, ` in ${toTitle} `);

  fs.writeFileSync(targetPath, promoted, "utf8");
}

function main() {
  const sourceEnv = process.argv[2];
  const targetEnv = process.argv[3];

  if (!sourceEnv || !targetEnv) {
    console.error("Usage: node tools/promote-env.mjs <source-env> <target-env>");
    process.exit(1);
  }

  const expectedTarget = transitions[sourceEnv];
  if (expectedTarget !== targetEnv) {
    console.error(`Invalid promotion path: ${sourceEnv} -> ${targetEnv}. Expected ${sourceEnv} -> ${expectedTarget || "none"}.`);
    process.exit(1);
  }

  copyFile(
    `helm/otel-collector/values/${sourceEnv}/daemon.yaml`,
    `helm/otel-collector/values/${targetEnv}/daemon.yaml`
  );

  promotePolicyFile(sourceEnv, targetEnv);
  run("node", ["tools/render-gateway-values.mjs", targetEnv]);
  run("node", ["tools/report-gateway-policies.mjs"]);

  console.log(`Promotion prepared: ${sourceEnv} -> ${targetEnv}`);
}

main();
