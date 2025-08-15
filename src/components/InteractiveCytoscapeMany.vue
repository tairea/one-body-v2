<script setup>
import { onMounted, ref, computed, watch, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import DarkModeToggle from "../components/DarkModeToggle.vue";
import { useAppStore } from "../stores/app";
import cytoscape from "cytoscape";
import { getPhotoUrl } from "../lib/utils";

const appStore = useAppStore();
const router = useRouter();

// Props for multiple people
/** @type {import('vue').PropType<import('../types').Person[]>} */
const props = defineProps({
  people: {
    type: Array,
    required: true,
    default: () => []
  }
});

// Watch for node label visibility changes
const showNodeLabels = computed(() => appStore.showNodeLabels);

// Emit events for parent components
const emit = defineEmits(['nodePositionChanged', 'graphSnapshotSaved']);

const containerRef = ref(null);
const cyInstances = ref(new Map()); // Store multiple cytoscape instances

// Flag to prevent regeneration loops
const isUpdatingSnapshot = ref(false);

// Light mode styles
const lightModeStyles = [
  {
    selector: "node",
    style: {
      label: "data(label)",
      "text-valign": "center",
      "text-halign": "center",
      "text-outline-color": "transparent",
      "text-outline-width": "0px",
      "text-outline-opacity": "0",
      color: "#ffffff",
      width: 60,
      height: 60,
      "font-size": "6px",
      "font-family": "Montserrat, sans-serif",
      "font-weight": "600",
      "border-width": 0,
      "border-color": "transparent",
      "background-color": "#ffffff",
    },
  },
  {
    selector: "node[type='person']",
    style: {
      "background-image": "data(photo)",
      "background-width": "100%",
      "background-height": "100%",
      "background-fit": "cover",
      "background-color": "#ffffff",
      "border-color": "#000000",
      "border-width": "1px",
      color: "#000000",
      "font-family": "Consolas, monospace",
      "font-size": "6px",
      label: "data(label)",
      width: "data(nodeSize)",
      height: "data(nodeSize)",
      "text-wrap": "wrap",
      "text-max-width": "calc(data(nodeSize) - 4px)",
      "text-valign": "center",
      "text-halign": "center",
      "text-line-height": "1.2",
      "text-margin-y": "0px",
      "white-space": "pre-line",
    },
  },
  {
    selector: "node[type='title']",
    style: {
      "background-color": "transparent",
      "border-color": "transparent",
      "border-width": "0px",
      "text-wrap": "wrap",
      "text-max-width": "120px",
      "font-size": "12px",
      "font-weight": "bold",
      color: "#2d3748",
      width: "auto",
      height: "auto",
      label: "data(label)",
      "text-valign": "center",
      "text-halign": "center",
    },
  },
  {
    selector: "node[type='value']",
    style: {
      "background-color": "#ff4f2d",
      "border-color": "transparent",
      "border-width": "0px",
      "text-wrap": "wrap",
      "text-max-width": "80px",
      "font-size": "6px",
      color: "#ffffff",
      width: 20,
      height: 20,
      label: "",
    },
  },
  {
    selector: "node[type='vision']",
    style: {
      "background-color": "#e06ef9",
      "border-color": "transparent",
      "border-width": "0px",
      "text-wrap": "wrap",
      "text-max-width": "80px",
      "font-size": "6px",
      color: "#ffffff",
      width: 20,
      height: 20,
      label: "",
    },
  },
  {
    selector: "node[type='vehicle']",
    style: {
      "background-color": "#bbdf27",
      "border-color": "transparent",
      "border-width": "0px",
      "text-wrap": "wrap",
      "text-max-width": "80px",
      "font-size": "6px",
      color: "#ffffff",
      width: 20,
      height: 20,
      label: "",
    },
  },
  {
    selector: "edge",
    style: {
      "line-color": "#a0aec0",
      "curve-style": "bezier",
      "font-size": "6px",
      "text-wrap": "wrap",
      "text-margin-y": -10,
      "text-max-width": "60px",
      color: "#4a5568",
      width: 1,
      "target-arrow-color": "transparent",
      "target-arrow-shape": "none",
    },
  },
  {
    selector: "core",
    style: {
      "background-color": "#ffffff",
    },
  },
];

// Dark mode styles
const darkModeStyles = [
  {
    selector: "node",
    style: {
      label: "data(label)",
      "text-valign": "center",
      "text-halign": "center",
      "text-outline-color": "transparent",
      "text-outline-width": "0px",
      "text-outline-opacity": "0",
      color: "#0c0c0c",
      width: 60,
      height: 60,
      "font-size": "6px",
      "font-family": "Montserrat, sans-serif",
      "font-weight": "600",
      "border-width": 0,
      "border-color": "transparent",
      "background-color": "#0c0c0c",
    },
  },
  {
    selector: "node[type='person']",
    style: {
      "background-image": "data(photo)",
      "background-width": "100%",
      "background-height": "100%",
      "background-fit": "cover",
      "background-color": "#000000",
      "border-color": "#ffffff",
      "border-width": "1px",
      color: "#ffffff",
      "font-family": "Consolas, monospace",
      "font-size": "6px",
      label: "data(label)",
      width: "data(nodeSize)",
      height: "data(nodeSize)",
      "text-wrap": "wrap",
      "text-max-width": "calc(data(nodeSize) - 4px)",
      "text-valign": "center",
      "text-halign": "center",
      "text-line-height": "1.2",
      "text-margin-y": "0px",
      "white-space": "pre-line",
    },
  },
  {
    selector: "node[type='title']",
    style: {
      "background-color": "transparent",
      "border-color": "transparent",
      "border-width": "0px",
      "text-wrap": "wrap",
      "text-max-width": "120px",
      "font-size": "12px",
      "font-weight": "bold",
      color: "#e2e8f0",
      width: "auto",
      height: "auto",
      label: "data(label)",
      "text-valign": "center",
      "text-halign": "center",
    },
  },
  {
    selector: "node[type='value']",
    style: {
      "background-color": "#ff4f2d",
      "border-color": "transparent",
      "border-width": "0px",
      "text-wrap": "wrap",
      "text-max-width": "80px",
      "font-size": "6px",
      color: "#0c0c0c",
      width: 20,
      height: 20,
      label: "",
    },
  },
  {
    selector: "node[type='vision']",
    style: {
      "background-color": "#e06ef9",
      "border-color": "transparent",
      "border-width": "0px",
      "text-wrap": "wrap",
      "text-max-width": "80px",
      "font-size": "6px",
      color: "#0c0c0c",
      width: 20,
      height: 20,
      label: "",
    },
  },
  {
    selector: "node[type='vehicle']",
    style: {
      "background-color": "#bbdf27",
      "border-color": "transparent",
      "border-width": "0px",
      "text-wrap": "wrap",
      "text-max-width": "80px",
      "font-size": "6px",
      color: "#0c0c0c",
      width: 20,
      height: 20,
      label: "",
    },
  },
  {
    selector: "edge",
    style: {
      "line-color": "#718096",
      "curve-style": "bezier",
      "font-size": "6px",
      "text-wrap": "wrap",
      "text-margin-y": -10,
      "text-max-width": "60px",
      color: "#a0aec0",
      width: 1,
      "target-arrow-color": "transparent",
      "target-arrow-shape": "none",
    },
  },
  {
    selector: "core",
    style: {
      "background-color": "#0c0c0c",
    },
  },
];

// Function to update graph styles based on dark mode
const updateGraphStyles = () => {
  if (!cyInstances.value || cyInstances.value.size === 0) return;

  const isDark = appStore.isDarkMode;
  const newStyles = isDark ? darkModeStyles : lightModeStyles;
  
  // Update styles for all cytoscape instances
  cyInstances.value.forEach(cy => {
    if (cy) {
      cy.style(newStyles);
    }
  });

  // Update CSS custom properties for background colors
  const backgroundColor = isDark ? "#0c0c0c" : "#ffffff";
  const root = document.documentElement;
  root.style.setProperty("--graph-background-color", backgroundColor);
};

// Calculate optimal node size based on text length
const calculatePersonNodeSize = (text) => {
  const minSize = 50; // Reduced from 60
  const maxSize = 80; // Reduced from 120
  
  // Calculate size based on text length with text wrapping for longer names
  let calculatedSize;
  if (text.length <= 8) {
    calculatedSize = minSize;
  } else if (text.length <= 10) {
    // Single line for names up to 10 characters
    calculatedSize = minSize + (text.length - 8) * 2; // Reduced from 4
  } else {
    // Text wrapping for names over 10 characters
    // Use the actual formatted text to determine line count and max line length
    const formattedText = formatTextWithLineBreaks(text);
    const lines = formattedText.split('\n');
    const maxLineLength = Math.max(...lines.map(line => line.length));
    
    // For wrapped text, make it much tighter
    // Width: accommodate the longest actual line
    const width = minSize + Math.max(0, maxLineLength - 8) * 2;
    // Height: accommodate multiple lines but much tighter
    const height = minSize + (lines.length - 1) * 12;
    
    // Use the larger of width or height to maintain square/circular shape
    calculatedSize = Math.max(width, height);
  }
  
  // Ensure size is within bounds
  const finalSize = Math.max(minSize, Math.min(maxSize, calculatedSize));
  
  return finalSize;
};

// Format text with line breaks for better wrapping
const formatTextWithLineBreaks = (text) => {
  if (text.length <= 10) {
    return text;
  }
  
  // Split text into words
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    
    // If adding this word would exceed 10 characters, start a new line
    if (testLine.length > 10) {
      if (currentLine) {
        // Add current line to lines array
        lines.push(currentLine);
        // Start new line with current word
        currentLine = word;
      } else {
        // If even a single word is longer than 10 chars, we have to break it
        // This is a fallback for very long words
        currentLine = word;
      }
    } else {
      // Word fits on current line
      currentLine = testLine;
    }
  }
  
  // Add the last line
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines.join('\n');
};

