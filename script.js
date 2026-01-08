/**
 * 星星大作战 - 核心逻辑脚本 (v3.0 最终版)
 * 集成：全屏管理后台、成长日志、数据备份、PWA支持、视觉特效
 */

// --- 1. 默认数据配置 ---
const defaultSubjects = [
    { id: 1, name: '古诗背诵', icon: 'fa-book-open', theme: 'theme-blue', category: 'learning', score: 0 },
    { id: 2, name: '趣味数学', icon: 'fa-calculator', theme: 'theme-purple', category: 'learning', score: 0 },
    { id: 3, name: '英语绘本', icon: 'fa-language', theme: 'theme-green', category: 'learning', score: 0 },
    { id: 4, name: '家务帮手', icon: 'fa-broom', theme: 'theme-pink', category: 'life', score: 0 },
    { id: 5, name: '运动打卡', icon: 'fa-running', theme: 'theme-orange', category: 'life', score: 0 },
    { id: 6, name: '按时睡觉', icon: 'fa-moon', theme: 'theme-blue', category: 'life', score: 0 }
];

const defaultGifts = [
    { id: 1, name: '看动画片 (30分钟)', cost: 3 },
    { id: 2, name: '买一个小玩具', cost: 10 },
    { id: 3, name: '去游乐园', cost: 50 }
];

// --- 2. 状态管理 ---
let appData = {
    userName: '小朋友',
    subjects: JSON.parse(JSON.stringify(defaultSubjects)),
    gifts: JSON.parse(JSON.stringify(defaultGifts)),
    totalCrowns: 0,
    avatar: '',
    history: [] // 成长日志
};

let currentAdminTab = 'sub'; // 管理面板当前标签: 'sub' 或 'gift'

// --- 3. 初始化与数据加载 ---

function init() {
    loadData();
    refreshUserName();
    updateDate();
    renderAll();
}

function loadData() {
    const saved = localStorage.getItem('susanAppV3');
    if (saved) {
        // 合并数据，防止新字段缺失
        const parsed = JSON.parse(saved);
        appData = { ...appData, ...parsed };
        
        // 兼容性处理：确保每个任务都有 category
        appData.subjects.forEach(s => {
            if(!s.category) s.category = 'learning';
        });
    }
    // 恢复头像
    if (appData.avatar) {
        const img = document.getElementById('userAvatar');
        if(img) {
            img.src = appData.avatar;
            img.style.opacity = '1';
        }
    }
}

function saveData() {
    localStorage.setItem('susanAppV3', JSON.stringify(appData));
    updateHeader();
}

// --- 4. 视觉特效 (Canvas 烟花) ---

function launchConfetti() {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const colors = ['#ff0000', '#ffa500', '#ffff00', '#008000', '#0000ff', '#4b0082', '#ee82ee'];

    const canvas = document.createElement('canvas');
    canvas.style = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;";
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles = [];
    for (let i = 0; i < 120; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            r: Math.random() * 6 + 4,
            d: Math.random() * duration,
            color: colors[Math.floor(Math.random() * colors.length)],
            tilt: Math.random() * 10 - 10,
            tiltAngleIncremental: Math.random() * 0.07 + 0.05,
            tiltAngle: 0
        });
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p, i) => {
            p.tiltAngle += p.tiltAngleIncremental;
            p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
            p.tilt = Math.sin(p.tiltAngle) * 15;
            ctx.beginPath();
            ctx.lineWidth = p.r;
            ctx.strokeStyle = p.color;
            ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
            ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
            ctx.stroke();
            if (p.y > canvas.height) {
                particles[i] = { ...p, y: -20, x: Math.random() * canvas.width };
            }
        });
        if (Date.now() < animationEnd) {
            requestAnimationFrame(draw);
        } else {
            document.body.removeChild(canvas);
        }
    }
    draw();
}

// --- 5. 渲染引擎 ---

function renderAll() {
    renderSubjects();
    renderGifts();
    renderHistory();
    updateHeader();
}

