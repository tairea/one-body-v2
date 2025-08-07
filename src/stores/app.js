// @ts-check
import { defineStore } from "pinia";

export const useAppStore = defineStore("app", {
  state: () => ({
    // Dark mode state
    isDarkMode: false,

    // Component state
    /** @type {null | "globe" | "cytoscape"} */
    activeComponent: "cytoscape",

    // Profile view state
    isViewingProfile: false,
    currentPersonData: null, // Store the clicked person's data
    /** @type {null | "values" | "vision" | "vehicles"} */
    activeProfileSection: null,

    // Cytoscape state
    cytoscapeData: null,
    cytoscapeInitialized: false,
    cytoscapeInstance: null,
    cytoscapeSvg: null, // Store SVG reference for cleanup
    /** @type {null | (() => unknown)} */
    concentricZoomOut: null,

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
      this.activeComponent = "globe";
      this.isViewingProfile = false; // Reset profile view when switching components
      this.currentPersonData = null; // Clear person data when switching components
    },
    showCytoscape() {
      this.activeComponent = "cytoscape";
      this.isViewingProfile = false; // Reset profile view when switching components
      this.currentPersonData = null; // Clear person data when switching components
    },
    hideComponents() {
      this.activeComponent = null;
      this.isViewingProfile = false; // Reset profile view when hiding components
      this.currentPersonData = null; // Clear person data when hiding components
    },

    // Profile view actions
    setViewingProfile(viewing) {
      this.isViewingProfile = viewing;
    },
    setCurrentPersonData(personData) {
      this.currentPersonData = personData;
    },
    clearCurrentPersonData() {
      this.currentPersonData = null;
    },
    setActiveProfileSection(section) {
      this.activeProfileSection = section;
    },
    clearActiveProfileSection() {
      this.activeProfileSection = null;
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
    setCytoscapeSvg(svg) {
      this.cytoscapeSvg = svg;
    },
    setConcentricZoomOut(zoomOutFunction) {
      this.concentricZoomOut = zoomOutFunction;
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
