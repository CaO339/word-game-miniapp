/**
 * 收藏单词管理器
 * 负责管理用户收藏的单词
 */

const STORAGE_KEY = 'wm_collected_words';

class CollectionManager {
  constructor() {
    this._cache = null;
  }

  /**
   * 获取收藏单词列表（带时间戳）
   * @returns {Array} 收藏的单词对象数组 [{wordId, collectTime}]
   */
  getCollectedWords() {
    if (this._cache !== null) {
      return this._cache;
    }
    
    try {
      const data = wx.getStorageSync(STORAGE_KEY);
      this._cache = data || [];
      return this._cache;
    } catch (e) {
      console.error('[收藏管理器] 读取收藏列表失败:', e);
      this._cache = [];
      return this._cache;
    }
  }

  /**
   * 获取收藏单词ID列表（兼容旧格式）
   * @returns {Array} 收藏的单词ID数组
   */
  getCollectedWordIds() {
    const words = this.getCollectedWords();
    return words.map(item => item.wordId || item);
  }

  /**
   * 保存收藏单词列表
   * @param {Array} words 收藏的单词对象数组
   */
  _saveCollectedWords(words) {
    this._cache = words;
    try {
      wx.setStorageSync(STORAGE_KEY, words);
    } catch (e) {
      console.error('[收藏管理器] 保存收藏列表失败:', e);
    }
  }

  /**
   * 检查单词是否已收藏
   * @param {number} wordId 单词ID
   * @returns {boolean} 是否已收藏
   */
  isCollected(wordId) {
    const collectedWords = this.getCollectedWords();
    return collectedWords.some(item => (item.wordId || item) === wordId);
  }

  /**
   * 收藏单词
   * @param {number} wordId 单词ID
   * @returns {boolean} 是否收藏成功
   */
  collectWord(wordId) {
    if (this.isCollected(wordId)) {
      return false;
    }
    
    const collectedWords = this.getCollectedWords();
    collectedWords.push({
      wordId: wordId,
      collectTime: Date.now()
    });
    this._saveCollectedWords(collectedWords);
    return true;
  }

  /**
   * 取消收藏
   * @param {number} wordId 单词ID
   * @returns {boolean} 是否取消成功
   */
  uncollectWord(wordId) {
    if (!this.isCollected(wordId)) {
      return false;
    }
    
    const collectedWords = this.getCollectedWords();
    const filtered = collectedWords.filter(item => (item.wordId || item) !== wordId);
    this._saveCollectedWords(filtered);
    return true;
  }

  /**
   * 切换收藏状态
   * @param {number} wordId 单词ID
   * @returns {boolean} true-收藏成功, false-取消成功
   */
  toggleCollect(wordId) {
    if (this.isCollected(wordId)) {
      this.uncollectWord(wordId);
      return false;
    } else {
      this.collectWord(wordId);
      return true;
    }
  }

  /**
   * 获取收藏单词数量
   * @returns {number} 收藏数量
   */
  getCollectionCount() {
    return this.getCollectedWords().length;
  }

  /**
   * 清空收藏
   */
  clearAll() {
    this._saveCollectedWords([]);
  }

  /**
   * 获取收藏单词详情（包含时间戳）
   * @returns {Array} [{wordId, collectTime}]
   */
  getCollectedWithTime() {
    const words = this.getCollectedWords();
    return words.map(item => ({
      wordId: item.wordId || item,
      collectTime: item.collectTime || 0
    }));
  }
}

const collection = new CollectionManager();
module.exports = collection;