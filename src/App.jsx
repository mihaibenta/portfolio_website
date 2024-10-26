import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, ScaleControl } from "react-leaflet";
import axios from "axios";
import osmtogeojson from "osmtogeojson";
import "./App.css";
import L from "leaflet"; // Import Leaflet
import CustomPopupModal from "./CustomPopupModal";
import "./SmoothZoom"

const MapComponent = () => {
  const [highways, setHighways] = useState(null);
  const [buildings, setBuildings] = useState(null);
  const [trees, setTrees] = useState(null);
  const [stops, setStops] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [satelliteMode, setSatelliteMode] = useState(false);
  const [highwaysVisible, setHighwaysVisible] = useState(true);
  const [buildingsVisible, setBuildingsVisible] = useState(true);
  const [stopsVisible, setStopsVisible] = useState(true);
  const [treesVisible, setTreesVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [selectedHighwayIndex, setSelectedHighwayIndex] = useState(0);
  const [selectedBuildingIndex, setSelectedBuildingIndex] = useState(0);
  const [sidebarContent, setSidebarContent] = useState(null); // Added state for sidebar content
  const [selectedHighwayId, setSelectedHighwayId] = useState(null); // Track selected highway ID
  const [selectedBuildingId, setSelectedBuildingId] = useState(null); // Track selected building ID
  const [highwaysRerender, setHighwaysRerender] = useState(0); // For rerendering highways
  const [buildingsRerender, setBuildingsRerender] = useState(0); // For rerendering buildings
  const [showCustomPopup, setShowCustomPopup] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const mapRef = useRef();

  useEffect(() => {
    const map = mapRef.current;
    if (map) {
      // Enable smooth wheel zoom with center zoom behavior
      map.smoothWheelZoom.enable();
    }
  }, []);

  // Store references to feature layers
  const highwayLayersRef = useRef({});
  const buildingLayersRef = useRef({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchHighways(), fetchBuildings(), fetchTrees(), fetchStops()]);
      setLoading(false);
    };

    const fetchStops = async () => {
      const overpassQuery = `
       [out:json];
          node(around:1200, 40.72152531915463, -73.99573857999768)["highway"="stop"];
          out body;
      `;
    
      const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
        overpassQuery
      )}`;
    
      try {
        const response = await axios.get(overpassUrl);
        const geojson = {
          type: "FeatureCollection",
          features: response.data.elements.map((element) => ({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [element.lon, element.lat], // Use lon/lat from Overpass API response
            },
            properties: {
              id: element.id,
              name: element.tags.name || "Stop", // Optional name, defaulting to "Tree"
              type: element.tags.natural,
            },
          })),
        };
        setStops(geojson); // Set the geojson to state
      } catch (error) {
        console.error("Error fetching tree data:", error);
      }
    };

    const fetchTrees = async () => {
      const overpassQuery = `
       [out:json];
          node(around:1200, 40.72152531915463, -73.99573857999768)["natural"="tree"];
          out body;
      `;
    
      const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
        overpassQuery
      )}`;
    
      try {
        const response = await axios.get(overpassUrl);
        const geojson = {
          type: "FeatureCollection",
          features: response.data.elements.map((element) => ({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [element.lon, element.lat], // Use lon/lat from Overpass API response
            },
            properties: {
              id: element.id,
              name: element.tags.name || "Tree", // Optional name, defaulting to "Tree"
              type: element.tags.natural,
            },
          })),
        };
        setTrees(geojson); // Set the geojson to state
      } catch (error) {
        console.error("Error fetching tree data:", error);
      }
    };
    

    const fetchHighways = async () => { 
      const overpassQuery = `
       [out:json];
        way(around:1200, 40.72152531915463, -73.99573857999768)[highway];
        out body;
        >;
        out skel qt;
      `;
      const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
        overpassQuery
      )}`;

      try {
        const response = await axios.get(overpassUrl);
        const geojson = osmtogeojson(response.data);
        setHighways(geojson);
      } catch (error) {
        console.error("Error fetching highway data:", error);
      }
    };

    const fetchBuildings = async () => {
      const overpassQuery = `
       [out:json];
        way(around:1200, 40.72152531915463, -73.99573857999768)["building"];
        out body;
        >;
        out skel qt;


      `;
      const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
        overpassQuery
      )}`;

      try {
        const response = await axios.get(overpassUrl);
        const geojson = osmtogeojson(response.data);
        setBuildings(geojson);
      } catch (error) {
        console.error("Error fetching building data:", error);
      }
    };

    fetchData();
  }, []);

  const treeIcon = new L.Icon({
    iconUrl: '/tree_3.png', // URL of your tree icon image
    iconSize: [24, 24], // Size of the icon [width, height]
    iconAnchor: [12, 24], // The anchor point of the icon (bottom center in this case)
    popupAnchor: [0, -24], // The anchor point of the popup (relative to the icon)
  });

  // Function to apply the custom tree icon
  const getTreeIcon = () => treeIcon;

  const stopIcon = new L.Icon({
    iconUrl: '/stop.png', // URL of your tree icon image
    iconSize: [24, 24], // Size of the icon [width, height]
    iconAnchor: [12, 24], // The anchor point of the icon (bottom center in this case)
    popupAnchor: [0, -24], // The anchor point of the popup (relative to the icon)
  });

  // Function to apply the custom tree icon
  const getStopIcon = () => stopIcon;
  

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const toggleDarkMode = () => {
    setDarkMode(true);
    setSatelliteMode(false);
  };
  
  const toggleLightMode = () => {
    setDarkMode(false);
    setSatelliteMode(false);
  };
  
  const toggleSatelliteMode = () => {
    setSatelliteMode(true);
    setDarkMode(false);
  };

  const toggleHighways = () => {
    setHighwaysVisible(!highwaysVisible);
  };

  const toggleBuildings = () => {
    setBuildingsVisible(!buildingsVisible);
  };

  const toggleStops = () => {
    setStopsVisible(!stopsVisible);
  };
 
  const toggleTrees = () => {
    setTreesVisible(!treesVisible);
  };

  const getOSMEditorUrl = (osmType, osmId) => {
    const osmBaseUrl = "https://www.openstreetmap.org/edit";
    return `${osmBaseUrl}?editor=id&${osmType}=${osmId}`;
  };

