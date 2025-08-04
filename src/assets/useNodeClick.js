import { ref } from "vue";
import { select, selectAll } from "d3-selection";

export function useNodeClick(cy, svg, people) {
  const isNodeView = ref(false);
  const currentHoveredEdge = ref(null);
  const currentHoveredSourceNode = ref(null);
  const currentHoveredTargetNode = ref(null);
  let clickTimeout = null;

  const handleNodeClick = async (event) => {
    // Prevent multiple rapid clicks
    if (clickTimeout) {
      return;
    }
    
    clickTimeout = setTimeout(() => {
      clickTimeout = null;
    }, 1000); // Prevent clicks for 1 second after a click
    if (!cy || !svg) {
      console.error("Cytoscape instance or SVG not available");
      return;
    }
    
    const node = event.target;
    
    // Debug: Check node data
    console.log("Clicked node data:", node.data());
    console.log("Node has photo attribute:", node.data().hasPhoto);
    console.log("Node photo URL:", node.data().photo);

    // Get people data from node.data().id
    const personData = people.find((p) => p.name === node.data().id);
    if (!personData) {
      console.error("Person data not found for:", node.data().id);
      return;
    }
    
    const { values, vision, vehicles, name } = personData;

    // Hide all other nodes, edges, and labels
    cy.elements().not(node).style({
      display: "none",
    });
    // Remove custom labels
    document.querySelectorAll(".edge-label").forEach((el) => el.remove());

    // Hide node label
    node.style({
      "text-opacity": 0,
    });

    // Hide UI elements (safely check if they exist)
    const uiElements = ["members", "ai", "ai-summary", "wg"];
    uiElements.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.style.opacity = "0";
      }
    });
    
    // Show UI
    const nameElement = document.getElementById("name");
    const n1Element = document.getElementById("n1");
    if (nameElement && n1Element) {
      nameElement.style.opacity = "1";
      n1Element.textContent = name.toUpperCase();
    }

    // Show the zoom-out button
    const zoomOutElement = document.getElementById("zoom-out");
    if (zoomOutElement) {
      zoomOutElement.style.opacity = "1";
    }

    // Remove any circles and text
    svg.selectAll("circle").remove();
    svg.selectAll("foreignObject").remove();

    // Create circles around the node
    const nodePosition = node.renderedPosition();
    const nodeSize = node.renderedOuterWidth();
    const radius_1 = nodeSize * 2;
    const radius_2 = nodeSize * 1.5;
    const radius_3 = nodeSize * 1;
    const radius_4 = nodeSize * 0.5;

    const data = [
      { onion: "person", children: [] },
      { onion: "values", children: values },
      { onion: "vision", children: vision },
      {
        onion: "vehicles",
        children: vehicles.map((v) => (typeof v === "string" ? v : v.org)),
      },
    ];

    // Create the mask element
    const mask = svg.append("mask").attr("id", "seeThroughMask");

    // Define the mask content
    mask
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "white");

    mask
      .append("circle")
      .attr("cx", nodePosition.x)
      .attr("cy", nodePosition.y)
      .attr("r", nodeSize * 1.4)
      .attr("fill", "black");

    const layerWidths = [radius_4, radius_3, radius_2, radius_1];
    const len = layerWidths.length;

    const layers = svg.selectAll(".onion").data(data.reverse()).enter();

    const circles = layers
      .append("circle")
      .attr("class", "onion")
      .attr("fill", "none")
      .attr("cx", nodePosition.x)
      .attr("cy", nodePosition.y)
      .attr("r", 0) // Start with a radius of 0 for animation
      .attr("stroke", "grey")
      .attr("stroke-opacity", 0.3)
      .attr("mask", "url(#seeThroughMask)")
      .on("mouseover", function (event, d) {
        // Don't do anything if hovering person
        if (d.onion === "person") return;

        // Set the fill of the hovered circle to grey with some transparency
        select(this).attr("fill", "rgba(238, 238, 238, 0.8)");

        // Other rings not mousedover fill white with some transparency
        selectAll(".onion")
          .filter(function () {
            return (
              this !== event.target && select(this).datum().onion !== "person"
            );
          })
          .attr("fill", "rgba(255, 255, 255, 0.8)");

        // Make sure the person circle never gets filled
        selectAll(".onion")
          .filter(function () {
            return select(this).datum().onion === "person";
          })
          .attr("fill", "none");

        // Show UI (safely check if elements exist)
        if (d.onion === "values") {
          const valuesElement = document.getElementById("values");
          const visionElement = document.getElementById("vision");
          const vehiclesElement = document.getElementById("vehicles");
          if (valuesElement) valuesElement.style.opacity = "1";
          if (visionElement) visionElement.style.opacity = "0";
          if (vehiclesElement) vehiclesElement.style.opacity = "0";
        } else if (d.onion === "vision") {
          const valuesElement = document.getElementById("values");
          const visionElement = document.getElementById("vision");
          const vehiclesElement = document.getElementById("vehicles");
          if (valuesElement) valuesElement.style.opacity = "0";
          if (visionElement) visionElement.style.opacity = "1";
          if (vehiclesElement) vehiclesElement.style.opacity = "0";
        } else if (d.onion === "vehicles") {
          const valuesElement = document.getElementById("values");
          const visionElement = document.getElementById("vision");
          const vehiclesElement = document.getElementById("vehicles");
          if (valuesElement) valuesElement.style.opacity = "0";
          if (visionElement) visionElement.style.opacity = "0";
          if (vehiclesElement) vehiclesElement.style.opacity = "1";
        }
      })
      .on("mouseout", function () {
        // Set the fill of all circles back to none
        selectAll(".onion").attr("fill", "none");
        
        // Hide UI elements (safely check if they exist)
        const uiElements = ["values", "vision", "vehicles"];
        uiElements.forEach(id => {
          const element = document.getElementById(id);
          if (element) {
            element.style.opacity = "0";
          }
        });
      });

    const pointsOfPassion = layers
      .selectAll(".passion")
      .data((d, i) =>
        d.children.map((e) => ({ item: e, i, len: d.children.length })),
      );

    const passionGroup = pointsOfPassion
      .enter()
      .append("g")
      .attr("transform", `translate(${nodePosition.x}, ${nodePosition.y})`);

    passionGroup
      .append("circle")
      .attr("class", "person")
      .attr("fill", "none")
      .attr("r", nodeSize / 4);

    const textElements = passionGroup
      .append("foreignObject")
      .attr("class", "passion-name")
      .attr("width", 100)
      .attr("height", 200)
      .attr("x", -50)
      .attr("y", -10)
      .append("xhtml:div")
      .style("display", "flex")
      .style("justify-content", "center")
      .style("align-items", "center")
      .style("color", "black")
      .style("font-size", "13px")
      .style("text-align", "center")
      .style("white-space", "pre-wrap")
      .style("font-family", "'Montserrat', sans-serif")
      .text((d) => d.item);

    function updateCircleAndTextPosition(startTime) {
      const elapsed = Date.now() - startTime;
      const duration = 600; // Reduced from 1000ms to 600ms for faster response

      const updatedPosition = node.renderedPosition();
      const updatedNodeSize = node.renderedOuterWidth();
      const updatedLayerWidths = [
        updatedNodeSize * 2,
        updatedNodeSize * 1.5,
        updatedNodeSize * 1,
        updatedNodeSize * 0.5,
      ];

      const t = Math.min(elapsed / duration, 1); // calculate progress (0 to 1)
      
      // Use easing function for smoother animation
      const easeOut = 1 - Math.pow(1 - t, 3);

      // Update circle positions less frequently
      if (t % 0.1 < 0.05) { // Only update every 10% of progress
        svg
          .selectAll("circle")
          .attr("cx", updatedPosition.x)
          .attr("cy", updatedPosition.y);
      }

      circles.attr("r", (d, i) => easeOut * updatedLayerWidths[i]);

      passionGroup.attr("transform", (d, j) => {
        const r2 = updatedLayerWidths[d.i] - 37;
        const theta = ((2 * Math.PI) / d.len) * j;
        const x = updatedPosition.x + easeOut * r2 * Math.sin(theta);
        const y = updatedPosition.y - easeOut * r2 * Math.cos(theta);
        return `translate(${x}, ${y})`;
      });

      textElements.style("opacity", easeOut); // transition opacity from 0 to 1

      if (t < 1) {
        // Use setTimeout instead of requestAnimationFrame for less frequent updates
        setTimeout(() => updateCircleAndTextPosition(startTime), 16); // ~60fps
      }
    }

    updateCircleAndTextPosition(Date.now());

    cy.animate({
      fit: {
        eles: node.closedNeighborhood(),
        padding: 310,
      },
      zoom: {
        level: 5,
        position: {
          x: node.position("x"),
          y: node.position("y"),
        },
      },
      duration: 600, // Reduced from 1000ms to 600ms for faster response
    });
  };

  return {
    isNodeView,
    currentHoveredEdge,
    currentHoveredSourceNode,
    currentHoveredTargetNode,
    handleNodeClick,
    // Cleanup function
    cleanup: () => {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
        clickTimeout = null;
      }
    }
  };
}
