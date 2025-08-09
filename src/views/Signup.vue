<script setup>
import { onMounted, ref } from "vue";
import AddPersonDialog from "../components/AddPersonDialog.vue";
import DarkModeToggle from "../components/DarkModeToggle.vue";
import { SERVER_BASE_URL } from "../constants.js";
import router from "../router/index.js";
import { useAppStore } from "../stores/app";
import { maybeJsonParse } from "../lib/maybeJsonParse.js";

const appStore = useAppStore();
const errorMsg = ref("");
const secretValid = ref(false);
const loading = ref(true);

/**
 * @param {string} signupSecret
 * @returns {Promise<"missing" | "invalid" | "network error" | "valid">}
 */
async function validateSignupSecret(signupSecret) {
  if (typeof signupSecret !== "string") return "missing";
  const validateSignupSecretUrl = new URL(
    "/validate_signup_secret",
    SERVER_BASE_URL,
  );
  let res;
  try {
    res = await fetch(validateSignupSecretUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signupSecret }),
    });
  } catch (_err) {
    return "network error";
  }
  return res.ok ? "valid" : "invalid";
}

const handleSavePerson = async (personData) => {
  console.log("Saving person:", personData);
  loading.value = true;

  const addPersonUrl = new URL("/person", SERVER_BASE_URL);

  let personReference = maybeJsonParse(localStorage.getItem("personReference"));
  const isPersonReferenceValid =
    personReference &&
    typeof personReference === "object" &&
    "id" in personReference &&
    "secretKey" in personReference;
  if (!isPersonReferenceValid) {
    personReference = {};
  }

  try {
    const response = await fetch(addPersonUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        signupSecret: location.hash.slice(1),
        personData,
        ...personReference,
      }),
    });
    if (!response.ok) throw new Error("Not OK response from server");

    const { id, secretKey } = await response.json();
    localStorage.setItem("personReference", JSON.stringify({ id, secretKey }));
  } catch (_err) {
    errorMsg.value = "Network error. Please try again.";
    return;
  }

  router.push({ name: "Home" });
};

onMounted(async () => {
  const signupSecret = location.hash.slice(1);
  const validity = await validateSignupSecret(signupSecret);
  switch (validity) {
    case "missing":
      errorMsg.value = "Missing secret code in URL.";
      secretValid.value = false;
      break;
    case "invalid":
      errorMsg.value = "Invalid secret code.";
      secretValid.value = false;
      break;
    case "network error":
      errorMsg.value = "Network error when fetching secret. Please refresh.";
      secretValid.value = false;
      break;
    case "valid":
      errorMsg.value = "";
      secretValid.value = true;
      break;
    default:
      throw new Error("Unexpected validation case. Code has a bug");
  }

  loading.value = false;
});
</script>

<template>
  <div class="signup-container" :class="{ 'dark-mode': appStore.isDarkMode }">
    <DarkModeToggle />
    <div class="signup-content">
      <div v-if="loading" class="spinner"></div>
      <div v-else>
        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
        <AddPersonDialog v-else-if="secretValid" @save="handleSavePerson" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.signup-container {
  min-height: 100vh;
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  padding: 20px;
  transition: background 0.3s ease;
  box-sizing: border-box;
  overflow: hidden;
}

.signup-container.dark-mode {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.signup-content {
  text-align: center;
  color: white;
  max-width: 400px;
  width: 100%;
}

.error-msg {
  color: #ff4d4f;
  background: #fff0f0;
  border: 1px solid #ffccc7;
  padding: 1rem;
  border-radius: 6px;
  margin: 2rem 0;
  font-size: 1.1rem;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 3rem auto;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
