// pages/shops/shops.js · 大家喜欢的餐厅
const app = getApp()
const cfg = require('../../config/index')
const store = require('../../utils/store')
const media = require('../../utils/media')
const { toast } = require('../../utils/util')

const EMOJIS = ['🍽', '🍜', '🥟', '🍲', '🍱', '🍕', '🍔', '🍣', '🥘', '🍢', '🥗', '☕', '🍰', '🍦', '🍤', '🥓']

function buildMap(arr) {
  const m = {}
  ;(arr || []).forEach(function (k) {
    m[k] = true
  })
  return m
}

function likesText(likes, all) {
  const ls = likes || []
  if (!ls.length) return ''
  if (ls.length <= 2) return ls.join('、')
  return ls.slice(0, 2).join('、') + ' 等 ' + ls.length + ' 人'
}

Page({
  data: {
    theme: cfg.theme,
    text: cfg.text,
    cfgTitle: cfg.shops.title,
    cfgSub: cfg.shops.subtitle,
    list: [],
    showEditor: false,
    form: {},
    allTags: cfg.shops.defaultTags,
    members: ['爸爸', '妈妈', '孩子'],
    emojis: EMOJIS
  },

  onLoad() {
    this.setData({ theme: app.getTheme() })
  },

  onShow() {
    this.load()
  },

  async load() {
    const shops = await store.getShops()
    const s = await store.getSettings()

    // 把常用标签和已有标签合并，避免自己加的标签选不到
    const tagSet = cfg.shops.defaultTags.slice()
    shops.forEach(function (sp) {
      ;(sp.tags || []).forEach(function (t) {
        if (tagSet.indexOf(t) < 0) tagSet.push(t)
      })
    })

    const list = shops.map(function (sp) {
      return Object.assign({}, sp, {
        likesText: likesText(sp.likes)
      })
    })

    this._shops = shops
    this.setData({
      theme: app.getTheme(),
      list,
      members: s.members,
      allTags: tagSet
    })
  },

  /* ---------- 导航 ---------- */
  navigate(e) {
    const sp = this.data.list[e.currentTarget.dataset.i]
    if (!sp) return
    if (!sp.latitude || !sp.longitude) {
      return toast('这家还没标位置，点「改」加上')
    }
    wx.openLocation({
      latitude: sp.latitude,
      longitude: sp.longitude,
      name: sp.name,
      address: sp.address || '',
      scale: 18,
      fail(err) {
        console.error(err)
        toast('打开地图失败')
      }
    })
  },

  previewLogo(e) {
    const src = e.currentTarget.dataset.src
    if (src) media.preview(src)
  },

  /* ---------- 新增 / 编辑 ---------- */
  openNew() {
    const form = {
      id: '',
      name: '',
      logo: '🍽',
      logoImage: '',
      address: '',
      latitude: 0,
      longitude: 0,
      tags: [],
      note: '',
      likes: [],
      _tagMap: {},
      _likeMap: {}
    }
    this.setData({ showEditor: true, form })
  },

  openEdit(e) {
    const sp = this.data.list[e.currentTarget.dataset.i]
    if (!sp) return
    const form = Object.assign({}, sp, {
      tags: (sp.tags || []).slice(),
      likes: (sp.likes || []).slice(),
      _tagMap: buildMap(sp.tags),
      _likeMap: buildMap(sp.likes)
    })
    this.setData({ showEditor: true, form })
  },

  closeEdit() {
    this.setData({ showEditor: false })
  },

  onInput(e) {
    const k = e.currentTarget.dataset.k
    const form = Object.assign({}, this.data.form)
    form[k] = e.detail.value
    this.setData({ form })
  },

  /* ---------- logo ---------- */
  async pickLogo() {
    try {
      const path = await media.pickAndStore('shop')
      const form = Object.assign({}, this.data.form, { logoImage: path })
      this.setData({ form })
    } catch (err) {
      if (err && err.cancel) return
      console.error(err)
      // 隐私协议没配时，chooseMedia 会报 errno 112
      toast('选图失败，检查是否已配置用户隐私保护指引')
    }
  },

  removeLogo() {
    const old = this.data.form.logoImage
    const form = Object.assign({}, this.data.form, { logoImage: '' })
    this.setData({ form })
    if (old) media.removeImage(old)
  },

  pickEmoji(e) {
    const form = Object.assign({}, this.data.form, {
      logo: e.currentTarget.dataset.v,
      logoImage: ''
    })
    this.setData({ form })
  },

  /* ---------- 位置 ---------- */
  pickLocation() {
    const self = this
    wx.chooseLocation({
      success(res) {
        const form = Object.assign({}, self.data.form, {
          address: res.address || res.name || '',
          latitude: res.latitude,
          longitude: res.longitude
        })
        // 店名还空着就用地图上的名字
        if (!form.name && res.name) form.name = res.name
        self.setData({ form })
      },
      fail(err) {
        const msg = (err && err.errMsg) || ''
        if (msg.indexOf('cancel') >= 0) return
        if (msg.indexOf('auth') >= 0 || msg.indexOf('deny') >= 0) {
          wx.showModal({
            title: '需要位置权限',
            content: '去「设置」里打开位置权限，才能在地图上标餐厅位置',
            confirmText: '去设置',
            success(r) {
              if (r.confirm) wx.openSetting({})
            }
          })
          return
        }
        console.error(err)
        toast('选位置失败，检查隐私协议是否已配置')
      }
    })
  },

  /* ---------- 标签 / 喜欢 ---------- */
  toggleTag(e) {
    const v = e.currentTarget.dataset.v
    const form = Object.assign({}, this.data.form)
    const tags = (form.tags || []).slice()
    const i = tags.indexOf(v)
    if (i >= 0) tags.splice(i, 1)
    else if (tags.length < 5) tags.push(v)
    else return toast('最多 5 个标签')
    form.tags = tags
    form._tagMap = buildMap(tags)
    this.setData({ form })
  },

  toggleLike(e) {
    const v = e.currentTarget.dataset.v
    const form = Object.assign({}, this.data.form)
    const likes = (form.likes || []).slice()
    const i = likes.indexOf(v)
    if (i >= 0) likes.splice(i, 1)
    else likes.push(v)
    form.likes = likes
    form._likeMap = buildMap(likes)
    this.setData({ form })
  },

  /* ---------- 保存 / 删除 ---------- */
  async save() {
    const f = this.data.form
    if (!f.name || !f.name.trim()) return toast('店名还没填')
    if (!f.latitude) return toast('先在地图上标一下位置')

    const payload = {
      name: f.name.trim(),
      logo: f.logo || '🍽',
      logoImage: f.logoImage || '',
      address: (f.address || '').trim(),
      latitude: f.latitude,
      longitude: f.longitude,
      tags: f.tags || [],
      note: (f.note || '').trim(),
      likes: f.likes || []
    }

    if (f.id) await store.updateShop(f.id, payload)
    else await store.addShop(payload)

    this.setData({ showEditor: false })
    toast('存好了')
    this.load()
  },

  del() {
    const self = this
    const f = this.data.form
    wx.showModal({
      title: '删掉「' + f.name + '」？',
      content: '收藏就没了，地图上的位置也会一起清掉',
      confirmText: '删掉',
      confirmColor: '#E8543F',
      success: async function (res) {
        if (!res.confirm) return
        await store.removeShop(f.id)
        if (f.logoImage) media.removeImage(f.logoImage)
        self.setData({ showEditor: false })
        toast('删了')
        self.load()
      }
    })
  }
})
