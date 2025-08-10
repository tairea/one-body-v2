// @ts-check
import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import { createPinia } from "pinia";
import router from "./router/index.js";
import { useAppStore } from "./stores/app.js";

// Vuetify
import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import "@mdi/font/css/materialdesignicons.css";

const vuetify = createVuetify({
  components,
  directives,
});

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);
app.use(vuetify);

// Initialize store from localStorage after pinia is set up
const appStore = useAppStore();
appStore.initializeFromStorage();

app.mount("#app");
