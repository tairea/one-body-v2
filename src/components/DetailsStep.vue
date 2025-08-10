<template>
  <div class="step-content" :class="{ 'dark-mode': isDarkMode }">
    <!-- Profile Image Upload -->
    <div class="profile-image-container">
      <div
        class="profile-image-placeholder"
        :class="{ 'has-image': profileImage }"
        :style="
          profileImageBorderColor
            ? { '--border-color': profileImageBorderColor }
            : {}
        "
        @click="triggerFileInput"
      >
        <img
          v-if="profileImage"
          :src="profileImage"
          alt="Profile"
          class="profile-image"
        />
        <div v-else class="placeholder-content">
          <svg
            class="plus-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span class="upload-text">Add Photo</span>
        </div>

        <!-- Edit icon overlay -->
        <div v-if="profileImage" class="edit-overlay">
          <svg
            class="edit-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
            ></path>
            <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </div>
      </div>

      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        @change="handleImageUpload"
        style="display: none"
      />
    </div>
    <h3>Your Details</h3>
    <div class="form-group">
      <label for="name">Name:</label>
      <input
        id="name"
        v-model="nameValue"
        type="text"
        placeholder="Enter full name"
        class="form-input"
      />
    </div>
    <div class="form-group">
      <label for="email">Email:</label>
      <input
        id="email"
        v-model="emailValue"
        type="email"
        placeholder="Enter email address"
        class="form-input"
      />
    </div>
    <div class="form-group">
      <label for="locationName" class="ma-0 pa-0">Location:</label>
      <small class="form-hint ma-0"
        >Used to show where we all are on a globe</small
      >
      <small class="form-hint ma-0"
        >You can be as specific or as general as you want</small
      >
      <small class="form-hint">Just enter the country or city name</small>
      <input
        id="location"
        v-model="locationValue"
        type="text"
        placeholder="Enter your location"
        class="form-input"
      />
    </div>
  </div>
</template>

<script>
import { useAppStore } from "../stores/app";
import { getDwebColor } from "../lib/utils";
import { imageFileToDataUrl } from "../lib/imageFileToDataUrl.js";

export default {
  name: "DetailsStep",
  props: {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    locationName: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
      default: null,
    },
  },
  emits: [
    "update:name",
    "update:email",
    "update:locationName",
    "update:profileImage",
  ],
  data() {
    return {
      profileImageBorderColor: null,
    };
  },
  computed: {
    isDarkMode() {
      return useAppStore().isDarkMode;
    },
    nameValue: {
      get() {
        return this.name;
      },
      set(value) {
        this.$emit("update:name", value);
      },
    },
    emailValue: {
      get() {
        return this.email;
      },
      set(value) {
        this.$emit("update:email", value);
      },
    },
    locationValue: {
      get() {
        return this.locationName;
      },
      set(value) {
        this.$emit("update:locationName", value);
      },
    },
  },
  mounted() {
    // Generate a random DWeb color for the profile image border
    this.profileImageBorderColor = getDwebColor();
  },
  methods: {
    triggerFileInput() {
      /** @type {undefined | HTMLInputElement} */
      const fileInput = /** @type {any} */ (this.$refs.fileInput);
      fileInput?.click();
    },
    async handleImageUpload(event) {
      /** @type {undefined | File} */
      const file = event.target.files?.[0];
      if (!file) return;
      this.$emit("update:profileImage", await imageFileToDataUrl(file));
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

.form-hint {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: #666;

  .dark-mode & {
    color: rgba(255, 255, 255, 0.5);
  }
}

// Profile Image Upload Styles
.profile-image-container {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.profile-image-placeholder {
  position: relative;
  width: 120px;
  height: 120px;
  border: 2px dashed #ddd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #f8f9fa;
  overflow: hidden;

  &:hover {
    border-color: #007bff;
    background-color: #e3f2fd;
  }

  &.has-image {
    border: 2px solid var(--border-color, #007bff);
    background-color: transparent;
  }

  .dark-mode & {
    border-color: #4a5568;
    background-color: #2d3748;

    &:hover {
      border-color: #4299e1;
      background-color: #2c5282;
    }

    &.has-image {
      border-color: var(--border-color, #4299e1);
    }
  }
}

.profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #666;
  text-align: center;

  .dark-mode & {
    color: rgba(255, 255, 255, 0.6);
  }
}

.plus-icon {
  width: 32px;
  height: 32px;
  margin-bottom: 8px;
  color: #999;

  .dark-mode & {
    color: rgba(255, 255, 255, 0.5);
  }
}

.upload-text {
  font-size: 12px;
  font-weight: 500;
}

.edit-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
  pointer-events: none;
}

.profile-image-placeholder:hover .edit-overlay {
  opacity: 1;
}

.edit-icon {
  width: 24px;
  height: 24px;
  color: white;
}
</style>
