<script setup>
import MainNavigationButtons from "./MainNavigationButtons.vue";
import MemberProfileInfo from "./MemberProfileInfo.vue";
import { defineEmits } from "vue";
import { useAppStore } from "../stores/app";

const emit = defineEmits(["showAiView", "showMembersView"]);
const appStore = useAppStore();
</script>

<template>
  <MainNavigationButtons
    v-if="!appStore.isViewingProfile"
    @showAiView="emit('showAiView')"
    @showMembersView="emit('showMembersView')"
  />
  <MemberProfileInfo
    v-else
    @showAiView="emit('showAiView')"
    @showMembersView="emit('showMembersView')"
  />
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

.button img {
  margin-right: 10px;
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
</style>
