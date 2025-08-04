<script setup>
import { onMounted, ref, defineExpose, nextTick, watch, onUnmounted } from "vue";
import cytoscape from "cytoscape";
import { select, selectAll } from "d3-selection";
import cytoscapeCola from "cytoscape-cola";
import cytoscapeQtip from "cytoscape-qtip";
import { SERVER_BASE_URL } from "../constants.js";
import { useAppStore } from "../stores/app";
import { useNodeClick } from "../assets/useNodeClick.js";
import { people } from "../server/hard-coded/people.js";

// Register Cytoscape extensions
try {
  cytoscape.use(cytoscapeCola);
  cytoscape.use(cytoscapeQtip);
} catch (error) {
  console.warn("Some Cytoscape extensions failed to load:", error);
}

const containerRef = ref(null);
const svgRef = ref(null);
const cy = ref(null);
const edges = ref([]);
const peopleData = ref([]);
const localPeople = people; // Use local people data

// Get dark mode state
const appStore = useAppStore();

// Node click functionality - will be initialized after cy is created
let nodeClickHandler = null;
let nodeClickCleanup = null;

// Debounce mechanism for theme updates
let themeUpdateTimeout = null;

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
      color: "#333333",
      width: 40,
      height: 40,
      "font-size": "7px",
      "font-family": "Montserrat, sans-serif",
      "border-width": 0,
      "background-color": "transparent",
    },
  },
  {
    selector: "node[hasPhoto]",
    style: {
      "background-image": "data(photo)",
      "background-width": "100%",
      "background-height": "100%",
      "background-fit": "cover",
      "background-color": "transparent",
      "border-color": "transparent",
    },
  },
  {
    selector: "node[!photo]",
    style: {
      "background-color": "#e2e8f0",
      "border-color": "#cbd5e0",
      "border-width": "1px",
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
      color: "#666666",
      width: 1,
    },
  },
  {
    selector: "core",
    style: {
      "background-color": "#ffffff",
    },
  },
];

// Dark mode styles - matching GlobeGL colors
const darkModeStyles = [
  {
    selector: "node",
    style: {
      label: "data(label)",
      "text-valign": "bottom",
      "text-halign": "center",
      "text-outline-color": "#2d3748",
      "text-outline-width": "2px",
      "text-outline-opacity": "0.8",
      color: "#e2e8f0",
      width: 40,
      height: 40,
      "font-size": "7px",
      "font-family": "Montserrat, sans-serif",
      "border-width": 0,
      "background-color": "transparent",
    },
  },
  {
    selector: "node[hasPhoto]",
    style: {
      "background-image": "data(photo)",
      "background-width": "100%",
      "background-height": "100%",
      "background-fit": "cover",
      "background-color": "transparent",
      "border-color": "transparent",
    },
  },
  {
    selector: "node[!photo]",
    style: {
      "background-color": "#4a5568",
      "border-color": "#718096",
      "border-width": "1px",
    },
  },
  {
    selector: "edge",
    style: {
      "line-color": "#718096",
      "curve-style": "bezier",
      "font-size": "2px",
      "text-wrap": "wrap",
      "text-margin-y": -10,
      "text-max-width": 40,
      color: "#a0aec0",
      width: 1,
    },
  },
  {
    selector: "core",
    style: {
      "background-color": "#2d3748",
    },
  },
];

// Graph configuration
const graphConfig = {
  style: lightModeStyles, // Default to light mode
  layout: {
    name: "cola",
    animate: true,
    fit: true,
    padding: 120,
    duration: 1000,
  },
};

// Function to update graph styles based on dark mode
const updateGraphStyles = () => {
  if (!cy.value) return;

  const isDark = appStore.isDarkMode;
  const newStyles = isDark ? darkModeStyles : lightModeStyles;
  
  // Apply styles efficiently by using the style() method with the full array
  // This is still much faster than the original because we're not recreating the graph
  cy.value.style(newStyles);

  // Update CSS custom properties for background colors
  const backgroundColor = isDark ? "#2d3748" : "#ffffff";
  const root = document.documentElement;
  root.style.setProperty("--graph-background-color", backgroundColor);

  console.log("styles updated");
};

