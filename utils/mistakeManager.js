/**
 * 错题本管理器
 * 负责管理用户标记为"不认识"的单词
 */

const STORAGE_KEY = 'wm_mistake_words';

class MistakeManager {
  constructor() {
    this._cache = null;
  }

  /**
   * 获取错题单词列表（带详情）
   * @returns {Array} 错题单词对象数组 [{wordId, wrongCount, lastWrongTime}]
   */
  getMistakeWords() {
    if (this._cache !== null) {
      return this._cache;
    }
    
    try {
      const data = wx.getStorageSync(STORAGE_KEY);
      this._cache = data || [];
      return this._cache;
    } catch (e) {
      console.error('[错题本管理器] 读取错题列表失败:', e);
      this._cache = [];
      return this._cache;
    }
  }

  /**
   * 获取错题单词ID列表（兼容旧格式）
   * @returns {Array} 错题单词ID数组
   */
  getMistakeWordIds() {
    const words = this.getMistakeWords();
    return words.map(item => item.wordId || item);
  }

  /**
   * 保存错题单词列表
   * @param {Array} words 错题单词对象数组
   */
  _saveMistakeWords(words) {
    this._cache = words;
    try {
      wx.setStorageSync(STORAGE_KEY, words);
    } catch (e) {
      console.error('[错题本管理器] 保存错题列表失败:', e);
    }
  }

  /**
   * 检查单词是否在错题本中
   * @param {number} wordId 单词ID
   * @returns {boolean} 是否在错题本中
   */
  isMistake(wordId) {
    const mistakeWords = this.getMistakeWords();
    return mistakeWords.some(item => (item.wordId || item) === wordId);
  }

  /**
   * 添加错题（增加错误次数）
   * @param {number} wordId 单词ID
   * @returns {boolean} 是否添加成功
   */
  addMistake(wordId) {
    const mistakeWords = this.getMistakeWords();
    const existing = mistakeWords.find(item => (item.wordId || item) === wordId);
    
    if (existing) {
      existing.wrongCount = (existing.wrongCount || 1) + 1;
      existing.lastWrongTime = Date.now();
    } else {
      mistakeWords.push({
        wordId: wordId,
        wrongCount: 1,
        lastWrongTime: Date.now()
      });
    }
    
    this._saveMistakeWords(mistakeWords);
    return true;
  }

  /**
   * 移除错题（从错题本中移除）
   * @param {number} wordId 单词ID
   * @returns {boolean} 是否移除成功
   */
  removeMistake(wordId) {
    if (!this.isMistake(wordId)) {
      return false;
    }
    
    const mistakeWords = this.getMistakeWords();
    const filtered = mistakeWords.filter(item => (item.wordId || item) !== wordId);
    this._saveMistakeWords(filtered);
    return true;
  }

  /**
   * 获取错题数量
   * @returns {number} 错题数量
   */
  getMistakeCount() {
    return this.getMistakeWords().length;
  }

  /**
   * 清空错题本
   */
  clearAll() {
    this._saveMistakeWords([]);
  }

  /**
   * 获取错题单词详情（包含错误次数和时间戳）
   * @returns {Array} [{wordId, wrongCount, lastWrongTime}]
   */
  getMistakesWithDetail() {
    const words = this.getMistakeWords();
    return words.map(item => ({
      wordId: item.wordId || item,
      wrongCount: item.wrongCount || 1,
      lastWrongTime: item.lastWrongTime || 0
    }));
  }

  /**
   * 获取单词的错误次数
   * @param {number} wordId 单词ID
   * @returns {number} 错误次数
   */
  getWrongCount(wordId) {
    const words = this.getMistakeWords();
    const item = words.find(item => (item.wordId || item) === wordId);
    return item ? (item.wrongCount || 1) : 0;
  }
}

const mistakes = new MistakeManager();
module.exports = mistakes;