function renderSubjects() {
    const lCon = document.getElementById('learning-container');
    const fCon = document.getElementById('life-container');
    if (!lCon || !fCon) return;

    lCon.innerHTML = ''; fCon.innerHTML = '';

    appData.subjects.forEach(sub => {
        let starsHtml = '';
        if (sub.score === 0) {
            starsHtml = '<span style="color:#bbb; font-size:0.75rem; opacity:0.6;">做任务领星星</span>';
        } else {
            for (let i = 0; i < sub.score; i++) {
                starsHtml += `<i class="fas fa-star visual-star" onclick="removeScore(event, ${sub.id})"></i>`;
            }
        }

        // 满分流光特效
        const isGlowing = sub.score >= 8 ? 'has-glow' : '';
        const glowOverlay = sub.score >= 8 ? '<div class="card-glow-overlay"></div>' : '';

        const cardHtml = `
            <div class="kid-card ${sub.theme} ${isGlowing}" onclick="addScore(${sub.id})">
                ${glowOverlay}
                <i class="fas ${sub.icon} card-icon"></i>
                <div class="card-title">${sub.name}</div>
                <div class="stars-box">${starsHtml}</div>
                <div class="progress-text">${sub.score >= 10 ? '可兑换!' : `还差 ${10 - sub.score} 颗`}</div>
                <div class="add-big-btn"><i class="fas fa-plus"></i></div>
            </div>
        `;

        if (sub.category === 'learning') lCon.innerHTML += cardHtml;
        else fCon.innerHTML += cardHtml;
    });
}

function renderGifts() {
    const con = document.getElementById('gift-container');
    if (!con) return;
    con.innerHTML = '';
    appData.gifts.forEach(gift => {
        const canBuy = appData.totalCrowns >= gift.cost;
        con.innerHTML += `
            <div class="gift-item">
                <div>
                    <div class="menu-title">${gift.name}</div>
                    <div class="gift-cost">👑 ${gift.cost}</div>
                </div>
                <button class="exchange-btn" ${canBuy ? '' : 'disabled'} onclick="exchangeGift(${gift.id})">
                    ${canBuy ? '兑换' : '不足'}
                </button>
            </div>
        `;
    });
}

function renderHistory() {
    const con = document.getElementById('history-list');
    if (!con) return;
    
    if (!appData.history || appData.history.length === 0) {
        con.innerHTML = '<div style="text-align:center;color:#ccc;padding:15px;font-size:0.8rem;">暂无记录，快去赚星星吧！</div>';
        return;
    }
    
    con.innerHTML = '';
    // 只显示最近 20 条
    appData.history.slice(0, 20).forEach(item => {
        con.innerHTML += `
            <div class="history-item">
                <span class="history-time">${item.time}</span>
                <span class="history-content">${item.msg}</span>
                <span class="history-score ${item.type === 'add' ? 'score-plus' : 'score-minus'}">
                    ${item.type === 'add' ? '+' : ''}${item.val}
                </span>
            </div>
        `;
    });
}

// --- 6. 核心交互 (加分/减分/兑换) ---

function addScore(id) {
    const sub = appData.subjects.find(s => s.id === id);
    if (!sub) return;

    sub.score++;
    if (navigator.vibrate) navigator.vibrate(40);
    addLog(`完成 ${sub.name}`, 1, 'add');

    if (sub.score >= 10) {
        sub.score = 0;
        appData.totalCrowns++;
        launchConfetti();
        showToast('太棒了！兑换了皇冠 👑', 'fa-crown');
        addLog(`集满星星兑换皇冠`, 1, 'add');
    } else {
        showToast(`${sub.name} +1 ⭐`, 'fa-star');
    }
    saveData();
    renderSubjects();
}

function removeScore(event, id) {
    if (event) event.stopPropagation();
    const sub = appData.subjects.find(s => s.id === id);
    if (sub && sub.score > 0) {
        sub.score--;
        if (navigator.vibrate) navigator.vibrate([20, 20]);
        addLog(`撤销 ${sub.name}`, -1, 'minus');
        showToast('已撤销一颗星星', 'fa-undo');
        saveData();
        renderSubjects();
    }
}

function exchangeGift(id) {
    const gift = appData.gifts.find(g => g.id === id);
    if (gift && appData.totalCrowns >= gift.cost) {
        if (confirm(`确定要花 ${gift.cost} 个皇冠兑换【${gift.name}】吗？`)) {
            appData.totalCrowns -= gift.cost;
            addLog(`兑换 ${gift.name}`, -gift.cost, 'minus');
            showToast('兑换成功！', 'fa-gift');
            saveData();
            renderAll();
        }
    }
}

