// checkin.js — 打卡核心逻辑、星星奖励

function isCheckedInToday(taskId) {
  var data = loadData();
  var today = getToday();
  var checkins = data.checkIns[today] || [];
  return checkins.indexOf(taskId) >= 0;
}

function getTodayStats() {
  var data = loadData();
  var today = getToday();
  var allToday = data.tasks.filter(function(t) {
    return !t.archived && t.dueDate === today;
  });
  var checkins = data.checkIns[today] || [];
  return {
    total: allToday.length,
    done: allToday.filter(function(t) { return checkins.indexOf(t.id) >= 0; }).length
  };
}

function checkIn(taskId) {
  var data = loadData();
  var today = getToday();
  var task = data.tasks.find(function(t) { return t.id === taskId; });
  if (!task || isCheckedInToday(taskId)) return;

  // 标记完成
  task.completedAt = new Date().toISOString();

  // 打卡记录
  if (!data.checkIns[today]) data.checkIns[today] = [];
  data.checkIns[today].push(taskId);

  // 基础星星 +1
  addStars(1, '完成作业：' + task.title);

  // 检查当天是否全部完成
  var stats = getTodayStats();
  if (stats.total > 0 && stats.done + 1 === stats.total) {
    addStars(1, '今天作业全部完成！');
  }

  // 检查徽章
  checkAndAwardBadges();

  saveData();
}

function undoCheckIn(taskId) {
  var data = loadData();
  var today = getToday();
  var task = data.tasks.find(function(t) { return t.id === taskId; });
  if (!task) return;

  task.completedAt = null;
  if (data.checkIns[today]) {
    data.checkIns[today] = data.checkIns[today].filter(function(id) { return id !== taskId; });
  }

  // 扣减星星
  data.stars = Math.max(0, data.stars - 1);
  data.starHistory.push({
    date: today,
    earned: -1,
    reason: '撤销打卡：' + task.title
  });

  saveData();
}

function addStars(count, reason) {
  var data = loadData();
  data.stars += count;
  data.starHistory.push({
    date: getToday(),
    earned: count,
    reason: reason
  });
}

function checkWeeklyCompletion(data) {
  data = data || loadData();
  var range = getWeekRange(getToday());
  var weekTasks = data.tasks.filter(function(t) {
    return !t.archived && t.dueDate >= range.monday && t.dueDate <= range.sunday;
  });
  if (weekTasks.length === 0) return 0;
  var done = weekTasks.filter(function(t) { return t.completedAt; }).length;
  return Math.round(done / weekTasks.length * 100);
}

function getTotalCompletedTasks() {
  var data = loadData();
  return data.tasks.filter(function(t) { return t.completedAt && !t.archived; }).length;
}

function getTotalReviewedErrors() {
  var data = loadData();
  return data.errorBook.reduce(function(sum, eb) { return sum + eb.reviewCount; }, 0);
}
