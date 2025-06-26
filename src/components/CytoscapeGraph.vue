<script setup>
import { onMounted, ref, defineExpose, nextTick, watch } from 'vue'
import cytoscape from 'cytoscape'
import { select, selectAll } from "d3-selection"
import cytoscapeCola from "cytoscape-cola"
import cytoscapeQtip from "cytoscape-qtip"
import { SERVER_BASE_URL } from "../constants.js"
import { useAppStore } from '../stores/app'

// Register Cytoscape extensions
try {
  cytoscape.use(cytoscapeCola)
  cytoscape.use(cytoscapeQtip)
} catch (error) {
  console.warn('Some Cytoscape extensions failed to load:', error)
}

const containerRef = ref(null)
const cy = ref(null)
const edges = ref([])

// Get dark mode state
const appStore = useAppStore()

// Light mode styles
const lightModeStyles = [
  {
    selector: "node",
    style: {
      label: "data(label)",
      "text-valign": "bottom",
      "text-halign": "center",
      "text-outline-color": "#ffffff",
      "text-outline-width": "2px",
      "text-outline-opacity": "0.8",
      "color": "#333333",
      width: 25,
      height: 25,
      "font-size": "7px",
      "font-family": "'Montserrat', sans-serif",
      "background-image": "data(photo)",
      "background-width": "100%",
      "background-height": "100%",
      "background-fit": "cover",
      "border-width": 0,
    },
  },
  {
    selector: "edge",
    style: {
      "line-color": "#cccccc",
      "curve-style": "bezier",
      "font-size": "2px",
      "text-wrap": "wrap",
      "text-margin-y": -10,
      "text-max-width": 40,
      "color": "#666666",
      width: 1,
    },
  },
  {
    selector: "core",
    style: {
      "background-color": "#ffffff"
    }
  }
]

// Dark mode styles
const darkModeStyles = [
  {
    selector: "node",
    style: {
      label: "data(label)",
      "text-valign": "bottom",
      "text-halign": "center",
      "text-outline-color": "#242424",
      "text-outline-width": "2px",
      "text-outline-opacity": "0.8",
      "color": "#ffffff",
      width: 25,
      height: 25,
      "font-size": "7px",
      "font-family": "'Montserrat', sans-serif",
      "background-image": "data(photo)",
      "background-width": "100%",
      "background-height": "100%",
      "background-fit": "cover",
      "border-width": 0,
    },
  },
  {
    selector: "edge",
    style: {
      "line-color": "#666666",
      "curve-style": "bezier",
      "font-size": "2px",
      "text-wrap": "wrap",
      "text-margin-y": -10,
      "text-max-width": 40,
      "color": "#cccccc",
      width: 1,
    },
  },
  {
    selector: "core",
    style: {
      "background-color": "#242424"
    }
  }
]

// Graph configuration
const graphConfig = {
  style: lightModeStyles, // Default to light mode
  layout: {
    name: 'cola',
      animate: true,
      fit: true,
      padding: 120,
      duration: 1000
  },
}

// Function to update graph styles based on dark mode
const updateGraphStyles = () => {
  if (!cy.value) return
  
  const newStyles = appStore.isDarkMode ? darkModeStyles : lightModeStyles
  cy.value.style(newStyles)
  
  // Update CSS custom properties for background colors
  const backgroundColor = appStore.isDarkMode ? '#242424' : '#ffffff'
  const root = document.documentElement
  root.style.setProperty('--graph-background-color', backgroundColor)
}

// Watch for dark mode changes
watch(() => appStore.isDarkMode, () => {
  updateGraphStyles()
})

