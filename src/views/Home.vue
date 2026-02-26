<script setup>
// @ts-check
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import DarkModeToggle from "../components/DarkModeToggle.vue";
import GlobeGL from "../components/GlobeGL.vue";
import HomeLeftPanel from "../components/HomeLeftPanel.vue";
import HomeRightPanel from "../components/HomeRightPanel.vue";
import MobileTopBar from "../components/MobileTopBar.vue";
import ProfilePanel from "../components/ProfilePanel.vue";
import { useAppStore } from "../stores/app";
import { supabase } from "../lib/supabase.js";
import AiRecommendations from "../components/AiRecommendations.vue";
import InteractiveCytoscapeMany from "../components/InteractiveCytoscapeMany.vue";

const appStore = useAppStore();
const cytoscapeRef = ref(null);
const homeLeftPanelRef = ref(null);
const aiRecommendationsRef = ref(null);

const profilePanelOpen = ref(false);
const focusChipNodeId = ref(/** @type {string | null} */ (null));
const panelBottomOffsetPx = ref(0);
const isZoomed = ref(false);

// State for handling node position changes
const hasNodePositionChanges = ref(false);
const isSavingPositions = ref(false);

// State for clicked person data
const clickedPersonName = ref("");
const clickedPersonEmail = ref("");
const clickedPersonTelegram = ref("");
const clickedPersonLocation = ref("");

// Handle node position changes from the cytoscape component
const handleNodePositionChanged = () => {
  hasNodePositionChanges.value = true;
};

// Handle saving graph snapshot — triggered by "Save positions" button
const handleSaveNodePositions = async () => {
  if (!cytoscapeRef.value) return;
  try {
    isSavingPositions.value = true;
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
  isZoomed.value = zoomState.isZoomed;
  if (homeLeftPanelRef.value) {
    homeLeftPanelRef.value.handleZoomStateChange(zoomState);
  }

  if (zoomState.isZoomed && zoomState.personId && appStore.people) {
    const personId = zoomState.personId.replace("person-", "");
    const person = appStore.people.find((p) => p.id === personId);
    if (person) {
      clickedPersonName.value = person.name || "";
      clickedPersonEmail.value = person.email ?? "";
      clickedPersonTelegram.value = person.telegram ?? "";
      clickedPersonLocation.value = person.locationName ?? "";
    }
  } else {
    clickedPersonName.value = "";
    clickedPersonEmail.value = "";
    clickedPersonTelegram.value = "";
    clickedPersonLocation.value = "";
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

// When a chip node is clicked on the graph (and it's my person), focus it in the profile panel
const handleChipNodeClicked = ({ nodeId }) => {
  profilePanelOpen.value = true;
  focusChipNodeId.value = nodeId;
  nextTick(() => {
    focusChipNodeId.value = null; // Reset so subsequent clicks can re-trigger
  });
};

// When profilePanel closes, zoom-fit the full graph in the now-restored 100vh viewport.
// When it opens, ProfilePanel handles the zoom (with panel height offset).
watch(profilePanelOpen, (open) => {
  if (!open && cytoscapeRef.value) {
    cytoscapeRef.value.zoomToFullView();
  }
});

onMounted(async () => {
  await appStore.fetchGraph();
  await appStore.fetchMyPerson();
  appStore.subscribeToPersonUpdates();
  if (!appStore.myPerson && appStore.authUser) {
    // New user — create a "New Member" placeholder so they see their node immediately
    await supabase.from("people").upsert(
      {
        user_id: appStore.authUser.id,
        name: "New Member",
        layer1_list: [],
        layer2_list: [],
        layer3_list: [],
      },
      { onConflict: "user_id" }
    );
    await appStore.fetchMyPerson();
    await appStore.fetchGraph();
    profilePanelOpen.value = true;
  }
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
      :clickedPersonTelegram="clickedPersonTelegram"
      :clickedPersonLocation="clickedPersonLocation"
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
      @editProfile="profilePanelOpen = true"
      :class="{ 'panel-hidden': appStore.isFullscreen }"
    />

    <MobileTopBar
      v-if="appStore.people && appStore.recommendations && !appStore.isFullscreen"
      :isZoomed="isZoomed"
      :hasNodePositionChanges="hasNodePositionChanges"
      :isSavingPositions="isSavingPositions"
      @zoomBack="handleZoomBack"
      @edgeViewBack="handleEdgeViewBack"
      @editProfile="profilePanelOpen = true"
      @saveNodePositions="handleSaveNodePositions"
    />

    <div
      v-if="appStore.people && appStore.recommendations"
      class="components-container"
      :class="{ fullscreen: appStore.isFullscreen }"
    >
      <InteractiveCytoscapeMany
        ref="cytoscapeRef"
        :people="appStore.people"
        :panelBottomOffset="panelBottomOffsetPx"
        :class="{ active: appStore.activeComponent === 'cytoscape' }"
        @nodePositionChanged="handleNodePositionChanged"
        @graphSnapshotSaved="handleGraphSnapshotSaved"
        @zoomStateChanged="handleZoomStateChanged"
        @chipNodeClicked="handleChipNodeClicked"
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

    <!-- Profile panel (slide-up, embedded) -->
    <ProfilePanel
      :open="profilePanelOpen"
      :cytoscapeRef="cytoscapeRef"
      :focusChipNodeId="focusChipNodeId"
      @close="profilePanelOpen = false"
      @panelHeightChange="panelBottomOffsetPx = $event"
    />

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
