/**
 * Penney's Game 主应用逻辑
 */

import { generateSeed, isValidSeed, generateCoinSequence, sequenceToChinese, coinToChinese } from './rng.js';
import { PLAYER_SEQUENCES, FLIP_COUNT_OPTIONS, DEFAULT_FLIP_COUNT, getProgramSequence, runGame, searchPattern } from './game.js';
import { saveGameResult, getHistory, getHistoryById, clearHistory, isFirstVisit, markVisited, formatTimestamp } from './storage.js';
import { setSpeed, getSpeed, getFrameDelay, skipAnimation, resetSkip, shouldSkipAnimation, setAnimating, delay, flipCoin, createFloatingScore, showThinkingAnimation } from './animation.js';

// ===== 应用状态 =====
const state = {
    currentSeed: '',
    selectedSequence: null,
    flipCount: DEFAULT_FLIP_COUNT,
    currentGame: null,
    currentPage: 'game',
    verifySequence: null,
    verifyHighlights: []
};

// ===== DOM 元素缓存 =====
let elements = {};

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    cacheElements();
    initNavigation();
    initGamePage();
    initVerifyPage();
    initHistoryPage();
    initModals();

    // 首次访问显示规则
    if (isFirstVisit()) {
        showModal('rulesModal');
        markVisited();
    }

    // 生成初始种子
    refreshSeed();
});

function cacheElements() {
    elements = {
        // 导航
        navTabs: document.querySelectorAll('.nav-tab'),
        pages: document.querySelectorAll('.page'),
        helpBtn: document.getElementById('helpBtn'),

        // 游戏设置
        sequenceGrid: document.getElementById('sequenceGrid'),
        flipCount: document.getElementById('flipCount'),
        currentSeed: document.getElementById('currentSeed'),
        refreshSeed: document.getElementById('refreshSeed'),
        verifySeedBtn: document.getElementById('verifySeed'),

        // 程序序列
        programSequence: document.getElementById('programSequence'),
        playerSequenceDisplay: document.getElementById('playerSequenceDisplay'),
        programSequenceDisplay: document.getElementById('programSequenceDisplay'),
        startGameBtn: document.getElementById('startGameBtn'),

        // 游戏进行
        gameSetup: document.getElementById('gameSetup'),
        gamePlay: document.getElementById('gamePlay'),
        gameResult: document.getElementById('gameResult'),
        playerScore: document.getElementById('playerScore'),
        programScore: document.getElementById('programScore'),
        playerScoreSeq: document.getElementById('playerScoreSeq'),
        programScoreSeq: document.getElementById('programScoreSeq'),
        progressText: document.getElementById('progressText'),
        coinTrack: document.getElementById('coinTrack'),
        speedBtns: document.querySelectorAll('.speed-btn'),
        skipBtn: document.getElementById('skipBtn'),

        // 结果
        finalPlayerScore: document.getElementById('finalPlayerScore'),
        finalProgramScore: document.getElementById('finalProgramScore'),
        playAgainBtn: document.getElementById('playAgainBtn'),
        viewDetailsBtn: document.getElementById('viewDetailsBtn'),

        // 验证页面
        verifySeedInput: document.getElementById('verifySeedInput'),
        verifyStatus: document.getElementById('verifyStatus'),
        verifyCount: document.getElementById('verifyCount'),
        generateSequenceBtn: document.getElementById('generateSequenceBtn'),
        searchGroup: document.getElementById('searchGroup'),
        searchPattern: document.getElementById('searchPattern'),
        searchBtn: document.getElementById('searchBtn'),
        searchResult: document.getElementById('searchResult'),
        sequenceViewer: document.getElementById('sequenceViewer'),
        sequenceScroll: document.getElementById('sequenceScroll'),
        sequenceContent: document.getElementById('sequenceContent'),

        // 历史页面
        historyList: document.getElementById('historyList'),
        historyEmpty: document.getElementById('historyEmpty'),
        clearHistoryBtn: document.getElementById('clearHistoryBtn'),
        historyDetailModal: document.getElementById('historyDetailModal'),
        historyDetailBody: document.getElementById('historyDetailBody'),
        goToVerifyBtn: document.getElementById('goToVerifyBtn'),

        // 弹窗
        rulesModal: document.getElementById('rulesModal')
    };
}

