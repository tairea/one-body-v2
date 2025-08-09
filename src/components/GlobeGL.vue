<template>
  <div class="globe-wrapper">
    <div
      ref="globeContainer"
      class="globe-container"
      :class="{ 'dark-mode': appStore.isDarkMode }"
    ></div>

    <!-- Person Detail View -->
    <PersonDetailView
      v-if="selectedPerson"
      :person="selectedPerson"
      :is-visible="showPersonDetail"
      @back-to-globe="handleBackToGlobe"
      @image-loaded="onPersonImageLoaded"
    />
  </div>
</template>

<script>
import Globe from "globe.gl";
import { FrontSide } from "three";
import * as THREE from "three";
import { useAppStore } from "../stores/app";
import { dWebColors, getPhotoUrl } from "../lib/utils.js";
import PersonDetailView from "./PersonDetailView.vue";
/** @import { Person } from "../types.d.ts" */

/**
 * @param {Readonly<Person>} person
 * @returns {boolean}
 */
const doesPersonHaveLocation = (person) =>
  typeof person.locationLatitude === "number" &&
  typeof person.locationLongitude === "number";

export default {
  name: "GlobeGL",
  components: {
    PersonDetailView,
  },
  props: ["people"],
  data() {
    return {
      globe: null,
      /** @type {null | Person} */
      selectedPerson: null,
      showPersonDetail: false,
      personMeshes: new Map(), // Store references to person meshes for click detection
      /** @type {null | ((event: MouseEvent) => unknown)} */
      clickListener: null,
      /** @type {null | ((event: MouseEvent) => unknown)} */
      hoverListener: null,
    };
  },
  computed: {
    appStore() {
      return useAppStore();
    },
  },
  mounted() {
    this.initGlobe();
  },

  beforeUnmount() {
    // Clean up event listeners
    if (this.clickListener) {
      window.removeEventListener("click", this.clickListener);
    }
    if (this.hoverListener) {
      window.removeEventListener("mousemove", this.hoverListener);
    }
  },
  watch: {
    "appStore.isDarkMode"() {
      this.updateTheme();
    },
    "appStore.activeComponent"(newComponent) {
      // Pause/resume globe based on active component
      if (this.globe) {
        if (newComponent === "globe") {
          this.resumeGlobe();
        } else {
          this.pauseGlobe();
        }
      }
    },
  },
  methods: {
    async initGlobe() {
      // Fetch countries data
      const countries = await fetch(
        "https://unpkg.com/globe.gl/example/datasets/ne_110m_admin_0_countries.geojson",
      ).then((res) => res.json());

      // Initialize globe with hex polygons
      this.globe = new Globe(this.$refs.globeContainer)
        .backgroundColor(this.appStore.isDarkMode ? "#2d3748" : "#ffffff")
        .width(window.innerWidth)
        .height(window.innerHeight)
        .globeImageUrl(null)
        .showAtmosphere(true)
        .atmosphereColor(this.appStore.isDarkMode ? "#4a5568" : "#e0e0e0")
        .atmosphereAltitude(0.15)
        .globeMaterial({
          color: this.appStore.isDarkMode ? "#4a5568" : "#ffffff",
          transparent: false,
          opacity: 1,
          side: FrontSide,
          wireframe: false,
          flatShading: true,
        })
        .hexPolygonsData(countries.features)
        .hexPolygonResolution(3)
        .hexPolygonMargin(0.3)
        .hexPolygonUseDots(true)
        .hexPolygonColor(() =>
          this.appStore.isDarkMode ? "#718096" : "#a0aec0",
        )
        .pointOfView({ lat: 0, lng: 0, altitude: 1.8 });

      // Add people locations with photos
      this.addPeopleLocations();

      // Add arc connections to Camp Navarro
      this.addArcConnections();

      // Enable auto-rotation through controls
      this.globe.controls().autoRotate = true;
      this.globe.controls().autoRotateSpeed = 0.5;

      // Set up click detection for person meshes
      this.setupPersonClickDetection();

      // Set up hover effects for person meshes
      this.setupHoverEffects();
    },

    addPeopleLocations() {
      // Convert people data to points format
      /** @type {Person[]} */ const people = this.people;

      const peoplePoints = people
        .filter(doesPersonHaveLocation)
        .map((person) => ({
          lat: person.locationLatitude,
          lng: person.locationLongitude,
          name: person.name,
          photo: person.hasPhoto
            ? getPhotoUrl(person, location.href)
            : undefined,
          type: "person",
        }));

      console.log("People points:", peoplePoints.slice(0, 3)); // Debug first 3 people

      // Add separate points layer for labels and interactions
      this.globe
        .pointsData(peoplePoints)
        .pointColor(() => "transparent")
        .pointAltitude(0.05)
        .pointRadius(0.01)
        .pointsMerge(false)
        .pointResolution(12)
        .onPointClick((point) => {
          console.log("Clicked on:", point.name);
        })
        .pointLabel(
          (point) => `
          <div style="
            display: flex;
            flex-direction: column;
            align-items: center;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 8px;
            padding: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            border: 2px solid #e2e8f0;
            min-width: 80px;
            text-align: center;
          ">
            <div style="
              font-size: 10px;
              font-weight: 600;
              color: #2d3748;
              line-height: 1.2;
              max-width: 70px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            ">${point.name}</div>
          </div>
        `,
        );
    },

    addArcConnections() {
      // Camp Navarro coordinates in California
      const campNavarro = { lat: 39.1911, lng: -123.7647 };

      // Create arc data connecting each person to Camp Navarro
      /** @type {Person[]} */ const people = this.people;
      const arcData = people
        .filter(doesPersonHaveLocation)
        .map((person, index) => ({
          startLat: person.locationLatitude,
          startLng: person.locationLongitude,
          endLat: campNavarro.lat,
          endLng: campNavarro.lng,
          color: dWebColors[index % dWebColors.length], // Cycle through dWebColors
          name: person.name,
        }));

      // Add arcs layer
      this.globe
        .arcsData(arcData)
        .arcColor("color")
        .arcAltitude(0.3)
        .arcStroke(0.5)
        .arcCurveResolution(64)
        .onArcClick((arc) => {
          console.log("Clicked on arc to:", arc.name);
        })
        .arcLabel(
          (arc) => `
          <div style="
            background: rgba(255, 255, 255, 0.95);
            border-radius: 6px;
            padding: 6px 10px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            border: 1px solid #e2e8f0;
            font-size: 11px;
            font-weight: 600;
            color: #2d3748;
            white-space: nowrap;
          ">${arc.name} → Camp Navarro</div>
        `,
        );

      // Add combined custom layer for people photos and Camp Navarro logo
      this.addCombinedCustomLayer(campNavarro);
    },

    addCombinedCustomLayer(campNavarro) {
      // Convert people data to points format
      /** @type {Person[]} */ const people = this.people;
      const peoplePoints = people.map((person) => ({
        lat: person.locationLatitude,
        lng: person.locationLongitude,
        name: person.name,
        photo: person.hasPhoto ? getPhotoUrl(person, location.href) : undefined,
        type: "person",
      }));

      // Add Camp Navarro to the points
      const allPoints = [
        ...peoplePoints,
        {
          lat: campNavarro.lat,
          lng: campNavarro.lng,
          name: "Camp Navarro",
          logo: "/org_logo_DWeb.jpeg",
          type: "camp",
        },
      ];

      // Create a custom layer for all markers
      this.globe.customLayerData(allPoints).customThreeObject((point) => {
        if (point.type === "person") {
          // Create a plane geometry for the person photo
          const geometry = new THREE.PlaneGeometry(10, 10);

          // Load the texture
          const textureLoader = new THREE.TextureLoader();
          const texture = textureLoader.load(point.photo);

          // Create a circular alpha mask
          const canvas = document.createElement("canvas");
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext("2d");

          // Create circular gradient
          const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
          gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
          gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

          // Fill with gradient
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, 256, 256);

          // Create alpha mask texture
          const alphaMask = new THREE.CanvasTexture(canvas);

          // Create material with the photo texture and circular alpha mask
          const material = new THREE.MeshBasicMaterial({
            map: texture,
            alphaMap: alphaMask,
            transparent: true,
            side: THREE.DoubleSide, // Visible from both sides
            alphaTest: 0.1,
          });

          // Create the mesh
          const mesh = new THREE.Mesh(geometry, material);

          // Position the mesh at the correct lat/lng coordinates
          const coords = this.globe.getCoords(point.lat, point.lng, 0.02);
          mesh.position.set(coords.x, coords.y, coords.z);

          // Orient the mesh to be flat against the globe surface at this location
          const normal = new THREE.Vector3(
            coords.x,
            coords.y,
            coords.z,
          ).normalize();
          const up = new THREE.Vector3(0, 1, 0);
          const right = new THREE.Vector3()
            .crossVectors(up, normal)
            .normalize();
          const correctedUp = new THREE.Vector3()
            .crossVectors(normal, right)
            .normalize();

          // Create a rotation matrix to orient the plane
          const matrix = new THREE.Matrix4();
          matrix.makeBasis(right, correctedUp, normal);
          mesh.setRotationFromMatrix(matrix);

          // Store reference to this mesh for click detection
          /** @type {Person[]} */ const people = this.people;
          const person = people.find((p) => p.name === point.name);
          if (person) {
            this.personMeshes.set(person, mesh);

            // Add user data to the mesh for identification
            mesh.userData = { person: person, type: "person" };
          }

          return mesh;
        } else if (point.type === "camp") {
          // Create a plane geometry for the Camp Navarro logo (slightly larger than person photos)
          const geometry = new THREE.PlaneGeometry(15, 15);

          // Load the DWeb logo texture
          const textureLoader = new THREE.TextureLoader();
          const texture = textureLoader.load(point.logo);

          // Create material with the logo texture
          const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            alphaTest: 0.1,
          });

          // Create the mesh
          const mesh = new THREE.Mesh(geometry, material);

          // Position the mesh at the correct lat/lng coordinates
          const coords = this.globe.getCoords(point.lat, point.lng, 0.03); // Slightly higher than person markers
          mesh.position.set(coords.x, coords.y, coords.z);

          // Orient the mesh to be flat against the globe surface at this location
          const normal = new THREE.Vector3(
            coords.x,
            coords.y,
            coords.z,
          ).normalize();
          const up = new THREE.Vector3(0, 1, 0);
          const right = new THREE.Vector3()
            .crossVectors(up, normal)
            .normalize();
          const correctedUp = new THREE.Vector3()
            .crossVectors(normal, right)
            .normalize();

          // Create a rotation matrix to orient the plane
          const matrix = new THREE.Matrix4();
          matrix.makeBasis(right, correctedUp, normal);
          mesh.setRotationFromMatrix(matrix);

          return mesh;
        }
      });

      // Add separate points layer for Camp Navarro label and interactions
      this.globe
        .pointsData([
          {
            lat: campNavarro.lat,
            lng: campNavarro.lng,
            name: "Camp Navarro",
          },
        ])
        .pointColor(() => "transparent")
        .pointAltitude(0.08)
        .pointRadius(0.01)
        .pointsMerge(false)
        .pointResolution(12)
        .onPointClick((point) => {
          console.log("Clicked on Camp Navarro");
        })
        .pointLabel(
          (point) => `
          <div style="
            background: rgba(255, 255, 255, 0.95);
            border-radius: 8px;
            padding: 8px 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            border: 2px solid #4299e1;
            font-size: 12px;
            font-weight: 700;
            color: #2d3748;
            white-space: nowrap;
            text-align: center;
          ">🏕️ Camp Navarro<br><span style="font-size: 10px; color: #718096;">DWeb Summit</span></div>
        `,
        );
    },

    updateTheme() {
      if (this.globe) {
        this.globe
          .backgroundColor(this.appStore.isDarkMode ? "#2d3748" : "#ffffff")
          .atmosphereColor(this.appStore.isDarkMode ? "#4a5568" : "#e0e0e0")
          .globeMaterial({
            color: this.appStore.isDarkMode ? "#4a5568" : "#ffffff",
            transparent: false,
            opacity: 1,
            side: FrontSide,
            wireframe: false,
            flatShading: true,
          })
          .hexPolygonColor(() =>
            this.appStore.isDarkMode ? "#718096" : "#a0aec0",
          );
      }
    },

    /**
     * @param {Person} person
     * @returns {void}
     */
    handlePersonClick(person) {
      console.log("Person clicked:", person.name);
      this.selectedPerson = person;
      this.showPersonDetail = true;

      // Animate camera to focus on the person's location
      this.animateToPerson(person);
    },

    /**
     * @param {Person} person
     * @returns {void}
     */
    animateToPerson(person) {
      if (this.globe && doesPersonHaveLocation(person)) {
        // Animate camera to focus on the person
        this.globe.pointOfView(
          {
            lat: person.locationLatitude,
            lng: person.locationLongitude,
            altitude: 0.5,
          },
          1000,
        ); // 1 second animation
      }
    },

    handleBackToGlobe() {
      this.showPersonDetail = false;

      // Animate back to default view
      setTimeout(() => {
        this.selectedPerson = null;
        if (this.globe) {
          this.globe.pointOfView({ lat: 0, lng: 0, altitude: 1.8 }, 1000);
        }
      }, 800); // Wait for transition to complete
    },

    onPersonImageLoaded() {
      // Optional: Add any additional animations when person image loads
      console.log("Person image loaded");
    },

    setupPersonClickDetection() {
      // Set up raycaster for detecting clicks on person meshes
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const onMouseClick = (event) => {
        // Don't handle clicks if person detail is visible
        if (this.showPersonDetail) {
          return;
        }

        // Calculate mouse position in normalized device coordinates
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Get the Three.js scene from the globe
        const scene = this.globe.scene();
        if (!scene) return;

        // Update the picking ray with the camera and mouse position
        raycaster.setFromCamera(mouse, this.globe.camera());

        // Get all person meshes
        const personMeshes = Array.from(this.personMeshes.values());

        // Check for intersections
        const intersects = raycaster.intersectObjects(personMeshes, true);

        if (intersects.length > 0) {
          const clickedMesh = intersects[0].object;
          const person = this.findPersonByMesh(clickedMesh);
          if (person) {
            this.handlePersonClick(person);
          }
        }
      };

      // Add click event listener
      window.addEventListener("click", onMouseClick);

      // Store the event listener for cleanup
      this.clickListener = onMouseClick;
    },

    findPersonByMesh(mesh) {
      // Find the person data associated with this mesh
      for (const [person, personMesh] of this.personMeshes.entries()) {
        if (personMesh === mesh) {
          return person;
        }
      }
      return null;
    },

    setupHoverEffects() {
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      let hoveredMesh = null;

      const onMouseMove = (event) => {
        // Don't handle hover if person detail is visible
        if (this.showPersonDetail) {
          return;
        }

        // Calculate mouse position in normalized device coordinates
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Get the Three.js scene from the globe
        const scene = this.globe.scene();
        if (!scene) return;

        // Update the picking ray with the camera and mouse position
        raycaster.setFromCamera(mouse, this.globe.camera());

        // Get all person meshes
        const personMeshes = Array.from(this.personMeshes.values());

        // Check for intersections
        const intersects = raycaster.intersectObjects(personMeshes, true);

        // Reset previous hover state
        if (hoveredMesh && hoveredMesh !== intersects[0]?.object) {
          this.resetHoverEffect(hoveredMesh);
          hoveredMesh = null;
        }

        // If no intersections, reset cursor
        if (intersects.length === 0) {
          document.body.style.cursor = "default";
        }

        // Set new hover state
        if (intersects.length > 0) {
          const newHoveredMesh = intersects[0].object;
          if (newHoveredMesh !== hoveredMesh) {
            hoveredMesh = newHoveredMesh;
            this.applyHoverEffect(hoveredMesh);
          }
        }
      };

      // Add mouse move event listener
      window.addEventListener("mousemove", onMouseMove);

      // Store the event listener for cleanup
      this.hoverListener = onMouseMove;
    },

    applyHoverEffect(mesh) {
      // Scale up the mesh slightly and add a glow effect
      mesh.scale.setScalar(1.2);

      // Add a subtle glow by scaling the material
      if (mesh.material) {
        mesh.material.opacity = 0.9;
      }

      // Change cursor to pointer
      document.body.style.cursor = "pointer";
    },

    resetHoverEffect(mesh) {
      // Reset the mesh scale
      mesh.scale.setScalar(1.0);

      // Reset material opacity
      if (mesh.material) {
        mesh.material.opacity = 1.0;
      }

      // Reset cursor
      document.body.style.cursor = "default";
    },

    pauseGlobe() {
      if (this.globe) {
        // Disable auto-rotation
        this.globe.controls().autoRotate = false;

        // Pause rendering
        this.globe.pauseAnimation();

        // Remove global event listeners
        if (this.clickListener) {
          window.removeEventListener("click", this.clickListener);
          this.clickListener = null;
        }
        if (this.hoverListener) {
          window.removeEventListener("mousemove", this.hoverListener);
          this.hoverListener = null;
        }

        console.log("Globe paused");
      }
    },

    resumeGlobe() {
      if (this.globe) {
        // Re-enable auto-rotation
        this.globe.controls().autoRotate = true;
        this.globe.controls().autoRotateSpeed = 0.5;

        // Resume rendering
        this.globe.resumeAnimation();

        // Re-setup event listeners
        this.setupPersonClickDetection();
        this.setupHoverEffects();

        console.log("Globe resumed");
      }
    },
  },
};
</script>

<style scoped>
.globe-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.globe-container {
  width: 100%;
  height: 100%;
  background: #ffffff;
  transition: background-color 0.3s ease;
}

.globe-container.dark-mode {
  background: #2d3748;
}

/* Global styles for person points (not scoped) */
:global(.person-point) {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 12px;
  padding: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border: 2px solid #e2e8f0;
  min-width: 90px;
  text-align: center;
  backdrop-filter: blur(4px);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

:global(.person-point:hover) {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
}

:global(.person-photo) {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 6px;
  border: 3px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:global(.person-name) {
  font-size: 11px;
  font-weight: 700;
  color: #2d3748;
  line-height: 1.3;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
}

/* Dark mode styles for person points */
:global(.dark-mode .person-point) {
  background: rgba(45, 55, 72, 0.98);
  border-color: #4a5568;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

:global(.dark-mode .person-point:hover) {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5);
}

:global(.dark-mode .person-photo) {
  border-color: #4a5568;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

:global(.dark-mode .person-name) {
  color: #e2e8f0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}
</style>
