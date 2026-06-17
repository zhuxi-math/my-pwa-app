// rewards.js — 星星罐、徽章系统、庆祝动画

const BADGE_DEFINITIONS = [
  { id: 'first_checkin', name: '初次打卡', desc: '完成第一次作业打卡', icon: '🥇', check: function() {
    var data = loadData();
    return data.tasks.some(function(t) { return t.completedAt; });
  }},
  { id: 'ten_tasks', name: '小有所成', desc: '累计完成 10 项作业', icon: '📚', check: function() {
    return getTotalCompletedTasks() >= 10;
  }},
  { id: 'fifty_tasks', name: '学霸诞生', desc: '累计完成 50 项作业', icon: '🎓', check: function() {
    return getTotalCompletedTasks() >= 50;
  }},
  { id: 'hundred_stars', name: '满星达人', desc: '累计获得 100 颗星星', icon: '🏆', check: function() {
    return loadData().stars >= 100;
  }},
  { id: 'perfect_week', name: '完美一周', desc: '一周完成率 100%', icon: '✨', check: function() {
    return checkWeeklyCompletion() === 100;
  }},
  { id: 'review_master', name: '知错能改', desc: '累计复习错题 20 次', icon: '📔', check: function() {
    return getTotalReviewedErrors() >= 20;
  }}
];

function checkAndAwardBadges() {
  var data = loadData();
  var newBadges = [];

  BADGE_DEFINITIONS.forEach(function(badge) {
    if (data.badges.indexOf(badge.id) < 0 && badge.check()) {
      data.badges.push(badge.id);
      newBadges.push(badge);
    }
  });

  if (newBadges.length > 0) {
    saveData();
    newBadges.forEach(function(badge) {
      showCelebration('🏆 获得新徽章！', badge.icon + ' ' + badge.name);
    });
  }

  return newBadges;
}

function renderStarsJar() {
  var data = loadData();
  var stars = data.stars;
  var jar = document.getElementById('starsJar');
  var maxShow = Math.min(stars, 80);

  var html = '';
  for (var i = 0; i < maxShow; i++) {
    html += '<span class="star-icon" style="animation-delay:' + (i * 0.02) + 's;">⭐</span>';
  }
  if (stars === 0) {
    html = '<span style="color:var(--text-secondary); font-size:0.85rem;">空空如也~ 快去做作业赚星星吧！</span>';
  }
  if (stars > 80) {
    html += '<span style="font-size:0.8rem; color:var(--text-secondary);">...还有' + (stars - 80) + '颗⭐</span>';
  }

  jar.innerHTML = html;
  document.getElementById('starsTotal').textContent = '共 ' + stars + ' 颗星星';
}

function renderBadges() {
  var data = loadData();
  var grid = document.getElementById('badgeGrid');

  grid.innerHTML = BADGE_DEFINITIONS.map(function(badge) {
    var unlocked = data.badges.indexOf(badge.id) >= 0;
    return '<div class="badge-item ' + (unlocked ? 'unlocked' : 'locked') + '">' +
      '<div class="badge-icon">' + (unlocked ? badge.icon : '🔒') + '</div>' +
      '<div class="badge-name">' + badge.name + '</div>' +
      '<div class="badge-desc">' + badge.desc + '</div>' +
    '</div>';
  }).join('');
}

function renderStarHistory() {
  var data = loadData();
  var history = data.starHistory.slice().reverse().slice(0, 20);
  var list = document.getElementById('starHistoryList');

  if (history.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-text">还没有星星记录</div></div>';
    return;
  }

  list.innerHTML = history.map(function(h) {
    var sign = h.earned > 0 ? '+' : '';
    return '<div class="star-history-item">' +
      '<span>' + h.reason + '</span>' +
      '<span style="color:' + (h.earned > 0 ? 'var(--success)' : 'var(--accent)') + '; font-weight:600;">' +
        sign + h.earned + '⭐' +
      '</span>' +
      '<span style="font-size:0.7rem; color:var(--text-secondary);">' + h.date + '</span>' +
    '</div>';
  }).join('');
}

function renderRewardsTab() {
  renderStarsJar();
  renderBadges();
  renderStarHistory();
}

function showCelebration(title, subtitle) {
  var overlay = document.getElementById('celebrationOverlay');
  document.getElementById('celebrationText').textContent = title;
  document.getElementById('celebrationSub').textContent = subtitle;
  overlay.classList.add('active');
  setTimeout(function() {
    overlay.classList.remove('active');
  }, 3000);
}
