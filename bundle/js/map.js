mapboxgl.accessToken =
  'pk.eyJ1IjoicmF5YXBhdGk0OSIsImEiOiJjbGVvMWp6OGIwajFpM3luNTBqZHhweXZzIn0.1r2DoIQ1Gf2K3e5WBgDNjA';

const mapContainer = document.getElementById('map-container');
const layerContainer = document.getElementById('layer-container');
const indicesContainer = document.getElementById('indices-container');
const farmsContainer = document.getElementById('farms-container');
const sectionTitle = document.getElementById('Madagascar-sub');
const farmSub = document.getElementById('farm-sub');
const indexSub = document.getElementById('index-sub');
const layerSub = document.getElementById('layer-sub');
const walkthroughContainer = document.getElementById('walkthrough-container');

const orthoCenter = [48.4055, -17.586];
const orthoZoom = 9;

const polygonColors = ['#FF6347', '#4682B4', '#32CD32', '#FFD700', '#8A2BE2'];
const lineColors = ['#FF4500', '#1E90FF', '#32CD32', '#FF1493', '#00FA9A'];

let map;
let rasterVisibility = {};

const rasterLayers = [
  {
    id: 'ORI',
    name: 'ORI',
    tileset: 'mapbox://rayapati49.madagascar-poc-ori',
    order: 0,
    type:0,
  },
  {
    id: 'dem',
    name: 'DEM',
    tileset: 'mapbox://rayapati49.madagascar-poc-dem',
    order: 1,
    type:0,
  },
  {
    id: 'ndvi',
    name: 'NDVI',
    tileset: 'mapbox://rayapati49.madagascar-poc-ndvi',
    order: 2,
    type:1,
  },
  {
    id: 'ndwi',
    name: 'NDWI',
    tileset: 'mapbox://rayapati49.madagascar-poc-ndwi',
    order: 3,
    type:1,
  },
  {
    id: 'si',
    name:'Satellite Image',
    tileset: 'mapbox://rayapati49.madagascar-poc-fields',
    order: 4,
    type:2,
  },
  
];


// Initialize Mapbox map
function initializeMap() {
  map = new mapboxgl.Map({
    container: mapContainer,
    style: 'mapbox://styles/mapbox/outdoors-v12',
    center: orthoCenter,
    zoom: orthoZoom,
    attributionControl: false,
  });

  createHoverPane();
  createSecondaryPane();
  createOpenButton();
  addAdjustViewButton();
  addHomeButton();

  map.on('load', () => {
    // Add raster layers
    rasterLayers.forEach((layer) => {
      map.addSource(layer.id, {
        type: 'raster',
        url: layer.tileset,
      });
      map.addLayer({
        id: layer.id,
        source: layer.id,
        type: 'raster',
        layout: { visibility: 'visible' },
      });

      rasterVisibility[layer.id] = true;
    });

    rasterLayers.forEach((layer) => {
      if(layer.type===0)
        addRasterLayerCheckbox(layer);
      else if(layer.type===1)
        addIndices(layer)
      else if(layer.type===2)
        addFarms(layer)
    });
    // Fetch farm details
    axios.get('/bundle/assets/farm.geojson') // Update the path if needed
    .then((response) => {
      addFarmBoundaries(response.data); // Correct function name
    })
    .catch((error) => {
      console.error('Error loading GeoJSON:', error.response || error.message);
    });

    // Get the coordinates display div
    const coordinatesDisplay = document.getElementById('coordinates-display');
    coordinatesDisplay.textContent = `Longitude: ${orthoCenter[0]}, Latitude: ${orthoCenter[1]}`
    // Add event listener for mouse move
    map.on('mousemove', (event) => {
        const { lng, lat } = event.lngLat;
        coordinatesDisplay.textContent = `Longitude: ${lng.toFixed(5)}, Latitude: ${lat.toFixed(5)}`;
    });

  });
}

  // Create a container for layer controls
  const layerControlsContainer = document.createElement('div');
  layerControlsContainer.className = 'layer-controls-container';
  layerContainer.appendChild(layerControlsContainer);

  //create a container for indices controls
  const indicesControlsContainer = document.createElement('div');
  indicesControlsContainer.className = 'layer-controls-container';
  indicesContainer.appendChild(indicesControlsContainer);

  //create a container for farm controls
  const farmsControlsContainer = document.createElement('div');
  farmsControlsContainer.className = 'layer-controls-container';
  farmsContainer.appendChild(farmsControlsContainer);




   