// Get the appropriate photo URL for a person
// Handles both local data URLs and remote API photos
const getPersonPhotoUrl = (personData) => {
  if (!personData.hasPhoto) {
    return null;
  }
  
  // If the person has a photo field with data (data URL), use it directly
  if (personData.photo && typeof personData.photo === 'string' && personData.photo.startsWith('data:')) {
    return personData.photo;
  }
  
  // If the person has an ID, construct the API URL
  if (personData.id && typeof personData.id === 'number') {
    return getPhotoUrl(personData, "https://dwebonebody.online/");
  }
  
  // Fallback: no photo available
  return null;
};

// Initialize graph data from person
const initializeGraphData = (personData, personIndex) => {
  const nodes = [];
  const edges = [];

  // Check if we have saved positions
  const hasSavedPositions = personData.personsGraphSnapshot && 
                           personData.personsGraphSnapshot.nodes && 
                           personData.personsGraphSnapshot.nodes.length > 0;

  // Calculate offset for this person's graph
  const graphOffset = {
    x: (personIndex % 3) * 700, // Changed from 400 to 600 for more noticeable gaps
    y: Math.floor(personIndex / 3) * 700 // Changed from 400 to 600 for more noticeable gaps
  };

  // Add person node (center of this person's graph)
  const personNode = {
    data: {
      id: `person-${personData.id}`,
      label: formatTextWithLineBreaks(personData.name),
      type: "person",
      photo: getPersonPhotoUrl(personData),
      nodeSize: calculatePersonNodeSize(personData.name),
    },
    position: { 
      x: graphOffset.x + 0, 
      y: graphOffset.y + 0 
    },
  };
  
  nodes.push(personNode);

  // Add values nodes
  personData.values.forEach((value, index) => {
    const valueId = `value-${personData.id}-${index}`;
    let position;
    
    if (hasSavedPositions) {
      const savedNode = personData.personsGraphSnapshot.nodes.find(n => n.id === valueId);
      position = savedNode ? savedNode.position : null;
    }
    
    if (!position) {
      // Calculate default position if no saved position
      const angle = (index / personData.values.length) * 2 * Math.PI;
      const radius = 120;
      position = {
        x: graphOffset.x + Math.cos(angle) * radius,
        y: graphOffset.y + Math.sin(angle) * radius,
      };
    }
    
    const valueNode = {
      data: {
        id: valueId,
        label: value,
        type: "value",
      },
      position,
    };
    nodes.push(valueNode);

    // Add edge from person to value
    edges.push({
      data: {
        id: `person-${personData.id}-value-${index}`,
        source: `person-${personData.id}`,
        target: valueId,
        label: "has value",
      },
    });
  });

  // Add visions nodes
  personData.visions.forEach((vision, index) => {
    const visionId = `vision-${personData.id}-${index}`;
    let position;
    
    if (hasSavedPositions) {
      const savedNode = personData.personsGraphSnapshot.nodes.find(n => n.id === visionId);
      position = savedNode ? savedNode.position : null;
    }
    
    if (!position) {
      // Calculate default position if no saved position
      const angle = (index / personData.visions.length) * 2 * Math.PI;
      const radius = 200;
      position = {
        x: graphOffset.x + Math.cos(angle) * radius,
        y: graphOffset.y + Math.sin(angle) * radius,
      };
    }
    
    const visionNode = {
      data: {
        id: visionId,
        label: vision,
        type: "vision",
      },
      position,
    };
    nodes.push(visionNode);

    // Add edge from person to vision
    edges.push({
      data: {
        id: `person-${personData.id}-vision-${index}`,
        source: `person-${personData.id}`,
        target: visionId,
        label: "has vision",
      },
    });
  });

  // Add vehicles nodes
  personData.vehicles.forEach((vehicle, index) => {
    const vehicleId = `vehicle-${personData.id}-${index}`;
    let position;
    
    if (hasSavedPositions) {
      const savedNode = personData.personsGraphSnapshot.nodes.find(n => n.id === vehicleId);
      position = savedNode ? savedNode.position : null;
    }
    
    if (!position) {
      // Calculate default position if no saved position
      const angle = (index / personData.vehicles.length) * 2 * Math.PI;
      const radius = 280;
      position = {
        x: graphOffset.x + Math.cos(angle) * radius,
        y: graphOffset.y + Math.sin(angle) * radius,
      };
    }
    
    const vehicleNode = {
      data: {
        id: vehicleId,
        label: vehicle.title,
        type: "vehicle",
        description: vehicle.description,
      },
        position,
    };
    nodes.push(vehicleNode);

    // Add edge from person to vehicle
    edges.push({
      data: {
        id: `person-${personData.id}-vehicle-${index}`,
        source: `person-${personData.id}`,
        target: vehicleId,
        label: "has vehicle",
      },
    });
  });

  return { nodes, edges };
};

