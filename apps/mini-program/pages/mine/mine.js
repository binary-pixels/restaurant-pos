var app = getApp();
var api = require('../../utils/api');

Page({
  data: {
    userInfo: null,
    tierLabel: '',
    tierBadge: '',
    balance: '0.00',
  },

  onShow: function() {
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

  goPage: function(e) {
    wx.navigateTo({ url: e.currentTarget.dataset.url });
  },

  onComingSoon: function() {
    wx.showToast({ title: '敬请期待', icon: 'none' });
  },
});
