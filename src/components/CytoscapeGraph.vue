<script setup>
import {
  onMounted,
  ref,
  defineProps,
  defineExpose,
  nextTick,
  watch,
  onUnmounted,
} from "vue";
import cytoscape from "cytoscape";
import { select, selectAll } from "d3-selection";
import cytoscapeCola from "cytoscape-cola";
import cytoscapeQtip from "cytoscape-qtip";
import { useAppStore } from "../stores/app";

import { getPhotoUrl } from "../lib/utils";
/** @import { Person } from "../types.d.ts" */

// Register Cytoscape extensions
try {
  cytoscape.use(cytoscapeCola);
  cytoscape.use(cytoscapeQtip);
} catch (error) {
  console.warn("Some Cytoscape extensions failed to load:", error);
}

const props = defineProps(["people"]);
/** @type {Person[]} */ const people = props.people;

const containerRef = ref(null);
const svgRef = ref(null);
const cy = ref(null);
const edges = ref([]);

// Add new state for person graph view
const isShowingPersonGraph = ref(false);
const currentPersonGraph = ref(null);
const personGraphCy = ref(null);

// Get dark mode state
const appStore = useAppStore();

// Helper function to safely get photo URL for a person
const getPersonPhotoUrl = (person) => {
  console.log("person:", person);
  if (!person.hasPhoto) {
    return null;
  }
  
  // If the person has a photo field with data (data URL), use it directly
  if (person.photo && typeof person.photo === 'string' && person.photo.startsWith('data:')) {
    return person.photo;
  }
  
  // If the person has an ID, construct the API URL
  if (person.id && typeof person.id === 'number') {
    // return getPhotoUrl(person, location.href);
    return getPhotoUrl(person, "https://dwebonebody.online/");
  }
  
  // Fallback: no photo available
  return null;
};

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
      "text-max-width": "60px",
      "text-valign": "center",
      "text-halign": "center",
      "text-margin-y": "0px",
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
      "text-max-width": "60px",
      "text-valign": "center",
      "text-halign": "center",
      "text-margin-y": "0px",
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

// Function to restore node images when component is activated
const restoreNodeImages = () => {
  if (!cy.value) return;

  // Force a refresh of nodes with photos to ensure images are properly rendered
  cy.value.nodes("[hasPhoto]").forEach((node) => {
    const photoUrl = node.data("photo");
    if (photoUrl) {
      // Re-apply the background image style to ensure proper rendering
      // Use a more direct approach to prevent flickering
      const currentStyle = node.style("background-image");
      if (currentStyle !== photoUrl) {
        node.style({
          "background-image": photoUrl,
          "background-width": "100%",
          "background-height": "100%",
          "background-fit": "cover",
          "background-color": "transparent",
          "border-color": "transparent",
        });
      }
    }
  });

  console.log("Node images restored");
};

// Function to generate person graph data (similar to InteractiveCytoscapeView.vue)
const generatePersonGraphData = (person) => {
  console.log("generatePersonGraphData called with person:", person);
  const nodes = [];
  const edges = [];

  // Check if we have saved positions
  const hasSavedPositions = person.personsGraphSnapshot && 
                           person.personsGraphSnapshot.nodes && 
                           person.personsGraphSnapshot.nodes.length > 0;

  // Add person node (center)
  const personNode = {
    data: {
      id: "person",
      label: person.name,
      type: "person",
      photo: getPersonPhotoUrl(person),
      nodeSize: 60, // Default size for person node
    },
    position: { x: 0, y: 0 },
  };
  
  nodes.push(personNode);

  // Add values nodes
  if (person.values && Array.isArray(person.values) && person.values.length > 0) {
    person.values.forEach((value, index) => {
      const valueId = `value-${index}`;
      let position;
      
      if (hasSavedPositions) {
        const savedNode = person.personsGraphSnapshot.nodes.find(n => n.id === valueId);
        position = savedNode ? savedNode.position : null;
      }
      
      if (!position) {
        // Calculate default position if no saved position
        const angle = (index / person.values.length) * 2 * Math.PI;
        const radius = 120;
        position = {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
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
          id: `person-value-${index}`,
          source: "person",
          target: valueId,
          label: "has value",
        },
      });
    });
  }

  // Add visions nodes
  if (person.visions && Array.isArray(person.visions) && person.visions.length > 0) {
    person.visions.forEach((vision, index) => {
      const visionId = `vision-${index}`;
      let position;
      
      if (hasSavedPositions) {
        const savedNode = person.personsGraphSnapshot.nodes.find(n => n.id === visionId);
        position = savedNode ? savedNode.position : null;
      }
      
      if (!position) {
        // Calculate default position if no saved position
        const angle = (index / person.visions.length) * 2 * Math.PI;
        const radius = 200;
        position = {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
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
          id: `person-vision-${index}`,
          source: "person",
          target: visionId,
          label: "has vision",
        },
      });
    });
  }

  // Add vehicles nodes
  if (person.vehicles && Array.isArray(person.vehicles) && person.vehicles.length > 0) {
    person.vehicles.forEach((vehicle, index) => {
      const vehicleId = `vehicle-${index}`;
      let position;
      
      if (hasSavedPositions) {
        const savedNode = person.personsGraphSnapshot.nodes.find(n => n.id === vehicleId);
        position = savedNode ? savedNode.position : null;
      }
      
      if (!position) {
        // Calculate default position if no saved position
        const angle = (index / person.vehicles.length) * 2 * Math.PI;
        const radius = 280;
        position = {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
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
          id: `person-vehicle-${index}`,
          source: "person",
          target: vehicleId,
          label: "has vehicle",
        },
      });
    });
  }

  console.log("Generated nodes:", nodes);
  console.log("Generated edges:", edges);
  return { nodes, edges };
};

