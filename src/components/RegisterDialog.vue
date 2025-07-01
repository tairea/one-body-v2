<script>
import { useAppStore } from "../stores/app";

export default {
  name: "RegisterDialog",
  emits: ["close", "save"],
  setup() {
    const appStore = useAppStore();
    return { appStore };
  },
  data() {
    return {
      name: "",
      email: "",
    };
  },
  methods: {
    handleSave() {
      if (this.name.trim() && this.email.trim()) {
        this.$emit("save", {
          name: this.name.trim(),
          email: this.email.trim(),
        });
        // Reset form
        this.name = "";
        this.email = "";
      }
    },
    handleCancel() {
      this.$emit("close");
      // Reset form
      this.name = "";
      this.email = "";
    },
    handleClose() {
      this.$emit("close");
      // Reset form
      this.name = "";
      this.email = "";
    },
  },
};
</script>

<template>
  <div class="dialog-overlay">
    <div class="dialog" :class="{ 'dark-mode': appStore.isDarkMode }">
      <!-- Close button -->
      <button class="close-button" @click="handleClose">
        <span>&times;</span>
      </button>

      <!-- Dialog header -->
      <div class="dialog-header">
        <h2>Please create your profile</h2>
        <p class="dialog-subtitle">The point of this activity is to help us build a community of dWeb fellows. Please tell us a bit about yourself, so we can learn more about each other and what we are working on.</p>
      </div>

      <!-- Dialog content -->
      <div class="dialog-content">
        <div class="form-group">
          <label for="name">Full Name:</label>
          <input
            id="name"
            v-model="name"
            type="text"
            placeholder="Enter your full name"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="email">Email Address:</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="Enter your email address"
            class="form-input"
          />
        </div>
      </div>

      <!-- Dialog actions -->
      <div class="dialog-actions">
        <button class="button button-secondary" @click="handleCancel">Cancel</button>
        <button
          class="button"
          @click="handleSave"
          :disabled="!name.trim() || !email.trim()"
        >
          Create Account
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
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

.dialog {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
  position: relative;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  transition: background-color 0.3s ease;
}

.dialog.dark-mode {
  background: #1a1a2e;
  color: rgba(255, 255, 255, 0.87);
}

.close-button {
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s, color 0.3s ease;
  z-index: 1;
}

.dialog.dark-mode .close-button {
  color: rgba(255, 255, 255, 0.6);
}

.close-button:hover {
  background-color: #f0f0f0;
}

.dialog.dark-mode .close-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.dialog-header {
  margin-bottom: 20px;
  text-align: center;
  position: relative;
}

.dialog-header h2 {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  color: #333;
  transition: color 0.3s ease;
}

.dialog.dark-mode .dialog-header h2 {
  color: rgba(255, 255, 255, 0.87);
}

.dialog-subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
  line-height: 1.4;
  transition: color 0.3s ease;
}

.dialog.dark-mode .dialog-subtitle {
  color: rgba(255, 255, 255, 0.6);
}

.dialog-content {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
  transition: color 0.3s ease;
}

.dialog.dark-mode .form-group label {
  color: rgba(255, 255, 255, 0.87);
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
  transition: border-color 0.2s, background-color 0.3s ease, color 0.3s ease;
  background-color: white;
  color: #333;
}

.dialog.dark-mode .form-input {
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.87);
}

.form-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.dialog.dark-mode .form-input:focus {
  border-color: #4a9eff;
  box-shadow: 0 0 0 2px rgba(74, 158, 255, 0.25);
}

.form-input::placeholder {
  color: #999;
  transition: color 0.3s ease;
}

.dialog.dark-mode .form-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  border: 1px solid rgba(0, 0, 0, 0.3);
  background-color: white;
  color: #333;
  font-size: 0.9rem;
  font-weight: 500;
}

.button:hover:not(:disabled) {
  background-color: #f5f5f5;
}

.button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.button-secondary {
  background-color: #f8f9fa;
  border: 1px solid #ddd;
}

.button-secondary:hover:not(:disabled) {
  background-color: #e9ecef;
}

.dialog.dark-mode .button {
  border: 1px solid rgba(255, 255, 255, 0.3);
  background-color: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.87);
}

.dialog.dark-mode .button:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.1);
}

.dialog.dark-mode .button:disabled {
  background-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.5);
}

.dialog.dark-mode .button-secondary {
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.dialog.dark-mode .button-secondary:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.15);
}
</style> 