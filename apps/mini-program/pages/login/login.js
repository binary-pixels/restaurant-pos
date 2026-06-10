var api = require('../../utils/api');
var app = getApp();

Page({
  data: {
    mode: 'wechat',
    phone: '',
    code: '',
    codeText: '获取验证码',
    counting: false,
  },

  getPhone: function(e) {
    if (e.detail.errMsg !== 'getPhoneNumber:ok') return;
    wx.showLoading({ title: '登录中...' });
    this.doLogin({ phone: '138****0000' });
  },

  wechatLogin: function() {
    var that = this;
    wx.showLoading({ title: '登录中...' });
    wx.login({
      success: function(loginRes) {
        if (loginRes.code) {
          api.wxLogin(loginRes.code, {}, function(err, data) {
            if (err) { wx.hideLoading(); wx.showToast({ title: '登录失败', icon: 'none' }); return; }
            app.globalData.token = data.token;
            app.globalData.userInfo = data.user;
            wx.setStorageSync('token', data.token);
            wx.hideLoading();
            wx.showToast({ title: '登录成功', icon: 'success' });
            setTimeout(function() { wx.navigateBack(); }, 1500);
          });
        }
      },
    });
  },

  switchMode: function(e) {
    this.setData({ mode: e.currentTarget.dataset.mode });
  },

  onPhoneInput: function(e) { this.setData({ phone: e.detail.value }); },
  onCodeInput: function(e) { this.setData({ code: e.detail.value }); },

  sendCode: function() {
    if (this.data.counting) return;
    if (!this.data.phone || this.data.phone.length < 11) {
      wx.showToast({ title: '请输入正确手机号', icon: 'none' });
      return;
    }
    var that = this;
    this.setData({ counting: true, codeText: '60s' });
    var s = 60;
    var timer = setInterval(function() {
      s--;
      that.setData({ codeText: s + 's' });
      if (s <= 0) { clearInterval(timer); that.setData({ counting: false, codeText: '获取验证码' }); }
    }, 1000);
    wx.showToast({ title: '验证码已发送', icon: 'none' });
  },

  phoneLogin: function() {
    if (!this.data.phone || !this.data.code) {
      wx.showToast({ title: '请输入手机号和验证码', icon: 'none' });
      return;
    }
    this.doLogin({ phone: this.data.phone });
  },

  doLogin: function(data) {
    wx.hideLoading();
    app.globalData.userInfo = data;
    wx.setStorageSync('user', data);
    wx.showToast({ title: '登录成功', icon: 'success' });
    setTimeout(function() { wx.navigateBack(); }, 1500);
  },
});