// 记录日志工具
function addLog(msg, val, type) {
    if (!appData.history) appData.history = [];
    const now = new Date();
    // 格式化时间 12-25 09:30
    const timeStr = `${now.getMonth() + 1}-${now.getDate()} ${now.getHours()}:${now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes()}`;
    appData.history.unshift({ time: timeStr, msg: msg, val: val, type: type });
    renderHistory();
}

function toggleHistory() {
    const el = document.getElementById('history-list');
    if (el.style.display === 'none') {
        el.style.display = 'block';
    } else {
        el.style.display = 'none';
    }
}

// --- 7. 管理面板 2.0 (全屏模态层逻辑) ---

// 这里的 ID 对应我们在 HTML 增加的模态层
function showManageSubjects() {
    currentAdminTab = 'sub';
    openAdmin();
}

function showManageGifts() {
    currentAdminTab = 'gift';
    openAdmin();
}

function openAdmin() {
    const overlay = document.getElementById('admin-overlay');
    if(overlay) {
        overlay.style.display = 'flex';
        renderAdminList();
        updateAdminTabs();
    }
}

function closeAdmin() {
    const overlay = document.getElementById('admin-overlay');
    if(overlay) {
        overlay.style.display = 'none';
        renderAll(); // 关闭时刷新主页面
    }
}

function switchAdminTab(tab) {
    currentAdminTab = tab;
    updateAdminTabs();
    renderAdminList();
}

function updateAdminTabs() {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(currentAdminTab === 'sub' ? 'tab-sub' : 'tab-gift').classList.add('active');
}

function renderAdminList() {
    const container = document.getElementById('admin-list-container');
    container.innerHTML = '';
    
    if (currentAdminTab === 'sub') {
        appData.subjects.forEach((item, index) => {
            container.innerHTML += `
                <div class="admin-item">
                    <i class="fas ${item.icon}" style="color:var(--primary); font-size:1.2rem;"></i>
                    <div class="admin-item-info">
                        <div class="admin-item-title">${item.name}</div>
                        <div class="admin-item-meta">${item.category === 'learning' ? '📘 学习任务' : '💖 生活表现'}</div>
                    </div>
                    <div class="admin-actions">
                        <i class="fas fa-edit" onclick="editItem(${index})"></i>
                        <i class="fas fa-trash-alt" onclick="deleteItem(${index})"></i>
                    </div>
                </div>`;
        });
    } else {
        appData.gifts.forEach((item, index) => {
            container.innerHTML += `
                <div class="admin-item">
                    <i class="fas fa-gift" style="color:#E91E63; font-size:1.2rem;"></i>
                    <div class="admin-item-info">
                        <div class="admin-item-title">${item.name}</div>
                        <div class="admin-item-meta">需 👑 ${item.cost} 皇冠</div>
                    </div>
                    <div class="admin-actions">
                        <i class="fas fa-edit" onclick="editItem(${index})"></i>
                        <i class="fas fa-trash-alt" onclick="deleteItem(${index})"></i>
                    </div>
                </div>`;
        });
    }
}

function editItem(index) {
    if (currentAdminTab === 'sub') {
        const sub = appData.subjects[index];
        const newName = prompt("修改任务名称", sub.name);
        if (newName) {
            sub.name = newName;
            // 可选：在这里增加修改图标或分类的逻辑
        }
    } else {
        const gift = appData.gifts[index];
        const newName = prompt("修改礼物名称", gift.name);
        const newCost = prompt("修改所需皇冠数", gift.cost);
        if (newName) gift.name = newName;
        if (newCost) gift.cost = parseInt(newCost);
    }
    saveData();
    renderAdminList();
}

function deleteItem(index) {
    if (confirm("⚠️ 确定要删除这一项吗？删除后统计数据也会消失。")) {
        if (currentAdminTab === 'sub') appData.subjects.splice(index, 1);
        else appData.gifts.splice(index, 1);
        saveData();
        renderAdminList();
    }
}

