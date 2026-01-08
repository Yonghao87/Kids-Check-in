/**
 * 星星大作战 v3.0 - 核心逻辑
 */

// --- 1. 默认数据 ---
const defaultSubjects = [
    { id: 1, name: '古诗背诵', icon: 'fa-book-open', theme: 'theme-blue', category: 'learning', score: 0 },
    { id: 2, name: '趣味数学', icon: 'fa-calculator', theme: 'theme-purple', category: 'learning', score: 0 },
    { id: 3, name: '英语绘本', icon: 'fa-language', theme: 'theme-green', category: 'learning', score: 0 },
    { id: 4, name: '家务帮手', icon: 'fa-broom', theme: 'theme-pink', category: 'life', score: 0 },
    { id: 5, name: '运动打卡', icon: 'fa-running', theme: 'theme-orange', category: 'life', score: 0 },
    { id: 6, name: '按时睡觉', icon: 'fa-moon', theme: 'theme-blue', category: 'life', score: 0 }
];

const defaultGifts = [
    { id: 1, name: '看动画片(30分)', cost: 3 },
    { id: 2, name: '买小玩具', cost: 10 },
    { id: 3, name: '去游乐园', cost: 50 }
];

let appData = {
    userName: '小朋友',
    subjects: JSON.parse(JSON.stringify(defaultSubjects)),
    gifts: JSON.parse(JSON.stringify(defaultGifts)),
    totalCrowns: 0,
    avatar: '',
    history: [] // 新增成长日志
};

// --- 2. 初始化 ---
function init() {
    loadData();
    refreshUserName();
    updateDate();
    renderAll();
}

function loadData() {
    const saved = localStorage.getItem('susanAppV3');
    if (saved) {
        // 合并数据防止旧版数据缺失字段
        const parsed = JSON.parse(saved);
        appData = { ...appData, ...parsed };
        // 确保subjects里有category字段(兼容旧版)
        appData.subjects.forEach(s => {
            if(!s.category) s.category = 'learning';
        });
    }
    if (appData.avatar) {
        document.getElementById('userAvatar').src = appData.avatar;
    }
}

function saveData() {
    localStorage.setItem('susanAppV3', JSON.stringify(appData));
    updateHeader();
}

// --- 3. 渲染逻辑 ---
function renderAll() {
    renderSubjects();
    renderGifts();
    renderHistory();
    updateHeader();
}

function renderSubjects() {
    const lCon = document.getElementById('learning-container');
    const fCon = document.getElementById('life-container');
    if(!lCon || !fCon) return;
    
    lCon.innerHTML = ''; fCon.innerHTML = '';

    appData.subjects.forEach(sub => {
        let starsHtml = '';
        if (sub.score === 0) {
            starsHtml = '<span style="color:#bbb; font-size:0.75rem; opacity:0.6;">做任务领星星</span>';
        } else {
            for(let i=0; i<sub.score; i++) {
                starsHtml += `<i class="fas fa-star visual-star" onclick="removeScore(event, ${sub.id})"></i>`;
            }
        }

        const cardHtml = `
            <div class="kid-card ${sub.theme}" onclick="addScore(${sub.id})">
                <i class="fas ${sub.icon} card-icon"></i>
                <div class="card-title">${sub.name}</div>
                <div class="stars-box">${starsHtml}</div>
                <div class="progress-text">${sub.score >= 10 ? '可兑换!' : `还差 ${10-sub.score} 颗`}</div>
                <div class="add-big-btn"><i class="fas fa-plus"></i></div>
            </div>
        `;

        if (sub.category === 'life') fCon.innerHTML += cardHtml;
        else lCon.innerHTML += cardHtml;
    });
}