// Function to show person graph
const showPersonGraph = (person) => {
  console.log("showPersonGraph called with person:", person);
  console.log("Person values:", person?.values);
  console.log("Person visions:", person?.visions);
  console.log("Person vehicles:", person?.vehicles);
  
  // Check if person has the required data
  const hasValues = person.values && Array.isArray(person.values) && person.values.length > 0;
  const hasVisions = person.visions && Array.isArray(person.visions) && person.visions.length > 0;
  const hasVehicles = person.vehicles && Array.isArray(person.vehicles) && person.vehicles.length > 0;
  
  console.log("Data check:", { hasValues, hasVisions, hasVehicles });
  console.log("Values array:", person.values);
  console.log("Visions array:", person.visions);
  console.log("Vehicles array:", person.vehicles);
  
  if (!person) {
    console.warn("No person data provided");
    return;
  }
  
  // Create a simple test graph even if some data is missing
  if (!hasValues && !hasVisions && !hasVehicles) {
    console.warn("Person has no values, visions, or vehicles - creating minimal graph");
    // We'll still create a graph with just the person node
  }

  currentPersonGraph.value = person;
  isShowingPersonGraph.value = true;

  // Hide the main network graph
  if (cy.value) {
    cy.value.container().style.display = "none";
  }

  // Create person graph container
  const container = containerRef.value;
  console.log("Container ref:", container);
  if (container) {
    // Create a new container for the person graph
    const personGraphContainer = document.createElement('div');
    personGraphContainer.id = 'person-graph-container';
    personGraphContainer.style.cssText = `
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      background-color: var(--graph-background-color);
      z-index: 10;
    `;
    container.appendChild(personGraphContainer);
    console.log("Person graph container created and appended");

    // Generate person graph data
    const { nodes, edges } = generatePersonGraphData(person);

    // Create new Cytoscape instance for person graph
    console.log("Creating Cytoscape instance with:", { nodes, edges });
    personGraphCy.value = cytoscape({
      container: personGraphContainer,
      elements: { nodes, edges },
      style: appStore.isDarkMode ? darkModeStyles : lightModeStyles,
      layout: {
        name: "preset",
        positions: nodes.reduce((acc, node) => {
          acc[node.data.id] = node.position;
          return acc;
        }, {}),
        fit: true,
        padding: 100,
        animate: false,
      },
      minZoom: 0.5,
      maxZoom: 2,
      wheelSensitivity: 0.3,
      autoungrabify: false,
      autolock: false,
    });
    console.log("Cytoscape instance created:", personGraphCy.value);

    // Center and fit the view
    personGraphCy.value.fit();
    personGraphCy.value.center();

    // Add node interactions
    personGraphCy.value.on("tap", "node[type!='person']", (evt) => {
      const node = evt.target;
      const isExpanded = node.data("expanded");
      const label = node.data("label");
      
      if (isExpanded) {
        // Shrink back to dot
        node.style({
          width: 20,
          height: 20,
          label: ""
        });
        node.data("expanded", false);
      } else {
        // Expand and show label
        const nodeSize = Math.max(60, label.length * 6);
        node.style({
          width: nodeSize,
          height: nodeSize,
          label: label,
          "text-max-width": nodeSize - 10,
          "text-wrap": "wrap"
        });
        node.data("expanded", true);
      }
    });

    // Add hover effects for non-person nodes
    personGraphCy.value.on("mouseover", "node[type!='person']", (evt) => {
      const node = evt.target;
      const label = node.data("label");
      const nodeSize = Math.max(60, label.length * 6);
      
      node.style({
        width: nodeSize,
        height: nodeSize,
        label: label,
        "text-max-width": nodeSize - 10,
        "text-wrap": "wrap"
      });
    });

    personGraphCy.value.on("mouseout", "node[type!='person']", (evt) => {
      const node = evt.target;
      if (!node.data("expanded")) {
        node.style({
          width: 20,
          height: 20,
          label: ""
        });
      }
    });
  }
};

