#!/usr/bin/env node
/**
 * Ensures every ${VAR} substitution in root Compose files is documented in
 * .env.example so operator copy-paste drift is caught in CI (AURA-239).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const composeFiles = ["docker-compose.yml", "docker-compose.bff.yml"];

function extractSubstitutionVars(yamlText) {
  const names = new Set();
  const re = /\$\{([A-Z][A-Z0-9_]*)/g;
  let m;
  while ((m = re.exec(yamlText)) !== null) {
    names.add(m[1]);
  }
  return names;
}

function isDocumentedInEnvExample(envExample, varName) {
  const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `(?:^|\\n)#\\s*${escaped}(?:\\s|=|$)|(?:^|\\n)${escaped}\\s*=`,
    "m",
  ).test(envExample);
}

const vars = new Set();
for (const file of composeFiles) {
  const text = readFileSync(join(root, file), "utf8");
  for (const v of extractSubstitutionVars(text)) {
    vars.add(v);
  }
}

const envExample = readFileSync(join(root, ".env.example"), "utf8");
const missing = [...vars].filter((v) => !isDocumentedInEnvExample(envExample, v)).sort();

if (missing.length > 0) {
  console.error(
    "check-compose-env-example: these Compose substitution vars are missing from .env.example:\n  " +
      missing.join("\n  "),
  );
  process.exit(1);
}

console.log(
  `check-compose-env-example: OK (${vars.size} vars across ${composeFiles.join(", ")})`,
);
