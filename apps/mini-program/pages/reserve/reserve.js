var app = getApp();

Page({
  data: {
    name: '',
    phone: '',
    date: '',
    timeSlots: ['11:00-12:00', '12:00-13:00', '13:00-14:00', '17:00-18:00', '18:00-19:00', '19:00-20:00'],
    timeIdx: 0,
    guests: 2,
    note: '',
    myReservations: [],
  },

  onShow: function() {
    this.loadMyReservations();
  },

  onField: function(e) {
    var f = e.currentTarget.dataset.field;
    var d = {}; d[f] = e.detail.value;
    this.setData(d);
  },
  onDateChange: function(e) { this.setData({ date: e.detail.value }); },
  onTimeChange: function(e) { this.setData({ timeIdx: Number(e.detail.value) }); },

  doReserve: function() {
    var that = this;
    var name = (this.data.name || '').trim();
    var phone = (this.data.phone || '').trim();
    if (!name || !phone || !this.data.date) {
      wx.showToast({ title: '请填写姓名、手机号、日期', icon: 'none' }); return;
    }
    if (!/^1\d{10}$/.test(phone)) { wx.showToast({ title: '手机号格式不正确', icon: 'none' }); return; }

    var token = app.globalData.token || '';
    wx.request({
      url: app.globalData.baseUrl + '/api/mini-program/reserve',
      method: 'POST',
      header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      data: {
        name: name, phone: phone, date: this.data.date,
        timeSlot: this.data.timeSlots[this.data.timeIdx],
        guests: this.data.guests, note: this.data.note,
        tableLabel: '待安排', storeId: app.globalData.storeId || '',
      },
      success: function(res) {
        if (res.statusCode === 200) {
          wx.showToast({ title: '预订成功，等待确认', icon: 'success' });
          that.setData({ name: '', phone: '', note: '', guests: 2 });
          that.loadMyReservations();
        } else wx.showToast({ title: '预订失败', icon: 'none' });
      },
    });
  },

  loadMyReservations: function() {
    var that = this;
    var token = app.globalData.token || '';
    wx.request({
      url: app.globalData.baseUrl + '/api/mini-program/reserve',
      header: { 'Authorization': 'Bearer ' + token },
      success: function(res) {
        if (res.statusCode === 200 && res.data) {
          that.setData({ myReservations: res.data.reservations || [] });
        }
      },
    });
  },
});
