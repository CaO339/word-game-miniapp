/**
 * 收藏单词管理器
 * 负责管理用户收藏的单词
 */

const STORAGE_KEY = 'wm_collected_words';

class CollectionManager {
  constructor() {
    // 内存缓存
    this._cache = null;
  }

  /**
   * 获取收藏单词ID列表
   * @returns {Array} 收藏的单词ID数组
   */
  getCollectedWordIds() {
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
   * 保存收藏单词ID列表
   * @param {Array} wordIds 收藏的单词ID数组
   */
  _saveCollectedWordIds(wordIds) {
    this._cache = wordIds;
    try {
      wx.setStorageSync(STORAGE_KEY, wordIds);
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
    const collectedIds = this.getCollectedWordIds();
    return collectedIds.includes(wordId);
  }

  /**
   * 收藏单词
   * @param {number} wordId 单词ID
   * @returns {boolean} 是否收藏成功
   */
  collectWord(wordId) {
    if (this.isCollected(wordId)) {
      return false; // 已经收藏了
    }
    
    const collectedIds = this.getCollectedWordIds();
    collectedIds.push(wordId);
    this._saveCollectedWordIds(collectedIds);
    return true;
  }

  /**
   * 取消收藏
   * @param {number} wordId 单词ID
   * @returns {boolean} 是否取消成功
   */
  uncollectWord(wordId) {
    if (!this.isCollected(wordId)) {
      return false; // 没有收藏
    }
    
    const collectedIds = this.getCollectedWordIds();
    const index = collectedIds.indexOf(wordId);
    if (index > -1) {
      collectedIds.splice(index, 1);
      this._saveCollectedWordIds(collectedIds);
      return true;
    }
    return false;
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
    return this.getCollectedWordIds().length;
  }

  /**
   * 清空收藏
   */
  clearAll() {
    this._saveCollectedWordIds([]);
  }
}

// 导出单例
const collection = new CollectionManager();
module.exports = collection;
