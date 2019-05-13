import 'babel-polyfill';
import Vue from 'vue';
import App from './App';
import router from './router/client';
import iView from 'iview';
import 'iview/dist/styles/iview.css';
// import router from './router/admin';
import store from './store';


import './assets/css/common.less';
import './assets/font/iconfont.css';

Vue.config.productionTip = false;
Vue.use(iView);
/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  template: '<App/>',
  components: { App }
});
