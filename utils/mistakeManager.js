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
   * 清理脏数据 - 过滤掉 null、undefined、空对象等非法数据
   * @param {Array} data 原始数据
   * @returns {Array} 清理后的数据
   */
  _cleanDirtyData(data) {
    if (!Array.isArray(data)) {
      console.log('[MistakeManager] _cleanDirtyData - 数据不是数组，返回空数组');
      return [];
    }
    
    console.log('[MistakeManager] _cleanDirtyData - 原始数据长度:', data.length);
    console.log('[MistakeManager] _cleanDirtyData - 原始数据:', JSON.stringify(data));
    
    // 找出脏数据
    const dirtyItems = [];
    const cleanData = data.filter((item, index) => {
      // 检查是否为 null
      if (item === null) {
        dirtyItems.push({ index, value: null, reason: 'null' });
        return false;
      }
      
      // 检查是否为 undefined
      if (item === undefined) {
        dirtyItems.push({ index, value: undefined, reason: 'undefined' });
        return false;
      }
      
      // 检查是否为空对象
      if (typeof item === 'object' && Object.keys(item).length === 0) {
        dirtyItems.push({ index, value: {}, reason: '空对象' });
        return false;
      }
      
      // 检查是否有有效ID
      const wordId = item.wordId || item;
      if (wordId === null || wordId === undefined || wordId === '') {
        dirtyItems.push({ index, value: item, reason: '无效ID' });
        return false;
      }
      
      return true;
    });
    
    // 输出脏数据信息
    if (dirtyItems.length > 0) {
      console.warn('[MistakeManager] _cleanDirtyData - 发现脏数据:', dirtyItems.length, '条');
      console.warn('[MistakeManager] _cleanDirtyData - 脏数据详情:', JSON.stringify(dirtyItems));
    }
    
    console.log('[MistakeManager] _cleanDirtyData - 清理后数据长度:', cleanData.length);
    
    return cleanData;
  }

  /**
   * 获取错题单词列表（带详情）
   * @returns {Array} 错题单词对象数组 [{wordId, wrongCount, lastWrongTime}]
   */
  getMistakeWords() {
    console.log('[MistakeManager] getMistakeWords - _cache状态:', this._cache !== null ? '有缓存' : '无缓存');
    
    if (this._cache !== null) {
      console.log('[MistakeManager] getMistakeWords - 使用缓存，长度:', this._cache.length);
      // 清理缓存中的脏数据
      this._cache = this._cleanDirtyData(this._cache);
      return this._cache;
    }
    
    try {
      const data = wx.getStorageSync(STORAGE_KEY);
      console.log('[MistakeManager] getMistakeWords - Storage Key:', STORAGE_KEY);
      console.log('[MistakeManager] getMistakeWords - Storage数据类型:', typeof data);
      console.log('[MistakeManager] getMistakeWords - Storage数据长度:', data ? data.length : 0);
      
      // 清理脏数据
      const cleanData = this._cleanDirtyData(data || []);
      
      // 如果清理后有变化，保存清理后的数据
      if (data && cleanData.length !== data.length) {
        console.log('[MistakeManager] getMistakeWords - 自动保存清理后的数据');
        this._saveMistakeWords(cleanData);
      } else {
        this._cache = cleanData;
      }
      
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
    console.log('[MistakeManager] getMistakeWordIds - 原始数据长度:', words.length);
    
    // 过滤空值并提取ID
    const ids = words
      .filter(item => item !== null && item !== undefined)  // 过滤 null 和 undefined
      .map(item => {
        const id = item.wordId || item;
        console.log('[MistakeManager] getMistakeWordIds - 转换:', JSON.stringify(item), '→', id);
        return id;
      })
      .filter(id => id !== null && id !== undefined && id !== '');  // 过滤无效ID
    
    console.log('[MistakeManager] getMistakeWordIds - 转换后ID数组长度:', ids.length);
    console.log('[MistakeManager] getMistakeWordIds - 转换后ID数组:', JSON.stringify(ids.slice(0, 5)));
    
    return ids;
  }

  /**
   * 保存错题单词列表
   * @param {Array} words 错题单词对象数组
   */
  _saveMistakeWords(words) {
    // 保存前清理脏数据
    const cleanWords = this._cleanDirtyData(words);
    this._cache = cleanWords;
    try {
      wx.setStorageSync(STORAGE_KEY, cleanWords);
      console.log('[MistakeManager] _saveMistakeWords - 保存成功，长度:', cleanWords.length);
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
    if (wordId === null || wordId === undefined) {
      return false;
    }
    const mistakeWords = this.getMistakeWords();
    return mistakeWords.some(item => item && (item.wordId || item) === wordId);
  }

  /**
   * 添加错题（增加错误次数）
   * @param {number} wordId 单词ID
   * @returns {boolean} 是否添加成功
   */
  addMistake(wordId) {
    // 参数验证
    if (wordId === null || wordId === undefined || wordId === '') {
      console.error('[MistakeManager] addMistake - 无效的wordId:', wordId);
      return false;
    }
    
    const mistakeWords = this.getMistakeWords();
    const existing = mistakeWords.find(item => item && (item.wordId || item) === wordId);
    
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
    if (wordId === null || wordId === undefined) {
      return false;
    }
    if (!this.isMistake(wordId)) {
      return false;
    }
    
    const mistakeWords = this.getMistakeWords();
    const filtered = mistakeWords.filter(item => item && (item.wordId || item) !== wordId);
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
    return words
      .filter(item => item !== null && item !== undefined)  // 过滤空值
      .map(item => ({
        wordId: item.wordId || item,
        wrongCount: item.wrongCount || 1,
        lastWrongTime: item.lastWrongTime || 0
      }))
      .filter(item => item.wordId !== null && item.wordId !== undefined);  // 过滤无效ID
  }

  /**
   * 获取单词的错误次数
   * @param {number} wordId 单词ID
   * @returns {number} 错误次数
   */
  getWrongCount(wordId) {
    if (wordId === null || wordId === undefined) {
      return 0;
    }
    const words = this.getMistakeWords();
    const item = words.find(item => item && (item.wordId || item) === wordId);
    return item ? (item.wrongCount || 1) : 0;
  }
}

const mistakes = new MistakeManager();
module.exports = mistakes;