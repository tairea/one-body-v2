<template>
  <div class="dialog-overlay" @click="handleClose">
    <div
      class="dialog"
      :class="{ 'dark-mode': appStore.isDarkMode }"
      @click.stop
    >
      <!-- Dialog header -->
      <div class="dialog-header"></div>

      <!-- Stepper -->
      <div class="stepper-container">
        <v-stepper
          v-model="currentStep"
          class="custom-stepper"
          alt-labels
          bg-color="transparent"
        >
          <v-stepper-header class="custom-stepper-header">
            <template v-for="step in totalSteps" :key="step">
              <v-stepper-item
                :value="step"
                :complete="currentStep > step"
                class="custom-stepper-item"
              >
                <template #title>
                  <div class="step-header-content">
                    <div class="step-emoji">{{ getStepEmoji(step) }}</div>
                    <div class="step-title mt-1">{{ getStepTitle(step) }}</div>
                  </div>
                </template>
              </v-stepper-item>
              <v-divider
                v-if="step < totalSteps"
                class="custom-stepper-divider"
              />
            </template>
          </v-stepper-header>

          <v-stepper-window v-model="currentStep" class="custom-stepper-window">
            <!-- Step 1: Intro -->
            <v-stepper-window-item :value="1">
              <div class="step-content">
                <div class="step-intro">
                  <img
                    id="logo"
                    src="../assets/org_logo_DWeb.jpeg"
                    width="100"
                  />
                  <h2>DWeb Fellows Alumni</h2>
                  <p class="dialog-subtitle">
                    This activity is designed to help us connect DWeb Fellows
                    and grow the community. <br /><br />Tell us a bit about
                    yourself, what excites you and what you're working on. The
                    more we share, the easier it is to connect, collaborate and
                    build the decentralized web together. <br /><br /><em
                      >Note: The info you enter to create your profile will only
                      be visible by other DWeb fellows.</em
                    >
                  </p>
                </div>
              </div>
            </v-stepper-window-item>

            <!-- Step 2: Your Details -->
            <v-stepper-window-item :value="2">
              <DetailsStep
                :name="name"
                :email="email"
                :location="location"
                :profile-image="profileImage"
                @update:name="name = $event"
                @update:email="email = $event"
                @update:location="location = $event"
                @update:profile-image="profileImage = $event"
              />
            </v-stepper-window-item>

            <!-- Step 3: Your Values -->
            <v-stepper-window-item :value="3">
              <ValuesStep :values="values" @update:values="values = $event" />
            </v-stepper-window-item>

            <!-- Step 4: Your Visions -->
            <v-stepper-window-item :value="4">
              <VisionsStep
                :visions="visions"
                @update:visions="visions = $event"
              />
            </v-stepper-window-item>

            <!-- Step 5: Your Vehicles -->
            <v-stepper-window-item :value="5">
              <VehiclesStep
                :vehicles="vehicles"
                @update:vehicles="vehicles = $event"
              />
            </v-stepper-window-item>

            <!-- Step 6: Done -->
            <v-stepper-window-item :value="6">
              <div class="step-content">
                <div class="step-done">
                  <h3>You're All Set!</h3>
                  <p>
                    Thank you for sharing your information with the DWeb Fellows
                    community.
                  </p>
                  <div class="summary-card">
                    <h4>Summary</h4>
                    <div v-if="profileImage" class="summary-image">
                      <img :src="profileImage" alt="Profile" />
                    </div>
                    <p><strong>Name:</strong> {{ name }}</p>
                    <p><strong>Email:</strong> {{ email }}</p>
                    <p v-if="location">
                      <strong>Location:</strong> {{ location }}
                    </p>
                    <p><strong>Values:</strong> {{ values.join(", ") }}</p>
                    <p>
                      <strong>Visions:</strong>
                      {{ visions.map((v) => v.title).join(", ") }}
                    </p>
                    <p>
                      <strong>Vehicles:</strong>
                      {{ vehicles.map((v) => v.title).join(", ") }}
                    </p>
                  </div>
                </div>
              </div>
            </v-stepper-window-item>
          </v-stepper-window>
        </v-stepper>

        <!-- Custom buttons outside of v-stepper-actions -->
        <div class="dialog-actions">
          <button class="btn btn-secondary" @click="handleCancel">
            Cancel
          </button>
          <button
            v-if="currentStep > 1"
            class="btn btn-secondary"
            @click="prevStep"
          >
            Previous
          </button>
          <button
            v-if="currentStep < totalSteps"
            class="btn btn-primary"
            @click="nextStep"
            :disabled="!canProceed"
          >
            Next
          </button>
          <button
            v-if="currentStep === totalSteps"
            class="btn btn-primary"
            @click="handleSave"
          >
            Save Profile
          </button>
        </div>
      </div>

      <!-- Dialog actions -->
    </div>
  </div>
