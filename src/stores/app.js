import { defineStore } from "pinia";

export const useAppStore = defineStore("app", {
  state: () => ({
    // Dark mode state
    isDarkMode: false,

    // Component state
    activeComponent: 'globe', // 'globe', 'cytoscape', or null

    // Cytoscape state
    cytoscapeData: null,
    cytoscapeInitialized: false,
    cytoscapeInstance: null,

    // Other app-wide state can be added here
    // isLoading: false,
    // currentView: 'members', // or 'ai'
    // userPreferences: {},
    // etc.
  }),
  actions: {
    // Dark mode actions
    checkSystemPreference() {
      this.isDarkMode = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
    },
    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode;
    },
    setDarkMode(dark) {
      this.isDarkMode = dark;
    },
    listenToSystemPreference() {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", (e) => {
        this.isDarkMode = e.matches;
      });
    },
    initializeDarkMode() {
      this.checkSystemPreference();
      this.listenToSystemPreference();
    },

    // Component switching actions
    showGlobe() {
      this.activeComponent = 'globe';
    },
    showCytoscape() {
      this.activeComponent = 'cytoscape';
    },
    hideComponents() {
      this.activeComponent = null;
    },

    // Cytoscape actions
    setCytoscapeData(data) {
      this.cytoscapeData = data;
    },
    setCytoscapeInitialized(initialized) {
      this.cytoscapeInitialized = initialized;
    },
    setCytoscapeInstance(instance) {
      this.cytoscapeInstance = instance;
    },

    // Other app actions can be added here
    // setLoading(loading) {
    //   this.isLoading = loading
    // },
    // setCurrentView(view) {
    //   this.currentView = view
    // },
  },
});
