document.addEventListener('DOMContentLoaded', () => {
    // --- 核心变量声明 ---
    const body = document.body;
    const startMenu = document.getElementById('startMenu');
    const startButton = document.getElementById('startButton');
    const welcomeScreen = document.getElementById('welcomeScreen');
    const windowOverlay = document.getElementById('windowOverlay');
    const updateLogWindow = document.getElementById('updateLogWindow');
    const closeWindowBtn = document.getElementById('closeWindowBtn');
    const minimizeBtn = document.querySelector('.minimize-btn');
    const maximizeBtn = document.querySelector('.maximize-btn');
    const markdownFileList = document.getElementById('markdownFileList');
    const markdownContent = document.getElementById('markdownContent');
    const htmlViewer = document.getElementById('htmlViewer');
    const updateLogTaskbarItem = document.getElementById('updateLogTaskbarItem');
    const updateLogTile = document.getElementById('updateLogTile');
    
    const selectWin10 = document.getElementById('selectWin10');
    const selectMacOS = document.getElementById('selectMacOS');
    const macLaunchpadBtn = document.getElementById('macLaunchpadBtn');
    const macUpdateLogDockBtn = document.getElementById('macUpdateLogDockBtn');

    // --- 动态磁贴逻辑 ---
    const liveTiles = document.querySelectorAll('.live-tile');
    liveTiles.forEach(tile => {
        const speed = parseInt(tile.getAttribute('data-speed')) || 3000;
        setInterval(() => {
            tile.classList.toggle('flipped');
            if (tile.classList.contains('tile-wide') && !tile.classList.contains('flipped')) {
                const img = tile.querySelector('.tile-back img');
                if (img) {
                    const randomId = Math.floor(Math.random() * 1000);
                    img.src = `https://picsum.photos/310/150?random=${randomId}`;
                }
            }
        }, speed);
    });

    // --- 应用点击模拟 ---
    const tiles = document.querySelectorAll('.tile');
    tiles.forEach(tile => {
        tile.addEventListener('click', (e) => {
            if (tile.id === 'updateLogTile') return;
            const label = tile.querySelector('.tile-label');
            const name = label ? label.textContent : '应用';
            alert(`正在打开 ${name}... (这只是一个演示)`);
        });
    });

    const appItems = document.querySelectorAll('.app-item');
    appItems.forEach(item => {
        item.addEventListener('click', () => {
            const url = item.getAttribute('data-url');
            if (url) window.open(url, '_blank');
        });
    });

    // --- 更新日志相关逻辑 ---
    function fetchMarkdownFiles() {
        if (window.markdownFiles) {
            renderFileList(window.markdownFiles);
        } else {
            markdownFileList.innerHTML = '<div class="empty-message">无法加载目录，请检查 js/markdown-config.js</div>';
        }
    }

    function renderFileList(files) {
        if (!files || files.length === 0) {
            markdownFileList.innerHTML = '<div class="empty-message">暂无 Markdown 文件</div>';
            return;
        }

        markdownFileList.innerHTML = files.map(filename => {
            const icon = filename.endsWith('.html') ? 'fa-file-code' : 'fab fa-markdown';
            return `
                <div class="file-item" data-filename="${filename}">
                    <i class="fas ${icon}"></i>
                    <span>${filename}</span>
                </div>
            `;
        }).join('');

        document.querySelectorAll('.file-item').forEach(item => {
            item.addEventListener('click', () => {
                const filename = item.getAttribute('data-filename');
                loadFileContent(filename, item);
            });
        });
    }

    function loadFileContent(filename, element) {
        document.querySelectorAll('.file-item').forEach(i => i.classList.remove('active'));
        element.classList.add('active');

        if (filename.endsWith('.html')) {
            markdownContent.style.display = 'none';
            htmlViewer.style.display = 'block';
            htmlViewer.src = `markdown/${filename}`;
        } else {
            htmlViewer.style.display = 'none';
            markdownContent.style.display = 'block';
            markdownContent.innerHTML = '<div class="loading-message">正在解析内容...</div>';
            const text = window.markdownData ? window.markdownData[filename] : null;
            if (text) {
                markdownContent.innerHTML = marked.parse(text);
            } else {
                markdownContent.innerHTML = `<div class="empty-message">未找到文件内容，请检查 js/markdown-data.js</div>`;
            }
        }
    }

    // Windows 模式下的窗口控制
    updateLogTile.addEventListener('click', () => {
        windowOverlay.classList.add('active');
        updateLogTaskbarItem.style.display = 'flex';
        updateLogTaskbarItem.classList.add('active');
        fetchMarkdownFiles();
        startMenu.classList.add('hidden');
    });

    closeWindowBtn.addEventListener('click', () => {
        windowOverlay.classList.remove('active');
        updateLogTaskbarItem.style.display = 'none';
        updateLogTaskbarItem.classList.remove('active');
    });

    minimizeBtn.addEventListener('click', () => {
        windowOverlay.classList.remove('active');
        updateLogTaskbarItem.classList.remove('active');
    });

    maximizeBtn.addEventListener('click', () => {
        updateLogWindow.classList.toggle('maximized');
        const icon = maximizeBtn.querySelector('i');
        if (updateLogWindow.classList.contains('maximized')) {
            icon.classList.replace('fa-square', 'fa-clone');
        } else {
            icon.classList.replace('fa-clone', 'fa-square');
        }
    });

    updateLogTaskbarItem.addEventListener('click', () => {
        if (windowOverlay.classList.contains('active')) {
            windowOverlay.classList.remove('active');
            updateLogTaskbarItem.classList.remove('active');
        } else {
            windowOverlay.classList.add('active');
            updateLogTaskbarItem.classList.add('active');
        }
    });

    windowOverlay.addEventListener('click', (e) => {
        if (e.target === windowOverlay) {
            windowOverlay.classList.remove('active');
            updateLogTaskbarItem.classList.remove('active');
        }
    });

    // --- 窗口拖动逻辑 ---
    let isDragging = false;
    let initialX, initialY, xOffset = 0, yOffset = 0;
    const windowHeader = updateLogWindow.querySelector('.window-header');

    windowHeader.addEventListener('mousedown', (e) => {
        if (e.target.closest('.window-controls')) return;
        if (updateLogWindow.classList.contains('maximized')) return;
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        if (e.target === windowHeader || windowHeader.contains(e.target)) isDragging = true;
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            e.preventDefault();
            let currentX = e.clientX - initialX;
            let currentY = e.clientY - initialY;

            // 限制拖动范围 (macOS 模式下避开菜单栏和 Dock)
            if (body.classList.contains('macos-mode')) {
                const menuBarHeight = 28;
                const dockSpace = 78;
                const windowHeight = updateLogWindow.offsetHeight;
                const windowWidth = updateLogWindow.offsetWidth;
                const viewportHeight = window.innerHeight;
                const viewportWidth = window.innerWidth;

                // 计算相对于父容器 (windowOverlay) 的偏移
                // windowOverlay 在 macos-mode 下有 top: 28px 和 height: calc(100% - 28px - 78px)
                // 这里的 currentY 是 translate3d 的值，是在 windowOverlay 内部的偏移
                
                // 限制顶部 (不能超过 windowOverlay 的顶部，即不能进入菜单栏)
                if (currentY < 0) currentY = 0;
                
                // 限制底部 (不能超过 windowOverlay 的底部，即不能进入 Dock 区域)
                const maxTranslateY = viewportHeight - menuBarHeight - dockSpace - windowHeight;
                if (currentY > maxTranslateY) currentY = maxTranslateY;

                // 左右限制 (可选，防止窗口完全拖出屏幕)
                const maxTranslateX = viewportWidth - windowWidth;
                if (currentX < -viewportWidth/2) currentX = -viewportWidth/2; // 允许拖出一半
                if (currentX > viewportWidth/2) currentX = viewportWidth/2;
            }

            xOffset = currentX;
            yOffset = currentY;
            updateLogWindow.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // --- 系统通用逻辑 ---
    startButton.addEventListener('click', (e) => {
        e.stopPropagation();
        startMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!startMenu.contains(e.target) && !startButton.contains(e.target) && (!macLaunchpadBtn || !macLaunchpadBtn.contains(e.target))) {
            startMenu.classList.add('hidden');
        }
    });

    function updateClock() {
        const clock = document.getElementById('clock');
        const macClock = document.getElementById('macClock');
        const now = new Date();
        const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
        
        if (clock) {
            clock.querySelector('.time').textContent = timeStr;
            clock.querySelector('.date').textContent = now.toLocaleDateString('zh-CN');
        }
        if (macClock) macClock.textContent = timeStr;
    }
    setInterval(updateClock, 1000);
    updateClock();

    // --- 欢迎页面与模式选择 ---
    function enterSystem(mode) {
        if (mode === 'macos') {
            body.classList.add('macos-mode');
            localStorage.setItem('desktop-mode', 'macos');
        } else {
            body.classList.remove('macos-mode');
            localStorage.setItem('desktop-mode', 'win10');
        }
        welcomeScreen.classList.add('hidden');
        if (mode === 'win10') {
            setTimeout(() => startMenu.classList.remove('hidden'), 500);
        }
    }

    if (selectWin10) selectWin10.addEventListener('click', (e) => { e.stopPropagation(); enterSystem('win10'); });
    if (selectMacOS) selectMacOS.addEventListener('click', (e) => { e.stopPropagation(); enterSystem('macos'); });

    // macOS 模式逻辑
    if (macLaunchpadBtn) macLaunchpadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        startMenu.classList.toggle('hidden');
    });

    if (macUpdateLogDockBtn) macUpdateLogDockBtn.addEventListener('click', () => {
        windowOverlay.classList.add('active');
        macUpdateLogDockBtn.classList.add('active'); // 添加指示灯
        fetchMarkdownFiles();
    });

    // 关闭窗口时移除指示灯
    const originalCloseHandler = closeWindowBtn.onclick;
    closeWindowBtn.addEventListener('click', () => {
        if (body.classList.contains('macos-mode')) {
            macUpdateLogDockBtn.classList.remove('active');
        }
    });

    // 遮罩层关闭也移除指示灯
    windowOverlay.addEventListener('click', (e) => {
        if (e.target === windowOverlay && body.classList.contains('macos-mode')) {
            macUpdateLogDockBtn.classList.remove('active');
        }
    });

    // --- 主题切换 ---
    const settingsBtn = document.getElementById('settingsBtn');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    
    function initTheme() {
        const savedTheme = localStorage.getItem('theme');
        body.setAttribute('data-theme', savedTheme || (systemPrefersDark.matches ? 'dark' : 'light'));
    }

    settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    initTheme();
});
