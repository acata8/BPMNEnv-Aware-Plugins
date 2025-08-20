/**
 * EnvironmentService - Manages environmental configuration data
 * 
 * Responsibilities:
 * - Store and manage loaded environment configuration
 * - Provide access to places, edges, logical places, and views
 * - Handle configuration validation and queries
 * - Emit events when configuration changes
 * - Handle manual file loading
 */
export function EnvironmentService(eventBus) {
  this.eventBus = eventBus;
  this.currentConfig = null;
  this.isLoaded = false;

  // Listen for configuration events
  eventBus.on('environment.config.loaded', ({ config }) => {
    this.setConfiguration(config);
  });

  eventBus.on('environment.config.cleared', () => {
    this.clearConfiguration();
  });
}

EnvironmentService.$inject = ['eventBus'];

/**
 * Set the current environment configuration
 * @param {Object} config - Configuration object with data, fileName, loadedAt
 */
EnvironmentService.prototype.setConfiguration = function(config) {
  this.currentConfig = config;
  this.isLoaded = true;
  
  // Fire event for other modules
  this.eventBus.fire('environment.ready', {
    config: this.currentConfig
  });
};

/**
 * Clear the current configuration
 */
EnvironmentService.prototype.clearConfiguration = function() {
  this.currentConfig = null;
  this.isLoaded = false;
  
  console.log('Environment configuration cleared');
  
  this.eventBus.fire('environment.cleared');
};

/**
 * Handle manual file loading from user input
 * @param {File} file - File object from input
 */
EnvironmentService.prototype.handleManualFileLoad = function(file) {
  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      const content = e.target.result;
      const data = JSON.parse(content);
      
      // Validate the data structure
      if (!this.validateEnvironmentData(data)) {
        this.eventBus.fire('environment.manual.loaded', {
          success: false,
          error: 'Invalid environment file format'
        });
        return;
      }
      
      // Create configuration object
      const config = {
        data: data,
        fileName: file.name,
        loadedAt: new Date().toISOString(),
        source: 'manual'
      };
      
      // Set the configuration
      this.setConfiguration(config);
      
      // Fire success event
      this.eventBus.fire('environment.manual.loaded', {
        success: true,
        config: config
      });
      
    } catch (error) {
      console.error('Failed to parse environment file:', error);
      this.eventBus.fire('environment.manual.loaded', {
        success: false,
        error: 'Failed to parse JSON file: ' + error.message
      });
    }
  };
  
  reader.onerror = () => {
    this.eventBus.fire('environment.manual.loaded', {
      success: false,
      error: 'Failed to read file'
    });
  };
  
  reader.readAsText(file);
};

/**
 * Validate environment data structure
 * @param {Object} data - Data to validate
 * @returns {boolean} True if valid
 */
EnvironmentService.prototype.validateEnvironmentData = function(data) {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  // Check for required arrays
  const requiredArrays = ['places', 'edges', 'logicalPlaces', 'views'];
  for (const key of requiredArrays) {
    if (!Array.isArray(data[key])) {
      console.warn(`Missing or invalid ${key} array in environment data`);
      return false;
    }
  }
  
  // Validate places structure
  if (data.places.length > 0) {
    const place = data.places[0];
    if (!place.id || !place.name) {
      console.warn('Places must have id and name properties');
      return false;
    }
  }
  
  return true;
};

/**
 * Check if configuration is loaded
 * @returns {boolean} True if configuration is loaded
 */
EnvironmentService.prototype.hasConfiguration = function() {
  return this.isLoaded && this.currentConfig !== null;
};

/**
 * Get the current configuration
 * @returns {Object|null} Current configuration or null
 */
EnvironmentService.prototype.getConfiguration = function() {
  return this.currentConfig;
};

/**
 * Get all places from the configuration
 * @returns {Array} Array of place objects
 */
EnvironmentService.prototype.getPlaces = function() {
  return this.currentConfig?.data?.places || [];
};

/**
 * Get all edges from the configuration
 * @returns {Array} Array of edge objects
 */
EnvironmentService.prototype.getEdges = function() {
  return this.currentConfig?.data?.edges || [];
};

/**
 * Get all logical places from the configuration
 * @returns {Array} Array of logical place objects
 */
