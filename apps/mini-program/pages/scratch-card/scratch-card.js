var app = getApp();

Page({
  data: {
    scratched: false,
    result: null,
    spinning: false,
  },
  _ctx: null,
  _scratchedPixels: 0,
  _totalPixels: 0,

  onLoad: function() {
    var that = this;
    // Load prizes
    var token = app.globalData.token || '';
    wx.request({
      url: app.globalData.baseUrl + '/api/mini-program/lucky-wheel',
      header: { 'Authorization': 'Bearer ' + token },
      success: function(res) {
        if (res.statusCode === 200 && res.data && res.data.prizes) {
          that._prizes = res.data.prizes;
          that.initCanvas();
        }
      },
    });
  },

  initCanvas: function() {
    var that = this;
    var ctx = wx.createCanvasContext('scratchCard', that);
    that._ctx = ctx;

    // Draw scratch layer
    ctx.setFillStyle('#888');
    ctx.fillRect(0, 0, 280, 180);
    ctx.setFillStyle('#aaa');
    ctx.setFontSize(14);
    ctx.setTextAlign('center');
    ctx.fillText('刮开此处', 140, 95);
    ctx.draw();
    that._scratchedPixels = 0;
    that._totalPixels = 280 * 180;
  },

  onTouchStart: function(e) { this.scratch(e); },
  onTouchMove: function(e) { this.scratch(e); },

  scratch: function(e) {
    if (!this._ctx || this.data.spinning) return;
    var touch = e.touches[0];
    if (!touch) return;
    var ctx = this._ctx;
    // Clear a circle at touch point
    ctx.clearRect(touch.x - 15, touch.y - 15, 30, 30);
    ctx.draw(true);
    this._scratchedPixels += 900; // ~30x30
    // Reveal when 40% scratched
    if (this._scratchedPixels > this._totalPixels * 0.4) {
      this.reveal();
    }
  },

  onTouchEnd: function() {
    // Auto-reveal after 1 second if partially scratched
    if (this._scratchedPixels > this._totalPixels * 0.2) {
      var that = this;
      setTimeout(function() { that.reveal(); }, 1000);
    }
  },

  reveal: function() {
    if (this.data.spinning || this.data.scratched) return;
    var that = this;
    this.setData({ spinning: true });

    // Spin API
    var token = app.globalData.token || '';
    if (!token) { wx.showToast({ title: '请先登录', icon: 'none' }); return; }

    wx.request({
      url: app.globalData.baseUrl + '/api/mini-program/lucky-wheel',
      method: 'POST',
      header: { 'Authorization': 'Bearer ' + token },
      success: function(res) {
        that.setData({ spinning: false, scratched: true, result: res.data.prize });
        // Clear canvas
        if (that._ctx) {
          that._ctx.clearRect(0, 0, 280, 180);
          that._ctx.draw();
        }
      },
      fail: function() {
        that.setData({ spinning: false, scratched: true, result: { name: '网络错误', type: 'none', value: 0 } });
      },
    });
  },

  reset: function() {
    this.setData({ scratched: false, result: null });
    this.initCanvas();
  },
});
