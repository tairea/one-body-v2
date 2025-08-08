<template>
  <div class="step-content" :class="{ 'dark-mode': isDarkMode }">
    <h3 class="mb-2">Your Vehicles</h3>
    <p class="step-description mb-0">
      Vehicles are the initiatives, projects and businesses we work on to
      achieve our visions.<br />
      Tell us here about all the different things you're involved in.
    </p>
    <p class="step-description mt-2">
      <em
        ><small class="form-hint"
          >Note: Everyones values, visions and vehicles will be processed by our
          local (offline) LLM to help reveal shared similarities, connections
          and opportunities amongst the fellows.</small
        ></em
      >
    </p>

    <!-- Add Vehicle Component -->
    <AddVehicle
      ref="addVehicle"
      @vehicle-added="addVehicle"
      @vehicle-updated="updateVehicle"
      :edit-mode="editMode"
      :edit-vehicle="editingVehicle"
    />

    <!-- Display Added Vehicles -->
    <div v-if="vehicles.length > 0" class="vehicles-container">
      <div class="vehicle-cards">
        <VehicleCard
          v-for="(vehicle, index) in vehicles"
          :key="index"
          :vehicle="vehicle"
          @edit="editVehicle"
          @remove="removeVehicle(index)"
          class="vehicle-card"
        />
      </div>
    </div>
  </div>
</template>

<script>
// @ts-check
import { useAppStore } from "../stores/app";
import AddVehicle from "./AddVehicle.vue";
import VehicleCard from "./VehicleCard.vue";

export default {
  name: "VehiclesStep",
  components: {
    AddVehicle,
    VehicleCard,
  },
  props: {
    vehicles: {
      type: Array,
      required: true,
    },
  },
  emits: ["update:vehicles"],
  data() {
    return {
      editMode: false,
      editingVehicle: null,
    };
  },
  computed: {
    isDarkMode() {
      return useAppStore().isDarkMode;
    },
  },
  methods: {
    addVehicle(vehicle) {
      const updatedVehicles = [...this.vehicles, vehicle];
      this.$emit("update:vehicles", updatedVehicles);
    },
    editVehicle(vehicle) {
      this.editingVehicle = vehicle;
      this.editMode = true;
      // Find the AddVehicle component and call its openEditDialog method
      this.$nextTick(() => {
        /** @type {undefined | AddVehicle} */
        const addVehicleComponent = /** @type {any} */ (this.$refs.addVehicle);
        if (addVehicleComponent) {
          addVehicleComponent.openEditDialog(vehicle);
        }
      });
    },
    updateVehicle(updatedVehicle) {
      const index = this.vehicles.findIndex((v) => v === this.editingVehicle);
      if (index !== -1) {
        const updatedVehicles = [...this.vehicles];
        updatedVehicles[index] = updatedVehicle;
        this.$emit("update:vehicles", updatedVehicles);
      }
      this.editMode = false;
      this.editingVehicle = null;
    },
    removeVehicle(index) {
      const updatedVehicles = [...this.vehicles];
      updatedVehicles.splice(index, 1);
      this.$emit("update:vehicles", updatedVehicles);
    },
  },
};
</script>

<style lang="scss" scoped>
// Step content
.step-content {
  padding: 20px 0;

  h3 {
    margin: 0 0 16px 0;
    font-size: 1.25rem;
    color: #333;

    .dark-mode & {
      color: rgba(255, 255, 255, 0.87);
    }
  }
}

.step-description {
  margin-bottom: 16px;
  color: #666;
  line-height: 1.5;

  .dark-mode & {
    color: rgba(255, 255, 255, 0.6);
  }
}

.form-hint {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: #666;

  .dark-mode & {
    color: rgba(255, 255, 255, 0.5);
  }
}

// Vehicle card styles
.vehicles-container {
  margin-top: 20px;

  .vehicle-card {
    width: 100%;
  }
}
</style>
