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
  }
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
      else 
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

  let hr = document.createElement('hr');
  hr.style.margin = '8px 0';
  hr.style.width = '100%'; // Ensure it takes full width and breaks the line
  hr.style.border = '1px solid #ccc';
  layerSub.appendChild(hr);

  let hr1 = document.createElement('hr');
  hr1.style.margin = '8px 0';
  hr1.style.width = '100%'; // Ensure it takes full width and breaks the line
  hr1.style.border = '1px solid #ccc';
  indexSub.appendChild(hr1);


   

// Add checkbox for toggling raster layer visibility
function addRasterLayerCheckbox(layer) {
  const container = document.createElement('div');
  container.className = 'layer-checkbox-container';

  const checkboxWrapper = document.createElement('div');
  checkboxWrapper.className = 'checkbox-wrapper';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = true;
  if(layer.order!=0) {
    toggleRasterLayerVisibility(layer.id)
    checkbox.checked = false;
  }
  checkbox.addEventListener('change', () => toggleRasterLayerVisibility(layer.id));

  const label = document.createElement('label');
  label.textContent = layer.name;

  checkboxWrapper.appendChild(checkbox);
  checkboxWrapper.appendChild(label);
  container.appendChild(checkboxWrapper);

 layerControlsContainer.appendChild(container);
}

// Add checkbox for toggling indices layer visibility
function addIndices(layer) {
  const container = document.createElement('div');
  container.className = 'layer-checkbox-container';

  const checkboxWrapper = document.createElement('div');
  checkboxWrapper.className = 'checkbox-wrapper';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = true;
  if(layer.order!=0) {
    toggleRasterLayerVisibility(layer.id)
    checkbox.checked = false;
  }
  checkbox.addEventListener('change', () => toggleRasterLayerVisibility(layer.id));

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
  checkbox.checked = true;
  checkbox.addEventListener('change', () => toggleRasterLayerVisibility(layer.id));

  const label = document.createElement('label');
  label.textContent = layer.name;

  checkboxWrapper.appendChild(checkbox);
  checkboxWrapper.appendChild(label);
  container.appendChild(checkboxWrapper);

  farmsControlsContainer.appendChild(container);
}

//adjust view
function addAdjustViewButton() {
  const container = document.createElement('div');
  container.className = 'adjust-view-container';

  // Ensure farmSub aligns correctly
  farmSub.style.display = 'flex';
  farmSub.style.alignItems = 'center';
  farmSub.style.justifyContent = 'space-between';
  farmSub.style.flexWrap = 'wrap'; // Allow wrapping for elements like <hr>

  const button = document.createElement('button');
  button.style.padding = '7px 7px';
  button.style.border = '1px solid #ccc';
  button.style.borderRadius = '50%';
  button.style.background = '#4CAF50';
  button.style.color = '#fff';
  button.style.cursor = 'pointer';
  button.style.fontSize = '14px';
  button.style.display = 'flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';

  // Add a zoom icon (using Font Awesome or an SVG)
  const zoomIcon = document.createElement('i');
  zoomIcon.className = 'fas fa-search-plus'; // Font Awesome zoom icon class
  zoomIcon.style.fontSize = '14px';
  zoomIcon.style.color = '#fff';

  // Add the icon to the button
  button.appendChild(zoomIcon);

  // Set the map view when the button is clicked
  button.addEventListener('click', () => {
    const orthoCenter = [48.2255, -17.753];
    const orthoZoom = 13.5;

    map.flyTo({
      center: orthoCenter,
      zoom: orthoZoom,
      essential: true, // This ensures the animation works in accessibility mode
    });
  });

  container.appendChild(button);
  farmSub.appendChild(container); // Append to the farmSub container

  // Create and append the <hr> element
  const hr = document.createElement('hr');
  hr.style.margin = '8px 0';
  hr.style.width = '100%'; // Ensure it takes full width and breaks the line
  hr.style.border = '1px solid #ccc';
  farmSub.appendChild(hr);
}

