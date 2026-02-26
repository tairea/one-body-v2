<template>
  <div class="chip-list" :class="{ 'dark-mode': isDarkMode }">
    <!-- Input row — hidden in focused mode -->
    <v-text-field
      v-if="focusedIdx === null || focusedIdx === undefined"
      v-model="newLabel"
      :label="title ? `Add a ${title.toLowerCase()}…` : 'Add…'"
      variant="outlined"
      density="compact"
      hide-details
      ref="inputRef"
      @keydown="handleKeydown"
      @blur="addChip"
    />

    <!-- Chip list -->
    <div class="chips">
      <template v-for="(chip, idx) in chips" :key="idx">
        <!-- Focused mode: show only the focused chip, clickable to navigate back -->
        <div
          v-if="focusedIdx === idx"
          class="chip chip--focused chip--clickable"
          :style="{ '--chip-color': color }"
          @click="emit('focus', idx)"
        >
          <span class="chip__label">{{ chip.label }}</span>
        </div>

        <!-- Normal mode -->
        <div
          v-else-if="focusedIdx === null || focusedIdx === undefined"
          class="chip chip--clickable"
          :style="{ '--chip-color': color }"
          @click="emit('focus', idx)"
        >
          <span class="chip__label">{{ chip.label }}</span>
          <div class="chip__actions">
            <button
              type="button"
              class="chip__btn chip__btn--drill"
              :title="`Expand ${chip.label}`"
              @click.stop="emit('focus', idx)"
            >
              <v-icon icon="mdi-dots-hexagon" size="16" />
            </button>
            <button
              type="button"
              class="chip__btn chip__btn--remove"
              :title="`Remove ${chip.label}`"
              @click.stop="removeChip(idx)"
            >
              <v-icon icon="mdi-close" size="14" />
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useAppStore } from "../stores/app";

const props = defineProps({
  /** @type {import('vue').PropType<Array<{label: string, children: any[]}>>} */
  chips: { type: Array, required: true },
  color: { type: String, required: true },
  title: { type: String, default: "" },
  description: { type: String, default: "" },
  focusedIdx: { type: Number, default: null },
});

const emit = defineEmits(["update", "focus"]);

const isDarkMode = computed(() => useAppStore().isDarkMode);
const newLabel = ref("");
const inputRef = ref(null);

function handleKeydown(event) {
  if (event.key === "Tab" || event.key === "Enter") {
    event.preventDefault();
    addChip();
  }
}

function addChip() {
  const trimmed = newLabel.value.trim();
  if (!trimmed) return;
  const already = props.chips.some((c) => c.label === trimmed);
  if (already) return;
  emit("update", [...props.chips, { label: trimmed, children: [] }]);
  newLabel.value = "";
}

function removeChip(idx) {
  const updated = [...props.chips];
  updated.splice(idx, 1);
  emit("update", updated);
}

/** Expose focus so parent can programmatically focus the input */
function focusInput() {
  inputRef.value?.focus?.();
}
defineExpose({ focusInput });
</script>

<style lang="scss" scoped>
.chip-list {
  display: flex;
  flex-direction: column;
  gap: 6px;

  /* Ensure v-text-field outline is visible in light mode */
  &:not(.dark-mode) :deep(.v-field),
  &:not(.dark-mode) :deep(.v-field__outline),
  &:not(.dark-mode) :deep(.v-field__outline__start),
  &:not(.dark-mode) :deep(.v-field__outline__notch),
  &:not(.dark-mode) :deep(.v-field__outline__end) {
    color: #000;
    --v-field-border-opacity: 0.38;
  }

  &:not(.dark-mode) :deep(.v-field:hover) .v-field__outline,
  &:not(.dark-mode) :deep(.v-field:hover) .v-field__outline__start,
  &:not(.dark-mode) :deep(.v-field:hover) .v-field__outline__notch,
  &:not(.dark-mode) :deep(.v-field:hover) .v-field__outline__end {
    --v-field-border-opacity: 0.87;
  }
}

.chips {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 6px;
}

.chip {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  box-sizing: border-box;
  padding: 7px 8px 7px 12px;
  border-radius: 8px;
  background: var(--chip-color, #e3f2fd);
  color: #000;
  font-size: 13px;
  font-weight: 500;

  &--clickable {
    cursor: pointer;
  }

  .dark-mode & {
    color: #fff;
    filter: brightness(0.75);
  }

  &--focused {
    opacity: 0.85;

    &.chip--clickable {
      cursor: pointer;
    }
  }
}

.chip__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chip__actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  margin-left: auto;
}

.chip__btn {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  color: inherit;
  opacity: 0.6;
  transition: opacity 0.15s, background-color 0.15s;
  padding: 0;

  &:hover {
    opacity: 1;
    background-color: rgba(0, 0, 0, 0.12);

    .dark-mode & {
      background-color: rgba(255, 255, 255, 0.12);
    }
  }
}
</style>