// Function to setup interactions for a cytoscape instance
const setupInteractions = (cyInstance) => {
  // Add some basic interactions
  cyInstance.on("tap", "node", (evt) => {
    const node = evt.target;
    console.log("Clicked node:", node.data());
  });

  // Add node dragging detection
  cyInstance.on("dragfreeon", "node", (evt) => {
    const node = evt.target;
    const newPosition = node.position();
    
    // Emit event for parent components to show save button
    emit('nodePositionChanged', {
      nodeId: node.id(),
      position: newPosition
    });
  });

  // Add hover and click functionality for non-person nodes
  cyInstance.on("mouseover", "node[type!='person']", (evt) => {
    const node = evt.target;
    // Only show labels on hover if global labels are not visible
    if (!showNodeLabels.value) {
      const label = node.data("label");
      const { width, height } = calculateOptimalNodeSize(label);
      
      node.style({
        width: width,
        height: height,
        label: label,
        "text-max-width": Math.min(60, width - 10), // More restrictive text width for wrapping
        "text-wrap": "wrap"
      });
    }
  });

  cyInstance.on("mouseout", "node[type!='person']", (evt) => {
    const node = evt.target;
    // Only shrink if not clicked (expanded) and global labels are not visible
    if (!node.data("expanded") && !showNodeLabels.value) {
      node.style({
        width: 20,
        height: 20,
        label: ""
      });
    }
  });

  cyInstance.on("tap", "node[type!='person']", (evt) => {
    const node = evt.target;
    const isExpanded = node.data("expanded");
    const label = node.data("label");
    
    if (isExpanded) {
      // Shrink back to dot (unless global labels are visible)
      if (!showNodeLabels.value) {
        node.style({
          width: 20,
          height: 20,
          label: ""
        });
      }
      node.data("expanded", false);
    } else {
      // Expand and show label with precise sizing
      const { width, height } = calculateOptimalNodeSize(label);
      
      node.style({
        width: width,
        height: height,
        label: label,
        "text-max-width": Math.min(60, width - 10), // More restrictive text width for wrapping
        "text-wrap": "wrap"
      });
      node.data("expanded", true);
    }
  });
};

