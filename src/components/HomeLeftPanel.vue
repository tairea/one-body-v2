<script setup>
// @ts-check
import { computed, defineEmits, defineProps, ref } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "../stores/app";
import { supabase } from "../lib/supabase.js";
import { getCountryFlag } from "../lib/countryToFlag.js";

const props = defineProps({
  clickedPersonName: {
    type: String,
    default: "",
  },
  clickedPersonEmail: {
    type: String,
    default: "",
  },
  clickedPersonTelegram: {
    type: String,
    default: "",
  },
  clickedPersonLocation: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["showMembersView", "zoomBack", "edgeViewBack"]);
const appStore = useAppStore();
const router = useRouter();

const communityName = import.meta.env.VITE_COMMUNITY_NAME || "One Body";
const communityTagline = import.meta.env.VITE_COMMUNITY_TAGLINE || "";
const communityLogoUrl = import.meta.env.VITE_COMMUNITY_LOGO_URL || "";

// Add state for zoom
const isZoomed = ref(false);
const currentPersonId = ref(null);

// Delete account
const deleteDialogOpen = ref(false);
const deleteInProgress = ref(false);
const deleteError = ref("");

const isOwnProfile = computed(() => {
  if (!appStore.myPerson || !currentPersonId.value) return false;
  const rawId = String(currentPersonId.value).replace(/^person-/, "");
  return appStore.myPerson.id === rawId;
});

// Watch for zoom state changes from parent
const handleZoomStateChange = (zoomState) => {
  isZoomed.value = zoomState.isZoomed;
  currentPersonId.value = zoomState.personId;
};

// Expose the handler for parent components
defineExpose({
  handleZoomStateChange,
});

const handleShowGlobe = () => {
  appStore.showGlobe();
};

const handleShowCytoscape = () => {
  appStore.showCytoscape();
};

const handleShowAiRecommendations = () => {
  appStore.showAiRecommendations();
};

const handleZoomBack = () => {
  emit("zoomBack");
};

const handleEdgeViewBack = () => {
  emit("edgeViewBack");
};

const openDeleteDialog = () => {
  deleteError.value = "";
  deleteDialogOpen.value = true;
};

const closeDeleteDialog = () => {
  if (!deleteInProgress.value) {
    deleteDialogOpen.value = false;
    deleteError.value = "";
  }
};

const handleSignOut = async () => {
  await appStore.signOut();
  router.push("/auth");
};

const confirmDeleteAccount = async () => {
  deleteInProgress.value = true;
  deleteError.value = "";
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      deleteError.value = "You must be logged in to delete your account.";
      return;
    }
    const { error } = await supabase.functions.invoke("delete-account", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (error) throw error;
    await appStore.signOut();
    router.push("/auth");
  } catch (err) {
    deleteError.value = err?.message || "Failed to delete account";
  } finally {
    deleteInProgress.value = false;
  }
};
</script>

