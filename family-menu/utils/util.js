// utils/util.js —— 零依赖小工具

/** 生成短 id */
function uid(prefix) {
  return (prefix || 'x') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

/** 补零 */
function pad(n) {
  return n < 10 ? '0' + n : '' + n
}

/** 2026-11-18 */
function ymd(d) {
  const t = d || new Date()
  return t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate())
}

/** 11月18日 周三 */
function friendlyDate(d) {
  const t = d || new Date()
  const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][t.getDay()]
  return t.getMonth() + 1 + '月' + t.getDate() + '日 ' + week
}

/** 14:05 */
function hhmm(d) {
  const t = d || new Date()
  return pad(t.getHours()) + ':' + pad(t.getMinutes())
}

/** 深拷贝（结构简单，够用） */
function clone(o) {
  return JSON.parse(JSON.stringify(o))
}

/** 轻提示 */
function toast(title, icon) {
  wx.showToast({ title: title || '', icon: icon || 'none', duration: 1600 })
}

module.exports = { uid, pad, ymd, friendlyDate, hhmm, clone, toast }