// Function to regenerate the graph with updated person data
const regenerateGraph = () => {
  if (!cyInstances.value || cyInstances.value.size === 0 || !props.people || isUpdatingSnapshot.value) return;
  
  try {
    // Clear all existing instances
    cyInstances.value.forEach(cy => {
      if (cy) {
        cy.elements().remove();
      }
    });
    
    // Reinitialize all graphs
    initializeAllGraphs();
    
  } catch (error) {
    console.error('Error regenerating graphs:', error);
  }
};

// Function to initialize all graphs for all people
const initializeAllGraphs = () => {
  if (!props.people || props.people.length === 0) return;
  
  // Clear existing instances
  cyInstances.value.forEach(cy => {
    if (cy) {
      cy.destroy();
    }
  });
  cyInstances.value.clear();
  
  // Create a single cytoscape instance for all people
  const allNodes = [];
  const allEdges = [];
  
  props.people.forEach((personData, index) => {
    const { nodes, edges } = initializeGraphData(personData, index);
    allNodes.push(...nodes);
    allEdges.push(...edges);
  });
  
  // Initialize single cytoscape instance with all data
  cyInstances.value.set('main', cytoscape({
    container: containerRef.value,
    elements: {
      nodes: allNodes,
      edges: allEdges,
    },
    style: appStore.isDarkMode ? darkModeStyles : lightModeStyles,
    layout: {
      name: "preset", // Use preset positions
      positions: allNodes.reduce((acc, node) => {
        acc[node.data.id] = node.position;
        return acc;
      }, {}),
      fit: true,
      padding: 100,
      animate: false,
    },
    minZoom: 0.1, // Allow more zoom out to see all graphs
    maxZoom: 2,
    wheelSensitivity: 0.3,
    autoungrabify: true, // Changed from false to true to make nodes non-draggable
    autolock: false,
  }));
  
  const mainCy = cyInstances.value.get('main');
  
  // Center the view and ensure proper fit
  mainCy.fit();
  mainCy.center();
  
  // Force a resize to ensure proper rendering
  setTimeout(() => {
    mainCy.resize();
    mainCy.fit();
    mainCy.center();
    
    // Force style refresh to ensure person node sizes are applied
    mainCy.style().update();
    
    // Explicitly set person node sizes to ensure they're applied
    const personElements = mainCy.$('node[type="person"]');
    personElements.forEach(personElement => {
      const personElementData = personElement.data();
      if (personElementData.nodeSize) {
        personElement.style({
          width: personElementData.nodeSize,
          height: personElementData.nodeSize
        });
      }
    });
  }, 100);
  
  // Add interactions
  setupInteractions(mainCy);
};

