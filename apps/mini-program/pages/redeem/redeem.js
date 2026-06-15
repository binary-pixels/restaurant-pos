var app = getApp();

Page({
  data: { code: '', result: '' },

  onInput: function(e) { this.setData({ code: e.detail.value.toUpperCase() }); },

  doRedeem: function() {
    var that = this;
    var code = (this.data.code || '').trim();
    if (!code) { wx.showToast({ title: '请输入兑换码', icon: 'none' }); return; }

    var token = app.globalData.token || '';
    if (!token) { wx.showToast({ title: '请先登录', icon: 'none' }); return; }

    wx.showLoading({ title: '兑换中...' });
    wx.request({
      url: app.globalData.baseUrl + '/api/mini-program/redeem',
      method: 'POST',
      header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      data: { code: code },
      success: function(res) {
        wx.hideLoading();
        if (res.statusCode === 200 && res.data && res.data.success) {
          that.setData({ code: '', result: res.data.message });
          wx.showToast({ title: '兑换成功', icon: 'success' });
        } else {
          that.setData({ result: (res.data && res.data.error) || '兑换失败' });
        }
      },
      fail: function() { wx.hideLoading(); wx.showToast({ title: '网络错误', icon: 'none' }); },
    });
  },
});
