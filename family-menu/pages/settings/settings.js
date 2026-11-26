// pages/settings/settings.js · 个性化设置
const app = getApp()
const cfg = require('../../config/index')
const store = require('../../utils/store')
const { hhmm, friendlyDate, toast } = require('../../utils/util')

const COLORS = [
  { name: '番茄', primary: '#E8543F', primaryDark: '#C9402D', soft: '#FFF1EE' },
  { name: '焦糖', primary: '#D9822B', primaryDark: '#B8691E', soft: '#FDF3E7' },
  { name: '抹茶', primary: '#4C8C4A', primaryDark: '#3B7139', soft: '#EEF6EE' },
  { name: '深海', primary: '#2F6FED', primaryDark: '#2356C4', soft: '#EAF1FE' },
  { name: '藕荷', primary: '#7B5EA7', primaryDark: '#624A87', soft: '#F3EFF9' },
  { name: '咖喱', primary: '#C8912A', primaryDark: '#A5751F', soft: '#FBF3E3' },
  { name: '桃粉', primary: '#E06C9F', primaryDark: '#C2547F', soft: '#FDEEF4' },
  { name: '墨黑', primary: '#2B2B2B', primaryDark: '#111111', soft: '#F0F0F0' }
]

const FEATURES = [
  { key: 'showSpicy', name: '辣度选择', desc: '菜品卡片上选 不辣/微辣/中辣/特辣' },
  { key: 'showDishDesc', name: '菜品描述', desc: '菜名下面那句话' },
  { key: 'showTags', name: '小标签', desc: '招牌、费时、快手 这类标签' },
  { key: 'showNote', name: '备注', desc: '点菜时可以写两句给掌勺的' },
  { key: 'showPersonPicker', name: '份量选择', desc: '1人份、2人份…' },
  { key: 'allowQuickAdd', name: '一键加减', desc: '列表右侧的 ＋/− 按钮' },
  { key: 'showDishImage', name: '菜品图片', desc: '允许给菜品上传照片（关掉只用 emoji）' },
  { key: 'showShops', name: '大家喜欢的餐厅', desc: '首页那条横向餐厅卡片' }
]

Page({
  data: {
    theme: cfg.theme,
    form: {
      familyName: '',
      slogan: '',
      chef: '',
      members: [],
      features: {}
    },
    colors: COLORS,
    featureList: FEATURES,
    modeText: '',
    showOrders: false,
    orders: []
  },

  onLoad(query) {
    this.setData({ theme: app.getTheme() })
    this.load()
    if (query && query.tab === 'orders') {
      this.setData({ showOrders: true }, this.loadOrders)
    }
  },

  async load() {
    const s = await store.getSettings()
    this.setData({
      theme: Object.assign({}, cfg.theme, s.theme || {}),
      form: {
        familyName: s.familyName,
        slogan: s.slogan,
        chef: s.chef,
        members: s.members.slice(),
        features: s.features
      },
      modeText: cfg.mode === 'cloud' ? '云端共享（全家看同一份）' : '仅本机（他人看不到）'
    })
  },

  onInput(e) {
    const k = e.currentTarget.dataset.k
    const form = Object.assign({}, this.data.form)
    form[k] = e.detail.value
    this.setData({ form })
  },

  /* ---------- 成员 ---------- */
  addMember() {
    const self = this
    wx.showModal({
      title: '加个人',
      editable: true,
      placeholderText: '名字，比如 奶奶',
      confirmColor: this.data.theme.primary,
      success(res) {
        if (!res.confirm) return
        const name = (res.content || '').trim()
        if (!name) return
        const form = Object.assign({}, self.data.form)
        if (form.members.indexOf(name) >= 0) return toast('已经有了')
        if (form.members.length >= 8) return toast('最多 8 个人')
        form.members = form.members.concat([name])
        self.setData({ form })
      }
    })
  },

  delMember(e) {
    const name = e.currentTarget.dataset.v
    const self = this
    wx.showModal({
      title: '删掉「' + name + '」？',
      confirmColor: this.data.theme.primary,
      success(res) {
        if (!res.confirm) return
        const form = Object.assign({}, self.data.form)
        form.members = form.members.filter(function (m) {
          return m !== name
        })
        self.setData({ form })
      }
    })
  },

  /* ---------- 主题色 ---------- */
  pickColor(e) {
    const c = COLORS[e.currentTarget.dataset.i]
    const theme = Object.assign({}, this.data.theme, {
      primary: c.primary,
      primaryDark: c.primaryDark,
      soft: c.soft
    })
    this.setData({ theme })
    // 立刻生效（不保存也能先看效果）
    wx.setStorageSync('fm_theme', {
      primary: c.primary,
      primaryDark: c.primaryDark,
      soft: c.soft
    })
    app.loadTheme()
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: c.primary,
      fail() {}
    })
  },

  /* ---------- 开关 ---------- */
  onFeature(e) {
    const k = e.currentTarget.dataset.k
    const form = Object.assign({}, this.data.form, {
      features: Object.assign({}, this.data.form.features)
    })
    form.features[k] = e.detail.value
    this.setData({ form })
  },

  /* ---------- 数据 ---------- */
  resetMenu() {
    const self = this
    wx.showModal({
      title: '恢复默认菜单？',
      content: '你自己加的菜会全部没掉，回到最初那 18 道',
      confirmText: '恢复',
      confirmColor: '#E8543F',
      success: async function (res) {
        if (!res.confirm) return
        await store.resetDishes()
        toast('已恢复')
      }
    })
  },

  toggleOrders() {
    const next = !this.data.showOrders
    this.setData({ showOrders: next })
    if (next) this.loadOrders()
  },

  async loadOrders() {
    const list = await store.getOrders(20)
    const orders = list.map(function (o) {
      return Object.assign({}, o, {
        timeText: friendlyDate(new Date(o.ts)) + ' ' + hhmm(new Date(o.ts))
      })
    })
    this.setData({ orders })
  },

  /* ---------- 保存 ---------- */
  async save() {
    const f = this.data.form
    if (!f.familyName || !f.familyName.trim()) return toast('家庭名不能空')

    const s = {
      familyName: f.familyName.trim(),
      slogan: (f.slogan || '').trim(),
      chef: (f.chef || '').trim() || '掌勺的人',
      members: f.members.length ? f.members : store.defaultSettings().members,
      theme: {
        primary: this.data.theme.primary,
        primaryDark: this.data.theme.primaryDark,
        soft: this.data.theme.soft
      },
      features: f.features
    }

    await store.saveSettings(s)
    wx.setStorageSync('fm_theme', s.theme)
    app.loadTheme()
    wx.showToast({ title: '存好了', icon: 'success' })
    setTimeout(function () {
      wx.navigateBack({ fail() {} })
    }, 600)
  }
})