// Watch for dark mode changes
watch(
  () => appStore.isDarkMode,
  () => {
    updateGraphStyles();
  },
);

// Watch for people changes
watch(
  () => props.people,
  (newPeople) => {
    if (newPeople && newPeople.length > 0 && !isUpdatingSnapshot.value) {
      // If people data changes and instances exist, regenerate the graphs
      regenerateGraph();
    }
  },
  { immediate: true, deep: true }
);

// Watch for changes to people properties that affect the graphs
watch(
  () => props.people?.map(p => p.values?.length),
  (newLengths, oldLengths) => {
    if (cyInstances.value.size > 0 && props.people && 
        JSON.stringify(newLengths) !== JSON.stringify(oldLengths) && 
        !isUpdatingSnapshot.value) {
      regenerateGraph();
    }
  },
  { deep: true }
);

watch(
  () => props.people?.map(p => p.visions?.length),
  (newLengths, oldLengths) => {
    if (cyInstances.value.size > 0 && props.people && 
        JSON.stringify(newLengths) !== JSON.stringify(oldLengths) && 
        !isUpdatingSnapshot.value) {
      regenerateGraph();
    }
  },
  { deep: true }
);

watch(
  () => props.people?.map(p => p.vehicles?.length),
  (newLengths, oldLengths) => {
    if (cyInstances.value.size > 0 && props.people && 
        JSON.stringify(newLengths) !== JSON.stringify(oldLengths) && 
        !isUpdatingSnapshot.value) {
      regenerateGraph();
    }
  },
  { deep: true }
);