const getSelectedFeatureStyle = () => {
  return {
    color: "#FFFF00",
    weight: 10,
    opacity: 1,
    className: "glow-effect", // Apply a custom class for the glow effect
  };
};



const bindPopupToFeature = (feature, layer, type) => {
  const name = feature.properties.name || `Unnamed ${type}`;
  const [osmType, osmId] = feature.id.split("/");
  
  // Get highway-related properties
  const highwayType = type === "highway" ? feature.properties.highway : "";
  const surface = type === "highway" ? feature.properties.surface || "N/A" : "";
  const smoothness = type === "highway" ? feature.properties.smoothness || "N/A" : "";

  // Generate the popup content including additional highway tags (surface, smoothness)
  const popupContent = `
    <b>${name}</b><br>
    Type: ${highwayType || "N/A"}<br>
    Surface: ${surface}<br>
    Smoothness: ${smoothness}<br>
    <a href="${getOSMEditorUrl(osmType, osmId)}" target="_blank">Edit this ${type} on OSM</a>
  `;

  layer.bindPopup(popupContent);

  // Store the layer reference and handle style application based on selection
  if (type === "highway") {
    highwayLayersRef.current[feature.id] = layer;
    if (selectedHighwayId === feature.id) {
      layer.setStyle(getSelectedFeatureStyle()); // Apply selected style
    } else {
      layer.setStyle(getHighwayStyle(feature)); // Apply normal style
    }
  } else if (type === "building") {
    buildingLayersRef.current[feature.id] = layer;
    if (selectedBuildingId === feature.id) {
      layer.setStyle(getSelectedFeatureStyle()); // Apply selected style
    } else {
      layer.setStyle(getBuildingStyle()); // Apply normal style
    }
  }

  // Hover event (mouseover) to highlight feature
  layer.on("mouseover", () => {
    if (
      (type === "highway" && selectedHighwayId !== feature.id) ||
      (type === "building" && selectedBuildingId !== feature.id)
    ) {
      layer.setStyle({ weight: 15 }); // Highlight on hover
    }
  });

  // Mouseout event to reset style after hover
  layer.on("mouseout", () => {
    if (
      (type === "highway" && selectedHighwayId !== feature.id) ||
      (type === "building" && selectedBuildingId !== feature.id)
    ) {
      layer.setStyle(type === "highway" ? getHighwayStyle(feature) : getBuildingStyle());
    }
  });

  // Click event to handle selection and style updates
  layer.on("click", () => {
    console.log("Layer clicked:", feature.id);

    // Reset previous selection for highways
    if (type === "highway") {
      if (selectedHighwayId && selectedHighwayId !== feature.id) {
        const prevLayer = highwayLayersRef.current[selectedHighwayId];
        if (prevLayer) {
          prevLayer.setStyle(getHighwayStyle(prevLayer.feature)); // Reset previous highway style
          prevLayer.redraw(); // Force redraw
        }
      }
      setSelectedHighwayId(feature.id);
      console.log("Selected Highway ID:", feature.id);
    }
    // Handle selection for buildings
    else if (type === "building") {
      if (selectedBuildingId && selectedBuildingId !== feature.id) {
        const prevLayer = buildingLayersRef.current[selectedBuildingId];
        if (prevLayer) {
          prevLayer.setStyle(getBuildingStyle(prevLayer.feature)); // Reset previous building style
          prevLayer.redraw(); // Force redraw
        }
      }
      setSelectedBuildingId(feature.id);

      // Set style for the currently selected building
      const selectedLayer = buildingLayersRef.current[feature.id];
      if (selectedLayer) {
        selectedLayer.setStyle({
          color: "#7e2e2e", // Black outline
          weight: 2, // Outline weight
          fillColor: "#FF0000", // Red fill color for selected building
          fillOpacity: 0.4, // High opacity for selected building
        });
        selectedLayer.redraw(); // Force redraw
      }
      console.log("Selected Building ID:", feature.id);
    }
  });
};

