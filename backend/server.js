const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;
const SCORES_FILE = path.join(__dirname, 'scores.json');

app.use(cors());
app.use(bodyParser.json());

// Helper to read scores
const readScores = () => {
    if (!fs.existsSync(SCORES_FILE)) {
        return [];
    }
    const data = fs.readFileSync(SCORES_FILE);
    try {
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
};

// Helper to write scores
const writeScores = (scores) => {
    fs.writeFileSync(SCORES_FILE, JSON.stringify(scores, null, 2));
};

// GET scores
app.get('/api/scores', (req, res) => {
    const scores = readScores();
    res.json(scores.slice(0, 10)); // Return top 10
});

// POST score
app.post('/api/scores', (req, res) => {
    const { name, score } = req.body;
    if (!name || score === undefined) {
        return res.status(400).json({ error: 'Name and score are required' });
    }

    const scores = readScores();
    scores.push({ name, score, date: new Date().toISOString() });
    
    // Sort descending by score
    scores.sort((a, b) => b.score - a.score);
    
    // Keep top 50 to avoid file getting too huge
    const topScores = scores.slice(0, 50);
    
    writeScores(topScores);
    
    res.json({ message: 'Score saved', scores: topScores.slice(0, 10) });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // Initialize file if not exists
    if (!fs.existsSync(SCORES_FILE)) {
        writeScores([]);
    }
});
