// storage.js — localStorage 读写工具

const STORAGE_KEY = 'homeworkData';

const DEFAULT_DATA = {
  version: 2,
  subjects: [
    { id: 's_yuwen', name: '语文', icon: '📖', color: '#FF6B6B' },
    { id: 's_shuxue', name: '数学', icon: '🔢', color: '#5AC8FA' },
    { id: 's_yingyu', name: '英语', icon: '🌍', color: '#34C759' },
    { id: 's_yinyue', name: '音乐', icon: '🎵', color: '#AF52DE' },
    { id: 's_huwai', name: '户外', icon: '🏃', color: '#FF9500' }
  ],
  tasks: [],
  checkIns: {},
  stars: 0,
  starHistory: [],
  badges: [],
  errorBook: []
};

let appData = null;

function loadData() {
  if (appData) return appData;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      appData = JSON.parse(raw);
      if (!appData.version) appData.version = 1;
      if (appData.version === 1) migrateV1toV2();
    } else {
      appData = JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
  } catch (e) {
    appData = JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
  return appData;
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
  } catch (e) {
    showToast('存储空间不足，请导出数据后清理旧记录', 'warning');
  }
}

function migrateV1toV2() {
  if (!appData.errorBook) appData.errorBook = [];
  appData.version = 2;
  saveData();
}

function generateId(prefix) {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function resetData() {
  appData = JSON.parse(JSON.stringify(DEFAULT_DATA));
  saveData();
}

function exportDataJSON() {
  return JSON.stringify(appData, null, 2);
}

function importDataJSON(jsonStr) {
  try {
    const imported = JSON.parse(jsonStr);
    if (!imported.subjects || !imported.tasks) {
      throw new Error('数据格式不正确');
    }
    appData = imported;
    if (!appData.version) appData.version = 1;
    if (appData.version === 1) migrateV1toV2();
    if (!appData.errorBook) appData.errorBook = [];
    saveData();
    return true;
  } catch (e) {
    showToast('导入失败：' + e.message, 'warning');
    return false;
  }
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getWeekRange(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay() || 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - day + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    monday: monday.toISOString().slice(0, 10),
    sunday: sunday.toISOString().slice(0, 10),
    weekNumber: getWeekNumber(d)
  };
}

function formatDateCN(dateStr) {
  const parts = dateStr.split('-');
  return parts[0] + '年' + parseInt(parts[1]) + '月' + parseInt(parts[2]) + '日';
}
