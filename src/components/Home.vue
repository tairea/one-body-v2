<script setup>
import { ref } from 'vue'
import Sidebar from './Sidebar.vue'
import Cytoscape from './Cytoscape.vue' 
defineProps({
  
})

const count = ref(0)
</script>

<template>
  <div class="app-container">
    <Sidebar />
    <Cytoscape />
  </div>
</template>

<style scoped>
.app-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
