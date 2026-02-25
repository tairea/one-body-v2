<script setup>
// @ts-check
import { ref } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../lib/supabase.js";
import { useAppStore } from "../stores/app.js";

const router = useRouter();
const store = useAppStore();

const communityName = import.meta.env.VITE_COMMUNITY_NAME || "One Body";
const communityTagline = import.meta.env.VITE_COMMUNITY_TAGLINE || "";
const communityLogoUrl = import.meta.env.VITE_COMMUNITY_LOGO_URL || "";

/** @type {import("vue").Ref<"signin" | "signup" | "magic">} */
const mode = ref("signin");
const email = ref("");
const password = ref("");
const loading = ref(false);
const message = ref("");
const error = ref("");

async function handleSignIn() {
  loading.value = true;
  error.value = "";
  const { error: err } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  });
  loading.value = false;
  if (err) {
    error.value = err.message;
  } else {
    router.push("/");
  }
}

async function handleSignUp() {
  loading.value = true;
  error.value = "";
  const { error: err } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
    options: { emailRedirectTo: window.location.origin },
  });
  loading.value = false;
  if (err) {
    error.value = err.message;
  } else {
    message.value = "Check your email to confirm your account, then sign in.";
    mode.value = "signin";
  }
}

async function handleMagicLink() {
  loading.value = true;
  error.value = "";
  const { error: err } = await supabase.auth.signInWithOtp({
    email: email.value,
    options: { emailRedirectTo: window.location.origin },
  });
  loading.value = false;
  if (err) {
    error.value = err.message;
  } else {
    message.value = "Magic link sent! Check your email.";
  }
}

function submit() {
  if (mode.value === "signin") handleSignIn();
  else if (mode.value === "signup") handleSignUp();
  else handleMagicLink();
}
</script>

<template>
  <v-btn
    icon
    variant="text"
    style="position: fixed; top: 12px; right: 12px; z-index: 100;"
    @click="store.toggleDarkMode()"
  >
    <v-icon>{{ store.isDarkMode ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
  </v-btn>

  <v-main class="d-flex align-center justify-center" style="min-height: 100vh">
    <v-card width="420" class="pa-6 text-center">

      <!-- Community logo -->
      <div v-if="communityLogoUrl" class="mb-4">
        <v-img
          :src="communityLogoUrl"
          max-height="80"
          contain
        />
      </div>

      <!-- Community name + tagline -->
      <v-card-title class="text-h5 justify-center">
        {{ communityName }}
      </v-card-title>
      <v-card-subtitle v-if="communityTagline" class="mb-6">
        {{ communityTagline }}
      </v-card-subtitle>

      <div class="d-flex justify-center mb-6">
        <v-btn-toggle v-model="mode" mandatory divided :color="store.isDarkMode ? 'white' : 'black'">
          <v-btn value="signin" size="small">Sign In</v-btn>
          <v-btn value="signup" size="small">Sign Up</v-btn>
          <v-btn value="magic" size="small">Magic Link</v-btn>
        </v-btn-toggle>
      </div>

      <v-alert v-if="error" type="error" class="mb-4" density="compact">
        {{ error }}
      </v-alert>
      <v-alert v-if="message" type="success" class="mb-4" density="compact">
        {{ message }}
      </v-alert>

      <v-form @submit.prevent="submit">
        <v-text-field
          v-model="email"
          label="Email"
          type="email"
          required
          variant="outlined"
          class="mb-3"
        />

        <v-text-field
          v-if="mode !== 'magic'"
          v-model="password"
          label="Password"
          type="password"
          required
          variant="outlined"
          class="mb-4"
        />

        <v-btn
          type="submit"
          :color="store.isDarkMode ? 'white' : 'black'"
          variant="flat"
          block
          :loading="loading"
        >
          {{ mode === "signin" ? "Sign In" : mode === "signup" ? "Sign Up" : "Send Magic Link" }}
        </v-btn>
      </v-form>
    </v-card>
  </v-main>
</template>
