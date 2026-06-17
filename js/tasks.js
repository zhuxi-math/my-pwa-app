// tasks.js — 作业 CRUD、筛选

function getTasks(opts) {
  opts = opts || {};
  var data = loadData();
  var tasks = data.tasks.filter(function(t) { return !t.archived; });

  if (opts.date) {
    tasks = tasks.filter(function(t) { return t.dueDate === opts.date; });
  }
  if (opts.subjectId) {
    tasks = tasks.filter(function(t) { return t.subjectId === opts.subjectId; });
  }
  if (opts.status === 'pending') {
    tasks = tasks.filter(function(t) { return !t.completedAt; });
  } else if (opts.status === 'done') {
    tasks = tasks.filter(function(t) { return t.completedAt; });
  }

  tasks.sort(function(a, b) {
    if (a.completedAt && !b.completedAt) return 1;
    if (!a.completedAt && b.completedAt) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });

  return tasks;
}

function getTaskById(id) {
  return loadData().tasks.find(function(t) { return t.id === id; });
}

function saveTask(task) {
  var data = loadData();
  var idx = data.tasks.findIndex(function(t) { return t.id === task.id; });
  if (idx >= 0) {
    data.tasks[idx] = task;
  } else {
    data.tasks.push(task);
  }
  saveData();
}

function archiveTask(id) {
  var task = getTaskById(id);
  if (task) {
    task.archived = true;
    saveData();
  }
}

function deleteTaskPermanently(id) {
  var data = loadData();
  var task = getTaskById(id);
  if (task && task.photoIds && task.photoIds.length > 0) {
    deletePhotos(task.photoIds);
  }
  // 清理打卡记录
  Object.keys(data.checkIns).forEach(function(date) {
    data.checkIns[date] = data.checkIns[date].filter(function(tid) { return tid !== id; });
  });
  data.tasks = data.tasks.filter(function(t) { return t.id !== id; });
  saveData();
}

function getTasksForDate(dateStr) {
  return getTasks({ date: dateStr });
}

function getTodayTasks() {
  return getTasks({ date: getToday() });
}

function getPendingTasks() {
  var today = getToday();
  return loadData().tasks.filter(function(t) {
    return !t.archived && !t.completedAt && t.dueDate <= today;
  });
}

function isOverdue(task) {
  return !task.completedAt && task.dueDate < getToday();
}

function getTaskPhotosHTML(photoIds) {
  if (!photoIds || photoIds.length === 0) return '';
  return '<div class="task-photos">' + photoIds.map(function(pid) {
    return '<img class="task-photo-thumb" data-photo="' + pid + '" src="" alt="照片" style="display:none;">';
  }).join('') + '</div>';
}

function loadTaskPhotoThumbs(photoIds) {
  if (!photoIds || photoIds.length === 0) return;
  photoIds.forEach(function(pid) {
    getPhotoURL(pid).then(function(url) {
      if (!url) return;
      var imgs = document.querySelectorAll('[data-photo="' + pid + '"]');
      imgs.forEach(function(img) {
        img.src = url;
        img.style.display = 'inline-block';
      });
    });
  });
}

function openTaskModal(taskId) {
  var task = taskId ? getTaskById(taskId) : null;
  document.getElementById('taskId').value = task ? task.id : '';
  document.getElementById('taskTitle').value = task ? task.title : '';
  document.getElementById('taskNote').value = task ? (task.note || '') : '';
  document.getElementById('taskDueDate').value = task ? task.dueDate : getToday();
  document.getElementById('modalTaskTitle').textContent = task ? '编辑作业' : '添加作业';

  populateSubjectSelect('taskSubject');
  if (task) {
    document.getElementById('taskSubject').value = task.subjectId;
  }

  // 照片区域
  var photoArea = document.getElementById('taskPhotos');
  var currentPhotoIds = task ? (task.photoIds || []) : [];
  window._taskPhotoIds = currentPhotoIds.slice();
  renderPhotoArea('taskPhotos', window._taskPhotoIds);

  openModal('modalTask');
}

