<script>
import { useAppStore } from "../stores/app";

export default {
  name: "LoginDialog",
  props: {
    email: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
  },
  emits: ["show-register", "close"],
  setup() {
    const appStore = useAppStore();
    return { appStore };
  },
  data() {
    return {
      isLoading: false,
      message: "",
      messageType: "", // "success" or "error"
    };
  },
  methods: {
    async handleSendMagicLink() {
      this.isLoading = true;
      this.message = "";
      this.messageType = "";

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate success response
      this.message = "Magic link sent! Check your email for the login link.";
      this.messageType = "success";
      this.isLoading = false;
    },
    handleShowRegister() {
      this.$emit("show-register");
    },
    handleClose() {
      this.$emit("close");
    },
  },
};
</script>

<template>
  <div class="dialog-overlay">
    <div class="dialog" :class="{ 'dark-mode': appStore.isDarkMode }">
      <!-- Dialog header -->
      <div class="dialog-header">
        <h2>Login</h2>
        <p class="dialog-subtitle">Welcome back, {{ name.split(' ')[0] }}! We'll send you a magic link to sign in.</p>
      </div>

      <!-- Dialog content -->
      <div class="dialog-content">
        <div class="form-group">
          <label>Email Address:</label>
          <div class="email-display">{{ email }}</div>
        </div>

        <div v-if="message" :class="['message', messageType]">
          {{ message }}
        </div>
      </div>

      <!-- Dialog actions -->
      <div class="dialog-actions">
        <button
          class="button"
          @click="handleSendMagicLink"
          :disabled="isLoading"
        >
          <span v-if="isLoading">Sending...</span>
          <span v-else>Send Magic Link</span>
        </button>
      </div>

      <!-- Register link -->
      <div class="register-link">
        <p>
          Don't have an account? 
          <button class="link-button" @click="handleShowRegister">
            Register here
          </button>
        </p>
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

.email-display {
  padding: 10px 12px;
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  color: #333;
  font-weight: 500;
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
}

.dialog.dark-mode .email-display {
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.87);
}

.message {
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
}

.message.success {
  color: #155724;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
}

.dialog.dark-mode .message.success {
  color: #4ade80;
  background-color: rgba(74, 222, 128, 0.2);
  border: 1px solid rgba(74, 222, 128, 0.3);
}

.message.error {
  color: #721c24;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
}

.dialog.dark-mode .message.error {
  color: #ff6b6b;
  background-color: rgba(255, 107, 107, 0.2);
  border: 1px solid rgba(255, 107, 107, 0.3);
}

.dialog-actions {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
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
  min-width: 140px;
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

.register-link {
  text-align: center;
  border-top: 1px solid #eee;
  padding-top: 16px;
  transition: border-color 0.3s ease;
}

.dialog.dark-mode .register-link {
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.register-link p {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
  transition: color 0.3s ease;
}

.dialog.dark-mode .register-link p {
  color: rgba(255, 255, 255, 0.6);
}

.link-button {
  background: none;
  border: none;
  color: #007bff;
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0;
  margin: 0;
  transition: color 0.3s ease;
}

.dialog.dark-mode .link-button {
  color: #4a9eff;
}

.link-button:hover {
  color: #0056b3;
}

.dialog.dark-mode .link-button:hover {
  color: #6bb6ff;
}
</style> 