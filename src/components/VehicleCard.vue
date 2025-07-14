<template>
  <v-card outlined class="vehicle-card-component">
    <v-card-title class="vehicle-header">
      <h5>{{ vehicle.title }}</h5>
      <div class="vehicle-actions">
        <button 
          @click="$emit('edit', vehicle)"
          class="edit-vehicle-btn"
          type="button"
          title="Edit Vehicle"
        >
          <svg class="edit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button 
          @click="$emit('remove')"
          class="remove-vehicle-btn"
          type="button"
          title="Remove Vehicle"
        >
          ×
        </button>
      </div>
    </v-card-title>
    
    <v-card-text class="vehicle-content">
      <p v-if="vehicle.description" class="vehicle-description mx-4">{{ vehicle.description }}</p>
      
      <div v-if="vehicle.relatedLinks && vehicle.relatedLinks.length > 0" class="vehicle-links">
        <p v-for="link in vehicle.relatedLinks" :key="link" class="vehicle-link mx-4">
          <a :href="link" target="_blank" rel="noopener noreferrer">{{ link }}</a>
        </p>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { useAppStore } from "../stores/app";

export default {
  name: "VehicleCard",
  props: {
    vehicle: {
      type: Object,
      required: true
    }
  },
  emits: ["edit", "remove"],
  computed: {
    isDarkMode() {
      return useAppStore().isDarkMode;
    },
  },
};
</script>

<style lang="scss" scoped>
.vehicle-card-component {
  margin-bottom: 12px;
  border: 1px solid #e0e0e0 !important;
  border-radius: 8px;
  transition: all 0.2s ease-in-out;

  &:hover {
    border-color: #007bff !important;
    box-shadow: 0 2px 8px rgba(0, 123, 255, 0.1);
  }

  .dark-mode & {
    border-color: #4a5568 !important;
    background-color: #2d3748;

    &:hover {
      border-color: #4299e1 !important;
      box-shadow: 0 2px 8px rgba(66, 153, 225, 0.1);
    }
  }
}

.vehicle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px 8px 16px;
  border-bottom: 1px solid #f0f0f0;

  .dark-mode & {
    border-bottom-color: #4a5568;
  }

  h5 {
    margin: 0;
    font-size: 0.9rem;
    color: #333;
    font-weight: 600;

    .dark-mode & {
      color: rgba(255, 255, 255, 0.87);
    }
  }
}

.vehicle-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.edit-vehicle-btn {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(0, 123, 255, 0.1);
  }

  .dark-mode & {
    color: #4299e1;

    &:hover {
      background-color: rgba(66, 153, 225, 0.1);
    }
  }
}

.edit-icon {
  width: 16px;
  height: 16px;
}

.remove-vehicle-btn {
  background: none;
  border: none;
  color: #dc3545;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f8d7da;
  }

  .dark-mode & {
    color: #ff6b6b;

    &:hover {
      background-color: rgba(255, 107, 107, 0.1);
    }
  }
}

.vehicle-content {
  padding: 12px 0px;
}

.vehicle-description {
  color: #555;
  line-height: 1.4;
  margin-bottom: 8px;
  font-size: 0.8rem;
  text-align: left;

  .dark-mode & {
    color: rgba(255, 255, 255, 0.6);
  }
}

.vehicle-links {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #eee;
  text-align: left;

  .dark-mode & {
    border-top-color: #4a5568;
  }

  strong {
    display: block;
    margin-bottom: 4px;
    color: #333;
    font-size: 14px;

    .dark-mode & {
      color: rgba(255, 255, 255, 0.87);
    }
  }

  .vehicle-link {
    margin: 2px 0;
    font-size: 12px;

    a {
      color: #007bff;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }

      .dark-mode & {
        color: #4299e1;
      }
    }
  }
}
</style> 