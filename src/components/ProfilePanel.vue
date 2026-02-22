<template>
  <Teleport to="body">
    <div
      class="profile-panel"
      :class="{ 'dark-mode': appStore.isDarkMode, open: props.open }"
      :style="{ height: panelHeight + 'vh' }"
    >
      <!-- Drag handle -->
      <div class="panel__handle" @mousedown="startDrag">
        <div class="panel__grip" />
      </div>

      <!-- Scrollable content -->
      <div class="panel__body">

        <!-- Identity row -->
        <div class="identity-row">
          <!-- Avatar -->
          <label class="avatar-wrap" title="Change photo">
            <input
              type="file"
              accept="image/*"
              class="avatar-input"
              @change="onPhotoChange"
            />
            <div class="avatar-ring">
              <img
                v-if="photoPreviewUrl"
                :src="photoPreviewUrl"
                class="avatar-img"
                alt="Profile photo"
              />
              <v-icon v-else icon="mdi-account-circle" size="40" class="avatar-placeholder-icon" />
              <div class="avatar-overlay">
                <v-icon icon="mdi-camera" size="16" />
              </div>
            </div>
          </label>

          <!-- Fields -->
          <div class="identity-fields">
            <v-text-field
              v-model="name"
              label="Name"
              variant="outlined"
              density="compact"
              hide-details
              class="field-name"
            />
            <v-text-field
              v-model="email"
              label="Email"
              variant="outlined"
              density="compact"
              hide-details
            />
            <v-text-field
              v-model="telegram"
              label="Telegram @handle"
              variant="outlined"
              density="compact"
              hide-details
            />
            <v-text-field
              v-model="locationInput"
              label="Location"
              variant="outlined"
              density="compact"
              hide-details
              placeholder="City, Country"
              @blur="geocodeLocation"
            />
          </div>

          <!-- Save button -->
          <div class="save-wrap">
            <v-btn
              :loading="saving"
              :disabled="saving"
              :color="appStore.isDarkMode ? 'white' : 'black'"
              size="small"
              variant="flat"
              @click="save"
            >
              Save
            </v-btn>
            <div v-if="errorMsg" class="save-error">{{ errorMsg }}</div>
          </div>
        </div>

        <!-- Columns -->
        <div class="columns">
          <template v-for="(col, colIdx) in columnDefs" :key="colIdx">
            <div class="col-divider" v-if="colIdx > 0" />
            <div class="col">
              <!-- Column header -->
              <div class="col__header" v-if="col.header">
                <span class="col__header-name">{{ col.header }}</span>
                <v-tooltip location="top" v-if="col.headerTooltip">
                  <template #activator="{ props: tp }">
                    <v-icon
                      v-bind="tp"
                      icon="mdi-information-outline"
                      size="14"
                      class="col__header-info"
                    />
                  </template>
                  {{ col.headerTooltip }}
                </v-tooltip>
              </div>

              <!-- Back button (for drill-down col0) -->
              <button
                v-if="col.showBack"
                class="col__back-btn"
                type="button"
                @click="goBack"
              >
                <v-icon icon="mdi-arrow-left" size="14" />
                Back
              </button>

              <!-- Layer chip list (null state or focused parent in drill-down) -->
              <StringListStep
                v-if="col.layerKey && col.focusedIdx === null"
                :chips="getLayerChips(col.layerKey)"
                :color="getLayerColor(col.layerKey)"
                :title="getLayerName(col.layerKey)"
                @update="setLayerChips(col.layerKey, $event)"
                @focus="onFocus(col.layerKey, $event)"
              />

              <!-- Single focused chip (ancestor shown in col0 or col1 of drill-down) -->
              <StringListStep
                v-else-if="col.layerKey && col.focusedIdx !== null && col.focusedIdx !== undefined"
                :chips="getLayerChips(col.layerKey)"
                :color="getLayerColor(col.layerKey)"
                :focusedIdx="col.focusedIdx"
                @update="setLayerChips(col.layerKey, $event)"
                @focus="() => {}"
              />

              <!-- Sub-chip input + list (for drill-down children column) -->
              <div v-else-if="col.chipPath" class="sub-col">
                <v-text-field
                  v-model="subChipInput"
                  label="Add sub-chip…"
                  variant="outlined"
                  density="compact"
                  hide-details
                  @keydown="handleSubChipKeydown"
                  @blur="addSubChip"
                />
                <div class="sub-chips">
                  <div
                    v-for="(child, ci) in getChipAtPath(col.chipPath)?.children ?? []"
                    :key="ci"
                    class="sub-chip"
                    :style="{ '--chip-color': getLayerColorLightened(col.chipLayerKey, 0.35) }"
                  >
                    <span class="sub-chip__label">{{ child.label }}</span>
                    <div class="sub-chip__actions">
                      <button
                        type="button"
                        class="sub-chip__drill"
                        @click="drillInto(col.chipPath, ci)"
                      >
                        <v-icon icon="mdi-dots-hexagon" size="14" />
                      </button>
                      <button
                        type="button"
                        class="sub-chip__remove"
                        @click="removeSubChip(col.chipPath, ci)"
                      >
                        <v-icon icon="mdi-close" size="12" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty placeholder -->
              <div v-else class="col--empty" />
            </div>
          </template>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { supabase } from "../lib/supabase.js";
