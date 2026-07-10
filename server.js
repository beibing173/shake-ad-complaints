const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'data.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (e) {
    return { apps: [] };
  }
}

function saveData(d) {
  var dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2), 'utf-8');
}

app.get('/api/apps', function(req, res) {
  var data = loadData();
  var result = data.apps.map(function(app) {
    var r = app.ratings || [];
    var avg = 0;
    if (r.length > 0) {
      avg = r.reduce(function(s, x) { return s + x.stars; }, 0) / r.length;
    }
    var dist = [0,0,0,0,0];
    r.forEach(function(x) { dist[x.stars - 1]++; });
    return { id: app.id, name: app.name, icon: app.icon, description: app.description, ratingCount: r.length, averageRating: Math.round(avg * 10) / 10, distribution: dist };
  });
  result.sort(function(a, b) { return b.ratingCount - a.ratingCount || b.averageRating - a.averageRating; });
  res.json(result);
});

app.get('/api/apps/:id', function(req, res) {
  var data = loadData();
  var app = null;
  for (var i = 0; i < data.apps.length; i++) {
    if (data.apps[i].id === parseInt(req.params.id)) { app = data.apps[i]; break; }
  }
  if (!app) return res.status(404).json({ error: 'not found' });
  var r = app.ratings || [];
  var avg = 0;
  if (r.length > 0) {
    avg = r.reduce(function(s, x) { return s + x.stars; }, 0) / r.length;
  }
  var dist = [0,0,0,0,0];
  r.forEach(function(x) { dist[x.stars - 1]++; });
  var comments = r.slice().reverse();
  res.json({ id: app.id, name: app.name, icon: app.icon, description: app.description, averageRating: Math.round(avg * 10) / 10, ratingCount: r.length, distribution: dist, comments: comments });
});

app.post('/api/apps/:id/rate', function(req, res) {
  var stars = parseInt(req.body.stars);
  var comment = (req.body.comment || '').trim();
  if (!stars || stars < 1 || stars > 5) return res.status(400).json({ error: '星星数需为 1-5' });
  if (comment.length === 0) return res.status(400).json({ error: '请填写吐槽内容' });
  if (comment.length > 500) return res.status(400).json({ error: '吐槽内容过长' });
  var data = loadData();
  var app = null;
  for (var i = 0; i < data.apps.length; i++) {
    if (data.apps[i].id === parseInt(req.params.id)) { app = data.apps[i]; break; }
  }
  if (!app) return res.status(404).json({ error: 'App 不存在' });
  if (!app.ratings) app.ratings = [];
  app.ratings.push({ stars: stars, comment: comment, createdAt: new Date().toISOString() });
  saveData(data);
  res.json({ success: true });
});


app.post('/api/apps', function(req, res) {
  var name = (req.body.name || '').trim();
  var icon = (req.body.icon || '').trim();
  var desc = (req.body.desc || '').trim();
  if (!name) return res.status(400).json({ error: '请输入 App 名称' });
  if (!icon) icon = '';
  if (!desc) desc = '';
  var data = loadData();
  var maxId = 0;
  data.apps.forEach(function(a) { if (a.id > maxId) maxId = a.id; });
  var newApp = { id: maxId + 1, name: name, icon: icon, description: desc, ratings: [] };
  data.apps.push(newApp);
  saveData(data);
  res.json({ success: true, app: newApp });
});

app.listen(PORT, function() {
  console.log('');
  console.log('  ┌──────────────────────────────────────┐');
  console.log('  │  📱 摇一摇广告吐槽榜                   │');
  console.log('  │  http://localhost:' + PORT + '                  │');
  console.log('  └──────────────────────────────────────┘');
  console.log('');
});
