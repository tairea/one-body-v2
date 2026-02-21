<script setup>
// @ts-check
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../lib/supabase.js";
import { useAppStore } from "../stores/app.js";
import { getGeocodedLocation } from "../lib/getGeocodedLocation.js";
import StringListStep from "../components/StringListStep.vue";
import VehiclesStep from "../components/VehiclesStep.vue";

const router = useRouter();
const store = useAppStore();

const name = ref("");
const locationInput = ref("");
const locationName = ref("");
const locationLatitude = ref(/** @type {number | null} */ (null));
const locationLongitude = ref(/** @type {number | null} */ (null));
const values = ref(/** @type {string[]} */ ([]));
const visions = ref(/** @type {string[]} */ ([]));
const vehicles = ref(/** @type {{ title: string; description?: string }[]} */ ([]));
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
    values.value = [...store.myPerson.values];
    visions.value = [...store.myPerson.visions];
    vehicles.value = [...store.myPerson.vehicles];
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
        values_list: values.value,
        visions_list: visions.value,
        vehicles_list: vehicles.value,
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
            <div class="field-group">
              <label class="field-label">Full Name <span class="required">*</span></label>
              <input
                v-model="name"
                type="text"
                class="field-input"
                placeholder="Your full name"
                autocomplete="name"
              />
            </div>
            <div class="field-group">
              <label class="field-label">Location</label>
              <input
                v-model="locationInput"
                type="text"
                class="field-input"
                placeholder="City, Country"
                @blur="geocodeLocation"
                autocomplete="off"
              />
              <span class="field-hint">e.g. Berlin, Germany</span>
            </div>
          </div>
        </div>
      </section>

      <div class="section-divider" />

      <!-- ── Values / Visions / Vehicles ──────────────────────── -->
      <section class="section columns-section">
        <div class="columns-grid">
          <div class="column">
            <StringListStep
              :strings="values"
              title="Values"
              description="The principles that guide how you move through the world."
              instruction="Add a value, press Enter"
              @update="values = $event"
            />
          </div>
          <div class="column-divider" />
          <div class="column">
            <StringListStep
              :strings="visions"
              title="Visions"
              description="The futures you want to help bring into being."
              instruction="Add a vision, press Enter"
              @update="visions = $event"
            />
          </div>
          <div class="column-divider" />
          <div class="column">
            <VehiclesStep v-model:vehicles="vehicles" />
          </div>
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
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=Figtree:wght@300;400;500;600&display=swap');

// ── Tokens ──────────────────────────────────────────────────────
.profile-page {
  --bg:        #F7F6F3;
  --surface:   #FFFFFF;
  --border:    #E2DDD6;
  --text-primary: #1C1B18;
  --text-secondary: #6B6760;
  --text-muted: #A8A49E;
  --accent:    #2C4A1E;
  --accent-hover: #1E3314;
  --error-bg:  #FEF2F2;
  --error-text: #B91C1C;

  &.dark {
    --bg:        #111110;
    --surface:   #1A1A18;
    --border:    #2A2A27;
    --text-primary: #F0EDE8;
    --text-secondary: #9A9690;
    --text-muted: #5A5752;
    --accent:    #7CB87A;
    --accent-hover: #96CC94;
    --error-bg:  #2D1515;
    --error-text: #FCA5A5;
  }
}

// ── Base ─────────────────────────────────────────────────────────
.profile-page {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text-primary);
  font-family: 'Figtree', sans-serif;
  font-weight: 400;
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
  font-family: 'Figtree', sans-serif;
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
  font-family: 'Cormorant Garamond', Georgia, serif;
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
  gap: 24px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.required {
  color: var(--accent);
}

.field-input {
  width: 100%;
  padding: 11px 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-primary);
  font-family: 'Figtree', sans-serif;
  font-size: 1rem;
  font-weight: 400;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;

  &::placeholder {
    color: var(--text-muted);
  }

  &:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent);
  }
}

.field-hint {
  font-size: 0.78rem;
  color: var(--text-muted);
}

// ── Columns (Values / Visions / Vehicles) ─────────────────────────
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
    font-family: 'Figtree', sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--text-secondary);
    margin-bottom: 16px;
  }

  // Style the internal input to match our field-input
  :deep(.strings-input) {
    font-family: 'Figtree', sans-serif;
    font-size: 0.9375rem;
    padding: 10px 13px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-primary);
    transition: border-color 0.15s, box-shadow 0.15s;

    &:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent);
    }

    .dark & {
      background: var(--surface);
      border-color: var(--border);
      color: var(--text-primary);
    }
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
  color: #fff;
  border: none;
  border-radius: 8px;
  font-family: 'Figtree', sans-serif;
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

  &.dark & {
    color: #111;
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
