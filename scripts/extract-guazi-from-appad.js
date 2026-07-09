#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2];
const outputPath = process.argv[3];
const repo = process.argv[4] || 'githunan/loon-plugins';

if (!inputPath || !outputPath) {
  throw new Error('Usage: node scripts/extract-guazi-from-appad.js <input> <output> [repo]');
}

const lines = fs.readFileSync(inputPath, 'utf8').split(/\r?\n/);
let inRewrite = false;
let inMitm = false;
let collectGuazi = false;
const rewrites = [];
let hostname = '';

for (const raw of lines) {
  const line = raw.trim();
  if (!line) continue;

  if (line === '[Rewrite]') {
    inRewrite = true;
    inMitm = false;
    continue;
  }
  if (line === '[MITM]') {
    inRewrite = false;
    inMitm = true;
    continue;
  }
  if (line.startsWith('[')) {
    inRewrite = false;
    inMitm = false;
    continue;
  }

  if (inRewrite) {
    if (line.includes('# 瓜子影视')) {
      collectGuazi = true;
      continue;
    }
    if (collectGuazi) {
      if (line.startsWith('#')) {
        collectGuazi = false;
        continue;
      }
      const match = line.match(/^(.*?)\s+-\s+(reject(?:-dict|-200)?)\s*$/i);
      if (match) {
        rewrites.push(`${match[1]} ${match[2].toLowerCase()}`);
      }
    }
  }

  if (inMitm && /^hostname\s*=/.test(line)) {
    const value = line.replace(/^hostname\s*=\s*/, '').trim();
    const hosts = value.split(',').map(s => s.trim()).filter(Boolean);
    const allow = new Set([
      'sdapi.s3432pr.com', 'apinew.8hpt2duq.com', 'api.8b42w67.com', 'api.4pmyvfz.com',
      'api.1000gxf.com', 'api.ainitpz.com', 'api.5fcgcnn.com', 'api.hpdgjnf.com',
      'api.wyw68fg.com', 'api.hpfcqfh.com', 'api.dzjxekd.com', 'api.qxutcee.com',
      'api.fkkejucm.com', 'api.sh75d6qk.com', 'api.gq89em.com', 'api.chgjaq4.com',
      'api.cbvbqtz.com', 'api.gdj2a3qy.com', 'api.7gmsut2m.com', 'api.4hnovel.com',
      'gzapi.*.com', 'jk.*.com'
    ]);
    hostname = hosts.filter(h => allow.has(h)).join(', ');
  }
}

const output = [
  '#!name=瓜子影视净化',
  '#!desc=从 chxm1023/Advertising 的 AppAD.plugin 提取瓜子影视相关规则，自动同步上游更新。',
  '#!author=@ddm1023 / extracted by githunan',
  `#!homepage=https://github.com/${repo}`,
  '#!icon=https://raw.githubusercontent.com/githunan/loon-plugins/main/plugins/tilingsales/assets/icon.jpg',
  '',
  '[Rewrite]',
  ...rewrites,
  '',
  '[MITM]',
  `hostname = ${hostname}`,
  ''
].join('\n');

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output);
console.log(`Generated ${outputPath}: ${rewrites.length} rewrite rules, ${hostname ? hostname.split(',').length : 0} hosts.`);
