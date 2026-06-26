#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const options = {};
for (let i = 0; i < args.length; i += 2) {
  const key = args[i];
  const value = args[i + 1];
  if (!key || !key.startsWith('--') || value === undefined) {
    throw new Error('Usage: node scripts/convert-qx-to-loon.js --source <file> --output <file> --repo <owner/repo> --base <raw-base> --script <name=url> [--tag <name>]');
  }
  options[key.slice(2)] = value;
}

const source = required('source');
const outputFile = required('output');
const repo = required('repo');
const scriptMap = parseScriptMap(options.script || '');
const tagOverride = options.tag || ''; 
const iconUrl = options.icon || '';

function required(key) {
  if (!options[key]) throw new Error(`Missing --${key}`);
  return options[key];
}

function parseScriptMap(value) {
  const map = new Map();
  if (!value) return map;
  for (const pair of value.split(',')) {
    if (!pair.trim()) continue;
    const index = pair.indexOf('=');
    if (index === -1) throw new Error(`Bad --script mapping: ${pair}`);
    map.set(pair.slice(0, index), pair.slice(index + 1));
  }
  return map;
}

function convertScriptUrl(url) {
  for (const [needle, replacement] of scriptMap.entries()) {
    if (url.includes(needle)) return replacement;
  }
  return url;
}

const input = fs.readFileSync(source, 'utf8');
const lines = input.split(/\r?\n/);
const meta = [];
const rewrites = [];
const scripts = [];
let hostname = '';

for (const raw of lines) {
  const line = raw.trim();
  if (!line) continue;

  if (line.startsWith('#!')) {
    meta.push(line);
    continue;
  }

  if (/^hostname\s*=/.test(line)) {
    hostname = line.replace(/^hostname\s*=\s*/, '').trim();
    continue;
  }

  const rejectMatch = line.match(/^(.*?)\s+url\s+reject(?:-dict)?\s*$/);
  if (rejectMatch) {
    rewrites.push(`${rejectMatch[1]} reject-dict`);
    continue;
  }

  const responseScriptMatch = line.match(/^(.*?)\s+url\s+script-response-body\s+(\S+)\s*$/);
  if (responseScriptMatch) {
    scripts.push(`http-response ${responseScriptMatch[1]} script-path=${convertScriptUrl(responseScriptMatch[2])}, requires-body=true, timeout=60, tag=${tag()}${scriptIcon()}`);
    continue;
  }

  const requestHeaderScriptMatch = line.match(/^(.*?)\s+url\s+script-request-header\s+(\S+)\s*$/);
  if (requestHeaderScriptMatch) {
    scripts.push(`http-request ${requestHeaderScriptMatch[1]} script-path=${convertScriptUrl(requestHeaderScriptMatch[2])}, requires-body=false, timeout=60, tag=${tag()}${scriptIcon()}`);
    continue;
  }
}

const name = normalizeMeta(meta.find((x) => x.startsWith('#!name')) || '#!name=Converted Plugin');
const author = normalizeMeta(meta.find((x) => x.startsWith('#!author')) || '#!author=unknown');
const update = normalizeMeta(meta.find((x) => x.startsWith('#!update')) || '');

const sections = [
  name,
  '#!desc=由 Quantumult X snippet 自动转换为 Loon 插件，自动同步上游更新。',
  author,
  update,
  `#!homepage=https://github.com/${repo}`,
  ...(iconUrl ? [`#!icon=${iconUrl}`] : []),
  '',
]; 
if (rewrites.length) sections.push('[Rewrite]', ...rewrites, '');
if (scripts.length) sections.push('[Script]', ...scripts, '');
if (hostname) sections.push('[MITM]', `hostname = ${hostname}`, '');

const output = sections.join('\n');

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, output);
console.log(`Generated ${outputFile}: ${rewrites.length} rewrite rules, ${scripts.length} script rules.`);

function normalizeMeta(value) {
  return value.replace(/\s*=\s*/, '=');
}

function tag() {
  if (tagOverride) return tagOverride;
  return name.replace(/^#!name=/, '');
}

function scriptIcon() {
  return iconUrl ? `, img-url=${iconUrl}` : '';
}