</template>

<script>
// @ts-check
import { useAppStore } from "../stores/app";
import DetailsStep from "./DetailsStep.vue";
import ValuesStep from "./ValuesStep.vue";
import VisionsStep from "./VisionsStep.vue";
import VehiclesStep from "./VehiclesStep.vue";

export default {
  name: "AddPersonDialog",
  components: {
    DetailsStep,
    ValuesStep,
    VisionsStep,
    VehiclesStep,
  },
  emits: ["close", "save"],
  data() {
    return {
      currentStep: 1,
      totalSteps: 6,
      name: "",
      email: "",
      location: "",
      profileImage: null,
      values: [],
      visions: [], // Changed from array of strings to array of objects
      vehicles: [], // Changed from array of strings to array of objects
    };
  },
  mounted() {
    // Load profile image from localStorage if it exists
    const savedImage = localStorage.getItem("profileImage");
    if (savedImage) {
      this.profileImage = savedImage;
    }
  },
  computed: {
    appStore() {
      return useAppStore();
    },
    canProceed() {
      switch (this.currentStep) {
        case 1: // Intro - always can proceed
          return true;
        case 2: // Details
          return this.name.trim() && this.email.trim();
        case 3: // Values
          return this.values.length > 0;
        case 4: // Visions
          return this.visions.length > 0;
        case 5: // Vehicles
          return this.vehicles.length > 0;
        default:
          return true;
      }
    },
  },
  methods: {
    getStepEmoji(step) {
      const emojis = {
        1: "👋",
        2: "👤",
        3: "❤️",
        4: "🎯",
        5: "🚀",
        6: "✅",
      };
      return emojis[step] || "";
    },
    getStepTitle(step) {
      const titles = {
        1: "Intro",
        2: "Details",
        3: "Values",
        4: "Visions",
        5: "Vehicles",
        6: "Done",
      };
      return titles[step] || `Step ${step}`;
    },
    nextStep() {
      console.log("nextStep called", {
        currentStep: this.currentStep,
        totalSteps: this.totalSteps,
        canProceed: this.canProceed,
      });
      if (this.currentStep < this.totalSteps && this.canProceed) {
        console.log("nextStep - proceeding to step", this.currentStep + 1);
        this.currentStep++;
      } else {
        console.log("nextStep - cannot proceed", {
          reason:
            this.currentStep >= this.totalSteps
              ? "at last step"
              : "validation failed",
        });
      }
    },
    prevStep() {
      if (this.currentStep > 1) {
        this.currentStep--;
      }
    },
    handleSave() {
      if (this.canProceed) {
        this.$emit("save", {
          name: this.name.trim(),
          email: this.email.trim(),
          location: this.location.trim(),
          photo: this.profileImage,
          values: this.values,
          visions: this.visions,
          vehicles: this.vehicles,
        });
        this.resetForm();
      }
    },
    handleCancel() {
      this.$emit("close");
      this.resetForm();
    },
    handleClose() {
      this.$emit("close");
      this.resetForm();
    },
    resetForm() {
      this.currentStep = 1;
      this.name = "";
      this.email = "";
      this.location = "";
      this.profileImage = null;
      this.values = [];
      this.visions = [];
      this.vehicles = [];
    },
  },
};
</script>

<style lang="scss" scoped>
// Dialog overlay
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

// Main dialog container
.dialog {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 600px;
  position: relative;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  overflow-y: auto;

  &.dark-mode {
    background-color: #2d3748;
    color: rgba(255, 255, 255, 0.87);
  }
}

// Dialog header
.dialog-header {
  margin-bottom: 20px;
  padding-right: 40px;

  h2 {
    margin: 0;
    font-size: 2rem;
    font-weight: 700;
    color: #222;
    letter-spacing: 0.01em;

    .dialog.dark-mode & {
      color: #fff;
    }
  }
}

// Dialog subtitle
.dialog-subtitle {
  margin: 10px 0 0 0;
  color: #666;
  line-height: 1.5;

  .dialog.dark-mode & {
    color: rgba(255, 255, 255, 0.6);
  }
}

// Stepper container
.stepper-container {
  margin-bottom: 24px;
}