import { useAppStore } from "../stores/app.js";
import { getGeocodedLocation } from "../lib/getGeocodedLocation.js";
import { useLayers, lightenColor } from "../lib/useLayers.js";
import StringListStep from "./StringListStep.vue";

const props = defineProps({
  open: { type: Boolean, required: true },
  cytoscapeRef: { type: Object, default: null },
});

const emit = defineEmits(["close"]);

const appStore = useAppStore();
const layers = useLayers();

// ── Panel resize ──────────────────────────────────────────────────────────────
const panelHeight = ref(40);
let dragState = null;

function startDrag(e) {
  dragState = {
    startY: e.clientY,
    startH: panelHeight.value,
  };
  window.addEventListener("mousemove", onDrag);
  window.addEventListener("mouseup", stopDrag);
  e.preventDefault();
}

function onDrag(e) {
  if (!dragState) return;
  const vh = window.innerHeight / 100;
  const dy = dragState.startY - e.clientY; // dragging up = larger panel
  panelHeight.value = Math.max(20, Math.min(90, dragState.startH + dy / vh));
}

function stopDrag() {
  dragState = null;
  window.removeEventListener("mousemove", onDrag);
  window.removeEventListener("mouseup", stopDrag);
}

onUnmounted(() => {
  window.removeEventListener("mousemove", onDrag);
  window.removeEventListener("mouseup", stopDrag);
});

// ── Form fields ───────────────────────────────────────────────────────────────
const name = ref("");
const email = ref("");
const telegram = ref("");
const locationInput = ref("");
const locationName = ref("");
const locationLatitude = ref(/** @type {number | null} */ (null));
const locationLongitude = ref(/** @type {number | null} */ (null));
const photoFile = ref(/** @type {File | null} */ (null));
const photoPreviewUrl = ref(/** @type {string | null} */ (null));
const saving = ref(false);
const errorMsg = ref("");

/** @type {import('vue').Ref<Array<{label: string, children: any[]}>>} */
const layer1 = ref([]);
/** @type {import('vue').Ref<Array<{label: string, children: any[]}>>} */
const layer2 = ref([]);
/** @type {import('vue').Ref<Array<{label: string, children: any[]}>>} */
const layer3 = ref([]);

const mimeTypes = /** @type {Record<string, string>} */ ({
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
});

