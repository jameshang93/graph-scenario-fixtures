#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const calendar = JSON.parse(fs.readFileSync(path.join(root, "fixtures", "calendar-list.json"), "utf8"));
const mail = JSON.parse(fs.readFileSync(path.join(root, "fixtures", "mail-page.json"), "utf8"));
const delta = JSON.parse(fs.readFileSync(path.join(root, "fixtures", "delta-calendar.json"), "utf8"));
const err429 = JSON.parse(fs.readFileSync(path.join(root, "fixtures", "graph-error-429.json"), "utf8"));
const batch = JSON.parse(fs.readFileSync(path.join(root, "fixtures", "batch-response.json"), "utf8"));
const notification = JSON.parse(fs.readFileSync(path.join(root, "fixtures", "change-notification.json"), "utf8"));

function requireFields(obj, fields, label) {
  for (const field of fields) {
    if (!(field in obj)) throw new Error(`${label} missing required field: ${field}`);
  }
}

requireFields(calendar, ["value"], "calendar-list");
if (!Array.isArray(calendar.value) || calendar.value.length < 1) throw new Error("calendar-list.value must be a non-empty array");
requireFields(calendar.value[0], ["id", "name"], "calendar-list.value[0]");

requireFields(mail, ["value", "@odata.nextLink"], "mail-page");
if (!Array.isArray(mail.value) || mail.value.length < 1) throw new Error("mail-page.value must be a non-empty array");
requireFields(mail.value[0], ["id", "subject"], "mail-page.value[0]");

requireFields(delta, ["value", "@odata.deltaLink"], "delta-calendar");
if (!Array.isArray(delta.value) || delta.value.length < 1) throw new Error("delta-calendar.value must be a non-empty array");
if (!delta.value.find((item) => item["@removed"])) throw new Error("delta-calendar should include at least one @removed item");

requireFields(err429, ["error"], "graph-error-429");
requireFields(err429.error, ["code", "message"], "graph-error-429.error");
if (err429.error.code !== "TooManyRequests") throw new Error("graph-error-429.error.code must be TooManyRequests");

requireFields(batch, ["responses"], "batch-response");
if (!Array.isArray(batch.responses) || batch.responses.length < 2) throw new Error("batch-response.responses must include at least two items");
for (const item of batch.responses) requireFields(item, ["id", "status", "body"], `batch-response.responses[${item.id}]`);
if (!batch.responses.find((item) => item.status === 429)) throw new Error("batch-response should include a 429 response for retry tests");

requireFields(notification, ["value"], "change-notification");
if (!Array.isArray(notification.value) || notification.value.length < 1) throw new Error("change-notification.value must be a non-empty array");
requireFields(notification.value[0], ["subscriptionId", "changeType", "resource", "clientState"], "change-notification.value[0]");

console.log("ok: fixtures look valid");
