var app = getApp();

Page({
  data: {
    addresses: [],
    loading: true,
    showForm: false,
    editingId: null,
    form: { label: '', address: '', contactName: '', phone: '', isDefault: false },
  },

  onShow: function() {
    this.loadAddresses();
  },

  loadAddresses: function() {
    var that = this;
    var token = app.globalData.token || '';
    wx.request({
      url: app.globalData.baseUrl + '/api/mini-program/addresses',
      header: { 'Authorization': 'Bearer ' + token },
      success: function(res) {
        if (res.statusCode === 200 && res.data) {
          that.setData({ addresses: res.data.addresses || [], loading: false });
        }
      },
      fail: function() { that.setData({ loading: false }); },
    });
  },

  showForm: function() {
    this.setData({
      showForm: true,
      editingId: null,
      form: { label: '', address: '', contactName: '', phone: '', isDefault: false },
    });
  },

  editAddr: function(e) {
    var id = e.currentTarget.dataset.id;
    var addr = this.data.addresses.find(function(a) { return a.id === id; });
    if (addr) {
      this.setData({
        showForm: true,
        editingId: id,
        form: { label: addr.label || '', address: addr.address, contactName: addr.contactName || '', phone: addr.phone || '', isDefault: addr.isDefault },
      });
    }
  },

  closeForm: function() {
    this.setData({ showForm: false });
  },

  onFieldChange: function(e) {
    var field = e.currentTarget.dataset.field;
    var val = {};
    val['form.' + field] = e.detail.value;
    this.setData(val);
  },

  toggleDefault: function() {
    this.setData({ 'form.isDefault': !this.data.form.isDefault });
  },

  saveAddr: function() {
    var that = this;
    var form = this.data.form;
    if (!form.address.trim()) { wx.showToast({ title: '请填写地址', icon: 'none' }); return; }

    var token = app.globalData.token || '';
    var method = this.data.editingId ? 'PUT' : 'POST';
    var body = {
      label: form.label.trim(),
      address: form.address.trim(),
      contactName: form.contactName.trim(),
      contactPhone: form.phone.trim(),
      isDefault: form.isDefault,
    };
    if (this.data.editingId) body.id = this.data.editingId;

    wx.request({
      url: app.globalData.baseUrl + '/api/mini-program/addresses',
      method: method,
      header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      data: body,
      success: function() {
        that.setData({ showForm: false });
        that.loadAddresses();
        wx.showToast({ title: '保存成功', icon: 'success' });
      },
    });
  },

  deleteAddr: function(e) {
    var that = this;
    var id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除地址',
      content: '确定删除？',
      success: function(res) {
        if (res.confirm) {
          var token = app.globalData.token || '';
          wx.request({
            url: app.globalData.baseUrl + '/api/mini-program/addresses?id=' + id,
            method: 'DELETE',
            header: { 'Authorization': 'Bearer ' + token },
            success: function() { that.loadAddresses(); },
          });
        }
      },
    });
  },

  setDefault: function(e) {
    var that = this;
    var id = e.currentTarget.dataset.id;
    var token = app.globalData.token || '';
    wx.request({
      url: app.globalData.baseUrl + '/api/mini-program/addresses',
      method: 'PUT',
      header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      data: { id: id, isDefault: true },
      success: function() {
        that.loadAddresses();
        wx.showToast({ title: '已设为默认地址', icon: 'success' });
      },
    });
  },
});
