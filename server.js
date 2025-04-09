require('dotenv').config();

const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const dataFile = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static('public'));
app.set('trust proxy', true);

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.post('/submit', (req, res) => {
  const userIP = req.ip;
  const answer = req.body.answer;

  let savedData = [];
  if (fs.existsSync(dataFile)) {
    savedData = JSON.parse(fs.readFileSync(dataFile));
  }

  const alreadySubmitted = savedData.find(entry => entry.ip === userIP && entry.answer === answer);
  if (alreadySubmitted) {
    return res.status(403).send('Already submitted this answer.');
  }
  
  const newEntry = {
    ip: userIP,
    answer,
    timestamp: new Date().toISOString()
  };
  savedData.push(newEntry);
  fs.writeFileSync(dataFile, JSON.stringify(savedData, null, 2));
  res.json({ message: 'Submission saved.' });
});

app.get('/admin', (req, res) => {
  const password = req.query.pass;
  if (password !== process.env.ADMIN_PASS) return res.status(401).send('Unauthorized');
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/api/data', (req, res) => {
  const password = req.query.pass;
  if (password !== process.env.ADMIN_PASS) return res.status(401).json({ error: 'Unauthorized' });
  const data = fs.existsSync(dataFile) ? JSON.parse(fs.readFileSync(dataFile)) : [];
  res.json(data);
});

app.get('/clear', (req, res) => {
  const password = req.query.pass;
  if (password !== process.env.ADMIN_PASS) return res.status(401).send('Unauthorized');
  fs.writeFileSync(dataFile, JSON.stringify([], null, 2));
  res.send('Data cleared');
});

app.get('/clear-no', (req, res) => {
  if (req.query.pass !== process.env.ADMIN_PASS) return res.status(401).send('Unauthorized');
  let data = JSON.parse(fs.readFileSync(dataFile));
  data = data.filter(entry => entry.answer !== 'NO');
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  res.send('NO answers cleared');
});

// Questions management endpoints
const questionsFile = path.join(__dirname, 'questions.json');

// Initialize questions file if it doesn't exist
if (!fs.existsSync(questionsFile)) {
  fs.writeFileSync(questionsFile, JSON.stringify([], null, 2));
}

// Get all questions
app.get('/api/questions', (req, res) => {
  if (req.query.pass !== process.env.ADMIN_PASS) return res.status(401).json({ error: 'Unauthorized' });
  const questions = JSON.parse(fs.readFileSync(questionsFile));
  res.json(questions);
});

// Add a new question
app.post('/api/questions', (req, res) => {
  if (!req.body.question || !req.body.options) {
    return res.status(400).json({ error: 'Missing question or options' });
  }
  
  const questions = JSON.parse(fs.readFileSync(questionsFile));
  const newQuestion = {
    _id: Date.now().toString(),
    question: req.body.question,
    options: req.body.options
  };
  
  questions.push(newQuestion);
  fs.writeFileSync(questionsFile, JSON.stringify(questions, null, 2));
  res.json(newQuestion);
});

// Delete a question
app.delete('/api/questions/:id', (req, res) => {
  if (req.query.pass !== process.env.ADMIN_PASS) return res.status(401).json({ error: 'Unauthorized' });
  
  const questions = JSON.parse(fs.readFileSync(questionsFile));
  const filteredQuestions = questions.filter(q => q._id !== req.params.id);
  
  if (filteredQuestions.length === questions.length) {
    return res.status(404).json({ error: 'Question not found' });
  }
  
  fs.writeFileSync(questionsFile, JSON.stringify(filteredQuestions, null, 2));
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