let previousLayerId = null; 
function addFarmBoundaries(farmGeoJSON) {
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
    } = farm.properties;

    // Combine owner information
    const owner = `${ownerFirstName} ${ownerLastName}`;

    // Check if the farmId exists, if not create one (e.g., by using the index or another unique property)
    const layerId = `farm-boundary-${farmId || farm.properties.Location}`; // Using farm location as fallback for ID

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
    map.on('click', layerId, (e) => {
      const hoverPane = document.getElementById('hover-pane');
      hoverPane.style.display = 'block';
      hoverPane.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0;">Farm Details</h3>
          <button id="close-hover-pane" style="background: transparent; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; padding: 2px 5px;">X</button>
        </div>
        <hr style="margin: 8px 0;">
        <p style="margin:15px 0px 0px 0px"><strong>Farm ID:</strong> ${farmId || 'Unknown'}</p>
        <p style="margin:15px 0px 0px 0px"><strong>Location:</strong> ${location}</p>
        <p style="margin:15px 0px 0px 0px"><strong>Area:</strong> ${area}</p>
        <p style="margin:15px 0px 0px 0px"><strong>Owner:</strong> ${owner}</p>
        <p style="margin:15px 0px 0px 0px"><strong>Crop Type:</strong> ${cropType}</p>
        <p style="margin:15px 0px 0px 0px"><strong>Vegetated:</strong> ${vegetated}</p>
        <p style="margin:15px 0px 0px 0px"><strong>Perimeter:</strong> ${PERIMETER}</p>
      `;

      // Add functionality to close the hover pane
      document.getElementById('close-hover-pane').addEventListener('click', () => {
        hoverPane.style.display = 'none';
      });

      // Reset opacity
      if (previousLayerId) {
        map.setPaintProperty(previousLayerId, 'fill-opacity', 0);
      }

      // Show the polygon layer for this farm when clicked
      map.setPaintProperty(layerId, 'fill-opacity', 0.5);
       // Update the previously clicked layer ID
      previousLayerId = layerId;

    });
  });

  // Add checkbox for toggling visibility of all farm boundaries
  addFarmVisibilityCheckbox();
}

// Function to add a checkbox to toggle visibility of all farm boundaries
function addFarmVisibilityCheckbox() {
  const container = document.createElement('div');
  container.className = 'farm-checkbox-container';

  const checkboxWrapper = document.createElement('div');
  checkboxWrapper.className = 'checkbox-wrapper';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = false; // By default, all farms are visible
  toggleAllFarmVisibility(false);
  checkbox.addEventListener('change', () => {
    toggleAllFarmVisibility(checkbox.checked);
  });

  const label = document.createElement('label');
  label.textContent = 'Toggle All Farms';

  checkboxWrapper.appendChild(checkbox);
  checkboxWrapper.appendChild(label);
  container.appendChild(checkboxWrapper);

  farmsControlsContainer.appendChild(container); // Append to the farms control container
}

// Function to toggle the visibility of all farm boundaries
function toggleAllFarmVisibility(isVisible) {
  const layers = map.getStyle().layers; // Get all layers in the map
  layers.forEach((layer) => {
    if (layer.id && layer.id.startsWith('farm-boundary-')) {
      map.setLayoutProperty(layer.id, 'visibility', isVisible ? 'visible' : 'none');
    }
    if (previousLayerId) {
      map.setPaintProperty(previousLayerId, 'fill-opacity', 0);
      previousLayerId = null
    }
  });
}




// Toggle raster layer visibility
function toggleRasterLayerVisibility(layerId) {
  const isVisible = !rasterVisibility[layerId];
  rasterVisibility[layerId] = isVisible;

  const visibility = isVisible ? 'visible' : 'none';
  map.setLayoutProperty(layerId, 'visibility', visibility);
}

// Create a hovering pane on the right side
function createHoverPane() {
  const hoverPane = document.createElement('div');
  hoverPane.id = 'hover-pane';
  hoverPane.style.position = 'absolute';
  hoverPane.style.top = '10px';
  hoverPane.style.right = '10px';
  hoverPane.style.width = '320px';
  hoverPane.style.height = '280px';
  hoverPane.style.backgroundColor = 'white';
  hoverPane.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
  hoverPane.style.border = '1px solid #ccc';
  hoverPane.style.borderRadius = '8px';
  hoverPane.style.zIndex = '1000';
  hoverPane.style.padding = '10px';
  hoverPane.style.paddingBottom = '0px';
  hoverPane.style.overflow = 'auto';
  hoverPane.style.display = 'none';

  const closeButton = document.createElement('button');
  closeButton.textContent = 'X';
  closeButton.style.position = 'absolute';
  closeButton.style.top = '5px';
  closeButton.style.right = '5px';
  closeButton.style.backgroundColor = 'transparent';
  closeButton.style.border = '2px solid #ccc';
  closeButton.style.borderRadius = '4px';
  closeButton.style.fontSize = '16px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.transition = 'background-color 0.3s';

  closeButton.addEventListener('mouseenter', () => {
    closeButton.style.backgroundColor = 'red';
    closeButton.style.color = 'white';
  });

  closeButton.addEventListener('mouseleave', () => {
    closeButton.style.backgroundColor = 'transparent';
    closeButton.style.color = 'black';
  });

  closeButton.addEventListener('click', () => {
    hoverPane.style.display = 'none';
  });

  hoverPane.appendChild(closeButton);
  document.body.appendChild(hoverPane);
}

// Create a smaller hovering pane with different colors for abbreviations and full terms
function createSecondaryPane() {
  const secondaryPane = document.createElement('div');
  secondaryPane.id = 'secondary-pane';
  secondaryPane.style.position = 'absolute';
  secondaryPane.style.bottom = '70px';
  secondaryPane.style.right = '10px';
  secondaryPane.style.width = '250px';
  secondaryPane.style.height = '200px';
  secondaryPane.style.backgroundColor = 'white';
  secondaryPane.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
  secondaryPane.style.border = '1px solid #ccc';
  secondaryPane.style.borderRadius = '8px';
  secondaryPane.style.zIndex = '1000';
  secondaryPane.style.overflow = 'auto';
  secondaryPane.style.display = 'none';

  const list = document.createElement('ul');
  list.style.listStyleType = 'none';
  list.style.padding = '0';
  list.style.marginTop = '16px';
  list.style.marginBottom = '0px';
  list.style.marginLeft = '10px';
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
    fullTerm.textContent = `: ${item.full}`;
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

// Create a button to open and close the secondary pane
function createOpenButton() {
  const openButton = document.createElement('button');
  openButton.textContent = ' i ';
  openButton.style.position = 'absolute';
  openButton.style.bottom = '30px';
  openButton.style.right = '10px';
  openButton.style.backgroundColor = '#4CAF50';
  openButton.style.color = 'white';
  openButton.style.border = 'none';
  openButton.style.borderRadius = '50%';
  openButton.style.paddingLeft = '15px';
  openButton.style.paddingRight = '15px';
  openButton.style.paddingTop = '10px';
  openButton.style.paddingBottom = '10px';
  openButton.style.cursor = 'pointer';
  openButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
  openButton.style.transition = 'background 0.3s, transform 0.3s';

  openButton.addEventListener('mouseenter', () => {
    openButton.style.backgroundColor = '#45a049';
    openButton.style.transform = 'scale(1.1)';
  });

  openButton.addEventListener('mouseleave', () => {
    openButton.style.backgroundColor = '#4CAF50';
    openButton.style.transform = 'scale(1)';
  });

  openButton.addEventListener('click', () => {
    const secondaryPane = document.getElementById('secondary-pane');
    if (secondaryPane.style.display === 'none' || secondaryPane.style.display === '') {
      secondaryPane.style.display = 'block'; // Show the pane
    } else {
      secondaryPane.style.display = 'none'; // Hide the pane
    }
  });

  document.body.appendChild(openButton);
}


// Add a button with a home icon to the section-title
function addHomeButton() {
  // Select the section-title element
  const sectionTitle = document.getElementById('Madagascar-sub');

  // Set up the section-title container for inline content using flexbox
  sectionTitle.style.display = 'flex';
  sectionTitle.style.alignItems = 'center';
  sectionTitle.style.justifyContent = 'space-between';

  // Create a button element
  const homeButton = document.createElement('button');
  homeButton.className = 'home-button';
  homeButton.style.padding = '5px 10px';
  homeButton.style.marginLeft = '10px';
  homeButton.style.border = '1px solid #ccc';
  homeButton.style.borderRadius = '4px';
  homeButton.style.background = '#4CAF50';
  homeButton.style.color = '#fff';
  homeButton.style.cursor = 'pointer';
  homeButton.style.fontSize = '14px';
  homeButton.style.display = 'flex';
  homeButton.style.alignItems = 'center';

  // Add the home icon (using Font Awesome)
  const homeIcon = document.createElement('i');
  homeIcon.className = 'fas fa-home'; // Font Awesome home icon class
  homeIcon.style.marginRight = '5px';

  // Append the icon to the button
  homeButton.appendChild(homeIcon);

  // Add a click event listener to the button
  homeButton.addEventListener('click', () => {
    const orthoCenter = [48.4055, -17.586];
    const orthoZoom = 9;
    map.flyTo({
      center: orthoCenter,
      zoom: orthoZoom,
      essential: true, // Ensure animation works in accessibility mode
    });
  });

  // Append the button to the section-title
  sectionTitle.appendChild(homeButton);
}



// Initialize the map
initializeMap();
