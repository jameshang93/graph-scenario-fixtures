#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { checkSchema, loadSchema } = require("./schema-check");

const root = path.join(__dirname, "..");
const calendar = JSON.parse(fs.readFileSync(path.join(root, "fixtures", "calendar-list.json"), "utf8"));
const mail = JSON.parse(fs.readFileSync(path.join(root, "fixtures", "mail-page.json"), "utf8"));
const delta = JSON.parse(fs.readFileSync(path.join(root, "fixtures", "delta-calendar.json"), "utf8"));
const err429 = JSON.parse(fs.readFileSync(path.join(root, "fixtures", "graph-error-429.json"), "utf8"));
const batch = JSON.parse(fs.readFileSync(path.join(root, "fixtures", "batch-response.json"), "utf8"));
const notification = JSON.parse(fs.readFileSync(path.join(root, "fixtures", "change-notification.json"), "utf8"));
const driveItem = JSON.parse(fs.readFileSync(path.join(root, "fixtures", "drive-item.json"), "utf8"));
const teamsChat = JSON.parse(fs.readFileSync(path.join(root, "fixtures", "teams-chat-message.json"), "utf8"));
const userProfile = JSON.parse(fs.readFileSync(path.join(root, "fixtures", "user-profile.json"), "utf8"));
const todoTaskList = JSON.parse(fs.readFileSync(path.join(root, "fixtures", "todo-task-list.json"), "utf8"));
const contact = JSON.parse(fs.readFileSync(path.join(root, "fixtures", "contact.json"), "utf8"));
const plannerTask = JSON.parse(fs.readFileSync(path.join(root, "fixtures", "planner-task.json"), "utf8"));

function requireFields(obj, fields, label) {
  for (const field of fields) {
    if (!(field in obj)) throw new Error(`${label} missing required field: ${field}`);
  }
}

function requireODataContext(obj, label) {
  requireFields(obj, ["@odata.context"], label);
  if (typeof obj["@odata.context"] !== "string" || !obj["@odata.context"].startsWith("https://graph.microsoft.com/")) {
    throw new Error(`${label}.@odata.context must be a Graph metadata URL`);
  }
}

requireODataContext(userProfile, "user-profile");
requireFields(userProfile, ["id", "displayName", "mail", "userPrincipalName"], "user-profile");
if (typeof userProfile.id !== "string" || userProfile.id.length < 1) {
  throw new Error("user-profile.id must be a non-empty string");
}
if (typeof userProfile.mail !== "string" || !userProfile.mail.includes("@")) {
  throw new Error("user-profile.mail must look like an email address");
}

requireODataContext(contact, "contact");
requireFields(contact, ["id", "displayName", "emailAddresses", "givenName", "surname"], "contact");
if (!Array.isArray(contact.emailAddresses) || contact.emailAddresses.length < 1) {
  throw new Error("contact.emailAddresses must be a non-empty array");
}
requireFields(contact.emailAddresses[0], ["address"], "contact.emailAddresses[0]");
if (typeof contact.emailAddresses[0].address !== "string" || !contact.emailAddresses[0].address.includes("@")) {
  throw new Error("contact.emailAddresses[0].address must look like an email address");
}

requireODataContext(plannerTask, "planner-task");
requireFields(plannerTask, ["id", "title", "percentComplete", "planId"], "planner-task");
if (typeof plannerTask.id !== "string" || plannerTask.id.length < 1) {
  throw new Error("planner-task.id must be a non-empty string");
}
if (typeof plannerTask.title !== "string" || plannerTask.title.length < 1) {
  throw new Error("planner-task.title must be a non-empty string");
}
if (typeof plannerTask.percentComplete !== "number" || plannerTask.percentComplete < 0 || plannerTask.percentComplete > 100) {
  throw new Error("planner-task.percentComplete must be a number between 0 and 100");
}
if (typeof plannerTask.planId !== "string" || plannerTask.planId.length < 1) {
  throw new Error("planner-task.planId must be a non-empty string");
}

