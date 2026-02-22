<script setup>
// @ts-check
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../lib/supabase.js";
import { useAppStore } from "../stores/app.js";
import { getGeocodedLocation } from "../lib/getGeocodedLocation.js";
import StringListStep from "../components/StringListStep.vue";
import { useLayers } from "../lib/useLayers.js";

const router = useRouter();
const store = useAppStore();
const layers = useLayers();

const name = ref("");
const locationInput = ref("");
const locationName = ref("");
const locationLatitude = ref(/** @type {number | null} */ (null));
const locationLongitude = ref(/** @type {number | null} */ (null));
const layer1 = ref(/** @type {string[]} */ ([]));
const layer2 = ref(/** @type {string[]} */ ([]));
const layer3 = ref(/** @type {string[]} */ ([]));
const photoFile = ref(/** @type {File | null} */ (null));
const photoPreviewUrl = ref(/** @type {string | null} */ (null));
const saving = ref(false);
const error = ref("");

const isEditing = computed(() => !!store.myPerson);

const mimeTypes = /** @type {Record<string, string>} */ ({
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
});

onMounted(async () => {
  if (store.myPerson) {
    name.value = store.myPerson.name;
    locationInput.value = store.myPerson.locationName ?? "";
    locationName.value = store.myPerson.locationName ?? "";
    locationLatitude.value = store.myPerson.locationLatitude ?? null;
    locationLongitude.value = store.myPerson.locationLongitude ?? null;
    layer1.value = [...store.myPerson.layer1];
    layer2.value = [...store.myPerson.layer2];
    layer3.value = [...store.myPerson.layer3];
    photoPreviewUrl.value = store.myPerson.photoUrl ?? null;
  }
});

/** @param {Event} event */
function onPhotoChange(event) {
  const target = /** @type {HTMLInputElement} */ (event.target);
  const file = target.files?.[0];
  if (!file) return;
  photoFile.value = file;
  photoPreviewUrl.value = URL.createObjectURL(file);
}

async function geocodeLocation() {
  if (!locationInput.value) return;
  try {
    const opencageApiKey = import.meta.env.VITE_OPENCAGE_API_KEY ?? "";
    const result = await getGeocodedLocation(locationInput.value, opencageApiKey);
    if (result) {
      locationName.value = locationInput.value;
      locationLatitude.value = result.locationLatitude ?? null;
      locationLongitude.value = result.locationLongitude ?? null;
    } else {
      locationName.value = locationInput.value;
    }
  } catch {
    locationName.value = locationInput.value;
  }
}

