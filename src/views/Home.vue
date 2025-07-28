<script setup>
import { ref } from "vue";
import { useAppStore } from "../stores/app";
import LeftSideOverlay from "../components/LeftSideOverlay.vue";
import CytoscapeGraph from "../components/CytoscapeGraph.vue";
import DarkModeToggle from "../components/DarkModeToggle.vue";
import GlobeGL from "../components/GlobeGL.vue";

const appStore = useAppStore();
const cytoscapeRef = ref(null);

const handleShowAiView = () => {
  cytoscapeRef.value?.showAiView();
};

const handleShowMembersView = () => {
  cytoscapeRef.value?.showMembersView();
};
</script>

<template>
  <div class="app-container">
    <DarkModeToggle />
    <LeftSideOverlay
      @showAiView="handleShowAiView"
      @showMembersView="handleShowMembersView"
    />
    
    <!-- Conditionally render components based on app store state -->
    <CytoscapeGraph 
      v-if="appStore.activeComponent === 'cytoscape'" 
      ref="cytoscapeRef" 
    />
    <GlobeGL v-if="appStore.activeComponent === 'globe'" />
     
  </div>
</template>

<style scoped>
.app-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
