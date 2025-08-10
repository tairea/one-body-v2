<script setup>
// @ts-check
import { onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import DarkModeToggle from "../components/DarkModeToggle.vue";
import { useAppStore } from "../stores/app";
import InteractiveCytoscapeView from "./InteractiveCytoscapeView.vue";
import CountdownLeftPanel from "../components/CountdownLeftPanel.vue";
import CountdownRightPanel from "../components/CountdownRightPanel.vue";
import AddPersonDialog from "../components/AddPersonDialog.vue";

const appStore = useAppStore();
const router = useRouter();

// Make person reactive and initialize from storage
const person = computed(() => appStore.person);

onMounted(async () => {
  // Initialize dark mode if not already done
  if (typeof appStore.isDarkMode === 'undefined') {
    appStore.initializeDarkMode();
  }

  // Initialize store from localStorage to restore person data
  appStore.initializeFromStorage();
});

// Watch for person changes and redirect if no person data
watch(person, (newPerson) => {
  if (!newPerson) {
    // If no person data after initialization, redirect to signup
    router.push({ name: 'Signup' });
  }
}, { immediate: true });

const handleSavePerson = (personData) => {
  // Update the person in the store
  appStore.updateCurrentPerson(personData);
  // Close the dialog
  appStore.hideAddPersonDialog();
};

const handleCloseDialog = () => {
  appStore.hideAddPersonDialog();
};
</script>

<template>
  <div class="countdown-container" :class="{ 'dark-mode': appStore.isDarkMode, 'fullscreen': appStore.isFullscreen }">
    <DarkModeToggle />
    
    <!-- Close Fullscreen Button -->
    <div v-if="appStore.isFullscreen" class="close-fullscreen-btn" @click="appStore.exitFullscreen">
      <v-icon icon="mdi-close" size="24" />
    </div>
    
    <!-- Left Panel -->
    <CountdownLeftPanel :class="{ 'panel-hidden': appStore.isFullscreen }" />
    
    <!-- Right Panel -->
    <CountdownRightPanel :person="person" :class="{ 'panel-hidden': appStore.isFullscreen }" />
    
    <div class="content-container" :class="{ 'fullscreen': appStore.isFullscreen }">
      <div v-if="person" class="countdown-content">
        <!-- Interactive Cytoscape graph of individual person -->
        <InteractiveCytoscapeView/>
      </div>
    </div>

    <!-- AddPersonDialog for editing profiles -->
    <AddPersonDialog 
      v-if="appStore.isAddPersonDialogOpen"
      :editing-person="appStore.editingPerson"
      @save="handleSavePerson"
      @close="handleCloseDialog"
    />
  </div>
</template>

<style lang="scss" scoped>
// Variables
$panel-width: 300px;
$content-gap: 3rem;
$border-radius: 12px;
$box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
$box-shadow-dark: 0 8px 32px rgba(0, 0, 0, 0.3);
$transition: background 0.3s ease;

// Colors
$white: #ffffff;
$dark-bg: #0c0c0c;
$text-primary: #333;
$text-dark: rgba(255, 255, 255, 0.87);
$border-light: #e2e8f0;
$border-dark: #4a5568;

.countdown-container {
  min-height: 100vh;
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $white;
  padding: 20px;
  transition: $transition;
  box-sizing: border-box;
  overflow: hidden;

  &.dark-mode {
    background: $dark-bg;
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

  &:hover {
    background: rgba(255, 255, 255, 1);
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .dark-mode & {

    color: rgba(255, 255, 255, 0.87);

    &:hover {
      background: rgba(0, 0, 0, 1);
    }
  }
}

.content-container {
  position: relative;
  width: calc(100% - (#{$panel-width} * 2));
  height: 100%;
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  transition: width 0.3s ease, margin 0.3s ease;

  &.fullscreen {
    width: 100%;
    margin: 0;
  }
}

.countdown-content {

  color: $text-primary;
  width: 100%;
  height: 100%;

  .countdown-container.dark-mode & {
    color: $text-dark;
  }
}

// Panel transitions for fullscreen
:deep(.left-overlay),
:deep(.right-overlay) {
  transition: opacity 0.4s ease, visibility 0.4s ease;
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

:deep(.panel-hidden) {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

// Remove all the embedded cytoscape styling since we're no longer using it

// Responsive design
@media (max-width: 1200px) {
  .content-container {
    width: calc(100% - 400px);
    margin: 0 auto;
  }
}

@media (max-width: 768px) {
  .countdown-container {
    :deep(.left-overlay),
    :deep(.right-overlay) {
      display: none;
    }
  }
  
  .content-container {
    width: 100%;
    margin: 0;
  }
}
</style>
