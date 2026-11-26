#!/usr/bin/env node
/**
 * ============================================================
 *  preflight.js —— 上传前自检
 *  跑一遍，把「传上去才发现的错」提前挡掉
 *  用法：node preflight.js
 * ============================================================
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..', 'family-menu')
const errors = []
const warns = []
const oks = []

function read(p) {
  return fs.readFileSync(path.join(ROOT, p), 'utf8')
}
function exists(p) {
  return fs.existsSync(path.join(ROOT, p))
}

/* ---------- 1. AppID ---------- */
let pc = {}
try {
  pc = JSON.parse(read('project.config.json'))
} catch (e) {
  errors.push('project.config.json 不是合法 JSON')
}

if (!pc.appid || pc.appid === 'touristappid') {
  errors.push('appid 还是占位值 touristappid —— 打开 project.config.json 改成你自己的（后台：设置 → 基本设置 → AppID）')
} else if (!/^wx[0-9a-f]{16}$/.test(pc.appid)) {
  warns.push('appid 格式看起来不像微信的（一般是 wx + 16 位十六进制），确认一下')
} else {
  oks.push('appid 已填写：' + pc.appid)
}

/* ---------- 2. 页面文件完整性 ---------- */
let appJson = {}
try {
  appJson = JSON.parse(read('app.json'))
} catch (e) {
  errors.push('app.json 不是合法 JSON')
}

const pages = appJson.pages || []
let missing = []
pages.forEach(function (p) {
  ;['js', 'wxml', 'wxss', 'json'].forEach(function (ext) {
    if (!exists(p + '.' + ext)) missing.push(p + '.' + ext)
  })
})
if (missing.length) {
  errors.push('页面文件缺失：' + missing.join(', '))
} else {
  oks.push('页面文件齐全（' + pages.length + ' 个页面）')
}

/* ---------- 3. 权限声明 ---------- */
const pkg = (appJson.permission || {})['scope.userLocation']
if (!pkg || !pkg.desc) {
  warns.push('app.json 缺少 scope.userLocation 的 desc，地图选点会失败')
} else {
  oks.push('位置权限已声明')
}

const priv = appJson.requiredPrivateInfos || []
if (priv.indexOf('chooseLocation') < 0) {
  warns.push('app.json 的 requiredPrivateInfos 里没有 chooseLocation，餐厅选址会失败')
} else {
  oks.push('requiredPrivateInfos 已声明')
}

/* ---------- 4. 数据模式 / 云环境 ---------- */
const cfgSrc = read('config/index.js')
const isCloud = /mode:\s*'cloud'/.test(cfgSrc)
const envEmpty = /cloudEnv:\s*''/.test(cfgSrc)

if (isCloud && envEmpty) {
  errors.push('mode 已设为 cloud，但 cloudEnv 是空的 —— 填上云开发环境 ID，或先改回 local')
} else if (isCloud) {
  oks.push('云开发模式，环境 ID 已填')
} else {
  warns.push('mode = local：家人之间看不到彼此的数据。要全家共用，请开通云开发并把 mode 改成 cloud（见 README 第三节）')
}

/* ---------- 5. 上传密钥 ---------- */
if (!exists('private.key')) {
  warns.push('没有 private.key —— 命令行上传需要它（后台 → 开发管理 → 开发设置 → 小程序代码上传 → 生成密钥）')
} else {
  oks.push('上传密钥已就位')
}

/* ---------- 6. 体积 ---------- */
function dirSize(dirPath) {
  let total = 0
  fs.readdirSync(dirPath).forEach(function (name) {
    if (name === 'node_modules' || name === '.git' || name === 'private.key') return
    const p = path.join(dirPath, name)
    const st = fs.statSync(p)
    if (st.isDirectory()) total += dirSize(p)
    else total += st.size
  })
  return total
}
const size = dirSize(ROOT)
if (size > 2 * 1024 * 1024) {
  errors.push('代码包 ' + (size / 1024 / 1024).toFixed(2) + 'MB，超过主包 2MB 上限')
} else {
  oks.push('代码包 ' + (size / 1024).toFixed(0) + 'KB（上限 2MB）')
}

/* ---------- 输出 ---------- */
console.log('\n' + '='.repeat(46))
console.log('  发布前自检')
console.log('='.repeat(46))

if (oks.length) {
  console.log('\n✅ 通过')
  oks.forEach(function (s) {
    console.log('   · ' + s)
  })
}

if (warns.length) {
  console.log('\n⚠️  提醒（不阻塞上传）')
  warns.forEach(function (s) {
    console.log('   · ' + s)
  })
}

if (errors.length) {
  console.log('\n❌ 必须修好才能上传')
  errors.forEach(function (s, i) {
    console.log('   ' + (i + 1) + '. ' + s)
  })
}

console.log('\n' + '-'.repeat(46))
console.log(
  errors.length
    ? '  结论：还有 ' + errors.length + ' 项阻塞，先改完'
    : '  结论：可以上传'
)
console.log('-'.repeat(46) + '\n')

process.exit(errors.length ? 1 : 0)