<template>
  <div
    class="left-overlay"
    :class="{ 'dark-mode': appStore.isDarkMode }"
    v-bind="$attrs"
  >
    <!-- COMMUNITY LOGO & TITLE -->
    <div id="wg" v-if="!isZoomed && !appStore.isEdgeView">
      <img
        v-if="communityLogoUrl"
        id="logo"
        :src="communityLogoUrl"
        width="100"
        class="mb-4"
      />
      <h1>{{ communityName }}</h1>
      <h2 v-if="communityTagline">{{ communityTagline }}</h2>
    </div>

    <!-- ZOOMED VIEW - Show back button and person info -->
    <div v-if="isZoomed" class="zoomed-view">
      <div class="person-info">
        <h3>{{ clickedPersonName }}</h3>
        <p v-if="clickedPersonEmail" class="person-contact">
          <a :href="`mailto:${clickedPersonEmail}`">{{ clickedPersonEmail }}</a>
        </p>
        <p v-else class="person-contact muted">No email available</p>
        <p v-if="clickedPersonTelegram" class="person-contact">
          <a :href="`https://t.me/${clickedPersonTelegram.replace(/^@/, '')}`" target="_blank" rel="noopener noreferrer">@{{ clickedPersonTelegram }}</a>
        </p>
        <p v-if="clickedPersonLocation" class="person-location">
          {{ clickedPersonLocation }} <span v-if="getCountryFlag(clickedPersonLocation)" class="location-flag" :aria-hidden="true">{{ getCountryFlag(clickedPersonLocation) }}</span>
        </p>
        <div v-if="isOwnProfile" class="account-actions">
          <button type="button" class="account-link" @click="handleSignOut">
            Sign out
          </button>
          <button type="button" class="account-link account-link--danger" @click="openDeleteDialog">
            Delete my account
          </button>
        </div>
      </div>
      <div class="back-button" @click="handleZoomBack">
        <v-icon icon="mdi-arrow-left" size="20" />
        <span>Back</span>
      </div>
    </div>

    <!-- Delete account confirmation dialog -->
    <v-dialog
      v-model="deleteDialogOpen"
      max-width="400"
      persistent
      @click:outside="closeDeleteDialog"
    >
      <v-card>
        <v-card-title>Delete your account?</v-card-title>
        <v-card-text>
          <p>This will permanently remove your profile and all your data. You will be signed out and will need to create a new account to rejoin.</p>
          <p v-if="deleteError" class="delete-error">Error: {{ deleteError }}</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            :disabled="deleteInProgress"
            @click="closeDeleteDialog"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="deleteInProgress"
            :disabled="deleteInProgress"
            @click="confirmDeleteAccount"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- EDGE VIEW - Show back button for edge collaborations -->
    <div v-if="appStore.isEdgeView" class="edge-view">
      <div class="back-button" @click="handleEdgeViewBack">
        <v-icon icon="mdi-arrow-left" size="20" />
        <span>Back</span>
      </div>
    </div>

    <!-- BUTTONS - Only show when not zoomed and not in edge view -->
    <div v-if="!isZoomed && !appStore.isEdgeView">
      <div
        id="global-distribution"
        class="button"
        @click="handleShowGlobe"
        style="margin-top: 40px"
      >
        <v-icon icon="mdi-earth" size="20" />
        <p class="b1">Our Global Distribution</p>
      </div>

      <div id="members" class="button" @click="handleShowCytoscape">
        <v-icon icon="mdi-account-group-outline" size="20" />
        <p class="b1">{{ appStore.people?.length || "?" }} Members</p>
      </div>

      <v-tooltip text="Coming soon" location="right">
        <template v-slot:activator="{ props }">
          <div id="ai" class="button disabled" v-bind="props">
            <v-icon icon="mdi-robot-love-outline" size="20" />
            <p class="b1">AI suggested collabs</p>
          </div>
        </template>
      </v-tooltip>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.left-overlay {
  position: absolute; /* Always on the left */
  left: 0;
  top: 0;
  width: 300px;
  padding: 20px;
  background-color: transparent;
  /* background blur */
  backdrop-filter: blur(2px);
  z-index: 1000; /* Above cytoscape */
  overflow: hidden;
  box-sizing: border-box; /* Add this to include padding in width calculation */

  #wg {
    text-align: center;
    margin-bottom: 20px; /* Reduced from 30px to prevent overflow */

    #logo {
      display: block;
      margin: 0 auto 0 0;
      text-align: left;
    }
  }

  h1 {
    font-size: 1.5rem;
    margin-bottom: 10px;
    color: #333;
    text-align: left;
  }

  h2 {
    font-size: 0.8rem;
    color: #666;
    margin-bottom: 15px;
    font-weight: 400;
    text-align: left;
  }

  .button {
    display: flex;
    align-items: center;
    padding: 10px; /* Reduced from 12px */
    margin: 8px 0; /* Reduced from 10px */
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s;
    border: 1px solid rgba(0, 0, 0, 0.3);

    &:hover {
      background-color: #f5f5f5;
    }

    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background-color: #f5f5f5;

      &:hover {
        background-color: #f5f5f5;
      }
    }

    img {
      margin-right: 10px;
    }
  }

  .b1 {
    margin: 0;
    padding-left: 10px;
    font-size: 0.9rem;
    color: #333;
  }

  #flag {
    margin: 15px 0;
  }

  #logo {
    display: block;
    margin: 0 auto 0 0;
    text-align: left;
  }

  // Zoomed view styles
  .zoomed-view {
    text-align: center;
    margin-bottom: 20px;

    .back-button {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px;
      margin: 8px 0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid rgba(0, 0, 0, 0.3);
      background-color: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);

      &:hover {
        background-color: rgba(255, 255, 255, 0.2);
        transform: translateX(-2px);
      }

      span {
        margin-left: 8px;
        font-size: 0.9rem;
        color: #333;
        font-weight: 500;
      }
    }

    .person-info {
      margin-top: 20px;
      padding: 15px;
      border-radius: 8px;
      background-color: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(5px);

      h3 {
        font-size: 1.1rem;
        margin-bottom: 8px;
        color: #333;
        font-weight: 600;
      }

      p {
        font-size: 0.8rem;
        color: #666;
        margin: 0;
        line-height: 1.4;

        &.person-contact {
          margin-top: 4px;
        }

        &.person-location {
          margin-top: 4px;
        }

        &.muted {
          color: #999;
        }

        a {
          color: #2563eb;
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }
      }

      .location-flag {
        margin-right: 6px;
      }
    }

    .account-actions {
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      align-items: center;
      text-align: center;
    }

    .account-link {
      background: none;
      border: none;
      padding: 0;
      font-size: 0.8rem;
      color: #2563eb;
      text-decoration: none;
      cursor: pointer;
      font-family: inherit;

      &:hover {
        text-decoration: underline;
      }

      &--danger {
        color: #dc3545;
      }
    }
  }

  // Edge view styles
  .edge-view {
    text-align: center;
    margin-top: 20px;

    .back-button {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px;
      margin: 8px 0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid rgba(0, 0, 0, 0.3);
      background-color: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);

      &:hover {
        background-color: rgba(255, 255, 255, 0.2);
        transform: translateX(-2px);
      }

      span {
        margin-left: 8px;
        font-size: 0.9rem;
        color: #333;
        font-weight: 500;
      }
    }
  }

  // Dark mode styles
  &.dark-mode {
    h1 {
      color: rgba(255, 255, 255, 0.87);
    }

    h2 {
      color: rgba(255, 255, 255, 0.6);
    }

    .b1 {
      color: rgba(255, 255, 255, 0.87);
    }

    .button {
      border: 1px solid rgba(255, 255, 255, 0.3);
      background-color: rgba(255, 255, 255, 0.05);

      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }

      &.disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background-color: rgba(255, 255, 255, 0.03);

        &:hover {
          background-color: rgba(255, 255, 255, 0.03);
        }
      }

      .v-icon {
        color: rgba(255, 255, 255, 0.87) !important;
      }
    }

    .zoomed-view {
      .back-button {
        border: 1px solid rgba(255, 255, 255, 0.3);
        background-color: rgba(255, 255, 255, 0.05);

        &:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        span {
          color: rgba(255, 255, 255, 0.87);
        }

        .v-icon {
          color: rgba(255, 255, 255, 0.87) !important;
        }
      }

      .person-info {
        background-color: rgba(255, 255, 255, 0.05);

        h3 {
          color: rgba(255, 255, 255, 0.87);
        }

        p {
          color: rgba(255, 255, 255, 0.6);

          &.muted {
            color: rgba(255, 255, 255, 0.4);
          }

          a {
            color: #60a5fa;
          }
        }
      }

      .account-link {
        color: rgba(255, 255, 255, 0.87);

        &:hover {
          text-decoration: underline;
        }

        &--danger {
          color: #f87171;
        }
      }
    }

    .edge-view {
      .back-button {
        border: 1px solid rgba(255, 255, 255, 0.3);
        background-color: rgba(255, 255, 255, 0.05);

        &:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        span {
          color: rgba(255, 255, 255, 0.87);
        }

        .v-icon {
          color: rgba(255, 255, 255, 0.87) !important;
        }
      }
    }
  }
}

/* Top-level so it applies to dialog content teleported to body */
.delete-error {
  color: #dc3545;
  margin-top: 12px;
  font-size: 0.75rem;
}
</style>
