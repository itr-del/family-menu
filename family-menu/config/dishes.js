/**
 * ============================================================
 *  默认菜品库（种子数据）
 *  说明：
 *  1. 这里只是「首次打开时的初始菜单」，家人在「菜品管理」页
 *     增删改之后，以手机/云端的实际数据为准，不会覆盖。
 *  2. 想恢复初始菜单：设置页 →「恢复默认菜单」
 *  3. 字段说明
 *     id     唯一标识，别重复
 *     name   菜名
 *     cat    所属分类，对应 config/index.js 里 categories 的 id
 *     emoji  用 emoji 顶一张图（零成本），也可以改成 image: '/images/xx.jpg'
 *     desc   一句话描述，可留空
 *     tags   小标签，比如 '招牌' '费时' '10分钟上桌'
 *     on     是否上架（false 就在点菜页看不到，但管理页还在）
 * ============================================================
 */

module.exports = [
  // ---- 荤菜 ----
  { id: 'm1', name: '红烧肉', cat: 'meat', emoji: '🍖', desc: '肥而不腻，配米饭一绝', tags: ['招牌', '费时'], on: true },
  { id: 'm2', name: '可乐鸡翅', cat: 'meat', emoji: '🍗', desc: '小朋友最爱', tags: ['快手'], on: true },
  { id: 'm3', name: '清蒸鲈鱼', cat: 'meat', emoji: '🐟', desc: '葱姜丝热油一浇', tags: ['清淡'], on: true },
  { id: 'm4', name: '番茄炒蛋', cat: 'meat', emoji: '🍅', desc: '糖一点，盐一点', tags: ['10分钟'], on: true },
  { id: 'm5', name: '黑椒牛柳', cat: 'meat', emoji: '🥩', desc: '大火快炒，嫩', tags: [], on: true },

  // ---- 素菜 ----
  { id: 'v1', name: '蒜蓉西兰花', cat: 'veg', emoji: '🥦', desc: '水里焯一下就行', tags: ['10分钟'], on: true },
  { id: 'v2', name: '地三鲜', cat: 'veg', emoji: '🍆', desc: '茄子土豆青椒', tags: ['费油'], on: true },
  { id: 'v3', name: '清炒时蔬', cat: 'veg', emoji: '🥬', desc: '看冰箱里有什么', tags: [], on: true },
  { id: 'v4', name: '干煸四季豆', cat: 'veg', emoji: '🫛', desc: '要煸透，不熟会闹肚子', tags: ['小心'], on: true },

  // ---- 汤 ----
  { id: 's1', name: '番茄蛋汤', cat: 'soup', emoji: '🥣', desc: '五分钟出锅', tags: ['快手'], on: true },
  { id: 's2', name: '冬瓜排骨汤', cat: 'soup', emoji: '🍲', desc: '砂锅慢慢炖', tags: ['费时'], on: true },
  { id: 's3', name: '紫菜蛋花汤', cat: 'soup', emoji: '🌊', desc: '紫菜多一点', tags: ['快手'], on: true },

  // ---- 主食 ----
  { id: 'b1', name: '蛋炒饭', cat: 'staple', emoji: '🍚', desc: '隔夜饭最香', tags: ['快手'], on: true },
  { id: 'b2', name: '手擀面', cat: 'staple', emoji: '🍜', desc: '擀面杖压出来的', tags: ['费时'], on: true },
  { id: 'b3', name: '白米饭', cat: 'staple', emoji: '🍙', desc: '', tags: [], on: true },

  // ---- 凉菜 ----
  { id: 'c1', name: '拍黄瓜', cat: 'cold', emoji: '🥒', desc: '蒜泥+香醋', tags: ['3分钟'], on: true },
  { id: 'c2', name: '凉拌木耳', cat: 'cold', emoji: '🍄', desc: '小米椒一勺', tags: [], on: true },

  // ---- 喝的 ----
  { id: 'd1', name: '酸梅汤', cat: 'drink', emoji: '🧋', desc: '冰镇的', tags: [], on: true },
  { id: 'd2', name: '柠檬水', cat: 'drink', emoji: '🍋', desc: '', tags: ['快手'], on: true }
]
