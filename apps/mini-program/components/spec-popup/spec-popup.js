Component({
  properties: {
    product: { type: Object, value: null },
    show: { type: Boolean, value: false },
  },
  data: {
    selected: {},
  },
  observers: {
    'product': function(p) {
      if (p && p.specs) {
        var selected = {};
        for (var i = 0; i < p.specs.length; i++) {
          var s = p.specs[i];
          if (s.options && s.options.length > 0) selected[s.id] = s.options[0].id;
        }
        this.setData({ selected: selected });
      }
    },
  },
  methods: {
    selectOption: function(e) {
      var specId = e.currentTarget.dataset.specId;
      var optId = e.currentTarget.dataset.optId;
      var key = 'selected.' + specId;
      var obj = {};
      obj[key] = optId;
      this.setData(obj);
    },
    onConfirm: function() {
      this.triggerEvent('confirm', { product: this.properties.product, options: this.data.selected });
    },
    onClose: function() {
      this.triggerEvent('close');
    },
  },
});
