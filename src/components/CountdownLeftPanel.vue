<script setup>
// @ts-check
import { useRouter } from "vue-router";
import { useAppStore } from "../stores/app";
import VueCountdown from '@chenfengyuan/vue-countdown';

const router = useRouter();
const appStore = useAppStore();

// Target date: August 18th, 2025 at 11am GMT-10
const targetDate = new Date('2025-08-18T21:00:00.000Z');

const handleGoHome = () => {
  router.push({ name: 'Home' });
};

// Handle countdown end
const handleCountdownEnd = () => {
  console.log('Countdown finished!');
};
</script>

<template>
  <div class="left-overlay" :class="{ 'dark-mode': appStore.isDarkMode }" v-bind="$attrs">
    <!-- DWEB LOGO & TITLE -->
    <div id="wg">
      <img
        id="logo"
        src="../assets/org_logo_DWeb.jpeg"
        width="100"
        class="mb-4"
      />
      <h1>DWeb Fellows Alumni</h1>
      <h2>A collective of dWeb camp fellows</h2>
    </div>

    <!-- BUTTONS -->
    <v-tooltip
      text="Available on the 18th August 2025"
      location="right"
    >
      <template v-slot:activator="{ props }">
        <div
          id="global-distribution"
          class="button disabled"
          v-bind="props"
        >
          <v-icon icon="mdi-earth" size="20" />
          <p class="b1">Our Global Distribution</p>
        </div>
      </template>
    </v-tooltip>

    <v-tooltip
      text="Available on the 18th August 2025"
      location="right"
    >
      <template v-slot:activator="{ props }">
        <div
          id="members"
          class="button disabled"
          v-bind="props"
        >
          <v-icon icon="mdi-account-group-outline" size="20" />
          <p class="b1">Fellows</p>
        </div>
      </template>
    </v-tooltip>

    <v-tooltip
      text="Available on the 18th August 2025"
      location="right"
    >
      <template v-slot:activator="{ props }">
        <div
          id="ai-summary"
          class="button disabled"
          v-bind="props"
        >
          <v-icon icon="mdi-robot-love-outline" size="20" />
          <p class="b1">Ai Collective Overview</p>
        </div>
      </template>
    </v-tooltip>
    
    <v-tooltip
      text="Available on the 18th August 2025"
      location="right"
    >
      <template v-slot:activator="{ props }">
        <div
          id="ai"
          class="button disabled"
          v-bind="props"
        >
          <v-icon icon="mdi-robot-love-outline" size="20" />
          <p class="b1">Ai Suggested Collabs</p>
        </div>
      </template>
    </v-tooltip>

    <!-- COUNTDOWN TIMER -->
    <div class="countdown-section">
      <h3>Next Social Event</h3>
      <VueCountdown
        :time="targetDate.getTime() - Date.now()"
        :interval="1000"
        @end="handleCountdownEnd"
        v-slot="{ days, hours, minutes, seconds }"
      >
        <div class="countdown-display">
          <div class="countdown-item">
            <span class="countdown-number">{{ days }}</span>
            <span class="countdown-label">Days</span>
          </div>
          <div class="countdown-item">
            <span class="countdown-number">{{ hours }}</span>
            <span class="countdown-label">Hours</span>
          </div>
          <div class="countdown-item">
            <span class="countdown-number">{{ minutes }}</span>
            <span class="countdown-label">Minutes</span>
          </div>
          <div class="countdown-item">
            <span class="countdown-number">{{ seconds }}</span>
            <span class="countdown-label">Seconds</span>
          </div>
        </div>
      </VueCountdown>
      <p class="event-date">August 18, 2025 21:00 UTC</p>
    </div>

    <div class="event-description mt-4">
      <h2>
At the next DWeb Fellow Social, we'll be sharing this activity and planting the seed for how we can grow our DWeb Fellow alumni community—sparking new connections, strengthening collaboration, and uniting our skills to build a better, more open web for everyone.  
<br/><br/>
Make sure to join the Zoom call on August 18th using this link. 
<br/><br/>
In the meantime, add to your profile — every story we share helps weave the network and make our connections stronger.
<br/><br/>
Made with <v-icon icon="mdi-heart" size="20" /> by Ian & Evan
</h2>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.left-overlay {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 300px;
  padding: 20px;
  background-color: transparent;
  backdrop-filter: blur(2px);
  z-index: 1000;
  overflow: hidden;
  box-sizing: border-box;

  #wg {
    text-align: center;
    margin-bottom: 20px;

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
    padding: 10px;
    margin: 8px 0;
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

    .v-icon {
      margin-right: 10px;
      color: #333;
      transition: color 0.2s ease;
    }
  }

  .b1 {
    margin: 0;
    font-size: 0.9rem;
    color: #333;
  }

  .countdown-section {
    margin-top: 30px;
    text-align: center;

    h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 15px;
      text-align: center;
    }

    .countdown-display {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      margin-bottom: 15px;
      font-family: 'Courier New', 'Monaco', 'Menlo', monospace;

      .countdown-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;

        .countdown-number {
          font-size: 2.2rem;
          font-weight: 600;
          color: #333;
          line-height: 1;
          letter-spacing: 0.05em;
          font-variant-numeric: tabular-nums;
          min-width: 1.2em;
          text-align: center;
          font-family: 'Orbitron', 'Audiowide', 'Rajdhani', 'Exo 2', 'Chakra Petch', monospace;
        }

        .countdown-label {
          font-size: 0.6rem;
          color: #666;
          text-transform: uppercase;
          font-weight: 400;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
      }
    }

    .event-date {
      font-size: 0.8rem;
      color: #666;
      margin: 0;
      font-weight: 500;
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
        background-color: rgba(255, 255, 255, 0.05);

        &:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }
      }

      .v-icon {
        color: rgba(255, 255, 255, 0.87) !important;
      }
    }

    .countdown-section {
      h3 {
        color: rgba(255, 255, 255, 0.87);
      }

      .countdown-display {
        .countdown-item {
          .countdown-number {
            color: rgba(255, 255, 255, 0.87);
          }

          .countdown-label {
            color: rgba(255, 255, 255, 0.6);
          }
        }
      }

      .event-date {
        color: rgba(255, 255, 255, 0.6);
      }
    }
  }
}
</style>