// Custom stepper styles
.custom-stepper {
  border: none;
  box-shadow: none !important;
}

.custom-stepper-header {
  background: transparent !important;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
  box-shadow: none !important;

  .dialog.dark-mode & {
    border-bottom-color: #4a5568;
  }
}

.custom-stepper-item {
  color: #666 !important;
  background: transparent !important;
  // min-width: 80px !important;

  .dialog.dark-mode & {
    color: #e0e6ed !important;
  }

  &--active {
    color: #007bff !important;
    background: transparent !important;

    .dialog.dark-mode & {
      color: #90cdf4 !important;
    }
  }

  &--complete {
    color: #28a745 !important;
    background: transparent !important;

    .dialog.dark-mode & {
      color: #48bb78 !important;
    }
  }

  // Override Vuetify's internal title styling
  :deep(.v-stepper-item__title) {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    text-align: center !important;
  }
}

.step-header-content {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  text-align: center !important;
  width: 100% !important;
}

.step-emoji {
  font-size: 24px !important;
  margin-bottom: 4px !important;
  line-height: 1 !important;
  display: block !important;
}

.step-title {
  font-size: 12px !important;
  font-weight: 340 !important;
  line-height: 1.2 !important;
  display: block !important;
}

.custom-stepper-divider {
  border-color: #4a5568 !important;

  .dialog.dark-mode & {
    border-color: #eee !important;
  }
}

.custom-stepper-window {
  background: transparent !important;
}

// Step content
.step-content {
  padding: 20px 0;

  h3 {
    margin: 0 0 16px 0;
    font-size: 1.25rem;
    color: #333;

    .dialog.dark-mode & {
      color: rgba(255, 255, 255, 0.87);
    }
  }
}

.step-description {
  margin-bottom: 16px;
  color: #666;
  line-height: 1.5;

  .dialog.dark-mode & {
    color: rgba(255, 255, 255, 0.6);
  }
}

// Step intro
.step-intro {
  text-align: center;

  h3 {
    margin-bottom: 16px;
  }

  p {
    margin-bottom: 12px;
    line-height: 1.6;
  }
}

// Step done
.step-done {
  text-align: center;

  h3 {
    margin-bottom: 16px;
  }

  p {
    margin-bottom: 20px;
  }
}

// Info note
.info-note {
  background-color: #e3f2fd;
  border: 1px solid #bbdefb;
  border-radius: 6px;
  padding: 12px;
  margin-top: 16px;
  color: #1976d2;

  .dialog.dark-mode & {
    background-color: #2c5282;
    border-color: #4299e1;
    color: #90cdf4;
  }
}

// Summary card
.summary-card {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  text-align: left;
  margin-top: 16px;

  .dialog.dark-mode & {
    background-color: #4a5568;
    border-color: #718096;
  }

  h4 {
    margin: 0 0 12px 0;
    color: #333;

    .dialog.dark-mode & {
      color: rgba(255, 255, 255, 0.87);
    }
  }

  p {
    margin: 4px 0;
    color: #666;

    .dialog.dark-mode & {
      color: rgba(255, 255, 255, 0.6);
    }
  }

  .summary-image {
    text-align: center;
    margin-bottom: 16px;

    img {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #007bff;

      .dialog.dark-mode & {
        border-color: #4299e1;
      }
    }
  }
}

// Dialog actions
.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}

// Buttons
.btn {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  border: 1px solid rgba(0, 0, 0, 0.3);
  background-color: rgba(255, 255, 255, 0.05);
  font-size: 14px;
  font-weight: 500;
  outline: none;

  &:hover:not(:disabled) {
    background-color: #f5f5f5;
  }

  &.btn-primary {
    color: #333;
    border-color: rgba(0, 0, 0, 0.3);

    &:hover:not(:disabled) {
      background-color: #f5f5f5;
    }

    &:disabled {
      background-color: #ccc;
      cursor: not-allowed;
      opacity: 0.6;
      border-color: #ccc;
    }
  }

  &.btn-secondary {
    color: #333;
    border-color: rgba(0, 0, 0, 0.3);

    &:hover {
      background-color: #f5f5f5;
    }
  }

  // Dark mode styles
  .dialog.dark-mode & {
    border: 1px solid rgba(255, 255, 255, 0.3);
    background-color: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.87);

    &:hover:not(:disabled) {
      background-color: rgba(255, 255, 255, 0.1);
    }

    &.btn-primary {
      &:disabled {
        background-color: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.2);
        color: rgba(255, 255, 255, 0.4);
      }
    }
  }
}
</style>