// Function to return to network view
const returnToNetworkView = () => {
  isShowingPersonGraph.value = false;
  currentPersonGraph.value = null;

  // Destroy person graph
  if (personGraphCy.value) {
    personGraphCy.value.destroy();
    personGraphCy.value = null;
  }

  // Remove person graph container
  const personGraphContainer = document.getElementById('person-graph-container');
  if (personGraphContainer) {
    personGraphContainer.remove();
  }

  // Show the main network graph
  if (cy.value) {
    cy.value.container().style.display = "block";
  }
};

// Function to safely activate Cytoscape component
const activateCytoscape = () => {
  if (!cy.value) return;

  // Preload all images to prevent flickering
  const imagePromises = [];
  cy.value.nodes("[hasPhoto]").forEach((node) => {
    const photoUrl = node.data("photo");
    if (photoUrl) {
      const imgPromise = new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(photoUrl);
        img.onerror = () => reject(photoUrl);
        img.src = photoUrl;
      });
      imagePromises.push(imgPromise);
    }
  });

  // Wait for all images to load, then restore and make visible
  // Add a timeout to prevent hanging
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Image preload timeout")), 2000);
  });

  Promise.race([Promise.all(imagePromises), timeoutPromise])
    .then(() => {
      // First, restore images while still hidden to prevent flickering
      restoreNodeImages();

      // Add a small delay to ensure images are properly applied before making visible
      setTimeout(() => {
        // Then make visible - apply to the DOM element, not Cytoscape styles
        const cyElement = cy.value.container();
        if (cyElement) {
          cyElement.style.visibility = "visible";
          cyElement.style.pointerEvents = "auto";
        }

        // Force a style refresh to ensure everything is properly rendered
        nextTick(() => {
          updateGraphStyles();
          // Add a fallback restoration attempt
          setTimeout(() => {
            restoreNodeImages();
          }, 200);
        });
      }, 100);
    })
    .catch((error) => {
      console.warn("Image preload failed or timed out:", error);
      // Continue with activation even if images fail to preload
      restoreNodeImages();
      setTimeout(() => {
        // Apply to the DOM element, not Cytoscape styles
        const cyElement = cy.value.container();
        if (cyElement) {
          cyElement.style.visibility = "visible";
          cyElement.style.pointerEvents = "auto";
        }
        nextTick(() => {
          updateGraphStyles();
        });
      }, 100);
    });

  console.log("Cytoscape activated");
};

// Function to safely deactivate Cytoscape component
const deactivateCytoscape = () => {
  if (!cy.value) return;

  // Add a small delay to prevent image flickering during transition
  setTimeout(() => {
    // Apply to the DOM element, not Cytoscape styles
    const cyElement = cy.value.container();
    if (cyElement) {
      cyElement.style.visibility = "hidden";
      cyElement.style.pointerEvents = "none";
    }
  }, 50);

  console.log("Cytoscape deactivated");
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

  // Also update person graph styles if it exists
  if (personGraphCy.value) {
    personGraphCy.value.style(newStyles);
  }

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
      
      // Also update person graph styles if it exists
      if (personGraphCy.value) {
        const newStyles = appStore.isDarkMode ? darkModeStyles : lightModeStyles;
        personGraphCy.value.style(newStyles);
      }
    }, 50); // 50ms debounce
  },
);

// Watch for component activation to optimize performance
watch(
  () => appStore.activeComponent,
  (newComponent) => {
    if (cy.value) {
      if (newComponent === "cytoscape") {
        activateCytoscape();
      } else {
        deactivateCytoscape();
      }
    }
  },
);

