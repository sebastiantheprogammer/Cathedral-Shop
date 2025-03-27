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

app.post('/submit', (req, res) => {
  const userIP = req.ip;
  const answer = req.body.answer;

  let savedData = [];
  if (fs.existsSync(dataFile)) {
    savedData = JSON.parse(fs.readFileSync(dataFile));
  }

  const alreadySubmitted = savedData.find(entry => entry.ip === userIP);
  if (data.some(d => d.ip === ip && d.answer === answer)) {
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

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
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