async function save() {
  if (!name.value.trim()) {
    error.value = "Name is required.";
    return;
  }

  saving.value = true;
  error.value = "";

  try {
    const userId = store.authUser?.id;
    if (!userId) throw new Error("Not authenticated");

    if (locationInput.value && locationInput.value !== locationName.value) {
      await geocodeLocation();
    }

    const { error: upsertError } = await supabase.from("people").upsert(
      {
        user_id: userId,
        name: name.value.trim(),
        location_name: locationName.value || null,
        location_latitude: locationLatitude.value,
        location_longitude: locationLongitude.value,
        layer1_list: layer1.value,
        layer2_list: layer2.value,
        layer3_list: layer3.value,
      },
      { onConflict: "user_id" }
    );
    if (upsertError) throw upsertError;

    if (photoFile.value) {
      const ext = photoFile.value.name.split(".").pop() ?? "";
      const contentType = mimeTypes[ext.toLowerCase()] ?? "image/jpeg";
      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(`${userId}/avatar`, photoFile.value, {
          upsert: true,
          contentType,
        });
      if (uploadError) throw uploadError;
    }

    await store.fetchMyPerson();
    router.push("/home");
  } catch (/** @type {any} */ err) {
    error.value = err?.message ?? "Something went wrong.";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="profile-page" :class="{ dark: store.isDarkMode }">

    <!-- Dark mode toggle -->
    <v-btn
      icon
      variant="text"
      style="position: fixed; top: 12px; right: 12px; z-index: 100;"
      @click="store.toggleDarkMode()"
    >
      <v-icon>{{ store.isDarkMode ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
    </v-btn>

    <!-- Top bar -->
    <header class="profile-header">
      <button v-if="isEditing" class="back-link" @click="router.push('/home')">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Back
      </button>
      <span v-else class="back-link-spacer" />
      <h1 class="page-title">{{ isEditing ? "Edit Profile" : "Create Your Profile" }}</h1>
      <span class="header-end" />
    </header>

    <main class="profile-body">

      <!-- Error -->
      <div v-if="error" class="error-banner">{{ error }}</div>

      <!-- ── Identity ──────────────────────────────────────────── -->
      <section class="section identity-section">
        <div class="identity-grid">

          <!-- Avatar upload -->
          <label class="avatar-wrap" :title="photoPreviewUrl ? 'Change photo' : 'Upload photo'">
            <input type="file" accept="image/*" class="avatar-input" @change="onPhotoChange" />
            <div class="avatar-ring">
              <img v-if="photoPreviewUrl" :src="photoPreviewUrl" class="avatar-img" alt="Profile photo" />
              <div v-else class="avatar-placeholder">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="avatar-overlay">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>{{ photoPreviewUrl ? 'Change' : 'Upload' }}</span>
              </div>
            </div>
          </label>

          <!-- Name + Location -->
          <div class="identity-fields">
            <v-text-field
              v-model="name"
              label="Full Name"
              variant="outlined"
              required
              autocomplete="name"
              hide-details
            />
            <v-text-field
              v-model="locationInput"
              label="Location"
              variant="outlined"
              placeholder="City, Country"
              hint="e.g. Berlin, Germany"
              persistent-hint
              autocomplete="off"
              @blur="geocodeLocation"
            />
          </div>
        </div>
      </section>

      <div class="section-divider" />

      <!-- ── Community Layers ──────────────────────────────────── -->
      <section class="section columns-section">
        <div class="columns-grid">
          <template v-for="(layer, i) in layers" :key="layer.key">
            <div class="column-divider" v-if="i > 0" />
            <div class="column">
              <StringListStep
                :strings="i === 0 ? layer1 : i === 1 ? layer2 : layer3"
                :title="layer.name"
                :description="layer.description"
                :instruction="`Add a ${layer.name.toLowerCase()}, press Enter`"
                :color="layer.color"
                @update="i === 0 ? (layer1 = $event) : i === 1 ? (layer2 = $event) : (layer3 = $event)"
              />
            </div>
          </template>
        </div>
      </section>

      <div class="section-divider" />

      <!-- ── Save ─────────────────────────────────────────────── -->
      <section class="section save-section">
        <button class="save-btn" :class="{ loading: saving }" :disabled="saving" @click="save">
          <span v-if="!saving">{{ isEditing ? "Update Profile" : "Save Profile" }}</span>
          <span v-else class="saving-dots">
            <span /><span /><span />
          </span>
        </button>
      </section>

    </main>
  </div>
</template>

<style lang="scss" scoped>
// ── Tokens ──────────────────────────────────────────────────────
.profile-page {
  --bg:           #ffffff;
  --surface:      #ffffff;
  --border:       #e0e0e0;
  --text-primary: #000000;
  --text-secondary: #555555;
  --text-muted:   #999999;
  --accent:       #000000;
  --accent-text:  #ffffff;
  --accent-hover: #222222;
  --error-bg:     #fff0f0;
  --error-text:   #b91c1c;

  &.dark {
    --bg:           #111111;
    --surface:      #1a1a1a;
    --border:       #2e2e2e;
    --text-primary: #ffffff;
    --text-secondary: #aaaaaa;
    --text-muted:   #666666;
    --accent:       #ffffff;
    --accent-text:  #000000;
    --accent-hover: #cccccc;
    --error-bg:     #2d1515;
    --error-text:   #fca5a5;
  }
}

// ── Base ─────────────────────────────────────────────────────────
.profile-page {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text-primary);
  transition: background 0.2s, color 0.2s;
}

// ── Header ───────────────────────────────────────────────────────
.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 48px;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background: var(--bg);
  z-index: 10;

  @media (max-width: 640px) {
    padding: 16px 24px;
  }
}

.back-link {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  transition: color 0.15s;
  letter-spacing: 0.01em;

  &:hover {
    color: var(--text-primary);
  }
}

.back-link-spacer,
.header-end {
  width: 80px;  // keep title centered
}

.page-title {
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.01em;
}

// ── Body ──────────────────────────────────────────────────────────
.profile-body {
  max-width: 920px;
  margin: 0 auto;
  padding: 0 48px 80px;

  @media (max-width: 640px) {
    padding: 0 24px 60px;
  }
}

// ── Error ─────────────────────────────────────────────────────────
.error-banner {
  margin: 24px 0 0;
  padding: 12px 16px;
  background: var(--error-bg);
  color: var(--error-text);
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
}

// ── Sections ──────────────────────────────────────────────────────
.section {
  padding: 40px 0;
}

.section-divider {
  height: 1px;
  background: var(--border);
}

// ── Identity ──────────────────────────────────────────────────────
.identity-grid {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 40px;
  align-items: start;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

// Avatar
.avatar-wrap {
  display: block;
  cursor: pointer;
  position: relative;
  width: 100px;
  height: 100px;

  @media (max-width: 600px) {
    width: 80px;
    height: 80px;
  }
}

.avatar-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
  z-index: 2;
}

.avatar-ring {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid var(--border);
  overflow: hidden;
  position: relative;
  background: var(--surface);
  transition: border-color 0.2s;

  .avatar-wrap:hover & {
    border-color: var(--accent);
  }
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #fff;
  opacity: 0;
  transition: opacity 0.2s;
  border-radius: 50%;
  pointer-events: none;

  span {
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .avatar-wrap:hover & {
    opacity: 1;
  }
}

// Fields
.identity-fields {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

// ── Columns (Community Layers) ────────────────────────────────────
.columns-grid {
  display: grid;
  grid-template-columns: 1fr 1px 1fr 1px 1fr;
  gap: 0 32px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0;
  }
}

.column {
  // Let the sub-components breathe; suppress their internal top padding
  :deep(.step-content) {
    padding-top: 0;
  }

  // Suppress the sub-component h3 heading since columns-section provides its own visual rhythm
  // (sub-components are already stripped of our external redundant labels)
  :deep(h3) {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--text-secondary);
    margin-bottom: 16px;
  }

  // Tighten sub-component description text
  :deep(.step-description) {
    font-size: 0.825rem;
    color: var(--text-secondary);
    margin-bottom: 14px;
    line-height: 1.5;
  }

  // Hide the verbose AI note
  :deep(.step-description:has(.form-hint)) {
    display: none;
  }

  :deep(.form-hint) {
    display: none;
  }

  :deep(.edit-hint) {
    font-size: 0.72rem;
    color: var(--text-muted);
  }
}

.column-divider {
  background: var(--border);
  width: 1px;
  align-self: stretch;

  @media (max-width: 768px) {
    width: 100%;
    height: 1px;
    margin: 32px 0;
  }
}

// ── Save ──────────────────────────────────────────────────────────
.save-section {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
}

.save-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 160px;
  height: 44px;
  padding: 0 32px;
  background: var(--accent);
  color: var(--accent-text);
  border: none;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;

  &:hover:not(:disabled) {
    background: var(--accent-hover);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
}

// Saving dots animation
.saving-dots {
  display: flex;
  gap: 5px;
  align-items: center;

  span {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: currentColor;
    animation: pulse-dot 1.2s ease-in-out infinite;

    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
}

@keyframes pulse-dot {
  0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
  40%           { opacity: 1;   transform: scale(1); }
}
</style>
