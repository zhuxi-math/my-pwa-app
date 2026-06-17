// app.js — 主应用入口

(function() {
  'use strict';

  // 初始化
  function init() {
    loadData();
    renderTodayTab();
    setupTabBar();
    setupModals();
    setupForms();
    setupButtons();
    setupPhotoInput();
    setupFilters();
  }

  // 底部标签栏切换
  function setupTabBar() {
    document.querySelectorAll('.tab-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var tabId = btn.dataset.tab;
        switchTab(tabId);
        // 切换后刷新对应面板
        if (tabId === 'panelToday') renderTodayTab();
        else if (tabId === 'panelCalendar') renderCalendar();
        else if (tabId === 'panelRewards') renderRewardsTab();
        else if (tabId === 'panelErrorbook') renderErrorbookTab();
        else if (tabId === 'panelSettings') renderSettings();
      });
    });
  }

  // 模态框关闭
  function setupModals() {
    // 点击遮罩关闭
    document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
          closeModal(overlay.id);
        }
      });
      // 关闭按钮
      var closeBtn = overlay.querySelector('.btn-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', function() {
          closeModal(overlay.id);
        });
      }
    });

    // 通用关闭 data-close 属性
    document.addEventListener('click', function(e) {
      var closeBtn = e.target.closest('[data-close]');
      if (closeBtn) {
        closeModal(closeBtn.dataset.close);
      }
    });
  }

  // 表单提交
  function setupForms() {
    document.getElementById('formTask').addEventListener('submit', handleTaskFormSubmit);
    document.getElementById('formError').addEventListener('submit', handleErrorFormSubmit);
    document.getElementById('formSubject').addEventListener('submit', handleSubjectFormSubmit);

    // 图标选择器
    document.addEventListener('click', function(e) {
      var iconOpt = e.target.closest('.icon-option');
      if (iconOpt) {
        iconOpt.parentElement.querySelectorAll('.icon-option').forEach(function(el) {
          el.classList.remove('selected');
        });
        iconOpt.classList.add('selected');
      }

      var colorOpt = e.target.closest('.color-option');
      if (colorOpt) {
        colorOpt.parentElement.querySelectorAll('.color-option').forEach(function(el) {
          el.classList.remove('selected');
        });
        colorOpt.classList.add('selected');
      }
    });
  }

  // 按钮事件
  function setupButtons() {
    // 添加作业
    document.getElementById('btnAddTask').addEventListener('click', function() {
      window._taskPhotoIds = [];
      openTaskModal(null);
    });

    // 添加错题
    document.getElementById('btnAddError').addEventListener('click', function() {
      window._errorPhotoIds = [];
      openErrorModal(null);
    });

    // 添加学科
    document.getElementById('btnAddSubject').addEventListener('click', function() {
      openSubjectModal(null);
    });

    // 日历导航
    document.getElementById('btnPrevMonth').addEventListener('click', function() {
      navigateMonth(-1);
    });
    document.getElementById('btnNextMonth').addEventListener('click', function() {
      navigateMonth(1);
    });

    // 拍照按钮
    document.getElementById('btnTaskPhoto').addEventListener('click', function() {
      handlePhotoCapture('taskPhotos');
    });
    document.getElementById('btnErrorPhoto').addEventListener('click', function() {
      handlePhotoCapture('errorPhotos');
    });

    // 周总结
    document.getElementById('btnWeeklySummary').addEventListener('click', function() {
      showWeeklySummaryModal();
    });

    // 导出数据
    document.getElementById('btnExportData').addEventListener('click', function() {
      var json = exportDataJSON();
      var blob = new Blob([json], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'homework_backup_' + getToday() + '.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('数据已导出', 'success');
    });

    // 导入数据
    document.getElementById('btnImportData').addEventListener('click', function() {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = function() {
        var file = input.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function() {
          if (importDataJSON(reader.result)) {
            showToast('数据导入成功！', 'success');
            renderAllVisible();
          }
        };
        reader.readAsText(file);
      };
      input.click();
    });

    // 清除数据
    document.getElementById('btnClearData').addEventListener('click', function() {
      confirmDialog('确定要清除所有数据吗？这个操作不可恢复！').then(function(confirmed) {
        if (confirmed) {
          resetData();
          showToast('数据已清除', 'success');
          renderAllVisible();
        }
      });
    });

    // 全局事件委托
    document.addEventListener('click', function(e) {
      // 打卡按钮
      var checkinBtn = e.target.closest('.btn-checkin');
      if (checkinBtn && checkinBtn.dataset.taskId) {
        handleCheckInClick(checkinBtn.dataset.taskId);
      }

      // 照片缩略图点击
      var thumb = e.target.closest('.task-photo-thumb');
      if (thumb && thumb.dataset.photo) {
        viewPhoto(thumb.dataset.photo);
      }

      // 照片删除
      var photoDel = e.target.closest('.photo-delete');
      if (photoDel) {
        var pid = photoDel.dataset.removePhoto;
        var containerId = photoDel.dataset.targetContainer;
        handleRemovePhoto(pid, containerId);
      }

      // 复习打卡
      var reviewBtn = e.target.closest('.btn-review');
      if (reviewBtn && reviewBtn.dataset.review) {
        reviewError(reviewBtn.dataset.review);
        renderErrorbookTab();
        showToast('复习打卡！+1 ⭐', 'success');
        document.getElementById('headerStars').textContent = '⭐ ' + loadData().stars;
      }

      // 编辑错题
      var editErrorBtn = e.target.closest('[data-edit-error]');
      if (editErrorBtn) {
        openErrorModal(editErrorBtn.dataset.editError);
      }

      // 删除错题
      var deleteErrorBtn = e.target.closest('[data-delete-error]');
      if (deleteErrorBtn) {
        var errorId = deleteErrorBtn.dataset.deleteError;
        confirmDialog('确定要删除这条错题记录吗？').then(function(ok) {
          if (ok) {
            deleteError(errorId);
            renderErrorbookTab();
            showToast('错题已删除', 'success');
          }
        });
      }

      // 编辑学科
      var editSubjectBtn = e.target.closest('[data-edit-subject]');
      if (editSubjectBtn) {
        openSubjectModal(editSubjectBtn.dataset.editSubject);
      }

      // 删除学科
      var deleteSubjectBtn = e.target.closest('[data-delete-subject]');
      if (deleteSubjectBtn) {
        var subId = deleteSubjectBtn.dataset.deleteSubject;
        confirmDialog('确定要删除这个学科吗？').then(function(ok) {
          if (ok && deleteSubject(subId)) {
            renderSettings();
            showToast('学科已删除', 'success');
          }
        });
      }

      // 补拍照片
      var addPhotoBtn = e.target.closest('[data-add-photo]');
      if (addPhotoBtn) {
        window._photoTargetContainer = 'checkinPhoto';
        window._checkinPhotoTaskId = addPhotoBtn.dataset.addPhoto;
        document.getElementById('photoInput').click();
      }
    });
  }

  // 拍照
  function setupPhotoInput() {
    var input = document.getElementById('photoInput');
    input.addEventListener('change', function() {
      if (input.files && input.files[0]) {
        handlePhotoFileSelected(input.files[0]);
        input.value = '';
      }
    });
  }

  // 错题本筛选
  function setupFilters() {
    document.getElementById('ebSubjectFilter').addEventListener('change', function() {
      renderErrorbookTab();
    });
    var tagInput = document.getElementById('ebTagFilter');
    var tagTimeout;
    tagInput.addEventListener('input', function() {
      clearTimeout(tagTimeout);
      tagTimeout = setTimeout(function() {
        renderErrorbookTab();
      }, 300);
    });
  }

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
