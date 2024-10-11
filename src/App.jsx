import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, ScaleControl } from "react-leaflet";
import axios from "axios";
import osmtogeojson from "osmtogeojson";
import "./App.css";
import L from "leaflet"; // Import Leaflet

const MapComponent = () => {
  const [highways, setHighways] = useState(null);
  const [buildings, setBuildings] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [satelliteMode, setSatelliteMode] = useState(true);
  const [highwaysVisible, setHighwaysVisible] = useState(true);
  const [buildingsVisible, setBuildingsVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [selectedHighwayIndex, setSelectedHighwayIndex] = useState(0);
  const [selectedBuildingIndex, setSelectedBuildingIndex] = useState(0);
  const [sidebarContent, setSidebarContent] = useState(null); // Added state for sidebar content
  const [selectedHighwayId, setSelectedHighwayId] = useState(null); // Track selected highway ID
  const [selectedBuildingId, setSelectedBuildingId] = useState(null); // Track selected building ID
  const [highwaysRerender, setHighwaysRerender] = useState(0); // For rerendering highways
  const [buildingsRerender, setBuildingsRerender] = useState(0); // For rerendering buildings
  const mapRef = useRef();

  // Store references to feature layers
  const highwayLayersRef = useRef({});
  const buildingLayersRef = useRef({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchHighways(), fetchBuildings()]);
      setLoading(false);
    };

    const fetchHighways = async () => {
      const overpassQuery = `
        [out:json];
        way["highway"](around:2000,46.7703,23.5902);
        out geom;
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
        way["building"](around:2000,46.7703,23.5902);
        out geom;
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
  const highwayType = type === "highway" ? feature.properties.highway : "";

  const popupContent = `
      <b>${name}</b><br>
      Type: ${highwayType || "N/A"}<br>
      <a href="${getOSMEditorUrl(osmType, osmId)}" target="_blank">Edit this ${type} on OSM</a>
  `;

  layer.bindPopup(popupContent);

  // Store the layer reference
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

  layer.on("mouseover", () => {
    if (
        (type === "highway" && selectedHighwayId !== feature.id) ||
        (type === "building" && selectedBuildingId !== feature.id)
    ) {
        layer.setStyle({ weight: 15 }); // Highlight on hover
    }
});

layer.on("mouseout", () => {
    if (
        (type === "highway" && selectedHighwayId !== feature.id) ||
        (type === "building" && selectedBuildingId !== feature.id)
    ) {
        layer.setStyle(type === "highway" ? getHighwayStyle(feature) : getBuildingStyle());
    }
});

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
        // Reset the style of the previously selected building
        if (selectedBuildingId && selectedBuildingId !== feature.id) {
            const prevLayer = buildingLayersRef.current[selectedBuildingId];
            if (prevLayer) {
                prevLayer.setStyle(getBuildingStyle(prevLayer.feature)); // Reset previous building style
                prevLayer.redraw(); // Force redraw
            }
        }
        // Set new selected building
        setSelectedBuildingId(feature.id);

        // Set style for the currently selected building (turn it red)
        const selectedLayer = buildingLayersRef.current[feature.id];
        if (selectedLayer) {
            selectedLayer.setStyle({
                color: "#7e2e2e", // Keep black outline
                weight: 2, // Maintain outline weight
                fillColor: "#FF0000", // Red fill color for selected building
                fillOpacity: 0.4, // High opacity for selected building
            });
            selectedLayer.redraw(); // Force redraw
        }
        console.log("Selected Building ID:", feature.id);
    }
});


};



const getHighwayStyle = (feature) => {
  // Defensive checks to ensure feature and feature.properties exist
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

  // Define highway colors based on the type
  const highwayColors = {
    motorway: "#ff0000",
    motorway_link: "#cc0000",
    trunk: "#ff7f00",
    trunk_link: "#cc7f00",
    primary: "#ffff00",
    primary_link: "#cccc00",
    secondary: "#7fff00",
    secondary_link: "#66cc00",
    tertiary: "#00ff00",
    tertiary_link: "#00cc00",
    unclassified: "#d3d3d3",
    residential: "#a9a9a9",
    service: "#add8e6",
    footway: "#90ff7a",
    pedestrian: "#6c7b69",
    cycleway: "#1e90ff",
    path: "#897e00",
    track: "#4f2100",
    steps: "#696969",
  };

  // Apply color based on the highway type
  if (properties.highway) {
    color = highwayColors[properties.highway] || "#999999"; // Default to gray if not found
  }

  // Adjust weight based on specific highway types (e.g., thicker for motorways)
  switch (properties.highway) {
    case "motorway":
    case "trunk":
      weight = 10; // Thicker lines for major roads
      break;
    case "primary":
    case "secondary":
      weight = 8; // Medium weight for primary and secondary roads
      break;
    case "residential":
    case "service":
      weight = 6; // Thinner lines for residential or service roads
      break;
    case "footway":
    case "cycleway":
    case "path":
      weight = 4; // Even thinner lines for paths, footways, cycleways
      break;
    default:
      weight = 8; // Default weight for others
      break;
  }

  // Return the dynamically created style object
  return {
    color: color,
    weight: weight,
    opacity: opacity,
  };
};


  const getBuildingStyle = (feature) => {
    // Defensive checks to ensure feature and feature.properties exist
    if (!feature || !feature.properties) {
      // Return a default style if feature or properties are missing
      return {
        color: "#ff0000", // Default black outline
        weight: 2, // Default outline weight
        fillColor: "#ff0000", // Default fill color (gray)
        fillOpacity: 0.3, // Default opacity
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
    
    // Check if it's a highway and retrieve the corresponding layer
    if (type === "highway") {
        layer = highwayLayersRef.current[feature.id];
  
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
  
            // Explicitly open the popup
            layer.openPopup();
        } else {
            console.error("Highway layer not found for feature:", feature.id);
        }
  
    // Check if it's a building and retrieve the corresponding layer
    } else if (type === "building") {
        layer = buildingLayersRef.current[feature.id];
  
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
  
            // Explicitly open the popup
            layer.openPopup();
        } else {
            console.error("Building layer not found for feature:", feature.id);
        }
    }
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
    const [osmType, osmId] = feature.id.split("/");

    setSidebarContent(
      <div>
        <h3>{name}</h3>
        <p>Type: {highwayType || "N/A"}</p>
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
      <MapContainer
        center={[46.7703, 23.5902]}
        zoom={25}
        maxZoom={18}
        style={{ height: "100vh", width: "100%" }}
        ref={mapRef}
        scrollWheelZoom={true} // Keep scroll zoom enabled
        wheelDebounceTime={0} // Make zooming smoother by adjusting debounce time (default is 40)
        wheelPxPerZoomLevel={2} // Smoother zoom by increasing scroll sensitivity (default is 60)
      >
        <TileLayer
  url={
    satelliteMode
      ? "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      : darkMode
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
  }
  attribution={
    satelliteMode
      ? 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }
/>

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
        <button onClick={toggleTheme}>
          {darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        </button>
        <button onClick={toggleHighways}>
          {highwaysVisible ? "Hide Highways" : "Show Highways"}
        </button>
        <button onClick={toggleBuildings}>
          {buildingsVisible ? "Hide Buildings" : "Show Buildings"}
        </button>
        <button onClick={toggleDarkMode}>Dark Mode</button>
        <button onClick={toggleLightMode}>Light Mode</button>
        <button onClick={toggleSatelliteMode}>Satellite</button>
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
