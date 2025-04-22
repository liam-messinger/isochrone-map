// Mapbox access token (added to environment vars for security)
const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_TOKEN;

// Default map center (San Francisco)
const DEFAULT_CENTER = [-74.0060, 40.7128];
const DEFAULT_ZOOM = 12;

// Global variables
let map;
let marker;
let selectedPoint;
let useGradient = false;
let useGradientRings = false; // Whether to use ring-style visualization
let outlinesOnly = false; // Whether to show only outlines
let gradientLayers = [];

// Initialize map when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeMap();
    setupEventListeners();
});

// Initialize the Mapbox map
function initializeMap() {
    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
    
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v12',
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM
    });

    // Add map controls
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(new mapboxgl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        trackUserLocation: true
    }), 'top-right');

    // Set up map click event
    map.on('click', handleMapClick);
    
    // Wait for map to load before allowing interaction
    map.on('load', () => {
        // Add a source for the isochrone data
        map.addSource('isochrone', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            }
        });

        // Add a layer for the isochrone (single color version)
        map.addLayer({
            id: 'isochrone-fill',
            type: 'fill',
            source: 'isochrone',
            layout: {},
            paint: {
                'fill-color': '#4285f4',
                'fill-opacity': 0.3
            }
        });

        // Add an outline layer for the isochrone
        map.addLayer({
            id: 'isochrone-outline',
            type: 'line',
            source: 'isochrone',
            layout: {},
            paint: {
                'line-color': '#4285f4',
                'line-width': 3
            }
        });
        
        // Create additional sources and layers for gradient visualization
        setupGradientLayers();
    });
}

// Set up gradient layers for multiple isochrone visualization
function setupGradientLayers() {
    // Number of gradient steps to create
    const numSteps = 12; // Increased from 9 for smoother gradients
    
    // Generate a smooth color gradient
    const colors = generateColorGradient(numSteps);
    
    // Clear any existing gradient layers
    gradientLayers = [];
    
    // Create sources and layers for multiple time steps
    for (let i = 0; i < colors.length; i++) {
        const id = `isochrone-gradient-${i}`;
        
        // Add source
        map.addSource(id, {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            }
        });
        
        // Add fill layer
        map.addLayer({
            id: `${id}-fill`,
            type: 'fill',
            source: id,
            layout: {
                'visibility': 'none'
            },
            paint: {
                'fill-color': colors[i],
                'fill-opacity': 0.3
            }
        });
        
        // Add outline layer
        map.addLayer({
            id: `${id}-line`,
            type: 'line',
            source: id,
            layout: {
                'visibility': 'none'
            },
            paint: {
                'line-color': colors[i],
                'line-width': 1.5 // Thinner lines for less visual clutter
            }
        });
        
        // Remember the layer IDs for toggling visibility
        gradientLayers.push({
            fillId: `${id}-fill`,
            lineId: `${id}-line`,
            sourceId: id,
            color: colors[i]
        });
    }
}

// Generate a smooth color gradient from blue (shortest) to red (longest)
function generateColorGradient(steps) {
    const colors = [];
    
    for (let i = 0; i < steps; i++) {
        const ratio = i / (steps - 1);
        colors.push(interpolateColor(ratio));
    }
    
    return colors;
}