EnvironmentService.prototype.getLogicalPlaces = function() {
  return this.currentConfig?.data?.logicalPlaces || [];
};

/**
 * Get all views from the configuration
 * @returns {Array} Array of view objects
 */
EnvironmentService.prototype.getViews = function() {
  return this.currentConfig?.data?.views || [];
};

/**
 * Find a place by ID
 * @param {string} placeId - Place ID to find
 * @returns {Object|null} Place object or null if not found
 */
EnvironmentService.prototype.findPlaceById = function(placeId) {
  const places = this.getPlaces();
  return places.find(place => place.id === placeId) || null;
};

/**
 * Find a place by name
 * @param {string} placeName - Place name to find
 * @returns {Object|null} Place object or null if not found
 */
EnvironmentService.prototype.findPlaceByName = function(placeName) {
  const places = this.getPlaces();
  return places.find(place => place.name === placeName) || null;
};

/**
 * Get places by zone
 * @param {string} zone - Zone identifier (e.g., "A", "B")
 * @returns {Array} Array of places in the specified zone
 */
EnvironmentService.prototype.getPlacesByZone = function(zone) {
  const places = this.getPlaces();
  return places.filter(place => place.attributes?.zone === zone);
};

/**
 * Get places by purpose
 * @param {string} purpose - Purpose identifier (e.g., "teaching", "studying")
 * @returns {Array} Array of places with the specified purpose
 */
EnvironmentService.prototype.getPlacesByPurpose = function(purpose) {
  const places = this.getPlaces();
  return places.filter(place => place.attributes?.purpose === purpose);
};

/**
 * Get available destinations (place names)
 * @returns {Array} Array of place names that can be used as destinations
 */
EnvironmentService.prototype.getAvailableDestinations = function() {
  const places = this.getPlaces();
  return places.map(place => place.name).filter(name => name);
};

/**
 * Get places with free seats
 * @param {number} minSeats - Minimum number of free seats (optional)
 * @returns {Array} Array of places with available seats
 */
EnvironmentService.prototype.getAvailablePlaces = function(minSeats = 1) {
  const places = this.getPlaces();
  return places.filter(place => {
    const freeSeats = place.attributes?.freeSeats;
    return freeSeats && freeSeats >= minSeats;
  });
};

/**
 * Get configuration summary for debugging
 * @returns {Object} Summary of loaded configuration
 */
EnvironmentService.prototype.getConfigSummary = function() {
  if (!this.hasConfiguration()) {
    return { loaded: false };
  }

  const data = this.currentConfig.data;
  return {
    loaded: true,
    fileName: this.currentConfig.fileName,
    loadedAt: this.currentConfig.loadedAt,
    source: this.currentConfig.source || 'unknown',
    summary: {
      places: data.places?.length || 0,
      edges: data.edges?.length || 0,
      logicalPlaces: data.logicalPlaces?.length || 0,
      views: data.views?.length || 0
    },
    zones: [...new Set(data.places?.map(p => p.attributes?.zone).filter(Boolean))],
    purposes: [...new Set(data.places?.map(p => p.attributes?.purpose).filter(Boolean))]
  };
};



/**
 * Validate that a destination exists in the configuration
 * @param {string} destination - Destination name to validate
 * @returns {boolean} True if destination exists
 */
EnvironmentService.prototype.isValidDestination = function(destination) {
  if (!destination || !this.hasConfiguration()) return false;
  
  const places = this.getPlaces();
  return places.some(place => place.name === destination);
};

/**
 * Get suggestions for destinations based on partial input
 * @param {string} partial - Partial destination name
 * @param {number} maxSuggestions - Maximum number of suggestions (default: 5)
 * @returns {Array} Array of suggested destination names
 */
EnvironmentService.prototype.getDestinationSuggestions = function(partial, maxSuggestions = 5) {
  if (!partial || !this.hasConfiguration()) return [];
  
  const places = this.getPlaces();
  const partialLower = partial.toLowerCase();
  
  const suggestions = places
    .filter(place => place.name && place.name.toLowerCase().includes(partialLower))
    .map(place => place.name)
    .slice(0, maxSuggestions);
    
  return suggestions;
};