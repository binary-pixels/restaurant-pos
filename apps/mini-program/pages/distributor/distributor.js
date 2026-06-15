var app = getApp();

Page({
  data: {
    isDistributor: false,
    referralCode: '',
    referralCount: 0,
    commissionRate: 5,
    totalCommission: 0,
    commissions: [],
  },

  onShow: function() {
    var that = this;
    var token = app.globalData.token || '';
    if (!token) return;
    wx.request({
      url: app.globalData.baseUrl + '/api/mini-program/distributor',
      header: { 'Authorization': 'Bearer ' + token },
      success: function(res) {
        if (res.statusCode === 200 && res.data) {
          var d = res.data;
          that.setData({
            isDistributor: d.isDistributor,
            referralCode: d.referralCode,
            referralCount: d.referralCount,
            commissionRate: d.commissionRate,
            totalCommission: (d.totalCommission || 0).toFixed(2),
            commissions: d.commissions || [],
          });
        }
      },
    });
  },

  becomeDist: function() {
    var that = this;
    var token = app.globalData.token || '';
    wx.request({
      url: app.globalData.baseUrl + '/api/mini-program/distributor',
      method: 'POST',
      header: { 'Authorization': 'Bearer ' + token },
      success: function(res) {
        if (res.statusCode === 200 && res.data && res.data.success) {
          that.setData({ isDistributor: true });
          wx.showToast({ title: '已成为分销员！', icon: 'success' });
        }
      },
    });
  },
});
