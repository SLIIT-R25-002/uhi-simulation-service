🌇 HeatScape Digital Twin Model and High resolution GIS data Viewer & Simulation Engine

AI-Powered Urban Thermal Simulation
A fully integrated 3D visualization and physics-based thermal simulation engine that bridges 3D modeling, real-world weather data, and MATLAB/Simulink to predict urban heat island (UHI) effects at component level. 

🌟 Overview 

This component is the core visualization and simulation hub of the HeatScape research project. It enables users to: 

    🏗️ Upload and manipulate 3D building and GIS models
    ☀️ Simulate real-time sunlight exposure heatmaps
    🌬️ Integrate live weather data (temperature, humidity, wind speed)
    🧪 Trigger MATLAB-based thermal simulations
    📊 Generate metadata-rich CSVs for AI and VLM analysis
    📸 Capture scene snapshots for downstream AI reasoning
     

It serves as the bridge between physical geometry, environmental conditions, and predictive analytics — enabling smart urban planning decisions. 
 
🚀 Key Features 
🏗️ 3D Model & GIS Integration 

    ✅ Upload .glb, .gltf, .stl building models
    ✅ Overlay .geojson or 3D GIS terrain
    ✅ Interactive manipulation using TransformControls
    ✅ Real-time rendering with Three.js and React Three Fiber
     

☀️ Dynamic Sunlight Exposure Engine 

    🔅 Computes real sun position using SunCalc based on:
        Latitude & Longitude
        Date & Time
         
    🌞 Simulates dynamic shadows and sunlight exposure
    📊 Calculates % exposure per object using raycasting
    🔥 Visualizes heatmaps on surfaces (green → yellow → red)
     

🌍 Real-Time Weather Integration 

    📡 Fetches live weather data from WeatherAPI.com 
    🌡️ Retrieves:
        Temperature (°C)
        Humidity (%)
        Wind Speed (km/h → converted to m/s)
         
    🔄 Automatically binds weather to simulation metadata
     

📸 High-Fidelity Snapshot Capture 

    🖼️ Captures the current 3D scene as PNG
    🎯 Used as input for Vision-Language Models (VLMs) for AI-driven recommendations
    💾 Downloadable or auto-uploaded for AI analysis
     

🧪 MATLAB + Simulink Thermal Simulation Pipeline 

    ⚙️ Generates a structured CSV with:
        Material properties (Thermal Conductivity, Density, etc.)
        Geometry (Area, Thickness, Mass)
        Environmental inputs (Sun Exposure, Wind, Temp, Humidity)
         
    📤 Sends CSV to Node.js backend
    🤖 Triggers MATLAB Simulink model (ThermalSimModel.slx) via command line
    📥 Returns final wall temperatures to frontend
    📈 Enables physics-accurate thermal prediction
     

📊 Metadata Export & AI Readiness 

    ✅ Exports full simulation-ready CSV
    ✅ Compatible with:
        Machine Learning models (e.g., logistic regression for UHI detection)
        VLM prompt engineering
        Urban planning dashboards
         
 📂 Folder Structure
 
 HeatScape/
├── frontend/
│   └── components/
│       └── SimulationModule/
│           ├── ModelViewer.js         # This component
│           └── ...
├── backend/
│   ├── server.js                      # Node.js file handler
│   ├── matlabSimulation.m             # MATLAB script
│   └── results/                       # Output CSV
│   └── ThermalSimModel.slx            # Simulink thermal model
│   └── models/                        # Sample GLB/STL files
└── README.md

🔧 Technologies Used

Layer	                Technology
Frontend	            React, Three.js, React Three Fiber, Drei
Physics	              Raycasting, SunCalc, TransformControls
Backend	              Node.js, Express, Multer
Simulation	          MATLAB, Simulink
Weather               API	WeatherAPI.com
AI Integration	      CSV → VLM Prompting, ML Model Input
<img width="480" height="141" alt="image" src="https://github.com/user-attachments/assets/a419b8b0-6c7c-49a5-bf29-0c369b639de3" />
