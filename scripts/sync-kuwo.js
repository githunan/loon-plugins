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

function once(text, from, to) {
  const found = text.indexOf(from);
  if (found < 0 || text.indexOf(from, found + from.length) !== -1) return null;
  return text.replace(from, to);
}

function enableExchangeSwitch(text) {
  const steps = [
    [
      'let args = { phone: "", ocr: "", notify: "1" };',
      'let args = { phone: "", ocr: "", notify: "1", exchange: "1" };',
    ],
    [
      'args.notify = input[2] !== undefined ? input[2] : "1";',
      'args.notify = input[2] !== undefined ? input[2] : "1";\n            args.exchange = input[3] !== undefined ? input[3] : "1";',
    ],
    [
      `            if (input.notify !== undefined) {
                args.notify = (input.notify === true || input.notify === "true" || input.notify === "1" || input.notify === 1) ? "1" : "0";
            }`,
      `            if (input.notify !== undefined) {
                args.notify = (input.notify === true || input.notify === "true" || input.notify === "1" || input.notify === 1) ? "1" : "0";
            }
            if (input.exchange !== undefined) {
                args.exchange = (input.exchange === true || input.exchange === "true" || input.exchange === "1" || input.exchange === 1) ? "1" : "0";
            }`,
    ],
    [
      '        args.notify = String(args.notify || "1");\n        return args;',
      '        args.notify = String(args.notify || "1");\n        args.exchange = (args.exchange === true || args.exchange === "true" || args.exchange === "1" || args.exchange === 1) ? "1" : "0";\n        return args;',
    ],
    [
      `        if (args.notify) {
            args.notify = (args.notify === "true" || args.notify === "1") ? "1" : "0";
        }`,
      `        if (args.notify) {
            args.notify = (args.notify === "true" || args.notify === "1") ? "1" : "0";
        }
        args.exchange = (args.exchange === "true" || args.exchange === "1") ? "1" : "0";`,
    ],
    [
      `        if (arr[2] !== undefined) {
            args.notify = (arr[2].trim() === "true" || arr[2].trim() === "1") ? "1" : "0";
        }`,
      `        if (arr[2] !== undefined) {
            args.notify = (arr[2].trim() === "true" || arr[2].trim() === "1") ? "1" : "0";
        }
        if (arr[3] !== undefined) {
            args.exchange = (arr[3].trim() === "true" || arr[3].trim() === "1") ? "1" : "0";
        }`,
    ],
    [
      '    NOTIFY: ARGS.notify || "1",\n    KEY: "cookie_kuwo_v2"',
      '    NOTIFY: ARGS.notify || "1",\n    EXCHANGE: ARGS.exchange === "1" ? "1" : "0",\n    KEY: "cookie_kuwo_v2"',
    ],
    [
      'console.log(`每次通知: ${ARGS.notify === "1" ? "开启" : "关闭(仅汇总)"}`);',
      'console.log(`每次通知: ${ARGS.notify === "1" ? "开启" : "关闭(仅汇总)"}`);\nconsole.log(`兑换会员: ${ARGS.exchange === "1" ? "开启" : "关闭"}`);',
    ],
  ];
  let next = text;
  for (const [from, to] of steps) {
    next = once(next, from, to);
    if (!next) return null;
  }
  return next;
}

function convertFunction(query) {
  return `async function Convert(ID) {
    const [uid, sid] = ID.split('@');
    let success = false;
    if (CONFIG.EXCHANGE !== "1") {
        $.log("会员兑换: 已关闭");
        return success;
    }
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
  const withSwitch = enableExchangeSwitch(rewritten);
  if (!withSwitch) return null;
  return replaceConvert(withSwitch, query);
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
  if (!next || !next.includes('platform=ios') || !next.includes(TASK_URL) || !next.includes('CONFIG.EXCHANGE') || !next.includes('会员兑换: 已关闭')) {
    console.error('Kuwo exchange patch did not apply; leaving the local script in place.');
    process.exit(1);
  }

  const current = fs.existsSync(outputFile) ? read(outputFile) : '';
  if (current !== next) fs.writeFileSync(outputFile, next);
  process.exit(0);
}

console.error('Usage: sync-kuwo.js --accept-task|--accept-exchange|--apply');
process.exit(1);
