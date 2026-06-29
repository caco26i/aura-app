#!/usr/bin/env node
/**
 * Ensures every ${VAR} substitution in root Compose files is documented in
 * .env.example and web/docs/DEPLOY.md so operator copy-paste drift is caught
 * in CI (AURA-239, AURA-282).
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
const deployMd = readFileSync(join(root, "web/docs/DEPLOY.md"), "utf8");

const missingEnvExample = [...vars]
  .filter((v) => !isDocumentedInEnvExample(envExample, v))
  .sort();
const missingDeploy = [...vars].filter((v) => !deployMd.includes(v)).sort();

let failed = false;

if (missingEnvExample.length > 0) {
  failed = true;
  console.error(
    "check-compose-env-example: these Compose substitution vars are missing from .env.example:\n  " +
      missingEnvExample.join("\n  "),
  );
}

if (missingDeploy.length > 0) {
  failed = true;
  console.error(
    "check-compose-env-example: these Compose substitution vars are missing from web/docs/DEPLOY.md:\n  " +
      missingDeploy.join("\n  "),
  );
}

if (failed) {
  process.exit(1);
}

console.log(
  `check-compose-env-example: OK (${vars.size} vars in .env.example + DEPLOY.md across ${composeFiles.join(", ")})`,
);
