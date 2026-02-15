import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ENVS = ["dev", "sit", "uat", "prod"];

function toRuleRecord(env, rule) {
  const {
    id,
    name,
    owner,
    purpose,
    signal,
    action,
    services = ["*"],
    namespaces = ["*"],
  } = rule;

  return {
    env,
    id,
    name,
    owner,
    purpose,
    signal,
    action,
    services,
    namespaces,
  };
}

function toBusinessMarkdown(records) {
  const now = new Date().toISOString();
  const lines = [];
  lines.push("# Gateway Policy Report (Business View)");
  lines.push("");
  lines.push(`Generated: ${now}`);
  lines.push("");

  for (const env of ENVS) {
    const envRecords = records.filter((record) => record.env === env);
    lines.push(`## ${env.toUpperCase()}`);
    lines.push("");
    if (envRecords.length === 0) {
      lines.push("No policies defined.");
      lines.push("");
      continue;
    }

    for (const record of envRecords) {
      lines.push(`### ${record.id} - ${record.name}`);
      lines.push("");
      lines.push(`- Owner: ${record.owner}`);
      lines.push(`- Purpose: ${record.purpose}`);
      lines.push(`- Signal: ${record.signal}`);
      lines.push(`- Action: ${record.action}`);
      lines.push(`- Services: ${record.services.join(", ")}`);
      lines.push(`- Namespaces: ${record.namespaces.join(", ")}`);
      lines.push("");
    }
  }

  return `${lines.join("\n")}\n`;
}

async function loadEnvRules(repoRoot, env) {
  const envFile = path.resolve(repoRoot, "policies", "gateway", "env", `${env}.mjs`);
  const module = await import(pathToFileURL(envFile).href);

  if (Array.isArray(module.rules)) {
    return module.rules.map((rule) => toRuleRecord(env, rule));
  }
  if (Array.isArray(module.fragments)) {
    return module.fragments.map((_, index) => ({
      env,
      id: `${env.toUpperCase()}-LEGACY-${index + 1}`,
      name: "Legacy fragment without metadata",
      owner: "unknown",
      purpose: "Not declared",
      signal: "unknown",
      action: "unknown",
      services: ["*"],
      namespaces: ["*"],
    }));
  }
  return [];
}

async function main() {
  const repoRoot = process.cwd();
  const reportsDir = path.resolve(repoRoot, "reports");
  fs.mkdirSync(reportsDir, { recursive: true });

  const records = [];
  for (const env of ENVS) {
    const envRules = await loadEnvRules(repoRoot, env);
    records.push(...envRules);
  }

  const technical = {
    generatedAt: new Date().toISOString(),
    envs: ENVS,
    policies: records,
  };

  fs.writeFileSync(
    path.resolve(reportsDir, "policies-technical.json"),
    `${JSON.stringify(technical, null, 2)}\n`,
    "utf8"
  );

  fs.writeFileSync(
    path.resolve(reportsDir, "policies-business.md"),
    toBusinessMarkdown(records),
    "utf8"
  );

  console.log(`Rendered ${path.resolve(reportsDir, "policies-technical.json")}`);
  console.log(`Rendered ${path.resolve(reportsDir, "policies-business.md")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