// Add checkbox for toggling raster layer visibility
function addRasterLayerCheckbox(layer) {
  const container = document.createElement('div');
  container.className = 'layer-checkbox-container';

  const checkboxWrapper = document.createElement('div');
  checkboxWrapper.className = 'checkbox-wrapper';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className='input-box'
  checkbox.checked = true;
  if(layer.order!=0) {
    toggleRasterLayerVisibility(layer.id)
    checkbox.checked = false;
  }
  checkbox.addEventListener('click', () => {
      if (this.checked) {
    this.checked = false;
  } else {
    this.checked = true;
  }
    toggleRasterLayerVisibility(layer.id)
  });

  const label = document.createElement('label');
  label.textContent = layer.name;

  checkboxWrapper.appendChild(checkbox);
  checkboxWrapper.appendChild(label);
  container.appendChild(checkboxWrapper);

 layerControlsContainer.appendChild(container);
}
// Toggle raster layer visibility
function toggleRasterLayerVisibility(layerId) {
  const isVisible = !rasterVisibility[layerId];
  rasterVisibility[layerId] = isVisible;

  const visibility = isVisible ? 'visible' : 'none';
  map.setLayoutProperty(layerId, 'visibility', visibility);
}
// Function to add a checkbox to toggle visibility of all farm boundaries
function addFarmVisibilityCheckbox() {
  const container = document.createElement('div');
  container.className = 'layer-checkbox-container';

  const checkboxWrapper = document.createElement('div');
  checkboxWrapper.className = 'checkbox-wrapper';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className='input-box'
  checkbox.checked = false; // By default, all farms are visible
  toggleAllFarmVisibility(false);
  checkbox.addEventListener('click', () => {
     if (this.checked) {
    this.checked = false;
  } else {
    this.checked = true;
  }
    toggleAllFarmVisibility(checkbox.checked);
  });

  const label = document.createElement('label');
  label.textContent = 'Toggle Farms';

  checkboxWrapper.appendChild(checkbox);
  checkboxWrapper.appendChild(label);
  container.appendChild(checkboxWrapper);

  farmsControlsContainer.appendChild(container); // Append to the farms control container
}
// Add checkbox for toggling indices layer visibility
function addIndices(layer) {
  const container = document.createElement('div');
  container.className = 'layer-checkbox-container';

  const checkboxWrapper = document.createElement('div');
  checkboxWrapper.className = 'checkbox-wrapper';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className='input-box'
  checkbox.checked = true;
  if(layer.order!=0) {
    toggleRasterLayerVisibility(layer.id)
    checkbox.checked = false;
  }
  checkbox.addEventListener('click', () => {
      if (this.checked) {
    this.checked = false;
  } else {
    this.checked = true;
  }toggleRasterLayerVisibility(layer.id)
  });

  const label = document.createElement('label');
  label.textContent = layer.name;

  checkboxWrapper.appendChild(checkbox);
  checkboxWrapper.appendChild(label);
  container.appendChild(checkboxWrapper);

  indicesControlsContainer.appendChild(container);
}
//adding farm raster
function addFarms(layer){
  const container = document.createElement('div');
  container.className = 'layer-checkbox-container';

  const checkboxWrapper = document.createElement('div');
  checkboxWrapper.className = 'checkbox-wrapper';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className='input-box'
  checkbox.checked = true;
  checkbox.addEventListener('click', () => {
      if (this.checked) {
    this.checked = false;
  } else {
    this.checked = true;
  } toggleRasterLayerVisibility(layer.id)
  });

  const label = document.createElement('label');
  label.textContent = layer.name;

  checkboxWrapper.appendChild(checkbox);
  checkboxWrapper.appendChild(label);
  container.appendChild(checkboxWrapper);

  farmsControlsContainer.appendChild(container);
}

