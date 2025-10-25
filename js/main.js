/**
 * Main application file for 360 Photo Viewer
 * Initializes the application and handles core functionality
 */

// Create global variables
let navigationSystem;
let imageCache = {};
let isVRMode = false;

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize navigation system
    navigationSystem = new NavigationSystem();
    window.navigationSystem = navigationSystem; // Make it globally accessible
    
    // Initialize the application
    initApp();
    
    // Add event listeners
    setupEventListeners();
});

// Initialize the application
function initApp() {
    console.log("Initializing 360 Photo Navigation App");
    
    // Validate configured images
    validateImages();
    
    // Initialize navigation
    initNavigation();
}

// Set up event listeners
function setupEventListeners() {
    // Listen for VR mode changes
    const scene = document.querySelector('a-scene');
    scene.addEventListener('enter-vr', () => {
        isVRMode = true;
        // Adjust UI for VR mode
        document.getElementById('info-panel').style.display = 'none';
    });
    
    scene.addEventListener('exit-vr', () => {
        isVRMode = false;
        // Restore UI for non-VR mode
        document.getElementById('info-panel').style.display = 'block';
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        // Adjust UI elements if needed
    });
    
    // Handle keyboard navigation (optional)
    document.addEventListener('keydown', (e) => {
        if (!navigationSystem.currentLocation) return;
        
        // Example: Use arrow keys for navigation
        const connections = navigationSystem.currentLocation.connections;
        if (!connections || !connections.length) return;
        
        // Find connections based on direction
        let targetConnection = null;
        
        switch(e.key) {
            case 'ArrowUp':
                // Find forward connection (negative z)
                targetConnection = connections.find(c => c.direction.z < 0 && Math.abs(c.direction.z) > Math.abs(c.direction.x));
                break;
            case 'ArrowDown':
                // Find backward connection (positive z)
                targetConnection = connections.find(c => c.direction.z > 0 && Math.abs(c.direction.z) > Math.abs(c.direction.x));
                break;
            case 'ArrowLeft':
                // Find left connection (negative x)
                targetConnection = connections.find(c => c.direction.x < 0 && Math.abs(c.direction.x) > Math.abs(c.direction.z));
                break;
            case 'ArrowRight':
                // Find right connection (positive x)
                targetConnection = connections.find(c => c.direction.x > 0 && Math.abs(c.direction.x) > Math.abs(c.direction.z));
                break;
        }
        
        if (targetConnection) {
            navigationSystem.loadLocation(targetConnection.to);
        }
    });
}

// Preload images for adjacent locations to improve navigation experience
function preloadAdjacentLocations() {
    if (!navigationSystem.currentLocation) return;
    
    const connections = navigationSystem.currentLocation.connections;
    if (!connections) return;
    
    connections.forEach(connection => {
        const locationId = connection.to;
        const imagePath = getImagePath(locationId);
        
        // Only preload if not already in cache
        if (!imageCache[locationId]) {
            const img = new Image();
            img.src = imagePath;
            imageCache[locationId] = img;
        }
    });
}

// Function to handle dynamic image quality based on device performance
function adjustImageQuality() {
    // Check device performance
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isLowEndDevice = isMobile && navigator.deviceMemory && navigator.deviceMemory < 4;
    
    // Adjust quality settings based on device capabilities
    if (isLowEndDevice) {
        CONFIG.imageQuality.mobile.width = 1024;
        CONFIG.imageQuality.mobile.quality = 70;
    }
}

// Call this function on startup
adjustImageQuality();