// @ts-check
import { defineStore } from "pinia";
import { supabase } from "../lib/supabase.js";
import { rowToPerson, rowToRecommendation } from "../lib/mappers.js";
/** @import { Person, Recommendation } from "../types.d.ts" */

/** @type {string} */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const useAppStore = defineStore("app", {
  state: () => ({
    // ── Auth ─────────────────────────────────────────────────────────────────
    /** @type {import("@supabase/supabase-js").User | null} */
    authUser: null,
    authLoading: true,

    // ── My profile ───────────────────────────────────────────────────────────
    /** @type {Person | null} */
    myPerson: null,

    // ── Graph data ───────────────────────────────────────────────────────────
    /** @type {null | Readonly<Person[]>} */
    people: null,
    /** @type {null | Readonly<Recommendation[]>} */
    recommendations: null,

    // ── UI state (unchanged from v2) ─────────────────────────────────────────
    isEdgeView: false,
    isDarkMode: false,
    isFullscreen: false,
    /** @type {null | "globe" | "cytoscape" | "airecommendations"} */
    activeComponent: "cytoscape",
    isViewingProfile: false,
    currentPersonData: null,
    /** @type {null | "values" | "visions" | "vehicles"} */
    activeProfileSection: null,
    cytoscapeData: null,
    cytoscapeInitialized: false,
    cytoscapeInstance: null,
    cytoscapeSvg: null,
    /** @type {null | (() => unknown)} */
    concentricZoomOut: null,
    showNodeLabels: false,
  }),

  actions: {
    // ── Auth ─────────────────────────────────────────────────────────────────

    async initAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      this.authUser = session?.user ?? null;
      this.authLoading = false;

      supabase.auth.onAuthStateChange((_event, session) => {
        this.authUser = session?.user ?? null;
      });
    },

    async signOut() {
      await supabase.auth.signOut();
      this.authUser = null;
      this.myPerson = null;
    },

    // ── Data fetching ─────────────────────────────────────────────────────────

    async fetchGraph() {
      const supabaseUrl = SUPABASE_URL;
      const [{ data: peopleRows, error: peopleErr }, { data: recRows, error: recErr }] =
        await Promise.all([
          supabase.from("people").select("*"),
          supabase.from("recommendations").select("*"),
        ]);
      if (peopleErr) throw peopleErr;
      if (recErr) throw recErr;
      this.people = (peopleRows ?? []).map((r) => rowToPerson(r, supabaseUrl));
      this.recommendations = (recRows ?? []).map(rowToRecommendation);
    },

    async fetchMyPerson() {
      if (!this.authUser) return;
      const supabaseUrl = SUPABASE_URL;
      const { data, error } = await supabase
        .from("people")
        .select("*")
        .eq("user_id", this.authUser.id)
        .maybeSingle();
      if (error) throw error;
      this.myPerson = data ? rowToPerson(data, supabaseUrl) : null;
    },

    // ── Realtime ──────────────────────────────────────────────────────────────

    subscribeToPersonUpdates() {
      const supabaseUrl = SUPABASE_URL;
      supabase
        .channel("people-positions")
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "people" },
          (payload) => {
            const updated = rowToPerson(/** @type {any} */ (payload.new), supabaseUrl);
            if (this.people) {
              this.people = this.people.map((p) =>
                p.id === updated.id ? updated : p
              );
            }
          }
        )
        .subscribe();
    },

    unsubscribeFromPersonUpdates() {
      supabase.removeChannel(supabase.channel("people-positions"));
    },

    // ── Graph snapshot ────────────────────────────────────────────────────────

    async saveGraphSnapshot(graphData) {
      if (!this.myPerson || !this.authUser) return;
      const { error } = await supabase
        .from("people")
        .update({ persons_graph_snapshot: graphData })
        .eq("user_id", this.authUser.id);
      if (error) throw error;
      this.myPerson = { ...this.myPerson, personsGraphSnapshot: graphData };
    },

    // ── UI actions (preserved from v2) ────────────────────────────────────────

    setGraph(people, recommendations) {
      this.people = people;
      this.recommendations = recommendations;
    },
    checkSystemPreference() {
      this.isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    },
    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode;
    },
    setDarkMode(dark) {
      this.isDarkMode = dark;
    },
    listenToSystemPreference() {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener(
        "change",
        (e) => {
          this.isDarkMode = e.matches;
        }
      );
    },
    initializeDarkMode() {
      this.checkSystemPreference();
      this.listenToSystemPreference();
    },
    enterFullscreen() {
      this.isFullscreen = true;
    },
    exitFullscreen() {
      this.isFullscreen = false;
    },
    showGlobe() {
      this.activeComponent = "globe";
      this.isViewingProfile = false;
      this.currentPersonData = null;
    },
    showCytoscape() {
      this.activeComponent = "cytoscape";
      this.isViewingProfile = false;
      this.currentPersonData = null;
    },
    showAiRecommendations() {
      this.activeComponent = "airecommendations";
      this.isViewingProfile = false;
      this.currentPersonData = null;
    },
    setEdgeView(v) {
      this.isEdgeView = v;
    },
    hideComponents() {
      this.activeComponent = null;
      this.isViewingProfile = false;
      this.currentPersonData = null;
    },
    setViewingProfile(v) {
      this.isViewingProfile = v;
    },
    setCurrentPersonData(d) {
      this.currentPersonData = d;
    },
    clearCurrentPersonData() {
      this.currentPersonData = null;
    },
    setActiveProfileSection(s) {
      this.activeProfileSection = s;
    },
    clearActiveProfileSection() {
      this.activeProfileSection = null;
    },
    setCytoscapeData(d) {
      this.cytoscapeData = d;
    },
    setCytoscapeInitialized(v) {
      this.cytoscapeInitialized = v;
    },
    setCytoscapeInstance(v) {
      this.cytoscapeInstance = v;
    },
    setCytoscapeSvg(v) {
      this.cytoscapeSvg = v;
    },
    setConcentricZoomOut(fn) {
      this.concentricZoomOut = fn;
    },
    toggleNodeLabels() {
      this.showNodeLabels = !this.showNodeLabels;
    },
  },
});
