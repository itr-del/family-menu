// pages/confirm/confirm.js · 确认与提交
const app = getApp()
const cfg = require('../../config/index')
const store = require('../../utils/store')
const { friendlyDate, toast } = require('../../utils/util')

const CART_KEY = 'fm_cart'

Page({
  data: {
    theme: cfg.theme,
    text: cfg.text,
    features: {},
    family: { chef: '' },
    by: '',
    date: '',
    items: [],
    total: 0,
    personList: cfg.options.persons,
    persons: '',
    note: '',
    submitting: false,
    done: false,
    submitted: [],
    submittedNote: ''
  },

  onLoad() {
    const cart = wx.getStorageSync(CART_KEY) || {}
    const items = Object.keys(cart).map(function (k) {
      return cart[k]
    })
    this.setData({
      theme: app.getTheme(),
      by: wx.getStorageSync('fm_me') || '家里某人',
      date: friendlyDate(),
      items,
      total: this.count(items),
      persons: cfg.options.persons[1] || cfg.options.persons[0] || ''
    })
  },

  onShow() {
    const self = this
    store.getSettings().then(function (s) {
      self.setData({
        features: s.features,
        family: { chef: s.chef },
        theme: app.getTheme()
      })
    })
  },

  count(items) {
    let n = 0
    items.forEach(function (i) {
      n += i.count
    })
    return n
  },

  plus(e) {
    const id = e.currentTarget.dataset.id
    const items = this.data.items.map(function (i) {
      return i.id === id ? Object.assign({}, i, { count: i.count + 1 }) : i
    })
    this.setData({ items, total: this.count(items) })
  },

  minus(e) {
    const id = e.currentTarget.dataset.id
    const items = []
    this.data.items.forEach(function (i) {
      if (i.id !== id) return items.push(i)
      if (i.count > 1) items.push(Object.assign({}, i, { count: i.count - 1 }))
    })
    this.setData({ items, total: this.count(items) })
  },

  pickPerson(e) {
    this.setData({ persons: e.currentTarget.dataset.v })
  },

  onNote(e) {
    this.setData({ note: e.detail.value })
  },

  async submit() {
    if (this.data.submitting) return
    if (!this.data.items.length) return toast('什么都没点')

    this.setData({ submitting: true })

    const order = {
      by: this.data.by,
      items: this.data.items,
      note: this.data.note,
      persons: this.data.persons,
      date: friendlyDate()
    }

    try {
      await store.addOrder(order)
      wx.setStorageSync(CART_KEY, {})
      this.setData({
        submitting: false,
        done: true,
        submitted: this.data.items,
        submittedNote: this.data.note
      })
      wx.showToast({ title: '点好了', icon: 'success' })
    } catch (err) {
      console.error('[提交失败]', err)
      this.setData({ submitting: false })
      toast('提交失败，检查云开发是否开通')
    }
  },

  backHome() {
    wx.navigateBack({
      fail() {
        wx.reLaunch({ url: '/pages/index/index' })
      }
    })
  },

  goOrders() {
    wx.navigateTo({ url: '/pages/settings/settings?tab=orders' })
  }
})
