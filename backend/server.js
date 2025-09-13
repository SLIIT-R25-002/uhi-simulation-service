const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const csv = require('csv-parser');
const fetch = require('node-fetch');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4200;

// Ensure required directories exist
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const RESULTS_DIR = path.join(__dirname, 'results');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/results', express.static(RESULTS_DIR));

// File upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => cb(null, 'simulation_input.csv')
});
const upload = multer({ storage });

// ✅ Helper: Transform CSV to segments array
function transformToSegments(csvPath) {
    return new Promise((resolve, reject) => {
        const segments = [];
        fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', (row) => {
                try {
                    segments.push({
                        label: row['ObjectName'] || 'Unnamed',
                        material: (row.Material_type || 'Unknown').toLowerCase(),
                        temp: parseFloat(row.FinalWallTemperature_C) || 0,
                        humidity: parseFloat(row.Humidity) || 0,
                        area: parseFloat(row.Area) || 0
                    });
                } catch (err) {
                    console.warn('Skipping invalid row:', row);
                }
            })
            .on('end', () => resolve(segments))
            .on('error', reject);
    });
}

// Route: Upload CSV → Run MATLAB → Send to /predict
app.post('/upload-simulation-input', upload.single('file'), (req, res) => {
    const inputCsvPath = path.join(UPLOADS_DIR, 'simulation_input.csv');
    const outputCsvPath = path.join(RESULTS_DIR, 'simulation_results.csv');

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('✅ Input CSV received:', inputCsvPath);

    const env = { ...process.env, SIM_INPUT_PATH: inputCsvPath };
    const matlabCommand = 'matlab -batch "run(\'matlabSimulation.m\')"';

    const matlabProcess = exec(matlabCommand, { cwd: __dirname, env }, async (error, stdout, stderr) => {
        if (error) {
            console.error('❌ MATLAB Execution Error:', error);
            return res.status(500).json({
                error: 'MATLAB simulation failed',
                details: error.message
            });
        }

        // Wait for MATLAB to finish and write output
        setTimeout(async () => {
            if (!fs.existsSync(outputCsvPath)) {
                return res.status(500).json({
                    error: 'Simulation completed but no output file was generated.'
                });
            }

            console.log('✅ simulation_results.csv generated. Preparing prediction payload...');

            try {
                // 🚀 Transform CSV to segments format
                const segments = await transformToSegments(outputCsvPath);
                // 📤 Send to Flask ML model
                const predictRes = await fetch('http://127.0.0.1:5002/predict', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ segments })
                });

                const predictionResult = await predictRes.json();

                // ✅ Success: Return both simulation and prediction
                res.json({
                    success: true,
                    message: 'Simulation and prediction completed',
                    resultUrl: '/results/simulation_results.csv',
                    prediction: predictionResult
                });

            } catch (err) {
                console.error('❌ Prediction API Error:', err);
                res.json({
                    success: true,
                    message: 'Simulation succeeded but prediction failed',
                    resultUrl: '/results/simulation_results.csv',
                    warning: 'Could not reach prediction API'
                });
            }
        }, 3000); // Adjust timeout based on simulation time
    });

    matlabProcess.stdout.on('data', (data) => console.log(`MATLAB: ${data}`));
    matlabProcess.stderr.on('data', (data) => console.error(`MATLAB Error: ${data}`));
});

// ✅ New: Process image + CSV → Send to VLM API
app.post('/get_recommendation', express.json({ limit: '10mb' }), async (req, res) => {
    const { image: imageBase64, timestamp } = req.body;

    if (!imageBase64) {
        return res.status(400).json({ error: 'No image provided' });
    }

    console.log('🖼️ Received base64 image for recommendation');
    console.log('📸 Timestamp:', timestamp);
    console.log('🧩 Image Data Length:', imageBase64.length, 'characters');

    const outputCsvPath = path.join(RESULTS_DIR, 'simulation_results.csv');

    if (!fs.existsSync(outputCsvPath)) {
        console.warn('⚠️ simulation_results.csv not found. Using empty data.');
    }

    try {
        // 🚀 Transform CSV to segments format
        const segments = fs.existsSync(outputCsvPath)
            ? await transformToSegments(outputCsvPath)
            : [{
                label: 'Unknown',
                material: 'concrete',
                temp: 35.0,
                humidity: 60,
                area: 100
            }];

        // 📦 Prepare payload for VLM
        const payload = {
            segments,
            image_base64: imageBase64
        };

        console.log('📤 Forwarding to VLM API:', 'http://localhost:5002/recommend');
        console.log('📊 Segment count:', segments.length);
        // 🌐 Call the VLM recommendation API
        const vlmRes = await fetch('http://127.0.0.1:5002/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!vlmRes.ok) {
            throw new Error(`VLM API responded with status: ${vlmRes.status}`);
        }

        const recommendation = await vlmRes.json();

        // ✅ Success: Forward response to frontend
        res.json({
            success: true,
            message: 'Recommendation generated successfully',
            recommendation
        });

    } catch (err) {
        console.error('❌ Failed to generate recommendation:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to process recommendation',
            details: err.message
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'Backend server is running', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Backend server is running on http://localhost:${PORT}`);
    console.log(`📁 Uploads: ${UPLOADS_DIR}`);
    console.log(`📊 Results: ${RESULTS_DIR}`);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    process.exit(0);
});
