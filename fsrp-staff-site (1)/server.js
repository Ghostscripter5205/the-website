const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const session = require('express-session');
const app = express();
const path = require('path');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'fsrp-secret',
  resave: false,
  saveUninitialized: true
}));

let users = JSON.parse(fs.readFileSync('./users.json'));
let cases = fs.existsSync('./cases.json') ? JSON.parse(fs.readFileSync('./cases.json')) : [];

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    req.session.user = user;
    res.redirect('/dashboard.html');
  } else {
    res.send('Invalid login.');
  }
});

app.get('/trainer-guide', (req, res) => {
  if (req.session.user?.role === 'trainer') {
    res.sendFile(path.join(__dirname, '/public/trainer-guide.html'));
  } else {
    res.status(403).send('Access denied.');
  }
});

app.get('/ia-logger', (req, res) => {
  if (req.session.user?.role === 'IA') {
    res.sendFile(path.join(__dirname, '/public/ia-logger.html'));
  } else {
    res.status(403).send('Access denied.');
  }
});

app.post('/submit-case', (req, res) => {
  if (req.session.user?.role !== 'IA') return res.status(403).send('Access denied.');
  cases.push({
    agent: req.session.user.username,
    ...req.body,
    date: new Date().toISOString()
  });
  fs.writeFileSync('./cases.json', JSON.stringify(cases, null, 2));
  res.send('Case logged!');
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));