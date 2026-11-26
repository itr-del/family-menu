/**
 * ============================================================
 *  utils/media.js —— 图片选择与存储
 *
 *  一套接口，两种落地：
 *    local 模式 → 存进小程序本地文件系统，返回本地路径
 *    cloud 模式 → 上传到云存储，返回 fileID（<image src> 可直接用）
 *
 *  页面只调 pickAndStore('dish')，不关心存哪。
 * ============================================================
 */

const cfg = require('../config/index')
const { uid } = require('./util')

/** 拉起相册/相机选一张图，返回临时路径 */
function chooseImage() {
  return new Promise(function (resolve, reject) {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'], // 压缩版，避免几 MB 的原图塞满存储
      sourceType: ['album', 'camera'],
      success(res) {
        const f = res.tempFiles && res.tempFiles[0]
        if (!f || !f.tempFilePath) return reject(new Error('没选到图片'))
        resolve(f.tempFilePath)
      },
      fail(err) {
        const msg = (err && err.errMsg) || ''
        if (msg.indexOf('cancel') >= 0) {
          const e = new Error('cancel')
          e.cancel = true
          return reject(e)
        }
        reject(err)
      }
    })
  })
}

/** 选图 + 存储，返回可直接用于 <image src> 的地址 */
async function pickAndStore(folder) {
  const temp = await chooseImage()

  // 云端：上传到云存储
  if (cfg.mode === 'cloud') {
    const seg = temp.split('.')
    const ext = seg.length > 1 ? seg.pop().toLowerCase() : 'jpg'
    const r = await wx.cloud.uploadFile({
      cloudPath: (folder || 'img') + '/' + uid('f') + '.' + ext,
      filePath: temp
    })
    return r.fileID
  }

  // 本地：存到小程序用户目录，重启后仍有效
  const fs = wx.getFileSystemManager()
  const dest = wx.env.USER_DATA_PATH + '/' + uid('f') + '.jpg'
  fs.saveFileSync(temp, dest)
  return dest
}

/**
 * 删除不再使用的图片（本地文件 / 云文件）
 * 失败静默忽略 —— 删图不该阻塞业务
 */
function removeImage(src) {
  if (!src) return
  try {
    if (cfg.mode === 'cloud') {
      if (src.indexOf('cloud://') === 0) {
        wx.cloud.deleteFile({ fileList: [src], fail() {} })
      }
      return
    }
    if (src.indexOf(wx.env.USER_DATA_PATH) === 0) {
      wx.getFileSystemManager().unlink({ filePath: src, fail() {} })
    }
  } catch (e) {
    // ignore
  }
}

/** 预览大图（点小图看大图） */
function preview(src, all) {
  if (!src) return
  wx.previewImage({
    current: src,
    urls: all && all.length ? all : [src]
  })
}

module.exports = { chooseImage, pickAndStore, removeImage, preview }
