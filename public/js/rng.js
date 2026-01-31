/**
 * Mulberry32 随机数生成器
 * 基于32位种子的确定性伪随机数生成器
 */

/**
 * 创建 Mulberry32 随机数生成器
 * @param {number} seed - 32位整数种子
 * @returns {function} 返回0到1之间随机数的函数
 */
export function mulberry32(seed) {
    return function () {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

/**
 * 生成8位十六进制随机种子
 * @returns {string} 8位十六进制字符串（大写）
 */
export function generateSeed() {
    const randomValue = Math.floor(Math.random() * 0xFFFFFFFF);
    return randomValue.toString(16).toUpperCase().padStart(8, '0');
}

/**
 * 解析十六进制种子为数字
 * @param {string} hexSeed - 8位十六进制字符串
 * @returns {number} 32位整数
 */
export function parseSeed(hexSeed) {
    return parseInt(hexSeed, 16) >>> 0; // 确保是无符号32位整数
}

/**
 * 验证种子格式是否有效
 * @param {string} seed - 待验证的种子字符串
 * @returns {boolean} 是否有效
 */
export function isValidSeed(seed) {
    if (typeof seed !== 'string') return false;
    if (seed.length !== 8) return false;
    return /^[0-9A-Fa-f]{8}$/.test(seed);
}

/**
 * 生成硬币序列
 * @param {string} hexSeed - 8位十六进制种子
 * @param {number} count - 投掷次数
 * @returns {string[]} 硬币序列数组，每个元素为 'H'(正面) 或 'T'(反面)
 */
export function generateCoinSequence(hexSeed, count) {
    const numericSeed = parseSeed(hexSeed);
    const rng = mulberry32(numericSeed);
    const sequence = [];

    for (let i = 0; i < count; i++) {
        sequence.push(rng() < 0.5 ? 'H' : 'T');
    }

    return sequence;
}

/**
 * 硬币值转换为中文显示
 * @param {string} coin - 'H' 或 'T'
 * @returns {string} '正' 或 '反'
 */
export function coinToChinese(coin) {
    return coin === 'H' ? '正' : '反';
}

/**
 * 中文转换为硬币值
 * @param {string} chinese - '正' 或 '反'
 * @returns {string} 'H' 或 'T'
 */
export function chineseToCoin(chinese) {
    return chinese === '正' ? 'H' : 'T';
}

/**
 * 序列转换为中文显示
 * @param {string} sequence - 如 'HHT'
 * @returns {string} 如 '正正反'
 */
export function sequenceToChinese(sequence) {
    return sequence.split('').map(coinToChinese).join('');
}
