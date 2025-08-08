<template>
  <div class="step-content" :class="{ 'dark-mode': isDarkMode }">
    <h3 class="mb-2">Your Visions</h3>
    <p class="step-description mb-0">
      What visions are you working on? or want to achieve?<br />
      This might include your interests, passions, goals, purpose.
    </p>
    <p class="step-description mt-2">
      <em
        ><small class="form-hint"
          >Note: Everyones values, visions and vehicles will be processed by our
          local (offline) LLM to help reveal shared similarities, connections
          and opportunities amongst the fellows.</small
        ></em
      >
    </p>

    <!-- Add Vision Component -->
    <AddVision
      ref="addVision"
      @vision-added="addVision"
      @vision-updated="updateVision"
      :edit-mode="editMode"
      :edit-vision="editingVision"
    />

    <!-- Display Added Visions -->
    <div v-if="visions.length > 0" class="visions-container">
      <div class="vision-cards">
        <VisionCard
          v-for="(vision, index) in visions"
          :key="index"
          :vision="vision"
          @edit="editVision"
          @remove="removeVision(index)"
          class="vision-card"
        />
      </div>
    </div>
  </div>
</template>

<script>
// @ts-check
import { useAppStore } from "../stores/app";
import AddVision from "./AddVision.vue";
import VisionCard from "./VisionCard.vue";

export default {
  name: "VisionsStep",
  components: {
    AddVision,
    VisionCard,
  },
  props: {
    visions: {
      type: Array,
      required: true,
    },
  },
  emits: ["update:visions"],
  data() {
    return {
      editMode: false,
      editingVision: null,
    };
  },
  computed: {
    isDarkMode() {
      return useAppStore().isDarkMode;
    },
  },
  methods: {
    addVision(vision) {
      const updatedVisions = [...this.visions, vision];
      this.$emit("update:visions", updatedVisions);
    },
    editVision(vision) {
      this.editingVision = vision;
      this.editMode = true;
      // Find the AddVision component and call its openEditDialog method
      this.$nextTick(() => {
        /** @type {undefined | AddVision} */
        const addVisionComponent = /** @type {any} */ (this.$refs.addVision);
        if (addVisionComponent) {
          addVisionComponent.openEditDialog(vision);
        }
      });
    },
    updateVision(updatedVision) {
      const index = this.visions.findIndex((v) => v === this.editingVision);
      if (index !== -1) {
        const updatedVisions = [...this.visions];
        updatedVisions[index] = updatedVision;
        this.$emit("update:visions", updatedVisions);
      }
      this.editMode = false;
      this.editingVision = null;
    },
    removeVision(index) {
      const updatedVisions = [...this.visions];
      updatedVisions.splice(index, 1);
      this.$emit("update:visions", updatedVisions);
    },
  },
};
</script>

<style lang="scss" scoped>
// Step content
.step-content {
  padding: 20px 0;

  h3 {
    margin: 0 0 16px 0;
    font-size: 1.25rem;
    color: #333;

    .dark-mode & {
      color: rgba(255, 255, 255, 0.87);
    }
  }
}

.step-description {
  margin-bottom: 16px;
  color: #666;
  line-height: 1.5;

  .dark-mode & {
    color: rgba(255, 255, 255, 0.6);
  }
}

.form-hint {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  color: #666;

  .dark-mode & {
    color: rgba(255, 255, 255, 0.5);
  }
}

// Vision card styles
.visions-container {
  margin-top: 20px;

  .vision-card {
    width: 100%;
  }
}
</style>
