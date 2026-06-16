var api = require('../../utils/api');
var app = getApp();

Page({
  data: {
    tableLabel: '',
    keyword: '',
    activeCat: 'all',
    categories: [],
    products: [],
    filteredProducts: [{ id: '0', name: '加载中...', price: 0, unit: '' }],
    loading: true,
    cartCount: 0,
    cartTotal: 0,
    showBackTop: false,
    showSpec: false,
    specProduct: null,
  },

  onLoad: function(options) {
    var t = options.table || '';
    if (t) {
      var label = decodeURIComponent(t);
      app.globalData.tableLabel = label;
      this.setData({ tableLabel: label });
    }
    if (options.tableId) app.globalData.tableId = options.tableId;
    if (options.storeId) app.globalData.storeId = options.storeId;
  },

  onReady: function() {
    this.loadMenu();
  },

  onShow: function() {
    this.updateCart();
  },

  loadMenu: function() {
    var that = this;
    wx.request({
      url: app.globalData.baseUrl + '/api/mini-program/menu',
      timeout: 15000,
      success: function(res) {
        if (res.statusCode === 200 && res.data) {
          var now = new Date();
          var products = (res.data.products || []).map(function(p) {
            var onSale = !!(p.discountPrice && p.discountPrice > 0 && p.discountEnd && new Date(p.discountEnd) > now);
            return { id: p.id, categoryId: p.categoryId, name: p.name, price: p.price, unit: p.unit, _qty: 0, hasSpecs: !!(p.specs && p.specs.length > 0), discountPrice: onSale ? p.discountPrice : 0, isRecommended: !!p.isRecommended };
          });
          that._rawProducts = res.data.products || [];
          // Save delivery config globally
          if (res.data.delivery) app.globalData.delivery = res.data.delivery;
          if (res.data.newCustomer) app.globalData.newCustomer = res.data.newCustomer;
          if (res.data.volumeDiscount) app.globalData.volumeDiscount = res.data.volumeDiscount;
          if (res.data.buyGive) app.globalData.buyGive = res.data.buyGive;
          if (res.data.freeDelivery) app.globalData.freeDeliveryPromo = res.data.freeDelivery;
          if (res.data.tableCharge) app.globalData.tableCharge = res.data.tableCharge;
          var recommended = products.filter(function(p) { return p.isRecommended; });
          that.setData({ categories: res.data.categories || [], products: products, filteredProducts: products, recommended: recommended, loading: false });
        }
      },
    });
    // Load announcement separately
    wx.request({
      url: app.globalData.baseUrl + '/api/announcements?public=1',
      success: function(res) {
        if (res.statusCode === 200 && res.data && res.data.title) {
          that.setData({ announcement: res.data });
        }
        }
      },
      fail: function() {
        that.setData({ loading: false, filteredProducts: [{ id: 'err', name: '加载失败，下拉重试', price: 0, unit: '' }] });
      }
    });
  },

  onSearch: function(e) {
    this.setData({ keyword: e.detail.value });
    this.filterProducts();
  },

  switchCat: function(e) {
    this.setData({ activeCat: e.currentTarget.dataset.id, showBackTop: false });
    this.filterProducts();
    wx.pageScrollTo({ scrollTop: 0, duration: 200 });
  },

  onPageScroll: function(e) {
    this.setData({ showBackTop: e.scrollTop > 500 });
  },

  scrollToTop: function() {
    wx.pageScrollTo({ scrollTop: 0, duration: 300 });
  },

  filterProducts: function() {
    var activeCat = this.data.activeCat;
    var keyword = this.data.keyword;
    var cart = app.globalData.cart || [];
    var filtered = this.data.products;
    if (activeCat !== 'all') filtered = filtered.filter(function(p) { return p.categoryId === activeCat; });
    if (keyword) filtered = filtered.filter(function(p) { return p.name.indexOf(keyword) >= 0; });
    filtered = filtered.map(function(p) {
      var inCart = cart.find(function(c) { return c.productId === p.id; });
      return { id: p.id, categoryId: p.categoryId, name: p.name, price: p.price, unit: p.unit, _qty: inCart ? inCart.quantity : 0, hasSpecs: p.hasSpecs };
    });
    this.setData({ filteredProducts: filtered.length > 0 ? filtered : [{ id: 'empty', name: '没有匹配的菜品', price: 0, unit: '' }] });
  },

  incQty: function(e) {
    var id = e.currentTarget.dataset.id;
    var cart = app.globalData.cart || [];
    var existing = cart.find(function(c) { return c.productId === id; });
    if (existing) { existing.quantity++; }
    else {
      var product = this.data.products.find(function(p) { return p.id === id; });
      if (product) cart.push({ productId: id, productName: product.name, quantity: 1, unitPrice: product.price });
    }
    app.globalData.cart = cart;
    app.saveCart();
    this.filterProducts();
    this.updateCart();
  },

  decQty: function(e) {
    var id = e.currentTarget.dataset.id;
    var cart = app.globalData.cart || [];
    var idx = cart.findIndex(function(c) { return c.productId === id; });
    if (idx >= 0) {
      if (cart[idx].quantity > 1) cart[idx].quantity--;
      else cart.splice(idx, 1);
    }
    app.globalData.cart = cart;
    app.saveCart();
    this.filterProducts();
    this.updateCart();
  },

  openSpec: function(e) {
    var product = e.currentTarget.dataset.product;
    var full = (this._rawProducts || []).find(function(p) { return p.id === product.id; });
    // Show detail popup for ALL products
    this.setData({ showSpec: true, specProduct: full || product });
  },

  onSpecConfirm: function(e) {
    var product = e.detail.product;
    var options = e.detail.options;
    var qty = e.detail.qty || 1;
    var totalPrice = parseFloat(e.detail.totalPrice) || product.price;
    var keys = [];
    for (var k in options) keys.push(options[k]);
    var specKey = keys.join(',');
    var cart = app.globalData.cart || [];
    var key = product.id + '_' + specKey;
    var existing = cart.find(function(c) { return c._key === key; });
    if (existing) { existing.quantity += qty; }
    else cart.push({ _key: key, productId: product.id, productName: product.name, quantity: qty, unitPrice: parseFloat((totalPrice / qty).toFixed(2)), specSnapshot: specKey || undefined });
    app.globalData.cart = cart;
    app.saveCart();
    this.setData({ showSpec: false, specProduct: null });
    this.filterProducts();
    this.updateCart();
  },

  onSpecClose: function() {
    this.setData({ showSpec: false, specProduct: null });
  },

  updateCart: function() {
    var cart = app.globalData.cart || [];
    var count = 0, total = 0;
    for (var i = 0; i < cart.length; i++) { count += cart[i].quantity; total += cart[i].unitPrice * cart[i].quantity; }
    this.setData({ cartCount: count, cartTotal: total.toFixed(2) });
  },

  goOrder: function() {
    if (this.data.cartCount === 0) return;
    wx.navigateTo({ url: '/pages/order/order' });
  },
  onPullDownRefresh: function() {
    this.loadMenu();
    wx.stopPullDownRefresh();
  },
  onShareAppMessage: function() {
    return { title: '来' + (app.globalData.tableLabel || '餐厅') + '点餐吧！', path: '/pages/index/index' };
  },
});
