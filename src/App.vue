<script setup>
import Home from './components/Home.vue'
import { useAppStore } from './stores/app'
import { onMounted } from 'vue'

const appStore = useAppStore()
onMounted(() => {
  appStore.initializeDarkMode()
})
</script>

<template>
  <Home />
</template>

<style scoped>

</style>
