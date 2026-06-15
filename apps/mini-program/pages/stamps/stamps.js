var app = getApp();

Page({
  data: {
    stamps: 0,
    threshold: 10,
    reward: 10,
    redeemed: false,
  },

  onShow: function() {
    var that = this;
    var token = app.globalData.token || '';
    if (!token) return;
    wx.request({
      url: app.globalData.baseUrl + '/api/mini-program/profile',
      header: { 'Authorization': 'Bearer ' + token },
      success: function(res) {
        if (res.statusCode === 200 && res.data) {
          that.setData({ stamps: res.data.stamps || 0 });
        }
      },
    });
    // Load config
    wx.request({
      url: app.globalData.baseUrl + '/api/mini-program/stamp-config',
      success: function(res) {
        if (res.statusCode === 200 && res.data) {
          var cfg = res.data;
          that.setData({ threshold: cfg.threshold || 10, reward: cfg.reward || 10, redeemed: (res.data.stamps || 0) >= (cfg.threshold || 10) && !!res.data.lastRedeemed });
        }
      },
    });
  },

  doRedeem: function() {
    var that = this;
    var token = app.globalData.token || '';
    wx.request({
      url: app.globalData.baseUrl + '/api/mini-program/stamp-redeem',
      method: 'POST',
      header: { 'Authorization': 'Bearer ' + token },
      success: function(res) {
        if (res.statusCode === 200 && res.data && res.data.success) {
          wx.showToast({ title: '兑换成功！获得¥' + that.data.reward + '优惠券', icon: 'success' });
          that.setData({ redeemed: true });
        } else {
          wx.showToast({ title: (res.data && res.data.error) || '兑换失败', icon: 'none' });
        }
      },
    });
  },
});
