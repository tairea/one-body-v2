<script setup>
import { defineEmits, computed } from "vue";
import { useAppStore } from "../stores/app";
import { select } from "d3-selection";

const emit = defineEmits(["showAiView", "showMembersView"]);

const appStore = useAppStore();

// Computed properties for V, V, V div visibility
const valuesOpacity = computed(() => {
  return {
    opacity: appStore.activeProfileSection === "values" ? "1" : "0",
    transition: "opacity 0.3s ease",
  };
});

const visionOpacity = computed(() => {
  return {
    opacity: appStore.activeProfileSection === "vision" ? "1" : "0",
    transition: "opacity 0.3s ease",
  };
});

const vehiclesOpacity = computed(() => {
  return {
    opacity: appStore.activeProfileSection === "vehicles" ? "1" : "0",
    transition: "opacity 0.3s ease",
  };
});

const handleShowGlobe = () => {
  appStore.showGlobe();
};

const handleShowCytoscape = () => {
  appStore.showCytoscape();
};

const handleZoomOut = () => {
  // Reset the store flag and clear person data
  appStore.setViewingProfile(false);
  appStore.clearCurrentPersonData();
  appStore.clearActiveProfileSection();

  // Call the concentric zoom out function if it exists
  if (appStore.concentricZoomOut) {
    appStore.concentricZoomOut();
  }

  // Get cytoscape instance from store
  const cy = appStore.cytoscapeInstance;
  if (!cy) return;

  // Show all elements
  cy.elements().style({
    display: "element",
  });

  // Show node labels
  cy.nodes().style({
    "text-opacity": 1,
  });

  // Remove circles and text from SVG using stored reference
  const svg = appStore.cytoscapeSvg;
  if (svg) {
    // Remove all elements created by the node click
    svg.selectAll("circle").remove();
    svg.selectAll("foreignObject").remove();
    svg.selectAll("mask").remove();
    svg.selectAll(".onion").remove();
    svg.selectAll(".passion").remove();
    svg.selectAll(".passion-name").remove();
    svg.selectAll("g").remove(); // Remove any remaining groups
  }

  // Reset view
  cy.animate({
    fit: {
      eles: cy.elements(),
      padding: 120,
    },
    zoom: {
      level: 1,
    },
    duration: 1000,
  });
};
</script>

<template>
  <div class="left-overlay" :class="{ 'dark-mode': appStore.isDarkMode }">
    <!-- NAME -->
    <div id="name">
      <h1 id="n1">
        {{ appStore.currentPersonData?.name?.toUpperCase() || "NAME" }}
      </h1>
    </div>

    <!-- V, V, V's -->
    <div id="values" class="v" :style="valuesOpacity">
      <h2 class="v1">VALUES</h2>
      <h3 class="v2">SKILLS, EXPERIENCE</h3>
    </div>
    <div id="vision" class="v" :style="visionOpacity">
      <h2 class="v1">VISIONS</h2>
      <h3 class="v2">INTERESTS, PASSIONS, PURPOSE</h3>
    </div>
    <div id="vehicles" class="v" :style="vehiclesOpacity">
      <h2 class="v1">VEHICLES</h2>
      <h3 class="v2">INITIATIVES, PROJECTS, BUSINESSES</h3>
    </div>

    <!-- BACK TO MEMBERS -->
    <div id="zoom-out" class="zoom-out-button" @click="handleZoomOut">
      <span>← Back to Network</span>
    </div>
  </div>
</template>

<style scoped>
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
}

/* h1 {
  font-size: 1.5rem;
  margin-bottom: 10px;
  color: #333;
  text-align: left;
} */

h3 {
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
}

.button:hover {
  background-color: #f5f5f5;
}

.button img,
.button .v-icon {
  margin-right: 10px;
  color: #333; /* Explicit color for light mode */
  transition: color 0.2s ease; /* Smooth transition for color changes */
}

.b1 {
  margin: 0;
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

/* Dark mode styles */
.left-overlay.dark-mode h1 {
  color: rgba(255, 255, 255, 0.87);
}

.left-overlay.dark-mode h2 {
  color: rgba(255, 255, 255, 0.6);
}

.left-overlay.dark-mode .b1 {
  color: rgba(255, 255, 255, 0.87);
}

.left-overlay.dark-mode .button {
  border: 1px solid rgba(255, 255, 255, 0.3);
  background-color: rgba(255, 255, 255, 0.05);
}

.left-overlay.dark-mode .button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.left-overlay.dark-mode .button .v-icon {
  color: rgba(
    255,
    255,
    255,
    0.87
  ) !important; /* More specific selector with !important to override Vuetify defaults */
}

/* V, V, V div styles */
.v {
  transition: opacity 0.3s ease;
  margin-bottom: 20px;
}

.v h2 {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 5px;
  color: #2d3748;
}

.v h3 {
  font-size: 0.8rem;
  color: #666;
  margin: 0;
  font-weight: 400;
}

.dark-mode .v h2 {
  color: rgba(255, 255, 255, 0.87);
}

.dark-mode .v h3 {
  color: rgba(255, 255, 255, 0.6);
}
</style>
