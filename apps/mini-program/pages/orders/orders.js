var api = require('../../utils/api');
var app = getApp();

Page({
  data: {
    activeTab: 'all',
    orders: [],
    loading: true,
    statusMap: {
      PENDING: '待确认', CONFIRMED: '已确认', PREPARING: '制作中',
      SERVED: '已上菜', COMPLETED: '已完成', CANCELLED: '已取消', REFUNDED: '已退款',
    },
  },

  onShow: function() {
    this.loadOrders();
  },

  switchTab: function(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab, loading: true });
    this.loadOrders();
  },

  loadOrders: function() {
    var that = this;
    var status = this.data.activeTab === 'active' ? 'active' : 'all';
    // Pass Authorization header if logged in
    var token = app.globalData.token;
    wx.request({
      url: app.globalData.baseUrl + '/api/mini-program/orders?status=' + status,
      method: 'GET',
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? 'Bearer ' + token : '',
      },
      success: function(res) {
        if (res.statusCode === 200 && res.data) {
          var orders = (res.data.orders || []);
          for (var i = 0; i < orders.length; i++) {
            orders[i].typeLabel = orders[i].type === 'DINE_IN' ? '堂食' : orders[i].type === 'TAKEOUT' ? '自取' : '配送';
            orders[i].timeStr = orders[i].createdAt ? new Date(orders[i].createdAt).toLocaleString('zh-CN') : '';
          }
          that.setData({ orders: orders, loading: false });
        } else {
          that.setData({ loading: false });
        }
      },
      fail: function() {
        that.setData({ loading: false });
      },
    });
  },

  goDetail: function(e) {
    wx.navigateTo({ url: '/pages/order-detail/order-detail?id=' + e.currentTarget.dataset.id });
  },
  onPullDownRefresh: function() {
    this.loadOrders();
    wx.stopPullDownRefresh();
  },
});
