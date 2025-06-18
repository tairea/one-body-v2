<script setup>
import { ref } from 'vue'
import LeftSideOverlay from './LeftSideOverlay.vue'
import CytoscapeGraph from './CytoscapeGraph.vue'

const cytoscapeRef = ref(null)

const handleShowAiView = () => {
  cytoscapeRef.value?.showAiView()
}

const handleShowMembersView = () => {
  cytoscapeRef.value?.showMembersView()
}
</script>

<template>
  <div class="app-container">
    <LeftSideOverlay 
      @showAiView="handleShowAiView"
      @showMembersView="handleShowMembersView"
    />
    <CytoscapeGraph ref="cytoscapeRef" />
  </div>
</template>

<style scoped>
.app-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
