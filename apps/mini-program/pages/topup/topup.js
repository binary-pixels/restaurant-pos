var app = getApp();

Page({
  data: {
    balance: '0.00',
    amount: 0,
    customAmount: '',
    finalAmount: 0,
  },

  onLoad: function() {
    this.loadBalance();
  },

  loadBalance: function() {
    var that = this;
    var token = app.globalData.token || '';
    if (!token) return;
    wx.request({
      url: app.globalData.baseUrl + '/api/mini-program/profile',
      header: { 'Authorization': 'Bearer ' + token },
      success: function(res) {
        if (res.statusCode === 200 && res.data) {
          that.setData({ balance: (res.data.balance || 0).toFixed(2) });
        }
      },
    });
  },

  selectAmount: function(e) {
    var amt = Number(e.currentTarget.dataset.amount);
    this.setData({ amount: amt, customAmount: '', finalAmount: amt });
  },

  onCustomInput: function(e) {
    var val = Number(e.detail.value) || 0;
    this.setData({ customAmount: e.detail.value, amount: 0, finalAmount: val });
  },

  doTopUp: function() {
    var that = this;
    var finalAmount = this.data.finalAmount;
    if (finalAmount <= 0) { wx.showToast({ title: '请选择充值金额', icon: 'none' }); return; }

    wx.showModal({
      title: '确认充值',
      content: '充值 ¥' + finalAmount.toFixed(2) + '？',
      success: function(res) {
        if (!res.confirm) return;
        wx.showLoading({ title: '充值中...' });
        // For real: call WeChat Pay, then call top-up API
        // Simulated: directly call top-up
        var token = app.globalData.token || '';
        wx.request({
          url: app.globalData.baseUrl + '/api/mini-program/topup',
          method: 'POST',
          header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          data: { amount: finalAmount },
          success: function() {
            wx.hideLoading();
            wx.showToast({ title: '充值成功', icon: 'success' });
            that.loadBalance();
            that.setData({ amount: 0, customAmount: '', finalAmount: 0 });
          },
          fail: function() {
            wx.hideLoading();
            wx.showToast({ title: '充值失败', icon: 'none' });
          },
        });
      },
    });
  },
});
