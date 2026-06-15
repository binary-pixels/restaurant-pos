var app = getApp();

Page({
  data: {
    prizes: [
      { name: "5元券", type: "coupon", value: 5 },
      { name: "10积分", type: "points", value: 10 },
      { name: "谢谢参与", type: "none", value: 0 },
      { name: "3元券", type: "coupon", value: 3 },
      { name: "免配送", type: "free_delivery", value: 0 },
      { name: "20积分", type: "points", value: 20 },
    ],
    rotate: 0,
    spinning: false,
    result: null,
  },

  onShow: function() {
    this.loadPrizes();
  },

  loadPrizes: function() {
    var that = this;
    var token = app.globalData.token || '';
    wx.request({
      url: app.globalData.baseUrl + '/api/mini-program/lucky-wheel',
      header: { 'Authorization': 'Bearer ' + token },
      success: function(res) {
        if (res.statusCode === 200 && res.data && res.data.prizes) {
          that.setData({ prizes: res.data.prizes });
        }
      },
    });
  },

  doSpin: function() {
    if (this.data.spinning) return;
    var that = this;
    var token = app.globalData.token || '';
    if (!token) { wx.showToast({ title: '请先登录', icon: 'none' }); return; }

    this.setData({ spinning: true, result: null });

    wx.request({
      url: app.globalData.baseUrl + '/api/mini-program/lucky-wheel',
      method: 'POST',
      header: { 'Authorization': 'Bearer ' + token },
      success: function(res) {
        if (res.statusCode === 200 && res.data) {
          var idx = res.data.index || 0;
          var segAngle = 360 / that.data.prizes.length;
          // Calculate rotation: 5 full spins + land on the selected segment
          var targetAngle = 360 * 5 + (360 - idx * segAngle - segAngle / 2);
          that.setData({ rotate: targetAngle });

          setTimeout(function() {
            that.setData({ spinning: false, result: res.data.prize });
          }, 4000);
        } else {
          that.setData({ spinning: false });
          wx.showToast({ title: (res.data && res.data.error) || '抽奖失败', icon: 'none' });
        }
      },
      fail: function() {
        that.setData({ spinning: false });
        wx.showToast({ title: '网络错误', icon: 'none' });
      },
    });
  },
});
