<script setup>
// @ts-check
import { onMounted, ref } from "vue";
import CytoscapeGraph from "../components/CytoscapeGraph.vue";
import DarkModeToggle from "../components/DarkModeToggle.vue";
import GlobeGL from "../components/GlobeGL.vue";
import HomeLeftPanel from "../components/HomeLeftPanel.vue";
import HomeRightPanel from "../components/HomeRightPanel.vue";
import { useAppStore } from "../stores/app";
import InteractiveCytoscapeMany from "../components/InteractiveCytoscapeMany.vue";
/** @import { Person } from "../types.d.ts" */

const appStore = useAppStore();
const cytoscapeRef = ref(null);

// State for handling node position changes
const hasNodePositionChanges = ref(false);
const isSavingPositions = ref(false);

/**
 * @internal
 * @typedef {object} GraphData
 * @prop {ReadonlyArray<Person>} people
 */

/** @returns {Promise<GraphData>} */
const fetchGraphData = async () => {
  // const graphUrl = new URL("/api/graph", location.href);
  const graphUrl = new URL("/api/graph", "https://dwebonebody.online/");
  const response = await fetch(graphUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch graph with status ${response.status}`);
  }
  return await response.json();
};

// Handle node position changes from the cytoscape component
const handleNodePositionChanged = () => {
  hasNodePositionChanges.value = true;
};

// Handle saving graph snapshot
const handleSaveNodePositions = async () => {
  if (!cytoscapeRef.value) return;
  
  try {
    isSavingPositions.value = true;
    await cytoscapeRef.value.saveGraphSnapshot();
    hasNodePositionChanges.value = false;
  } catch (error) {
    console.error('Error saving node positions:', error);
  } finally {
    isSavingPositions.value = false;
  }
};

onMounted(async () => {
  const { people } = await fetchGraphData();
  appStore.setPeople(people);
});
</script>

<template>
  <div class="app-container" v-if="true">
    <DarkModeToggle />
    <HomeLeftPanel />
    <HomeRightPanel 
      v-if="appStore.people && appStore.people.length > 0"
      :person="appStore.people[0]"
      :hasNodePositionChanges="hasNodePositionChanges"
      :isSavingPositions="isSavingPositions"
      @saveNodePositions="handleSaveNodePositions"
    />

    <div v-if="appStore.people" class="components-container">
      <!-- <CytoscapeGraph
        ref="cytoscapeRef"
        :people="appStore.people"
        :class="{ active: appStore.activeComponent === 'cytoscape' }"
      /> -->
      <InteractiveCytoscapeMany
        ref="cytoscapeRef"
        :people="appStore.people"
        :class="{ active: appStore.activeComponent === 'cytoscape' }"
        @nodePositionChanged="handleNodePositionChanged"
        @graphSnapshotSaved="handleSaveNodePositions"
      />
      <GlobeGL
        :people="appStore.people"
        :class="{ active: appStore.activeComponent === 'globe' }"
      />
    </div>
  </div>
  <div class="app-container" v-else>
    Coming soon...
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
