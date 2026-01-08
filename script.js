/**
 * 星星大作战 - 核心逻辑脚本 (稳定全功能版 v2.6)
 * 包含：多用户命名、CSS占位头像、纸屑烟花、流光特效、误触撤销
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

let appData = {
    userName: '小朋友',
    subjects: JSON.parse(JSON.stringify(defaultSubjects)),
    gifts: JSON.parse(JSON.stringify(defaultGifts)),
    totalCrowns: 0,
    avatar: ''
};

// --- 2. 核心启动与数据加载 ---

function init() {
    loadData();
    refreshUserName();
    updateDate();
    renderAll();
}

function loadData() {
    const saved = localStorage.getItem('susanAppV2_full');
    if (saved) {
        appData = JSON.parse(saved);
    }
    // 恢复头像图片（如果有）
    if (appData.avatar) {
        const avatarImg = document.getElementById('userAvatar');
        if (avatarImg) {
            avatarImg.src = appData.avatar;
            avatarImg.style.opacity = '1'; // 确保图片可见
        }
    }
}

function saveData() {
    localStorage.setItem('susanAppV2_full', JSON.stringify(appData));
    updateHeader();
}

// --- 3. 视觉特效：全屏纸屑烟花 ---

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

// --- 4. 渲染引擎 ---

function renderAll() {
    renderSubjects();
    renderGifts();
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
            starsHtml = '<span style="color:#bbb; font-size:0.8rem; opacity:0.6;">做任务领星星</span>';
        } else {
            for (let i = 0; i < sub.score; i++) {
                starsHtml += `<i class="fas fa-star visual-star" onclick="removeScore(event, ${sub.id})"></i>`;
            }
        }

        const isGlowing = sub.score >= 8 ? 'has-glow' : '';
        const glowOverlay = sub.score >= 8 ? '<div class="card-glow-overlay"></div>' : '';

        const cardHtml = `
            <div class="kid-card ${sub.theme} ${isGlowing}" onclick="addScore(${sub.id})">
                ${glowOverlay}
                <i class="fas ${sub.icon} card-icon"></i>
                <div class="card-title">${sub.name}</div>
                <div class="stars-box">${starsHtml}</div>
                <div class="progress-text">还差 ${10 - sub.score} 颗换皇冠</div>
                <div class="add-big-btn"><i class="fas fa-plus"></i></div>
            </div>
        `;
        (sub.category === 'learning' ? lCon : fCon).innerHTML += cardHtml;
    });
}

// --- 5. 交互操作 ---

function addScore(id) {
    const sub = appData.subjects.find(s => s.id === id);
    if (!sub) return;
    sub.score++;
    if (navigator.vibrate) navigator.vibrate(40);

    if (sub.score >= 10) {
        sub.score = 0;
        appData.totalCrowns++;
        launchConfetti();
        showToast(`太棒了，${appData.userName}！获得皇冠 👑`, 'fa-crown');
    } else {
        showToast(`${sub.name} +1 ⭐`, 'fa-star');
    }
    saveData();
    renderSubjects();
}

function removeScore(event, id) {
    if (event) event.stopPropagation(); // 防止触发加分
    const sub = appData.subjects.find(s => s.id === id);
    if (!sub || sub.score <= 0) return;
    sub.score--;
    if (navigator.vibrate) navigator.vibrate([20, 20]);
    showToast(`已撤销一颗星星`, 'fa-undo');
    saveData();
    renderSubjects();
}

// --- 6. 用户管理逻辑 ---

function refreshUserName() {
    const display = document.getElementById('userNameDisplay');
    const certName = document.getElementById('cert-user-name');
    const avatarLetter = document.getElementById('avatarLetter');

    if (display) display.innerText = appData.userName;
    if (certName) certName.innerText = appData.userName;
    
    // 提取名字首字母作为占位符
    if (avatarLetter && appData.userName) {
        avatarLetter.innerText = appData.userName.charAt(0).toUpperCase();
    }
    document.title = `${appData.userName}的星星大作战`;
}

function changeName() {
    const newName = prompt("你想改叫什么名字？", appData.userName);
    if (newName && newName.trim() !== "") {
        appData.userName = newName.trim();
        saveData();
        refreshUserName();
        showToast(`你好呀，${appData.userName}！`, 'fa-user-edit');
    }
}

// --- 7. 系统辅助功能 ---

function switchTab(viewName, btnElement) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.getElementById('view-' + viewName).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    if(btnElement) btnElement.classList.add('active');
    window.scrollTo(0, 0);
}

function generateCertificate() {
    if (appData.totalCrowns === 0) {
        alert("再攒一点皇冠再来领奖吧！");
        return;
    }
    showToast('正在绘制证书...', 'fa-magic');
    document.getElementById('cert-crowns').innerText = appData.totalCrowns;
    document.getElementById('cert-date').innerText = new Date().toLocaleDateString();
    
    html2canvas(document.getElementById('cert-template'), { scale: 2 }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        let overlay = document.getElementById('cert-preview-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'cert-preview-overlay';
            overlay.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.92);z-index:3000;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;padding:20px;";
            overlay.innerHTML = `
                <div style="margin-bottom:15px;text-align:center;">长按图片保存到手机</div>
                <img id="cert-img" style="width:100%; max-width:400px; border-radius:10px; box-shadow:0 0 20px rgba(0,0,0,0.5);">
                <button onclick="this.parentElement.style.display='none'" style="margin-top:25px; padding:12px 50px; border-radius:30px; border:none; background:linear-gradient(45deg, #FF9800, #FF5722); color:white; font-weight:bold;">关闭</button>`;
            document.body.appendChild(overlay);
        }
        document.getElementById('cert-img').src = imgData;
        overlay.style.display = 'flex';
    });
}

function renderGifts() {
    const container = document.getElementById('gift-container');
    if (!container) return;
    container.innerHTML = '';
    appData.gifts.forEach(gift => {
        const canBuy = appData.totalCrowns >= gift.cost;
        container.innerHTML += `
            <div class="gift-item">
                <div><div class="menu-title">${gift.name}</div><div class="gift-cost">👑 ${gift.cost} 皇冠</div></div>
                <button class="exchange-btn" ${canBuy ? '' : 'disabled'} onclick="exchangeGift(${gift.id})">${canBuy ? '兑换' : '不足'}</button>
            </div>`;
    });
}

function exchangeGift(id) {
    const gift = appData.gifts.find(g => g.id === id);
    if (!gift || appData.totalCrowns < gift.cost) return;
    if (confirm(`确定要花 ${gift.cost} 个皇冠兑换【${gift.name}】吗？`)) {
        appData.totalCrowns -= gift.cost;
        showToast(`兑换成功！`, 'fa-gift');
        saveData();
        renderAll();
    }
}

function updateHeader() {
    const crownEl = document.getElementById('totalCrowns');
    if (crownEl) crownEl.innerText = appData.totalCrowns;
}

function updateDate() {
    const now = new Date();
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    const el = document.getElementById('dateDisplay');
    if (el) el.textContent = `${now.getMonth() + 1}月${now.getDate()}日 星期${days[now.getDay()]}`;
}

function showManageSubjects() {
    const name = prompt("请输入新任务名称:");
    if (!name) return;
    const isLearning = confirm("是否为学习任务？\n确定 = 学习任务\n取消 = 生活表现");
    appData.subjects.push({
        id: Date.now(),
        name: name,
        icon: isLearning ? 'fa-pen-fancy' : 'fa-heart',
        theme: 'theme-orange',
        category: isLearning ? 'learning' : 'life',
        score: 0
    });
    saveData();
    renderSubjects();
    showToast('添加成功！', 'fa-check');
}

function uploadAvatarClick() { document.getElementById('avatarInput').click(); }

function handleAvatarUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            appData.avatar = e.target.result;
            const avatarImg = document.getElementById('userAvatar');
            if (avatarImg) {
                avatarImg.src = e.target.result;
                avatarImg.style.opacity = '1';
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
    if (confirm("确定要重置所有数据吗？此操作不可撤销！")) {
        localStorage.removeItem('susanAppV2_full');
        location.reload();
    }
}

// 启动！
init();