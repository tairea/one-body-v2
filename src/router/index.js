// @ts-check
import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import Signup from "../views/Signup.vue";
import Countdown from "../views/Countdown.vue";
import InteractiveCytoscapeView from "../views/InteractiveCytoscapeView.vue";

// NOTE: If changing these routes, make sure to add them to server/app.js.
const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/signup",
    name: "Signup",
    component: Signup,
  },
  {
    path: "/countdown",
    name: "Countdown",
    component: Countdown,
  },
  {
    path: "/interactive-cytoscape",
    name: "InteractiveCytoscape",
    component: InteractiveCytoscapeView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
