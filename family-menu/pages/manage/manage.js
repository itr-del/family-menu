// pages/manage/manage.js · 菜品管理
const app = getApp()
const cfg = require('../../config/index')
const store = require('../../utils/store')
const media = require('../../utils/media')
const { toast } = require('../../utils/util')

const EMOJIS = [
  '🍖', '🍗', '🥩', '🐟', '🦐', '🍅', '🥚', '🥦',
  '🥬', '🍆', '🥒', '🫑', '🍄', '🥕', '🌽', '🥔',
  '🍚', '🍜', '🍝', '🥟', '🍞', '🥣', '🍲', '🥗',
  '🧋', '🍋', '🥛', '🍵', '🍰', '🍽'
]

Page({
  data: {
    theme: cfg.theme,
    cats: cfg.categories,
    activeCat: '',
    list: [],
    showEditor: false,
    showDishImage: true,
    form: {},
    formTagText: '',
    emojis: EMOJIS
  },

  onLoad() {
    this.setData({
      theme: app.getTheme(),
      activeCat: (cfg.categories[0] && cfg.categories[0].id) || ''
    })
  },

  onShow() {
    this.load()
  },

  async load() {
    const dishes = await store.getDishes()
    const s = await store.getSettings()
    this._dishes = dishes
    this.setData({ showDishImage: s.features.showDishImage !== false })
    this.applyFilter()
  },

  applyFilter() {
    const cat = this.data.activeCat
    const list = (this._dishes || [])
      .filter(function (d) {
        return d.cat === cat
      })
      .map(function (d) {
        // WXML 里不能调函数，副标题在这里先算好
        return Object.assign({}, d, {
          _tagText: (d.tags || []).join(' · ')
        })
      })
    this.setData({ list })
  },

  switchCat(e) {
    this.setData({ activeCat: e.currentTarget.dataset.id }, () => this.applyFilter())
  },

  tagText(tags) {
    return tags.join(' · ')
  },

  noop() {},

  /* ---------- 上下架 ---------- */
  async toggleOn(e) {
    const id = e.currentTarget.dataset.id
    await store.updateDish(id, { on: !!e.detail.value })
    this.load()
  },

  /* ---------- 删除 ---------- */
  del(e) {
    const self = this
    const ds = e.currentTarget.dataset
    wx.showModal({
      title: '删掉「' + ds.name + '」？',
      content: '删了就得重新加',
      confirmText: '删掉',
      confirmColor: '#E8543F',
      success: async function (res) {
        if (!res.confirm) return
        await store.removeDish(ds.id)
        toast('删了')
        self.load()
      }
    })
  },

  /* ---------- 编辑 ---------- */
  openNew() {
    this.setData({
      showEditor: true,
      form: {
        id: '',
        name: '',
        cat: this.data.activeCat,
        emoji: '🍽',
        image: '',
        desc: '',
        tags: [],
        on: true
      },
      formTagText: ''
    })
  },

  openEdit(e) {
    const id = e.currentTarget.dataset.id
    const dish = (this._dishes || []).filter(function (d) {
      return d.id === id
    })[0]
    if (!dish) return
    this.setData({
      showEditor: true,
      form: Object.assign({}, dish, { tags: (dish.tags || []).slice() }),
      formTagText: (dish.tags || []).join(',')
    })
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

  onTagInput(e) {
    const raw = e.detail.value
    const tags = raw
      .split(/[,，\s]+/)
      .map(function (t) {
        return t.trim()
      })
      .filter(Boolean)
      .slice(0, 4)
    const form = Object.assign({}, this.data.form, { tags })
    this.setData({ form, formTagText: raw })
  },

  pickCat(e) {
    const form = Object.assign({}, this.data.form, { cat: e.currentTarget.dataset.v })
    this.setData({ form })
  },

  pickEmoji(e) {
    const form = Object.assign({}, this.data.form, { emoji: e.currentTarget.dataset.v })
    this.setData({ form })
  },

  /* ---------- 菜品图上传 ---------- */
  async pickImage() {
    try {
      const path = await media.pickAndStore('dish')
      const form = Object.assign({}, this.data.form, { image: path })
      this.setData({ form })
    } catch (err) {
      if (err && err.cancel) return
      console.error(err)
      // 隐私协议没配时 chooseMedia 会报 errno 112
      toast('选图失败，检查后台是否已配置用户隐私保护指引')
    }
  },

  pickImagePreview() {
    const src = this.data.form.image
    if (src) media.preview(src)
  },

  removeImage() {
    const old = this.data.form.image
    const form = Object.assign({}, this.data.form, { image: '' })
    this.setData({ form })
    if (old) media.removeImage(old)
  },

  onOn(e) {
    const form = Object.assign({}, this.data.form, { on: e.detail.value })
    this.setData({ form })
  },

  async save() {
    const f = this.data.form
    if (!f.name || !f.name.trim()) return toast('菜名还没填')
    if (!f.cat) return toast('选个分类')

    const payload = {
      name: f.name.trim(),
      cat: f.cat,
      emoji: f.emoji || '🍽',
      image: f.image || '',
      desc: (f.desc || '').trim(),
      tags: f.tags || [],
      on: f.on !== false
    }

    if (f.id) {
      await store.updateDish(f.id, payload)
    } else {
      await store.addDish(payload)
      // 新增后切到它的分类，方便看到
      this.setData({ activeCat: payload.cat })
    }

    this.setData({ showEditor: false })
    toast('存好了')
    this.load()
  }
})