// Function to save the current graph snapshot to the person
const saveGraphSnapshot = async () => {
  if (!cyInstances.value || cyInstances.value.size === 0 || !props.people) return;
  
  try {
    isUpdatingSnapshot.value = true;
    
    const mainCy = cyInstances.value.get('main');
    if (!mainCy) return;
    
    // For now, we'll save the entire graph state
    // In the future, you might want to save individual person snapshots
    const nodes = mainCy.nodes().map(node => ({
      id: node.id(),
      label: node.data('label'),
      type: node.data('type'),
      photo: node.data('photo'),
      nodeSize: node.data('nodeSize'),
      position: node.position()
    }));
    
    const edges = mainCy.edges().map(edge => ({
      id: edge.id(),
      source: edge.source().id(),
      target: edge.target().id(),
      label: edge.data('label')
    }));
    
    const graphSnapshot = { nodes, edges };
    
    // Emit event for parent components
    emit('graphSnapshotSaved', graphSnapshot);
    
  } catch (error) {
    console.error('Error saving graph snapshot:', error);
    throw error; // Re-throw so parent can handle it
  } finally {
    // Reset flag after a short delay to allow store update to complete
    setTimeout(() => {
      isUpdatingSnapshot.value = false;
    }, 100);
  }
};

// Function to update a specific node's position in the snapshot
const updateNodePosition = (nodeId, newPosition) => {
  // This function would need to be updated based on how you want to handle
  // position updates for multiple people's graphs
  console.log('Update node position:', nodeId, newPosition);
};

// Expose methods for parent components
defineExpose({
  saveGraphSnapshot,
  updateNodePosition,
  regenerateGraph
});

onMounted(async () => {
  // Initialize dark mode if not already done
  if (typeof appStore.isDarkMode === 'undefined') {
    appStore.initializeDarkMode();
  }

  // Check if we have people data
  if (!props.people || props.people.length === 0) {
    console.log("No people data available yet");
    return;
  }

  try {
    // Initialize all graphs
    initializeAllGraphs();
    
  } catch (error) {
    console.error("Error initializing Interactive Cytoscape:", error);
  }
});