requireODataContext(calendar, "calendar-list");
requireFields(calendar, ["value"], "calendar-list");
if (!Array.isArray(calendar.value) || calendar.value.length < 1) throw new Error("calendar-list.value must be a non-empty array");
requireFields(calendar.value[0], ["id", "name"], "calendar-list.value[0]");

requireODataContext(mail, "mail-page");
requireFields(mail, ["value", "@odata.nextLink"], "mail-page");
if (!Array.isArray(mail.value) || mail.value.length < 1) throw new Error("mail-page.value must be a non-empty array");
requireFields(mail.value[0], ["id", "subject"], "mail-page.value[0]");

requireODataContext(delta, "delta-calendar");
requireFields(delta, ["value", "@odata.deltaLink"], "delta-calendar");
if (!Array.isArray(delta.value) || delta.value.length < 1) throw new Error("delta-calendar.value must be a non-empty array");
if (!delta.value.find((item) => item["@removed"])) throw new Error("delta-calendar should include at least one @removed item");

requireFields(err429, ["error"], "graph-error-429");
requireFields(err429.error, ["code", "message"], "graph-error-429.error");
if (err429.error.code !== "TooManyRequests") throw new Error("graph-error-429.error.code must be TooManyRequests");

requireFields(batch, ["responses"], "batch-response");
if (!Array.isArray(batch.responses) || batch.responses.length < 2) throw new Error("batch-response.responses must include at least two items");
for (const item of batch.responses) {
  requireFields(item, ["id", "status", "body"], `batch-response.responses[${item.id}]`);
  if (typeof item.status !== "number") throw new Error(`batch-response.responses[${item.id}].status must be a number`);
}
if (!batch.responses.find((item) => item.status === 429)) throw new Error("batch-response should include a 429 response for retry tests");

requireFields(notification, ["value"], "change-notification");
if (!Array.isArray(notification.value) || notification.value.length < 1) throw new Error("change-notification.value must be a non-empty array");
requireFields(notification.value[0], ["subscriptionId", "changeType", "resource", "clientState"], "change-notification.value[0]");
requireFields(notification.value[0], ["resourceData"], "change-notification.value[0]");
requireFields(notification.value[0].resourceData, ["id"], "change-notification.value[0].resourceData");

requireODataContext(driveItem, "drive-item");
requireFields(driveItem, ["id", "name", "size"], "drive-item");
if (!driveItem.file || typeof driveItem.file.mimeType !== "string") {
  throw new Error("drive-item.file.mimeType must be a string");
}

requireODataContext(teamsChat, "teams-chat-message");
requireFields(teamsChat, ["value"], "teams-chat-message");
if (!Array.isArray(teamsChat.value) || teamsChat.value.length < 1) {
  throw new Error("teams-chat-message.value must be a non-empty array");
}
requireFields(teamsChat.value[0], ["id", "chatId", "messageType", "body"], "teams-chat-message.value[0]");
requireFields(teamsChat.value[0].body, ["contentType", "content"], "teams-chat-message.value[0].body");
requireFields(teamsChat.value[0], ["from"], "teams-chat-message.value[0]");
requireFields(teamsChat.value[0].from, ["user"], "teams-chat-message.value[0].from");
requireFields(teamsChat.value[0].from.user, ["displayName", "userIdentityType"], "teams-chat-message.value[0].from.user");

requireODataContext(todoTaskList, "todo-task-list");
requireFields(todoTaskList, ["value"], "todo-task-list");
if (!Array.isArray(todoTaskList.value) || todoTaskList.value.length < 1) {
  throw new Error("todo-task-list.value must be a non-empty array");
}
requireFields(todoTaskList.value[0], ["id", "title", "status", "importance"], "todo-task-list.value[0]");
const validStatuses = new Set(["notStarted", "inProgress", "completed", "waitingOnOthers", "deferred"]);
for (const [index, task] of todoTaskList.value.entries()) {
  if (!validStatuses.has(task.status)) {
    throw new Error(`todo-task-list.value[${index}].status must be a valid todoTask status`);
  }
  requireFields(task, ["body"], `todo-task-list.value[${index}]`);
  requireFields(task.body, ["contentType", "content"], `todo-task-list.value[${index}].body`);
}