// Initialize graph data
const initializeGraphData = async () => {
  const nodes = people.map((person) => {
    const nodeData = {
      id: person.name,
      label: person.name,
    };

    if (person.hasPhoto) {
      nodeData.photo = getPersonPhotoUrl(person);
      nodeData.hasPhoto = true; // Add explicit flag
    }

    return { data: nodeData, classes: person.photo ? "photo-node" : "" };
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
  const nodeViewElements = [
    "name",
    "values",
    "visions",
    "vehicles",
    "zoom-out",
  ];
  nodeViewElements.forEach((id) => {
    const element = document.getElementById(id);
    if (element) {
      element.style.opacity = "0";
    }
  });

  // Show original UI (safely check if elements exist)
  const uiElements = [
    "wg",
    "global-distribution",
    "members",
    "ai",
    "ai-summary",
  ];
  uiElements.forEach((id) => {
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
  showPersonGraph,
  returnToNetworkView,
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
        // Use simple node click handler for person graphs
        const handleNodeClick = (evt) => {
          const node = evt.target;
          const personName = node.data('id');
          const person = people.find(p => p.name === personName);
          
          if (person && person.values && person.visions && person.vehicles) {
            showPersonGraph(person);
          } else {
            console.warn("Person data incomplete for graph view:", person);
          }
        };
        
        nodeClickHandler = handleNodeClick;
        nodeClickCleanup = () => {
          // Cleanup function for node click
          if (cy.value) {
            cy.value.removeListener("tap", "node", handleNodeClick);
          }
        };

        // Add node click event listener
        cy.value.on("tap", "node", handleNodeClick);
      }
    } else {
      console.log("Initializing new Cytoscape data");
      const { nodes } = await initializeGraphData();
      console.log("Initialized nodes:", nodes.length);
      console.log("Sample node data:", nodes[0]);

      // Set initial styles based on current dark mode state
      graphConfig.style = appStore.isDarkMode
        ? darkModeStyles
        : lightModeStyles;

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
      cy.value.nodes().forEach((node) => {
        console.log(`Node ${node.data().id}:`, {
          hasPhoto: node.data().hasPhoto,
          photo: node.data().photo,
          hasStyle: node.hasClass("hasPhoto"),
          classes: node.classes(),
        });

        // Test if photo loads
        if (node.data().photo) {
          const img = new Image();
          // img.onload = () => console.log(`✅ Node photo loaded: ${node.data().id}`);
          img.onerror = () =>
            console.log(`❌ Node photo failed: ${node.data().id}`);
          img.src = node.data().photo;
        }
      });

      // Initialize node click functionality after cy is created
      // Use simple node click handler for person graphs
      const handleNodeClick = (evt) => {
        const node = evt.target;
        const personName = node.data('id');
        const person = people.find(p => p.name === personName);
        
        if (person && person.values && person.visions && person.vehicles) {
          showPersonGraph(person);
        } else {
          console.warn("Person data incomplete for graph view:", person);
        }
      };
      
      nodeClickHandler = handleNodeClick;
      nodeClickCleanup = () => {
        // Cleanup function for node click
        if (cy.value) {
          cy.value.removeListener("tap", "node", handleNodeClick);
        }
      };

      // Add node click event listener
      cy.value.on("tap", "node", handleNodeClick);
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
    cy.value.removeListener("tap", "node", nodeClickHandler);
  }

  // Cleanup node click functionality
  if (nodeClickCleanup) {
    nodeClickCleanup();
  }

  // Cleanup person graph
  if (personGraphCy.value) {
    personGraphCy.value.destroy();
    personGraphCy.value = null;
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
    <div id="name" class="node-view-ui" style="opacity: 0">
      <h1 id="n1"></h1>
    </div>

    <div id="values" class="node-view-ui" style="opacity: 0">
      <h3>Values</h3>
      <div class="values-content"></div>
    </div>

    <div id="visions" class="node-view-ui" style="opacity: 0">
      <h3>Visions</h3>
      <div class="vision-content"></div>
    </div>

    <div id="vehicles" class="node-view-ui" style="opacity: 0">
      <h3>Vehicles</h3>
      <div class="vehicles-content"></div>
    </div>

    <div
      id="zoom-out"
      class="zoom-out-button"
      style="opacity: 0"
      @click="handleZoomOut"
    >
      <span>← Back to Network</span>
    </div>

    <!-- Person Graph Back Button -->
    <div
      v-if="isShowingPersonGraph"
      class="person-graph-back-button"
      @click="returnToNetworkView"
    >
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

#visions {
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

/* Person Graph Back Button Styles */
.person-graph-back-button {
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

.dark-mode .person-graph-back-button {
  background: rgba(45, 55, 72, 0.95);
  border-color: #718096;
  color: #e2e8f0;
}

.person-graph-back-button:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dark-mode .person-graph-back-button:hover {
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
