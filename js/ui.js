// ui.js — DOM 辅助、模态框、Toast、确认对话框

function switchTab(tabId) {
  document.querySelectorAll('.panel').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });

  var panel = document.getElementById(tabId);
  if (panel) panel.classList.add('active');

  var tabBtn = document.querySelector('[data-tab="' + tabId + '"]');
  if (tabBtn) tabBtn.classList.add('active');
}

function openModal(modalId) {
  var modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  var modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function showToast(message, type) {
  type = type || '';
  var container = document.getElementById('toastContainer');
  var toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(function() {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(function() { toast.remove(); }, 300);
  }, 2500);
}

function confirmDialog(message) {
  return new Promise(function(resolve) {
    document.getElementById('confirmMessage').textContent = message;
    openModal('modalConfirm');

    function cleanup(val) {
      closeModal('modalConfirm');
      document.getElementById('confirmYes').removeEventListener('click', onYes);
      document.getElementById('confirmNo').removeEventListener('click', onNo);
      resolve(val);
    }

    function onYes() { cleanup(true); }
    function onNo() { cleanup(false); }

    document.getElementById('confirmYes').addEventListener('click', onYes);
    document.getElementById('confirmNo').addEventListener('click', onNo);
  });
}

function renderTaskCardHTML(task) {
  var subject = getSubjectById(task.subjectId);
  var subIcon = subject ? subject.icon : '📝';
  var subColor = subject ? subject.color : '#888';
  var isDone = !!task.completedAt;
  var overdue = isOverdue(task);

  var metaHTML = '';
  if (isDone) {
    metaHTML = '✅ ' + (task.completedAt ? task.completedAt.slice(0, 16).replace('T', ' ') : '') + ' 完成';
  } else if (overdue) {
    metaHTML = '<span class="due-overdue">⚠️ 已逾期</span> 截止 ' + formatDateCN(task.dueDate);
  } else {
    metaHTML = '⏰ 截止 ' + formatDateCN(task.dueDate);
  }
  if (task.note) {
    metaHTML += ' · 📝 ' + task.note;
  }

  var photosHTML = getTaskPhotosHTML(task.photoIds);

  var actionsHTML = '';
  if (isDone) {
    actionsHTML = '<button class="btn-checkin checked" disabled>✅</button>';
  } else {
    actionsHTML = '<button class="btn-checkin" data-task-id="' + task.id + '">✅</button>';
  }
  actionsHTML += '<button class="btn-photo-sm" data-add-photo="' + task.id + '">📷</button>';

  return '<div class="task-card' + (isDone ? ' done' : '') + '" style="border-left-color:' + subColor + ';">' +
    '<span class="task-subject-icon" style="background:' + subColor + '20; color:' + subColor + ';">' + subIcon + '</span>' +
    '<div class="task-info">' +
      '<div class="task-title-text">' + task.title + '</div>' +
      '<div class="task-meta">' + metaHTML + '</div>' +
      photosHTML +
    '</div>' +
    '<div class="task-actions">' + actionsHTML + '</div>' +
  '</div>';
}

function renderTodayTab() {
  var data = loadData();
  var today = getToday();
  var allTasks = getPendingTasks();
  var todayTasks = allTasks.filter(function(t) { return t.dueDate === today; });
  var overdueTasks = allTasks.filter(function(t) { return t.dueDate < today; });
  var pending = overdueTasks.concat(todayTasks);

  var doneToday = data.tasks.filter(function(t) {
    return !t.archived && t.completedAt && t.completedAt.slice(0, 10) === today;
  });

  // 周次指示
  var range = getWeekRange(today);
  document.getElementById('weekIndicator').innerHTML =
    '📅 第' + range.weekNumber + '周 ' + formatDateCN(range.monday) + ' - ' + formatDateCN(range.sunday);

  // 本周进度
  var weekTasks = data.tasks.filter(function(t) {
    return !t.archived && t.dueDate >= range.monday && t.dueDate <= range.sunday;
  });
  var weekDone = weekTasks.filter(function(t) { return t.completedAt; }).length;
  var weekRate = weekTasks.length > 0 ? Math.round(weekDone / weekTasks.length * 100) : 0;
  document.getElementById('weeklyProgress').innerHTML =
    '<div class="progress-label">本周进度</div>' +
    '<div class="progress-bar-outer"><div class="progress-bar-inner" style="width:' + weekRate + '%;"></div></div>' +
    '<div class="progress-text">' + weekDone + '/' + weekTasks.length + ' (' + weekRate + '%)</div>';

  // 待完成
  document.getElementById('pendingCount').textContent = pending.length;
  var pendingContainer = document.getElementById('pendingTasks');
  if (pending.length === 0) {
    pendingContainer.innerHTML = '<div class="empty-state"><div class="empty-icon">🎉</div>' +
      '<div class="empty-text">今天没有待完成的作业！</div></div>';
  } else {
    pendingContainer.innerHTML = pending.map(renderTaskCardHTML).join('');
  }

  // 已完成
  document.getElementById('doneCount').textContent = doneToday.length;
  var doneContainer = document.getElementById('doneTasks');
  if (doneToday.length === 0) {
    doneContainer.innerHTML = '<div class="empty-state"><div class="empty-icon">📝</div>' +
      '<div class="empty-text">今天还没有已完成作业</div></div>';
  } else {
    doneContainer.innerHTML = doneToday.map(renderTaskCardHTML).join('');
  }

  // 加载照片缩略图
  pending.concat(doneToday).forEach(function(t) {
    if (t.photoIds) loadTaskPhotoThumbs(t.photoIds);
  });

  // 绑定打卡事件
  document.querySelectorAll('#panelToday .btn-checkin').forEach(function(btn) {
    btn.addEventListener('click', function() {
      handleCheckInClick(btn.dataset.taskId);
    });
  });

  // 绑定照片点击
  document.querySelectorAll('#panelToday .task-photo-thumb').forEach(function(img) {
    img.addEventListener('click', function() {
      viewPhoto(img.dataset.photo);
    });
  });

  // 绑定补拍按钮
  document.querySelectorAll('#panelToday .btn-photo-sm').forEach(function(btn) {
    btn.addEventListener('click', function() {
      window._photoTargetContainer = 'checkinPhoto';
      window._checkinPhotoTaskId = btn.dataset.addPhoto;
      document.getElementById('photoInput').click();
    });
  });

  // 更新头部星星
  document.getElementById('headerStars').textContent = '⭐ ' + data.stars;
}

function handleCheckInClick(taskId) {
  checkIn(taskId);
  renderTodayTab();
  showToast('打卡成功！+1 ⭐', 'success');
  checkAndAwardBadges();
  saveData();
  renderTodayTab();
}

function renderSettings() {
  renderSubjectList();
  populateSubjectSelect('taskSubject');
  populateSubjectSelect('errorSubject');
  var ebFilter = document.getElementById('ebSubjectFilter');
  if (ebFilter) {
    var subjects = getSubjects();
    ebFilter.innerHTML = '<option value="">全部学科</option>' +
      subjects.map(function(s) {
        return '<option value="' + s.id + '">' + s.icon + ' ' + s.name + '</option>';
      }).join('');
  }
}

function renderAllVisible() {
  var activePanel = document.querySelector('.panel.active');
  if (!activePanel) return;
  var id = activePanel.id;
  if (id === 'panelToday') renderTodayTab();
  else if (id === 'panelCalendar') renderCalendar();
  else if (id === 'panelRewards') renderRewardsTab();
  else if (id === 'panelErrorbook') renderErrorbookTab();
  else if (id === 'panelSettings') renderSettings();
}
