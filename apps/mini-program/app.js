App({
  globalData: {
    baseUrl: 'http://172.20.10.2:3000',
    storeId: '',
    tableId: '',
    tableLabel: '',
    token: '',
    userInfo: null,
    cart: [],
  },

  onLaunch: function(options) {
    if (options.query) {
      var q = options.query;
      if (q.tableId) this.globalData.tableId = q.tableId;
      if (q.table) this.globalData.tableLabel = decodeURIComponent(q.table);
      if (q.storeId) this.globalData.storeId = q.storeId;
    }

    var cart = wx.getStorageSync('cart');
    if (cart) this.globalData.cart = cart;

    var token = wx.getStorageSync('token');
    if (token) this.globalData.token = token;
  },

  saveCart: function() {
    wx.setStorageSync('cart', this.globalData.cart);
  },

  clearCart: function() {
    this.globalData.cart = [];
    wx.removeStorageSync('cart');
  },

  request: function(path, method, data, cb) {
    var url = this.globalData.baseUrl + '/api' + path;
    console.log('[API]', method || 'GET', url);
    wx.request({
      url: url,
      method: method || 'GET',
      data: data,
      timeout: 10000,
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.globalData.token,
      },
      success: function(res) {
        console.log('[API] Response', res.statusCode);
        if (res.statusCode === 200 || res.statusCode === 201) {
          if (cb) cb(null, res.data);
        } else {
          if (cb) cb({ errMsg: 'HTTP ' + res.statusCode, data: res.data });
        }
      },
      fail: function(err) {
        console.error('[API] Fail', url, err);
        if (cb) cb(err);
      },
    });
  },
});
