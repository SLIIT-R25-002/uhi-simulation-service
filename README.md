## 🌇 HeatScape Digital Twin Model and High resolution GIS data Viewer & Simulation Engine

AI-Powered Urban Thermal Simulation
A fully integrated Digital model and high resolution GIS data visualization and physics-based thermal simulation engine that bridges Digital modeling, real-world weather data, high resolution GIS data and MATLAB/Simulink to predict urban heat island (UHI) effects at component level. 

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
	

🔧 Technologies Used

| Layer                      | Technology                                                              |
|-------------------------------|-------------------------------------------------------------------------------|
| Frontend     | React, Three.js, React Three Fiber, Drei     |
| Backend                    | Node.js, Express, Multer                                               |
| Physics                    | Raycasting, SunCalc, TransformControls                                           |
| Simulation     | MATLAB, Simulink, Simscape     |
| Weather API                   | WeatherAPI.com                                           |
| AI Integration                    | CSV → VLM Prompting, ML Model Input                                           |      
               	
	      
🚀 How to Run 
1. Start the MATLAB Backend 
bash
 
 
1
2
cd backend
node server.js
 
 

    Ensure MATLAB is in your system PATH. 
     

2. Start the React Frontend 
bash
 
 
1
2
3
cd frontend
npm install
npm start
 
 

    App runs on http://localhost:3000 
     

3. Use the Interface 

    Upload a building model
    Set latitude, longitude, date & time
    Click "Start Simulation"
    View results in results/simulation_results.csv
     

 
📤 Sample Output (CSV) 
csv
 
 
1
2
3
4
Object Name,Thickness (m),Density,Thermal_Conductivity,Area,Mass,Material_type,Wind_Speed,Sun_Exposure,Temperature,Humidity,FinalWallTemperature_C
Wall_001,0.2,2400,1.8,100,48000,Concrete,6.19,95,35,64,38.7
Roof_001,0.15,2700,2.3,80,32400,Steel,6.19,100,35,64,41.2
...
 
 
 
🤝 Integration with Other Components 
IoT Localization Service
	
Uses snapshot data for
thermal context
in VLM prompts
VLM Recommendation Engine
	
Receives
CSV + image
to generate
urban cooling strategies
UHI Detection Model
	
Uses metadata for
logistic regression
on heat retention
 
 

    This component is the data source for AI-driven decision-making. 
     

 
📈 Research Impact 

This module directly supports the HeatScape research goals by: 

    🔬 Enabling fine-grained thermal simulation
    🌐 Bridging digital twins with real-world conditions
    🤖 Feeding AI models with structured, physics-based data
    🏙️ Supporting smart city planning and urban heat mitigation
     

 
📄 License 

This project is licensed under the MIT License – see the LICENSE  file for details. 
 
🎓 Academic Context 

This component is part of the HeatScape research initiative at SLIIT, focusing on: 

    🏙️ Urban Heat Island (UHI) Detection
    🌡️ Thermal Simulation & AI
    🌐 3D Digital Twin Integration
    🤖 Vision-Language Model (VLM) Prompting
     

Research Team 

    Institution: Sri Lanka Institute of Information Technology (SLIIT)
    Year: 4th Year Research Project
    Project Code: R25-002
     

 
🆘 Support 

For issues or questions: 

    🐞 Open an Issue 
    📧 Contact the development team
    📚 Refer to Three.js Docs  and MATLAB Simulink 
     

 
🌐 Live Demo 

👉 View Live at HeatScape  
 
🌟 Future Enhancements 

    🌙 Night-time simulation with artificial lighting
    🌀 Real-time wind particle effects
    📊 Dashboard with exposure analytics
    🤖 Auto-generate VLM prompts from simulation results
    ☁️ Cloud-based MATLAB execution (Azure/AWS)
     

 

    HeatScape: Where Urban Design Meets AI-Powered Climate Intelligence 🌆 
     
