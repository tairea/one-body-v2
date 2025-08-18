<script setup>
// @ts-check
import { defineEmits, defineProps, ref, watch } from "vue";
import { useAppStore } from "../stores/app";

const props = defineProps({
  clickedPersonName: {
    type: String,
    default: "",
  },
  clickedPersonEmail: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["showMembersView", "zoomBack"]);
const appStore = useAppStore();

// Add state for zoom
const isZoomed = ref(false);
const currentPersonId = ref(null);

// Watch for zoom state changes from parent
const handleZoomStateChange = (zoomState) => {
  isZoomed.value = zoomState.isZoomed;
  currentPersonId.value = zoomState.personId;
};

// Expose the handler for parent components
defineExpose({
  handleZoomStateChange,
});

const handleShowGlobe = () => {
  appStore.showGlobe();
};

const handleShowCytoscape = () => {
  appStore.showCytoscape();
};

const handleShowAiRecommendations = () => {
  appStore.showAiRecommendations();
};

const handleZoomBack = () => {
  emit("zoomBack");
};
</script>

<template>
  <div
    class="left-overlay"
    :class="{ 'dark-mode': appStore.isDarkMode }"
    v-bind="$attrs"
  >
    <!-- DWEB LOGO & TITLE -->
    <div id="wg" v-if="!isZoomed">
      <img
        id="logo"
        src="../assets/org_logo_DWeb.jpeg"
        width="100"
        class="mb-4"
      />
      <h1>DWeb Fellows Alumni</h1>
      <h2>A collective of DWeb fellows</h2>
    </div>

    <!-- ZOOMED VIEW - Show back button and person info -->
    <div v-if="isZoomed" class="zoomed-view">
      <div class="person-info">
        <h3>{{ clickedPersonName }}</h3>
        <p>{{ clickedPersonEmail || "No email available" }}</p>
      </div>
      <div class="back-button" @click="handleZoomBack">
        <v-icon icon="mdi-arrow-left" size="20" />
        <span>Back</span>
      </div>
    </div>

    <!-- BUTTONS - Only show when not zoomed -->
    <div v-if="!isZoomed">
      <div
        id="global-distribution"
        class="button"
        @click="handleShowGlobe"
        style="margin-top: 40px"
      >
        <v-icon icon="mdi-earth" size="20" />
        <p class="b1">Our Global Distribution</p>
      </div>

      <div id="members" class="button" @click="handleShowCytoscape">
        <v-icon icon="mdi-account-group-outline" size="20" />
        <p class="b1">{{ appStore.people?.length || "?" }} Members</p>
      </div>

      <div id="ai" class="button" @click="handleShowAiRecommendations">
        <v-icon icon="mdi-robot-love-outline" size="20" />
        <p class="b1">AI suggested collabs</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.left-overlay {
  position: absolute; /* Always on the left */
  left: 0;
  top: 40%;
  transform: translateY(-50%);
  width: 300px;
  padding: 20px;
  background-color: transparent;
  /* background blur */
  backdrop-filter: blur(2px);
  z-index: 1000; /* Above cytoscape */
  overflow: hidden;
  box-sizing: border-box; /* Add this to include padding in width calculation */

  #wg {
    text-align: center;
    margin-bottom: 20px; /* Reduced from 30px to prevent overflow */

    #logo {
      display: block;
      margin: 0 auto 0 0;
      text-align: left;
    }
  }

  h1 {
    font-size: 1.5rem;
    margin-bottom: 10px;
    color: #333;
    text-align: left;
  }

  h2 {
    font-size: 0.8rem;
    color: #666;
    margin-bottom: 15px;
    font-weight: 400;
    text-align: left;
  }

  .button {
    display: flex;
    align-items: center;
    padding: 10px; /* Reduced from 12px */
    margin: 8px 0; /* Reduced from 10px */
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s;
    border: 1px solid rgba(0, 0, 0, 0.3);

    &:hover {
      background-color: #f5f5f5;
    }

    img {
      margin-right: 10px;
    }
  }

  .b1 {
    margin: 0;
    padding-left: 10px;
    font-size: 0.9rem;
    color: #333;
  }

  #flag {
    margin: 15px 0;
  }

  #logo {
    display: block;
    margin: 0 auto 0 0;
    text-align: left;
  }

  // Zoomed view styles
  .zoomed-view {
    text-align: center;
    margin-bottom: 20px;

    .back-button {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px;
      margin: 8px 0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid rgba(0, 0, 0, 0.3);
      background-color: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);

      &:hover {
        background-color: rgba(255, 255, 255, 0.2);
        transform: translateX(-2px);
      }

      span {
        margin-left: 8px;
        font-size: 0.9rem;
        color: #333;
        font-weight: 500;
      }
    }

    .person-info {
      margin-top: 20px;
      padding: 15px;
      border-radius: 8px;
      background-color: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(5px);

      h3 {
        font-size: 1.1rem;
        margin-bottom: 8px;
        color: #333;
        font-weight: 600;
      }

      p {
        font-size: 0.8rem;
        color: #666;
        margin: 0;
        line-height: 1.4;
      }
    }
  }

  // Dark mode styles
  &.dark-mode {
    h1 {
      color: rgba(255, 255, 255, 0.87);
    }

    h2 {
      color: rgba(255, 255, 255, 0.6);
    }

    .b1 {
      color: rgba(255, 255, 255, 0.87);
    }

    .button {
      border: 1px solid rgba(255, 255, 255, 0.3);
      background-color: rgba(255, 255, 255, 0.05);

      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }

      .v-icon {
        color: rgba(255, 255, 255, 0.87) !important;
      }
    }

    .zoomed-view {
      .back-button {
        border: 1px solid rgba(255, 255, 255, 0.3);
        background-color: rgba(255, 255, 255, 0.05);

        &:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        span {
          color: rgba(255, 255, 255, 0.87);
        }

        .v-icon {
          color: rgba(255, 255, 255, 0.87) !important;
        }
      }

      .person-info {
        background-color: rgba(255, 255, 255, 0.05);

        h3 {
          color: rgba(255, 255, 255, 0.87);
        }

        p {
          color: rgba(255, 255, 255, 0.6);
        }
      }
    }
  }
}
</style>
