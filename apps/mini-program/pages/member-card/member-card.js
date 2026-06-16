var app = getApp();

var TIER_COLORS = {
  REGULAR: ["#6b7280", "#4b5563"],
  SILVER: ["#94a3b8", "#64748b"],
  GOLD: ["#f59e0b", "#d97706"],
  DIAMOND: ["#8b5cf6", "#6d28d9"],
};

var TIER_LABELS = {
  REGULAR: "普通会员", SILVER: "银卡会员", GOLD: "金卡会员", DIAMOND: "钻石会员",
};

Page({
  data: {
    userName: "会员",
    tierLabel: "普通会员",
    tierColor: "#6b7280",
    tierColor2: "#4b5563",
    points: 0,
    balance: "0.00",
    phone: "",
    qrUrl: "",
  },

  onShow: function() {
    var that = this;
    var token = app.globalData.token || "";
    if (!token) { wx.showToast({ title: "请先登录", icon: "none" }); return; }

    wx.request({
      url: app.globalData.baseUrl + "/api/mini-program/profile",
      header: { Authorization: "Bearer " + token },
      success: function(res) {
        if (res.statusCode === 200 && res.data) {
          var d = res.data;
          var tier = d.tier || "REGULAR";
          var colors = TIER_COLORS[tier] || TIER_COLORS.REGULAR;
          var phone = d.phone || token;
          that.setData({
            userName: d.name || "会员",
            tierLabel: TIER_LABELS[tier] || tier,
            tierColor: colors[0],
            tierColor2: colors[1],
            points: d.points || 0,
            balance: (d.balance || 0).toFixed(2),
            phone: phone,
            qrUrl: app.globalData.baseUrl + "/api/qrcode?url=" + encodeURIComponent("member:" + phone) + "&size=200",
          });
        }
      },
    });
  },
});
