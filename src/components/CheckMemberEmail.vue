<script>
import { alumniAllowList } from "../server/hard-coded/alumniAllowList.js";
import { useAppStore } from "../stores/app";

export default {
  name: "CheckMemberEmail",
  emits: ["email-verified"],
  setup() {
    const appStore = useAppStore();
    return { appStore };
  },
  data() {
    return {
      email: "",
      errorMessage: "",
      isLoading: false,
    };
  },
  methods: {
    async handleCheckEmail() {
      if (!this.email.trim()) {
        this.errorMessage = "Please enter an email address";
        return;
      }

      this.isLoading = true;
      this.errorMessage = "";

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const email = this.email.trim().toLowerCase();
      
      const foundAlumni = alumniAllowList.find(alumni => alumni.email.toLowerCase() === email);
      
      if (foundAlumni) {
        this.$emit("email-verified", { email: foundAlumni.email, name: foundAlumni.name });
      } else {
        this.errorMessage = "Email not found in our alumni database. Please contact me@evanhahn.com or vaipunu@tairea.io if you believe this is an error.";
      }

      this.isLoading = false;
    },
    handleClose() {
      this.email = "";
      this.errorMessage = "";
    },
  },
};
</script>

<template>
  <div class="dialog-overlay">
    <div class="dialog" :class="{ 'dark-mode': appStore.isDarkMode }">
      <!-- Dialog header -->
      <div class="dialog-header">
        <img id="logo" src="../assets/org_logo_DWeb.jpeg" width="100" />
        <h2>Please verify you are a <br>DWeb Fellow Alumni</h2>
        <p class="dialog-subtitle">Enter your email to check if you're in the alumni database</p>
      </div>

      <!-- Dialog content -->
      <div class="dialog-content">
        <div class="form-group">
          <label for="email">Email Address:</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="Enter your email address"
            class="form-input"
            :disabled="isLoading"
            @keyup.enter="handleCheckEmail"
          />
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
      </div>

      <!-- Dialog actions -->
      <div class="dialog-actions">
        <button
          class="button"
          @click="handleCheckEmail"
          :disabled="!email.trim() || isLoading"
        >
          <span v-if="isLoading">Checking...</span>
          <span v-else>Check Email</span>
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

.dialog-header {
  margin-bottom: 20px;
  text-align: center;
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

.form-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.dialog.dark-mode .form-input:disabled {
  background-color: rgba(255, 255, 255, 0.1);
}

.form-input::placeholder {
  color: #999;
  transition: color 0.3s ease;
}

.dialog.dark-mode .form-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.error-message {
  color: #dc3545;
  font-size: 0.9rem;
  margin-top: 8px;
  padding: 8px 12px;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.dialog.dark-mode .error-message {
  background-color: rgba(220, 53, 69, 0.2);
  border: 1px solid rgba(220, 53, 69, 0.3);
  color: #ff6b6b;
}

.dialog-actions {
  display: flex;
  justify-content: center;
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
  min-width: 120px;
}

.button:hover:not(:disabled) {
  background-color: #f5f5f5;
}

.button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
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
</style> 