function renderGifts() {
    const con = document.getElementById('gift-container');
    con.innerHTML = '';
    appData.gifts.forEach(gift => {
        const canBuy = appData.totalCrowns >= gift.cost;
        con.innerHTML += `
            <div class="gift-item">
                <div>
                    <div class="menu-title">${gift.name}</div>
                    <div class="gift-cost">👑 ${gift.cost}</div>
                </div>
                <button class="exchange-btn" ${canBuy?'':'disabled'} onclick="exchangeGift(${gift.id})">
                    ${canBuy?'兑换':'不足'}
                </button>
            </div>
        `;
    });
}

function renderHistory() {
    const con = document.getElementById('history-list');
    if(!appData.history || appData.history.length === 0) {
        con.innerHTML = '<div style="text-align:center;color:#ccc;padding:10px;">暂无记录，快去行动吧！</div>';
        return;
    }
    con.innerHTML = '';
    // 只显示最近20条
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

// --- 4. 核心交互 ---
function addScore(id) {
    const sub = appData.subjects.find(s => s.id === id);
    if(!sub) return;
    
    sub.score++;
    addLog(`完成 ${sub.name}`, 1, 'add');
    
    if(sub.score >= 10) {
        sub.score = 0;
        appData.totalCrowns++;
        showToast('太棒了！兑换了皇冠 👑', 'fa-crown');
        addLog(`集满星星兑换皇冠`, 1, 'add');
    } else {
        showToast(`${sub.name} +1 ⭐`, 'fa-star');
    }
    saveData();
    renderSubjects();
}

function removeScore(e, id) {
    if(e) e.stopPropagation();
    const sub = appData.subjects.find(s => s.id === id);
    if(sub && sub.score > 0) {
        sub.score--;
        addLog(`撤销 ${sub.name}`, -1, 'minus');
        showToast('已撤销一颗星星', 'fa-undo');
        saveData();
        renderSubjects();
    }
}

function exchangeGift(id) {
    const gift = appData.gifts.find(g => g.id === id);
    if(gift && appData.totalCrowns >= gift.cost) {
        if(confirm(`确定兑换【${gift.name}】吗？`)) {
            appData.totalCrowns -= gift.cost;
            addLog(`兑换 ${gift.name}`, -gift.cost, 'minus');
            showToast('兑换成功！', 'fa-gift');
            saveData();
            renderAll();
        }
    }
}

// 记录日志
function addLog(msg, val, type) {
    if(!appData.history) appData.history = [];
    const now = new Date();
    const timeStr = `${now.getMonth()+1}-${now.getDate()} ${now.getHours()}:${now.getMinutes()<10?'0'+now.getMinutes():now.getMinutes()}`;
    appData.history.unshift({ time: timeStr, msg: msg, val: val, type: type });
    renderHistory();
}

function toggleHistory() {
    const el = document.getElementById('history-list');
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

// --- 5. 管理功能 ---
function showManageSubjects() {
    // 简单的管理逻辑：列出所有任务，点击可删除或重命名
    let action = prompt("输入 '1' 添加新任务\n输入 '2' 修改/删除现有任务");
    if(action === '1') {
        const name = prompt("请输入新任务名称:");
        if(!name) return;
        const type = confirm("是【学习任务】吗？\n确定=学习，取消=生活") ? 'learning' : 'life';
        const themes = ['theme-blue', 'theme-pink', 'theme-green', 'theme-orange', 'theme-purple'];
        appData.subjects.push({
            id: Date.now(),
            name: name,
            icon: type==='learning'?'fa-book':'fa-heart',
            theme: themes[Math.floor(Math.random()*themes.length)],
            category: type,
            score: 0
        });
        saveData();
        renderSubjects();
        showToast('添加成功', 'fa-check');
    } else if (action === '2') {
        let txt = "请输入要修改的任务编号:\n";
        appData.subjects.forEach((s, i) => txt += `${i+1}. ${s.name}\n`);
        const idx = parseInt(prompt(txt)) - 1;
        if(idx >= 0 && idx < appData.subjects.length) {
            const sub = appData.subjects[idx];
            if(confirm(`要删除【${sub.name}】吗？\n取消则进行重命名`)) {
                appData.subjects.splice(idx, 1);
                showToast('已删除', 'fa-trash');
            } else {
                const newName = prompt("请输入新名称:", sub.name);
                if(newName) sub.name = newName;
            }
            saveData();
            renderSubjects();
        }
    }
}

function showManageGifts() {
    // 类似的礼物管理逻辑
    let action = prompt("输入 '1' 添加新礼物\n输入 '2' 修改/删除礼物");
    if(action === '1') {
        const name = prompt("礼物名称:");
        const cost = parseInt(prompt("需要多少皇冠:"));
        if(name && cost) {
            appData.gifts.push({ id: Date.now(), name: name, cost: cost });
            saveData();
            renderGifts();
        }
    } else if (action === '2') {
        let txt = "请输入礼物编号:\n";
        appData.gifts.forEach((g, i) => txt += `${i+1}. ${g.name} (${g.cost}👑)\n`);
        const idx = parseInt(prompt(txt)) - 1;
        if(idx >= 0 && idx < appData.gifts.length) {
            appData.gifts.splice(idx, 1);
            saveData();
            renderGifts();
        }
    }
}

// --- 6. 数据导出导入 ---
function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "star_data_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importData(input) {
    const file = input.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if(confirm("确定要覆盖当前数据吗？")) {
                appData = imported;
                saveData();
                init();
                showToast('数据导入成功', 'fa-check');
            }
        } catch(err) {
            alert("文件格式错误！");
        }
    };
    reader.readAsText(file);
}

