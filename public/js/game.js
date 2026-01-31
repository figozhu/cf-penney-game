/**
 * Penney's Game 核心游戏逻辑
 */

import { generateCoinSequence } from './rng.js';

/**
 * 程序策略映射表
 * 玩家选择 -> 程序最优应对
 */
export const STRATEGY_MAP = {
    'HHH': 'THH',
    'HHT': 'THH',
    'HTH': 'HHT',
    'HTT': 'HHT',
    'THH': 'TTH',
    'THT': 'TTH',
    'TTH': 'HTT',
    'TTT': 'HTT'
};

/**
 * 所有可能的玩家序列选项
 */
export const PLAYER_SEQUENCES = ['HHH', 'HHT', 'HTH', 'HTT', 'THH', 'THT', 'TTH', 'TTT'];

/**
 * 投掷次数选项
 */
export const FLIP_COUNT_OPTIONS = [1000, 5000, 10000];
export const DEFAULT_FLIP_COUNT = 5000;

/**
 * 获取程序应对序列
 * @param {string} playerSequence - 玩家选择的序列
 * @returns {string} 程序选择的序列
 */
export function getProgramSequence(playerSequence) {
    return STRATEGY_MAP[playerSequence] || null;
}

/**
 * 运行游戏模拟
 * @param {string} seed - 8位十六进制种子
 * @param {string} playerSequence - 玩家序列（如 'HHT'）
 * @param {string} programSequence - 程序序列（如 'THH'）
 * @param {number} flipCount - 投掷次数
 * @returns {GameResult} 游戏结果
 */
export function runGame(seed, playerSequence, programSequence, flipCount) {
    const coins = generateCoinSequence(seed, flipCount);

    let playerWins = 0;
    let programWins = 0;
    const winEvents = []; // { position, winner: 'player' | 'program' }

    let current = '';

    for (let i = 0; i < coins.length; i++) {
        current += coins[i];

        // 保持最近3个硬币
        if (current.length > 3) {
            current = current.slice(-3);
        }

        // 检查是否有人获胜
        if (current.length === 3) {
            if (current === playerSequence) {
                playerWins++;
                winEvents.push({ position: i - 2, winner: 'player' });
                current = ''; // 重置，从下一个硬币开始新一轮
            } else if (current === programSequence) {
                programWins++;
                winEvents.push({ position: i - 2, winner: 'program' });
                current = ''; // 重置，从下一个硬币开始新一轮
            }
        }
    }

    return {
        seed,
        playerSequence,
        programSequence,
        flipCount,
        coins,
        playerWins,
        programWins,
        winEvents,
        timestamp: Date.now()
    };
}

/**
 * 搜索序列在硬币序列中的所有出现位置
 * @param {string[]} coins - 硬币序列数组
 * @param {string} pattern - 要搜索的模式（如 'HHT'）
 * @returns {number[]} 匹配位置数组（每个元素是匹配开始的索引）
 */
export function searchPattern(coins, pattern) {
    const matches = [];
    const patternLength = pattern.length;

    for (let i = 0; i <= coins.length - patternLength; i++) {
        let match = true;
        for (let j = 0; j < patternLength; j++) {
            if (coins[i + j] !== pattern[j]) {
                match = false;
                break;
            }
        }
        if (match) {
            matches.push(i);
        }
    }

    return matches;
}

/**
 * @typedef {Object} GameResult
 * @property {string} seed - 使用的种子
 * @property {string} playerSequence - 玩家序列
 * @property {string} programSequence - 程序序列
 * @property {number} flipCount - 投掷次数
 * @property {string[]} coins - 完整硬币序列
 * @property {number} playerWins - 玩家获胜次数
 * @property {number} programWins - 程序获胜次数
 * @property {Array<{position: number, winner: string}>} winEvents - 获胜事件列表
 * @property {number} timestamp - 时间戳
 */
