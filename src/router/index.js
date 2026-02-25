// @ts-check
import { createRouter, createWebHistory } from "vue-router";
import { supabase } from "../lib/supabase.js";
import Auth from "../views/Auth.vue";
import Home from "../views/Home.vue";
import Countdown from "../views/Countdown.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
    meta: { requiresAuth: true },
  },
  {
    path: "/auth",
    name: "Auth",
    component: Auth,
    meta: { requiresGuest: true },
  },
  {
    path: "/countdown",
    name: "Countdown",
    component: Countdown,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const isAuthed = !!session;

  if (to.meta.requiresAuth && !isAuthed) {
    return { name: "Auth" };
  }
  if (to.meta.requiresGuest && isAuthed) {
    return { name: "Home" };
  }
});

export default router;
