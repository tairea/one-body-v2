<script setup>
import logoImage from '../assets/org_logo_DWeb.jpeg'
// Component logic can be added here
</script>

<template>
  <div class="sidebar">
    <div id="wg">
      <h1>dWeb Fellows Alumni</h1>
      <h2>A collective of dWeb camp fellows</h2>
      <img id="logo" src="../assets/org_logo_DWeb.jpeg" width="70" />
    </div>

    <!-- BUTTONS -->
    <div id="members" class="button">
      <img src="./members.png" width="20" height="20" />
      <p class="b1">25 Members</p>
    </div>
    <div id="ai-summary" class="button">
      <img src="./chatgpt.png" width="20" height="20" />
      <p class="b1">Ai collective overview</p>
    </div>
    <div id="ai" class="button">
      <img src="./chatgpt.png" width="20" height="20" />
      <p class="b1">Ai suggested collabs</p>
    </div>

  </div>
</template>

<style scoped>
.sidebar {
  position: absolute; /* Always on the left */
  left: 0;
  top: 0;
  width: 300px;
  padding: 20px;
  background-color: transparent;
  /* box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1); */
  height: 100vh;
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
}

h2 {
  font-size: 1rem;
  color: #666;
  margin-bottom: 15px;
}

.button {
  display: flex;
  align-items: center;
  padding: 10px; /* Reduced from 12px */
  margin: 8px 0; /* Reduced from 10px */
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
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
</style> 