const manifest = JSON.parse(fs.readFileSync(path.join(root, "fixtures", "manifest.json"), "utf8"));
const fixturesDir = path.join(root, "fixtures");

requireFields(manifest, ["fixtures"], "manifest");
if (!Array.isArray(manifest.fixtures) || manifest.fixtures.length < 1) {
  throw new Error("manifest.fixtures must be a non-empty array");
}

const manifestFiles = new Set();
for (const entry of manifest.fixtures) {
  requireFields(entry, ["file", "tags"], "manifest.fixtures[]");
  if (typeof entry.file !== "string" || entry.file.length < 1) {
    throw new Error("manifest.fixtures[].file must be a non-empty string");
  }
  if (entry.file === "manifest.json") {
    throw new Error("manifest must not list manifest.json");
  }
  if (!Array.isArray(entry.tags) || entry.tags.length < 1) {
    throw new Error(`manifest entry ${entry.file} must include at least one tag`);
  }
  for (const tag of entry.tags) {
    if (typeof tag !== "string" || tag.length < 1) {
      throw new Error(`manifest entry ${entry.file} has an invalid tag`);
    }
  }
  if (manifestFiles.has(entry.file)) {
    throw new Error(`manifest lists duplicate file: ${entry.file}`);
  }
  manifestFiles.add(entry.file);
  const fixturePath = path.join(fixturesDir, entry.file);
  if (!fs.existsSync(fixturePath)) {
    throw new Error(`manifest references missing fixture: ${entry.file}`);
  }
}

const fixtureFiles = fs.readdirSync(fixturesDir)
  .filter((name) => name.endsWith(".json") && name !== "manifest.json")
  .sort();
for (const file of fixtureFiles) {
  if (!manifestFiles.has(file)) {
    throw new Error(`fixture file is not listed in manifest: ${file}`);
  }
}
if (manifestFiles.size !== fixtureFiles.length) {
  throw new Error("manifest fixture count does not match fixtures directory");
}

const scenariosPath = path.join(fixturesDir, "scenarios", "index.json");
if (!fs.existsSync(scenariosPath)) {
  throw new Error("missing scenario pack index: fixtures/scenarios/index.json");
}
const scenarioIndex = JSON.parse(fs.readFileSync(scenariosPath, "utf8"));
if (typeof scenarioIndex !== "object" || scenarioIndex === null || Array.isArray(scenarioIndex)) {
  throw new Error("scenarios/index.json must be an object of named scenario packs");
}

function resolveFixtureFile(name) {
  const base = name.endsWith(".json") ? name : `${name}.json`;
  return base;
}

for (const [packName, fixtureNames] of Object.entries(scenarioIndex)) {
  if (typeof packName !== "string" || packName.length < 1) {
    throw new Error("scenario pack name must be a non-empty string");
  }
  if (!Array.isArray(fixtureNames) || fixtureNames.length < 1) {
    throw new Error(`scenario pack ${packName} must list at least one fixture`);
  }
  for (const fixtureName of fixtureNames) {
    if (typeof fixtureName !== "string" || fixtureName.length < 1) {
      throw new Error(`scenario pack ${packName} has an invalid fixture name`);
    }
    const file = resolveFixtureFile(fixtureName);
    if (!manifestFiles.has(file)) {
      throw new Error(`scenario pack ${packName} references unknown fixture: ${fixtureName}`);
    }
    const fixturePath = path.join(fixturesDir, file);
    if (!fs.existsSync(fixturePath)) {
      throw new Error(`scenario pack ${packName} references missing fixture file: ${file}`);
    }
  }
}

const schemaChecks = [
  ["drive-item", driveItem],
  ["teams-chat-message", teamsChat],
  ["user-profile", userProfile],
  ["todo-task-list", todoTaskList]
];
for (const [name, fixture] of schemaChecks) {
  const schema = loadSchema(root, name);
  checkSchema(fixture, schema, name);
}

console.log("ok: fixtures look valid");
