// STEP 1: Load Nigeria boundary and filter for Nasarawa
var nigeria = ee.FeatureCollection("FAO/GAUL/2015/level1")
                .filter(ee.Filter.eq('ADM0_NAME', 'Nigeria'));

var nasarawa = nigeria.filter(ee.Filter.eq('ADM1_NAME', 'Nassarawa'));

// Display Nasarawa boundary
Map.centerObject(nasarawa, 8);
Map.addLayer(nasarawa, {color: 'red'}, 'Nasarawa Boundary');

// STEP 2: Load Built-up Areas (GHSL 2014)
var ghsl = ee.Image("JRC/GHSL/P2016/BUILT_LDSMT_GLOBE_V1")
              .select('built')
              .clip(nasarawa);

Map.addLayer(ghsl.updateMask(ghsl),
             {min: 0, max: 3, palette: ['white', 'yellow', 'orange', 'red']},
             'Built-up Areas (GHSL 2014)');

// STEP 3A: Load Roads (TIGER) and filter to Nasarawa
var roads = ee.FeatureCollection("TIGER/2016/Roads")
                .filterBounds(nasarawa);

Map.addLayer(roads, {color: 'blue'}, 'Roads (TIGER)');

// STEP 3B: Load VIIRS Night Lights (Dec 2022)
var nightLights = ee.Image('NOAA/VIIRS/DNB/MONTHLY_V1/VCMCFG/20221201')
                    .select('avg_rad')
                    .clip(nasarawa);

Map.addLayer(nightLights,
             {min: 0, max: 60, palette: ['black', 'purple', 'yellow', 'white']},
             'Night Lights (Dec 2022)');

// STEP 4: Buffer roads by 2km and assign numeric ID
var roadBuffer = roads.map(function(f) {
  return f.buffer(2000).set('buffer_id', 1);
});
Map.addLayer(roadBuffer, {color: 'lightblue'}, 'Road Buffer (2km)');

// STEP 5: Identify well-lit areas (night light above 10)
var litAreas = nightLights.gt(10);
Map.addLayer(litAreas.updateMask(litAreas),
             {palette: ['white']}, 'Well-lit Areas');

// STEP 6: Create roadless raster (areas far from roads)
var roadRaster = roadBuffer
                   .reduceToImage(['buffer_id'], ee.Reducer.first())
                   .gt(0);
var roadless = roadRaster.not();

// STEP 7: Identify underserved areas (settlements with no light + no road)
var unlit = litAreas.not();

var underserved = ghsl.updateMask(unlit).updateMask(roadless);
Map.addLayer(underserved.updateMask(underserved),
             {min: 1, max: 3, palette: ['#7b1fa2']},
             'Underserved Rural Areas');

// STEP 8: Create Predictive Suitability Score for Digital Education Need

// Distance to roads
var distanceToRoads = roadRaster.fastDistanceTransform(30).sqrt()
                       .clip(nasarawa);
Map.addLayer(distanceToRoads,
             {min: 0, max: 5000, palette: ['green', 'yellow', 'red']},
             'Distance to Roads (m)');

// Invert and normalize night light (dark = high need)
var lightNeed = nightLights
                  .resample('bilinear')
                  .unmask(0)
                  .divide(60)
                  .subtract(1)
                  .abs();

Map.addLayer(lightNeed, {min: 0, max: 1}, 'Digital Darkness Score');

// Normalize settlement layer
var settleNeed = ghsl.divide(3);
Map.addLayer(settleNeed, {min: 0, max: 1, palette: ['white', 'orange', 'red']}, 'Settlement Index');

// Normalize road distance using .divide() instead of unitScale
var normDistRoads = distanceToRoads.divide(5000).clamp(0, 1);

// Combine into prediction index
var educationNeed = normDistRoads.multiply(0.4)
                      .add(lightNeed.multiply(0.4))
                      .add(settleNeed.multiply(0.2));

// ✅ Print min/max of prediction score
var eduStats = educationNeed.reduceRegion({
  reducer: ee.Reducer.minMax(),
  geometry: nasarawa.geometry(),
  scale: 1000,
  maxPixels: 1e13
});
print('✅ Education Need Prediction Range:', eduStats);

// ✅ Display prediction result on map
Map.addLayer(educationNeed,
             {min: 0.5, max: 1.1, palette: ['green', 'yellow', 'red']},
             'Predicted Education Need Score');
             
             
// ✅ STEP 9: Export the prediction raster for use in QGIS
Export.image.toDrive({
  image: educationNeed.unmask(0).clip(nasarawa), // ensures export includes all areas
  description: 'export_education_need',
  folder: 'GEE_exports',
  fileNamePrefix: 'education_need_index',
  region: nasarawa.geometry(),
  scale: 1000,
  maxPixels: 1e13
});


// STEP X: Compute quantile-based thresholds
var thresholds = educationNeed.reduceRegion({
  reducer: ee.Reducer.percentile([33, 66]),
  geometry: nasarawa.geometry(),
  scale: 1000,
  maxPixels: 1e13
});

print('📊 Quantile Thresholds:', thresholds);

var lowThresh = ee.Number(thresholds.get('educationNeed_p33'));
var highThresh = ee.Number(thresholds.get('educationNeed_p66'));

// STEP Y: Classify into 3 categories
// 1 = Low Need, 2 = Moderate, 3 = High Need
var classified = educationNeed.expression(
  "(b('educationNeed') <= low) ? 1" +
  " : (b('educationNeed') <= high) ? 2" +
  " : 3", {
    'educationNeed': educationNeed,
    'low': lowThresh,
    'high': highThresh
  }
);

Map.addLayer(classified,
             {min: 1, max: 3, palette: ['green', 'yellow', 'red']},
             'Classified Education Need (Quantile)');


             




