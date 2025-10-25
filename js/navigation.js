/**
 * Navigation system for 360 Photo Viewer
 * Handles creation of navigation arrows and transitions between photos
 */

class NavigationSystem {
    constructor() {
        this.currentLocation = null;
        this.arrowEntities = [];
        this.navigationContainer = document.getElementById('navigation-arrows');
        this.locationInfo = document.getElementById('current-location');
    }

    // Initialize the navigation system
    init(startLocationId) {
        this.loadLocation(startLocationId || CONFIG.defaultLocation);
    }

    // Load a specific location
    loadLocation(locationId) {
        const location = getLocationById(locationId);
        if (!location) {
            console.error(`Location ${locationId} not found`);
            return;
        }

        // Show loading screen
        this.showLoadingScreen();

        // Update current location
        this.currentLocation = location;
        window.currentLocationId = locationId;
        
        // Update location info with grid coordinates if available
        if (CONFIG.grid && CONFIG.grid.enabled && location.gridPosition) {
            this.locationInfo.textContent = `${location.name} (${location.gridPosition.x},${location.gridPosition.y})`;
        } else {
            this.locationInfo.textContent = location.name;
        }

        // Load the 360 image
        const imagePath = getImagePath(locationId);
        console.log("Loading image:", imagePath);
        
        // Clear previous arrows
        this.clearNavigationArrows();

        // Preload the image
        const img = new Image();
        img.onload = () => {
            console.log("Image loaded successfully:", imagePath);
            
            // Update the A-Frame sky directly with the new image path
            document.getElementById('skybox').setAttribute('src', imagePath);
            
            // Create navigation arrows after a short delay to allow the scene to update
            setTimeout(() => {
                this.createNavigationArrows(location);
                this.hideLoadingScreen();
                
            }, 300);
        };
        
        img.onerror = (err) => {
            console.error(`Failed to load image: ${imagePath}`, err);
            // Try to load a fallback image using the location ID directly
            if (CONFIG.grid && CONFIG.grid.enabled) {
                const fallbackPath = `${CONFIG.basePath}${locationId}.${CONFIG.imageFormat}`;
                console.log("Trying fallback image path:", fallbackPath);
                document.getElementById('skybox').setAttribute('src', fallbackPath);
            }
            this.hideLoadingScreen();
        };
        
        img.src = imagePath;
    }

    // Create navigation arrows for the current location
    createNavigationArrows(location) {
        // Get connections from the grid system if enabled
        let connections = [];
        
        if (CONFIG.grid && CONFIG.grid.enabled && typeof getLocationConnections === 'function') {
            // Use the grid-based connection system
            connections = getLocationConnections(location.id);
            console.log(`Grid-based connections for ${location.id}:`, connections);
        } else if (location.connections && location.connections.length) {
            // Fallback to the old connection system
            connections = location.connections;
        }
        
        if (!connections.length) {
            console.log(`No connections found for location ${location.id}`);
            return;
        }

        connections.forEach((connection, index) => {
            // Create arrow entity
            const arrow = document.createElement('a-entity');
            arrow.setAttribute('class', 'nav-arrow clickable');
            
            // Position arrows closer to center (multiply by 1.8 instead of 2.5)
            arrow.setAttribute('position', `${connection.direction.x * 1.8} ${connection.direction.y + 1.6} ${connection.direction.z * 1.8}`);
            arrow.setAttribute('rotation', `${connection.rotation.x} ${connection.rotation.y} ${connection.rotation.z}`);
            
            // Create arrow geometry with larger clickable area and image texture
            arrow.innerHTML = `
                <a-plane class="arrow-hitbox" width="1.8" height="1.8" opacity="0" material="transparent: true;" position="0 0 0"></a-plane>
                <a-image src="#arrow-texture" width="1.2" height="1.2" material="transparent: true; opacity: 0.9"></a-image>
            `;
            
            // Add text entity as a separate entity to ensure it's always facing the camera
            const textEntity = document.createElement('a-entity');
            textEntity.setAttribute('text', `value: ${connection.label}; align: center; color: #FFFFFF; width: 4; wrap-count: 15; anchor: center; baseline: center; font: kelsonsans; side: double; zOffset: 0.1`);
            textEntity.setAttribute('scale', '1.5 1.5 1.5');
            textEntity.setAttribute('position', '0 -1.5 0');
            textEntity.setAttribute('billboard', '');
            
            // No need for specific rotation as billboard component makes text face camera
            
            arrow.appendChild(textEntity);
            
            // Store connection data directly on the element
            arrow.setAttribute('data-target', connection.to);
            
            // Add click event with improved handling
            arrow.addEventListener('click', (event) => {
                console.log('Arrow clicked:', connection.to);
                this.loadLocation(connection.to);
                event.stopPropagation();
            });
            
            // Add touch events for mobile
            arrow.addEventListener('touchstart', (event) => {
                console.log('Touch started on arrow:', connection.to);
                document.getElementById('debug-info').setAttribute('text', 'value', 'Touch started: ' + connection.to);
                event.stopPropagation();
            });
            
            arrow.addEventListener('touchend', (event) => {
                console.log('Touch ended on arrow:', connection.to);
                document.getElementById('debug-info').setAttribute('text', 'value', 'Touch ended: ' + connection.to);
                this.loadLocation(connection.to);
                event.stopPropagation();
            });
            
            // Add cursor event listeners for better feedback
            arrow.addEventListener('mouseenter', function() {
                this.setAttribute('scale', '1.2 1.2 1.2');
                document.getElementById('debug-info').setAttribute('text', 'value', 'Hover: ' + this.getAttribute('data-target'));
            });
            
            arrow.addEventListener('mouseleave', function() {
                this.setAttribute('scale', '1 1 1');
            });
            
            // Add to scene
            this.navigationContainer.appendChild(arrow);
            this.arrowEntities.push(arrow);
        });
    }

    // Clear all navigation arrows
    clearNavigationArrows() {
        this.arrowEntities.forEach(arrow => {
            if (arrow.parentNode) {
                arrow.parentNode.removeChild(arrow);
            }
        });
        this.arrowEntities = [];
    }

    // Show loading screen
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.style.display = 'flex';
        loadingScreen.style.opacity = '1';
    }

    // Hide loading screen
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }

}