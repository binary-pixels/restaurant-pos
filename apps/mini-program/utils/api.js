function getMenu(cb) {
  var app = getApp();
  app.request('/mini-program/menu', 'GET', null, cb);
}

function submitOrder(data, cb) {
  var app = getApp();
  app.request('/mini-program/order', 'POST', data, cb);
}

function getOrders(status, cb) {
  var app = getApp();
  app.request('/mini-program/orders?status=' + (status || ''), 'GET', null, cb);
}

function getOrderDetail(orderId, cb) {
  var app = getApp();
  app.request('/mini-program/orders/' + orderId, 'GET', null, cb);
}

function wxLogin(code, userInfo, cb) {
  var app = getApp();
  app.request('/mini-program/auth', 'POST', { code: code, userInfo: userInfo }, cb);
}

function getProfile(cb) {
  var app = getApp();
  app.request('/mini-program/profile', 'GET', null, cb);
}

module.exports = {
  getMenu: getMenu,
  submitOrder: submitOrder,
  getOrders: getOrders,
  getOrderDetail: getOrderDetail,
  wxLogin: wxLogin,
  getProfile: getProfile,
};
