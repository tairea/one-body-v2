<script setup>
// @ts-check
import { useRouter } from "vue-router";
import { useAppStore } from "../stores/app";

// Define props
const props = defineProps({
  person: {
    type: Object,
    required: true
  },
  hasNodePositionChanges: {
    type: Boolean,
    default: false
  },
  isSavingPositions: {
    type: Boolean,
    default: false
  }
});

const router = useRouter();
const appStore = useAppStore();

const handleEditProfile = () => {
  appStore.setEditingPerson(props.person);
  appStore.showAddPersonDialog();
};

const handleFullscreen = () => {
  appStore.enterFullscreen();
};

const handleToggleNodeLabels = () => {
  appStore.toggleNodeLabels();
};

const handleSaveNodePositions = () => {
  // Emit event to parent to save node positions
  emit('saveNodePositions');
};

// Define emits
const emit = defineEmits(['saveNodePositions']);
</script>

<template>
  <div class="right-overlay" :class="{ 'dark-mode': appStore.isDarkMode }" v-bind="$attrs">
    <div v-if="props.person">
      <h1>Hi, {{ props.person.name.split(' ')[0] }} 👋</h1>
      <h3>Thanks for completing your DWeb Fellow's profile</h3>

      <!-- Profile Actions -->
      <div class="profile-section">
        <h2>Profile Actions</h2>
        
        <div class="button" @click="handleEditProfile">
          <v-icon icon="mdi-account-edit" size="20" />
          <p class="b1">Edit Profile Data</p>
        </div>
        
        <div class="button" @click="handleFullscreen">
          <v-icon icon="mdi-fullscreen" size="20" />
          <p class="b1">Full-Screen Interactive View</p>
        </div>
        
        <div class="button" @click="handleToggleNodeLabels">
          <v-icon :icon="appStore.showNodeLabels ? 'mdi-eye-off' : 'mdi-eye'" size="20" />
          <p class="b1">{{ appStore.showNodeLabels ? 'Hide' : 'Show' }} Node Labels</p>
        </div>
        
        <!-- Save Node Positions Button - only show when there are changes -->
        <div v-if="hasNodePositionChanges" class="button save-positions-button" 
             :class="{ 'saving': isSavingPositions, 'disabled': isSavingPositions }"
             @click="handleSaveNodePositions">
          <v-icon :icon="isSavingPositions ? 'mdi-loading mdi-spin' : 'mdi-content-save'" size="20" />
          <p class="b1">{{ isSavingPositions ? 'Saving...' : 'Save New Node Positions' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.right-overlay {
  position: absolute;
  right: 0;
  top: 40%;
  transform: translateY(-50%);
  width: 300px;
  padding: 20px;
  background-color: transparent;
  backdrop-filter: blur(2px);
  z-index: 1000;
  overflow: hidden;
  box-sizing: border-box;

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

  h3 {
    font-size: 1.1rem;
    font-weight: 600;
    color: #333;
    margin-bottom: 15px;
    text-align: left;
  }

  .profile-section {
    margin-bottom: 30px;
  }

  .button {
    display: flex;
    align-items: center;
    padding: 10px;
    margin: 8px 0;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s;
    border: 1px solid rgba(0, 0, 0, 0.3);
    background-color: transparent;

    &:hover {
      background-color: #f5f5f5;
    }

    .v-icon {
      margin-right: 10px;
      color: #333;
      transition: color 0.2s ease;
    }
    
    &.save-positions-button {
      background-color: #4CAF50;
      border-color: #4CAF50;
      color: white;
      
      &:hover {
        background-color: #45a049;
      }
      
      .v-icon {
        color: white;
      }
      
      .b1 {
        color: white;
      }
      
      &.saving {
        background-color: #FF9800;
        border-color: #FF9800;
        cursor: not-allowed;
        
        &:hover {
          background-color: #FF9800;
        }
      }
      
      &.disabled {
        opacity: 0.7;
        cursor: not-allowed;
        
        &:hover {
          background-color: #4CAF50;
        }
      }
    }
  }

  .b1 {
    margin: 0;
    font-size: 0.9rem;
    color: #333;
  }

  // Dark mode styles
  &.dark-mode {
    h1 {
      color: rgba(255, 255, 255, 0.87);
    }

    h3 {
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
      
      &.save-positions-button {
        background-color: #4CAF50;
        border-color: #4CAF50;
        
        &:hover {
          background-color: #45a049;
        }
        
        .v-icon {
          color: white !important;
        }
        
        .b1 {
          color: white;
        }
      }
    }
  }
}
</style>
