export async function onRequest(context) {
  var { request, env } = context;
  var url = new URL(request.url);
  var path = url.pathname;

  // CORS headers
  var headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  // Load data from KV
  async function loadData() {
    try {
      var raw = await env.DATA.get('data');
      return raw ? JSON.parse(raw) : { apps: [] };
    } catch (e) {
      return { apps: [] };
    }
  }

  async function saveData(data) {
    await env.DATA.put('data', JSON.stringify(data));
  }

  function jsonResponse(data, status) {
    return new Response(JSON.stringify(data), { status: status || 200, headers });
  }

  // GET /api/apps
  if (path === '/api/apps' && request.method === 'GET') {
    var data = await loadData();
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
    return jsonResponse(result);
  }

  // GET /api/apps/:id
  var detailMatch = path.match(/^\/api\/apps\/(\d+)$/);
  if (detailMatch && request.method === 'GET') {
    var data = await loadData();
    var appId = parseInt(detailMatch[1]);
    var app = null;
    for (var i = 0; i < data.apps.length; i++) {
      if (data.apps[i].id === appId) { app = data.apps[i]; break; }
    }
    if (!app) return jsonResponse({ error: 'not found' }, 404);
    var r = app.ratings || [];
    var avg = 0;
    if (r.length > 0) {
      avg = r.reduce(function(s, x) { return s + x.stars; }, 0) / r.length;
    }
    var dist = [0,0,0,0,0];
    r.forEach(function(x) { dist[x.stars - 1]++; });
    var comments = r.slice().reverse();
    return jsonResponse({ id: app.id, name: app.name, icon: app.icon, description: app.description, averageRating: Math.round(avg * 10) / 10, ratingCount: r.length, distribution: dist, comments: comments });
  }

  // POST /api/apps/:id/rate
  var rateMatch = path.match(/^\/api\/apps\/(\d+)\/rate$/);
  if (rateMatch && request.method === 'POST') {
    var body = await request.json();
    var stars = parseInt(body.stars);
    var comment = (body.comment || '').trim();
    if (!stars || stars < 1 || stars > 5) return jsonResponse({ error: '星星数需为 1-5' }, 400);
    if (comment.length === 0) return jsonResponse({ error: '请填写吐槽内容' }, 400);
    if (comment.length > 500) return jsonResponse({ error: '吐槽内容过长' }, 400);
    var data = await loadData();
    var appId = parseInt(rateMatch[1]);
    var app = null;
    for (var i = 0; i < data.apps.length; i++) {
      if (data.apps[i].id === appId) { app = data.apps[i]; break; }
    }
    if (!app) return jsonResponse({ error: 'App 不存在' }, 404);
    if (!app.ratings) app.ratings = [];
    app.ratings.push({ stars: stars, comment: comment, createdAt: new Date().toISOString() });
    await saveData(data);
    return jsonResponse({ success: true });
  }

  // POST /api/apps
  if (path === '/api/apps' && request.method === 'POST') {
    var body = await request.json();
    var name = (body.name || '').trim();
    var icon = (body.icon || '').trim();
    var desc = (body.desc || '').trim();
    if (!name) return jsonResponse({ error: '请输入 App 名称' }, 400);
    var data = await loadData();
    var maxId = 0;
    data.apps.forEach(function(a) { if (a.id > maxId) maxId = a.id; });
    var newApp = { id: maxId + 1, name: name, icon: icon, description: desc, ratings: [] };
    data.apps.push(newApp);
    await saveData(data);
    return jsonResponse({ success: true, app: newApp });
  }

  return jsonResponse({ error: 'not found' }, 404);
}