// Watch for dark mode changes
watch(
  () => appStore.isDarkMode,
  () => {
    // Clear any pending theme update
    if (themeUpdateTimeout) {
      clearTimeout(themeUpdateTimeout);
    }
    
    // Debounce the theme update to prevent rapid changes
    themeUpdateTimeout = setTimeout(() => {
      console.log("Updating graph styles");
      updateGraphStyles();
    }, 50); // 50ms debounce
  },
);

// Watch for component activation to optimize performance
watch(
  () => appStore.activeComponent,
  (newComponent) => {
    if (cy.value) {
      if (newComponent === 'cytoscape') {
        // Resume Cytoscape rendering
        cy.value.style('display', 'element');
        console.log('Cytoscape activated');
      } else {
        // Pause Cytoscape rendering when not active
        cy.value.style('display', 'none');
        console.log('Cytoscape deactivated');
      }
    }
  },
);

const fetchGraphData = async () => {
  const graphUrl = new URL("/graph", SERVER_BASE_URL);
  const response = await fetch(graphUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch graph with status ${response.status}`);
  }
  const json = await response.json();
  return {
    ...json,
    people: json.people.map((person) => {
      const photoBase64 = person.photo;
      const photoUrl = photoBase64 ? "data:;base64," + photoBase64 : null;
      // if (photoUrl) console.log(photoUrl);
      return {
        ...person,
        photo: photoUrl,
      };
    }),
  };
};

// Initialize graph data
const initializeGraphData = async () => {
  if (!localPeople || !Array.isArray(localPeople)) {
    console.error("People data is not available or not an array");
    return { nodes: [], edges: [] };
  }

  // Store people data for node click functionality
  peopleData.value = localPeople;

  const nodes = localPeople.map((person) => {
    const nodeData = {
      id: person.name,
      label: person.name,
    };
    
    // Only add photo data if it exists and convert to proper URL
    if (person.photo) {
      // Convert relative path to absolute URL
      const photoUrl = person.photo.startsWith('/') 
        ? person.photo 
        : `/profile-photos/${person.photo}`;
      nodeData.photo = photoUrl;
      nodeData.hasPhoto = true; // Add explicit flag
      console.log(`Setting photo for ${person.name}:`, photoUrl);
      
      // Test if image loads
      const img = new Image();
      img.onload = () => console.log(`✅ Photo loaded for ${person.name}:`, photoUrl);
      img.onerror = () => console.log(`❌ Photo failed to load for ${person.name}:`, photoUrl);
      img.src = photoUrl;
    } else {
      console.log(`No photo for ${person.name}`);
    }
    
    return { data: nodeData, classes: person.photo ? 'photo-node' : '' };
  });

  // For now, start with no edges (members view)
  // TODO: Add recommendations data later
  edges.value = [];

  return { nodes, edges: edges.value };
};

const showAiView = () => {
  if (!cy.value) return;

  // Add edges with matches data
  cy.value.add(edges.value);

  // Apply circle layout
  cy.value
    .layout({
      name: "circle",
      animate: true,
      fit: true,
      padding: 70,
      duration: 1000,
    })
    .run();
};

const showMembersView = () => {
  if (!cy.value) return;

  // Remove all edges
  cy.value.elements("edge").remove();

  // Apply layout with fallback
  try {
    cy.value
      .layout({
        name: "cola",
        animate: true,
        fit: true,
        padding: 120,
        duration: 1000,
      })
      .run();
  } catch (error) {
    console.warn("Cola layout not available, using random layout:", error);
    cy.value
      .layout({
        name: "random",
        animate: true,
        fit: true,
        padding: 120,
        duration: 1000,
      })
      .run();
  }
};

// Zoom out functionality
const handleZoomOut = () => {
  if (!cy.value || !nodeClickHandler) return;
  
  // Show all elements
  cy.value.elements().style({
    display: "element",
  });
  
  // Show node labels
  cy.value.nodes().style({
    "text-opacity": 1,
  });
  
  // Hide UI elements (safely check if elements exist)
  const nodeViewElements = ["name", "values", "vision", "vehicles", "zoom-out"];
  nodeViewElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.style.opacity = "0";
    }
  });
  
  // Show original UI (safely check if elements exist)
  const uiElements = ["members", "ai", "ai-summary", "wg"];
  uiElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.style.opacity = "1";
    }
  });
  
  // Remove circles and text
  if (svgRef.value) {
    const svgSelection = select(svgRef.value);
    svgSelection.selectAll("circle").remove();
    svgSelection.selectAll("foreignObject").remove();
    svgSelection.selectAll("mask").remove();
  }
  
  // Reset view
  cy.value.animate({
    fit: {
      eles: cy.value.elements(),
      padding: 120,
    },
    zoom: {
      level: 1,
    },
    duration: 1000,
  });
};

// Expose the methods to parent components
defineExpose({
  showAiView,
  showMembersView,
  handleZoomOut,
});

onMounted(async () => {
  // Wait for next tick to ensure DOM is fully rendered
  await nextTick();
  console.log("Container ref:", containerRef.value);
  console.log(
    "Container dimensions:",
    containerRef.value?.offsetWidth,
    containerRef.value?.offsetHeight,
  );

  // Initialize CSS custom property for background color
  const root = document.documentElement;
  const initialBackgroundColor = appStore.isDarkMode ? "#2d3748" : "#ffffff";
  root.style.setProperty("--graph-background-color", initialBackgroundColor);

  // Ensure the container ref is available
  if (!containerRef.value) {
    console.error("Container ref is not available");
    return;
  }

  try {
    // Check if we already have data in the store
    let graphData;
    if (appStore.cytoscapeData && appStore.cytoscapeInitialized) {
      console.log("Using cached Cytoscape data from store");
      graphData = appStore.cytoscapeData;
      cy.value = appStore.cytoscapeInstance;
      
      // Reattach to the new container
      if (cy.value) {
        cy.value.mount(containerRef.value);
        updateGraphStyles();
        
        // Reinitialize node click functionality
        const { handleNodeClick, cleanup } = useNodeClick(cy.value, select(svgRef.value), localPeople);
        nodeClickHandler = handleNodeClick;
        nodeClickCleanup = cleanup;
        
        // Add node click event listener
        cy.value.on('tap', 'node', handleNodeClick);
      }
    } else {
      console.log("Initializing new Cytoscape data");
      const { nodes } = await initializeGraphData();
      console.log("Initialized nodes:", nodes.length);
      console.log("Sample node data:", nodes[0]);
      
      // Debug: Check if nodes have photo data
      nodes.forEach((node, index) => {
        if (node.data.photo) {
          console.log(`Node ${index} (${node.data.id}) has photo:`, node.data.photo);
        }
      });

      // Set initial styles based on current dark mode state
      graphConfig.style = appStore.isDarkMode ? darkModeStyles : lightModeStyles;

      cy.value = cytoscape({
        container: containerRef.value,
        elements: {
          nodes,
          edges: [], // Members view starts with no edges
        },
        style: appStore.isDarkMode ? darkModeStyles : lightModeStyles, // Apply full styles initially
        layout: graphConfig.layout,
      });

      // Store the data and instance in the store
      appStore.setCytoscapeData({ nodes, edges: edges.value });
      appStore.setCytoscapeInstance(cy.value);
      appStore.setCytoscapeInitialized(true);

      // Apply initial theme styles efficiently (for any additional updates)
      updateGraphStyles();
      
      // Debug: Check if nodes have the correct attributes
      cy.value.nodes().forEach(node => {
        console.log(`Node ${node.data().id}:`, {
          hasPhoto: node.data().hasPhoto,
          photo: node.data().photo,
          hasStyle: node.hasClass('hasPhoto'),
          classes: node.classes()
        });
        
        // Test if photo loads
        if (node.data().photo) {
          const img = new Image();
          img.onload = () => console.log(`✅ Node photo loaded: ${node.data().id}`);
          img.onerror = () => console.log(`❌ Node photo failed: ${node.data().id}`);
          img.src = node.data().photo;
        }
      });
      
      // Initialize node click functionality after cy is created
      const { handleNodeClick, cleanup } = useNodeClick(cy.value, select(svgRef.value), localPeople);
      nodeClickHandler = handleNodeClick;
      nodeClickCleanup = cleanup;
      
      // Add node click event listener
      cy.value.on('tap', 'node', handleNodeClick);
    }

    console.log("Cytoscape initialized successfully");
    console.log("Graph elements:", cy.value.elements().length);
  } catch (error) {
    console.error("Error initializing Cytoscape graph:", error);
  }
});

// Cleanup function to clear timeout and remove event listeners on unmount
onUnmounted(() => {
  if (themeUpdateTimeout) {
    clearTimeout(themeUpdateTimeout);
  }
  
  // Remove node click event listener
  if (cy.value && nodeClickHandler) {
    cy.value.removeListener('tap', 'node', nodeClickHandler);
  }
  
  // Cleanup node click functionality
  if (nodeClickCleanup) {
    nodeClickCleanup();
  }
});
</script>

<template>
  <div class="network-graph" :class="{ 'dark-mode': appStore.isDarkMode }">
    <div id="cy-container">
      <div ref="containerRef" id="cy"></div>
      <svg ref="svgRef" class="overlay"></svg>
    </div>
    
    <!-- Node View UI Elements -->
    <div id="name" class="node-view-ui" style="opacity: 0;">
      <h1 id="n1"></h1>
    </div>
    
    <div id="values" class="node-view-ui" style="opacity: 0;">
      <h3>Values</h3>
      <div class="values-content"></div>
    </div>
    
    <div id="vision" class="node-view-ui" style="opacity: 0;">
      <h3>Vision</h3>
      <div class="vision-content"></div>
    </div>
    
    <div id="vehicles" class="node-view-ui" style="opacity: 0;">
      <h3>Vehicles</h3>
      <div class="vehicles-content"></div>
    </div>
    
    <div id="zoom-out" class="zoom-out-button" style="opacity: 0;" @click="handleZoomOut">
      <span>← Back to Network</span>
    </div>
  </div>
</template>

<style scoped>
.network-graph {
  width: 100%;
  height: 100%;
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

/* Node View UI Styles */
.node-view-ui {
  position: absolute;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #e2e8f0;
  transition: opacity 0.3s ease;
  max-width: 300px;
}

.dark-mode .node-view-ui {
  background: rgba(45, 55, 72, 0.95);
  border-color: #718096;
  color: #e2e8f0;
}

#name {
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
}

#name h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
}

.dark-mode #name h1 {
  color: #e2e8f0;
}

#values {
  top: 100px;
  right: 20px;
}

#vision {
  bottom: 100px;
  right: 20px;
}

#vehicles {
  bottom: 100px;
  left: 20px;
}

.node-view-ui h3 {
  margin: 0 0 12px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #2d3748;
}

.dark-mode .node-view-ui h3 {
  color: #e2e8f0;
}

.zoom-out-button {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
  color: #2d3748;
}

.dark-mode .zoom-out-button {
  background: rgba(45, 55, 72, 0.95);
  border-color: #718096;
  color: #e2e8f0;
}

.zoom-out-button:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dark-mode .zoom-out-button:hover {
  background: rgba(45, 55, 72, 1);
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

/* Dark mode override */
.dark-mode {
  --graph-background-color: #2d3748;
}
</style>
