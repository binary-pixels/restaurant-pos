var app = getApp();
var api = require('../../utils/api');

Page({
  data: {
    userInfo: null,
    tierLabel: '',
    tierBadge: '',
    balance: '0.00',
    referralCode: '',
    referralCount: 0,
  },

  onShow: function() {
    this.loadReferral();
    if (app.globalData.token) {
      this.loadProfile();
    } else {
      this.setData({ userInfo: null });
    }
  },

  loadProfile: function() {
    var that = this;
    api.getProfile(function(err, data) {
      if (err) return;
      var tierMap = {
        REGULAR: { label: '普通会员', badge: 'badge-gray' },
        SILVER: { label: '银卡会员', badge: 'badge-blue' },
        GOLD: { label: '金卡会员', badge: 'badge-amber' },
        DIAMOND: { label: '钻石会员', badge: 'badge-red' },
      };
      var t = tierMap[data.tier] || tierMap.REGULAR;
      that.setData({
        userInfo: data,
        tierLabel: t.label,
        tierBadge: t.badge,
        balance: (data.balance || 0).toFixed(2),
      });
    });
  },

  goLogin: function() {
    wx.navigateTo({ url: '/pages/login/login' });
  },

  loadReferral: function() {
    var that = this;
    var token = app.globalData.token || '';
    if (!token) return;
    wx.request({
      url: app.globalData.baseUrl + '/api/mini-program/referral',
      header: { 'Authorization': 'Bearer ' + token },
      success: function(res) {
        if (res.statusCode === 200 && res.data) {
          that.setData({ referralCode: res.data.referralCode, referralCount: res.data.referralCount });
        }
      },
    });
  },

  goReferral: function() {
    if (!this.data.referralCode) return;
    wx.showShareMenu({ withShareTicket: true });
    wx.showModal({
      title: '邀请好友',
      content: '我的推荐码: ' + this.data.referralCode + '\n\n好友注册时输入此码，双方各得50积分！',
      showCancel: false,
    });
  },

  goPage: function(e) {
    wx.navigateTo({ url: e.currentTarget.dataset.url });
  },

  onComingSoon: function() {
    wx.showToast({ title: '敬请期待', icon: 'none' });
  },
});