// ===== 导航 =====
function initNavigation() {
    elements.navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            switchPage(tabName);
        });
    });

    elements.helpBtn.addEventListener('click', () => {
        showModal('rulesModal');
    });
}

function switchPage(pageName) {
    state.currentPage = pageName;

    // 更新标签状态
    elements.navTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === pageName);
    });

    // 更新页面显示
    elements.pages.forEach(page => {
        page.classList.toggle('active', page.id === `${pageName}Page`);
    });

    // 页面切换时的特殊处理
    if (pageName === 'history') {
        renderHistoryList();
    }
}

// ===== 游戏页面 =====
function initGamePage() {
    // 渲染序列选项
    renderSequenceOptions();

    // 投掷次数选择
    elements.flipCount.addEventListener('change', (e) => {
        state.flipCount = parseInt(e.target.value);
    });

    // 种子操作
    elements.refreshSeed.addEventListener('click', refreshSeed);
    elements.verifySeedBtn.addEventListener('click', () => {
        elements.verifySeedInput.value = state.currentSeed;
        validateSeedInput();
        switchPage('verify');
    });

    // 开始游戏
    elements.startGameBtn.addEventListener('click', startGame);

    // 速度控制
    elements.speedBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const speed = parseInt(btn.dataset.speed);
            setSpeed(speed);
            elements.speedBtns.forEach(b => b.classList.toggle('active', b === btn));
        });
    });

    // 跳过动画
    elements.skipBtn.addEventListener('click', () => {
        skipAnimation();
    });

    // 再来一局
    elements.playAgainBtn.addEventListener('click', playAgain);

    // 查看详情
    elements.viewDetailsBtn.addEventListener('click', () => {
        if (state.currentGame) {
            switchPage('history');
            showHistoryDetail(state.currentGame);
        }
    });
}

function renderSequenceOptions() {
    elements.sequenceGrid.innerHTML = PLAYER_SEQUENCES.map(seq => {
        const chinese = sequenceToChinese(seq);
        const coins = seq.split('').map(c =>
            `<div class="coin-mini ${c === 'H' ? 'heads' : 'tails'}">${coinToChinese(c)}</div>`
        ).join('');

        return `
      <div class="sequence-option" data-sequence="${seq}">
        <div class="coins">${coins}</div>
        <span class="label">${chinese}</span>
      </div>
    `;
    }).join('');

    // 添加点击事件
    document.querySelectorAll('.sequence-option').forEach(option => {
        option.addEventListener('click', () => selectSequence(option.dataset.sequence));
    });
}

function selectSequence(sequence) {
    state.selectedSequence = sequence;

    // 更新选中状态
    document.querySelectorAll('.sequence-option').forEach(option => {
        option.classList.toggle('selected', option.dataset.sequence === sequence);
    });

    // 显示AI思考动画，然后显示程序序列
    showProgramSequence(sequence);
}

async function showProgramSequence(playerSequence) {
    const programSeq = getProgramSequence(playerSequence);

    elements.programSequence.style.display = 'block';

    // 显示玩家序列
    elements.playerSequenceDisplay.innerHTML = renderSequenceCoins(playerSequence, 'player');

    // AI思考动画
    const stopThinking = showThinkingAnimation(elements.programSequenceDisplay);
    await delay(1500);
    stopThinking();

    // 显示程序序列
    elements.programSequenceDisplay.innerHTML = renderSequenceCoins(programSeq, 'program');
}

function renderSequenceCoins(sequence, side) {
    return sequence.split('').map(c =>
        `<div class="coin ${c === 'H' ? 'heads' : 'tails'}">${coinToChinese(c)}</div>`
    ).join('');
}

function refreshSeed() {
    state.currentSeed = generateSeed();
    elements.currentSeed.textContent = state.currentSeed;
}

