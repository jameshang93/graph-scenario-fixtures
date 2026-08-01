#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const calendar = JSON.parse(
  fs.readFileSync(path.join(root, "fixtures", "calendar-list.json"), "utf8")
);
const mail = JSON.parse(
  fs.readFileSync(path.join(root, "fixtures", "mail-page.json"), "utf8")
);
const delta = JSON.parse(
  fs.readFileSync(path.join(root, "fixtures", "delta-calendar.json"), "utf8")
);

function requireFields(obj, fields, label) {
  for (const field of fields) {
    if (!(field in obj)) {
      throw new Error(`${label} missing required field: ${field}`);
    }
  }
}

requireFields(calendar, ["value"], "calendar-list");
if (!Array.isArray(calendar.value) || calendar.value.length < 1) {
  throw new Error("calendar-list.value must be a non-empty array");
}
requireFields(calendar.value[0], ["id", "name"], "calendar-list.value[0]");

requireFields(mail, ["value", "@odata.nextLink"], "mail-page");
if (!Array.isArray(mail.value) || mail.value.length < 1) {
  throw new Error("mail-page.value must be a non-empty array");
}
requireFields(mail.value[0], ["id", "subject"], "mail-page.value[0]");

requireFields(delta, ["value", "@odata.deltaLink"], "delta-calendar");
if (!Array.isArray(delta.value) || delta.value.length < 1) {
  throw new Error("delta-calendar.value must be a non-empty array");
}
const removed = delta.value.find((item) => item["@removed"]);
if (!removed) {
  throw new Error("delta-calendar should include at least one @removed item");
}

console.log("ok: fixtures look valid");
