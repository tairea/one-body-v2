<script setup>
// @ts-check
import { getPhotoUrl } from "../lib/utils.js";
</script>

<template>
  <div
    class="person-detail-container"
    :class="{ visible: isVisible, 'dark-mode': appStore.isDarkMode }"
    @click.self="handleBackClick"
  >
    <div class="person-detail-content">
      <!-- Back Button -->
      <button class="back-button" @click="handleBackClick">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M19 12H5M12 19L5 12L12 5"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        Back to Globe
      </button>

      <!-- Person Photo -->
      <div class="person-photo-container">
        <img
          :src="getPhotoUrl({ id: person.id })"
          :alt="person.name"
          class="person-photo"
          @load="onImageLoad"
        />
      </div>

      <!-- Person Info -->
      <div class="person-info">
        <h1 class="person-name">{{ person.name }}</h1>

        <!-- Values Section -->
        <div class="info-section">
          <h3>Values</h3>
          <div class="tags">
            <span v-for="value in person.values" :key="value" class="tag">
              {{ value }}
            </span>
          </div>
        </div>

        <!-- Vision Section -->
        <div class="info-section">
          <h3>Vision</h3>
          <div class="tags">
            <span v-for="vision in person.vision" :key="vision" class="tag">
              {{ vision }}
            </span>
          </div>
        </div>

        <!-- Vehicles Section -->
        <div class="info-section">
          <h3>Vehicles</h3>
          <div class="vehicles-list">
            <div
              v-for="(vehicle, index) in person.vehicles"
              :key="index"
              class="vehicle-item"
            >
              <div v-if="typeof vehicle === 'string'" class="vehicle-text">
                {{ vehicle }}
              </div>
              <div v-else class="vehicle-org">
                <div class="vehicle-name">{{ vehicle.org }}</div>
                <div class="vehicle-mission">{{ vehicle.mission }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useAppStore } from "../stores/app";

export default {
  name: "PersonDetailView",
  props: {
    person: {
      type: Object,
      required: true,
    },
    isVisible: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    appStore() {
      return useAppStore();
    },
  },
  methods: {
    handleBackClick() {
      this.$emit("back-to-globe");
    },
    onImageLoad() {
      // Trigger any animations after image loads
      this.$emit("image-loaded");
    },
  },
};
</script>

<style scoped>
.person-detail-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
}

.person-detail-container.visible {
  opacity: 1;
  visibility: visible;
}

.person-detail-container.dark-mode {
  background: rgba(26, 32, 44, 0.95);
}

.person-detail-content {
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 40px;
  position: relative;
  transform: scale(0.8) translateY(50px);
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.person-detail-container.visible .person-detail-content {
  transform: scale(1) translateY(0);
}

.dark-mode .person-detail-content {
  background: #2d3748;
  color: #e2e8f0;
}

.back-button {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.back-button:hover {
  background: white;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.dark-mode .back-button {
  background: rgba(45, 55, 72, 0.9);
  color: #e2e8f0;
}

.dark-mode .back-button:hover {
  background: #4a5568;
}

.person-photo-container {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

.person-photo {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  object-fit: cover;
  border: 6px solid #e2e8f0;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.dark-mode .person-photo {
  border-color: #4a5568;
}

.person-info {
  text-align: center;
}

.person-name {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 30px;
  line-height: 1.2;
}

.dark-mode .person-name {
  color: #e2e8f0;
}

.info-section {
  margin-bottom: 30px;
  text-align: left;
}

.info-section h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 15px;
  text-align: center;
}

.dark-mode .info-section h3 {
  color: #a0aec0;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.tag {
  background: #edf2f7;
  color: #2d3748;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.tag:hover {
  background: #e2e8f0;
  transform: translateY(-1px);
}

.dark-mode .tag {
  background: #4a5568;
  color: #e2e8f0;
  border-color: #718096;
}

.dark-mode .tag:hover {
  background: #718096;
}

.vehicles-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.vehicle-item {
  background: #f7fafc;
  border-radius: 12px;
  padding: 15px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.vehicle-item:hover {
  background: #edf2f7;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dark-mode .vehicle-item {
  background: #4a5568;
  border-color: #718096;
}

.dark-mode .vehicle-item:hover {
  background: #718096;
}

.vehicle-text {
  font-size: 1rem;
  color: #2d3748;
  font-weight: 500;
}

.dark-mode .vehicle-text {
  color: #e2e8f0;
}

.vehicle-org {
  text-align: left;
}

.vehicle-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 5px;
}

.dark-mode .vehicle-name {
  color: #e2e8f0;
}

.vehicle-mission {
  font-size: 0.9rem;
  color: #718096;
  line-height: 1.4;
}

.dark-mode .vehicle-mission {
  color: #a0aec0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .person-detail-content {
    padding: 20px;
    margin: 20px;
  }

  .person-photo {
    width: 150px;
    height: 150px;
  }

  .person-name {
    font-size: 2rem;
  }

  .back-button {
    top: 10px;
    left: 10px;
    padding: 8px 12px;
    font-size: 12px;
  }
}
</style>
