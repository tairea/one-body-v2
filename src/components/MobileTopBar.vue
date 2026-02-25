<script setup>
// @ts-check
import { useAppStore } from "../stores/app";

const props = defineProps({
  isZoomed: {
    type: Boolean,
    default: false,
  },
  hasNodePositionChanges: {
    type: Boolean,
    default: false,
  },
  isSavingPositions: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "zoomBack",
  "edgeViewBack",
  "editProfile",
  "saveNodePositions",
]);

const appStore = useAppStore();

const handleShowGlobe = () => appStore.showGlobe();
const handleShowCytoscape = () => appStore.showCytoscape();

// Right panel actions only shown when in cytoscape view
const showRightActions = () =>
  appStore.people &&
  appStore.people.length > 0 &&
  appStore.activeComponent === "cytoscape";

const handleFullscreen = () => appStore.enterFullscreen();
const handleToggleNodeLabels = () => appStore.toggleNodeLabels();
</script>

<template>
  <div
    class="mobile-top-bar"
    :class="{ 'dark-mode': appStore.isDarkMode }"
  >
    <div class="bar-inner">
      <!-- When zoomed or edge view: show back button first -->
      <template v-if="props.isZoomed || appStore.isEdgeView">
        <div
          class="icon-button"
          @click="props.isZoomed ? $emit('zoomBack') : $emit('edgeViewBack')"
          :title="props.isZoomed ? 'Back to full view' : 'Back'"
        >
          <v-icon icon="mdi-arrow-left" size="20" />
        </div>
      </template>

      <!-- Left panel: view switcher (Globe, Members, AI) -->
      <template v-else>
        <div
          class="icon-button"
          :class="{ active: appStore.activeComponent === 'globe' }"
          @click="handleShowGlobe"
          title="Our Global Distribution"
        >
          <v-icon icon="mdi-earth" size="20" />
        </div>
        <div
          class="icon-button"
          :class="{ active: appStore.activeComponent === 'cytoscape' }"
          @click="handleShowCytoscape"
          :title="`${appStore.people?.length || '?'} Members`"
        >
          <v-icon icon="mdi-account-group-outline" size="20" />
        </div>
        <v-tooltip text="Coming soon" location="bottom">
          <template v-slot:activator="{ props: tooltipProps }">
            <div
              class="icon-button disabled"
              v-bind="tooltipProps"
              title="AI suggested collabs"
            >
              <v-icon icon="mdi-robot-love-outline" size="20" />
            </div>
          </template>
        </v-tooltip>
      </template>

      <!-- Right panel: Edit, Fullscreen, Labels, Save (when cytoscape) -->
      <template v-if="showRightActions()">
        <div
          class="icon-button"
          @click="$emit('editProfile')"
          title="Edit Profile Data"
        >
          <v-icon icon="mdi-account-edit" size="20" />
        </div>
        <div
          class="icon-button"
          @click="handleFullscreen"
          title="Full-Screen Interactive View"
        >
          <v-icon icon="mdi-fullscreen" size="20" />
        </div>
        <div
          class="icon-button"
          @click="handleToggleNodeLabels"
          :title="
            appStore.showNodeLabels ? 'Hide Node Labels' : 'Show Node Labels'
          "
        >
          <v-icon
            :icon="appStore.showNodeLabels ? 'mdi-eye-off' : 'mdi-eye'"
            size="20"
          />
        </div>
        <div
          v-if="props.hasNodePositionChanges"
          class="icon-button save-positions-button"
          :class="{ saving: props.isSavingPositions, disabled: props.isSavingPositions }"
          @click="$emit('saveNodePositions')"
          title="Save New Node Positions"
        >
          <v-icon
            :icon="
              props.isSavingPositions ? 'mdi-loading mdi-spin' : 'mdi-content-save'
            "
            size="20"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.mobile-top-bar {
  display: none;
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  z-index: 1000;
  padding: 12px 56px 12px 16px; /* extra right padding for dark mode toggle */
  background-color: transparent;
  backdrop-filter: blur(2px);
  pointer-events: none; /* Let clicks through except on bar */
}

.mobile-top-bar .bar-inner {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  pointer-events: auto;
}

.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid rgba(0, 0, 0, 0.3);
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);

  &:hover {
    background-color: rgba(255, 255, 255, 1);
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .v-icon {
    color: #333;
    transition: color 0.2s ease;
  }

  &.active {
    background-color: rgba(59, 130, 246, 0.3);
    border-color: rgba(59, 130, 246, 0.5);
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background-color: rgba(245, 245, 245, 0.9);

    &:hover {
      background-color: rgba(245, 245, 245, 0.9);
      transform: none;
      box-shadow: none;
    }
  }

  &.save-positions-button {
    background-color: #4caf50;
    border-color: #4caf50;

    &:hover {
      background-color: #45a049;
    }

    .v-icon {
      color: white;
    }

    &.saving {
      background-color: #ff9800;
      border-color: #ff9800;
      cursor: not-allowed;

      &:hover {
        background-color: #ff9800;
        transform: none;
        box-shadow: none;
      }
    }

    &.disabled {
      opacity: 0.7;
      cursor: not-allowed;

      &:hover {
        background-color: #4caf50;
        transform: none;
        box-shadow: none;
      }
    }
  }
}

// Dark mode
.mobile-top-bar.dark-mode .icon-button {
  border: 1px solid rgba(255, 255, 255, 0.3);
  background-color: rgba(0, 0, 0, 0.9);

  &:hover {
    background-color: rgba(0, 0, 0, 1);
  }

  .v-icon {
    color: rgba(255, 255, 255, 0.87) !important;
  }

  &.active {
    background-color: rgba(96, 165, 250, 0.3);
    border-color: rgba(96, 165, 250, 0.5);
  }

  &.disabled {
    background-color: rgba(30, 30, 30, 0.9);
  }

  &.save-positions-button {
    background-color: #4caf50;
    border-color: #4caf50;

    &:hover {
      background-color: #45a049;
    }

    .v-icon {
      color: white !important;
    }
  }
}

@media (max-width: 768px) {
  .mobile-top-bar {
    display: block;
  }
}
</style>
