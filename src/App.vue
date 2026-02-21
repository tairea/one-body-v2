<script setup>
// @ts-check
import { useAppStore } from "./stores/app";
import { onMounted, computed } from "vue";

const appStore = useAppStore();
const theme = computed(() => appStore.isDarkMode ? "dark" : "light");

onMounted(() => {
  appStore.initializeDarkMode();
});
</script>

<template>
  <v-app :theme="theme">
    <RouterView />
  </v-app>
</template>

<style scoped></style>
