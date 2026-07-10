var selectedStars = 0;
var currentTheme = localStorage.getItem('theme') || 'dark';
if (currentTheme === 'light') document.documentElement.setAttribute('data-theme', 'light');

function $(s) { return document.querySelector(s); }
function $$(s) { return document.querySelectorAll(s); }

fetch('/api/apps').then(function(r){return r.json()}).then(function(apps){
  renderApps(apps);
  updateStats(apps);
document.getElementById('themeToggle').addEventListener('click', function() {
  var html = document.documentElement;
  if (html.getAttribute('data-theme') === 'light') {
    html.removeAttribute('data-theme');
    this.innerHTML = '🌙 暗色';
    localStorage.setItem('theme', 'dark');
  } else {
    html.setAttribute('data-theme', 'light');
    this.innerHTML = '☀️ 亮色';
    localStorage.setItem('theme', 'light');
  }
});
if (currentTheme === 'light') document.getElementById('themeToggle').innerHTML = '☀️ 亮色';

}).catch(function(){ $('#appList').innerHTML = '<div class="loading">❌ 加载失败，请确认服务已启动</div>'; });

function updateStats(apps) {
  var t = apps.length;
  var r = apps.reduce(function(s,a){return s + a.ratingCount;}, 0);
  $('#statsBar').innerHTML = '📊 ' + t + ' 个 App 上榜 · ' + r + ' 条吐槽 · 🕶️ 完全匿名';
}

function renderApps(apps) {
  var html = '';
  if (apps.length === 0) {
    html = '<div class="empty-state"><div class="emoji">📱</div><p>还没有 App，点击上方「添加 App」开始吐槽！</p></div>';
  } else {
    apps.forEach(function(app, i) {
      var badge = i === 0 ? '<div class="rank-badge gold">🏆</div>'
      : i === 1 ? '<div class="rank-badge silver">🥈</div>'
      : i === 2 ? '<div class="rank-badge bronze">🥉</div>'
      : '<div class="rank-badge">' + (i + 1) + '</div>';
    html += '<div class="app-card" data-id="' + app.id + '">'
      + badge
      + '<img class="app-icon" src="' + app.icon + '" alt="' + app.name + '" loading="lazy" onerror="this.src=\'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23444466%22 width=%22100%22 height=%22100%22 rx=%2220%22/%3E%3Ctext x=%2250%22 y=%2265%22 text-anchor=%22middle%22 font-size=%2240%22 fill=%22%238888aa%22%3E?%3C/text%3E%3C/svg%3E\'">'
      + '<div class="app-info"><div class="app-name">' + app.name + '</div>'
      + '<div class="app-desc">' + app.description + '</div>'
      + '<div class="app-meta">' + renderStars(app.averageRating)
      + ' <span class="rating-num">' + app.averageRating.toFixed(1) + '</span>'
      + ' <span class="count-num">(' + app.ratingCount + ' 条吐槽)</span></div>'
      + renderDistBar(app.distribution, app.ratingCount)
      + '</div></div>';
    });
  }
  $('#appList').innerHTML = html;
  $$('.app-card').forEach(function(el){
    el.addEventListener('click', function(){ openDetail(parseInt(el.dataset.id)); });
  });
}

document.getElementById('addAppBtn').addEventListener('click', function() { showAddAppModal(); });