async function startGame() {
    if (!state.selectedSequence) return;

    const programSeq = getProgramSequence(state.selectedSequence);

    // 切换到游戏进行界面
    elements.gameSetup.style.display = 'none';
    elements.programSequence.style.display = 'none';
    elements.gamePlay.style.display = 'block';
    elements.gameResult.style.display = 'none';

    // 初始化计分板
    elements.playerScore.textContent = '0';
    elements.programScore.textContent = '0';
    elements.playerScoreSeq.innerHTML = renderMiniSequence(state.selectedSequence);
    elements.programScoreSeq.innerHTML = renderMiniSequence(programSeq);
    elements.progressText.textContent = `0 / ${state.flipCount.toLocaleString()}`;
    elements.coinTrack.innerHTML = '';

    // 重置动画状态
    resetSkip();
    setAnimating(true);

    // 运行游戏
    const result = runGame(state.currentSeed, state.selectedSequence, programSeq, state.flipCount);
    state.currentGame = result;

    // 播放动画
    await playGameAnimation(result);

    setAnimating(false);

    // 保存结果
    saveGameResult(result);

    // 显示结果
    showGameResult(result);
}

function renderMiniSequence(sequence) {
    return sequence.split('').map(c =>
        `<div class="coin-mini ${c === 'H' ? 'heads' : 'tails'}">${coinToChinese(c)}</div>`
    ).join('');
}

async function playGameAnimation(result) {
    const { coins, winEvents, flipCount } = result;
    const track = elements.coinTrack;

    // 计算轨道能显示多少硬币
    const trackWidth = track.clientWidth;
    const coinWidth = 68; // coin + gap
    const maxCoins = Math.floor(trackWidth / coinWidth);

    let playerScore = 0;
    let programScore = 0;
    let winEventIndex = 0;

    // 创建获胜事件位置集合
    const playerWinPositions = new Set();
    const programWinPositions = new Set();

    winEvents.forEach(event => {
        const positions = [event.position, event.position + 1, event.position + 2];
        if (event.winner === 'player') {
            positions.forEach(p => playerWinPositions.add(p));
        } else {
            positions.forEach(p => programWinPositions.add(p));
        }
    });

    for (let i = 0; i < coins.length; i++) {
        if (shouldSkipAnimation()) break;

        // 创建新硬币
        const coin = document.createElement('div');
        coin.className = 'coin';
        coin.textContent = coinToChinese(coins[i]);
        coin.classList.add(coins[i] === 'H' ? 'heads' : 'tails');
        coin.dataset.index = i;

        // 添加到轨道
        track.appendChild(coin);

        // 翻转动画
        await flipCoin(coin, coins[i]);

        // 移除超出的硬币
        while (track.children.length > maxCoins) {
            track.removeChild(track.firstChild);
        }

        // 检查是否有获胜
        if (winEventIndex < winEvents.length && winEvents[winEventIndex].position + 2 === i) {
            const event = winEvents[winEventIndex];

            // 高亮获胜序列
            const trackCoins = track.querySelectorAll('.coin');
            const highlightIndices = [];
            trackCoins.forEach((c, idx) => {
                const coinIndex = parseInt(c.dataset.index);
                if (coinIndex >= event.position && coinIndex <= event.position + 2) {
                    c.classList.add(`win-${event.winner}`);
                    highlightIndices.push(idx);
                }
            });

            // 更新分数
            if (event.winner === 'player') {
                playerScore++;
                elements.playerScore.textContent = playerScore;
                createFloatingScore(elements.playerScore.parentElement, '+1', 'player');
            } else {
                programScore++;
                elements.programScore.textContent = programScore;
                createFloatingScore(elements.programScore.parentElement, '+1', 'program');
            }

            // 暂停展示
            await delay(getFrameDelay() * 2);

            // 清除高亮
            trackCoins.forEach(c => {
                c.classList.remove('win-player', 'win-program');
            });

            winEventIndex++;
        }

        // 更新进度
        elements.progressText.textContent = `${(i + 1).toLocaleString()} / ${flipCount.toLocaleString()}`;

        await delay(getFrameDelay());
    }

    // 如果跳过了动画，直接显示最终结果
    if (shouldSkipAnimation()) {
        elements.playerScore.textContent = result.playerWins;
        elements.programScore.textContent = result.programWins;
        elements.progressText.textContent = `${flipCount.toLocaleString()} / ${flipCount.toLocaleString()}`;
    }
}

function showGameResult(result) {
    elements.gamePlay.style.display = 'none';
    elements.gameResult.style.display = 'flex';

    elements.finalPlayerScore.textContent = result.playerWins;
    elements.finalProgramScore.textContent = result.programWins;
}

