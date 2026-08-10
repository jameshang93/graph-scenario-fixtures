#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { fetchFixture } = require("./fixture-fetch");

const root = path.join(__dirname, "..");
const scenariosPath = path.join(root, "fixtures", "scenarios", "index.json");

function loadScenarioIndex() {
  if (!fs.existsSync(scenariosPath)) {
    throw new Error("missing scenario pack index: fixtures/scenarios/index.json");
  }
  const index = JSON.parse(fs.readFileSync(scenariosPath, "utf8"));
  if (typeof index !== "object" || index === null || Array.isArray(index)) {
    throw new Error("scenarios/index.json must be an object of named scenario packs");
  }
  return index;
}

function playScenario(packName) {
  const index = loadScenarioIndex();
  if (!(packName in index)) {
    throw new Error(`unknown scenario pack: ${packName}`);
  }
  const fixtureNames = index[packName];
  if (!Array.isArray(fixtureNames) || fixtureNames.length < 1) {
    throw new Error(`scenario pack ${packName} must list at least one fixture`);
  }
  return fixtureNames.map((name) => ({
    fixture: name,
    response: fetchFixture(name)
  }));
}

function selfTest() {
  const index = loadScenarioIndex();
  const requiredPack = "planner-get";
  if (!(requiredPack in index)) {
    throw new Error(`selftest expected pack ${requiredPack}`);
  }
  const steps = playScenario(requiredPack);
  if (steps.length !== index[requiredPack].length) {
    throw new Error("planner-get pack did not resolve all fixtures");
  }
  for (const step of steps) {
    if (!step.response || typeof step.response.body !== "object") {
      throw new Error(`failed to fetch fixture for step ${step.fixture}`);
    }
  }
  const expected = ["user-profile", "planner-task"];
  const actual = index[requiredPack];
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`planner-get pack must be ${JSON.stringify(expected)}`);
  }
  console.log("ok: play-scenario selftest passed");
}

if (require.main === module) {
  const arg = process.argv[2];
  if (arg === "--selftest") {
    selfTest();
  } else if (!arg) {
    console.error("usage: node scripts/play-scenario.js <pack-name|--selftest>");
    process.exit(1);
  } else {
    const steps = playScenario(arg);
    process.stdout.write(JSON.stringify(steps, null, 2));
    process.stdout.write("\n");
  }
}

module.exports = { playScenario, loadScenarioIndex };
