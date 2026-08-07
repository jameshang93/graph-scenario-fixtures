#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const fixturesDir = path.join(root, "fixtures");

const DEFAULT_STATUS = 200;
const DEFAULT_HEADERS = {
  "content-type": "application/json;odata.metadata=minimal;odata.streaming=true;IEEE754Compatible=false;charset=utf-8"
};

function resolveFixturePath(name) {
  const base = name.endsWith(".json") ? name : `${name}.json`;
  const fixturePath = path.join(fixturesDir, base);
  if (!fs.existsSync(fixturePath)) {
    throw new Error(`unknown fixture: ${name}`);
  }
  return fixturePath;
}

function fetchFixture(name, options = {}) {
  const fixturePath = resolveFixturePath(name);
  const body = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  return {
    status: options.status ?? DEFAULT_STATUS,
    headers: { ...DEFAULT_HEADERS, ...(options.headers || {}) },
    body
  };
}

function selfTest() {
  const cases = [
    ["user-profile", (result) => result.body.displayName === "Alex Morgan"],
    ["drive-item", (result) => result.body.name === "QuarterlyReport.docx"],
    ["teams-chat-message", (result) => Array.isArray(result.body.value)]
  ];

  for (const [name, assertFn] of cases) {
    const result = fetchFixture(name);
    if (result.status !== DEFAULT_STATUS) {
      throw new Error(`${name}: expected status ${DEFAULT_STATUS}`);
    }
    if (!result.headers["content-type"]) {
      throw new Error(`${name}: missing content-type header`);
    }
    if (!assertFn(result)) {
      throw new Error(`${name}: body assertion failed`);
    }
  }

  try {
    fetchFixture("missing-fixture");
    throw new Error("expected unknown fixture to throw");
  } catch (err) {
    if (!String(err.message).includes("unknown fixture")) {
      throw err;
    }
  }

  console.log("ok: fixture-fetch selftest passed");
}

if (require.main === module) {
  const arg = process.argv[2];
  if (arg === "--selftest") {
    selfTest();
  } else if (!arg) {
    console.error("usage: node scripts/fixture-fetch.js <fixture-name|--selftest>");
    process.exit(1);
  } else {
    process.stdout.write(JSON.stringify(fetchFixture(arg), null, 2));
    process.stdout.write("\n");
  }
}

module.exports = { fetchFixture, resolveFixturePath };