// Prefill from store when panel opens
watch(
  () => props.open,
  (open) => {
    if (!open) return;
    const p = appStore.myPerson;
    if (!p) return;
    name.value = p.name;
    email.value = p.email ?? "";
    telegram.value = p.telegram ?? "";
    locationInput.value = p.locationName ?? "";
    locationName.value = p.locationName ?? "";
    locationLatitude.value = p.locationLatitude ?? null;
    locationLongitude.value = p.locationLongitude ?? null;
    layer1.value = p.layer1.map((c) => ({ ...c, children: [...(c.children ?? [])] }));
    layer2.value = p.layer2.map((c) => ({ ...c, children: [...(c.children ?? [])] }));
    layer3.value = p.layer3.map((c) => ({ ...c, children: [...(c.children ?? [])] }));
    photoPreviewUrl.value = p.photoUrl ?? null;
    // zoom to my person
    if (props.cytoscapeRef && p.id) {
      props.cytoscapeRef.zoomToPersonGraph?.(`person-${p.id}`);
    }
  },
  { immediate: true }
);

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
    const result = await getGeocodedLocation(locationInput.value);
    locationName.value = locationInput.value;
    if (result) {
      locationLatitude.value = result.locationLatitude ?? null;
      locationLongitude.value = result.locationLongitude ?? null;
    }
  } catch {
    locationName.value = locationInput.value;
  }
}

