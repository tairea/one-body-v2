<script setup>
import { onMounted, ref, computed, watch, onUnmounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import DarkModeToggle from "../components/DarkModeToggle.vue";
import { useAppStore } from "../stores/app";
import cytoscape from "cytoscape";

import { useLayers, lightenColor } from "../lib/useLayers";

const appStore = useAppStore();
const router = useRouter();
const layers = useLayers();

// Props for multiple people
/** @type {import('vue').PropType<import('../types').Person[]>} */
const props = defineProps({
  people: {
    type: Array,
    required: true,
    default: () => [],
  },
  /** Pixels occupied by profile panel at bottom; used to center zoom in visible area */
  panelBottomOffset: { type: Number, default: 0 },
});

// Watch for node label visibility changes
const showNodeLabels = computed(() => appStore.showNodeLabels);

// Shrink container when panel is open so fit() centers in visible area
const containerStyle = computed(() => {
  const offset = props.panelBottomOffset ?? 0;
  if (offset <= 0) return undefined;
  return { height: `calc(100vh - ${offset}px)` };
});

// Resize Cytoscape when container dimensions change (e.g. panel open/close)
watch(
  () => props.panelBottomOffset,
  () => {
    nextTick(() => {
      cyInstances.value.forEach((cy) => {
        if (cy) cy.resize();
      });
    });
  },
  { flush: "post" }
);

// Emit events for parent components
const emit = defineEmits([
  "nodePositionChanged",
  "graphSnapshotSaved",
  "zoomStateChanged",
  "chipNodeClicked",
]);

const containerRef = ref(null);
const cyInstances = ref(new Map()); // Store multiple cytoscape instances

// Add state for tracking zoom level and current person
const isZoomedToPerson = ref(false);
const currentZoomedPerson = ref(null);
const isZooming = ref(false); // Flag to prevent double zooming

// Flag to prevent regeneration loops
const isUpdatingSnapshot = ref(false);
// Flag to prevent regeneration during drag (cytoscape internal data updates trigger Vue reactivity)
const isDragging = ref(false);

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
      "background-color": "#ffffff",
      "background-image": "data(photo)",
      "background-width": "100%",
      "background-height": "100%",
      "background-fit": "cover",
      "border-color": "#a0aec0",
      "border-width": "1px",
      color: "#000000",
      "font-family": "Consolas, monospace",
      "font-size": "6px",
      label: "",
      width: "data(nodeSize)",
      height: "data(nodeSize)",
      "text-wrap": "wrap",
      "text-max-width": "data(nodeSize)",
      "text-valign": "center",
      "text-halign": "center",
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
      width: "label",
      height: "label",
      label: "data(label)",
      "text-valign": "center",
      "text-halign": "center",
    },
  },
  ...layers.flatMap((layer) => [
    {
      selector: `node[type='${layer.key}-d0']`,
      style: {
        "background-color": layer.color,
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
      selector: `node[type='${layer.key}-d1']`,
      style: {
        "background-color": lightenColor(layer.color, 0.35),
        "border-color": "transparent",
        "border-width": "0px",
        "text-wrap": "wrap",
        "text-max-width": "80px",
        "font-size": "6px",
        color: "#ffffff",
        width: 14,
        height: 14,
        label: "",
      },
    },
    {
      selector: `node[type='${layer.key}-d2']`,
      style: {
        "background-color": lightenColor(layer.color, 0.60),
        "border-color": "transparent",
        "border-width": "0px",
        "text-wrap": "wrap",
        "text-max-width": "80px",
        "font-size": "6px",
        color: "#ffffff",
        width: 10,
        height: 10,
        label: "",
      },
    },
  ]),
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
      "background-color": "#000000",
      "background-image": "data(photo)",
      "background-width": "100%",
      "background-height": "100%",
      "background-fit": "cover",
      "border-color": "#718096",
      "border-width": "1px",
      color: "#ffffff",
      "font-family": "Consolas, monospace",
      "font-size": "6px",
      label: "",
      width: "data(nodeSize)",
      height: "data(nodeSize)",
      "text-wrap": "wrap",
      "text-max-width": "data(nodeSize)",
      "text-valign": "center",
      "text-halign": "center",
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
      width: "label",
      height: "label",
      label: "data(label)",
      "text-valign": "center",
      "text-halign": "center",
    },
  },
  ...layers.flatMap((layer) => [
    {
      selector: `node[type='${layer.key}-d0']`,
      style: {
        "background-color": layer.color,
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
      selector: `node[type='${layer.key}-d1']`,
      style: {
        "background-color": lightenColor(layer.color, 0.35),
        "border-color": "transparent",
        "border-width": "0px",
        "text-wrap": "wrap",
        "text-max-width": "80px",
        "font-size": "6px",
        color: "#0c0c0c",
        width: 14,
        height: 14,
        label: "",
      },
    },
    {
      selector: `node[type='${layer.key}-d2']`,
      style: {
        "background-color": lightenColor(layer.color, 0.60),
        "border-color": "transparent",
        "border-width": "0px",
        "text-wrap": "wrap",
        "text-max-width": "80px",
        "font-size": "6px",
        color: "#0c0c0c",
        width: 10,
        height: 10,
        label: "",
      },
    },
  ]),
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
  cyInstances.value.forEach((cy) => {
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
    const lines = formattedText.split("\n");
    const maxLineLength = Math.max(...lines.map((line) => line.length));

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
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine + (currentLine ? " " : "") + word;

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

  return lines.join("\n");
};

// Get the appropriate photo URL for a person
const getPersonPhotoUrl = (personData) => {
  // photoUrl is set by the mapper from Supabase storage
  return personData.photoUrl ?? null;
};

// Initialize graph data from person
const initializeGraphData = (personData, personIndex) => {
  const nodes = [];
  const edges = [];

  // Check if we have saved positions
  const hasSavedPositions =
    personData.personsGraphSnapshot &&
    personData.personsGraphSnapshot.nodes &&
    personData.personsGraphSnapshot.nodes.length > 0;

  // Calculate offset for this person's graph
  const graphOffset = {
    x: (personIndex % 3) * 600,
    y: Math.floor(personIndex / 3) * 600,
  };

  // Person node position
  const personPos = { x: graphOffset.x, y: graphOffset.y };

  // Add person node (center of this person's graph)
  const personNode = {
    data: {
      id: `person-${personData.id}`,
      label: formatTextWithLineBreaks(personData.name),
      type: "person",
      photo: getPersonPhotoUrl(personData),
      nodeSize: calculatePersonNodeSize(personData.name),
    },
    position: personPos,
  };
  nodes.push(personNode);

  /**
   * Recursively add chip nodes and their children.
   * @param {object} chip - ChipNode
   * @param {string} chipId - the ID to assign to this node
   * @param {string} parentId - parent node ID (for edge)
   * @param {{x:number,y:number}} parentPos - parent node position (for arc placement)
   * @param {string} layerKey
   * @param {string} baseColor
   * @param {number} depth
   * @param {number} totalSiblings - total chips at this level
   * @param {number} siblingIdx - this chip's index among siblings
   * @param {number} orbitRadius - radius to use when computing this node's position around parentPos
   */
  const addChipNodes = (chip, chipId, parentId, parentPos, layerKey, baseColor, depth, totalSiblings, siblingIdx, orbitRadius) => {
    const lightenAmounts = [0, 0.35, 0.60];
    const color = lightenColor(baseColor, lightenAmounts[Math.min(depth, 2)]);

    let position = null;
    if (hasSavedPositions) {
      const savedNode = personData.personsGraphSnapshot.nodes.find((n) => n.id === chipId);
      if (savedNode) position = savedNode.position;
    }

    if (!position) {
      const count = totalSiblings || 1;
      const angle = (siblingIdx / count) * 2 * Math.PI;
      position = {
        x: parentPos.x + Math.cos(angle) * orbitRadius,
        y: parentPos.y + Math.sin(angle) * orbitRadius,
      };
    }

    nodes.push({
      data: {
        id: chipId,
        label: chip.label,
        type: `${layerKey}-d${Math.min(depth, 2)}`,
        bgColor: color,
      },
      position,
    });

    edges.push({
      data: {
        id: `edge-${parentId}-${chipId}`,
        source: parentId,
        target: chipId,
        label: "",
      },
    });

    // Sub-nodes orbit their parent at a smaller radius than the layer rings
    const childOrbitRadius = depth === 0 ? 60 : 40;
    const children = chip.children ?? [];
    children.forEach((child, ci) => {
      addChipNodes(
        child,
        `${chipId}-c${ci}`,
        chipId,
        position,
        layerKey,
        baseColor,
        depth + 1,
        children.length,
        ci,
        childOrbitRadius,
      );
    });
  };

  // Layer ring radii match the original v2 layout: layer1=120, layer2=200, layer3=280
  const layerOrbitRadii = [120, 200, 280];

  // Add layer chip nodes (ChipNode[])
  layers.forEach((layer, layerIdx) => {
    const layerKey = layer.key;
    const chips = personData[layerKey] ?? [];
    const orbitRadius = layerOrbitRadii[layerIdx] ?? 120;

    chips.forEach((chip, idx) => {
      const chipId = `${layerKey}-${personData.id}-c${idx}`;
      addChipNodes(
        chip,
        chipId,
        `person-${personData.id}`,
        personPos,
        layerKey,
        layer.color,
        0,
        chips.length,
        idx,
        orbitRadius,
      );
    });
  });

  return { nodes, edges };
};

// Function to setup interactions for a cytoscape instance
const setupInteractions = (cyInstance) => {
  // Add click anywhere to zoom to nearest person (background clicks only)
  cyInstance.on("tap", (evt) => {
    // Only handle background clicks (not node clicks)
    if (!evt.target.isNode) {
      const clickPos = evt.renderedPosition;
      zoomToNearestPerson(clickPos);
    }
  });

  // Add some basic interactions for person nodes
  cyInstance.on("tap", "node[type='person']", (evt) => {
    const node = evt.target;
    const nodeData = node.data();

    // Zoom to this person's graph
    zoomToPersonGraph(nodeData.id, props.panelBottomOffset ?? 0);
  });

  // Add interactions for non-person nodes
  cyInstance.on("tap", "node[type!='person']", (evt) => {
    const node = evt.target;
    const nodeData = node.data();
    const nodeId = nodeData.id;

    // For non-person nodes, zoom directly to this node (single smooth animation)
    const personId = findPersonIdFromNodeId(nodeId);
    if (personId) {
      zoomToPersonGraph(personId, props.panelBottomOffset ?? 0, nodeId);
      const personUuid = personId.replace("person-", "");
      if (appStore.myPerson && appStore.myPerson.id === personUuid) {
        emit("chipNodeClicked", { nodeId, personId });
      }
    } else {
      console.log("Clicked node:", nodeData);
    }

    // Handle expand/collapse for non-person nodes
    const isExpanded = node.data("expanded");
    const label = node.data("label");

    if (isExpanded) {
      // Shrink back to dot (unless global labels are visible)
      if (!showNodeLabels.value) {
        node.style({
          width: 20,
          height: 20,
          label: "",
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
        "text-wrap": "wrap",
      });
      node.data("expanded", true);
    }
  });

  // Track drag state so we can move descendants with their parent
  let dragState = null;

  // Guard against Vue reactivity triggering regenerateGraph during drag
  cyInstance.on("grabon", "node", (evt) => {
    isDragging.value = true;
    const node = evt.target;
    const successors = node.successors("node");
    if (successors.length > 0) {
      dragState = {
        node,
        lastPos: { ...node.position() },
        successors,
      };
    }
  });
  cyInstance.on("freeon", "node", () => {
    isDragging.value = false;
    dragState = null;
  });

  // When dragging a node that has descendants, move them by the same delta
  cyInstance.on("drag", "node", (evt) => {
    if (!dragState || evt.target !== dragState.node) return;
    const node = evt.target;
    const curPos = node.position();
    const dx = curPos.x - dragState.lastPos.x;
    const dy = curPos.y - dragState.lastPos.y;
    dragState.successors.forEach((s) => {
      const p = s.position();
      s.position({ x: p.x + dx, y: p.y + dy });
    });
    dragState.lastPos = { ...curPos };
  });

  // Emit position changed after drag ends
  cyInstance.on("dragfreeon", "node", (evt) => {
    const node = evt.target;
    const newPosition = node.position();
    emit("nodePositionChanged", {
      nodeId: node.id(),
      position: newPosition,
    });
  });

  // Show name on hover for person nodes (hide image, show label with background)
  cyInstance.on("mouseover", "node[type='person']", (evt) => {
    const node = evt.target;
    const isDark = appStore.isDarkMode;
    node.style({
      "background-image": "none",
      "background-color": isDark ? "#000000" : "#ffffff",
      label: node.data("label"),
      color: isDark ? "#ffffff" : "#000000",
    });
  });

  cyInstance.on("mouseout", "node[type='person']", (evt) => {
    const node = evt.target;
    node.style({
      "background-image": node.data("photo"),
      label: "",
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
        "text-wrap": "wrap",
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
        label: "",
      });
    }
  });
};

// Helper function to find person ID from any node ID.
// Node IDs: person-{UUID} | {layerKey}-{UUID}-c{idx}[-c{subIdx}...]
// UUID is always 36 chars, so after stripping the layerKey prefix we take slice(0,36).
const findPersonIdFromNodeId = (nodeId) => {
  if (!nodeId) return null;

  if (nodeId.startsWith("person-")) {
    return nodeId;
  }

  for (const layer of layers) {
    const prefix = `${layer.key}-`;
    if (nodeId.startsWith(prefix)) {
      const withoutPrefix = nodeId.slice(prefix.length); // '{UUID}-c{idx}...'
      // UUID is always 36 characters
      if (withoutPrefix.length >= 36) {
        return `person-${withoutPrefix.slice(0, 36)}`;
      }
    }
  }

  return null;
};

// Helper function to fade elements in/out
const fadeElements = (elements, opacity, duration = 300) => {
  elements.style({
    opacity: opacity,
    "transition-property": "opacity",
    "transition-duration": `${duration}ms`,
  });
};

// Function to find and zoom to the nearest person from a click position
const zoomToNearestPerson = (clickPos) => {
  if (!cyInstances.value || !cyInstances.value.has("main")) return;

  const mainCy = cyInstances.value.get("main");
  const personNodes = mainCy.$('node[type="person"]');

  if (personNodes.length === 0) return;

  let nearestPerson = null;
  let minDistance = Infinity;

  personNodes.forEach((personNode) => {
    const personPos = personNode.renderedPosition();
    const distance = Math.sqrt(
      Math.pow(clickPos.x - personPos.x, 2) +
        Math.pow(clickPos.y - personPos.y, 2),
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestPerson = personNode;
    }
  });

  if (nearestPerson) {
    zoomToPersonGraph(nearestPerson.id(), props.panelBottomOffset ?? 0);
  }
};

// Zoom to a person's graph. Optional fitToNodeId: fit directly to that chip node (single smooth motion).
// bottomOffset: reserved for panel; container is already resized, so fit uses visible area.
const zoomToPersonGraph = (personId, bottomOffset = 0, fitToNodeId = null) => {
  if (!cyInstances.value || !cyInstances.value.has("main") || isZooming.value)
    return;

  const mainCy = cyInstances.value.get("main");

  // Ensure Cytoscape has latest container dimensions before fit (critical when panel is open)
  if (bottomOffset > 0) mainCy.resize();

  const personNode = mainCy.$(`#${personId}`);

  if (personNode.length === 0) return;

  const alreadyZoomedToPerson =
    isZoomedToPerson.value && currentZoomedPerson.value === personId;

  // Without fitToNodeId: skip if already zoomed (avoids re-fit on person node click)
  if (!fitToNodeId && alreadyZoomedToPerson) return;

  isZooming.value = true;

  const personGraph = personNode.connectedNodes().add(personNode);

  // Fit target: single node or full person graph
  let fitTarget = personGraph;
  const basePadding = fitToNodeId ? 80 : 100;

  if (fitToNodeId) {
    const targetNode = mainCy.$(`#${fitToNodeId}`);
    if (targetNode.length > 0) fitTarget = targetNode;
  }

  // Container is resized when panel is open (height: calc(100vh - panelPx)), so fit
  // naturally centers in the visible area. Use uniform padding.
  const fitPadding = basePadding;

  const animOpts = {
    fit: {
      eles: fitTarget,
      padding: fitPadding,
    },
    duration: 600,
    easing: "ease-in-out",
  };


  // Only fade other people's graphs when not already zoomed to this person
  if (!alreadyZoomedToPerson) {
    const allPersonNodes = mainCy.$('node[type="person"]');
    const otherPersonNodes = allPersonNodes.difference(personNode);
    let allOtherElements = mainCy.collection();
    otherPersonNodes.forEach((otherPerson) => {
      const otherPersonId = otherPerson.id().replace("person-", "");
      let otherPersonLayerNodes = mainCy.collection();
      for (const layer of layers) {
        otherPersonLayerNodes = otherPersonLayerNodes.union(
          mainCy.$(`node[id^="${layer.key}-${otherPersonId}-"]`)
        );
      }
      const otherPersonEdges = otherPerson.connectedEdges();
      allOtherElements = allOtherElements
        .union(otherPerson)
        .union(otherPersonLayerNodes)
        .union(otherPersonEdges);
    });
    fadeElements(allOtherElements, 0.1, 300);
  }

  mainCy.animate(animOpts);

  isZoomedToPerson.value = true;
  currentZoomedPerson.value = personId;
  emit("zoomStateChanged", { isZoomed: true, personId });

  setTimeout(() => {
    isZooming.value = false;
  }, 660);
};

// Zoom to a specific chip node. Delegates to zoomToPersonGraph for a single smooth animation.
const zoomToNode = (nodeId, bottomOffset = 0) => {
  const personId = findPersonIdFromNodeId(nodeId);
  if (personId) zoomToPersonGraph(personId, bottomOffset, nodeId);
};

// Function to zoom back to full view with animation
const zoomToFullView = () => {
  if (!cyInstances.value || !cyInstances.value.has("main") || isZooming.value)
    return;

  isZooming.value = true; // Set flag to prevent double zooming

  const mainCy = cyInstances.value.get("main");

  // First show all elements again with fade in effect
  const allElements = mainCy.elements();
  fadeElements(allElements, 1, 300);

  // Fit to all elements with animation and custom padding
  mainCy.animate({
    fit: {
      padding: {
        left: 300,
        right: 300,
        top: 100,
        bottom: 100,
      },
    },
    center: true,
    duration: 800,
    easing: "ease-in-out",
  });

  // Update state
  isZoomedToPerson.value = false;
  currentZoomedPerson.value = null;

  // Emit event to notify parent components about zoom state change
  emit("zoomStateChanged", {
    isZoomed: false,
    personId: null,
  });

  // Reset flag after animation completes
  setTimeout(() => {
    isZooming.value = false;
  }, 900); // Slightly longer than animation duration
};

// Function to regenerate the graph with updated person data
const regenerateGraph = () => {
  if (
    !cyInstances.value ||
    cyInstances.value.size === 0 ||
    !props.people ||
    isUpdatingSnapshot.value
  )
    return;

  try {
    // Clear all existing instances
    cyInstances.value.forEach((cy) => {
      if (cy) {
        cy.elements().remove();
      }
    });

    // Reinitialize all graphs
    initializeAllGraphs();
  } catch (error) {
    console.error("Error regenerating graphs:", error);
  }
};

// Function to initialize all graphs for all people
const initializeAllGraphs = () => {
  if (!props.people || props.people.length === 0) return;

  // Clear existing instances
  cyInstances.value.forEach((cy) => {
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
  cyInstances.value.set(
    "main",
    cytoscape({
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
        animate: false,
      },
      minZoom: 0.1, // Allow more zoom out to see all graphs
      maxZoom: 2,
      wheelSensitivity: 1, // 1 = default; 0.3 was too low (felt sluggish)
      autoungrabify: false,
      autolock: false,
    }),
  );

  const mainCy = cyInstances.value.get("main");

  // Center the view and ensure proper fit with custom padding
  mainCy.fit({
    padding: {
      left: 300,
      right: 300,
      top: 100,
      bottom: 100,
    },
  });
  mainCy.center();

  // Force a resize to ensure proper rendering
  setTimeout(() => {
    mainCy.resize();
    mainCy.fit({
      padding: {
        left: 300,
        right: 300,
        top: 100,
        bottom: 100,
      },
    });
    mainCy.center();

    // Force style refresh to ensure person node sizes are applied
    mainCy.style().update();

    // Explicitly set person node sizes to ensure they're applied
    const personElements = mainCy.$('node[type="person"]');
    personElements.forEach((personElement) => {
      const personElementData = personElement.data();
      if (personElementData.nodeSize) {
        personElement.style({
          width: personElementData.nodeSize,
          height: personElementData.nodeSize,
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
    if (newPeople && newPeople.length > 0 && !isUpdatingSnapshot.value && !isDragging.value) {
      // If people data changes and instances exist, regenerate the graphs
      regenerateGraph();
    }
  },
  { immediate: true, deep: true },
);

// Watch for changes to layer chip data (structure or content)
watch(
  () => props.people?.map((p) => JSON.stringify([p.layer1, p.layer2, p.layer3])),
  (newVal, oldVal) => {
    if (
      cyInstances.value.size > 0 &&
      props.people &&
      JSON.stringify(newVal) !== JSON.stringify(oldVal) &&
      !isUpdatingSnapshot.value &&
      !isDragging.value
    ) {
      regenerateGraph();
    }
  },
  { deep: true },
);

// Function to save the current graph snapshot to the person
const saveGraphSnapshot = async () => {
  if (!cyInstances.value || cyInstances.value.size === 0 || !props.people)
    return;

  try {
    isUpdatingSnapshot.value = true;

    const mainCy = cyInstances.value.get("main");
    if (!mainCy) return;

    // For now, we'll save the entire graph state
    // In the future, you might want to save individual person snapshots
    const nodes = mainCy.nodes().map((node) => ({
      id: node.id(),
      label: node.data("label"),
      type: node.data("type"),
      photo: node.data("photo"),
      nodeSize: node.data("nodeSize"),
      position: node.position(),
    }));

    const edges = mainCy.edges().map((edge) => ({
      id: edge.id(),
      source: edge.source().id(),
      target: edge.target().id(),
      label: edge.data("label"),
    }));

    const graphSnapshot = { nodes, edges };

    // Emit event for parent components
    emit("graphSnapshotSaved", graphSnapshot);
  } catch (error) {
    console.error("Error saving graph snapshot:", error);
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
  console.log("Update node position:", nodeId, newPosition);
};

// Expose methods for parent components
defineExpose({
  saveGraphSnapshot,
  updateNodePosition,
  regenerateGraph,
  zoomToPersonGraph,
  zoomToNode,
  zoomToFullView,
});

onMounted(async () => {
  // Initialize dark mode if not already done
  if (typeof appStore.isDarkMode === "undefined") {
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
  if (cyInstances.value.get("main")) {
    // Check if mainCy exists
    const mainCy = cyInstances.value.get("main");
    const nodes = mainCy.nodes();

    nodes.forEach((node) => {
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
            "text-wrap": "wrap",
          });
        } else {
          // Hide ALL labels including clicked/expanded nodes
          node.style({
            width: 20,
            height: 20,
            label: "",
          });
          node.data("expanded", false);
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
  cyInstances.value.forEach((cy) => {
    if (cy) {
      cy.destroy();
    }
  });
  cyInstances.value.clear();
});
</script>

<template>
  <div
    class="interactive-cytoscape-view"
    :class="{
      'dark-mode': appStore.isDarkMode,
      fullscreen: appStore.isFullscreen,
      'panel-open': (props.panelBottomOffset ?? 0) > 0,
    }"
    :style="containerStyle"
  >
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
  overflow: auto;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1;

  &.fullscreen {
    z-index: 2;
  }

  /* When panel open: constrain so fit() centers in visible area above panel */
  &.panel-open {
    overflow: hidden;
  }
}

.cytoscape-container {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: var(--graph-background-color);
  transition: background-color 0.3s ease;
  min-width: max-content;
  min-height: max-content;
}

/* When panel open, prevent containers from expanding past viewport */
.interactive-cytoscape-view.panel-open .cytoscape-container,
.interactive-cytoscape-view.panel-open .cy-container {
  min-width: 0;
  min-height: 0;
}

.cy-container {
  width: 100%;
  height: 100%;
  background-color: var(--graph-background-color);
  transition: background-color 0.3s ease;
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
