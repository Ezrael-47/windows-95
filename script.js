(function() {
  const windows = {};
  let windowZIndex = 10;
  let activeWindowId = null;
  let startMenuVisible = false;

  const windowDefs = {
    mycomputer: {
      title: 'My Computer',
      icon: '💻',
      content: '<p><b>My Computer</b></p><p>🖥️ Local Disk (C:)</p><p>💾 Floppy (A:)</p><p>📀 CD-ROM (D:)</p>'
    },
    recycle: {
      title: 'Recycle Bin',
      icon: '🗑️',
      content: '<p>♻️ Recycle Bin is empty.</p>'
    },
    notepad: {
      title: 'Notepad - Untitled',
      icon: '📄',
      content: '<textarea style="width:100%;height:120px;font-family:monospace;">Hello from Windows 95!</textarea>'
    },
    calculator: {
      title: 'Calculator',
      icon: '🧮',
      content: '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;"><button>7</button><button>8</button><button>9</button><button>/</button><button>4</button><button>5</button><button>6</button><button>*</button><button>1</button><button>2</button><button>3</button><button>-</button><button>0</button><button>.</button><button>=</button><button>+</button></div>'
    },
    about: {
      title: 'About Windows 95',
      icon: 'ℹ️',
      content: '<p><b>Microsoft Windows 95</b></p><p>Version 4.00.950</p><p>© Microsoft Corp. 1995</p><p>Draggable windows, start menu & taskbar.</p>'
    }
  };

  function createWindowElement(id, def) {
    const winDiv = document.createElement('div');
    winDiv.className = 'window';
    winDiv.id = `window-${id}`;
    winDiv.style.left = `${80 + Object.keys(windows).length * 25}px`;
    winDiv.style.top = `${70 + Object.keys(windows).length * 30}px`;
    winDiv.style.width = '300px';
    winDiv.innerHTML = `
      <div class="title-bar" data-window-id="${id}">
        <span class="title-bar-text">${def.icon} ${def.title}</span>
        <div class="window-controls">
          <span class="win-btn minimize-btn">─</span>
          <span class="win-btn maximize-btn">□</span>
          <span class="win-btn close-btn">✕</span>
        </div>
      </div>
      <div class="window-content">${def.content}</div>
    `;
    return winDiv;
  }

  window.openWindow = function(id) {
    if (windows[id]) {
      bringToFront(id);
      return;
    }
    const def = windowDefs[id] || { title: id, icon: '📁', content: '<p>Window</p>' };
    const container = document.getElementById('windowsContainer');
    const winEl = createWindowElement(id, def);
    container.appendChild(winEl);

    windows[id] = {
      element: winEl,
      id: id,
      minimized: false
    };

    winEl.querySelector('.close-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      closeWindow(id);
    });
    winEl.querySelector('.minimize-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      minimizeWindow(id);
    });
    winEl.querySelector('.maximize-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMaximize(id);
    });

    const titleBar = winEl.querySelector('.title-bar');
    titleBar.addEventListener('mousedown', (e) => startDrag(e, id));

    winEl.addEventListener('mousedown', (e) => {
      bringToFront(id);
    });

    bringToFront(id);
    updateTaskbar();
  };

  function closeWindow(id) {
    if (!windows[id]) return;
    const win = windows[id];
    win.element.remove();
    delete windows[id];
    if (activeWindowId === id) activeWindowId = null;
    updateTaskbar();
  }

  function minimizeWindow(id) {
    if (!windows[id]) return;
    const win = windows[id];
    win.element.style.display = 'none';
    win.minimized = true;
    if (activeWindowId === id) activeWindowId = null;
    updateTaskbar();
  }

  function restoreWindow(id) {
    if (!windows[id]) return;
    const win = windows[id];
    win.element.style.display = 'flex';
    win.minimized = false;
    bringToFront(id);
  }

  function toggleMaximize(id) {
    const win = windows[id];
    if (!win) return;
    const el = win.element;
    if (el.style.width === '100%') {
      el.style.width = '320px';
      el.style.height = 'auto';
      el.style.left = '80px';
      el.style.top = '70px';
    } else {
      el.style.left = '0';
      el.style.top = '0';
      el.style.width = '100%';
      el.style.height = 'calc(100% - 40px)';
    }
  }

  function bringToFront(id) {
    if (!windows[id]) return;
    windowZIndex++;
    windows[id].element.style.zIndex = windowZIndex;
    windows[id].element.classList.add('active');
    if (activeWindowId && activeWindowId !== id && windows[activeWindowId]) {
      windows[activeWindowId].element.classList.remove('active');
    }
    activeWindowId = id;
    if (windows[id].minimized) restoreWindow(id);
    updateTaskbar();
  }

  let dragState = null;

  function startDrag(e, id) {
    e.preventDefault();
    const win = windows[id];
    if (!win) return;
    bringToFront(id);
    const rect = win.element.getBoundingClientRect();
    dragState = {
      id: id,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
  }

  function onDrag(e) {
    if (!dragState) return;
    const win = windows[dragState.id];
    if (!win) return;
    const newLeft = e.clientX - dragState.offsetX;
    const newTop = e.clientY - dragState.offsetY;
    win.element.style.left = `${Math.max(0, newLeft)}px`;
    win.element.style.top = `${Math.max(0, newTop)}px`;
  }

  function stopDrag() {
    dragState = null;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
  }

  function updateTaskbar() {
    const taskbarEl = document.getElementById('taskbarWindows');
    taskbarEl.innerHTML = '';
    Object.keys(windows).forEach(id => {
      const win = windows[id];
      const btn = document.createElement('div');
      btn.className = `taskbar-item ${activeWindowId === id ? 'active' : ''}`;
      btn.textContent = windowDefs[id]?.title || id;
      btn.addEventListener('click', (e) => {
        if (win.minimized || activeWindowId !== id) {
          restoreWindow(id);
        } else {
          minimizeWindow(id);
        }
      });
      taskbarEl.appendChild(btn);
    });
  }

  const startMenu = document.getElementById('startMenu');
  const startButton = document.getElementById('startButton');

  function toggleStartMenu() {
    startMenuVisible = !startMenuVisible;
    if (startMenuVisible) {
      startMenu.classList.add('visible');
    } else {
      startMenu.classList.remove('visible');
    }
  }

  startButton.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleStartMenu();
  });

  document.addEventListener('click', (e) => {
    if (!startMenu.contains(e.target) && e.target !== startButton && !startButton.contains(e.target)) {
      startMenuVisible = false;
      startMenu.classList.remove('visible');
    }
  });

  document.querySelectorAll('.start-menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const action = item.dataset.action;
      if (action === 'shutdown') {
        alert('Shut Down Windows 95? It is now safe to turn off your computer.');
      } else if (action && windowDefs[action]) {
        window.openWindow(action);
      }
      startMenuVisible = false;
      startMenu.classList.remove('visible');
    });
  });

  function updateClock() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    document.getElementById('clockDisplay').textContent = `${displayHour}:${minutes} ${ampm}`;
  }
  setInterval(updateClock, 1000);
  updateClock();

  document.querySelectorAll('.desktop-icon').forEach(icon => {
    icon.addEventListener('dblclick', (e) => {
      const windowId = icon.dataset.window;
      if (windowId) window.openWindow(windowId);
    });
  });

  setTimeout(() => {
    window.openWindow('mycomputer');
  }, 200);
})();