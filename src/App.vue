<script setup>
import { useAppStore } from "./stores/app";
import { onMounted } from "vue";

const appStore = useAppStore();
onMounted(() => {
  appStore.initializeDarkMode();
});
</script>

<template>
  <RouterView />
</template>

<style scoped></style>
