// pages/index/index.js · 点菜首页
const app = getApp()
const cfg = require('../../config/index')
const store = require('../../utils/store')
const { friendlyDate, toast } = require('../../utils/util')

const CART_KEY = 'fm_cart'

Page({
  data: {
    statusBar: 44,
    // 初始值直接用配置，保证第一帧就有完整界面（数据没加载出来也不会白屏）
    theme: cfg.theme,
    family: {
      name: cfg.family.name,
      slogan: cfg.family.slogan,
      chef: cfg.family.chef
    },
    features: cfg.features,
    text: cfg.text,
    shopsCfg: cfg.shops,
    shops: [],
    spicyList: cfg.options.spicy,
    cats: cfg.categories,
    activeCat: (cfg.categories[0] && cfg.categories[0].id) || '',
    list: [],
    cart: {},
    total: 0,
    me: '',
    meAvatar: '?',
    date: '',
    loading: true,
    emptyEmoji: '🥢',
    loadError: ''
  },

  onLoad() {
    // 状态栏高度（自定义导航栏用）
    let sb = 44
    try {
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
      sb = info.statusBarHeight || 44
    } catch (e) {
      sb = 44
    }
    this.setData({ statusBar: sb, date: friendlyDate() })
  },

  onShow() {
    this.refresh()
  },

  async refresh() {
    try {
      await this._doRefresh()
    } catch (err) {
      console.error('[首页] 数据加载失败', err)
      // 兜底：数据挂了也要把界面渲染出来，并把错误显示给用户
      this.setData({
        theme: app.getTheme() || cfg.theme,
        loading: false,
        loadError: (err && (err.errMsg || err.message)) || '未知错误'
      })
    }
  },

  async _doRefresh() {
    const theme = app.getTheme()
    const s = await store.getSettings()
    const dishes = await store.getDishes()
    const shopList = await store.getShops()

    const cats = cfg.categories.slice()
    const me = wx.getStorageSync('fm_me') || ''

    // 首页只展示前 8 家，多了去「全部」页
    const shops = shopList.slice(0, 8).map(function (sp) {
      return Object.assign({}, sp, {
        tagsText: (sp.tags || []).join(' · ')
      })
    })

    this._dishes = dishes.filter(function (d) {
      return d.on !== false
    })
    this._members = s.members

    const cart = wx.getStorageSync(CART_KEY) || {}
    const ids = this._dishes.map(function (d) {
      return d.id
    })
    Object.keys(cart).forEach(function (k) {
      if (ids.indexOf(k) < 0) delete cart[k]
    })

    const spicyList =
      s.features && s.features.showSpicy === false ? [] : cfg.options.spicy || []

    let activeCat = this.data.activeCat
    let found = false
    for (let i = 0; i < cats.length; i++) {
      if (cats[i].id === activeCat) found = true
    }
    if (!found) activeCat = (cats[0] && cats[0].id) || ''

    this.setData(
      {
        theme,
        family: { name: s.familyName, slogan: s.slogan, chef: s.chef },
        features: s.features,
        shops,
        spicyList,
        cats,
        activeCat,
        cart,
        total: this.countTotal(cart),
        me,
        meAvatar: me ? me.slice(0, 1) : '?',
        loading: false
      },
      () => this.applyFilter()
    )

    wx.setStorageSync(CART_KEY, cart)
  },

  applyFilter() {
    const cat = this.data.activeCat
    const list = (this._dishes || []).filter(function (d) {
      return d.cat === cat
    })
    this.setData({ list })
  },

  switchCat(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ activeCat: id }, () => this.applyFilter())
  },

  countTotal(cart) {
    let n = 0
    Object.keys(cart).forEach(function (k) {
      n += cart[k].count || 0
    })
    return n
  },

  /* ---------- 加减 ---------- */
  plus(e) {
    const id = e.currentTarget.dataset.id
    const dish = (this._dishes || []).filter(function (d) {
      return d.id === id
    })[0]
    if (!dish) return

    const cart = Object.assign({}, this.data.cart)
    if (cart[id]) {
      cart[id] = Object.assign({}, cart[id], { count: cart[id].count + 1 })
    } else {
      cart[id] = {
        id: dish.id,
        name: dish.name,
        emoji: dish.emoji,
        image: dish.image || '',
        count: 1,
        spicy: this.data.spicyList[0] || ''
      }
    }
    this.syncCart(cart)
  },

  minus(e) {
    const id = e.currentTarget.dataset.id
    const cart = Object.assign({}, this.data.cart)
    if (!cart[id]) return
    const next = cart[id].count - 1
    if (next <= 0) {
      delete cart[id]
    } else {
      cart[id] = Object.assign({}, cart[id], { count: next })
    }
    this.syncCart(cart)
  },

  pickSpicy(e) {
    const ds = e.currentTarget.dataset
    const cart = Object.assign({}, this.data.cart)
    if (!cart[ds.id]) return
    cart[ds.id] = Object.assign({}, cart[ds.id], { spicy: ds.v })
    this.syncCart(cart)
  },

  syncCart(cart) {
    wx.setStorageSync(CART_KEY, cart)
    this.setData({ cart, total: this.countTotal(cart) })
  },

  clearCart() {
    const self = this
    wx.showModal({
      title: '清空点单？',
      content: '已经点的菜都会没了',
      confirmColor: this.data.theme.primary || '#E8543F',
      success(res) {
        if (res.confirm) self.syncCart({})
      }
    })
  },

  /* ---------- 我是谁 ---------- */
  pickMe() {
    const self = this
    const members =
      this._members && this._members.length ? this._members : store.defaultSettings().members

    wx.showActionSheet({
      itemList: members.slice(0, 6),
      success(res) {
        const name = members[res.tapIndex]
        wx.setStorageSync('fm_me', name)
        app.globalData.me = name
        self.setData({ me: name, meAvatar: name.slice(0, 1) })
        toast('好，' + name)
      }
    })
  },

  /* ---------- 跳转 ---------- */
  goConfirm() {
    if (this.data.total <= 0) return toast('还没点菜')
    if (!this.data.me) return toast('先点左上角选一下你是谁')
    wx.navigateTo({ url: '/pages/confirm/confirm' })
  },

  goManage() {
    wx.navigateTo({ url: '/pages/manage/manage' })
  },

  goShops() {
    wx.navigateTo({ url: '/pages/shops/shops' })
  },

  openShop(e) {
    const sp = this.data.shops[e.currentTarget.dataset.i]
    if (!sp) return
    if (!sp.latitude || !sp.longitude) {
      return wx.navigateTo({ url: '/pages/shops/shops' })
    }
    wx.openLocation({
      latitude: sp.latitude,
      longitude: sp.longitude,
      name: sp.name,
      address: sp.address || '',
      scale: 18,
      fail() {
        wx.navigateTo({ url: '/pages/shops/shops' })
      }
    })
  },

  goSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' })
  },

  onPullDownRefresh() {
    const self = this
    this.refresh().then(function () {
      wx.stopPullDownRefresh()
    })
  }
})
