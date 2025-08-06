const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure required directories exist
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const RESULTS_DIR = path.join(__dirname, 'results');

if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());

// Serve static results (for CSV download)
app.use('/results', express.static(RESULTS_DIR));

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        cb(null, 'simulation_input.csv'); // Force consistent name
    }
});

const upload = multer({ storage });

// Route: Upload CSV and trigger MATLAB simulation
app.post('/upload-simulation-input', upload.single('file'), (req, res) => {
    const inputCsvPath = path.join(UPLOADS_DIR, 'simulation_input.csv');
    const outputCsvPath = path.join(RESULTS_DIR, 'simulation_results.csv');

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('✅ Input CSV received:', inputCsvPath);

    // Set environment variable for MATLAB script
    const env = { ...process.env, SIM_INPUT_PATH: inputCsvPath };

    // Command: Run MATLAB with external script
    const matlabCommand = 'matlab -batch "run(\'matlabSimulation.m\')"';

    const matlabProcess = exec(matlabCommand, { cwd: __dirname, env }, (error, stdout, stderr) => {
        if (error) {
            console.error('❌ MATLAB Execution Error:', error);
            console.error('STDOUT:', stdout);
            console.error('STDERR:', stderr);
            return res.status(500).json({
                error: 'MATLAB simulation failed',
                details: error.message
            });
        }

        // Check if result file was generated
        setTimeout(() => {
            if (fs.existsSync(outputCsvPath)) {
                console.log('✅ Simulation results generated:', outputCsvPath);
                res.json({
                    success: true,
                    message: 'Simulation completed successfully',
                    resultUrl: '/results/simulation_results.csv'
                });
            } else {
                res.status(500).json({
                    error: 'Simulation completed but no output file was generated.',
                    details: 'Check MATLAB script and model path.'
                });
            }
        }, 2000); // Allow time for file write
    });

    // Optional: Log MATLAB output in real-time
    matlabProcess.stdout.on('data', (data) => {
        console.log(`MATLAB: ${data}`);
    });

    matlabProcess.stderr.on('data', (data) => {
        console.error(`MATLAB Error: ${data}`);
    });
});

// Health check route
app.get('/health', (req, res) => {
    res.json({ status: 'Backend server is running', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Backend server is running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    process.exit(0);
});