const bindStopToMap = (map) => {
  if (stops) {
    L.geoJSON(stops, {
      pointToLayer: (feature, latlng) => {
        return L.circleMarker(latlng, getStopStyle());
      },
      onEachFeature: (feature, layer) => {
        const stopName = feature.properties.name || "Stop";
        layer.bindPopup(`<b>${stopName}</b><br>Type: stop`);
      },
    }).addTo(map);
  }
};

useEffect(() => {
  if (mapRef.current) {
    bindStopToMap(mapRef.current);
  }
}, [stops]);




const getStopStyle = () => {
  return {
    color: "#ff0000", // Forest green color for trees
    radius: 4, // Size of the tree point
    fillOpacity: 5,
  };
};

const bindTreeToMap = (map) => {
  if (trees) {
    L.geoJSON(trees, {
      pointToLayer: (feature, latlng) => {
        return L.circleMarker(latlng, getTreeStyle());
      },
      onEachFeature: (feature, layer) => {
        const treeName = feature.properties.name || "Tree";
        layer.bindPopup(`<b>${treeName}</b><br>Type: Tree`);
      },
    }).addTo(map);
  }
};

useEffect(() => {
  if (mapRef.current) {
    bindTreeToMap(mapRef.current);
  }
}, [trees]);




const getTreeStyle = () => {
  return {
    color: "#51310035", // Forest green color for trees
    radius: 4, // Size of the tree point
    fillOpacity: 5,
  };
};



