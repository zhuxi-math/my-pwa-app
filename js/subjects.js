// subjects.js — 学科 CRUD

function getSubjects() {
  return loadData().subjects;
}

function getSubjectById(id) {
  return getSubjects().find(function(s) { return s.id === id; });
}

function saveSubject(subject) {
  var data = loadData();
  var idx = data.subjects.findIndex(function(s) { return s.id === subject.id; });
  if (idx >= 0) {
    data.subjects[idx] = subject;
  } else {
    data.subjects.push(subject);
  }
  saveData();
}

function deleteSubject(id) {
  var data = loadData();
  var hasActive = data.tasks.some(function(t) {
    return t.subjectId === id && !t.archived && !t.completedAt;
  });
  if (hasActive) {
    showToast('该学科还有未完成的作业，请先完成或删除', 'warning');
    return false;
  }
  data.subjects = data.subjects.filter(function(s) { return s.id !== id; });
  saveData();
  return true;
}

const ICON_OPTIONS = ['📖','🔢','🌍','🎵','🏃','🔬','🎨','🎭','💻','✍️','🧪','📐','🗺️','🏀','⚽'];

const COLOR_OPTIONS = [
  '#FF6B6B', '#5AC8FA', '#34C759', '#AF52DE', '#FF9500',
  '#FF2D55', '#5856D6', '#FFCC00', '#FF8C00', '#007AFF',
  '#00C7BE', '#FF375F', '#64D2FF', '#32D74B'
];

function getDefaultIcon(index) {
  return ICON_OPTIONS[index % ICON_OPTIONS.length];
}

function getDefaultColor(index) {
  return COLOR_OPTIONS[index % COLOR_OPTIONS.length];
}

function renderSubjectList() {
  var container = document.getElementById('subjectList');
  var subjects = getSubjects();
  container.innerHTML = subjects.map(function(s) {
    return '<div class="subject-item">' +
      '<span class="subject-icon" style="background:' + s.color + '20; color:' + s.color + ';">' + s.icon + '</span>' +
      '<span class="subject-name">' + s.name + '</span>' +
      '<button class="btn-sm" data-edit-subject="' + s.id + '">✏️</button>' +
      '<button class="btn-sm" data-delete-subject="' + s.id + '">🗑️</button>' +
    '</div>';
  }).join('');
}

function populateSubjectSelect(selectId) {
  var select = document.getElementById(selectId);
  if (!select) return;
  var subjects = getSubjects();
  select.innerHTML = '<option value="">请选择学科</option>' +
    subjects.map(function(s) {
      return '<option value="' + s.id + '">' + s.icon + ' ' + s.name + '</option>';
    }).join('');
}

function openSubjectModal(subjectId) {
  var subject = subjectId ? getSubjectById(subjectId) : null;
  document.getElementById('subjectId').value = subject ? subject.id : '';
  document.getElementById('subjectName').value = subject ? subject.name : '';
  document.getElementById('modalSubjectTitle').textContent = subject ? '编辑学科' : '添加学科';

  // 图标选择器
  var iconPicker = document.getElementById('iconPicker');
  var selectedIcon = subject ? subject.icon : '';
  iconPicker.innerHTML = ICON_OPTIONS.map(function(icon) {
    return '<span class="icon-option' + (icon === selectedIcon ? ' selected' : '') + '" data-icon="' + icon + '">' + icon + '</span>';
  }).join('');

  // 颜色选择器
  var colorPicker = document.getElementById('colorPicker');
  var selectedColor = subject ? subject.color : '';
  colorPicker.innerHTML = COLOR_OPTIONS.map(function(color) {
    return '<span class="color-option' + (color === selectedColor ? ' selected' : '') + '" style="background:' + color + ';" data-color="' + color + '"></span>';
  }).join('');

  openModal('modalSubject');
}

function handleSubjectFormSubmit(e) {
  e.preventDefault();
  var id = document.getElementById('subjectId').value;
  var name = document.getElementById('subjectName').value.trim();
  var icon = document.querySelector('#iconPicker .icon-option.selected');
  var color = document.querySelector('#colorPicker .color-option.selected');

  if (!name) return;

  var subject = {
    id: id || generateId('s'),
    name: name,
    icon: icon ? icon.dataset.icon : '📖',
    color: color ? color.dataset.color : '#FF9500'
  };
  saveSubject(subject);
  closeModal('modalSubject');
  renderSettings();
  showToast('学科保存成功', 'success');
}
