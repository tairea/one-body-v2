<template>
  <div class="step-content" :class="{ 'dark-mode': isDarkMode }">
    <h3 class="mb-2">Your Vehicles</h3>
    <p class="step-description mb-2">
      Vehicles are the initiatives, projects and businesses you work on to
      achieve your visions.<br />
      Tell us here about all the different things you're involved in.
    </p>
    <p class="step-description">
      <em
        ><small class="form-hint"
          >Note: Everyone's values, visions and vehicles will be processed by our
          local (offline) LLM to help reveal shared similarities, connections
          and opportunities amongst the fellows.</small
        ></em
      >
    </p>
    <div class="strings-input-container">
      <input
        v-model="newVehicle"
        @keydown="handleInputKeydown"
        @blur="addVehicle"
        type="text"
        placeholder="Add a vehicle, press Enter"
        class="strings-input"
        :class="{ editing: editingChip !== null }"
        ref="vehicleInput"
      />
      <small class="edit-hint">💡 Click any chip to edit it</small>
    </div>
    <div class="chip-container">
      <div
        v-for="(vehicle, index) in vehicles"
        :key="vehicle.title + '-' + index"
        class="chip chip-created"
        :class="{ editing: editingChip === vehicle.title }"
        :style="{ '--chip-color': getChipColor(index) }"
        @click="editVehicle(vehicle)"
      >
        {{ vehicle.title }}
        <button
          @click.stop="removeVehicle(index)"
          class="chip-remove"
          type="button"
        >
          ×
        </button>
      </div>
    </div>
  </div>
</template>

<script>
// @ts-check
import { useAppStore } from "../stores/app";

export default {
  name: "VehiclesStep",
  props: {
    vehicles: {
      type: Array,
      required: true,
    },
  },
  emits: ["update:vehicles"],
  data() {
    return {
      newVehicle: "",
      editingChip: null,
    };
  },
  computed: {
    isDarkMode() {
      return useAppStore().isDarkMode;
    },
  },
  methods: {
    handleInputKeydown(event) {
      if (event.key === "Tab" || event.key === "Enter") {
        event.preventDefault();
        this.addVehicle();
      }
    },
    addVehicle() {
      const trimmed = this.newVehicle.trim();
      const exists = this.vehicles.some((v) => v.title === trimmed);
      if (trimmed && !exists) {
        this.$emit("update:vehicles", [...this.vehicles, { title: trimmed }]);
        this.newVehicle = "";
      }
    },
    removeVehicle(index) {
      const updated = [...this.vehicles];
      updated.splice(index, 1);
      this.$emit("update:vehicles", updated);
    },
    editVehicle(vehicle) {
      this.editingChip = vehicle.title;
      this.newVehicle = vehicle.title;
      const index = this.vehicles.findIndex((v) => v.title === vehicle.title);
      if (index > -1) {
        const updated = [...this.vehicles];
        updated.splice(index, 1);
        this.$emit("update:vehicles", updated);
      }
      this.$nextTick(() => {
        this.$refs.vehicleInput?.focus();
        this.editingChip = null;
      });
    },
    getChipColor(index) {
      const dwebColors = [
        "#ff4f2d",
        "#e06ef9",
        "#bbdf27",
        "#ffc81f",
        "#00d6c6",
        "#00b3f3",
      ];
      return dwebColors[index % dwebColors.length];
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

.strings-input-container {
  margin-bottom: 16px;
}

.edit-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #666;
  font-style: italic;

  .dark-mode & {
    color: rgba(255, 255, 255, 0.5);
  }
}

.strings-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }

  &.editing {
    border-color: #28a745;
    box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.25);
  }

  .dark-mode & {
    background-color: #4a5568;
    border-color: #718096;
    color: rgba(255, 255, 255, 0.87);

    &:focus {
      border-color: #4299e1;
      box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.25);
    }

    &.editing {
      border-color: #48bb78;
      box-shadow: 0 0 0 2px rgba(72, 187, 120, 0.25);
    }
  }
}

// Chip container and chips
.chip-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.chip {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 20px;
  background: white;
  color: #333;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  outline: none;
  user-select: none;

  &:hover {
    border-color: #007bff;
    background-color: #f8f9fa;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .dark-mode & {
    background-color: #4a5568;
    border-color: #718096;
    color: rgba(255, 255, 255, 0.87);

    &:hover {
      border-color: #4299e1;
      background-color: #2d3748;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    &:active {
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }
  }

  &.chip-created {
    background-color: var(--chip-color, #e3f2fd);
    color: #333;
    border-color: var(--chip-color, #bbdefb);
    padding-right: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;

    .dark-mode & {
      background-color: var(--chip-color, #2c5282);
      color: #fff;
      border-color: var(--chip-color, #4299e1);
    }

    &.editing {
      animation: chipEdit 0.3s ease-in-out;
    }
  }
}

@keyframes chipEdit {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.chip-remove {
  background: none;
  border: none;
  color: inherit;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }

  .dark-mode & {
    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }
}
</style>
