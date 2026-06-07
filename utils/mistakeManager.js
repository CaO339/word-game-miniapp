/**
 * 错题本管理器
 * 负责管理用户标记为"不认识"的单词
 */

const STORAGE_KEY = 'wm_mistake_words';

class MistakeManager {
  constructor() {
    // 内存缓存
    this._cache = null;
  }

  /**
   * 获取错题单词ID列表
   * @returns {Array} 错题单词ID数组
   */
  getMistakeWordIds() {
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
   * 保存错题单词ID列表
   * @param {Array} wordIds 错题单词ID数组
   */
  _saveMistakeWordIds(wordIds) {
    this._cache = wordIds;
    try {
      wx.setStorageSync(STORAGE_KEY, wordIds);
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
    const mistakeIds = this.getMistakeWordIds();
    return mistakeIds.includes(wordId);
  }

  /**
   * 添加错题
   * @param {number} wordId 单词ID
   * @returns {boolean} 是否添加成功
   */
  addMistake(wordId) {
    if (this.isMistake(wordId)) {
      return false; // 已经在错题本中了
    }
    
    const mistakeIds = this.getMistakeWordIds();
    mistakeIds.push(wordId);
    this._saveMistakeWordIds(mistakeIds);
    return true;
  }

  /**
   * 移除错题（从错题本中移除）
   * @param {number} wordId 单词ID
   * @returns {boolean} 是否移除成功
   */
  removeMistake(wordId) {
    if (!this.isMistake(wordId)) {
      return false; // 不在错题本中
    }
    
    const mistakeIds = this.getMistakeWordIds();
    const index = mistakeIds.indexOf(wordId);
    if (index > -1) {
      mistakeIds.splice(index, 1);
      this._saveMistakeWordIds(mistakeIds);
      return true;
    }
    return false;
  }

  /**
   * 获取错题数量
   * @returns {number} 错题数量
   */
  getMistakeCount() {
    return this.getMistakeWordIds().length;
  }

  /**
   * 清空错题本
   */
  clearAll() {
    this._saveMistakeWordIds([]);
  }
}

// 导出单例
const mistakes = new MistakeManager();
module.exports = mistakes;
