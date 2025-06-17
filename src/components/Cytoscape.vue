<script setup>
import { onMounted, ref } from 'vue'
import cytoscape from 'cytoscape'

const containerRef = ref(null)

onMounted(() => {
  cytoscape({
    container: containerRef.value,
    elements: [
      // nodes
      { data: { id: 'a' } },
      { data: { id: 'b' } },
      { data: { id: 'c' } },
      { data: { id: 'd' } },
      { data: { id: 'e' } },
      // edges
      { data: { source: 'a', target: 'b' } },
      { data: { source: 'b', target: 'c' } },
      { data: { source: 'c', target: 'd' } },
      { data: { source: 'd', target: 'e' } },
      { data: { source: 'e', target: 'a' } }
    ],
    style: [
      {
        selector: 'node',
        style: {
          'background-color': '#666',
          'label': 'data(id)',
          'color': 'white',
          'text-valign': 'center',
          'text-halign': 'center',
          'font-size': '16px',
          'width': 40,
          'height': 40
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 2,
          'line-color': '#999',
          'target-arrow-color': '#999',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier'
        }
      }
    ],
    layout: {
      name: 'circle',
      padding: 20
    }
  })
})
</script>

<template>
  <div ref="containerRef" class="cytoscape-container"></div>
</template>

<style scoped>
.cytoscape-container {
  width: 100vw;
  height: 100vh;
  border: none;
  z-index: 0;
  overflow: hidden;
  margin: 0;
  padding: 0;
}
</style> 