function handleTaskFormSubmit(e) {
  e.preventDefault();
  var id = document.getElementById('taskId').value;
  var subjectId = document.getElementById('taskSubject').value;
  var title = document.getElementById('taskTitle').value.trim();
  var note = document.getElementById('taskNote').value.trim();
  var dueDate = document.getElementById('taskDueDate').value;

  if (!subjectId || !title || !dueDate) return;

  var task;
  if (id) {
    task = getTaskById(id);
    task.subjectId = subjectId;
    task.title = title;
    task.note = note;
    task.dueDate = dueDate;
    task.photoIds = window._taskPhotoIds || [];
  } else {
    task = {
      id: generateId('t'),
      subjectId: subjectId,
      title: title,
      note: note,
      dueDate: dueDate,
      createdAt: new Date().toISOString(),
      completedAt: null,
      photoIds: window._taskPhotoIds || [],
      archived: false
    };
  }

  saveTask(task);
  closeModal('modalTask');
  window._taskPhotoIds = [];
  renderTodayTab();
  showToast('作业保存成功', 'success');
}

function renderPhotoArea(containerId, photoIds) {
  var container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  if (!photoIds || photoIds.length === 0) return;

  photoIds.forEach(function(pid) {
    var wrapper = document.createElement('span');
    wrapper.className = 'photo-wrapper';

    var img = document.createElement('img');
    img.className = 'photo-thumb';
    img.dataset.photo = pid;
    img.alt = '照片';

    var del = document.createElement('button');
    del.className = 'photo-delete';
    del.textContent = '✕';
    del.dataset.removePhoto = pid;
    del.dataset.targetContainer = containerId;
    del.type = 'button';

    wrapper.appendChild(img);
    wrapper.appendChild(del);
    container.appendChild(wrapper);
  });

  // 异步加载缩略图
  photoIds.forEach(function(pid) {
    getPhotoURL(pid).then(function(url) {
      if (!url) return;
      var imgs = container.querySelectorAll('[data-photo="' + pid + '"]');
      imgs.forEach(function(img) { img.src = url; });
    });
  });
}

function handlePhotoCapture(targetContainerId) {
  var input = document.getElementById('photoInput');
  window._photoTargetContainer = targetContainerId;
  input.click();
}

function handlePhotoFileSelected(file) {
  if (!file) return;
  var targetContainer = window._photoTargetContainer || 'taskPhotos';
  var photoId = generateId('img');

  createThumbnail(file).then(function(thumb) {
    return savePhoto(photoId, thumb);
  }).then(function() {
    if (targetContainer === 'taskPhotos') {
      window._taskPhotoIds = window._taskPhotoIds || [];
      window._taskPhotoIds.push(photoId);
      renderPhotoArea('taskPhotos', window._taskPhotoIds);
    } else if (targetContainer === 'errorPhotos') {
      window._errorPhotoIds = window._errorPhotoIds || [];
      window._errorPhotoIds.push(photoId);
      renderPhotoArea('errorPhotos', window._errorPhotoIds);
    } else if (targetContainer === 'checkinPhoto') {
      var taskId = window._checkinPhotoTaskId;
      if (taskId) {
        var task = getTaskById(taskId);
        if (task) {
          task.photoIds = task.photoIds || [];
          task.photoIds.push(photoId);
          saveTask(task);
          renderTodayTab();
          showToast('照片已添加', 'success');
        }
      }
    }
  }).catch(function(e) {
    showToast('照片保存失败', 'warning');
  });
}

function handleRemovePhoto(photoId, containerId) {
  if (containerId === 'taskPhotos') {
    window._taskPhotoIds = (window._taskPhotoIds || []).filter(function(id) { return id !== photoId; });
    renderPhotoArea('taskPhotos', window._taskPhotoIds);
  } else if (containerId === 'errorPhotos') {
    window._errorPhotoIds = (window._errorPhotoIds || []).filter(function(id) { return id !== photoId; });
    renderPhotoArea('errorPhotos', window._errorPhotoIds);
  }
  deletePhoto(photoId);
}

function viewPhoto(photoId) {
  getPhotoURL(photoId).then(function(url) {
    if (!url) {
      showToast('照片已删除', 'warning');
      return;
    }
    document.getElementById('photoViewer').src = url;
    openModal('modalPhoto');
  });
}
