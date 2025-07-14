<template>
  <div :class="{ 'dark-mode': isDarkMode }">
    <!-- Add Vision Button -->
     <div class="add-vision-btn-container">
    <button class="add-vision-btn" @click="openDialog">
      <v-icon>mdi-plus</v-icon>
      Add a Vision
    </button>
    </div>

    <!-- Vision Dialog -->
    <v-dialog v-model="dialogOpen" max-width="500px" class="dialog" :class="{ 'dark-mode': isDarkMode }">
      <v-card class="dialog-card">
        <!-- Dialog Header -->
        <v-card-title class="dialog-header">
          🎯
          {{ editMode ? 'Edit Vision' : 'Add a vision/interest/passion/purpose' }}
        </v-card-title>
        <p class="step-description">
         Share with us what you are working towards. 
        </p>
        <p class="step-description"
                    ><em><small class="form-hint">The more info you provide, the better the local LLM can connect you to the right fellows.</small></em></p
                  >

        <!-- Dialog Content -->
        <v-card-text class="dialog-content">
          <!-- Title Input -->
          <div class="form-group">
            <label for="vision-title">Title: <small class="form-hint">(required)</small></label>

            <input
              id="vision-title"
              v-model="visionData.title"
              type="text"
              placeholder="Enter vision title"
              class="form-input"
            />
          </div>

          <!-- Description Input -->
          <div class="form-group">
            <label for="vision-description mb-0">Description: <small class="form-hint">(optional)</small></label>
            <!-- <small class="form-hint">You can be as specific or as general as you want</small> -->
            <textarea
              id="vision-description"
              v-model="visionData.description"
              placeholder="Describe your vision, interest, passion, or purpose (optional)"
              class="form-textarea"
              rows="4"
            ></textarea>
          </div>

          <!-- Related Links Input -->
          <div class="form-group">
            <label for="vision-links">Related Links: <small class="form-hint">(optional)</small></label>
            <input
              id="vision-links"
              v-model="newLink"
              @keydown="handleLinkKeydown"
              @blur="addLink"
              type="text"
              placeholder="Type a link and press Tab or comma to add (optional)"
              class="form-input"
            />
          </div>

          <!-- Links Display -->
          <div v-if="visionData.relatedLinks.length > 0" class="links-display">
            <label>Related Links:</label>
            <div class="links-list">
              <p v-for="link in visionData.relatedLinks" :key="link" class="link-item">
                <a :href="link" target="_blank" rel="noopener noreferrer">{{ link }}</a>
                <button
                  @click="removeLink(link)"
                  class="remove-link-btn"
                  type="button"
                >
                  ×
                </button>
              </p>
            </div>
          </div>
        </v-card-text>

        <!-- Dialog Actions -->
        <v-card-actions class="dialog-actions">
          <button class="btn btn-secondary" @click="closeDialog">Cancel</button>
                    <button 
            class="btn btn-primary" 
            @click="saveVision"
            :disabled="!canSave"
          >
            {{ editMode ? 'Update Vision' : 'Save Vision' }}
          </button>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { useAppStore } from "../stores/app";

export default {
  name: "AddVision",
  emits: ["vision-added", "vision-updated"],
  props: {
    editMode: {
      type: Boolean,
      default: false
    },
    editVision: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      dialogOpen: false,
      visionData: {
        title: "",
        description: "",
        relatedLinks: [],
      },
      newLink: "",
    };
  },
  computed: {
    isDarkMode() {
      return useAppStore().isDarkMode;
    },
    canSave() {
      return this.visionData.title.trim();
    },
  },
  methods: {
    openDialog() {
      this.dialogOpen = true;
    },
    openEditDialog(vision) {
      this.visionData = {
        title: vision.title,
        description: vision.description || "",
        relatedLinks: [...(vision.relatedLinks || [])],
      };
      this.dialogOpen = true;
    },
    closeDialog() {
      this.dialogOpen = false;
      this.resetForm();
    },
    resetForm() {
      this.visionData = {
        title: "",
        description: "",
        relatedLinks: [],
      };
      this.newLink = "";
    },
    handleLinkKeydown(event) {
      if (event.key === "Tab" || event.key === "," || event.key === "Enter") {
        event.preventDefault();
        this.addLink();
      }
    },
    addLink() {
      const trimmedLink = this.newLink.trim();
      if (trimmedLink && !this.visionData.relatedLinks.includes(trimmedLink)) {
        this.visionData.relatedLinks.push(trimmedLink);
        this.newLink = "";
      }
    },
    removeLink(link) {
      const index = this.visionData.relatedLinks.indexOf(link);
      if (index > -1) {
        this.visionData.relatedLinks.splice(index, 1);
      }
    },
    getChipColor(link) {
      // Use a neutral gray color for all chips
      return "#6c757d";
    },
    saveVision() {
      if (this.canSave) {
        const visionData = {
          title: this.visionData.title.trim(),
          description: this.visionData.description.trim(),
          relatedLinks: [...this.visionData.relatedLinks],
        };
        
        if (this.editMode) {
          this.$emit("vision-updated", visionData);
        } else {
          this.$emit("vision-added", visionData);
        }
        this.closeDialog();
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.add-vision-btn-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 16px;
}
// Add Vision Button
.add-vision-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #333;
  font-size: 14px;
  font-weight: 500;
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
}

.plus-icon {
  font-size: 16px;
}


.dialog-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 600px;

  .dialog.dark-mode & {
    background-color: #2d3748;
    color: rgba(255, 255, 255, 0.87);
  }
}

// Dialog Styles
.dialog-header {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  padding: 20px 20px 0 20px;

  .dark-mode & {
    color: rgba(255, 255, 255, 0.87);
  }
}

.step-description {
  margin:0px 20px;
  color: #666;
  line-height: 1.5;

  .dialog.dark-mode & {
    color: rgba(255, 255, 255, 0.6);
  }
}

.dialog-content {
  padding: 20px;
}

.dialog-actions {
  padding: 0 20px 20px 20px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

// Form elements
.form-group {
  margin-bottom: 16px;

  label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    color: #333;

    .dark-mode & {
      color: rgba(255, 255, 255, 0.87);
    }
  }

  .form-hint {
  display: block;
  margin-bottom: 10px;
  font-size: 12px;
  color: #666;

  .dialog.dark-mode & {
    color: rgba(255, 255, 255, 0.5);
  }
}
}

.form-input {
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

.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
  transition: border-color 0.2s;
  resize: vertical;
  font-family: inherit;

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
    font-weight: 400;
    font-size: 12px;

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

// Links display styles
.links-display {
  margin-top: 12px;

  label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    color: #333;
    font-size: 14px;

    .dark-mode & {
      color: rgba(255, 255, 255, 0.87);
    }
  }

  .links-list {
    .link-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 4px 0;
      padding: 4px 8px;
      background-color: #f8f9fa;
      border-radius: 4px;
      font-size: 12px;

      .dark-mode & {
        background-color: #4a5568;
      }

      a {
        color: #007bff;
        text-decoration: none;
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        &:hover {
          text-decoration: underline;
        }

        .dark-mode & {
          color: #4299e1;
        }
      }

      .remove-link-btn {
        background: none;
        border: none;
        color: #dc3545;
        font-size: 14px;
        cursor: pointer;
        padding: 0;
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        margin-left: 8px;

        &:hover {
          background-color: #f8d7da;
        }

        .dark-mode & {
          color: #ff6b6b;

          &:hover {
            background-color: rgba(255, 255, 255, 0.1);
          }
        }
      }
    }
  }
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
  .dark-mode & {
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
