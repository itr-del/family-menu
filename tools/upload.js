#!/usr/bin/env node
/**
 * ============================================================
 *  upload.js —— 命令行上传小程序代码（不用打开开发者工具）
 *
 *  用法：
 *    npm i
 *    MP_APPID=wx1234567890abcdef node upload.js upload
 *    MP_APPID=wx1234567890abcdef node upload.js preview
 *
 *  需要：
 *   1. 小程序后台 → 管理 → 开发管理 → 开发设置 → 小程序代码上传
 *      → 生成「代码上传密钥」→ 下载，存成本目录下的 private.key
 *   2. 同页面配置 IP 白名单（或用「关闭 IP 白名单」）
 *
 *  可选环境变量：
 *   MP_KEY      密钥文件路径，默认 ./private.key
 *   MP_VERSION  版本号，默认 1.0.0
 *   MP_DESC     版本备注
 *   MP_ROBOT    机器人编号 1-30，默认 1
 * ============================================================
 */

const path = require('path')
const fs = require('fs')

const ROOT = path.join(__dirname, '..', 'family-menu')
const action = process.argv[2] || 'upload'
const appid = process.env.MP_APPID || ''
const keyPath = process.env.MP_KEY || path.join(ROOT, 'private.key')
const version = process.env.MP_VERSION || '1.0.0'
const desc = process.env.MP_DESC || '家庭点菜 · ' + new Date().toLocaleString('zh-CN')
const robot = Number(process.env.MP_ROBOT || 1)

function die(msg, tips) {
  console.error('\n❌ ' + msg)
  if (tips) console.error('\n' + tips)
  process.exit(1)
}

if (!appid) {
  die(
    '缺少 MP_APPID',
    '  示例：MP_APPID=wx1234567890abcdef node upload.js upload\n' +
      '  appid 在小程序后台 → 设置 → 基本设置 里看'
  )
}

if (!fs.existsSync(keyPath)) {
  die(
    '找不到代码上传密钥：' + keyPath,
    '  1. 登录 mp.weixin.qq.com（用小程序管理员）\n' +
      '  2. 管理 → 开发管理 → 开发设置 → 小程序代码上传 → 生成并下载密钥\n' +
      '  3. 把下载的文件改名为 private.key，放到本目录\n' +
      '  4. 同一页配置 IP 白名单，或点「关闭 IP 白名单」'
  )
}

let ci
try {
  ci = require('miniprogram-ci')
} catch (e) {
  die(
    '没装 miniprogram-ci',
    '  在项目目录执行：npm install miniprogram-ci'
  )
}

const project = new ci.Project({
  appid: appid,
  type: 'miniProgram',
  projectPath: ROOT,
  privateKeyPath: keyPath,
  ignores: ['node_modules/**/*', 'upload.js', 'README.md', 'package*.json', '*.key']
})

async function main() {
  console.log('📦 项目：' + ROOT)
  console.log('🆔 AppID：' + appid)
  console.log('🔧 动作：' + action + '\n')

  if (action === 'preview') {
    const out = path.join(ROOT, 'preview.jpg')
    const r = await ci.preview({
      project,
      desc: desc,
      setting: { es6: true, minify: true, autoPrefixWXSS: true },
      qrcodeFormat: 'image',
      qrcodeOutputDest: out,
      robot
    })
    console.log('✅ 预览二维码已生成：' + out)
    console.log(JSON.stringify(r, null, 2))
    return
  }

  if (action === 'upload') {
    const r = await ci.upload({
      project,
      version: version,
      desc: desc,
      setting: { es6: true, minify: true, autoPrefixWXSS: true },
      robot,
      onProgressUpdate(info) {
        if (info && info._msg) process.stdout.write('  ' + info._msg + '\n')
      }
    })
    console.log('\n✅ 上传成功，版本 ' + version)
    console.log('   下一步：小程序后台 → 管理 → 版本管理')
    console.log('   → 找到「开发版本」→ 选为体验版（家人就能扫码用）')
    console.log(JSON.stringify(r, null, 2))
    return
  }

  die('不认识的动作：' + action + '（只支持 upload / preview）')
}

main().catch(function (err) {
  const msg = String(err && err.message ? err.message : err)
  let tips = ''
  if (/ip|白名单|whitelist/i.test(msg)) {
    tips =
      '  当前机器的出口 IP 不在白名单里。\n' +
      '  去小程序后台 → 开发管理 → 开发设置 → 小程序代码上传 → IP 白名单\n' +
      '  把报错里显示的 IP 加进去，或直接点「关闭 IP 白名单」\n'
  }
  if (/privateKey|key|密钥/i.test(msg)) {
    tips = '  密钥文件可能下载错了或已失效，重新生成一次即可（旧的会作废）\n'
  }
  die('上传失败：' + msg, tips)
})
