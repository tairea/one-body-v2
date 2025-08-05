<script setup>
import { defineEmits } from "vue";
import { useAppStore } from "../stores/app";

const emit = defineEmits(["showAiView", "showMembersView"]);

const appStore = useAppStore();

const handleShowGlobe = () => {
  appStore.showGlobe();
};

const handleShowCytoscape = () => {
  appStore.showCytoscape();
};
</script>

<template>
  <div class="left-overlay" :class="{ 'dark-mode': appStore.isDarkMode }">
    <!-- DWEB LOGO & TITLE -->
    <div id="wg">
      <img id="logo" src="../assets/org_logo_DWeb.jpeg" width="100" class="mb-4"/>
      <h1>DWeb Fellows Alumni</h1>
      <h2>A collective of dWeb camp fellows</h2>
    </div>

    <!-- BUTTONS -->

    <div
      id="global-distribution"
      class="button"
      @click="handleShowGlobe"
            style="margin-top: 40px"
    >
      <v-icon icon="mdi-earth" size="20" />
      <p class="b1">Our Global Distribution</p>
    </div>


    <div
      id="members"
      class="button"

      @click="handleShowCytoscape"
    >
    <v-icon icon="mdi-account-group-outline" size="20" />
      <p class="b1">25 Members</p>
    </div>
    
  
    
    <div id="ai-summary" class="button">
      <v-icon icon="mdi-robot-love-outline" size="20" />
      <p class="b1">Ai collective overview</p>
    </div>
    <div id="ai" class="button" @click="emit('showAiView')">
      <v-icon icon="mdi-robot-love-outline" size="20" />
      <p class="b1">Ai suggested collabs</p>
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

#wg {
  text-align: center;
  margin-bottom: 20px; /* Reduced from 30px to prevent overflow */
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
  color: rgba(255, 255, 255, 0.87) !important; /* More specific selector with !important to override Vuetify defaults */
}
</style>