async function save() {
  if (!name.value.trim()) {
    errorMsg.value = "Name is required.";
    return;
  }
  saving.value = true;
  errorMsg.value = "";
  try {
    const userId = appStore.authUser?.id;
    if (!userId) throw new Error("Not authenticated");

    if (locationInput.value && locationInput.value !== locationName.value) {
      await geocodeLocation();
    }

    const { error: upsertError } = await supabase.from("people").upsert(
      {
        user_id: userId,
        name: name.value.trim(),
        email: email.value.trim() || null,
        telegram: telegram.value.trim() || null,
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
        .upload(`${userId}/avatar`, photoFile.value, { upsert: true, contentType });
      if (uploadError) throw uploadError;
    }

    await appStore.fetchMyPerson();
    await appStore.fetchGraph();
    emit("close");
  } catch (/** @type {any} */ err) {
    errorMsg.value = err?.message ?? "Something went wrong.";
  } finally {
    saving.value = false;
  }
}

// ── Layer helpers ─────────────────────────────────────────────────────────────

function getLayerChips(layerKey) {
  if (layerKey === "layer1") return layer1.value;
  if (layerKey === "layer2") return layer2.value;
  return layer3.value;
}

function setLayerChips(layerKey, chips) {
  if (layerKey === "layer1") layer1.value = chips;
  else if (layerKey === "layer2") layer2.value = chips;
  else layer3.value = chips;
}

function getLayerColor(layerKey) {
  return layers.find((l) => l.key === layerKey)?.color ?? "#999";
}

function getLayerName(layerKey) {
  return layers.find((l) => l.key === layerKey)?.name ?? layerKey;
}

function getLayerTooltip(layerKey) {
  return layers.find((l) => l.key === layerKey)?.description ?? "";
}

function getLayerColorLightened(layerKey, t) {
  const color = getLayerColor(layerKey);
  return lightenColor(color, t);
}

// ── Drill-down focus state ────────────────────────────────────────────────────
/**
 * focusState: null | { layerKey: string, path: number[] }
 * path contains indices into the chip tree, e.g. [2] means layer[2] (depth-0 chip at idx 2)
 * [2, 1] means layer[2].children[1]
 */
const focusState = ref(/** @type {null | { layerKey: string, path: number[] }} */ (null));
const subChipInput = ref("");

function onFocus(layerKey, idx) {
  focusState.value = { layerKey, path: [idx] };
}

function drillInto(parentPath, childIdx) {
  if (!focusState.value) return;
  focusState.value = { layerKey: focusState.value.layerKey, path: [...parentPath, childIdx] };
}

function goBack() {
  if (!focusState.value) return;
  if (focusState.value.path.length <= 1) {
    focusState.value = null;
  } else {
    focusState.value = {
      layerKey: focusState.value.layerKey,
      path: focusState.value.path.slice(0, -1),
    };
  }
}

/**
 * Navigate to a chip by path within its layer chips.
 * @param {string} layerKey
 * @param {number[]} path
 * @returns {{ label: string, children: any[] } | null}
 */
function getChipAtPath(path) {
  if (!focusState.value) return null;
  const { layerKey } = focusState.value;
  let chips = getLayerChips(layerKey);
  let chip = null;
  for (const idx of path) {
    chip = chips[idx];
    if (!chip) return null;
    chips = chip.children ?? [];
  }
  return chip;
}

/**
 * Set children of chip at path within its layer.
 * @param {number[]} path
 * @param {any[]} children
 */
function setChildrenAtPath(path, children) {
  if (!focusState.value) return;
  const { layerKey } = focusState.value;
  const chips = getLayerChips(layerKey);

  function update(arr, remainingPath) {
    const idx = remainingPath[0];
    if (remainingPath.length === 1) {
      const updated = [...arr];
      updated[idx] = { ...updated[idx], children };
      return updated;
    }
    const updated = [...arr];
    updated[idx] = {
      ...updated[idx],
      children: update(updated[idx].children ?? [], remainingPath.slice(1)),
    };
    return updated;
  }

  setLayerChips(layerKey, update(chips, path));
}

function handleSubChipKeydown(e) {
  if (e.key === "Tab" || e.key === "Enter") {
    e.preventDefault();
    addSubChip();
  }
}

function addSubChip() {
  if (!focusState.value) return;
  const trimmed = subChipInput.value.trim();
  if (!trimmed) return;
  const chip = getChipAtPath(focusState.value.path);
  if (!chip) return;
  const children = [...(chip.children ?? []), { label: trimmed, children: [] }];
  setChildrenAtPath(focusState.value.path, children);
  subChipInput.value = "";
}

function removeSubChip(path, childIdx) {
  if (!focusState.value) return;
  const chip = getChipAtPath(path);
  if (!chip) return;
  const children = [...(chip.children ?? [])];
  children.splice(childIdx, 1);
  setChildrenAtPath(path, children);
}

// ── Column definitions ────────────────────────────────────────────────────────
/**
 * Compute the 3 column definitions based on focusState.
 */
const columnDefs = computed(() => {
  const fs = focusState.value;

  if (!fs) {
    // Null state: one layer per column
    return layers.map((layer) => ({
      header: layer.name,
      headerTooltip: layer.description,
      layerKey: layer.key,
      focusedIdx: null,
      showBack: false,
      chipPath: null,
      chipLayerKey: null,
    }));
  }

  const { path } = fs;

  if (path.length === 1) {
    // col0 = focused chip alone (with back), col1 = sub-chip input+children, col2 = empty
    return [
      {
        header: getLayerName(fs.layerKey),
        headerTooltip: getLayerTooltip(fs.layerKey),
        layerKey: fs.layerKey,
        focusedIdx: path[0],
        showBack: true,
        chipPath: null,
        chipLayerKey: null,
      },
      {
        header: "Sub-chips",
        headerTooltip: null,
        layerKey: null,
        focusedIdx: null,
        showBack: false,
        chipPath: path,
        chipLayerKey: fs.layerKey,
      },
      {
        header: null,
        headerTooltip: null,
        layerKey: null,
        focusedIdx: null,
        showBack: false,
        chipPath: null,
        chipLayerKey: null,
      },
    ];
  }

  // path.length >= 2
  // col0 = path[-2] chip (back button), col1 = path[-1] chip alone, col2 = sub-chip input+children
  return [
    {
      header: getLayerName(fs.layerKey),
      headerTooltip: null,
      layerKey: fs.layerKey,
      focusedIdx: path[path.length - 2],
      showBack: true,
      chipPath: null,
      chipLayerKey: null,
    },
    {
      header: null,
      headerTooltip: null,
      layerKey: fs.layerKey,
      focusedIdx: path[path.length - 1],
      showBack: false,
      chipPath: null,
      chipLayerKey: null,
    },
    {
      header: "Sub-chips",
      headerTooltip: null,
      layerKey: null,
      focusedIdx: null,
      showBack: false,
      chipPath: path,
      chipLayerKey: fs.layerKey,
    },
  ];
});
</script>

<style lang="scss" scoped>
.profile-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100vw;
  z-index: 2000;
  transform: translateY(100%);
  transition: transform 0.35s ease;
  background: #fff;
  border-top: 1px solid #e0e0e0;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;

  &.open {
    transform: translateY(0);
  }

  &.dark-mode {
    background: #111;
    border-top-color: #2e2e2e;
    color: #fff;
  }
}

