// errorbook.js — 错题本 CRUD

function getErrors(subjectId) {
  var data = loadData();
  var errors = data.errorBook;
  if (subjectId) {
    errors = errors.filter(function(e) { return e.subjectId === subjectId; });
  }
  errors.sort(function(a, b) { return b.createdAt.localeCompare(a.createdAt); });
  return errors;
}

function getErrorById(id) {
  return loadData().errorBook.find(function(e) { return e.id === id; });
}

function saveError(err) {
  var data = loadData();
  var idx = data.errorBook.findIndex(function(e) { return e.id === err.id; });
  if (idx >= 0) {
    data.errorBook[idx] = err;
  } else {
    data.errorBook.push(err);
  }
  saveData();
}

function deleteError(id) {
  var data = loadData();
  var err = data.errorBook.find(function(e) { return e.id === id; });
  if (err && err.photoIds && err.photoIds.length > 0) {
    deletePhotos(err.photoIds);
  }
  data.errorBook = data.errorBook.filter(function(e) { return e.id !== id; });
  saveData();
}

function reviewError(id) {
  var err = getErrorById(id);
  if (!err) return;
  err.reviewCount = (err.reviewCount || 0) + 1;
  err.lastReviewAt = new Date().toISOString();
  saveData();
  addStars(1, '复习错题：' + err.title);
  checkAndAwardBadges();
  saveData();
}

function renderErrorbook(filterSubjectId, filterTag) {
  var errors = getErrors();
  var container = document.getElementById('errorList');

  if (filterSubjectId) {
    errors = errors.filter(function(e) { return e.subjectId === filterSubjectId; });
  }
  if (filterTag) {
    var tag = filterTag.toLowerCase();
    errors = errors.filter(function(e) {
      return (e.tags || []).some(function(t) { return t.toLowerCase().indexOf(tag) >= 0; });
    });
  }

  if (errors.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📔</div>' +
      '<div class="empty-text">还没有错题记录，点击＋添加吧！</div></div>';
    return;
  }

  container.innerHTML = errors.map(function(e) {
    var subject = getSubjectById(e.subjectId);
    var subName = subject ? subject.name : '未知';
    var subColor = subject ? subject.color : '#888';

    var tagsHTML = '';
    if (e.tags && e.tags.length > 0) {
      tagsHTML = '<div class="error-tags">' + e.tags.map(function(t) {
        return '<span class="error-tag">' + t + '</span>';
      }).join('') + '</div>';
    }

    var photosHTML = '';
    if (e.photoIds && e.photoIds.length > 0) {
      photosHTML = '<div class="task-photos">' + e.photoIds.map(function(pid) {
        return '<img class="task-photo-thumb" data-photo="' + pid + '" src="" alt="照片">';
      }).join('') + '</div>';
    }

    return '<div class="error-card">' +
      '<div class="error-header">' +
        '<span class="error-subject-tag" style="background:' + subColor + ';">' + subName + '</span>' +
        '<span class="error-title">' + e.title + '</span>' +
      '</div>' +
      (e.difficulty ? '<div class="error-difficulty">⚠️ 难点：' + e.difficulty + '</div>' : '') +
      (e.solution ? '<div class="error-solution">💡 解法：' + e.solution + '</div>' : '') +
      tagsHTML +
      photosHTML +
      '<div class="error-footer">' +
        '<span>🔄 复习 ' + (e.reviewCount || 0) + ' 次</span>' +
        '<span>' + (e.lastReviewAt ? '最近：' + formatDateCN(e.lastReviewAt.slice(0,10)) : '') + '</span>' +
        '<button class="btn-review" data-review="' + e.id + '">📝 复习打卡</button>' +
        '<button class="btn-sm" data-edit-error="' + e.id + '">✏️</button>' +
        '<button class="btn-sm" data-delete-error="' + e.id + '">🗑️</button>' +
      '</div>' +
    '</div>';
  }).join('');

  // 加载照片
  errors.forEach(function(e) {
    if (e.photoIds) loadTaskPhotoThumbs(e.photoIds);
  });
}

function openErrorModal(errorId) {
  var err = errorId ? getErrorById(errorId) : null;
  document.getElementById('errorId').value = err ? err.id : '';
  document.getElementById('errorTitle').value = err ? err.title : '';
  document.getElementById('errorDifficulty').value = err ? (err.difficulty || '') : '';
  document.getElementById('errorSolution').value = err ? (err.solution || '') : '';
  document.getElementById('errorTags').value = err ? (err.tags || []).join(', ') : '';
  document.getElementById('modalErrorTitle').textContent = err ? '编辑错题' : '添加错题';

  populateSubjectSelect('errorSubject');
  if (err) {
    document.getElementById('errorSubject').value = err.subjectId;
  }

  window._errorPhotoIds = err ? (err.photoIds || []).slice() : [];
  renderPhotoArea('errorPhotos', window._errorPhotoIds);

  openModal('modalError');
}

function handleErrorFormSubmit(e) {
  e.preventDefault();
  var id = document.getElementById('errorId').value;
  var subjectId = document.getElementById('errorSubject').value;
  var title = document.getElementById('errorTitle').value.trim();
  var difficulty = document.getElementById('errorDifficulty').value.trim();
  var solution = document.getElementById('errorSolution').value.trim();
  var tagsStr = document.getElementById('errorTags').value.trim();

  if (!subjectId || !title) return;

  var tags = tagsStr ? tagsStr.split(/[,，]/).map(function(t) { return t.trim(); }).filter(Boolean) : [];

  if (id) {
    var err = getErrorById(id);
    err.subjectId = subjectId;
    err.title = title;
    err.difficulty = difficulty;
    err.solution = solution;
    err.tags = tags;
    err.photoIds = window._errorPhotoIds || [];
  } else {
    var err = {
      id: generateId('eb'),
      subjectId: subjectId,
      title: title,
      difficulty: difficulty,
      solution: solution,
      tags: tags,
      photoIds: window._errorPhotoIds || [],
      createdAt: new Date().toISOString(),
      reviewCount: 0,
      lastReviewAt: null
    };
  }

  saveError(err);
  closeModal('modalError');
  window._errorPhotoIds = [];
  renderErrorbookTab();
  showToast('错题保存成功', 'success');
}

function renderErrorbookTab() {
  var filterSubject = document.getElementById('ebSubjectFilter').value;
  var filterTag = document.getElementById('ebTagFilter').value;
  renderErrorbook(filterSubject, filterTag);
}
