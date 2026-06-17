// calendar.js — 月历渲染

var calendarYear = new Date().getFullYear();
var calendarMonth = new Date().getMonth() + 1;
var selectedDate = getToday();

function renderCalendar() {
  var data = loadData();
  var today = getToday();

  document.getElementById('calendarTitle').textContent = calendarYear + '年 ' + calendarMonth + '月';

  var firstDay = new Date(calendarYear, calendarMonth - 1, 1);
  var lastDay = new Date(calendarYear, calendarMonth, 0);
  var totalDays = lastDay.getDate();

  // 周一为第一天，计算偏移
  var startDayOfWeek = firstDay.getDay() || 7;

  // 上月填充
  var prevLastDay = new Date(calendarYear, calendarMonth - 1, 0).getDate();
  var cells = [];

  for (var i = startDayOfWeek - 1; i > 0; i--) {
    var d = prevLastDay - i + 1;
    cells.push({ day: d, month: 'prev', dateStr: formatDate(calendarYear, calendarMonth - 1, d) });
  }

  // 本月
  for (var d = 1; d <= totalDays; d++) {
    cells.push({ day: d, month: 'curr', dateStr: formatDate(calendarYear, calendarMonth, d) });
  }

  // 填充到 42 格（6行×7列）
  var remaining = 42 - cells.length;
  for (var d = 1; d <= remaining; d++) {
    cells.push({ day: d, month: 'next', dateStr: formatDate(calendarYear, calendarMonth + 1, d) });
  }

  // 收集本月所有有作业的日期状态
  var dateStatus = {};
  for (var d = 1; d <= totalDays; d++) {
    var ds = formatDate(calendarYear, calendarMonth, d);
    var tasks = data.tasks.filter(function(t) { return !t.archived && t.dueDate === ds; });
    if (tasks.length === 0) {
      dateStatus[ds] = 'none';
    } else {
      var allDone = tasks.every(function(t) { return t.completedAt; });
      dateStatus[ds] = allDone ? 'green' : 'red';
    }
  }

  var grid = document.getElementById('calendarGrid');
  grid.innerHTML = cells.map(function(c) {
    var cls = 'calendar-cell';
    if (c.month !== 'curr') cls += ' other-month';
    if (c.dateStr === today) cls += ' today';
    if (c.dateStr === selectedDate) cls += ' selected';

    var dot = '';
    if (c.month === 'curr') {
      var status = dateStatus[c.dateStr];
      if (status === 'red') dot = '<span class="date-dot red"></span>';
      else if (status === 'green') dot = '<span class="date-dot green"></span>';
    }

    return '<div class="' + cls + '" data-date="' + c.dateStr + '">' +
      c.day + dot +
    '</div>';
  }).join('');

  // 点击日期事件
  grid.querySelectorAll('.calendar-cell').forEach(function(cell) {
    cell.addEventListener('click', function() {
      selectedDate = cell.dataset.date;
      renderCalendar();
      showDateDetail(selectedDate);
    });
  });

  // 默认选中今天
  showDateDetail(selectedDate);
}

function formatDate(year, month, day) {
  return year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
}

function showDateDetail(dateStr) {
  var tasks = getTasksForDate(dateStr);
  var container = document.getElementById('dateDetail');

  if (tasks.length === 0) {
    container.innerHTML = '<h3>' + formatDateCN(dateStr) + '</h3>' +
      '<div class="empty-state"><div class="empty-icon">📭</div>' +
      '<div class="empty-text">这天没有作业</div></div>';
    return;
  }

  var pending = tasks.filter(function(t) { return !t.completedAt; });
  var done = tasks.filter(function(t) { return t.completedAt; });

  container.innerHTML = '<h3>' + formatDateCN(dateStr) + '（' + tasks.length + '项，完成' + done.length + '项）</h3>' +
    (pending.length > 0 ? '<h4 style="margin-top:8px; color:var(--accent);">⏳ 待完成</h4>' +
      pending.map(renderTaskCardHTML).join('') : '') +
    (done.length > 0 ? '<h4 style="margin-top:8px; color:var(--success);">✅ 已完成</h4>' +
      done.map(renderTaskCardHTML).join('') : '');

  // 加载缩略图
  tasks.forEach(function(t) {
    if (t.photoIds) loadTaskPhotoThumbs(t.photoIds);
  });

  // 绑定事件
  container.querySelectorAll('.btn-checkin').forEach(function(btn) {
    btn.addEventListener('click', function() {
      handleCheckInClick(btn.dataset.taskId);
    });
  });
  container.querySelectorAll('.task-photo-thumb').forEach(function(img) {
    img.addEventListener('click', function() {
      viewPhoto(img.dataset.photo);
    });
  });
  container.querySelectorAll('.btn-photo-sm').forEach(function(btn) {
    btn.addEventListener('click', function() {
      window._photoTargetContainer = 'checkinPhoto';
      window._checkinPhotoTaskId = btn.dataset.addPhoto;
      document.getElementById('photoInput').click();
    });
  });
}

function navigateMonth(delta) {
  calendarMonth += delta;
  if (calendarMonth > 12) { calendarMonth = 1; calendarYear++; }
  if (calendarMonth < 1) { calendarMonth = 12; calendarYear--; }
  selectedDate = null;
  renderCalendar();
}