// Watch for changes in node label visibility
watch(showNodeLabels, (newValue) => {
  if (cyInstances.value.get('main')) { // Check if mainCy exists
    const mainCy = cyInstances.value.get('main');
    const nodes = mainCy.nodes();
    
    nodes.forEach(node => {
      const nodeType = node.data("type");
      if (nodeType !== "person") {
        if (newValue) {
          // Show labels for all non-person nodes with precise sizing
          const label = node.data("label");
          const { width, height } = calculateOptimalNodeSize(label);
          
          node.style({
            width: width,
            height: height,
            label: label,
            "text-max-width": Math.min(60, width - 10), // More restrictive text width for wrapping
            "text-wrap": "wrap"
          });
        } else {
          // Hide labels for all non-person nodes (unless they were clicked/expanded)
          if (!node.data("expanded")) {
            node.style({
              width: 20,
              height: 20,
              label: ""
            });
          }
        }
      }
    });
  }
});

// Helper function to calculate optimal node size based on text content
const calculateOptimalNodeSize = (label) => {
  if (!label) return { width: 20, height: 20 };
  
  // Base font size is 6px as defined in the styles
  const fontSize = 6;
  const lineHeight = fontSize * 1.2; // Standard line height ratio
  
  // Estimate text width (rough approximation for monospace-like font)
  const avgCharWidth = fontSize * 0.6; // Approximate character width
  const textWidth = label.length * avgCharWidth;
  
  // Calculate optimal dimensions - keep nodes circular
  let size;
  
  if (textWidth <= 40) {
    // Short text (1-2 words) - small circular nodes
    size = Math.max(40, textWidth + 20);
  } else if (textWidth <= 60) {
    // Medium text (3-4 words) - medium circular nodes
    size = Math.max(50, textWidth + 20);
  } else if (textWidth <= 80) {
    // Longer text (5-6 words) - larger circular nodes
    size = Math.max(60, textWidth + 20);
  } else {
    // Very long text (7+ words) - largest circular nodes with text wrapping
    size = Math.max(80, Math.min(100, textWidth * 0.4 + 40)); // Scale down long text impact
  }
  
  // Ensure minimum and maximum sizes
  size = Math.max(30, Math.min(100, size));
  
  // Return circular dimensions
  return { width: size, height: size };
};

onUnmounted(() => {
  // Clean up all cytoscape instances
  cyInstances.value.forEach(cy => {
    if (cy) {
      cy.destroy();
    }
  });
  cyInstances.value.clear();
});
</script>

<template>
  <div class="interactive-cytoscape-view" :class="{ 'dark-mode': appStore.isDarkMode, 'fullscreen': appStore.isFullscreen }">
    <div class="cytoscape-container">
      <div ref="containerRef" class="cy-container"></div>
    </div>
  </div>
</template>

<style scoped>
.interactive-cytoscape-view {
  width: 100vw;
  height: 100vh;
  background-color: var(--graph-background-color);
  transition: background-color 0.3s ease;
  overflow: auto; /* Changed from hidden to auto to allow scrolling */
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1;

  &.fullscreen {
    z-index: 2;
  }
}

.cytoscape-container {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: var(--graph-background-color);
  transition: background-color 0.3s ease;
  /* Ensure container can expand to fit all graphs */
  min-width: max-content;
  min-height: max-content;
}

.cy-container {
  width: 100%;
  height: 100%;
  background-color: var(--graph-background-color);
  transition: background-color 0.3s ease;
  /* Ensure cytoscape container can expand */
  min-width: max-content;
  min-height: max-content;
}

/* Dark mode styles */
.interactive-cytoscape-view.dark-mode {
  background-color: var(--graph-background-color);
}

.interactive-cytoscape-view.dark-mode .cytoscape-container {
  background-color: var(--graph-background-color);
}

.interactive-cytoscape-view.dark-mode .cy-container {
  background-color: var(--graph-background-color);
}
</style>

<style>
:root {
  --graph-background-color: #ffffff;
}

.dark-mode {
  --graph-background-color: #0c0c0c;
}
</style>
