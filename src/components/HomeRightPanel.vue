<script setup>
// @ts-check
import { useRouter } from "vue-router";
import { useAppStore } from "../stores/app";

// Define props
const props = defineProps({
  person: {
    type: Object,
    required: true,
  },
  hasNodePositionChanges: {
    type: Boolean,
    default: false,
  },
  isSavingPositions: {
    type: Boolean,
    default: false,
  },
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
  emit("saveNodePositions");
};

// Define emits
const emit = defineEmits(["saveNodePositions"]);
</script>

<template>
  <div
    class="right-overlay"
    :class="{ 'dark-mode': appStore.isDarkMode }"
    v-bind="$attrs"
  >
    <div v-if="props.person">
      <!-- Profile Actions -->
      <div class="profile-section">
        <div
          class="icon-button"
          @click="handleEditProfile"
          title="Edit Profile Data"
        >
          <v-icon icon="mdi-account-edit" size="20" />
        </div>

        <div
          class="icon-button"
          @click="handleFullscreen"
          title="Full-Screen Interactive View"
        >
          <v-icon icon="mdi-fullscreen" size="20" />
        </div>

        <div
          class="icon-button"
          @click="handleToggleNodeLabels"
          :title="
            appStore.showNodeLabels ? 'Hide Node Labels' : 'Show Node Labels'
          "
        >
          <v-icon
            :icon="appStore.showNodeLabels ? 'mdi-eye-off' : 'mdi-eye'"
            size="20"
          />
        </div>

        <!-- Save Node Positions Button - only show when there are changes -->
        <div
          v-if="hasNodePositionChanges"
          class="icon-button save-positions-button"
          :class="{ saving: isSavingPositions, disabled: isSavingPositions }"
          @click="handleSaveNodePositions"
          title="Save New Node Positions"
        >
          <v-icon
            :icon="
              isSavingPositions ? 'mdi-loading mdi-spin' : 'mdi-content-save'
            "
            size="20"
          />
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
  width: 100px;
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
    // margin-bottom: 30px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    margin-right: 10px;
  }

  .icon-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    margin: 8px 0;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid rgba(0, 0, 0, 0.3);
    background-color: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);

    &:hover {
      background-color: rgba(255, 255, 255, 1);
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .v-icon {
      color: #333;
      transition: color 0.2s ease;
    }

    &.save-positions-button {
      background-color: #4caf50;
      border-color: #4caf50;

      &:hover {
        background-color: #45a049;
      }

      .v-icon {
        color: white;
      }

      &.saving {
        background-color: #ff9800;
        border-color: #ff9800;
        cursor: not-allowed;

        &:hover {
          background-color: #ff9800;
          transform: none;
          box-shadow: none;
        }
      }

      &.disabled {
        opacity: 0.7;
        cursor: not-allowed;

        &:hover {
          background-color: #4caf50;
          transform: none;
          box-shadow: none;
        }
      }
    }
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

    .icon-button {
      border: 1px solid rgba(255, 255, 255, 0.3);
      background-color: rgba(0, 0, 0, 0.9);

      &:hover {
        background-color: rgba(0, 0, 0, 1);
      }

      .v-icon {
        color: rgba(255, 255, 255, 0.87) !important;
      }

      &.save-positions-button {
        background-color: #4caf50;
        border-color: #4caf50;

        &:hover {
          background-color: #45a049;
        }

        .v-icon {
          color: white !important;
        }
      }
    }
  }
}
</style>
