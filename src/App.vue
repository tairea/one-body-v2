<script setup>
// @ts-check
import { useAppStore } from "./stores/app";
import { onMounted, computed } from "vue";

const appStore = useAppStore();
const theme = computed(() => appStore.isDarkMode ? "dark" : "light");

onMounted(() => {
  appStore.initializeDarkMode();
  appStore.initAuth();

  const logoUrl = import.meta.env.VITE_COMMUNITY_LOGO_URL;
  if (logoUrl) {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = logoUrl;
  }
});
</script>

<template>
  <v-app :theme="theme">
    <RouterView />
  </v-app>
</template>

<style scoped></style>
