var LANGS = {
  'zh-CN': {
    menu: '点餐', orders: '订单', mine: '我的',
    addCart: '加入购物车', checkout: '去下单', pay: '去支付',
    loading: '加载中...', noData: '暂无数据', empty: '购物车为空',
    confirm: '确认', cancel: '取消', save: '保存', delete: '删除',
    orderNow: '下单', total: '合计', subtotal: '小计',
    paid: '已支付', unpaid: '未支付', soldOut: '售罄',
    welcome: '欢迎使用扫码点餐', guide1: '点击菜品添加到购物车',
    guide2: '底部查看购物车', guide3: '去下单→确认支付',
    gotIt: '知道了', continueOrder: '继续点餐', reorder: '再来一单',
    login: '登录/注册', loginPrompt: '登录后享受会员权益',
  },
  'en': {
    menu: 'Menu', orders: 'Orders', mine: 'Me',
    addCart: 'Add to Cart', checkout: 'Checkout', pay: 'Pay Now',
    loading: 'Loading...', noData: 'No Data', empty: 'Cart Empty',
    confirm: 'Confirm', cancel: 'Cancel', save: 'Save', delete: 'Delete',
    orderNow: 'Order', total: 'Total', subtotal: 'Subtotal',
    paid: 'Paid', unpaid: 'Unpaid', soldOut: 'Sold Out',
    welcome: 'Welcome to QR Ordering',
    guide1: 'Tap items to add to cart',
    guide2: 'View cart at the bottom',
    guide3: 'Go to checkout → Pay',
    gotIt: 'Got It', continueOrder: 'Continue', reorder: 'Reorder',
    login: 'Log In', loginPrompt: 'Log in for member benefits',
  },
};

function getLang() {
  return wx.getStorageSync('lang') || 'zh-CN';
}

function t(key) {
  var lang = getLang();
  var map = LANGS[lang] || LANGS['zh-CN'];
  return map[key] || key;
}

function setLang(lang) {
  wx.setStorageSync('lang', lang);
}

module.exports = { t: t, getLang: getLang, setLang: setLang, LANGS: LANGS };
