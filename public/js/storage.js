/**
 * 本地存储管理模块
 */

const HISTORY_KEY = 'penney_game_history';
const FIRST_VISIT_KEY = 'penney_game_first_visit';
const MAX_HISTORY_COUNT = 10;

/**
 * 保存游戏结果到历史记录
 * @param {Object} gameResult - 游戏结果对象
 */
export function saveGameResult(gameResult) {
    const history = getHistory();

    // 为了节省存储空间，不保存完整的硬币序列
    // 只保存必要的信息用于列表显示
    const recordToSave = {
        id: Date.now().toString(),
        seed: gameResult.seed,
        playerSequence: gameResult.playerSequence,
        programSequence: gameResult.programSequence,
        flipCount: gameResult.flipCount,
        playerWins: gameResult.playerWins,
        programWins: gameResult.programWins,
        winEvents: gameResult.winEvents,
        timestamp: gameResult.timestamp,
        // 保存前20个硬币用于预览
        coinsPreview: gameResult.coins.slice(0, 20).join('')
    };

    // 添加到开头
    history.unshift(recordToSave);

    // 限制数量
    if (history.length > MAX_HISTORY_COUNT) {
        history.pop();
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

/**
 * 获取历史记录列表
 * @returns {Array} 历史记录数组
 */
export function getHistory() {
    try {
        const data = localStorage.getItem(HISTORY_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('读取历史记录失败:', e);
        return [];
    }
}

/**
 * 根据ID获取历史记录详情
 * @param {string} id - 记录ID
 * @returns {Object|null} 历史记录对象
 */
export function getHistoryById(id) {
    const history = getHistory();
    return history.find(record => record.id === id) || null;
}

/**
 * 清空所有历史记录
 */
export function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
}

/**
 * 检查是否是首次访问
 * @returns {boolean}
 */
export function isFirstVisit() {
    return localStorage.getItem(FIRST_VISIT_KEY) !== 'false';
}

/**
 * 标记已访问过
 */
export function markVisited() {
    localStorage.setItem(FIRST_VISIT_KEY, 'false');
}

/**
 * 格式化时间戳为可读字符串
 * @param {number} timestamp - 时间戳
 * @returns {string} 格式化的时间字符串
 */
export function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
}
