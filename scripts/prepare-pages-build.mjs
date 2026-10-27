#!/usr/bin/env node
import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const client = path.join(root, "dist", "client");
const index = path.join(client, "index.html");

if (!existsSync(index)) throw new Error(`Missing Pages build input: ${index}`);
copyFileSync(index, path.join(client, "404.html"));
console.log("Prepared GitHub Pages fallback: dist/client/404.html");
