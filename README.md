# GeoAI for Digital Education Needs Mapping – Nasarawa State, Nigeria

This project leverages satellite imagery and open geospatial data to map and visualize areas with the highest need for digital education investment in Nasarawa State, Nigeria. The analysis combines spatial predictors such as human settlement data, night-time light intensity, and road network accessibility using Google Earth Engine (GEE) and QGIS.

---

## 🔍 Project Objective

To build a geospatial model that identifies communities underserved by digital infrastructure and in need of targeted digital education interventions. Outputs can inform local and national policymakers, NGOs, and education-focused stakeholders.

---

## 🛠 Tools and Technologies

- [Google Earth Engine](https://earthengine.google.com/)
- [QGIS](https://qgis.org/)
- Sentinel-2 & VIIRS Night-Time Lights
- GHSL Settlement data
- OpenStreetMap Roads
- GeoPackage format (`.gpkg`)

---


---

## 📊 Methodology

1. **Data Acquisition & Processing on GEE**
   - **GHSL Settlement Layer**: Processed using GEE to map population presence.
   - **Night-Time Lights (VIIRS)**: Extracted and normalized to proxy electricity and digital access.
   - **Road Network**: Extracted from OpenStreetMap and used to calculate Euclidean distance to estimate inaccessibility.

2. **Suitability Modeling**
   - All rasters were normalized (0–1) and reclassified into 3 need levels (low, moderate, high).
   - A simple rule-based overlay model was applied:
     > High educational need = High distance to roads + Low nightlights + Presence of settlements

3. **Export to QGIS**
   - Final model exported to `.tif` raster.
   - Map symbology applied in QGIS and overlaid with Local Government Area boundaries.
   - Final maps saved in `.gpkg` and `.qgz` formats.

---

## 🗺 Final Outputs

- **GeoPackage (.gpkg)**: Contains the full classified raster and vector overlays.
- **Interactive Map Project (.qgz)**: QGIS-ready project for further styling or analysis.
- **Exported Maps**: PNGs or TIFFs for presentation or print.

---

## 📌 How to Use

1. Clone this repo:
   ```bash
   git clone https://github.com/93Chidiebere/digital-education-mapping-nasarawa.git