// Interpolate between blue and red using HSL color space for smoother transitions
function interpolateColor(ratio) {
    // Use HSL interpolation for smoother color transitions
    // Start with blue (240°) and end with red (0°)
    // We'll go through cyan, green, yellow, orange in between
    
    // Map ratio to hue (240° to 0°)
    const hue = 230 - (ratio * 230);
    
    // Adjust saturation and lightness for better visualization
    const saturation = 100;
    const lightness = 45 + (ratio * 5); // Slightly lighter toward red end
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Set up event listeners for UI elements
function setupEventListeners() {
    // Time slider changes
    const timeSlider = document.getElementById('time-slider');
    const timeValue = document.getElementById('time-value');
    
    timeSlider.addEventListener('input', () => {
        timeValue.textContent = timeSlider.value;
        // Update the max time in the legend
        document.getElementById('max-time').textContent = `${timeSlider.value} min`;
    });
    
    // Calculate button click
    document.getElementById('calculate-btn').addEventListener('click', () => {
        if (selectedPoint) {
            calculateIsochrone();
        } else {
            alert('Please select a location on the map first');
        }
    });
    
    // Gradient option toggle
    const gradientCheckbox = document.getElementById('use-gradient');
    gradientCheckbox.addEventListener('change', () => {
        useGradient = gradientCheckbox.checked;
        
        // Show/hide the legend based on gradient usage
        const legend = document.getElementById('time-legend');
        if (useGradient) {
            legend.classList.add('visible');
        } else {
            legend.classList.remove('visible');
        }
        
        // If a point is selected and we already have data, update the visualization
        if (selectedPoint) {
            toggleIsochroneVisibility();
        }
    });
    
    // Outlines only toggle
    const outlinesCheckbox = document.getElementById('outlines-only');
    outlinesCheckbox.addEventListener('change', () => {
        outlinesOnly = outlinesCheckbox.checked;
        
        // Update visualization if data is already loaded
        if (selectedPoint) {
            updateOutlineVisibility();
        }
    });
}

// Toggle between gradient and single color visualization
function toggleIsochroneVisibility() {
    if (useGradient) {
        // Hide single color isochrone
        map.setLayoutProperty('isochrone-fill', 'visibility', 'none');
        map.setLayoutProperty('isochrone-outline', 'visibility', 'none');
        
        // Show gradient layers
        gradientLayers.forEach(layer => {
            map.setLayoutProperty(layer.fillId, 'visibility', 'visible');
            map.setLayoutProperty(layer.lineId, 'visibility', 'visible');
        });
    } else {
        // Show single color isochrone
        map.setLayoutProperty('isochrone-fill', 'visibility', 'visible');
        map.setLayoutProperty('isochrone-outline', 'visibility', 'visible');
        
        // Hide gradient layers
        gradientLayers.forEach(layer => {
            map.setLayoutProperty(layer.fillId, 'visibility', 'none');
            map.setLayoutProperty(layer.lineId, 'visibility', 'none');
        });
    }
    
    // Apply the outline-only setting after changing visualization mode
    updateOutlineVisibility();
}

// Update the visibility of fill layers based on the outlines-only setting
function updateOutlineVisibility() {
    // Update the fill opacity based on the outlines-only setting
    const fillOpacity = outlinesOnly ? 0 : 0.3;
    
    if (useGradient) {
        // Update all gradient fill layers
        gradientLayers.forEach(layer => {
            map.setPaintProperty(layer.fillId, 'fill-opacity', fillOpacity);
            
            // Make outline more prominent in outlines-only mode
            map.setPaintProperty(layer.lineId, 'line-width', outlinesOnly ? 2.5 : 1.5);
        });
    } else {
        // Update the single isochrone fill layer
        map.setPaintProperty('isochrone-fill', 'fill-opacity', fillOpacity);
        
        // Make outline more prominent in outlines-only mode
        map.setPaintProperty('isochrone-outline', 'line-width', outlinesOnly ? 4 : 3);
    }
}

// Handle map click events
function handleMapClick(e) {
    const coordinates = e.lngLat.toArray();
    selectedPoint = coordinates;
    
    // Update or create marker
    if (marker) {
        marker.setLngLat(coordinates);
    } else {
        marker = new mapboxgl.Marker()
            .setLngLat(coordinates)
            .addTo(map);
    }
    
    // Update UI with location info
    updateLocationInfo(coordinates);
    
    // Note: We no longer automatically calculate isochrones on click
    // The user must click the Calculate button instead
}

// Update the location info display
function updateLocationInfo(coordinates) {
    const [lng, lat] = coordinates;
    document.getElementById('location-info').textContent = 
        `Longitude: ${lng.toFixed(5)}, Latitude: ${lat.toFixed(5)}`;
}

// Calculate isochrone for the selected point
function calculateIsochrone() {
    const minutes = document.getElementById('time-slider').value;
    const travelMode = document.getElementById('travel-mode').value;
    
    if (!selectedPoint) {
        alert('Please select a location on the map first');
        return;
    }
    
    // Show loading indicator
    document.getElementById('calculate-btn').textContent = 'Calculating...';
    document.getElementById('calculate-btn').disabled = true;
    
    if (useGradient) {
        // For gradient display, we need to fetch multiple isochrones
        calculateGradientIsochrones(selectedPoint, minutes, travelMode);
    } else {
        // For single color display, fetch just one isochrone
        fetchIsochrones(selectedPoint, minutes, travelMode)
            .then(data => {
                // Update the map with the isochrone
                displayIsochrone(data);
            })
            .catch(error => {
                console.error('Error fetching isochrones:', error);
                alert('Error calculating travel times. Please try again.');
            })
            .finally(() => {
                // Hide loading indicator
                document.getElementById('calculate-btn').textContent = 'Calculate Isochrone';
                document.getElementById('calculate-btn').disabled = false;
            });
    }
}

// Calculate multiple isochrones for gradient display
async function calculateGradientIsochrones(coordinates, maxMinutes, travelMode) {
    try {
        // Create an array of time steps based on max minutes
        const timeSteps = calculateTimeSteps(maxMinutes, gradientLayers.length);
        console.log("Time steps for gradient:", timeSteps);
        
        // Show loading indicator
        document.getElementById('calculate-btn').textContent = 'Calculating gradient...';
        
        // Process in batches to avoid overwhelming the API
        const batchSize = 3;
        const results = [];
        
        for (let i = 0; i < timeSteps.length; i += batchSize) {
            const batchSteps = timeSteps.slice(i, i + batchSize);
            
            // Update loading indicator with progress
            document.getElementById('calculate-btn').textContent = 
                `Calculating... ${Math.min(i + batchSize, timeSteps.length)}/${timeSteps.length}`;
            
            // Fetch isochrones for this batch
            const batchPromises = batchSteps.map(minutes => 
                fetchIsochrones(coordinates, minutes, travelMode)
            );
            
            // Wait for this batch to complete
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            
            // Small delay between batches to avoid rate limiting
            if (i + batchSize < timeSteps.length) {
                await new Promise(resolve => setTimeout(resolve, 250));
            }
        }
        
        // Process results and create differential polygons if needed
        const processedResults = processIsochroneResults(results, timeSteps);
        
        // Since we're using a fixed set of colors (blue->red), we need to map our results
        // to the color array regardless of how many time steps we actually have
        const numResults = processedResults.length;
        const numColors = gradientLayers.length;
        
        // Clear all gradient sources first
        gradientLayers.forEach(layer => {
            map.getSource(layer.sourceId).setData({
                type: 'FeatureCollection',
                features: []
            });
        });
        
        // Display each isochrone with its corresponding color
        // We need to distribute our results across the full color spectrum
        for (let i = 0; i < numResults; i++) {
            // Map the index to the color gradient (0 = red/longest time, length-1 = blue/shortest time)
            // This ensures we always use the full color range regardless of how many time steps we have
            const colorIndex = Math.floor((i / (numResults - 1)) * (numColors - 1));
            const sourceId = gradientLayers[colorIndex].sourceId;
            map.getSource(sourceId).setData(processedResults[i]);
        }
        
        // Show gradient layers
        toggleIsochroneVisibility();
        
        // Apply outline-only setting
        updateOutlineVisibility();
        
        // Update legend labels
        const minTimeValue = timeSteps[timeSteps.length-1] || 5;
        const maxTimeValue = timeSteps[0] || 60;
        document.getElementById('min-time').textContent = `${minTimeValue} min`;
        document.getElementById('max-time').textContent = `${maxTimeValue} min`;
        
        // Fit map to the largest isochrone's bounds
        if (results.length > 0) {
            const bounds = getBoundsFromGeoJSON(results[0]);
            if (bounds) {
                map.fitBounds(bounds, {
                    padding: 50,
                    maxZoom: 15
                });
            }
        }
    } catch (error) {
        console.error('Error calculating gradient isochrones:', error);
        alert('Error calculating travel times. Please try again.');
    } finally {
        // Hide loading indicator
        document.getElementById('calculate-btn').textContent = 'Calculate Isochrone';
        document.getElementById('calculate-btn').disabled = false;
    }
}

// Process isochrone results to avoid overlapping colors
function processIsochroneResults(results, timeSteps) {
    const processedData = [];
    
    // For each result/time step
    for (let i = 0; i < results.length; i++) {
        const currentResult = JSON.parse(JSON.stringify(results[i])); // Deep copy
        
        if (i < results.length - 1 && useGradientRings) {
            // Create "rings" by subtracting the smaller isochrone from the larger one
            // This is more complex but gives cleaner visualization with distinct bands
            // TODO: Implement polygon differencing if needed
        }
        
        processedData.push(currentResult);
    }
    
    return processedData;
}

// Calculate time steps for gradient display
function calculateTimeSteps(maxMinutes, steps) {
    const result = [];
    const minTime = 5; // Minimum time in minutes
    
    // Create exponentially spaced time steps for better visualization
    for (let i = 0; i < steps; i++) {
        // Use a cubic easing function to create non-linear steps
        // This puts more detail in the shorter time ranges
        const factor = 1 - Math.pow(i / (steps - 1), 2.5);
        let time = Math.round(minTime + factor * (maxMinutes - minTime));
        
        // Ensure minimum time difference between steps
        if (i > 0 && result.length > 0) {
            const lastTime = result[result.length - 1];
            if (lastTime - time < 3) {
                time = Math.max(minTime, lastTime - 3);
            }
        }
        
        // Add the time if it's not already included and is at least the minimum
        if (time >= minTime && !result.includes(time)) {
            result.push(time);
        }
    }
    
    // Sort in descending order
    result.sort((a, b) => b - a);
    
    return result;
}

// Fetch isochrones from Mapbox API
async function fetchIsochrones(coordinates, minutes, profile) {
    const [lng, lat] = coordinates;
    
    // Fix the transit mode parameter (Mapbox uses 'driving-traffic' or 'walking' or 'cycling' or 'transit')
    const mapboxProfile = profile === 'transit' ? 'driving-traffic' : profile;
    
    const url = `https://api.mapbox.com/isochrone/v1/mapbox/${mapboxProfile}/${lng},${lat}?contours_minutes=${minutes}&polygons=true&access_token=${mapboxgl.accessToken}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

// Display the isochrone on the map
function displayIsochrone(geojson) {
    // Update the GeoJSON source data for single color display
    map.getSource('isochrone').setData(geojson);
    
    // Make sure the single isochrone layer is visible (if not using gradient)
    if (!useGradient) {
        map.setLayoutProperty('isochrone-fill', 'visibility', 'visible');
        map.setLayoutProperty('isochrone-outline', 'visibility', 'visible');
        
        // Apply the outlines-only setting
        updateOutlineVisibility();
    }
    
    // Fit the map to the isochrone bounds
    const bounds = getBoundsFromGeoJSON(geojson);
    if (bounds) {
        map.fitBounds(bounds, {
            padding: 50,
            maxZoom: 15
        });
    }
}

// Calculate bounds from GeoJSON
function getBoundsFromGeoJSON(geojson) {
    if (!geojson || !geojson.features || geojson.features.length === 0) {
        return null;
    }
    
    const bounds = new mapboxgl.LngLatBounds();
    
    geojson.features.forEach(feature => {
        if (feature.geometry && feature.geometry.coordinates) {
            // Handle different geometry types
            if (feature.geometry.type === 'Polygon') {
                feature.geometry.coordinates[0].forEach(coord => {
                    bounds.extend(coord);
                });
            } else if (feature.geometry.type === 'MultiPolygon') {
                feature.geometry.coordinates.forEach(polygon => {
                    polygon[0].forEach(coord => {
                        bounds.extend(coord);
                    });
                });
            }
        }
    });
    
    return bounds;
}