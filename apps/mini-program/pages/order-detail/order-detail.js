var api = require('../../utils/api');
var app = getApp();

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
    statusIcon: '⏳',
    statusLabel: '加载中',
    loadError: false,
  },

  onLoad: function(options) {
    if (options.id) {
      this.setData({ orderId: options.id });
      this.loadOrder(options.id);
    } else {
      this.setData({ loadError: true, statusLabel: '缺少订单ID' });
    }
  },

  onShow: function() {
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

  retry: function() {
    this.setData({ loadError: false });
    this.loadOrder(this.data.orderId);
  },

  loadOrder: function(id) {
    var that = this;
    api.getOrderDetail(id, function(err, order) {
      if (err || !order) {
        that.setData({ loadError: true });
        return;
      }
      var status = order.status || 'PENDING';
      that.setData({
        order: order,
        loadError: false,
        statusIcon: STATUS_EMOJI[status] || '⏳',
        statusLabel: STATUS_LABELS[status] || status,
      });
      if (status === 'COMPLETED' || status === 'CANCELLED' || status === 'REFUNDED') {
        if (that._timer) { clearInterval(that._timer); that._timer = null; }
      }
    });
  },

  doPay: function() {
    var that = this;
    var order = this.data.order;
    if (!order || order.isPaid) return;

    wx.showLoading({ title: '支付中...' });

    app.request('/payments/create', 'POST', {
      orderId: order.id,
      method: 'WECHAT_JSAPI',
    }, function(err, res) {
      wx.hideLoading();
      // In dev mode without WeChat Pay, show a simulated payment dialog
      var isSim = res && res.prepayData && (res.prepayData.prepayId || '').indexOf('sim_') >= 0;
      if (err || !res || !res.success || !res.prepayData || isSim) {
        wx.showModal({
          title: '确认支付',
          content: '支付 ¥' + order.total.toFixed(2) + '？',
          success: function(modalRes) {
            if (modalRes.confirm) {
              app.request('/payments/create', 'POST', {
                orderId: order.id,
                method: 'CASH',
              }, function(e2, r2) {
                if (!e2) {
                  wx.showToast({ title: '支付成功', icon: 'success' });
                  that.loadOrder(order.id);
                }
              });
            }
          },
        });
        return;
      }

      wx.requestPayment({
        timeStamp: res.prepayData.timeStamp || '',
        nonceStr: res.prepayData.nonceStr || '',
        package: 'prepay_id=' + (res.prepayData.prepayId || ''),
        signType: res.prepayData.signType || 'MD5',
        paySign: res.prepayData.paySign || '',
        success: function() {
          wx.showToast({ title: '支付成功', icon: 'success' });
          that.loadOrder(order.id);
        },
        fail: function() {
          wx.showToast({ title: '支付取消', icon: 'none' });
        },
      });
    });
  },
});
