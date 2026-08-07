"use strict";

function typeOf(value) {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}

function checkSchema(value, schema, label) {
  if (schema.type && typeOf(value) !== schema.type) {
    throw new Error(`${label} must be type ${schema.type}`);
  }

  if (schema.type === "object") {
    if (Array.isArray(schema.required)) {
      for (const field of schema.required) {
        if (!(field in value)) {
          throw new Error(`${label} missing required field: ${field}`);
        }
      }
    }
    if (schema.properties) {
      for (const [key, childSchema] of Object.entries(schema.properties)) {
        if (key in value) {
          checkSchema(value[key], childSchema, `${label}.${key}`);
        }
      }
    }
  }

  if (schema.type === "array") {
    if (typeof schema.minItems === "number" && value.length < schema.minItems) {
      throw new Error(`${label} must have at least ${schema.minItems} items`);
    }
    if (schema.items) {
      value.forEach((item, index) => {
        checkSchema(item, schema.items, `${label}[${index}]`);
      });
    }
  }
}

function loadSchema(root, name) {
  const fs = require("fs");
  const path = require("path");
  const schemaPath = path.join(root, "schemas", `${name}.schema.json`);
  return JSON.parse(fs.readFileSync(schemaPath, "utf8"));
}

module.exports = { checkSchema, loadSchema };
