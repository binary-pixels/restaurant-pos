var app = getApp();

Page({
  data: {
    checkedToday: false,
    streak: 0,
    totalPoints: 0,
    todayPoints: 1,
    days: [],
  },

  onShow: function() {
    this.loadStatus();
    this.buildCalendar();
  },

  loadStatus: function() {
    var that = this;
    var token = app.globalData.token || '';
    if (!token) return;
    wx.request({
      url: app.globalData.baseUrl + '/api/mini-program/checkin',
      header: { 'Authorization': 'Bearer ' + token },
      success: function(res) {
        if (res.statusCode === 200 && res.data) {
          var d = res.data;
          var bonus = d.streak > 0 && (d.streak + 1) % 7 === 0 ? 5 : 1;
          that.setData({
            checkedToday: d.checkedToday,
            streak: d.streak,
            totalPoints: d.totalPoints,
            todayPoints: bonus,
          });
          that.buildCalendar();
        }
      },
    });
  },

  doCheckIn: function() {
    var that = this;
    if (this.data.checkedToday) return;
    var token = app.globalData.token || '';
    wx.request({
      url: app.globalData.baseUrl + '/api/mini-program/checkin',
      method: 'POST',
      header: { 'Authorization': 'Bearer ' + token },
      success: function(res) {
        if (res.statusCode === 200 && res.data) {
          wx.showToast({ title: '+' + res.data.points + '积分', icon: 'success' });
          that.loadStatus();
        } else if (res.data && res.data.error) {
          wx.showToast({ title: res.data.error, icon: 'none' });
        }
      },
    });
  },

  buildCalendar: function() {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var today = now.getDate();
    var days = [];
    for (var d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, date: year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0'), isToday: d === today, checked: this.isCheckedDate(d, month, year) });
    }
    this.setData({ days: days });
  },

  isCheckedDate: function(day, month, year) {
    // Simple: mark all past dates as checked for demo
    var today = new Date();
    var targetDate = new Date(year, month, day);
    return targetDate < today;
  },
});
