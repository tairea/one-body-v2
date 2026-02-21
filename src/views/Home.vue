<script setup>
// @ts-check
import { onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import DarkModeToggle from "../components/DarkModeToggle.vue";
import GlobeGL from "../components/GlobeGL.vue";
import HomeLeftPanel from "../components/HomeLeftPanel.vue";
import HomeRightPanel from "../components/HomeRightPanel.vue";
import { useAppStore } from "../stores/app";
import AiRecommendations from "../components/AiRecommendations.vue";
import InteractiveCytoscapeMany from "../components/InteractiveCytoscapeMany.vue";

const appStore = useAppStore();
const router = useRouter();
const cytoscapeRef = ref(null);
const homeLeftPanelRef = ref(null);
const aiRecommendationsRef = ref(null);

// State for handling node position changes
const hasNodePositionChanges = ref(false);
const isSavingPositions = ref(false);

// State for clicked person data
const clickedPersonName = ref("");
const clickedPersonEmail = ref("");

// Handle node position changes from the cytoscape component
const handleNodePositionChanged = () => {
  hasNodePositionChanges.value = true;
};

// Handle saving graph snapshot — triggered by "Save positions" button
const handleSaveNodePositions = async () => {
  if (!cytoscapeRef.value) return;
  try {
    isSavingPositions.value = true;
    // saveGraphSnapshot builds the snapshot and emits graphSnapshotSaved
    await cytoscapeRef.value.saveGraphSnapshot();
    hasNodePositionChanges.value = false;
  } catch (error) {
    console.error("Error saving node positions:", error);
  } finally {
    isSavingPositions.value = false;
  }
};

// Persist snapshot to Supabase when cytoscape emits it
const handleGraphSnapshotSaved = async (graphData) => {
  await appStore.saveGraphSnapshot(graphData);
};

// Handle zoom state changes from cytoscape
const handleZoomStateChanged = (zoomState) => {
  if (homeLeftPanelRef.value) {
    homeLeftPanelRef.value.handleZoomStateChange(zoomState);
  }

  // Update clicked person data
  if (zoomState.isZoomed && zoomState.personId && appStore.people) {
    // personId format: "person-{UUID}"
    const personId = zoomState.personId.replace("person-", "");
    const person = appStore.people.find((p) => p.id === personId);
    if (person) {
      clickedPersonName.value = person.name || "";
      clickedPersonEmail.value = "";
    }
  } else {
    // Reset when zooming back
    clickedPersonName.value = "";
    clickedPersonEmail.value = "";
  }
};

// Handle zoom back request from left panel
const handleZoomBack = () => {
  if (cytoscapeRef.value) {
    cytoscapeRef.value.zoomToFullView();
  }
};

// Handle edge view back request from left panel
const handleEdgeViewBack = () => {
  if (aiRecommendationsRef.value) {
    aiRecommendationsRef.value.resetEdgeView();
  }
};

onMounted(async () => {
  await appStore.fetchGraph();
  await appStore.fetchMyPerson();
  if (!appStore.myPerson) {
    router.push("/profile");
    return;
  }
  appStore.subscribeToPersonUpdates();
});

onUnmounted(() => {
  appStore.unsubscribeFromPersonUpdates();
});
</script>

<template>
  <div
    class="app-container"
    v-if="true"
    :class="{
      'dark-mode': appStore.isDarkMode,
      fullscreen: appStore.isFullscreen,
    }"
  >
    <DarkModeToggle />
    <v-btn
      class="edit-profile-btn"
      variant="outlined"
      size="small"
      prepend-icon="mdi-account-edit"
      @click="router.push('/profile')"
    >
      Edit Profile
    </v-btn>

    <!-- Close Fullscreen Button -->
    <div
      v-if="appStore.isFullscreen"
      class="close-fullscreen-btn"
      @click="appStore.exitFullscreen"
    >
      <v-icon icon="mdi-close" size="24" />
    </div>

    <HomeLeftPanel
      ref="homeLeftPanelRef"
      :clickedPersonName="clickedPersonName"
      :clickedPersonEmail="clickedPersonEmail"
      :class="{ 'panel-hidden': appStore.isFullscreen }"
      @zoomBack="handleZoomBack"
      @edgeViewBack="handleEdgeViewBack"
    />
    <HomeRightPanel
      v-if="
        appStore.people &&
        appStore.people.length > 0 &&
        appStore.activeComponent === 'cytoscape'
      "
      :person="appStore.people[0]"
      :hasNodePositionChanges="hasNodePositionChanges"
      :isSavingPositions="isSavingPositions"
      @saveNodePositions="handleSaveNodePositions"
      :class="{ 'panel-hidden': appStore.isFullscreen }"
    />

    <div
      v-if="appStore.people && appStore.recommendations"
      class="components-container"
      :class="{ fullscreen: appStore.isFullscreen }"
    >
      <InteractiveCytoscapeMany
        ref="cytoscapeRef"
        :people="appStore.people"
        :class="{ active: appStore.activeComponent === 'cytoscape' }"
        @nodePositionChanged="handleNodePositionChanged"
        @graphSnapshotSaved="handleGraphSnapshotSaved"
        @zoomStateChanged="handleZoomStateChanged"
      />
      <GlobeGL
        :people="appStore.people"
        :class="{ active: appStore.activeComponent === 'globe' }"
      />
      <AiRecommendations
        ref="aiRecommendationsRef"
        :class="{ active: appStore.activeComponent === 'airecommendations' }"
        :people="appStore.people"
        :recommendations="appStore.recommendations"
      />
    </div>

  </div>
  <div class="app-container" v-else>Coming soon...</div>
</template>

<style lang="scss" scoped>
.app-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
  transition: background 0.3s ease;
  box-sizing: border-box;

  &.dark-mode {
    background: #0c0c0c;
  }

  &.fullscreen {
    padding: 0;
  }
}

.edit-profile-btn {
  position: fixed;
  top: 15px;
  right: 60px;
  z-index: 3000;
}

// Close fullscreen button
.close-fullscreen-btn {
  position: fixed;
  top: 60px;
  right: 15px;
  z-index: 3000;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(255, 255, 255, 1);
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .dark-mode & {
    background: rgba(0, 0, 0, 0.9);
    color: rgba(255, 255, 255, 0.87);

    &:hover {
      background: rgba(0, 0, 0, 1);
    }
  }
}

.components-container {
  position: relative;
  width: 100%;
  height: 100%;
  transition:
    width 0.3s ease,
    margin 0.3s ease;

  &.fullscreen {
    width: 100%;
    margin: 0;
  }
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

// Panel transitions for fullscreen
:deep(.left-overlay),
:deep(.right-overlay) {
  transition:
    opacity 0.4s ease,
    visibility 0.4s ease;
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

:deep(.panel-hidden) {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

// Responsive design
@media (max-width: 768px) {
  .app-container {
    :deep(.left-overlay),
    :deep(.right-overlay) {
      display: none;
    }
  }
}
</style>