const fetchGraphData = async () => {
  const graphUrl = new URL("/graph", SERVER_BASE_URL)
  const response = await fetch(graphUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch graph with status ${response.status}`)
  }
  return await response.json()
}

// Initialize graph data
const initializeGraphData = async () => {
  const { people, recommendations } = await fetchGraphData();

  if (!people || !Array.isArray(people)) {
    console.error('People data is not available or not an array')
    return { nodes: [], edges: [] }
  }

  const nodes = people.map(({ person }) => ({
    data: {
      id: person.name,
      label: person.name,
      photo: new URL(person.photo, SERVER_BASE_URL),
    },
  }))

  if (!recommendations || !recommendations.matches || !Array.isArray(recommendations.matches)) {
    console.error('Recommendations data is not available or not an array')
    edges.value = []
  } else {
    edges.value = recommendations.matches
      .filter(match => match && match.person1 && match.person2)
      .map((match, index) => ({
        data: {
          id: `edge${index}`,
          source: match.person1,
          target: match.person2,
          ranking: match.ranking,
          reason: match.reason,
          potential: match.potential,
        },
      }))
  }

  return { nodes, edges: edges.value }
}

const showAiView = () => {
  if (!cy.value) return

  // Add edges with matches data
  cy.value.add(edges.value)

  // Apply circle layout
  cy.value.layout({
    name: "circle",
    animate: true,
    fit: true,
    padding: 70,
    duration: 1000,
  }).run()
}

const showMembersView = () => {
  if (!cy.value) return

  // Remove all edges
  cy.value.elements('edge').remove()

  // Apply layout with fallback
  try {
    cy.value.layout({
      name: 'cola',
      animate: true,
      fit: true,
      padding: 120,
      duration: 1000
    }).run()
  } catch (error) {
    console.warn('Cola layout not available, using random layout:', error)
    cy.value.layout({
      name: 'random',
      animate: true,
      fit: true,
      padding: 120,
      duration: 1000
    }).run()
  }
}

// Expose the methods to parent components
defineExpose({
  showAiView,
  showMembersView
})

onMounted(async () => {
  // Wait for next tick to ensure DOM is fully rendered
  await nextTick()
  console.log('Container ref:', containerRef.value)
  console.log('Container dimensions:', containerRef.value?.offsetWidth, containerRef.value?.offsetHeight)

  // Initialize CSS custom property for background color
  const root = document.documentElement
  const initialBackgroundColor = appStore.isDarkMode ? '#242424' : '#ffffff'
  root.style.setProperty('--graph-background-color', initialBackgroundColor)

  // Ensure the container ref is available
  if (!containerRef.value) {
    console.error('Container ref is not available')
    return
  }

  try {
    const { nodes } = await initializeGraphData()
    console.log('Initialized nodes:', nodes.length)

    // Set initial styles based on current dark mode state
    graphConfig.style = appStore.isDarkMode ? darkModeStyles : lightModeStyles

    cy.value = cytoscape({
      container: containerRef.value,
      elements: {
        nodes,
        edges: [], // Members view starts with no edges
      },
      ...graphConfig
    })

    // Set initial background colors for all containers
    updateGraphStyles()

    console.log('Cytoscape initialized successfully')
    console.log('Graph elements:', cy.value.elements().length)
  } catch (error) {
    console.error('Error initializing Cytoscape graph:', error)
  }
})
</script>

<template>
  <div class="network-graph" :class="{ 'dark-mode': appStore.isDarkMode }">
    <div id="cy-container">
      <div ref="containerRef" id="cy"></div>
      <svg class="overlay"></svg>
    </div>
  </div>
</template>

<style scoped>
.network-graph {
  width: 100vw;
  height: 100vh;
  border: none;
  z-index: 0;
  overflow: hidden;
  margin: 0;
  padding: 0;
  background-color: var(--graph-background-color);
  transition: background-color 0.3s ease;
}

#cy-container {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: var(--graph-background-color);
  transition: background-color 0.3s ease;
}

#cy {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  background-color: var(--graph-background-color);
  transition: background-color 0.3s ease;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

/* Dark mode styles - these will be overridden by CSS custom properties */
.network-graph.dark-mode {
  background-color: var(--graph-background-color);
}

.network-graph.dark-mode #cy-container {
  background-color: var(--graph-background-color);
}

.network-graph.dark-mode #cy {
  background-color: var(--graph-background-color);
}
</style>

<style>
:root {
  --graph-background-color: #ffffff;
}
</style>