var api = require('../../utils/api');
var app = getApp();

Page({
  data: {
    activeTab: 'all',
    orders: [],
    statusMap: {
      PENDING: '待确认', CONFIRMED: '已确认', PREPARING: '制作中',
      SERVED: '已上菜', COMPLETED: '已完成', CANCELLED: '已取消', REFUNDED: '已退款',
    },
  },

  onShow: function() {
    this.loadOrders();
  },

  switchTab: function(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
    this.loadOrders();
  },

  loadOrders: function() {
    var that = this;
    var status = this.data.activeTab === 'active' ? 'active' : 'all';
    api.getOrders(status, function(err, res) {
      if (err) return;
      var orders = (res.orders || []);
      for (var i = 0; i < orders.length; i++) {
        orders[i].createdAt = orders[i].createdAt
          ? new Date(orders[i].createdAt).toLocaleString('zh-CN')
          : '';
      }
      that.setData({ orders: orders });
    });
  },

  goDetail: function(e) {
    wx.navigateTo({ url: '/pages/order-detail/order-detail?id=' + e.currentTarget.dataset.id });
  },
});
