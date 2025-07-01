<script setup>
import { ref } from "vue";
import { useAppStore } from "../stores/app";
import CheckMemberEmail from "../components/CheckMemberEmail.vue";
import LoginDialog from "../components/LoginDialog.vue";
import RegisterDialog from "../components/RegisterDialog.vue";
import DarkModeToggle from "../components/DarkModeToggle.vue";

const appStore = useAppStore();
const showCheckEmail = ref(true);
const showLogin = ref(false);
const showRegister = ref(false);
const verifiedEmail = ref("");
const verifiedName = ref("");

const handleEmailVerified = (alumni) => {
  verifiedEmail.value = alumni.email;
  verifiedName.value = alumni.name;
  showCheckEmail.value = false;
  showLogin.value = true;
};

const handleShowRegister = () => {
  showLogin.value = false;
  showRegister.value = true;
};

const handleBackToLogin = () => {
  showRegister.value = false;
  showLogin.value = true;
};

const handleClose = () => {
  showCheckEmail.value = true;
  showLogin.value = false;
  showRegister.value = false;
  verifiedEmail.value = "";
  verifiedName.value = "";
};
</script>

<template>
  <div class="login-container" :class="{ 'dark-mode': appStore.isDarkMode }">
    <!-- Dark Mode Toggle -->
    <DarkModeToggle />
    
    <div class="login-content">
      
      <!-- Check Member Email Dialog -->
      <CheckMemberEmail
        v-if="showCheckEmail"
        @email-verified="handleEmailVerified"
      />

      <!-- Login Dialog -->
      <LoginDialog
        v-if="showLogin"
        :email="verifiedEmail"
        :name="verifiedName"
        @show-register="handleShowRegister"
        @close="handleClose"
      />

      <!-- Register Dialog -->
      <RegisterDialog
        v-if="showRegister"
        @close="handleBackToLogin"
        @save="handleClose"
      />
    </div>
    
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  /* background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); */
  background: #fff;
  padding: 20px;
  transition: background 0.3s ease;
  box-sizing: border-box;
  overflow: hidden;
}

.login-container.dark-mode {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.login-content {
  text-align: center;
  color: white;
  max-width: 400px;
  width: 100%;
}

.login-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.login-subtitle {
  font-size: 1.1rem;
  margin-bottom: 2rem;
  opacity: 0.9;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}
</style> 