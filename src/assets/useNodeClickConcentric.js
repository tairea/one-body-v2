// @ts-check
import { ref } from "vue";
import { useAppStore } from "../stores/app.js";

export function useNodeClickConcentric(cy, svg, people) {
  const appStore = useAppStore();
  const isNodeView = ref(false);
  let clickTimeout = null;
  let originalElements = null;
  let concentricElements = null;
  let originalPersonPosition = null; // Store original person position
  let personNodeId = null; // Store person node ID

  const handleNodeClick = async (event) => {
    // Prevent multiple rapid clicks
    if (clickTimeout) {
      return;
    }

    clickTimeout = setTimeout(() => {
      clickTimeout = null;
    }, 1000);

    if (!cy) {
      console.error("Cytoscape instance not available");
      return;
    }

    const node = event.target;

    // Get people data from node.data().id
    const personData = people.find((p) => p.name === node.data().id);
    if (!personData) {
      console.error("Person data not found for:", node.data().id);
      return;
    }

    // Save person data to store
    appStore.setCurrentPersonData(personData);
    appStore.setViewingProfile(true);

    const { values, visions, vehicles, name } = personData;

    // Store original elements for restoration
    originalElements = cy.elements();
    originalPersonPosition = node.position(); // Store original position
    personNodeId = node.data("id"); // Store person node ID

    // Hide all other nodes except the clicked one
    cy.elements().not(node).hide();

    // Create concentric data
    const nodes = [];
    const edges = [];

    // Values layer (inner circle)
    values.forEach((value, index) => {
      const nodeId = `value-${index}`;
      nodes.push({
        data: {
          id: nodeId,
          label: value,
          layer: "values",
        },
      });
      edges.push({
        data: {
          id: `edge-person-${nodeId}`,
          source: node.data("id"),
          target: nodeId,
        },
      });
    });

    // Vision layer (middle circle)
    visions.forEach((visionItem, index) => {
      const nodeId = `vision-${index}`;
      nodes.push({
        data: {
          id: nodeId,
          label: visionItem,
          layer: "visions",
        },
      });
      edges.push({
        data: {
          id: `edge-person-${nodeId}`,
          source: node.data("id"),
          target: nodeId,
        },
      });
    });

    // Vehicles layer (outer circle)
    vehicles.forEach((vehicle, index) => {
      const nodeId = `vehicle-${index}`;
      const vehicleName = typeof vehicle === "string" ? vehicle : vehicle.org;
      nodes.push({
        data: {
          id: nodeId,
          label: vehicleName,
          layer: "vehicles",
        },
      });
      edges.push({
        data: {
          id: `edge-person-${nodeId}`,
          source: node.data("id"),
          target: nodeId,
        },
      });
    });

    // Add concentric elements to the existing graph
    const addedNodes = cy.add(nodes);
    const addedEdges = cy.add(edges);
    concentricElements = addedNodes.union(addedEdges).union(node); // Include the person node

    // Apply styles to concentric elements

    // Apply concentric layout
    cy.layout({
      name: "concentric",
      animate: true,
      fit: true,
      padding: 100,
      duration: 1000,
      concentric: function (node) {
        // Person node gets level 0 (center), others get higher levels
        if (node.data("layer") === "values") return 3; // Inner circle (closest to center)
        if (node.data("layer") === "visions") return 2; // Middle circle
        if (node.data("layer") === "vehicles") return 1; // Outer circle (furthest from center)
        return 4; // Person node stays in center
      },
      levelWidth: function (nodes) {
        return 1;
      },
      // Apply layout to all concentric elements including person node
      eles: concentricElements,
    }).run();

    // Animate to center the view on the person node
    // cy.animate({
    //   fit: {
    //     eles: node,
    //     padding: 100,
    //   },
    //   zoom: {
    //     level: 2,
    //   },
    //   duration: 1000,
    // });
  };

  const handleZoomOut = () => {
    // Reset the store flag and clear person data
    appStore.setViewingProfile(false);
    appStore.clearCurrentPersonData();
    appStore.clearActiveProfileSection();

    // Remove concentric elements
    if (concentricElements) {
      concentricElements.remove();
      concentricElements = null;
    }

    // Show all original elements
    if (originalElements) {
      originalElements.show();
      originalElements = null;
    }

    // Restore original person position if we have it
    if (originalPersonPosition) {
      const personNode = cy.$id(personNodeId);
      if (personNode.length > 0) {
        personNode.position(originalPersonPosition);
      }
      originalPersonPosition = null;
    }

    // Reset view
    cy.animate({
      fit: {
        eles: cy.elements(),
        padding: 120,
      },
      zoom: {
        level: 1,
      },
      duration: 1000,
    });
  };

  return {
    isNodeView,
    handleNodeClick,
    handleZoomOut,
    // Cleanup function
    cleanup: () => {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
        clickTimeout = null;
      }
    },
  };
}
