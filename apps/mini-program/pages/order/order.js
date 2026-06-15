var api = require('../../utils/api');
var app = getApp();

Page({
  data: {
    cart: [],
    subtotal: '0.00',
    deliveryFee: 0,
    deliveryLabel: '',
    total: '0.00',
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
    if (!hasTable) this.loadSavedAddresses();
    this.checkNewCustomer();
  },

  checkNewCustomer: function() {
    var that = this;
    var token = app.globalData.token || '';
    if (!token) { that._hasOrders = false; return; }
    wx.request({
      url: app.globalData.baseUrl + '/api/mini-program/orders?status=all',
      header: { 'Authorization': 'Bearer ' + token },
      success: function(res) {
        if (res.statusCode === 200 && res.data) {
          var orders = res.data.orders || [];
          that._hasOrders = orders.length === 0; // true if NO orders (new customer)
          that.loadCart(); // recalculate with discount
        }
      },
    });
  },

  loadSavedAddresses: function() {
    var that = this;
    var token = app.globalData.token || '';
    if (!token) return;
    wx.request({
      url: app.globalData.baseUrl + '/api/mini-program/addresses',
      header: { 'Authorization': 'Bearer ' + token },
      success: function(res) {
        if (res.statusCode === 200 && res.data) {
          var addrs = res.data.addresses || [];
          var def = addrs.find(function(a) { return a.isDefault; }) || addrs[0];
          if (def) {
            that.setData({
              address: def.address || '',
              contactName: def.contactName || '',
              contactPhone: def.phone || '',
            });
          }
          that._savedAddresses = addrs;
        }
      },
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
    var delivery = app.globalData.delivery || { deliveryFee: 5, freeDeliveryMin: 50 };
    var newCust = app.globalData.newCustomer || { enabled: false, amount: 5 };
    var vol = app.globalData.volumeDiscount || { enabled: false, type: "amount", threshold: 3, value: 20 };

    // New customer discount
    var newCustDiscount = 0;
    if (newCust.enabled && !this._hasOrders && subtotal > 0) {
      newCustDiscount = newCust.amount || 5;
    }

    // Volume discount
    var volumeDiscount = 0;
    var volumeLabel = '';
    if (vol.enabled) {
      var itemCount = 0;
      for (var i = 0; i < cart.length; i++) { itemCount += cart[i].quantity; }
      if (vol.type === "amount" && subtotal >= vol.threshold) {
        volumeDiscount = vol.value;
        volumeLabel = '满¥' + vol.threshold + '减¥' + vol.value;
      } else if (vol.type === "percent" && itemCount >= vol.threshold) {
        volumeDiscount = subtotal * (vol.value / 100);
        volumeLabel = '满' + vol.threshold + '件打' + (100 - vol.value) + '折';
      }
    }

    // Buy-give: auto-add free gift when threshold met
    var buyGive = app.globalData.buyGive || { enabled: false, threshold: 88, productName: '赠饮一杯' };
    var giftKey = '__gift__';
    // Remove existing gift if threshold not met
    var giftIdx = -1;
    for (var i = 0; i < cart.length; i++) { if (cart[i]._key === giftKey) { giftIdx = i; break; } }
    if (buyGive.enabled && subtotal >= buyGive.threshold) {
      if (giftIdx < 0) {
        cart.push({ _key: giftKey, productId: 'gift', productName: '🎁 ' + buyGive.productName, quantity: 1, unitPrice: 0, isGift: true });
      }
    } else {
      if (giftIdx >= 0) cart.splice(giftIdx, 1);
    }

    var fee = 0;
    var label = '';
    var freePromo = app.globalData.freeDeliveryPromo || { enabled: false };
    if (this.data.orderType === 'DELIVERY') {
      if (freePromo.enabled) {
        label = '🎉 限时免配送费';
        fee = 0;
      } else if (subtotal >= (delivery.freeDeliveryMin || 0)) {
        label = '免配送费 (满¥' + delivery.freeDeliveryMin + ')';
      } else {
        fee = delivery.deliveryFee || 5;
        label = '配送费 ¥' + fee.toFixed(2);
      }
    }
    // Table charge (茶位费) for dine-in
    var tc = app.globalData.tableCharge || { enabled: false, amount: 0 };
    var tableCharge = 0;
    if (tc.enabled && this.data.orderType === 'DINE_IN') {
      tableCharge = tc.amount * this.data.guests;
    }

    var total = subtotal + fee - newCustDiscount - volumeDiscount + tableCharge;
    if (total < 0) total = 0;
    this.setData({
      cart: cart,
      subtotal: subtotal.toFixed(2),
      newCustDiscount: newCustDiscount,
      volumeDiscount: volumeDiscount,
      volumeLabel: volumeLabel,
      deliveryFee: fee,
      deliveryLabel: label,
      tableCharge: tableCharge,
      total: total.toFixed(2),
    });
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

    // Validate delivery address
    if (this.data.orderType === 'DELIVERY') {
      var addr = (this.data.address || '').trim();
      var name = (this.data.contactName || '').trim();
      var phone = (this.data.contactPhone || '').trim();
      if (!addr) { wx.showToast({ title: '请填写配送地址', icon: 'none' }); return; }
      if (addr.length < 5) { wx.showToast({ title: '地址太短，请填写详细地址', icon: 'none' }); return; }
      if (!name) { wx.showToast({ title: '请填写联系人', icon: 'none' }); return; }
      if (!phone) { wx.showToast({ title: '请填写手机号', icon: 'none' }); return; }
      if (!/^1\d{10}$/.test(phone)) { wx.showToast({ title: '手机号格式不正确', icon: 'none' }); return; }
    }

    // For delivery: confirm address before submitting
    if (this.data.orderType === 'DELIVERY') {
      var addrConfirm = '地址: ' + this.data.address + '\n联系人: ' + this.data.contactName + '\n电话: ' + this.data.contactPhone + '\n\n确认下单？';
      var that = this;
      wx.showModal({
        title: '确认配送信息',
        content: addrConfirm,
        success: function(res) {
          if (res.confirm) that.doSubmit();
        },
      });
      return;
    }

    this.doSubmit();
  },

  doSubmit: function() {
    var that = this;
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
