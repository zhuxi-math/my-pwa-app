// weekly.js — 按周次统计打卡

function renderWeeklySummary(weekRange) {
  weekRange = weekRange || getWeekRange(getToday());
  var data = loadData();

  var weekTasks = data.tasks.filter(function(t) {
    return !t.archived && t.dueDate >= weekRange.monday && t.dueDate <= weekRange.sunday;
  });
  var doneTasks = weekTasks.filter(function(t) { return t.completedAt; });
  var totalCount = weekTasks.length;
  var doneCount = doneTasks.length;
  var rate = totalCount > 0 ? Math.round(doneCount / totalCount * 100) : 0;

  // 本周获得的星星
  var weekStars = data.starHistory.filter(function(h) {
    return h.date >= weekRange.monday && h.date <= weekRange.sunday && h.earned > 0;
  }).reduce(function(sum, h) { return sum + h.earned; }, 0);

  // 本周新增错题
  var weekErrors = data.errorBook.filter(function(e) {
    var date = e.createdAt.slice(0, 10);
    return date >= weekRange.monday && date <= weekRange.sunday;
  }).length;

  // 本周复习错题次数
  var weekReviews = data.errorBook.reduce(function(sum, e) {
    if (e.lastReviewAt) {
      var date = e.lastReviewAt.slice(0, 10);
      if (date >= weekRange.monday && date <= weekRange.sunday) sum++;
    }
    return sum;
  }, 0);

  // 按学科分组
  var subjects = getSubjects();
  var subjectStats = subjects.map(function(s) {
    var subTasks = weekTasks.filter(function(t) { return t.subjectId === s.id; });
    var subDone = subTasks.filter(function(t) { return t.completedAt; });
    return {
      subject: s,
      total: subTasks.length,
      done: subDone.length,
      rate: subTasks.length > 0 ? Math.round(subDone.length / subTasks.length * 100) : 100
    };
  }).filter(function(s) { return s.total > 0; });

  var html = '<div class="weekly-summary">' +
    '<div class="ws-header">' +
      '<h3>📊 第' + weekRange.weekNumber + '周总结</h3>' +
      '<p>' + formatDateCN(weekRange.monday) + ' - ' + formatDateCN(weekRange.sunday) + '</p>' +
    '</div>' +
    '<div class="ws-rate" style="color:' + (rate >= 80 ? 'var(--success)' : 'var(--accent)') + ';">' +
      rate + '% 完成率' +
    '</div>' +
    '<div class="ws-stats">' +
      '<div class="ws-stat"><div class="stat-num">' + totalCount + '</div><div class="stat-label">本周作业</div></div>' +
      '<div class="ws-stat"><div class="stat-num">' + doneCount + '</div><div class="stat-label">已完成</div></div>' +
      '<div class="ws-stat"><div class="stat-num">' + (totalCount - doneCount) + '</div><div class="stat-label">未完成</div></div>' +
      '<div class="ws-stat"><div class="stat-num">⭐' + weekStars + '</div><div class="stat-label">获得星星</div></div>' +
      '<div class="ws-stat"><div class="stat-num">' + weekErrors + '</div><div class="stat-label">新增错题</div></div>' +
      '<div class="ws-stat"><div class="stat-num">' + weekReviews + '次</div><div class="stat-label">复习错题</div></div>' +
    '</div>';

  if (subjectStats.length > 0) {
    html += '<div class="ws-subjects"><h4>各学科完成情况</h4>' +
      subjectStats.map(function(s) {
        var fillColor = s.rate >= 80 ? 'var(--success)' : (s.rate >= 50 ? 'var(--warning)' : 'var(--accent)');
        return '<div class="ws-subject-row">' +
          '<span>' + s.subject.icon + '</span>' +
          '<span style="width:40px;">' + s.subject.name + '</span>' +
          '<div class="ws-subject-bar">' +
            '<div class="ws-subject-fill" style="width:' + s.rate + '%; background:' + fillColor + ';"></div>' +
          '</div>' +
          '<span style="width:50px; text-align:right;">' + s.done + '/' + s.total + '</span>' +
          '<span>' + (s.rate === 100 ? '✅' : (s.rate >= 50 ? '⚠️' : '❌')) + '</span>' +
        '</div>';
      }).join('') +
    '</div>';
  }

  html += '</div>';

  return html;
}

function getAvailableWeeks() {
  var data = loadData();
  var weeks = new Set();

  data.tasks.forEach(function(t) {
    if (!t.archived) {
      weeks.add(t.dueDate.slice(0, 10));
    }
  });
  data.checkIns && Object.keys(data.checkIns).forEach(function(date) {
    weeks.add(date);
  });

  var weekList = [];
  weeks.forEach(function(dateStr) {
    var range = getWeekRange(dateStr);
    weekList.push(range);
  });

  // 去重按周
  var uniqueWeeks = [];
  var seen = new Set();
  weekList.forEach(function(w) {
    var key = w.monday;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueWeeks.push(w);
    }
  });

  uniqueWeeks.sort(function(a, b) { return b.monday.localeCompare(a.monday); });
  return uniqueWeeks;
}

function renderWeekPicker(containerId, callback) {
  var weeks = getAvailableWeeks();
  if (weeks.length === 0) {
    document.getElementById(containerId).innerHTML = '<p style="text-align:center;color:var(--text-secondary);">暂无记录</p>';
    return;
  }

  var currentIdx = 0;
  var currentWeek = getWeekRange(getToday());
  weeks.forEach(function(w, i) {
    if (w.monday === currentWeek.monday) currentIdx = i;
  });

  function render() {
    var w = weeks[currentIdx];
    document.getElementById(containerId).innerHTML =
      '<div class="week-picker">' +
        '<button class="btn-icon" id="weekPrev">◀</button>' +
        '<span class="week-label">第' + w.weekNumber + '周 ' + w.monday + ' ~ ' + w.sunday + '</span>' +
        '<button class="btn-icon" id="weekNext">▶</button>' +
      '</div>' +
      '<div id="weekSummaryInner"></div>';

    document.getElementById('weekSummaryInner').innerHTML = callback(w);

    document.getElementById('weekPrev').addEventListener('click', function() {
      if (currentIdx < weeks.length - 1) { currentIdx++; render(); }
    });
    document.getElementById('weekNext').addEventListener('click', function() {
      if (currentIdx > 0) { currentIdx--; render(); }
    });
  }

  render();
}

function showWeeklySummaryModal() {
  openModal('modalWeekly');
  var container = document.getElementById('weeklySummaryContent');
  renderWeekPicker('weeklySummaryContent', function(w) {
    return renderWeeklySummary(w);
  });
}
