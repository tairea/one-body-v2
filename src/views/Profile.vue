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

    // Geocode if the user typed a location that hasn't been geocoded yet
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
  <v-app>
    <v-main class="pa-6">
      <v-container max-width="900">

        <v-row align="center" class="mb-4">
          <v-col>
            <h2 class="text-h5">
              {{ isEditing ? "Edit Profile" : "Create Your Profile" }}
            </h2>
          </v-col>
          <v-col cols="auto">
            <v-btn v-if="isEditing" variant="text" @click="router.push('/home')">
              Back
            </v-btn>
          </v-col>
        </v-row>

        <v-alert v-if="error" type="error" class="mb-4" density="compact">
          {{ error }}
        </v-alert>

        <!-- Photo, Name, Location -->
        <v-row class="mb-4">
          <v-col cols="12">
            <div class="d-flex align-center mb-4">
              <v-avatar size="80" class="mr-4">
                <v-img v-if="photoPreviewUrl" :src="photoPreviewUrl" cover />
                <v-icon v-else size="48">mdi-account-circle</v-icon>
              </v-avatar>
              <v-btn variant="outlined" tag="label">
                {{ photoPreviewUrl ? "Change Photo" : "Upload Photo" }}
                <input type="file" accept="image/*" class="d-none" @change="onPhotoChange" />
              </v-btn>
            </div>

            <v-text-field
              v-model="name"
              label="Full Name"
              variant="outlined"
              class="mb-3"
              required
            />

            <v-text-field
              v-model="locationInput"
              label="Location (city, country)"
              variant="outlined"
              hint="e.g. Berlin, Germany"
              persistent-hint
              @blur="geocodeLocation"
            />
          </v-col>
        </v-row>

        <!-- Values, Visions, Vehicles -->
        <!--
          StringListStep emits "update" (not "update:modelValue"), so v-model does not work.
          Bind with :strings and @update.

          VehiclesStep emits "update:vehicles" with prop name "vehicles",
          so use v-model:vehicles syntax.
        -->
        <v-row class="mb-4">
          <v-col cols="12" md="4">
            <div class="text-subtitle-1 font-weight-bold mb-2">Values</div>
            <StringListStep
              :strings="values"
              title="Values"
              description="What principles guide you?"
              instruction="Type a value and press Enter"
              @update="values = $event"
            />
          </v-col>
          <v-col cols="12" md="4">
            <div class="text-subtitle-1 font-weight-bold mb-2">Visions</div>
            <StringListStep
              :strings="visions"
              title="Visions"
              description="What futures do you want to create?"
              instruction="Type a vision and press Enter"
              @update="visions = $event"
            />
          </v-col>
          <v-col cols="12" md="4">
            <div class="text-subtitle-1 font-weight-bold mb-2">Vehicles</div>
            <VehiclesStep v-model:vehicles="vehicles" />
          </v-col>
        </v-row>

        <!-- Save -->
        <v-row>
          <v-col>
            <v-btn
              color="primary"
              size="large"
              :loading="saving"
              @click="save"
            >
              {{ isEditing ? "Update Profile" : "Save Profile" }}
            </v-btn>
          </v-col>
        </v-row>

      </v-container>
    </v-main>
  </v-app>
</template>