function playAgain() {
    // 保留设置，换新种子
    refreshSeed();

    // 重置界面
    elements.gameSetup.style.display = 'block';
    elements.programSequence.style.display = 'block';
    elements.gamePlay.style.display = 'none';
    elements.gameResult.style.display = 'none';

    // 重新显示程序序列
    if (state.selectedSequence) {
        const programSeq = getProgramSequence(state.selectedSequence);
        elements.playerSequenceDisplay.innerHTML = renderSequenceCoins(state.selectedSequence, 'player');
        elements.programSequenceDisplay.innerHTML = renderSequenceCoins(programSeq, 'program');
    }
}

// ===== 验证页面 =====
function initVerifyPage() {
    // 种子输入验证
    elements.verifySeedInput.addEventListener('input', validateSeedInput);

    // 生成序列
    elements.generateSequenceBtn.addEventListener('click', generateVerifySequence);

    // 搜索
    elements.searchBtn.addEventListener('click', performSearch);
    elements.searchPattern.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
}

function validateSeedInput() {
    const value = elements.verifySeedInput.value.toUpperCase();
    elements.verifySeedInput.value = value;

    if (value.length === 0) {
        elements.verifySeedInput.classList.remove('valid', 'invalid');
        elements.verifyStatus.textContent = '';
    } else if (isValidSeed(value)) {
        elements.verifySeedInput.classList.remove('invalid');
        elements.verifySeedInput.classList.add('valid');
        elements.verifyStatus.textContent = '✓';
    } else {
        elements.verifySeedInput.classList.remove('valid');
        elements.verifySeedInput.classList.add('invalid');
        elements.verifyStatus.textContent = '✗';
    }
}

function generateVerifySequence() {
    const seed = elements.verifySeedInput.value.toUpperCase();
    if (!isValidSeed(seed)) {
        alert('请输入有效的8位十六进制种子');
        return;
    }

    const count = parseInt(elements.verifyCount.value);
    const coins = generateCoinSequence(seed, count);

    state.verifySequence = coins;
    state.verifyHighlights = [];

    // 显示序列
    renderVerifySequence(coins);

    // 显示搜索区域
    elements.searchGroup.style.display = 'flex';
    elements.sequenceViewer.style.display = 'block';
    elements.searchResult.textContent = '';
    elements.searchPattern.value = '';
}

function renderVerifySequence(coins, highlights = []) {
    const content = elements.sequenceContent;
    const highlightSet = new Set(highlights);

    // 虚拟滚动 - 简化版，一次渲染所有但使用DocumentFragment
    const fragment = document.createDocumentFragment();

    coins.forEach((coin, index) => {
        const div = document.createElement('div');
        div.className = `coin-small ${coin === 'H' ? 'heads' : 'tails'}`;
        if (highlightSet.has(index)) {
            div.classList.add('highlight');
        }
        div.textContent = coinToChinese(coin);
        div.title = `#${index + 1}`;
        fragment.appendChild(div);
    });

    content.innerHTML = '';
    content.appendChild(fragment);
}

