<template>
  <div class="dark-mode-toggle">
    <button
      @click="appStore.toggleDarkMode"
      class="toggle-btn"
      :class="{ dark: appStore.isDarkMode }"
      :title="
        appStore.isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'
      "
    >
      <!-- Sun icon for light mode -->
      <svg
        v-if="appStore.isDarkMode"
        class="icon sun"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        stroke-width="2"
      >
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
      <!-- Moon icon for dark mode -->
      <svg
        v-else
        class="icon moon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#222"
        stroke-width="2"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="none" />
      </svg>
    </button>
  </div>
</template>

<script setup>
// @ts-check
import { useAppStore } from "../stores/app";
const appStore = useAppStore();
</script>

<style scoped>
.dark-mode-toggle {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 3000;
}

.toggle-btn {
  background: none;
  color: inherit;
  border: none;
  padding: 0;
  border-radius: 0;
  cursor: pointer;
  font-size: 14px;
  transition: none;
  width: auto;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: none;
}

.toggle-btn:hover {
  background: none;
  transform: none;
  box-shadow: none;
}

.icon {
  width: 28px;
  height: 28px;
  transition: none;
}

.icon.sun {
  stroke: #fff;
}

.icon.moon {
  stroke: #222;
}

/* Dark mode styles */
.toggle-btn.dark {
  background: rgba(36, 36, 36, 0.9);
  color: rgba(255, 255, 255, 0.87);
}
</style>
