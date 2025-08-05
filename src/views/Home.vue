<script setup>
import { ref } from "vue";
import { useAppStore } from "../stores/app";
import LeftPanel from "../components/LeftPanel.vue";
import CytoscapeGraph from "../components/CytoscapeGraph.vue";
import DarkModeToggle from "../components/DarkModeToggle.vue";
import GlobeGL from "../components/GlobeGL.vue";

const appStore = useAppStore();
const cytoscapeRef = ref(null);

</script>

<template>
  <div class="app-container">
    <DarkModeToggle />
    <LeftPanel
    />
    
    <!-- Both components always rendered, visibility controlled by CSS -->
    <div class="components-container">
      <CytoscapeGraph 
        ref="cytoscapeRef" 
        :class="{ 'active': appStore.activeComponent === 'cytoscape' }"
      />
      <GlobeGL 
        :class="{ 'active': appStore.activeComponent === 'globe' }"
      />
    </div>
     
  </div>
</template>

<style scoped>
.app-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.components-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.components-container > * {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.6s ease-in-out;
  pointer-events: none;
}

.components-container > *.active {
  opacity: 1;
  pointer-events: auto;
}
</style>
