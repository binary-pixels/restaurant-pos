Page({
  clearCache: function() {
    wx.showModal({
      title: '清除缓存',
      content: '确定清除本地缓存？',
      success: function(res) {
        if (res.confirm) {
          wx.clearStorageSync();
          wx.showToast({ title: '缓存已清除', icon: 'success' });
        }
      },
    });
  },
  callService: function() {
    wx.makePhoneCall({ phoneNumber: '13800000000' });
  },
});
