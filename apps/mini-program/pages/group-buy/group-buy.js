var app = getApp();

Page({
  data: {
    groups: [],
    showForm: false,
    form: { productName: '', price: '', origPrice: '', minPeople: 2 },
  },

  onShow: function() { this.loadGroups(); },

  loadGroups: function() {
    var that = this;
    wx.request({
      url: app.globalData.baseUrl + '/api/mini-program/group-buy',
      success: function(res) {
        if (res.statusCode === 200 && res.data) {
          var groups = (res.data.groups || []).map(function(g) {
            var exp = new Date(g.expiresAt).getTime() - Date.now();
            g.expiresIn = exp > 0 ? Math.floor(exp / 3600000) + '小时' : '已过期';
            return g;
          });
          that.setData({ groups: groups });
        }
      },
    });
  },

  showCreate: function() { this.setData({ showForm: true }); },
  closeForm: function() { this.setData({ showForm: false }); },

  onField: function(e) {
    var f = e.currentTarget.dataset.field;
    var val = {};
    val['form.' + f] = e.detail.value;
    this.setData(val);
  },

  doCreate: function() {
    var that = this;
    var f = this.data.form;
    if (!f.productName || !f.price) { wx.showToast({ title: '请填写商品和价格', icon: 'none' }); return; }
    var token = app.globalData.token || '';
    wx.request({
      url: app.globalData.baseUrl + '/api/mini-program/group-buy',
      method: 'POST',
      header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      data: { productName: f.productName, price: Number(f.price), origPrice: Number(f.origPrice) || Number(f.price), minPeople: Number(f.minPeople) || 2, productId: 'gb_' + Date.now(), storeId: app.globalData.storeId || '' },
      success: function() { that.setData({ showForm: false }); that.loadGroups(); wx.showToast({ title: '拼团已发起', icon: 'success' }); },
    });
  },

  joinGroup: function(e) {
    var that = this;
    var id = e.currentTarget.dataset.id;
    var token = app.globalData.token || '';
    if (!token) { wx.showToast({ title: '请先登录', icon: 'none' }); return; }
    wx.request({
      url: app.globalData.baseUrl + '/api/mini-program/group-buy',
      method: 'PUT',
      header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      data: { groupId: id },
      success: function(res) {
        if (res.statusCode === 200 && res.data) {
          if (res.data.filled) wx.showToast({ title: '🎉 拼团成功！', icon: 'success' });
          else wx.showToast({ title: '加入成功', icon: 'success' });
          that.loadGroups();
        } else wx.showToast({ title: (res.data && res.data.error) || '加入失败', icon: 'none' });
      },
    });
  },
});
