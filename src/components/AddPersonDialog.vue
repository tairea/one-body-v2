<template>
  <div class="dialog-overlay">
    <div
      class="dialog"
      :class="{ 'dark-mode': appStore.isDarkMode }"
      @click.stop
    >
      <!-- Dialog header -->
      <div class="dialog-header">
        <button
          v-if="editingPerson"
          class="close-btn"
          @click="$emit('close')"
          aria-label="Close dialog"
        >
          <v-icon icon="mdi-close" size="24" />
        </button>
      </div>

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
                  <div class="step-header-content" @click="goToStep(step)">
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
                  <h2>
                    {{ editingPerson ? "Edit Profile" : "DWeb Fellows Alumni" }}
                  </h2>
                  <p v-if="editingPerson" class="dialog-subtitle">
                    Update your profile information below. Make changes to any
                    field and save when you're done.
                  </p>
                  <p v-else class="dialog-subtitle">
                    This activity is designed to help connect us DWeb Fellows
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
                :locationName="locationName"
                :profile-image="profileImage"
                @update:name="name = $event"
                @update:email="email = $event"
                @update:location-name="locationName = $event"
                @update:profile-image="profileImage = $event"
              />
            </v-stepper-window-item>

            <!-- Step 3: Your Values -->
            <v-stepper-window-item :value="3">
              <StringListStep
                title="Your Values"
                description="What are your personal values? What do you care about? This could also include your skills, and experience."
                instruction="Type a value and press Tab or Enter to add"
                :strings="values"
                @update="values = $event"
              />
            </v-stepper-window-item>

            <!-- Step 4: Your Visions -->
            <v-stepper-window-item :value="4">
              <StringListStep
                title="Your Visions"
                description="What visions are you working on, or  are wanting to achieve? This might include your interests, passions, goals, purpose."
                instruction="Type a vision and press Tab or Enter to add"
                :strings="visions"
                @update="visions = $event"
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
                    <p v-if="locationName">
                      <strong>Location:</strong> {{ locationName }}
                    </p>
                    <div class="summary-section">
                      <strong>Values:</strong>
                      <div class="chips-container">
                        <span v-for="value in values" :key="value" class="chip">
                          {{ value }}
                        </span>
                      </div>
                    </div>
                    <div class="summary-section">
                      <strong>Visions:</strong>
                      <div class="chips-container">
                        <span
                          v-for="vision in visions"
                          :key="vision"
                          class="chip"
                        >
                          {{ vision }}
                        </span>
                      </div>
                    </div>
                    <div class="summary-section">
                      <strong>Vehicles:</strong>
                      <div class="chips-container">
                        <span
                          v-for="vehicle in vehicles"
                          :key="vehicle.title"
                          class="chip"
                        >
                          {{ vehicle.title }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </v-stepper-window-item>
          </v-stepper-window>
        </v-stepper>

        <!-- Custom buttons outside of v-stepper-actions -->
        <div class="dialog-actions">
          <button
            v-if="currentStep > 1"
            class="btn btn-secondary"
            @click="prevStep"
          >
            Previous
          </button>

          <!-- Update Profile button - show on all steps when editing -->
          <button
            v-if="editingPerson && currentStep > 1"
            class="btn btn-primary"
            :class="{ 'btn-success': updateSuccess }"
            @click="handleSave"
            :disabled="!canProceed || isUpdating"
          >
            <span v-if="isUpdating" class="loading-spinner"></span>
            <span v-else-if="updateSuccess" class="success-icon">✓</span>
            {{
              isUpdating
                ? "Updating..."
                : updateSuccess
                  ? "Updated!"
                  : "Update Profile"
            }}
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
            v-if="currentStep === totalSteps && !editingPerson"
            class="btn btn-primary"
            @click="handleSave"
          >
            Save Profile
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// @ts-check
import { useAppStore } from "../stores/app";
import DetailsStep from "./DetailsStep.vue";
import StringListStep from "./StringListStep.vue";
import VehiclesStep from "./VehiclesStep.vue";
import { maybeJsonParse } from "../lib/maybeJsonParse.js";
import * as is from "../lib/is.js";

export default {
  name: "AddPersonDialog",
  components: {
    DetailsStep,
    StringListStep,
    VehiclesStep,
  },
  props: {
    editingPerson: {
      type: Object,
      default: null,
    },
  },
  emits: ["close", "save"],
  data() {
    return {
      currentStep: 1,
      totalSteps: 6,
      /** @type {string} */
      name: this.editingPerson?.name || "",
      /** @type {string} */
      email: this.editingPerson?.email || "",
      /** @type {string} */
      locationName: this.editingPerson?.locationName || "",
      /** @type {null | string} */
      profileImage: this.editingPerson?.photo || null,
      /** @type {string[]} */
      values: this.editingPerson?.values || [],
      /** @type {string[]} */
      visions: this.editingPerson?.visions || [],
      /** @type {Array<{ title: string, description?: string }>} */
      vehicles: this.editingPerson?.vehicles || [],
      /** @type {boolean} */
      isUpdating: false,
      /** @type {boolean} */
      updateSuccess: false,
    };
  },
  mounted() {
    if (this.editingPerson) {
      // If editing, populate from props and skip localStorage
      this.populateFromPerson(this.editingPerson);
    } else {
      // If creating new, load from localStorage
      this.loadStateFromLocalStorage();
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
      if (this.currentStep < this.totalSteps && this.canProceed) {
        this.currentStep++;
        this.saveStateToLocalStorage();
      }
    },
    prevStep() {
      if (this.currentStep > 1) {
        this.currentStep--;
      }
      this.saveStateToLocalStorage();
    },
    loadStateFromLocalStorage() {
      const signupData = maybeJsonParse(localStorage.getItem("signupData"));

      if (!signupData) return;
      if (typeof signupData !== "object") return;
      // This `instanceof Array` check is necessary for type checking.
      // I didn't investigate why.
      if (is.array(signupData) || signupData instanceof Array) return;

      if (is.string(signupData.name)) {
        this.name = signupData.name;
      }
      if (is.string(signupData.email)) {
        this.email = signupData.email;
      }
      if (is.string(signupData.locationName)) {
        this.locationName = signupData.locationName;
      }
      if (is.string(signupData.profileImage)) {
        this.profileImage = signupData.profileImage;
      }
      if (is.array(signupData.values) && signupData.values.every(is.string)) {
        this.values = signupData.values;
      }
      if (is.array(signupData.visions) && signupData.visions.every(is.string)) {
        this.visions = signupData.visions;
      }
      if (
        is.array(signupData.vehicles) &&
        signupData.vehicles.every(
          (vehicle) =>
            is.record(vehicle) &&
            is.string(vehicle.title) &&
            (is.undefined(vehicle.description) ||
              is.string(vehicle.description)),
        )
      ) {
        this.vehicles =
          /** @type {Array<{ title: string, description?: string }>} */ (
            signupData.vehicles
          );
      }
    },
    populateFromPerson(person) {
      if (is.string(person.name)) {
        this.name = person.name;
      }
      if (is.string(person.email)) {
        this.email = person.email;
      }
      if (is.string(person.locationName)) {
        this.locationName = person.locationName;
      }
      if (person.hasPhoto) {
        // For now, we'll set a default image or leave it null
        // since we don't store the actual photo URL in the Person type
        this.profileImage = null;
      }
      if (is.array(person.values) && person.values.every(is.string)) {
        this.values = person.values;
      }
      if (is.array(person.visions) && person.visions.every(is.string)) {
        this.visions = person.visions;
      }
      if (
        is.array(person.vehicles) &&
        person.vehicles.every(
          (vehicle) =>
            is.record(vehicle) &&
            is.string(vehicle.title) &&
            (is.undefined(vehicle.description) ||
              is.string(vehicle.description)),
        )
      ) {
        this.vehicles =
          /** @type {Array<{ title: string, description?: string }>} */ (
            person.vehicles
          );
      }
    },
    saveStateToLocalStorage() {
      const signupData = {
        name: this.name,
        email: this.email,
        locationName: this.locationName,
        profileImage: this.profileImage,
        values: this.values,
        visions: this.visions,
        vehicles: this.vehicles,
      };
      localStorage.setItem("signupData", JSON.stringify(signupData));
    },
    async handleSave() {
      if (this.canProceed) {
        const personData = {
          name: this.name.trim(),
          email: this.email.trim(),
          locationName: this.locationName.trim(),
          hasPhoto: !!this.profileImage,
          photo: this.profileImage, // Include photo data for API
          values: this.values,
          visions: this.visions,
          vehicles: this.vehicles,
        };

        if (this.editingPerson) {
          // Set loading state
          this.isUpdating = true;

          // If editing, preserve the ID and other fields
          personData.id = this.editingPerson.id;
          personData.createdAt = this.editingPerson.createdAt;
          personData.updatedAt = new Date().toISOString();

          // Try to make API call to update the person
          try {
            const personReference = JSON.parse(
              localStorage.getItem("personReference"),
            );

            if (
              personReference &&
              personReference.id &&
              personReference.secretKey
            ) {
              const updatePersonUrl = new URL("/api/person", location.href);

              const response = await fetch(updatePersonUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  personData,
                  id: personReference.id,
                  secretKey: personReference.secretKey,
                }),
              });

              if (response.ok) {
                // Person updated successfully via API
                this.updateSuccess = true;
                // Hide success message after 2 seconds
                setTimeout(() => {
                  this.updateSuccess = false;
                }, 2000);
              }
            }
          } catch (error) {
            // Error updating person via API, continuing with local update
          } finally {
            // Reset loading state
            this.isUpdating = false;
          }
        }

        this.$emit("save", personData);
      }
    },
    goToStep(step) {
      if (step >= 1 && step <= this.totalSteps) {
        this.currentStep = step;
        this.saveStateToLocalStorage();
      }
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
  position: relative;
  margin-bottom: 20px;
  padding-top: 8px;
  padding-right: 8px;
}

