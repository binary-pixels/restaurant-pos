var app = getApp();

Page({
  data: { coupons: [] },

  onShow: function() {
    var that = this;
    var token = app.globalData.token || '';
    wx.request({
      url: app.globalData.baseUrl + '/api/mini-program/coupons',
      header: { 'Authorization': 'Bearer ' + token },
      success: function(res) {
        if (res.statusCode === 200 && res.data) {
          var coupons = (res.data.coupons || []).map(function(c) {
            c.startDate = c.startDate ? c.startDate.slice(0, 10) : '';
            c.endDate = c.endDate ? c.endDate.slice(0, 10) : '';
            return c;
          });
          that.setData({ coupons: coupons });
        }
      },
    });
  },
});
