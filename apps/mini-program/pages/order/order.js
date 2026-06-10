var api = require('../../utils/api');
var app = getApp();

Page({
  data: {
    cart: [],
    subtotal: '0.00',
    tableLabel: '',
    orderType: 'DINE_IN',
    guests: 1,
    note: '',
    address: '',
    contactName: '',
    contactPhone: '',
    submitting: false,
  },

  onLoad: function() {
    var hasTable = !!app.globalData.tableId;
    this.setData({
      tableLabel: app.globalData.tableLabel || '',
      orderType: hasTable ? 'DINE_IN' : 'TAKEOUT',
    });
  },

  onShow: function() {
    this.loadCart();
  },

  loadCart: function() {
    var cart = app.globalData.cart || [];
    var subtotal = 0;
    for (var i = 0; i < cart.length; i++) {
      subtotal += cart[i].unitPrice * cart[i].quantity;
    }
    this.setData({ cart: cart, subtotal: subtotal.toFixed(2) });
  },

  decQty: function(e) {
    var key = e.currentTarget.dataset.key;
    var cart = app.globalData.cart || [];
    var idx = -1;
    for (var i = 0; i < cart.length; i++) { if (cart[i]._key === key) { idx = i; break; } }
    if (idx >= 0) {
      if (cart[idx].quantity > 1) cart[idx].quantity--;
      else cart.splice(idx, 1);
    }
    app.saveCart();
    this.loadCart();
  },

  incQty: function(e) {
    var key = e.currentTarget.dataset.key;
    var cart = app.globalData.cart || [];
    for (var i = 0; i < cart.length; i++) {
      if (cart[i]._key === key) { cart[i].quantity++; break; }
    }
    app.saveCart();
    this.loadCart();
  },

  switchType: function(e) {
    this.setData({ orderType: e.currentTarget.dataset.type });
  },

  onGuestsChange: function(e) {
    this.setData({ guests: e.detail.value });
  },

  onNoteInput: function(e) {
    this.setData({ note: e.detail.value });
  },

  onAddressInput: function(e) {
    this.setData({ address: e.detail.value });
  },

  onContactNameInput: function(e) {
    this.setData({ contactName: e.detail.value });
  },

  onContactPhoneInput: function(e) {
    this.setData({ contactPhone: e.detail.value });
  },

  submitOrder: function() {
    var that = this;
    if (this.data.submitting) return;
    var cart = app.globalData.cart || [];
    if (cart.length === 0) return;

    this.setData({ submitting: true });
    wx.showLoading({ title: '下单中...' });

    var items = [];
    for (var i = 0; i < cart.length; i++) {
      items.push({
        productId: cart[i].productId,
        productName: cart[i].productName,
        quantity: cart[i].quantity,
        unitPrice: cart[i].unitPrice,
        specSnapshot: cart[i].specSnapshot || undefined,
      });
    }

    var orderData = {
      storeId: app.globalData.storeId,
      tableId: this.data.orderType === 'DINE_IN' ? (app.globalData.tableId || undefined) : undefined,
      type: this.data.orderType,
      items: items,
      note: this.data.note || undefined,
      guestCount: this.data.guests,
    };

    // Include delivery address for DELIVERY orders
    if (this.data.orderType === 'DELIVERY') {
      orderData.address = this.data.address;
      orderData.contactName = this.data.contactName;
      orderData.contactPhone = this.data.contactPhone;
    }

    api.submitOrder(orderData, function(err, res) {
      if (err) { wx.hideLoading(); that.setData({ submitting: false }); wx.showToast({ title: '下单失败', icon: 'none' }); return; }

      var orderId = res.id;
      // Step 2: Trigger payment
      wx.showLoading({ title: '支付中...' });
      app.request('/payments/create', 'POST', { orderId: orderId, method: 'WECHAT_JSAPI' }, function(payErr, payRes) {
        wx.hideLoading();
        that.setData({ submitting: false });
        if (payErr || !payRes.success) {
          app.clearCart();
          wx.showToast({ title: '下单成功，支付待完成', icon: 'none' });
          wx.redirectTo({ url: '/pages/order-detail/order-detail?id=' + orderId });
          return;
        }

        // Step 3: Call WeChat Pay (simulated in dev mode)
        if (payRes.prepayData) {
          wx.requestPayment({
            timeStamp: payRes.prepayData.timeStamp || '',
            nonceStr: payRes.prepayData.nonceStr || '',
            package: 'prepay_id=' + (payRes.prepayData.prepayId || ''),
            signType: payRes.prepayData.signType || 'MD5',
            paySign: payRes.prepayData.paySign || '',
            success: function() {
              app.clearCart();
              wx.showToast({ title: '支付成功', icon: 'success' });
              wx.redirectTo({ url: '/pages/order-detail/order-detail?id=' + orderId });
            },
            fail: function() {
              app.clearCart();
              wx.showToast({ title: '支付取消', icon: 'none' });
              wx.redirectTo({ url: '/pages/order-detail/order-detail?id=' + orderId });
            },
          });
        } else {
          app.clearCart();
          wx.showToast({ title: '下单成功', icon: 'success' });
          wx.redirectTo({ url: '/pages/order-detail/order-detail?id=' + orderId });
        }
      });
    });
  },
});
