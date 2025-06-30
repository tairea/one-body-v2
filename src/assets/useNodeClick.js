import { ref } from "vue";
import { select, selectAll } from "d3-selection";

export function useNodeClick(cy, svg, people) {
  const isNodeView = ref(false);
  const currentHoveredEdge = ref(null);
  const currentHoveredSourceNode = ref(null);
  const currentHoveredTargetNode = ref(null);

  const handleNodeClick = async (event) => {
    const node = event.target;

    // Get people data from node.data().id
    const personData = people.find((p) => p.name === node.data().id);
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

    // Hide UI
    document.getElementById("members").style.opacity = "0";
    document.getElementById("ai").style.opacity = "0";
    document.getElementById("ai-summary").style.opacity = "0";
    document.getElementById("wg").style.opacity = "0";
    // Show UI
    document.getElementById("name").style.opacity = "1";
    document.getElementById("n1").textContent = name.toUpperCase();

    // Show the zoom-out button
    document.getElementById("zoom-out").style.opacity = "1";

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

        // Show UI
        if (d.onion === "values") {
          document.getElementById("values").style.opacity = "1";
          document.getElementById("vision").style.opacity = "0";
          document.getElementById("vehicles").style.opacity = "0";
        } else if (d.onion === "vision") {
          document.getElementById("values").style.opacity = "0";
          document.getElementById("vision").style.opacity = "1";
          document.getElementById("vehicles").style.opacity = "0";
        } else if (d.onion === "vehicles") {
          document.getElementById("values").style.opacity = "0";
          document.getElementById("vision").style.opacity = "0";
          document.getElementById("vehicles").style.opacity = "1";
        }
      })
      .on("mouseout", function () {
        // Set the fill of all circles back to none
        selectAll(".onion").attr("fill", "none");
        document.getElementById("values").style.opacity = "0";
        document.getElementById("vision").style.opacity = "0";
        document.getElementById("vehicles").style.opacity = "0";
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
      const duration = 1000; // duration of the animation in milliseconds

      const updatedPosition = node.renderedPosition();
      const updatedNodeSize = node.renderedOuterWidth();
      const updatedLayerWidths = [
        updatedNodeSize * 2,
        updatedNodeSize * 1.5,
        updatedNodeSize * 1,
        updatedNodeSize * 0.5,
      ];

      const t = Math.min(elapsed / duration, 1); // calculate progress (0 to 1)

      svg
        .selectAll("circle")
        .attr("cx", updatedPosition.x)
        .attr("cy", updatedPosition.y);

      circles.attr("r", (d, i) => t * updatedLayerWidths[i]);

      passionGroup.attr("transform", (d, j) => {
        const r2 = updatedLayerWidths[d.i] - 37;
        const theta = ((2 * Math.PI) / d.len) * j;
        const x = updatedPosition.x + t * r2 * Math.sin(theta);
        const y = updatedPosition.y - t * r2 * Math.cos(theta);
        return `translate(${x}, ${y})`;
      });

      textElements.style("opacity", t); // transition opacity from 0 to 1

      if (t < 1) {
        requestAnimationFrame(() => updateCircleAndTextPosition(startTime));
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
      duration: 1000,
    });
  };

  return {
    isNodeView,
    currentHoveredEdge,
    currentHoveredSourceNode,
    currentHoveredTargetNode,
    handleNodeClick,
  };
}