function showAddAppModal() {
  $('#modal').classList.remove('hidden');
  $('#modalBody').innerHTML = '<h3 style="margin-bottom:16px;">➕ 添加 App</h3>'
    + '<div class="form-group"><label>App 名称 *</label><input id="addName" placeholder="例如：微信" maxlength="30"></div>'
    + '<div class="form-group"><label>图标链接（可选）</label><input id="addIcon" placeholder="https://example.com/icon.png"></div>'
    + '<div class="form-group"><label>吐槽描述（可选）</label><textarea id="addDesc" placeholder="为什么要吐槽这个 App？" maxlength="200" style="min-height:60px;"></textarea></div>'
    + '<div class="btn-row"><button class="btn-primary" id="addSubmitBtn">✅ 添加</button><button class="btn-secondary" id="addCancelBtn">取消</button></div>'
    + '<div id="addMsg" style="margin-top:8px;font-size:0.85rem;"></div>';
  document.getElementById('addSubmitBtn').onclick = function() {
    var name = document.getElementById('addName').value.trim();
    var icon = document.getElementById('addIcon').value.trim();
    var desc = document.getElementById('addDesc').value.trim();
    if (!name) { document.getElementById('addMsg').innerHTML = '<span style="color:var(--accent);">请填写 App 名称</span>'; return; }
    document.getElementById('addSubmitBtn').disabled = true;
    document.getElementById('addSubmitBtn').textContent = '添加中...';
    fetch('/api/apps', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({name:name, icon:icon, desc:desc})
    }).then(function(r){return r.json()}).then(function(d){
      if (d.success) {
        document.getElementById('addMsg').innerHTML = '<span style="color:#51cf66;">✅ ' + d.app.name + ' 已添加！</span>';
        setTimeout(function() { closeModal(); refreshList(); }, 800);
      } else {
        document.getElementById('addMsg').innerHTML = '<span style="color:var(--accent);">❌ ' + (d.error||'失败') + '</span>';
      }
    }).catch(function(){
      document.getElementById('addMsg').innerHTML = '<span style="color:var(--accent);">❌ 网络错误</span>';
    }).finally(function(){
      document.getElementById('addSubmitBtn').disabled = false;
      document.getElementById('addSubmitBtn').textContent = '✅ 添加';
    });
  };
  document.getElementById('addCancelBtn').onclick = closeModal;
}

function refreshList() {
  fetch('/api/apps').then(function(r){return r.json()}).then(function(apps){
    renderApps(apps);
    updateStats(apps);
  });
}

function renderStars(avg) {
  var s = '';
  for (var i = 1; i <= 5; i++) {
    if (avg >= i) s += '★';
    else s += '<span class="empty">★</span>';
  }
  return '<span class="stars">' + s + '</span>';
}

function renderDistBar(dist, total) {
  if (total === 0) return '';
  var max = Math.max.apply(null, dist) || 1;
  var html = '<div class="dist-bar">';
  for (var i = 5; i >= 1; i--) {
    html += '<div class="bar" style="width:' + Math.max((dist[i-1]/max)*100, 2) + 'px"></div>';
  }
  return html + '<span class="bar-label">5★→1★</span></div>';
}

var currentDetailId = 0;

function openDetail(id) {
  currentDetailId = id;
  $('#modal').classList.remove('hidden');
  $('#modalBody').innerHTML = '<div class="loading">加载中...</div>';
  fetch('/api/apps/' + id).then(function(r){return r.json()}).then(function(app){
    selectedStars = 0;
    renderDetail(app);
  });
}

function closeModal() { $('#modal').classList.add('hidden'); }
$('.modal-backdrop').addEventListener('click', closeModal);
$('.modal-close').addEventListener('click', closeModal);
document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeModal(); });

function renderDetail(app) {
  var starHtml = '';
  for (var i = 1; i <= 5; i++) {
    starHtml += '<span data-star="' + i + '" class="' + (app.averageRating >= i ? 'active' : '') + '">★</span>';
  }
  var distHtml = '';
  var max = Math.max.apply(null, app.distribution) || 1;
  for (var i = 5; i >= 1; i--) {
    var pct = (app.distribution[i-1] / max) * 100;
    var cls = i <= 2 ? 'low' : (i <= 3 ? 'mid' : 'high');
    distHtml += '<div class="dist-row"><span>' + i + '★</span><div class="dist-fill ' + cls + '" style="width:' + pct + '%"></div><span>' + app.distribution[i-1] + '</span></div>';
  }
  var commentsHtml = '';
  (app.comments || []).forEach(function(c){
    var cs = '';
    for (var i = 0; i < c.stars; i++) cs += '★';
    for (var i = c.stars; i < 5; i++) cs += '☆';
    commentsHtml += '<div class="comment"><div class="comment-stars">' + cs + '</div><div class="comment-text">' + esc(c.comment) + '</div><div class="comment-time">' + new Date(c.createdAt).toLocaleDateString('zh-CN') + '</div></div>';
  });
  if (!commentsHtml) commentsHtml = '<div style="color:var(--text-dim);padding:20px;text-align:center;">暂无吐槽，快来发表第一条！</div>';

  $('#modalBody').innerHTML = '<div class="detail-header">'
    + '<img class="detail-icon" src="' + app.icon + '" alt="' + app.name + '" onerror="this.src=\'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23444466%22 width=%22100%22 height=%22100%22 rx=%2220%22/%3E%3Ctext x=%2250%22 y=%2265%22 text-anchor=%22middle%22 font-size=%2240%22 fill=%22%238888aa%22%3E?%3C/text%3E%3C/svg%3E\'">'
    + '<div><div class="detail-name">' + app.name + '</div><div class="detail-desc">' + app.description + '</div></div></div>'
    + '<div class="detail-stats"><span class="detail-stars">' + starHtml + '</span><span class="detail-avg">' + app.averageRating.toFixed(1) + '</span><span class="detail-count">(' + app.ratingCount + ' 条)</span></div>'
    + '<div class="detail-dist">' + distHtml + '</div>'
    + '<div class="rate-section"><h4>⭐ 给 ' + app.name + ' 打分 + 吐槽</h4><div class="rate-stars" id="rateStars"></div><textarea id="rateComment" placeholder="吐槽一下这个 App 的摇一摇广告..." maxlength="500"></textarea><button class="btn-primary" id="rateBtn">📨 匿名发送</button><div id="rateMsg" style="margin-top:8px;font-size:0.85rem;"></div></div>'
    + '<h4 style="margin-bottom:8px;">💬 全部吐槽 (' + app.ratingCount + ')</h4><div id="commentsList">' + commentsHtml + '</div>';

  initRateForm(app.id);
}