function performSearch() {
    if (!state.verifySequence) return;

    let pattern = elements.searchPattern.value.trim();
    if (!pattern) return;

    // 支持中文输入
    pattern = pattern
        .replace(/正/g, 'H')
        .replace(/反/g, 'T')
        .toUpperCase();

    // 验证模式
    if (!/^[HT]+$/.test(pattern)) {
        elements.searchResult.textContent = '请输入有效的序列（正/反 或 H/T）';
        return;
    }

    const matches = searchPattern(state.verifySequence, pattern);

    // 高亮所有匹配
    const highlights = [];
    matches.forEach(pos => {
        for (let i = 0; i < pattern.length; i++) {
            highlights.push(pos + i);
        }
    });

    state.verifyHighlights = highlights;
    renderVerifySequence(state.verifySequence, highlights);

    elements.searchResult.textContent = `共找到 ${matches.length} 处匹配`;

    // 滚动到第一个匹配
    if (matches.length > 0) {
        const firstMatch = elements.sequenceContent.children[matches[0]];
        if (firstMatch) {
            firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

// ===== 历史记录页面 =====
function initHistoryPage() {
    elements.clearHistoryBtn.addEventListener('click', () => {
        if (confirm('确定要清空所有历史记录吗？')) {
            clearHistory();
            renderHistoryList();
        }
    });

    elements.goToVerifyBtn.addEventListener('click', () => {
        const record = state.currentHistoryRecord;
        if (record) {
            elements.verifySeedInput.value = record.seed;
            validateSeedInput();
            closeModal('historyDetailModal');
            switchPage('verify');
        }
    });
}

function renderHistoryList() {
    const history = getHistory();

    if (history.length === 0) {
        elements.historyList.style.display = 'none';
        elements.historyEmpty.style.display = 'block';
        return;
    }

    elements.historyList.style.display = 'flex';
    elements.historyEmpty.style.display = 'none';

    elements.historyList.innerHTML = history.map(record => `
    <div class="history-item" data-id="${record.id}">
      <div class="history-item-header">
        <span class="history-time">${formatTimestamp(record.timestamp)}</span>
        <div class="history-scores">
          <span class="player-score">${record.playerWins}</span>
          <span>:</span>
          <span class="program-score">${record.programWins}</span>
        </div>
      </div>
      <div class="history-item-body">
        <div class="history-sequences">
          <div class="history-seq">${renderTinySequence(record.playerSequence, 'player')}</div>
          <span style="color: var(--color-text-light)">vs</span>
          <div class="history-seq">${renderTinySequence(record.programSequence, 'program')}</div>
        </div>
        <div class="history-preview">
          ${record.coinsPreview.split('').map(c =>
        `<div class="coin-tiny ${c === 'H' ? 'heads' : 'tails'}"></div>`
    ).join('')}
        </div>
      </div>
    </div>
  `).join('');

    // 添加点击事件
    document.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', () => {
            const record = getHistoryById(item.dataset.id);
            if (record) {
                showHistoryDetail(record);
            }
        });
    });
}

function renderTinySequence(sequence, side) {
    return sequence.split('').map(c =>
        `<div class="coin-mini ${c === 'H' ? 'heads' : 'tails'}" style="width: 18px; height: 18px; font-size: 0.6rem;">${coinToChinese(c)}</div>`
    ).join('');
}

function showHistoryDetail(record) {
    state.currentHistoryRecord = record;

    // 重新生成完整硬币序列用于显示
    const coins = generateCoinSequence(record.seed, record.flipCount);

    // 构建高亮位置
    const playerHighlights = new Set();
    const programHighlights = new Set();

    record.winEvents.forEach(event => {
        const positions = [event.position, event.position + 1, event.position + 2];
        if (event.winner === 'player') {
            positions.forEach(p => playerHighlights.add(p));
        } else {
            positions.forEach(p => programHighlights.add(p));
        }
    });

    elements.historyDetailBody.innerHTML = `
    <div class="detail-section">
      <div class="detail-info">
        <div class="detail-item">
          <span class="detail-label">时间</span>
          <span class="detail-value">${formatTimestamp(record.timestamp)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">种子</span>
          <span class="detail-value" style="font-family: monospace;">${record.seed}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">投掷次数</span>
          <span class="detail-value">${record.flipCount.toLocaleString()}</span>
        </div>
      </div>
    </div>
    
    <div class="detail-section">
      <div class="detail-sequences">
        <div class="detail-seq-group">
          <span class="side-label player">你的选择</span>
          <div class="sequence-display">${renderSequenceCoins(record.playerSequence, 'player')}</div>
          <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-player);">${record.playerWins} 胜</div>
        </div>
        <div class="detail-seq-group">
          <span class="side-label program">AI 选择</span>
          <div class="sequence-display">${renderSequenceCoins(record.programSequence, 'program')}</div>
          <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-program);">${record.programWins} 胜</div>
        </div>
      </div>
    </div>
    
    <div class="detail-section">
      <h4>硬币序列</h4>
      <div class="detail-coins-viewer">
        <div class="detail-coins-content">
          ${coins.map((coin, i) => {
        let classes = `coin-small ${coin === 'H' ? 'heads' : 'tails'}`;
        if (playerHighlights.has(i)) classes += ' win-player';
        if (programHighlights.has(i)) classes += ' win-program';
        return `<div class="${classes}" title="#${i + 1}">${coinToChinese(coin)}</div>`;
    }).join('')}
        </div>
      </div>
    </div>
  `;

    showModal('historyDetailModal');
}

// ===== 弹窗 =====
function initModals() {
    // 关闭按钮
    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });

    // 点击背景关闭
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}
