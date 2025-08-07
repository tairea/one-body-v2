<template>
  <div class="step-content" :class="{ 'dark-mode': isDarkMode }">
    <h3 class="mb-2">Your Values</h3>
    <p class="step-description mb-2">
      What are your personal values? What do you care about?<br />
      This could also include your skills, and experience.
    </p>
    <p class="step-description">
      <em
        ><small class="form-hint"
          >Note: Your values, visions and vehicles will be processed by our
          local LLM to help generate connections and opportunities amongst the
          fellows.</small
        ></em
      >
    </p>
    <div class="values-input-container">
      <input
        v-model="newValue"
        @keydown="handleValueKeydown"
        @blur="addValue"
        type="text"
        placeholder="Type a value and press Tab or comma to add"
        class="values-input"
      />
    </div>
    <div class="chip-container">
      <div
        v-for="value in values"
        :key="value"
        class="chip chip-created"
        :style="{ '--chip-color': getChipColor(value) }"
      >
        {{ value }}
        <button @click="removeValue(value)" class="chip-remove" type="button">
          ×
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { useAppStore } from "../stores/app";

export default {
  name: "ValuesStep",
  props: {
    values: {
      type: Array,
      required: true,
    },
  },
  emits: ["update:values"],
  data() {
    return {
      newValue: "",
    };
  },
  computed: {
    isDarkMode() {
      return useAppStore().isDarkMode;
    },
  },
  methods: {
    handleValueKeydown(event) {
      if (event.key === "Tab" || event.key === "," || event.key === "Enter") {
        event.preventDefault();
        this.addValue();
      }
    },
    addValue() {
      const trimmedValue = this.newValue.trim();
      if (trimmedValue && !this.values.includes(trimmedValue)) {
        const updatedValues = [...this.values, trimmedValue];
        this.$emit("update:values", updatedValues);
        this.newValue = "";
      }
    },
    removeValue(value) {
      const index = this.values.indexOf(value);
      if (index > -1) {
        const updatedValues = [...this.values];
        updatedValues.splice(index, 1);
        this.$emit("update:values", updatedValues);
      }
    },
    getChipColor(value) {
      // Cycle through DWeb colors sequentially
      const dwebColors = [
        "#ff4f2d", // Bright Red-Orange (large and medium dots)
        "#e06ef9", // Purple/Violet (medium dots)
        "#bbdf27", // Lime Green (small and medium dots)
        "#ffc81f", // Bright Yellow-Orange (medium and small dots)
        "#00d6c6", // Aqua Green (large dot)
        "#00b3f3", // Sky Blue (medium dots)
      ];

      // Use the index of the value in the values array to cycle through colors
      const colorIndex = this.values.indexOf(value) % dwebColors.length;
      return dwebColors[colorIndex];
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

// Values input container
.values-input-container {
  margin-bottom: 16px;
}

.values-input {
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

  .dark-mode & {
    background-color: #4a5568;
    border-color: #718096;
    color: rgba(255, 255, 255, 0.87);

    &:focus {
      border-color: #4299e1;
      box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.25);
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

  &:hover {
    border-color: #007bff;
    background-color: #f8f9fa;
  }

  .dark-mode & {
    background-color: #4a5568;
    border-color: #718096;
    color: rgba(255, 255, 255, 0.87);

    &:hover {
      border-color: #4299e1;
      background-color: #2d3748;
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