function initRateForm(appId) {
  var starsEl = $('#rateStars');
  starsEl.innerHTML = '';
  for (var i = 1; i <= 5; i++) {
    var s = document.createElement('span');
    s.textContent = '★';
    s.dataset.s = i;
    starsEl.appendChild(s);
  }
  starsEl.querySelectorAll('span').forEach(function(s) {
    s.addEventListener('click', function() {
      selectedStars = parseInt(s.dataset.s);
      starsEl.querySelectorAll('span').forEach(function(sp, idx) {
        sp.classList.toggle('active', idx < selectedStars);
      });
    });
    s.addEventListener('mouseenter', function() {
      var v = parseInt(s.dataset.s);
      starsEl.querySelectorAll('span').forEach(function(sp, idx) {
        sp.classList.toggle('active', idx < v);
      });
    });
  });
  starsEl.addEventListener('mouseleave', function() {
    starsEl.querySelectorAll('span').forEach(function(sp, idx) {
      sp.classList.toggle('active', idx < selectedStars);
    });
  });

  $('#rateBtn').onclick = function() {
    var stars = selectedStars;
    var comment = $('#rateComment').value.trim();
    if (!stars) { $('#rateMsg').innerHTML = '<span style="color:var(--accent);">请先选择星级</span>'; return; }
    if (!comment) { $('#rateMsg').innerHTML = '<span style="color:var(--accent);">请填吐槽内容</span>'; return; }
    $('#rateBtn').disabled = true;
    $('#rateBtn').textContent = '发送中...';
    fetch('/api/apps/' + appId + '/rate', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({stars:stars, comment:comment})
    }).then(function(r){return r.json()}).then(function(d){
      if (d.success) {
        $('#rateMsg').innerHTML = '<span style="color:#51cf66;">✅ 吐槽成功！戳空白处关闭后刷新榜单</span>';
        $('#rateComment').value = '';
        selectedStars = 0;
        // Refresh detail after a moment
        setTimeout(function(){
          // Refresh the app list
          fetch('/api/apps').then(function(r){return r.json()}).then(function(apps){
            renderApps(apps);
            updateStats(apps);
          });
          // Reload detail
          fetch('/api/apps/' + appId).then(function(r){return r.json()}).then(function(app){
            selectedStars = 0;
            renderDetail(app);
          });
        }, 500);
      } else {
        $('#rateMsg').innerHTML = '<span style="color:var(--accent);">❌ ' + (d.error||'失败') + '</span>';
      }
    }).catch(function(){
      $('#rateMsg').innerHTML = '<span style="color:var(--accent);">❌ 网络错误</span>';
    }).finally(function(){
      $('#rateBtn').disabled = false;
      $('#rateBtn').textContent = '📨 匿名发送';
    });
  };
}

function esc(str) {
  var d = document.createElement('div');
  d.appendChild(document.createTextNode(str));
  return d.innerHTML;
}
