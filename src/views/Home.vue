<script setup>
import { ref } from "vue";
import LeftSideOverlay from "../components/LeftSideOverlay.vue";
import CytoscapeGraph from "../components/CytoscapeGraph.vue";
import DarkModeToggle from "../components/DarkModeToggle.vue";

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
