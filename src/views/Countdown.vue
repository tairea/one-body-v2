<script setup>
// @ts-check
import { onMounted, ref } from "vue";
import DarkModeToggle from "../components/DarkModeToggle.vue";
import { useAppStore } from "../stores/app";

const appStore = useAppStore();

// Add any reactive data or methods here
const countdownData = ref(null);

onMounted(async () => {
  // Initialize dark mode if not already done
  if (typeof appStore.isDarkMode === 'undefined') {
    appStore.initializeDarkMode();
  }
  
  // Initialize any data or setup here
  console.log('Countdown component mounted');
});
</script>

<template>
  <div class="countdown-container" :class="{ 'dark-mode': appStore.isDarkMode }">
    <DarkModeToggle />
    
    <div class="content-container">
      <!-- Your countdown content will go here -->
      <div class="countdown-content">
        <h2>Thank you for completing your DWeb Fellow's profile!</h2>
        <p>We will be revealing the DWeb Fellow Community on 18 August 2025.</p>
        <p>Make sure to join the zoom call event on the 18th.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.countdown-container {
  min-height: 100vh;
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  padding: 20px;
  transition: background 0.3s ease;
  box-sizing: border-box;
  overflow: hidden;
}

.countdown-container.dark-mode {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.content-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.countdown-content {
  text-align: center;
  color: #333;
  max-width: 600px;
  width: 100%;
}

.countdown-container.dark-mode .countdown-content {
  color: white;
}

.countdown-content h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: inherit;
}

.countdown-content p {
  font-size: 1.2rem;
  color: inherit;
  opacity: 0.8;
}
</style>
