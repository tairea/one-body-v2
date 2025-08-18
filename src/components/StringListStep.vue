<template>
  <div class="step-content" :class="{ 'dark-mode': isDarkMode }">
    <h3 class="mb-2">{{ title }}</h3>
    <p class="step-description mb-2">
      {{ description }}
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
    <div class="strings-input-container">
      <input
        v-model="newString"
        @keydown="handleStringInputKeydown"
        @blur="addString"
        type="text"
        :placeholder="instruction"
        class="strings-input"
        :class="{ editing: editingChip !== null }"
        ref="stringInput"
      />
      <small class="edit-hint">💡 Click any chip to edit it</small>
    </div>
    <div class="chip-container">
      <div
        v-for="string in strings"
        :key="string"
        class="chip chip-created"
        :class="{ editing: editingChip === string }"
        :style="{ '--chip-color': getChipColor(string) }"
        @click="editString(string)"
      >
        {{ string }}
        <button
          @click.stop="removeString(string)"
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
import { useAppStore } from "../stores/app";

export default {
  name: "StringListStep",
  props: {
    title: { type: String, required: true },
    description: { type: String, required: true },
    instruction: { type: String, required: true },
    strings: {
      type: Array,
      required: true,
    },
  },
  emits: ["update"],
  data() {
    return {
      newString: "",
      editingChip: null,
    };
  },
  computed: {
    isDarkMode() {
      return useAppStore().isDarkMode;
    },
  },
  methods: {
    handleStringInputKeydown(event) {
      if (event.key === "Tab" || event.key === "Enter") {
        event.preventDefault();
        this.addString();
      }
    },
    addString() {
      const trimmed = this.newString.trim();
      if (trimmed && !this.strings.includes(trimmed)) {
        this.$emit("update", [...this.strings, trimmed]);
        this.newString = "";
      }
    },
    removeString(string) {
      const index = this.strings.indexOf(string);
      if (index > -1) {
        const updatedStrings = [...this.strings];
        updatedStrings.splice(index, 1);
        this.$emit("update", updatedStrings);
      }
    },
    editString(string) {
      this.editingChip = string;
      this.newString = string;
      // Find the index of the string to remove it after editing
      const index = this.strings.indexOf(string);
      if (index > -1) {
        const updatedStrings = [...this.strings];
        updatedStrings.splice(index, 1);
        this.$emit("update", updatedStrings);
      }
      // Focus the input field for immediate editing
      this.$nextTick(() => {
        this.$refs.stringInput?.focus();
        this.editingChip = null;
      });
    },
    getChipColor(string) {
      // Cycle through DWeb colors sequentially
      const dwebColors = [
        "#ff4f2d", // Bright Red-Orange (large and medium dots)
        "#e06ef9", // Purple/Violet (medium dots)
        "#bbdf27", // Lime Green (small and medium dots)
        "#ffc81f", // Bright Yellow-Orange (medium and small dots)
        "#00d6c6", // Aqua Green (large dot)
        "#00b3f3", // Sky Blue (medium dots)
      ];

      // Use the index of the string in the strings array to cycle through colors
      const colorIndex = this.strings.indexOf(string) % dwebColors.length;
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
