#!/usr/bin/env node
const fs = require('fs');

const TASK_URL = 'https://raw.githubusercontent.com/githunan/loon-plugins/main/plugins/kuwo/scripts/kuwotask.js';
const FALLBACK_QUERY = 'https://integralapi.kuwo.cn/api/v1/online/sign/getExchangeAward?loginUid=${uid}&loginSid=${sid}&platform=ios&source=kwplayer_ip_11.1.0.0_TJ.ipa&version=11.1.0.0&quotaId=13&exchangeType=vip';

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function looksLikeErrorPage(text) {
  const head = text.slice(0, 300).toLowerCase();
  return head.startsWith('<!doctype html') || head.startsWith('<html');
}

function isTaskScript(text) {
  return text.length > 5000
    && text.includes('酷我音乐')
    && text.includes('async function Convert')
    && text.includes('getExchangeAward')
    && text.includes('integralapi.kuwo.cn')
    && !looksLikeErrorPage(text);
}

function isExchangeSource(text) {
  return text.length > 5000
    && text.includes('酷我音乐')
    && text.includes('async function Convert')
    && /getExchangeAward\?[^`'"]*exchangeType=vip/.test(text)
    && !looksLikeErrorPage(text);
}

function exchangeQuery(text) {
  const match = text.match(/getExchangeAward\?[^`'"]*exchangeType=vip[^`'"]*/);
  if (!match) return null;
  return match[0]
    .replace(/\$\{loginUid\}/g, '${uid}')
    .replace(/\$\{loginSid\}/g, '${sid}');
}

function convertFunction(query) {
  return `async function Convert(ID) {
    const [uid, sid] = ID.split('@');
    let success = false;
    const url = \`https://integralapi.kuwo.cn/api/v1/online/sign/${query}\`;
    await $.http.get({ url, headers: kw_headers }).then(resp => {
        try {
            $.log("🟡正在执行会员兑换任务...");
            const o = JSON.parse(resp.body);
            let desc;
            if (o.code === 200 && o.msg === "success" && o.success === true) {
                desc = o.data.description;
                if (desc === "成功") {
                    success = true;
                    desc = \`🎉会员兑换: \${desc}\`;
                } else if (desc === "您的余额不足，继续做任务赚金币吧") {
                    desc = \`🔴会员兑换: \${desc}\`;
                } else if (desc === "用户未登录") {
                    desc = \`🔴会员兑换: \${desc}\`;
                } else {
                    desc = \`⚠️会员兑换: \${desc}\`;
                }
            } else {
                desc = \`❌会员兑换: 错误!\`;
                $.log(resp.body);
            }
            $.log(desc);
            notifyMsg.push(desc);
        } catch (e) {
            const desc = \`❌会员兑换: 解析失败 \${e.message}\`;
            $.log(desc);
            notifyMsg.push(desc);
        }
    }).catch(err => {
        const desc = \`❌会员兑换: 请求失败 \${err.message}\`;
        $.log(desc);
        notifyMsg.push(desc);
    });
    return success;
}
`;
}

function replaceConvert(text, query) {
  const start = text.search(/async function Convert\s*\(/);
  if (start < 0) return null;
  const next = text.slice(start + 1).search(/\n(?:async )?function /);
  if (next < 0) return null;
  const end = start + 1 + next;
  return text.slice(0, start) + convertFunction(query) + text.slice(end);
}

function rewriteScript(upstreamText, query) {
  const rewritten = upstreamText.replace(
    /https:\/\/raw\.githubusercontent\.com\/ios151\/Rewrite\/\S*?\/kuwotask\.js/g,
    TASK_URL
  );
  return replaceConvert(rewritten, query);
}

function argValue(name) {
  const index = process.argv.indexOf(name);
  if (index < 0 || !process.argv[index + 1]) return '';
  return process.argv[index + 1];
}

const mode = process.argv[2];

if (mode === '--accept-task') {
  process.exit(isTaskScript(read(process.argv[3])) ? 0 : 1);
}

if (mode === '--accept-exchange') {
  process.exit(isExchangeSource(read(process.argv[3])) ? 0 : 1);
}

if (mode === '--apply') {
  const upstreamFile = argValue('--upstream');
  const outputFile = argValue('--output');
  const generalFile = argValue('--general');
  const upstreamText = read(upstreamFile);
  if (!isTaskScript(upstreamText)) {
    console.error('Kuwo upstream is not the sign-in script; leaving the local script in place.');
    process.exit(1);
  }

  let query = FALLBACK_QUERY;
  if (generalFile && fs.existsSync(generalFile)) {
    const fromGeneral = exchangeQuery(read(generalFile));
    if (fromGeneral) query = fromGeneral;
  } else if (fs.existsSync(outputFile)) {
    const fromLocal = exchangeQuery(read(outputFile));
    if (fromLocal) query = fromLocal;
  }

  const next = rewriteScript(upstreamText, query);
  if (!next || !next.includes('platform=ios') || !next.includes(TASK_URL)) {
    console.error('Kuwo exchange patch did not apply; leaving the local script in place.');
    process.exit(1);
  }

  const current = fs.existsSync(outputFile) ? read(outputFile) : '';
  if (current !== next) fs.writeFileSync(outputFile, next);
  process.exit(0);
}

console.error('Usage: sync-kuwo.js --accept-task|--accept-exchange|--apply');
process.exit(1);
