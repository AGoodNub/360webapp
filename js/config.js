/**
 * Configuration file for 360 Photo Viewer
 * This file defines the photo locations and their connections using a grid system
 */

const CONFIG = {
    // Default starting location
    defaultLocation: '0_0', // Center of the grid
    
    // Base path for images (update this to your actual image path)
    basePath: 'images/',
    
    // Image format (jpg, png, webp)
    imageFormat: 'jpg',
    
    // Grid system settings
    grid: {
        enabled: true,
        // How far apart locations are in the virtual world (affects arrow placement)
        spacing: 10,
        // Default connection distance (how many grid cells away to check for connections)
        connectionDistance: 1
    },
    
    // Image quality settings
    imageQuality: {
        mobile: {
            width: 2048,
            format: 'jpg',
            quality: 80
        },
        desktop: {
            width: 4096,
            format: 'jpg',
            quality: 90
        }
    },
    
    // Define all locations and their connections
    locations: [
        {
            id: '0_0',
            name: '0_0',
            gridPosition: { x: 0, y: 0 }
        },
        {
            id: '-1_-1',
            name: '-1_-1',
            gridPosition: { x: -1, y: -1 }
        },
        {
            id: '-1_0',
            name: '-1_0',
            gridPosition: { x: -1, y: 0 }
        },
        {
            id: '-1_1',
            name: '-1_1',
            gridPosition: { x: -1, y: 1 }
        },
        {
            id: '0_-1',
            name: '0_-1',
            gridPosition: { x: 0, y: -1 }
        },
        {
            id: '0_1',
            name: '0_1',
            gridPosition: { x: 0, y: 1 }
        },
        {
            id: '1_-1',
            name: '1_-1',   
            gridPosition: { x: 1, y: -1 }
        },
        {
            id: '1_0',
            name: '1_0',
            gridPosition: { x: 1, y: 0 }
        },
        {
            id: '1_1',
            name: '1_1',
            gridPosition: { x: 1, y: 1 }
        },
        {
            id: '0_2',
            name: '0_2',
            gridPosition: { x: 0, y: 2 }
        }
    ],
    arrowYOffset: 0.5,
    arrowDistance: 3,
    arrowScale: '0.5 0.5 0.5'
};

// Helper function to get location by ID
function getLocationById(locationId) {
    return CONFIG.locations.find(loc => loc.id === locationId);
}

// Function to get image path based on location ID
function getImagePath(locationId) {
    const location = getLocationById(locationId);
    if (!location) {
        // If location not found in CONFIG, try to load it directly
        return `${CONFIG.basePath}${locationId}.${CONFIG.imageFormat}`;
    }
    
    // If using the grid system with grid-based filenames
    if (CONFIG.grid.enabled && location.gridPosition) {
        // Use the location ID directly as the filename (e.g., "0_0.jpg")
        return `${CONFIG.basePath}${locationId}.${CONFIG.imageFormat}`;
    }
    
    // Fallback to the old system using the image property
    return `${CONFIG.basePath}${location.image || locationId}.${CONFIG.imageFormat}`;
}

// Function to get all possible connections for a location based on grid position
function getLocationConnections(locationId) {
    if (!CONFIG.grid.enabled) return [];
    
    const location = getLocationById(locationId);
    if (!location || !location.gridPosition) return [];
    
    const connections = [];
    const { x, y } = location.gridPosition;
    const distance = CONFIG.grid.connectionDistance;
    
    // Check all neighboring grid cells within the connection distance
    for (let dx = -distance; dx <= distance; dx++) {
        for (let dy = -distance; dy <= distance; dy++) {
            // Skip the current location
            if (dx === 0 && dy === 0) continue;
            
            // Skip diagonal connections if they're too far
            if (Math.abs(dx) + Math.abs(dy) > distance) continue;
            
            const neighborId = `${x + dx}_${y + dy}`;
            const neighbor = getLocationById(neighborId);
            
            if (neighbor) {
                // Calculate direction and rotation for this connection
                const direction = calculateDirection(dx, dy);
                const rotation = calculateRotation(dx, dy);
                const label = getDirectionLabel(dx, dy, neighbor.name);
                
                connections.push({
                    to: neighborId,
                    direction: direction,
                    rotation: rotation,
                    label: label
                });
            }
        }
    }
    
    return connections;
}

// Calculate the 3D direction vector for a grid connection
function calculateDirection(dx, dy) {
    const spacing = CONFIG.grid.spacing;
    
    // Convert grid coordinates to 3D space
    // In A-Frame, Y is up, X is right, Z is toward you (negative Z is forward)
    return {
        x: dx * spacing,
        y: 0,
        z: -dy * spacing  // Negative because positive Y in grid is negative Z in A-Frame
    };
}

// Calculate the rotation for an arrow pointing in this direction
function calculateRotation(dx, dy) {
    // Calculate the angle in degrees
    let angle = Math.atan2(dx, dy) * (180 / Math.PI);
    
    return {
        x: 0,
        y: angle,
        z: 0
    };
}

// Get a human-readable label for a direction
function getDirectionLabel(dx, dy, neighborName) {
    let direction = "";
    
    // Fix the flipped North/South issue
     if (dy > 0) direction += "North";
    else if (dy < 0) direction += "South";
    
    if (dx > 0) direction += direction ? "east" : "East";
    else if (dx < 0) direction += direction ? "west" : "West";
    
    if (!direction) direction = "Unknown direction";
    
    // Always return a direction label, even if neighborName is undefined
    return `${direction} to ${neighborName || 'Next Location'}`;
}

// Function to validate that all configured images exist
function validateImages() {
    console.log("Validating configured images...");
    
    let imagesLoading = CONFIG.locations.length;
    let imagesFound = 0;
    
    CONFIG.locations.forEach(location => {
        const imagePath = `${CONFIG.basePath}${location.id}.${CONFIG.imageFormat}`;
        const img = new Image();
        
        img.onload = function() {
            imagesFound++;
            imagesLoading--;
            console.log(`✓ Found image for ${location.name} (${location.id})`);
            
            if (imagesLoading === 0) {
                console.log(`Image validation complete. Found ${imagesFound}/${CONFIG.locations.length} images.`);
            }
        };
        
        img.onerror = function() {
            imagesLoading--;
            console.warn(`✗ Missing image for ${location.name} (${location.id})`);
            
            if (imagesLoading === 0) {
                console.log(`Image validation complete. Found ${imagesFound}/${CONFIG.locations.length} images.`);
            }
        };
        
        img.src = imagePath;
    });
}

// Run the validation when the config loads
let imagesLoaded = false;
window.addEventListener('DOMContentLoaded', function() {
    validateImages();
});

// Function to initialize the navigation system after images are loaded
function initNavigation() {
    if (CONFIG.locations.length > 0) {
        console.log("Images loaded, initializing navigation");
        if (window.navigationSystem) {
            window.navigationSystem.init(CONFIG.defaultLocation);
        } else {
            console.error("Navigation system not found");
        }
    } else {
        console.log("Waiting for images to load...");
        setTimeout(initNavigation, 500);
    }
}