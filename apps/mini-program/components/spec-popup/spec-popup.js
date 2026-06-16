Component({
  properties: {
    product: { type: Object, value: null },
    show: { type: Boolean, value: false },
  },
  data: {
    selected: {},
    qty: 1,
    totalPrice: 0,
  },
  observers: {
    'product': function(p) {
      if (!p) return;
      var selected = {};
      if (p.specs) {
        for (var i = 0; i < p.specs.length; i++) {
          var s = p.specs[i];
          if (s.options && s.options.length > 0) selected[s.id] = s.options[0].id;
        }
      }
      this.setData({ selected: selected, qty: 1 });
      this.calcTotal();
    },
    'qty': function() { this.calcTotal(); },
    'selected': function() { this.calcTotal(); },
  },
  methods: {
    calcTotal: function() {
      var p = this.properties.product;
      if (!p) return;
      var price = p.discountPrice > 0 ? p.discountPrice : p.price;
      var adj = 0;
      if (p.specs) {
        for (var i = 0; i < p.specs.length; i++) {
          var s = p.specs[i];
          var optId = this.data.selected[s.id];
          if (s.options) {
            for (var j = 0; j < s.options.length; j++) {
              if (s.options[j].id === optId) adj += s.options[j].priceAdj || 0;
            }
          }
        }
      }
      this.setData({ totalPrice: ((price + adj) * this.data.qty).toFixed(2) });
    },
    selectOption: function(e) {
      var specId = e.currentTarget.dataset.specId;
      var optId = e.currentTarget.dataset.optId;
      var obj = {};
      obj['selected.' + specId] = optId;
      this.setData(obj);
    },
    decQty: function() {
      if (this.data.qty > 1) this.setData({ qty: this.data.qty - 1 });
    },
    incQty: function() {
      this.setData({ qty: this.data.qty + 1 });
    },
    onConfirm: function() {
      this.triggerEvent('confirm', {
        product: this.properties.product,
        options: this.data.selected,
        qty: this.data.qty,
        totalPrice: this.data.totalPrice,
      });
    },
    onClose: function() {
      this.triggerEvent('close');
    },
  },
});
