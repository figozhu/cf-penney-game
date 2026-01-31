/**
 * 动画控制模块
 */

// 动画速度配置（毫秒）
const BASE_SPEED = 300; // 基准速度：每个硬币300ms

export const SPEED_MULTIPLIERS = {
    1: 1,      // 1倍速
    2: 0.5,    // 2倍速
    3: 0.33    // 3倍速
};

let currentSpeed = 1;
let isAnimating = false;
let shouldSkip = false;
let animationResolve = null;

/**
 * 设置动画速度
 * @param {number} speed - 1, 2, 或 3
 */
export function setSpeed(speed) {
    if (SPEED_MULTIPLIERS[speed] !== undefined) {
        currentSpeed = speed;
    }
}

/**
 * 获取当前速度
 * @returns {number}
 */
export function getSpeed() {
    return currentSpeed;
}

/**
 * 获取当前帧延迟时间
 * @returns {number} 延迟毫秒数
 */
export function getFrameDelay() {
    return BASE_SPEED * SPEED_MULTIPLIERS[currentSpeed];
}

/**
 * 跳过当前动画
 */
export function skipAnimation() {
    shouldSkip = true;
    if (animationResolve) {
        animationResolve();
    }
}

/**
 * 检查是否应该跳过
 * @returns {boolean}
 */
export function shouldSkipAnimation() {
    return shouldSkip;
}

/**
 * 重置跳过状态
 */
export function resetSkip() {
    shouldSkip = false;
}

/**
 * 延迟函数（可被跳过）
 * @param {number} ms - 延迟毫秒数
 * @returns {Promise<void>}
 */
export function delay(ms) {
    if (shouldSkip) return Promise.resolve();

    return new Promise(resolve => {
        animationResolve = resolve;
        setTimeout(() => {
            animationResolve = null;
            resolve();
        }, ms);
    });
}

/**
 * 设置动画状态
 * @param {boolean} state
 */
export function setAnimating(state) {
    isAnimating = state;
}

/**
 * 检查是否正在动画
 * @returns {boolean}
 */
export function isCurrentlyAnimating() {
    return isAnimating;
}

/**
 * 创建硬币翻转动画
 * @param {HTMLElement} coinElement - 硬币DOM元素
 * @param {string} side - 'H' 或 'T'
 * @returns {Promise<void>}
 */
export async function flipCoin(coinElement, side) {
    if (shouldSkip) {
        coinElement.classList.remove('heads', 'tails', 'flipping');
        coinElement.classList.add(side === 'H' ? 'heads' : 'tails');
        return;
    }

    coinElement.classList.add('flipping');

    await delay(getFrameDelay() / 2);

    coinElement.classList.remove('heads', 'tails');
    coinElement.classList.add(side === 'H' ? 'heads' : 'tails');

    await delay(getFrameDelay() / 2);

    coinElement.classList.remove('flipping');
}

/**
 * 创建分数飘字动画
 * @param {HTMLElement} container - 容器元素
 * @param {string} text - 显示文本（如 "+1"）
 * @param {string} color - 颜色类名（'player' 或 'program'）
 */
export function createFloatingScore(container, text, color) {
    const floater = document.createElement('div');
    floater.className = `floating-score ${color}`;
    floater.textContent = text;
    container.appendChild(floater);

    // 动画完成后移除
    setTimeout(() => {
        floater.remove();
    }, 1000);
}

/**
 * 高亮获胜序列
 * @param {NodeList|Array} coinElements - 硬币元素列表
 * @param {number[]} indices - 要高亮的索引
 * @param {string} winner - 'player' 或 'program'
 */
export function highlightWinSequence(coinElements, indices, winner) {
    indices.forEach(index => {
        if (coinElements[index]) {
            coinElements[index].classList.add(`win-${winner}`);
        }
    });
}

/**
 * 清除所有高亮
 * @param {NodeList|Array} coinElements - 硬币元素列表
 */
export function clearHighlights(coinElements) {
    coinElements.forEach(coin => {
        coin.classList.remove('win-player', 'win-program');
    });
}

/**
 * AI思考动画
 * @param {HTMLElement} container - 显示容器
 * @returns {function} 停止动画的函数
 */
export function showThinkingAnimation(container) {
    container.innerHTML = `
    <div class="thinking-animation">
      <span class="thinking-text">AI 思考中</span>
      <span class="thinking-dots">
        <span>.</span><span>.</span><span>.</span>
      </span>
    </div>
  `;
    container.classList.add('thinking');

    return () => {
        container.classList.remove('thinking');
    };
}
