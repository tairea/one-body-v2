<script setup>
import { onMounted, ref, defineExpose } from 'vue'
import cytoscape from 'cytoscape'
import { select, selectAll } from "d3-selection"
import cytoscapeCola from "cytoscape-cola"
import cytoscapeQtip from "cytoscape-qtip"
import { people } from "../assets/people"
import { recommendations } from "../assets/recommendations"

// Register Cytoscape extensions
cytoscape.use(cytoscapeCola)
cytoscape.use(cytoscapeQtip)

const containerRef = ref(null)
const cy = ref(null)
const edges = ref([])

// Graph configuration
const graphConfig = {
  style: [
    {
      selector: "node",
      style: {
        "background-image": "data(photo)",
        label: "data(label)",
        "background-fit": "cover",
        "text-valign": "bottom",
        "text-halign": "center",
        width: 30,
        height: 30,
        "font-size": "7px",
        "font-family": "'Montserrat', sans-serif",
      },
    },
    {
      selector: "edge",
      style: {
        "line-color": "#ccc",
        "curve-style": "bezier",
        "font-size": "2px",
        "text-wrap": "wrap",
        "text-margin-y": -10,
        "text-max-width": 40,
        width: 1,
      },
    },
  ],
  layout: {
    name: "cola",
    animate: true,
    padding: 120,
  },
}

// Initialize graph data
const initializeGraphData = () => {
  const nodes = people.map((person) => ({
    data: {
      id: person.person.name,
      label: person.person.name,
      photo: `src/assets/profile-photos/${person.person.photo}`,
    },
  }))

  edges.value = recommendations.matches.map((match, index) => ({
    data: {
      id: `edge${index}`,
      source: match.person1,
      target: match.person2,
      ranking: match.ranking,
      reason: match.reason,
      potential: match.potential,
    },
  }))

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

  // Apply cola layout
  cy.value.layout({
    name: 'cola',
    animate: true,
    fit: true,
    padding: 120,
    duration: 1000
  }).run()
}

// Expose the methods to parent components
defineExpose({
  showAiView,
  showMembersView
})

onMounted(() => {
  const { nodes } = initializeGraphData()
  
  cy.value = cytoscape({
    container: containerRef.value,
    elements: {
      nodes,
      edges: [], // Members view starts with no edges
    },
    ...graphConfig
  })
})
</script>

<template>
  <div class="network-graph">
    <div id="cy-container">
      <div id="cy"></div>
      <svg class="overlay"></svg>
    </div>
  </div>
</template>

<style scoped>
.network-graph, #cy-container {
  width: 100vw;
  height: 100vh;
  border: none;
  z-index: 0;
  overflow: hidden;
  margin: 0;
  padding: 0;
}
</style> 