const getHighwayStyle = (feature) => {
  if (!feature || !feature.properties) {
    // Return a default style if feature or properties are missing
    return {
      color: "#999999", // Default gray color
      weight: 8, // Default weight
      opacity: 0.7, // Default opacity
    };
  }

  const properties = feature.properties;

  // Default styles
  let color = "#999999"; // Default color for unknown types
  let weight = 8; // Default weight
  let opacity = 0.7; // Default opacity
  let dashArray = null; // Dash pattern (used for crossings)
  let lineCap = "round"; // Default line cap style

  // Define highway colors based on smoothness
  const highwayColors = {
    excellent: "#0026ff",
    good: "#00cc5f",
    intermediate: "#d4ff00",
    bad: "#ffc400",
    very_bad: "#ff8400",
    horrible: "#cc1800",
    very_horrible: "#8e0000",
    impassable: "#420000",
  };

  // Apply color based on the smoothness
  if (properties.smoothness) {
    color = highwayColors[properties.smoothness] || "#999999";
  }

  // Adjust weight and color based on the highway type
  switch (properties.highway) {
    case "motorway":
    case "trunk":
      weight = 10;
      break;
    case "primary":
    case "secondary":
      weight = 8;
      break;
    case "residential":
    case "service":
    case "living_street":
      weight = 6;
      break;

      case "footway":
        weight = 8; // Default thin line for footways
      
        // Check for footway sub-types
        if (properties.footway === "sidewalk") {
          color = "#d5ffc8"; // Gray color resembling a sidewalk
          weight = 6; // Thinner line for sidewalks
          opacity = 1;
          dashArray = "4, 4"; // Add a dashed line to simulate the sidewalk pattern
        } else if (properties.footway === "crossing") {
          color = "#ffffff"; // White for crossings
          weight = 18; // Thicker line for crossings
          opacity = 1;
          dashArray = "5, 5"; // Dashed line to symbolize a crossing
          lineCap = "butt"; // Square end caps for dash segments
        } else {
          color = "#00ff2a"; // Green for other footways
        }
        break;
      

    case "cycleway":
    case "pedestrian":
    case "path":
      weight = 4;
      color = '#00ff2a'; // Green for paths, footways, cycleways
      break;

    default:
      weight = 8;
      break;
  }

  // Return the dynamically created style object
  return {
    color: color,
    weight: weight,
    opacity: opacity,
    dashArray: dashArray, // Use dashArray for crossings
    lineCap: lineCap, // Apply lineCap to control how dashes are drawn
  };
};



  const getBuildingStyle = (feature) => {
    // Defensive checks to ensure feature and feature.properties exist
    if (!feature || !feature.properties) {
      // Return a default style if feature or properties are missing
      return {
        color: "#ff8426", // Default black outline
        weight: 2, // Default outline weight
        fillColor: "#000000", // Default fill color (gray)
        fillOpacity: 0.2, // Default opacity
      };
    }
  
    const properties = feature.properties;
  
    // Default styles
    let fillColor = "#a00000"; // Default fill color (gray)
    let weight = 2; // Default outline weight
    let fillOpacity = 0.6; // Default fill opacity
  
    // Check for building levels (number of floors)
    if (properties["building:levels"]) {
      const levels = parseInt(properties["building:levels"]);
      if (!isNaN(levels)) {
        fillOpacity = Math.min(0.9, 0.4 + levels * 0.1); // Increase opacity based on levels
        fillColor = levels > 10 ? "#ff6347" : levels > 5 ? "#ffd700" : "#7fff00"; // Color based on levels
      }
    }
  
    // Check for building type and set a color based on that
    if (properties.building) {
      switch (properties.building) {
        case "residential":
          fillColor = "#4682b4"; // Blue for residential
          break;
        case "commercial":
          fillColor = "#daa520"; // Goldenrod for commercial
          break;
        case "industrial":
          fillColor = "#8b0000"; // Dark Red for industrial
          break;
        case "retail":
          fillColor = "#ff69b4"; // Hot Pink for retail
          break;
        case "church":
          fillColor = "#9370db"; // Medium Purple for churches
          break;
        default:
          fillColor = "#752424"; // Default gray for other types
          break;
      }
    }
  
    // Return the dynamically created style object
    return {
      color: "#100972", // Black outline for all buildings
      weight: weight,
      fillColor: fillColor,
      fillOpacity: fillOpacity,
    };
  };
  

  const centerMapOnHighway = (index) => {
    if (highways && highways.features.length > 0 && mapRef.current) {
      const highway = highways.features[index];
      const { geometry } = highway;
      const coordinates = geometry.coordinates;

      // Ensure coordinates are valid
      if (!coordinates || coordinates.length === 0) {
        console.error("Invalid coordinates for highway:", highway);
        return;
      }

      // Handle LineString geometries
      if (geometry.type === "LineString") {
        const latLngs = coordinates.map(([lng, lat]) => [lat, lng]);

        if (latLngs.length > 1) {
          const bounds = L.latLngBounds(latLngs);
          if (bounds.isValid()) {
            mapRef.current.fitBounds(bounds);
          } else {
            console.error("Calculated bounds are not valid for highway (LineString):", highway);
          }
        } else {
          console.error("Insufficient coordinates for bounds on highway (LineString):", highway);
        }

        // Handle Polygon geometries
      } else if (geometry.type === "Polygon") {
        // Polygons have a nested array of coordinates, so we need to flatten it
        const latLngs = geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);

        if (latLngs.length > 1) {
          const bounds = L.latLngBounds(latLngs);
          if (bounds.isValid()) {
            mapRef.current.fitBounds(bounds);
          } else {
            console.error("Calculated bounds are not valid for highway (Polygon):", highway);
          }
        } else {
          console.error("Insufficient coordinates for bounds on highway (Polygon):", highway);
        }

        // Handle MultiPolygon geometries
      } else if (geometry.type === "MultiPolygon") {
        // MultiPolygon is an array of arrays, so we need to flatten all polygons
        const latLngs = geometry.coordinates.flat(2).map(([lng, lat]) => [lat, lng]);

        if (latLngs.length > 1) {
          const bounds = L.latLngBounds(latLngs);
          if (bounds.isValid()) {
            mapRef.current.fitBounds(bounds);
          } else {
            console.error("Calculated bounds are not valid for highway (MultiPolygon):", highway);
          }
        } else {
          console.error("Insufficient coordinates for bounds on highway (MultiPolygon):", highway);
        }
      } else if (geometry.type === "Point") {
        // Handle Point geometries (not common for highways but just in case)
        const latLng = [coordinates[1], coordinates[0]]; // [lat, lng]
        mapRef.current.setView(latLng, 18); // Center the map on this point
      } else {
        console.error("Unhandled geometry type for highway:", geometry.type);
      }
    }
  };

  const centerMapOnBuilding = (index) => {
    if (buildings && buildings.features.length > 0 && mapRef.current) {
      const building = buildings.features[index];
      const { geometry } = building;
      const coordinates = geometry.coordinates;

      // Ensure coordinates are valid
      if (!coordinates || coordinates.length === 0) {
        console.error("Invalid coordinates for building:", building);
        return;
      }

      if (geometry.type === "Polygon") {
        const latLngs = geometry.coordinates[0].map(([lng, lat]) => [lat, lng]);

        if (latLngs.length > 1) {
          const bounds = L.latLngBounds(latLngs);
          if (bounds.isValid()) {
            mapRef.current.fitBounds(bounds);
          } else {
            console.error("Calculated bounds are not valid for building (Polygon):", building);
          }
        } else {
          console.error("Insufficient coordinates for bounds on building (Polygon):", building);
        }
      } else if (geometry.type === "MultiPolygon") {
        const latLngs = geometry.coordinates.flat(2).map(([lng, lat]) => [lat, lng]);

        if (latLngs.length > 1) {
          const bounds = L.latLngBounds(latLngs);
          if (bounds.isValid()) {
            mapRef.current.fitBounds(bounds);
          } else {
            console.error("Calculated bounds are not valid for building (MultiPolygon):", building);
          }
        } else {
          console.error("Insufficient coordinates for bounds on building (MultiPolygon):", building);
        }
      } else if (geometry.type === "Point") {
        const latLng = [coordinates[1], coordinates[0]]; // [lat, lng]
        mapRef.current.setView(latLng, 18);
      } else {
        console.error("Unhandled geometry type for building:", geometry.type);
      }
    }
  };

  const openPopup = (feature, type) => {
    let layer;
  
    console.log("openPopup called with feature:", feature, "and type:", type);
  
    // Check if it's a highway and retrieve the corresponding layer
    if (type === "highway") {
      layer = highwayLayersRef.current[feature.id];
  
      console.log("Highway layer:", layer);
  
      // If a layer is found, continue with selection handling
      if (layer) {
        // Reset previous highway selection
        if (selectedHighwayId && selectedHighwayId !== feature.id) {
          const prevLayer = highwayLayersRef.current[selectedHighwayId];
          if (prevLayer) {
            prevLayer.setStyle(getHighwayStyle(prevLayer.feature)); // Reset the previous layer's style
          }
        }
  
        // Update the selected highway ID
        setSelectedHighwayId(feature.id);
  
        // Apply the selected style to the current layer
        layer.setStyle(getSelectedFeatureStyle());
  
        // Create a new popup and set its position to the center of the feature's bounds
        const popup = L.popup()
          .setContent(getPopupContent(feature, type))
          .setLatLng(layer.getBounds().getCenter())
          .openOn(mapRef.current);
  
        // Store the popup reference for later use (optional)
        layer.popup = popup;
  
        console.log("Popup opened for highway:", feature.id);
      } else {
        console.error("Highway layer not found for feature:", feature.id);
      }
  
    // Check if it's a building and retrieve the corresponding layer
    } else if (type === "building") {
      layer = buildingLayersRef.current[feature.id];
  
      console.log("Building layer:", layer);
  
      // If a layer is found, continue with selection handling
      if (layer) {
        // Reset previous building selection
        if (selectedBuildingId && selectedBuildingId !== feature.id) {
          const prevLayer = buildingLayersRef.current[selectedBuildingId];
          if (prevLayer) {
            prevLayer.setStyle(getBuildingStyle()); // Reset the previous layer's style
          }
        }
  
        // Update the selected building ID
        setSelectedBuildingId(feature.id);
  
        // Apply the selected style to the current layer
        layer.setStyle(getSelectedFeatureStyle());
  
        // Create a new popup and set its position to the center of the feature's bounds
        const popup = L.popup()
          .setContent(getPopupContent(feature, type))
          .setLatLng(layer.getBounds().getCenter())
          .openOn(mapRef.current);
  
        // Store the popup reference for later use (optional)
        layer.popup = popup;
  
        console.log("Popup opened for building:", feature.id);
      } else {
        console.error("Building layer not found for feature:", feature.id);
      }
    }
  };
  
  // Function to create the popup content
  const getPopupContent = (feature, type) => {
    const name = feature.properties.name || `Unnamed ${type}`;
    const highwayType = type === "highway" ? feature.properties.highway : "";
    const surface = type === "highway" ? feature.properties.surface || "N/A" : "";
    const smoothness = type === "highway" ? feature.properties.smoothness || "N/A" : "";
    const [osmType, osmId] = feature.id.split("/");
  
    return `
      <b>${name}</b><br>
      Type: ${highwayType || "N/A"}<br>
      Surface: ${surface}<br>
      Smoothness: ${smoothness}<br>
      <a href="${getOSMEditorUrl(osmType, osmId)}" target="_blank">Edit this ${type} on OSM</a>
    `;
  };
  

  const updateSidebarContent = (index, type) => {
    let feature;
    if (type === "highway") {
      feature = highways.features[index];
    } else {
      feature = buildings.features[index];
    }
    
    const name = feature.properties.name || `Unnamed ${type}`;
    const highwayType = type === "highway" ? feature.properties.highway : "";
    const surface = type === "highway" ? feature.properties.surface || "N/A" : "";
    const smoothness = type === "highway" ? feature.properties.smoothness || "N/A" : "";
    const [osmType, osmId] = feature.id.split("/");
  
    setSidebarContent(
      <div>
        <h3>{name}</h3>
        <p>Type: {highwayType || "N/A"}</p>
        {type === "highway" && (
          <>
            <p>Surface: {surface}</p>
            <p>Smoothness: {smoothness}</p>
          </>
        )}
        <a href={getOSMEditorUrl(osmType, osmId)} target="_blank">
          Edit this {type} on OSM
        </a>
      </div>
    );
  };
  

   const nextHighway = () => {
    if (highways) {
    setSelectedHighwayIndex((prevIndex) => {
    const nextIndex = (prevIndex + 1) % highways.features.length;    
 // Trigger map centering on the new highway
    centerMapOnHighway(nextIndex);
     // Open the popup for the new highway
     openPopup(highways.features[nextIndex], "highway");
    // Update sidebar content
    updateSidebarContent(nextIndex, "highway");
     // Trigger rerender for highways   
     setHighwaysRerender((prev) => prev + 1);
     return nextIndex;
     });
    
     }
    
    };
  
  const previousHighway = () => {
    if (highways) {
      setSelectedHighwayIndex((prevIndex) => {
        const prevIndexAdjusted = 
          (prevIndex - 1 + highways.features.length) % highways.features.length;
  
        // Trigger map centering on the previous highway
        centerMapOnHighway(prevIndexAdjusted);
  
        // Open the popup for the previous highway
        openPopup(highways.features[prevIndexAdjusted], "highway");
  
        // Update sidebar content
        updateSidebarContent(prevIndexAdjusted, "highway");
  
        // Trigger rerender for highways
        setHighwaysRerender((prev) => prev + 1);
  
        return prevIndexAdjusted;
      });
    }
  };
  
  const nextBuilding = () => {
    if (buildings) {
      setSelectedBuildingIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % buildings.features.length;
        centerMapOnBuilding(nextIndex); // Center on the next building
        openPopup(buildings.features[nextIndex], "building"); // Open the popup for the next building
        updateSidebarContent(nextIndex, "building"); // Update sidebar content
        setSelectedFeature(buildings.features[nextIndex]);
  
        // Trigger rerender for buildings
        setBuildingsRerender((prev) => prev + 1);
  
        return nextIndex; // Update state after centering the map
      });
    }
  };
  
  const previousBuilding = () => {
    if (buildings) {
      setSelectedBuildingIndex((prevIndex) => {
        const prevIndexAdjusted =
          (prevIndex - 1 + buildings.features.length) % buildings.features.length;
        centerMapOnBuilding(prevIndexAdjusted); // Center on the previous building
        openPopup(buildings.features[prevIndexAdjusted], "building"); // Open the popup for the previous building
        updateSidebarContent(prevIndexAdjusted, "building"); // Update sidebar content
  
        // Trigger rerender for buildings
        setBuildingsRerender((prev) => prev + 1);
  
        return prevIndexAdjusted; // Update state after centering the map
      });
    }
  };

  return (
    
    <div className="map-container">
       <CustomPopupModal
  feature={selectedFeature}
  type={selectedFeature ? (selectedFeature.properties.highway ? "highway" : "building") : null}
  visible={showCustomPopup}
  onClose={() => setShowCustomPopup(false)}
  getOSMEditorUrl={getOSMEditorUrl} // Pass the function as a prop
/>
      <MapContainer
        center={[40.72152531915463, -73.99573857999768]}
        zoom={19}
        maxZoom={19}
        style={{ height: "100vh", width: "100%" }}
        ref={mapRef}
        scrollWheelZoom={false}
       
      >
        <TileLayer
  url={
    satelliteMode
      ? "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
      : darkMode
      ? "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
      
      : "https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.png"
  }
  maxZoom={19} // Ensure max zoom is set to accommodate the tile provider's capabilities
  
  attribution={
    satelliteMode
      ? 'Google Satellite'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }
/>

 {/* Trees GeoJSON Layer */}
 {trees && treesVisible && (
        <GeoJSON
          key={`trees-${trees.length}`} // Unique key for trees
          data={trees}
          pointToLayer={(feature, latlng) => {
            return L.marker(latlng, { icon: getTreeIcon() }); // Use the custom tree icon
          }}
          onEachFeature={(feature, layer) => {
            layer.bindPopup(`<b>${feature.properties.name}</b><br>Type: Tree`);
          }}
        />
      )}

{stops && stopsVisible && (
        <GeoJSON
          key={`stops-${stops.length}`} // Unique key for trees
          data={stops}
          pointToLayer={(feature, latlng) => {
            return L.marker(latlng, { icon: getStopIcon() }); // Use the custom tree icon
          }}
          onEachFeature={(feature, layer) => {
            layer.bindPopup(`<b>${feature.properties.name}</b><br>Type: Stops`);
          }}
        />
      )}   

{highwaysVisible && highways && (
  <GeoJSON
    key={`highways-${highwaysRerender}`} // Ensure a unique key based on rerender state
    data={highways}
    onEachFeature={(feature, layer) => {
      bindPopupToFeature(feature, layer, "highway");
    }}
  />
)}

{buildingsVisible && buildings && (
  <GeoJSON
    key={`buildings-${buildingsRerender}`} // Ensure a unique key based on rerender state
    data={buildings}
    onEachFeature={(feature, layer) => {
      bindPopupToFeature(feature, layer, "building");
    }}
  />
)}

        <ScaleControl position="bottomright" />
      </MapContainer>
      {loading && <div className="loading">Loading...</div>}
      
      <div className="controls">
        
        <button onClick={toggleHighways}>
          {highwaysVisible ? "Hide 🚘" : "Show 🚘"}
        </button>
        <button onClick={toggleBuildings}>
          {buildingsVisible ? "Hide 🏡" : "Show 🏡"}
        </button>
        <button onClick={toggleStops}>
          {stopsVisible ? "Hide 🛑" : "Show 🛑"}
        </button>
        <button onClick={toggleTrees}>
          {treesVisible ? "Hide 🌳" : "Show 🌳"}
        </button>
        <button onClick={toggleDarkMode}>🌙</button>
        <button onClick={toggleLightMode}>🌞</button>
        <button onClick={toggleSatelliteMode}>🛰️</button>
        <button onClick={toggleTheme}>
          {darkMode ? "🌞" : "🌙"}
        </button>
      </div>
  
      {/* Sidebar panel */}
      <div className="sidebar">
        {sidebarContent ? (
          sidebarContent
        ) : (
          <div>Select a highway or building to see details.</div>
        )}
      </div>
        
 

  
      {/* Bottom-right panel for next/previous buttons */}
      <div className="bottom-right-panel">
        <button onClick={previousHighway}>Previous Highway</button>
        <button onClick={nextHighway}>Next Highway</button>
        <button onClick={previousBuilding}>Previous Building</button>
        <button onClick={nextBuilding}>Next Building</button>
      </div>
    </div>
  );
  
};

export default MapComponent;
