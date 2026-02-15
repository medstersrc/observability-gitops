import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function deepMerge(target, source) {
  if (!isObject(target) || !isObject(source)) {
    return source;
  }

  const out = { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (Array.isArray(value)) {
      out[key] = [...value];
      continue;
    }
    if (isObject(value) && isObject(out[key])) {
      out[key] = deepMerge(out[key], value);
      continue;
    }
    out[key] = value;
  }
  return out;
}

function shouldQuoteKey(key) {
  return !/^[A-Za-z0-9_.-]+$/.test(key);
}

function quoteString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function formatScalar(value) {
  if (value === null) {
    return "null";
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return quoteString(value);
}

function toYaml(value, indent = 0) {
  const space = " ".repeat(indent);

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (isObject(item) || Array.isArray(item)) {
          return `${space}-\n${toYaml(item, indent + 2)}`;
        }
        return `${space}- ${formatScalar(item)}`;
      })
      .join("\n");
  }

  if (isObject(value)) {
    const lines = [];
    for (const [rawKey, child] of Object.entries(value)) {
      const key = shouldQuoteKey(rawKey) ? quoteString(rawKey) : rawKey;
      if (isObject(child) || Array.isArray(child)) {
        lines.push(`${space}${key}:`);
        lines.push(toYaml(child, indent + 2));
      } else {
        lines.push(`${space}${key}: ${formatScalar(child)}`);
      }
    }
    return lines.join("\n");
  }

  return `${space}${formatScalar(value)}`;
}

async function main() {
  const env = process.argv[2];
  if (!env) {
    console.error("Usage: node tools/render-gateway-values.mjs <dev|sit|uat|prod>");
    process.exit(1);
  }

  const repoRoot = process.cwd();
  const envFile = path.resolve(repoRoot, "policies", "gateway", "env", `${env}.mjs`);
  if (!fs.existsSync(envFile)) {
    console.error(`Missing policy env file: ${envFile}`);
    process.exit(1);
  }

  const loaded = await import(pathToFileURL(envFile).href);
  const fragments = Array.isArray(loaded.fragments)
    ? loaded.fragments
    : Array.isArray(loaded.rules)
      ? loaded.rules.map((rule) => rule.fragment)
      : null;

  if (!Array.isArray(fragments)) {
    console.error(`Policy env file must export "fragments" or "rules": ${envFile}`);
    process.exit(1);
  }

  let merged = {};
  for (const fragment of fragments) {
    merged = deepMerge(merged, fragment);
  }

  if (!merged.opentelemetryCollector) {
    console.error('Merged policy is missing root key "opentelemetryCollector".');
    process.exit(1);
  }

  const output = {
    "opentelemetry-collector": merged.opentelemetryCollector,
  };

  const targetPath = path.resolve(
    repoRoot,
    "helm",
    "otel-collector",
    "values",
    env,
    "gateway.yaml"
  );

  fs.writeFileSync(targetPath, `${toYaml(output)}\n`, "utf8");
  console.log(`Rendered ${targetPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
