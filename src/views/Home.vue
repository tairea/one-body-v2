<script setup>
// @ts-check
import { base64ToUint8Array } from "uint8array-extras";
import { onMounted, ref } from "vue";
import CytoscapeGraph from "../components/CytoscapeGraph.vue";
import DarkModeToggle from "../components/DarkModeToggle.vue";
import GlobeGL from "../components/GlobeGL.vue";
import LeftPanel from "../components/LeftPanel.vue";
import { SERVER_BASE_URL } from "../constants.js";
import { useAppStore } from "../stores/app";
/** @import { Person } from "../types.d.ts" */

const appStore = useAppStore();
const cytoscapeRef = ref(null);

/**
 * @internal
 * @typedef {object} GraphData
 * @prop {ReadonlyArray<Person>} people
 */

/** @returns {Promise<GraphData>} */
const fetchGraphData = async () => {
  const graphUrl = new URL("/graph", SERVER_BASE_URL);
  const response = await fetch(graphUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch graph with status ${response.status}`);
  }
  const json = await response.json();
  return {
    ...json,
    people: json.people.map((person) => {
      const { photoBase64 } = person;
      return {
        ...person,
        photo: photoBase64 ? base64ToUint8Array(photoBase64) : undefined,
      };
    }),
  };
};

onMounted(async () => {
  const { people } = await fetchGraphData();
  appStore.setPeople(people);
});
</script>

<template>
  <div class="app-container">
    <DarkModeToggle />
    <LeftPanel />

    <div v-if="appStore.people" class="components-container">
      <CytoscapeGraph
        ref="cytoscapeRef"
        :people="appStore.people"
        :class="{ active: appStore.activeComponent === 'cytoscape' }"
      />
      <GlobeGL
        :people="appStore.people"
        :class="{ active: appStore.activeComponent === 'globe' }"
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
