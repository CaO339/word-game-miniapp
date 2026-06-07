// 词库管理器 - 负责加载和管理单词数据
const cet4Data = require('../data/cet4.js');

// 内置基础单词（备用）
const builtinWords = [
  { id: 1001, english: 'apple', chinese: '苹果' },
  { id: 1002, english: 'book', chinese: '书' },
  { id: 1003, english: 'computer', chinese: '电脑' }
];

/**
 * 词库管理器类
 */
class WordManager {
  constructor() {
    // 当前词库
    this.currentWordList = [];
    // 已访问过的单词ID列表
    this.visitedIds = [];
    // 初始化词库
    this.initWordList();
  }

  /**
   * 初始化词库 - 优先使用CET4词库
   */
  initWordList() {
    if (cet4Data && cet4Data.length > 0) {
      // 使用CET4词库
      this.currentWordList = cet4Data;
    } else {
      // 使用内置基础单词
      this.currentWordList = builtinWords;
    }
  }

  /**
   * 获取词库总单词数
   */
  getTotalCount() {
    return this.currentWordList.length;
  }

  /**
   * 获取所有单词列表
   * @returns {Array} - 完整单词列表
   */
  getAllWords() {
    return this.currentWordList;
  }

  /**
   * 获取已学习单词数
   */
  getLearnedCount() {
    return this.visitedIds.length;
  }

  /**
   * 获取随机单词（不重复）
   * @returns {Object} 随机单词对象
   */
  getRandomWord() {
    const total = this.currentWordList.length;
    
    // 如果所有单词都已学习过，重置已访问列表
    if (this.visitedIds.length >= total) {
      this.visitedIds = [];
    }

    // 过滤出未访问的单词
    const unvisitedWords = this.currentWordList.filter(
      word => !this.visitedIds.includes(word.id)
    );

    // 如果没有未访问的单词，使用全部单词
    const pool = unvisitedWords.length > 0 ? unvisitedWords : this.currentWordList;
    
    // 随机选择
    const randomIndex = Math.floor(Math.random() * pool.length);
    const selectedWord = pool[randomIndex];

    // 标记为已访问
    this.visitedIds.push(selectedWord.id);

    return selectedWord;
  }

  /**
   * 获取下一个随机单词（用于切换到下一题）
   * @returns {Object} 随机单词对象
   */
  getNextWord() {
    return this.getRandomWord();
  }

  /**
   * 重置学习进度
   */
  reset() {
    this.visitedIds = [];
  }

  /**
   * 获取单词名称
   */
  getWordListName() {
    if (this.currentWordList === cet4Data) {
      return 'CET-4 词汇';
    }
    return '基础词汇';
  }

  /**
   * 根据ID获取单词详情
   * @param {number} wordId 单词ID
   * @returns {Object|null} 单词对象，如果未找到返回null
   */
  getWordById(wordId) {
    return this.currentWordList.find(word => word.id === wordId) || null;
  }
}

// 导出单例实例
module.exports = {
  WordManager: WordManager,
  getWordManager: function() {
    if (!global.wordManagerInstance) {
      global.wordManagerInstance = new WordManager();
    }
    return global.wordManagerInstance;
  }
};
