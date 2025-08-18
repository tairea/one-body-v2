// @ts-check
import { defineStore } from "pinia";
/** @import { Person } from "../types.d.ts" */

export const useAppStore = defineStore("app", {
  state: () => ({
    // Global state
    /**
     * All people, or null if loading.
     * @type {null | Readonly<Person[]>}
     */
    people: null,
    person: null,

    // Dark mode state
    isDarkMode: false,

    // Fullscreen state
    isFullscreen: false,

    // Component state
    /** @type {null | "globe" | "cytoscape" | "airecommendations"} */
    activeComponent: "cytoscape",

    // Profile view state
    isViewingProfile: false,
    currentPersonData: null, // Store the clicked person's data
    /** @type {null | "values" | "visions" | "vehicles"} */
    activeProfileSection: null,

    // Cytoscape state
    cytoscapeData: null,
    cytoscapeInitialized: false,
    cytoscapeInstance: null,
    cytoscapeSvg: null, // Store SVG reference for cleanup
    /** @type {null | (() => unknown)} */
    concentricZoomOut: null,

    // Node label visibility state
    showNodeLabels: false,

    // AddPersonDialog state
    isAddPersonDialogOpen: false,
    editingPerson: null, // Store the person being edited

    // Other app-wide state can be added here
    // isLoading: false,
    // currentView: 'members', // or 'ai'
    // userPreferences: {},
    // etc.
  }),
  actions: {
    /**
     * @param {ReadonlyArray<Person>} people
     * @returns {void}
     */
    setPeople(people) {
      this.people = people;
    },

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

    // Fullscreen actions
    enterFullscreen() {
      this.isFullscreen = true;
    },
    exitFullscreen() {
      this.isFullscreen = false;
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
    showAiRecommendations() {
      this.activeComponent = "airecommendations";
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
    /**
     * @param {"values" | "visions" | "vehicles"} section
     * @returns {void}
     */
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

    // Node label visibility actions
    toggleNodeLabels() {
      this.showNodeLabels = !this.showNodeLabels;
    },

    // AddPersonDialog actions
    showAddPersonDialog() {
      this.isAddPersonDialogOpen = true;
    },
    hideAddPersonDialog() {
      this.isAddPersonDialogOpen = false;
      this.editingPerson = null;
    },
    setEditingPerson(person) {
      this.editingPerson = person;
    },
    clearEditingPerson() {
      this.editingPerson = null;
    },

    // Other app actions can be added here
    // setLoading(loading) {
    //   this.isLoading = loading
    // },
    // setCurrentView(view) {
    //   this.isCurrentView = view
    // },

    /**
     * Add a new person to the store or update existing one
     * @param {Person} personData
     * @returns {void}
     */
    addPerson(personData) {
      if (this.people === null) {
        this.people = [personData];
      } else {
        // Check if person already exists
        const existingIndex = this.people.findIndex(
          (p) => p.id === personData.id,
        );
        if (existingIndex !== -1) {
          // Update existing person by creating new array
          this.people = [
            ...this.people.slice(0, existingIndex),
            personData,
            ...this.people.slice(existingIndex + 1),
          ];
        } else {
          // Add new person
          this.people = [...this.people, personData];
        }
      }

      // Always set as current person for immediate access
      this.person = personData;

      // Save to localStorage for persistence
      this.savePersonToStorage(personData);
    },

    /**
     * Update the current person's data
     * @param {Person} personData
     * @returns {void}
     */
    updateCurrentPerson(personData) {
      // Update the current person
      this.person = personData;

      // Also update in people array if it exists
      if (this.people !== null) {
        const existingIndex = this.people.findIndex(
          (p) => p.id === personData.id,
        );
        if (existingIndex !== -1) {
          // Update existing person by creating new array
          this.people = [
            ...this.people.slice(0, existingIndex),
            personData,
            ...this.people.slice(existingIndex + 1),
          ];
        }
      }

      // Save to localStorage for persistence
      this.savePersonToStorage(personData);
    },

    /**
     * Save person data to localStorage
     * @param {Person} personData
     * @returns {void}
     */
    savePersonToStorage(personData) {
      try {
        localStorage.setItem("currentPerson", JSON.stringify(personData));
      } catch (error) {
        console.warn("Failed to save person to localStorage:", error);
      }
    },

    /**
     * Load person data from localStorage
     * @returns {Person | null}
     */
    loadPersonFromStorage() {
      try {
        const stored = localStorage.getItem("currentPerson");
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (error) {
        console.warn("Failed to load person from localStorage:", error);
      }
      return null;
    },

    /**
     * Initialize the store with persisted data
     * @returns {void}
     */
    initializeFromStorage() {
      const storedPerson = this.loadPersonFromStorage();
      if (storedPerson) {
        this.person = storedPerson;
        // Also add to people array if it's not already there
        if (this.people === null) {
          this.people = [storedPerson];
        } else if (!this.people.find((p) => p.id === storedPerson.id)) {
          this.people = [...this.people, storedPerson];
        }
      }
    },

    /**
     * Save the current graph snapshot to the person
     * @param {Object} graphData - The cytoscape graph data
     * @returns {Promise<void>}
     */
    async saveGraphSnapshot(graphData) {
      if (this.person) {
        const updatedPerson = {
          ...this.person,
          personsGraphSnapshot: graphData,
        };
        this.updateCurrentPerson(updatedPerson);

        // Also save to database if we have the person's ID and secretKey
        if (this.person.id) {
          try {
            await this.savePersonToDatabase(updatedPerson);
          } catch (error) {
            console.warn("Failed to save graph snapshot to database:", error);
          }
        }
      }
    },

    /**
     * Save person data to the database
     * @param {Person} personData
     * @returns {Promise<void>}
     */
    async savePersonToDatabase(personData) {
      if (!personData.id) {
        throw new Error("Cannot save to database: missing ID");
      }

      // Get secretKey from localStorage
      const personReference = JSON.parse(
        localStorage.getItem("personReference"),
      );
      if (!personReference || !personReference.secretKey) {
        throw new Error(
          "Cannot save to database: missing secretKey in localStorage",
        );
      }

      const updatePersonUrl = new URL("/api/person", window.location.href);
      const response = await fetch(updatePersonUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: personData.id,
          secretKey: personReference.secretKey,
          personData: {
            name: personData.name,
            email: personData.email,
            locationName: personData.locationName,
            locationLatitude: personData.locationLatitude,
            locationLongitude: personData.locationLongitude,
            values: personData.values,
            visions: personData.visions,
            vehicles: personData.vehicles,
            personsGraphSnapshot: personData.personsGraphSnapshot,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save person: ${response.status}`);
      }
    },
  },
});