let previousLayerId = null; 
function addFarmBoundaries(farmGeoJSON) {
  let previousLayerId = null;

  farmGeoJSON.features.forEach((farm) => {
    const {
      PERIMETER,
      ENCLOSED_AREA: area,
      Farm_ID: farmId,
      Location: location,
      Owner_First_Name: ownerFirstName,
      Owner_Last_Name: ownerLastName,
      Crop_Type: cropType,
      Vegetated: vegetated,
      Fertilizer_Urea: urea,
      Fertilizer_SSP: ssp,
      Fertilizer_MOP: mop,
    } = farm.properties;

    // Combine owner information
    const owner = `${ownerFirstName} ${ownerLastName}`;

    // Generate a unique layer ID
    const layerId = `farm-boundary-${farmId || location}`;

    // Add a boundary source for the farm
    map.addSource(layerId, {
      type: 'geojson',
      data: farm, // Use the individual farm feature as the data
    });

    // Add a layer to draw the boundary (line layer)
    map.addLayer({
      id: `${layerId}-line`,
      type: 'line',
      source: layerId,
      paint: {
        'line-color': vegetated === 'Yes' ? 'green' : 'red', // Color based on vegetation status
        'line-width': 3, // Line width for the boundary
      },
    });

    // Add a layer to fill the polygon
    map.addLayer({
      id: layerId,
      type: 'fill',
      source: layerId,
      paint: {
        'fill-color': vegetated === 'Yes' ? 'green' : 'red', // Color based on vegetation status
        'fill-opacity': 0, // Initially transparent
      },
    });

    // Add a layer to display the farm ID as a label
    map.addLayer({
      id: `${layerId}-label`,
      type: 'symbol',
      source: layerId,
      layout: {
        'text-field': farmId || 'Unknown',
        'text-size': 13,
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-anchor': 'center',
      },
      paint: {
        'text-color': '#000000', // Text color
        'text-halo-color': '#FFFFFF', // Halo color
        'text-halo-width': 1.5, // Width of the halo
        'text-halo-blur': 0.5, // Optional: Add a slight blur to the halo
      },
    });

    // Add a click event to display farm details and convert boundary to a polygon on click
    map.on('click', layerId, () => {
      const hoverPane = document.getElementById('hover-pane');
      hoverPane.style.display = 'block';
      hoverPane.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0;">Farm Details</h3>
          <button id="close-hover-pane" style="background: transparent; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; padding: 2px 5px;">X</button>
        </div>
        <hr style="margin: 8px 0;">
        <p><strong>Farm ID:</strong> ${farmId || 'Unknown'}</p>
        <p><strong>Location:</strong> ${location}</p>
        <p><strong>Area:</strong> ${area}</p>
        <p><strong>Owner:</strong> ${owner}</p>
        <p><strong>Crop Type:</strong> ${cropType}</p>
        <p><strong>Vegetated:</strong> ${vegetated}</p>
        <p><strong>Perimeter:</strong> ${PERIMETER}</p>
        <p><strong>Fertilizer Urea:</strong> ${urea || 0}</p>
        <p><strong>Fertilizer SSP:</strong> ${ssp || 0}</p>
        <p><strong>Fertilizer MOP:</strong> ${mop || 0}</p>
      `;

      // Add functionality to close the hover pane
      document.getElementById('close-hover-pane').addEventListener('click', () => {
        hoverPane.style.display = 'none';
      });

      // Reset opacity for previously selected layer
      if (previousLayerId) {
        map.setPaintProperty(previousLayerId, 'fill-opacity', 0);
      }

      // Highlight the current layer
      map.setPaintProperty(layerId, 'fill-opacity', 0.5);

      // Update the previously clicked layer ID
      previousLayerId = layerId;
    });
  });

  // Add checkbox for toggling visibility of all farm boundaries
  addFarmVisibilityCheckbox();
}


// Function to toggle the visibility of all farm boundaries and close the hover pane
function toggleAllFarmVisibility(isVisible) {
  const layers = map.getStyle().layers; // Get all layers in the map
  layers.forEach((layer) => {
    if (layer.id && layer.id.startsWith('farm-boundary-')) {
      map.setLayoutProperty(layer.id, 'visibility', isVisible ? 'visible' : 'none');
    }
    if (previousLayerId) {
      map.setPaintProperty(previousLayerId, 'fill-opacity', 0);
      previousLayerId = null;
    }
  });

  // Close the hover pane
  const hoverPane = document.getElementById('hover-pane');
  if (hoverPane) {
    hoverPane.style.display = 'none'; 
  }
}
//right pane for farm details
function createHoverPane() {
  const hoverPane = document.createElement('div');
  hoverPane.id = 'hover-pane';

  const closeButton = document.createElement('button');
  closeButton.textContent = 'X';
  closeButton.addEventListener('click', () => {
    hoverPane.style.display = 'none';
  });

  hoverPane.appendChild(closeButton);
  document.body.appendChild(hoverPane);
}

function createSecondaryPane() {
  const secondaryPane = document.createElement('div');
  secondaryPane.id = 'secondary-pane';

  const list = document.createElement('ul');

  list.style.listStyleType = 'none';
  list.style.padding = '0';
  list.style.marginTop = '16px';
  list.style.marginBottom = '0px';
  list.style.marginLeft = '5px';
  list.style.marginRight = '5px';
  list.style.backgroundColor = '#f8f8f8';

  const items = [
    { abbreviation: 'ORI', full: 'Ortho Rectified Image', color: '#4682B4' },
    { abbreviation: 'DEM', full: 'Digital Elevation Model', color: '#4682B4' },
    { abbreviation: 'NDVI', full: 'Normalized Difference Vegetation Index', color: '#4682B4' },
    { abbreviation: 'NDWI', full: 'Normalized Difference Water Index', color: '#4682B4' },
  ];

  items.forEach((item) => {
    const listItem = document.createElement('li');
    listItem.style.margin = '8px 0';
    listItem.style.padding = '4px';
    listItem.style.borderRadius = '4px';
    listItem.style.transition = 'background-color 0.3s';
    listItem.style.cursor = 'pointer';
    listItem.style.backgroundColor = '#f8f8f8';

    const abbreviation = document.createElement('span');
    abbreviation.textContent = item.abbreviation;
    abbreviation.style.color = item.color; // Set color for abbreviation
    abbreviation.style.fontWeight = 'bold';

    const fullTerm = document.createElement('span');
    fullTerm.textContent = `${item.full}`;
    fullTerm.style.marginLeft = '8px';

    listItem.appendChild(abbreviation);
    listItem.appendChild(fullTerm);

    listItem.addEventListener('mouseenter', () => {
      listItem.style.backgroundColor = item.color;
      listItem.style.color = 'white';
      abbreviation.style.color='black'
    });

    listItem.addEventListener('mouseleave', () => {
      listItem.style.backgroundColor = 'transparent';
      listItem.style.color = 'black';
      abbreviation.style.color='#4682B4'
      
    });

    list.appendChild(listItem);
  });

  secondaryPane.appendChild(list);
  document.body.appendChild(secondaryPane);
}

function createOpenButton() {
  const openButton = document.createElement('button');
  openButton.className = 'open-button';
  openButton.textContent = ' i ';
  openButton.addEventListener('click', () => {
    const secondaryPane = document.getElementById('secondary-pane');
    secondaryPane.style.display = secondaryPane.style.display === 'none' ? 'block' : 'none';
  });

  document.body.appendChild(openButton);
}

function addHomeButton() {
  const sectionTitle = document.getElementById('Madagascar-sub');
  sectionTitle.style.display = 'flex';

  const homeButton = document.createElement('button');
  homeButton.className = 'home-button';

  // Use a cleaner, more modern home icon
  const homeIcon = document.createElement('i');
  homeIcon.className = 'fas fa-home'; // Changed from 'fa-home' to 'fa-house'
  homeButton.appendChild(homeIcon);

  homeButton.addEventListener('click', () => {
    const orthoCenter = [48.4055, -17.586];
    const orthoZoom = 9;
    map.flyTo({ center: orthoCenter, zoom: orthoZoom, essential: true });
  });

  sectionTitle.appendChild(homeButton);
}


function addAdjustViewButton() {
  const container = document.createElement('div');
  container.className = 'adjust-view-container';

  const button = document.createElement('button');
  const zoomIcon = document.createElement('i');
  zoomIcon.className = 'fas fa-arrow-right';
  button.appendChild(zoomIcon);

  button.addEventListener('click', () => {
    const orthoCenter = [48.2255, -17.753];
    const orthoZoom = 13.5;
    map.flyTo({ center: orthoCenter, zoom: orthoZoom, essential: true });
  });

  container.appendChild(button);
  farmSub.appendChild(container);

  
}

// Initialize the map
initializeMap();
