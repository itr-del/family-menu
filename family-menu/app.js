// app.js
const cfg = require('./config/index')

App({
  globalData: {
    theme: null,
    settings: null,
    me: '',
    bootError: ''
  },

  onLaunch() {
    // 云开发模式才初始化
    if (cfg.mode === 'cloud' && wx.cloud) {
      if (!cfg.cloudEnv) {
        console.warn('[点菜] mode=cloud 但 config.cloudEnv 为空，请在 config/index.js 填入云环境 ID')
      }
      try {
        wx.cloud.init({
          env: cfg.cloudEnv || undefined,
          traceUser: true
        })
      } catch (e) {
        console.error('[点菜] 云开发初始化失败', e)
        this.globalData.bootError = '云开发初始化失败：' + (e && e.message ? e.message : e)
      }
    }

    // 读取自定义主题（用户在设置页改过的色值优先于 config）
    this.loadTheme()

    // 记录「我是谁」，用于点菜单署名
    const me = wx.getStorageSync('fm_me') || ''
    this.globalData.me = me
  },

  /** 全局兜底：任何没被 catch 的报错都打到控制台，方便排查白屏 */
  onError(err) {
    console.error('[点菜·全局错误]', err)
  },

  onPageNotFound(res) {
    console.error('[点菜·页面不存在]', res)
    wx.reLaunch({ url: '/pages/index/index' })
  },

  /**
   * 主题加载：把配置色值 + 用户自定义色值合并，写进 globalData
   * 页面 onShow 时读 globalData.theme 注入 CSS 变量
   */
  loadTheme() {
    const saved = wx.getStorageSync('fm_theme') || {}
    const theme = Object.assign({}, cfg.theme, saved)
    this.globalData.theme = theme
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: theme.primary,
      fail() {}
    })
    return theme
  },

  /**
   * 供页面调用：拿到应用实例（避免循环依赖）
   */
  getTheme() {
    if (!this.globalData.theme) this.loadTheme()
    return this.globalData.theme
  }
})
