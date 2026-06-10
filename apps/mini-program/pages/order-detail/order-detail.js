var api = require('../../utils/api');

var STATUS_EMOJI = {
  PENDING: '⏳', CONFIRMED: '✅', PREPARING: '👨‍🍳',
  SERVED: '🍽️', COMPLETED: '🎉', CANCELLED: '❌', REFUNDED: '💰',
};
var STATUS_LABELS = {
  PENDING: '等待接单', CONFIRMED: '已接单', PREPARING: '制作中',
  SERVED: '已上菜', COMPLETED: '已完成', CANCELLED: '已取消', REFUNDED: '已退款',
};

Page({
  data: {
    order: null,
    orderId: '',
    statusIcon: '',
    statusLabel: '',
  },

  onLoad: function(options) {
    if (options.id) {
      this.setData({ orderId: options.id });
      this.loadOrder(options.id);
    }
  },

  onShow: function() {
    // Start polling every 5s
    var that = this;
    this._timer = setInterval(function() {
      if (that.data.orderId) that.loadOrder(that.data.orderId);
    }, 5000);
  },

  onHide: function() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
  },

  onUnload: function() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
  },

  loadOrder: function(id) {
    var that = this;
    api.getOrderDetail(id, function(err, order) {
      if (err) return;
      var status = order.status || 'PENDING';
      that.setData({
        order: order,
        statusIcon: STATUS_EMOJI[status] || '⏳',
        statusLabel: STATUS_LABELS[status] || status,
      });

      // Stop polling when order is final
      if (status === 'COMPLETED' || status === 'CANCELLED' || status === 'REFUNDED') {
        if (that._timer) { clearInterval(that._timer); that._timer = null; }
      }
    });
  },
});
