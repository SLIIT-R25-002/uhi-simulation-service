const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const csv = require('csv-parser'); // ← Add this
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
app.use(express.json());
app.use('/results', express.static(RESULTS_DIR));

// File upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => cb(null, 'simulation_input.csv')
});
const upload = multer({ storage });

// ✅ Helper: Read CSV and transform to prediction format
function transformToPredictionData(csvPath) {
    return new Promise((resolve, reject) => {
        const data = [];
        fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', (row) => {
                try {
                    data.push([
                        'building', // fixed first value
                        row.Material_type || 'Unknown',
                        parseFloat(row.FinalWallTemperature_C) || 0,
                        parseFloat(row.Humidity) || 0,
                        parseFloat(row.Area * 100) || 0
                    ]);
                } catch (err) {
                    console.warn('Skipping invalid row:', row);
                }
            })
            .on('end', () => resolve(data))
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
                // 🚀 Transform CSV to prediction format
                const predictionData = await transformToPredictionData(outputCsvPath);

                // 📤 Send to Flask ML model
                const predictRes = await fetch('http://127.0.0.1:5000/predict', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: predictionData })
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