// --- 7. 通用 ---
function changeName() {
    const name = prompt("请输入小朋友的名字:", appData.userName);
    if(name) {
        appData.userName = name;
        saveData();
        refreshUserName();
    }
}

function refreshUserName() {
    document.getElementById('userNameDisplay').innerText = appData.userName;
    document.getElementById('cert-user-name').innerText = appData.userName;
    document.getElementById('avatarLetter').innerText = appData.userName.charAt(0);
}

function generateCertificate() {
    // 不再校验皇冠数量，直接生成
    showToast('正在生成证书...', 'fa-magic');
    document.getElementById('cert-crowns').innerText = appData.totalCrowns;
    // 计算总星星数（当前剩余+已兑换的估算值? 或者只显示当前）
    // 这里简单显示所有科目当前星星总和
    let totalStars = appData.subjects.reduce((sum, s) => sum + s.score, 0);
    document.getElementById('cert-stars').innerText = totalStars;
    document.getElementById('cert-date').innerText = new Date().toLocaleDateString();

    const el = document.getElementById('cert-template');
    html2canvas(el, { scale: 2 }).then(canvas => {
        const img = canvas.toDataURL("image/png");
        // 创建预览
        const win = window.open("", "_blank");
        win.document.write(`<img src="${img}" style="width:100%"/>`);
        // 或者移动端更友好的弹窗方式...
    });
}

function switchTab(tab, btn) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.getElementById('view-'+tab).classList.add('active');
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    if(btn) btn.classList.add('active');
}

function updateHeader() {
    document.getElementById('totalCrowns').innerText = appData.totalCrowns;
}

function updateDate() {
    const now = new Date();
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    document.getElementById('dateDisplay').textContent = `${now.getMonth() + 1}月${now.getDate()}日 星期${days[now.getDay()]}`;
}

function uploadAvatarClick() { document.getElementById('avatarInput').click(); }
function handleAvatarUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            appData.avatar = e.target.result;
            document.getElementById('userAvatar').src = e.target.result;
            document.getElementById('userAvatar').style.opacity = 1;
            saveData();
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function showToast(msg, icon) {
    const box = document.getElementById('toast');
    box.querySelector('i').className = `fas ${icon} toast-icon`;
    document.getElementById('toast-msg').innerText = msg;
    box.classList.add('show');
    setTimeout(() => box.classList.remove('show'), 2000);
}

function resetData() {
    if(confirm("确定清空所有数据吗？不可恢复！")) {
        localStorage.removeItem('susanAppV3');
        location.reload();
    }
}

// 启动
init();