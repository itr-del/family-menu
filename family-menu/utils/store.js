/**
 * ============================================================
 *  utils/store.js —— 唯一的数据出入口
 *
 *  上层页面只调这里的方法，不关心数据存在哪。
 *  config.mode 一改，本地存储 / 云开发自动切换，页面代码不用动。
 *
 *  所有方法都是 async，统一 Promise，方便以后换后端。
 * ============================================================
 */

const cfg = require('../config/index')
const seed = require('../config/dishes')
const seedShops = require('../config/shops')
const { uid } = require('./util')

const K = {
  dishes: 'fm_dishes',
  orders: 'fm_orders',
  settings: 'fm_settings',
  shops: 'fm_shops'
}

// 云开发集合名（在云开发控制台里建这两个集合，权限选「所有用户可读写」）
const C = {
  menu: 'fm_menu',
  order: 'fm_order',
  setting: 'fm_setting',
  shop: 'fm_shop'
}

function isCloud() {
  return cfg.mode === 'cloud'
}

let _db = null
function db() {
  if (!_db) _db = wx.cloud.database()
  return _db
}

/* ============================================================
 * 菜品
 * ========================================================== */

/** 取菜单（首次会写入种子数据） */
async function getDishes() {
  let list = null
  try {
    if (isCloud()) {
      const r = await db().collection(C.menu).doc('main').get()
      list = r.data && r.data.items
    } else {
      list = wx.getStorageSync(K.dishes)
    }
  } catch (e) {
    // 云端还没建记录，正常，走种子
    list = null
  }

  if (!list || !list.length) {
    list = seed.map(function (d) {
      return Object.assign({}, d)
    })
    try {
      await saveDishes(list)
    } catch (e) {
      // 云端集合没建、没权限时不要连累整个页面，先用内存里的种子数据顶着
      console.warn('[菜单] 初始数据写入失败，本次使用内存数据', e)
    }
  }
  return list
}

/** 整份菜单写回 */
async function saveDishes(list) {
  if (isCloud()) {
    await db()
      .collection(C.menu)
      .doc('main')
      .set({ data: { items: list, updatedAt: Date.now() } })
  } else {
    wx.setStorageSync(K.dishes, list)
  }
  return list
}

/** 新增一道菜 */
async function addDish(dish) {
  const list = await getDishes()
  const item = Object.assign(
    { id: uid('d'), name: '', cat: '', emoji: '🍽', desc: '', tags: [], on: true },
    dish
  )
  list.unshift(item)
  await saveDishes(list)
  return item
}

/** 改一道菜（patch 只需传要改的字段） */
async function updateDish(id, patch) {
  const list = await getDishes()
  const i = list.findIndex(function (d) {
    return d.id === id
  })
  if (i < 0) return null
  list[i] = Object.assign({}, list[i], patch)
  await saveDishes(list)
  return list[i]
}

/** 删一道菜 */
async function removeDish(id) {
  const list = await getDishes()
  await saveDishes(
    list.filter(function (d) {
      return d.id !== id
    })
  )
}

/** 恢复默认菜单 */
async function resetDishes() {
  const list = seed.map(function (d) {
    return Object.assign({}, d)
  })
  await saveDishes(list)
  return list
}

/* ============================================================
 * 点单
 * ========================================================== */

/**
 * 提交一份点菜单
 * order = { by, items:[{id,name,emoji,count,spicy}], note, persons, ts }
 */
async function addOrder(order) {
  const data = Object.assign(
    {
      by: '',
      items: [],
      note: '',
      persons: '',
      ts: Date.now()
    },
    order
  )

  if (isCloud()) {
    const r = await db().collection(C.order).add({ data: data })
    data._id = r._id
    return data
  }

  data._id = uid('o')
  const list = wx.getStorageSync(K.orders) || []
  list.unshift(data)
  wx.setStorageSync(K.orders, list.slice(0, 100)) // 本地只留最近 100 单
  return data
}

/** 取历史点单，新的在前 */
async function getOrders(limit) {
  const n = limit || 30
  if (isCloud()) {
    const r = await db()
      .collection(C.order)
      .orderBy('ts', 'desc')
      .limit(n)
      .get()
    return r.data || []
  }
  const list = wx.getStorageSync(K.orders) || []
  return list.slice(0, n)
}

/* ============================================================
 * 餐厅
 * ========================================================== */

/** 取餐厅列表（首次写入种子） */
async function getShops() {
  let list = null
  try {
    if (isCloud()) {
      const r = await db().collection(C.shop).doc('main').get()
      list = r.data && r.data.items
    } else {
      list = wx.getStorageSync(K.shops)
    }
  } catch (e) {
    list = null
  }

  if (!list) {
    list = seedShops.map(function (s) {
      return Object.assign({}, s)
    })
    try {
      await saveShops(list)
    } catch (e) {
      console.warn('[餐厅] 初始数据写入失败，本次使用内存数据', e)
    }
  }
  return list
}

async function saveShops(list) {
  if (isCloud()) {
    await db()
      .collection(C.shop)
      .doc('main')
      .set({ data: { items: list, updatedAt: Date.now() } })
  } else {
    wx.setStorageSync(K.shops, list)
  }
  return list
}

async function addShop(shop) {
  const list = await getShops()
  const item = Object.assign(
    {
      id: uid('s'),
      name: '',
      logo: '🍽',
      address: '',
      latitude: 0,
      longitude: 0,
      tags: [],
      note: '',
      likes: []
    },
    shop
  )
  list.unshift(item)
  await saveShops(list)
  return item
}

async function updateShop(id, patch) {
  const list = await getShops()
  const i = list.findIndex(function (s) {
    return s.id === id
  })
  if (i < 0) return null
  list[i] = Object.assign({}, list[i], patch)
  await saveShops(list)
  return list[i]
}

async function removeShop(id) {
  const list = await getShops()
  await saveShops(
    list.filter(function (s) {
      return s.id !== id
    })
  )
}

/* ============================================================
 * 设置（家庭名/掌勺人/成员/主题色/开关）
 * ========================================================== */

function defaultSettings() {
  return {
    familyName: cfg.family.name,
    slogan: cfg.family.slogan,
    chef: cfg.family.chef,
    members: ['爸爸', '妈妈', '孩子'],
    theme: {}, // 用户改过的色值，覆盖 config.theme
    features: Object.assign({}, cfg.features)
  }
}

async function getSettings() {
  let s = null
  try {
    if (isCloud()) {
      const r = await db().collection(C.setting).doc('main').get()
      s = r.data && r.data.value
    } else {
      s = wx.getStorageSync(K.settings)
    }
  } catch (e) {
    s = null
  }
  const base = defaultSettings()
  if (!s) return base
  return {
    familyName: s.familyName || base.familyName,
    slogan: s.slogan === undefined ? base.slogan : s.slogan,
    chef: s.chef || base.chef,
    members: s.members && s.members.length ? s.members : base.members,
    theme: s.theme || {},
    features: Object.assign({}, base.features, s.features || {})
  }
}

async function saveSettings(s) {
  if (isCloud()) {
    await db()
      .collection(C.setting)
      .doc('main')
      .set({ data: { value: s, updatedAt: Date.now() } })
  } else {
    wx.setStorageSync(K.settings, s)
  }
  return s
}

module.exports = {
  isCloud,
  getDishes,
  saveDishes,
  addDish,
  updateDish,
  removeDish,
  resetDishes,
  getOrders,
  addOrder,
  getShops,
  saveShops,
  addShop,
  updateShop,
  removeShop,
  getSettings,
  saveSettings,
  defaultSettings
}
