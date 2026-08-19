#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const manifestPath = path.join(root, "fixtures", "manifest.json");

function loadManifest() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (!manifest || !Array.isArray(manifest.fixtures)) {
    throw new Error("fixtures/manifest.json must contain a fixtures array");
  }
  return manifest.fixtures;
}

function queryFixturesByTags(tags) {
  const fixtures = loadManifest();
  if (!Array.isArray(tags) || tags.length < 1) {
    return fixtures;
  }
  const normalized = tags.map((tag) => tag.toLowerCase());
  return fixtures.filter((entry) =>
    Array.isArray(entry.tags) && normalized.every((tag) => entry.tags.map((item) => String(item).toLowerCase()).includes(tag))
  );
}

function parseArgs(argv) {
  const tags = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--tag") {
      const value = argv[i + 1];
      if (!value) {
        throw new Error("--tag requires a value");
      }
      tags.push(value);
      i += 1;
      continue;
    }
    if (arg === "--help") {
      return { help: true, tags: [] };
    }
    throw new Error(`unknown argument: ${arg}`);
  }
  return { help: false, tags };
}

function printHelp() {
  console.log("usage: node scripts/query-manifest.js [--tag <tag>]...");
  console.log("example: node scripts/query-manifest.js --tag calendar --tag user");
}

function main() {
  const { help, tags } = parseArgs(process.argv.slice(2));
  if (help) {
    printHelp();
    return;
  }
  const results = queryFixturesByTags(tags);
  process.stdout.write(JSON.stringify(results, null, 2));
  process.stdout.write("\n");
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

module.exports = { loadManifest, queryFixturesByTags, parseArgs };