.close-btn {
  position: absolute;
  top: 0;
  right: 0;
  background: none;
  border: none;
  cursor: pointer;
  padding: 12px;
  border-radius: 50%;
  transition: background-color 0.2s;
  color: #666;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;

  &:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }
}

.dark-mode .close-btn {
  color: rgba(255, 255, 255, 0.6);

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
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
  gap: 8px !important;

  .dialog.dark-mode & {
    border-bottom-color: #4a5568;
  }
}

.custom-stepper-item {
  color: #666 !important;
  background: transparent !important;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 60px !important;
  max-width: 80px !important;
  flex: 0 0 auto !important;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05) !important;
    transform: translateY(-1px);
  }

  .dialog.dark-mode & {
    color: #e0e6ed !important;

    &:hover {
      background-color: rgba(255, 255, 255, 0.05) !important;
    }
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

  .summary-section {
    margin: 8px 0;

    strong {
      display: block;
      margin-bottom: 8px;
      color: #333;

      .dialog.dark-mode & {
        color: rgba(255, 255, 255, 0.87);
      }
    }
  }

  .chips-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 8px;
  }

  .chip {
    display: inline-block;
    padding: 6px 12px;
    background-color: #e3f2fd;
    color: #1976d2;
    border-radius: 16px;
    font-size: 12px;
    font-weight: 500;
    border: 1px solid #bbdefb;
    transition: all 0.2s ease;

    &:hover {
      background-color: #bbdefb;
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .dialog.dark-mode & {
      background-color: rgba(33, 150, 243, 0.2);
      color: #64b5f6;
      border-color: rgba(33, 150, 243, 0.4);

      &:hover {
        background-color: rgba(33, 150, 243, 0.3);
      }
    }
  }
}

// Dialog actions
.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

// Buttons
.btn {
  display: flex;
  align-items: center;
  gap: 8px;
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

  &.btn-success {
    background-color: #d4edda;
    border-color: #c3e6cb;
    color: #155724;

    &:hover {
      background-color: #c3e6cb;
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

    &.btn-success {
      background-color: rgba(16, 185, 129, 0.2);
      border-color: rgba(16, 185, 129, 0.4);
      color: #10b981;

      &:hover {
        background-color: rgba(16, 185, 129, 0.3);
      }
    }
  }
}

// Loading spinner
.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

// Success icon
.success-icon {
  font-size: 16px;
  font-weight: bold;
  color: #155724;

  .dialog.dark-mode & {
    color: #10b981;
  }
}
</style>