function addNewItemInAdmin() {
    if (currentAdminTab === 'sub') {
        const name = prompt("请输入新任务名称:");
        if (!name) return;
        const isLearning = confirm("是【学习任务】吗？\n确定 = 学习\n取消 = 生活");
        const themes = ['theme-blue', 'theme-pink', 'theme-green', 'theme-orange', 'theme-purple'];
        
        appData.subjects.push({
            id: Date.now(),
            name: name,
            icon: isLearning ? 'fa-book' : 'fa-heart',
            theme: themes[Math.floor(Math.random() * themes.length)],
            category: isLearning ? 'learning' : 'life',
            score: 0
        });
    } else {
        const name = prompt("请输入新礼物名称:");
        const cost = prompt("需要多少个皇冠:");
        if (name && cost) {
            appData.gifts.push({ 
                id: Date.now(), 
                name: name, 
                cost: parseInt(cost) 
            });
        }
    }
    saveData();
    renderAdminList();
}

// --- 8. 系统辅助功能 ---

function changeName() {
    const newName = prompt("你想改叫什么名字？", appData.userName);
    if (newName && newName.trim() !== "") {
        appData.userName = newName.trim();
        saveData();
        refreshUserName();
        showToast(`你好呀，${appData.userName}！`, 'fa-user-edit');
    }
}

function refreshUserName() {
    const display = document.getElementById('userNameDisplay');
    const certName = document.getElementById('cert-user-name');
    const avatarLetter = document.getElementById('avatarLetter');

    if (display) display.innerText = appData.userName;
    if (certName) certName.innerText = appData.userName;
    if (avatarLetter && appData.userName) {
        avatarLetter.innerText = appData.userName.charAt(0).toUpperCase();
    }
    document.title = `${appData.userName}的星星大作战`;
}

function generateCertificate() {
    showToast('正在绘制证书...', 'fa-magic');
    document.getElementById('cert-crowns').innerText = appData.totalCrowns;
    
    // 统计当前盘面上的所有星星
    let totalStars = appData.subjects.reduce((sum, s) => sum + s.score, 0);
    document.getElementById('cert-stars').innerText = totalStars;
    document.getElementById('cert-date').innerText = new Date().toLocaleDateString();

    html2canvas(document.getElementById('cert-template'), { scale: 2 }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        
        // 创建简单的全屏预览，不依赖复杂的ID判断，直接动态生成
        const previewDiv = document.createElement('div');
        previewDiv.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.92);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;";
        previewDiv.innerHTML = `
             <div style="color:white;margin-bottom:20px;">长按图片保存到手机</div>
             <img src="${imgData}" style="width:100%;max-width:400px;border-radius:10px;box-shadow:0 0 20px rgba(0,0,0,0.5);">
             <button style="margin-top:30px;padding:12px 50px;border-radius:30px;border:none;background:#FF9800;color:white;font-weight:bold;">关闭</button>
        `;
        
        previewDiv.querySelector('button').onclick = () => document.body.removeChild(previewDiv);
        document.body.appendChild(previewDiv);
    });
}

function switchTab(viewName, btnElement) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.getElementById('view-' + viewName).classList.add('active');
    
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
    window.scrollTo(0, 0);
}

// 导出数据
function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `star_battle_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

// 导入数据
function importData(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (confirm("⚠️ 确定要覆盖当前数据吗？建议先导出备份。")) {
                appData = imported;
                saveData();
                init();
                showToast('数据导入成功', 'fa-check');
            }
        } catch (err) {
            alert("文件格式错误，请导入正确的JSON文件");
        }
    };
    reader.readAsText(file);
}

function updateHeader() {
    const crownEl = document.getElementById('totalCrowns');
    if (crownEl) crownEl.innerText = appData.totalCrowns;
}

function updateDate() {
    const now = new Date();
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    const el = document.getElementById('dateDisplay');
    if(el) el.textContent = `${now.getMonth() + 1}月${now.getDate()}日 星期${days[now.getDay()]}`;
}

function uploadAvatarClick() { document.getElementById('avatarInput').click(); }

function handleAvatarUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            appData.avatar = e.target.result;
            const img = document.getElementById('userAvatar');
            if(img) {
                img.src = e.target.result;
                img.style.opacity = '1';
            }
            saveData();
            showToast('头像已更新', 'fa-smile');
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function showToast(msg, icon) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.querySelector('.toast-icon').className = `fas ${icon} toast-icon`;
    document.getElementById('toast-msg').innerText = msg;
    toast.classList.add('show');
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

function resetData() {
    if (confirm("⚠️ 警告：确定要清空所有数据吗？\n操作不可撤销！")) {
        localStorage.removeItem('susanAppV3');
        location.reload();
    }
}

// 启动应用
init();