// ── Drag handle ───────────────────────────────────────────────────────────────
.panel__handle {
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ns-resize;
  flex-shrink: 0;

  &:hover .panel__grip {
    background: #999;
  }
}

.panel__grip {
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background: #ccc;
  transition: background 0.15s;

  .dark-mode & {
    background: #444;
  }
}

// ── Body ──────────────────────────────────────────────────────────────────────
.panel__body {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// ── Identity row ──────────────────────────────────────────────────────────────
.identity-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding-top: 8px;
}

.avatar-wrap {
  flex-shrink: 0;
  position: relative;
  width: 48px;
  height: 48px;
  cursor: pointer;
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
  border: 2px solid #e0e0e0;
  overflow: hidden;
  position: relative;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s;

  .dark-mode & {
    border-color: #2e2e2e;
    background: #1a1a1a;
  }

  .avatar-wrap:hover & {
    border-color: #666;
  }
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder-icon {
  color: #ccc;

  .dark-mode & {
    color: #444;
  }
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  opacity: 0;
  transition: opacity 0.15s;
  border-radius: 50%;
  pointer-events: none;

  .avatar-wrap:hover & {
    opacity: 1;
  }
}

.identity-fields {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 6px;
  min-width: 0;

  @media (max-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
}

.save-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.save-error {
  font-size: 11px;
  color: #b91c1c;
  max-width: 120px;
  text-align: right;
}

// ── Columns ───────────────────────────────────────────────────────────────────
.columns {
  display: grid;
  grid-template-columns: 1fr 1px 1fr 1px 1fr;
  gap: 0 16px;
  flex: 1;
  min-height: 0;
}

.col-divider {
  background: #e0e0e0;
  width: 1px;
  align-self: stretch;

  .dark-mode & {
    background: #2e2e2e;
  }
}

.col {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
}

.col--empty {
  flex: 1;
}

.col__header {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #666;
  margin-bottom: 2px;

  .dark-mode & {
    color: #999;
  }
}

.col__header-info {
  color: #aaa;
  cursor: help;
}

.col__back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  padding: 2px 0;
  transition: color 0.15s;

  &:hover {
    color: #000;

    .dark-mode & {
      color: #fff;
    }
  }

  .dark-mode & {
    color: #999;
  }
}

// ── Sub-chip list ─────────────────────────────────────────────────────────────
.sub-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sub-chips {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sub-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 6px 5px 10px;
  border-radius: 6px;
  background: var(--chip-color, #e3f2fd);
  font-size: 12px;
  font-weight: 500;
  color: #000;

  .dark-mode & {
    color: #fff;
    filter: brightness(0.7);
  }
}

.sub-chip__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sub-chip__actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.sub-chip__drill,
.sub-chip__remove {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  color: inherit;
  opacity: 0.6;
  padding: 0;
  transition: opacity 0.15s;

  &:hover {
    opacity: 1;
  }
}
</style>
