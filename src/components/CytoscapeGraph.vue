<script setup>
import { onMounted, ref, defineExpose, nextTick } from 'vue'
import cytoscape from 'cytoscape'
import { select, selectAll } from "d3-selection"
import cytoscapeCola from "cytoscape-cola"
import cytoscapeQtip from "cytoscape-qtip"
import { people } from "../assets/people"
import { recommendations } from "../assets/recommendations"

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

// Graph configuration
const graphConfig = {
  style: [
    {
      selector: "node",
      style: {
        label: "data(label)",
        "text-valign": "bottom",
        "text-halign": "center",
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
    name: 'cola',
      animate: true,
      fit: true,
      padding: 120,
      duration: 1000
  },
}

// Initialize graph data
const initializeGraphData = async () => {
  if (!people || !Array.isArray(people)) {
    console.error('People data is not available or not an array')
    return { nodes: [], edges: [] }
  }

  const nodes = await Promise.all(
    people
      .filter(person => person && person.person && person.person.name && person.person.photo)
      .map(async (person) => {
        try {
          const photoUrl = new URL(`../assets/profile-photos/${person.person.photo}`, import.meta.url).href
          return {
            data: {
              id: person.person.name,
              label: person.person.name,
              photo: photoUrl,
            },
          }
        } catch (error) {
          console.warn(`Could not load photo for ${person.person.name}:`, error)
          return {
            data: {
              id: person.person.name,
              label: person.person.name,
              photo: '', // Fallback to no image
            },
          }
        }
      })
  )

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
  
  // Ensure the container ref is available
  if (!containerRef.value) {
    console.error('Container ref is not available')
    return
  }

  try {
    const { nodes } = await initializeGraphData()
    console.log('Initialized nodes:', nodes.length)
    
    cy.value = cytoscape({
      container: containerRef.value,
      elements: {
        nodes,
        edges: [], // Members view starts with no edges
      },
      ...graphConfig
    })
    
    console.log('Cytoscape initialized successfully')
    console.log('Graph elements:', cy.value.elements().length)
  } catch (error) {
    console.error('Error initializing Cytoscape graph:', error)
  }
})
</script>

<template>
  <div class="network-graph">
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
}

#cy-container {
  width: 100%;
  height: 100%;
  position: relative;
}

#cy {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
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
</style> 