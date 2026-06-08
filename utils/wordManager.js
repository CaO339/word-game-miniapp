// 词库管理器 - 负责加载和管理单词数据
const cet4Data = require('../data/cet4_converted.js');

// 内置基础单词（备用）
const builtinWords = [
  { id: 1001, english: 'apple', chinese: '苹果' },
  { id: 1002, english: 'book', chinese: '书' },
  { id: 1003, english: 'computer', chinese: '电脑' }
];

/**
 * 词库管理器类
 * 
 * 抽词算法：
 * 1. 第一阶段：优先抽取未学习单词
 *    - 从词库中排除已学习的单词
 *    - 确保每个单词至少出现一次
 * 2. 第二阶段：全部学完后，进入随机复习模式
 *    - 从全部单词中随机抽取
 *    - 支持艾宾浩斯复习系统的优先级
 */
class WordManager {
  constructor() {
    // 当前词库
    this.currentWordList = [];
    // 当前学习会话中已访问过的单词ID列表（内存缓存，仅用于去重）
    this.sessionVisitedIds = [];
    // 是否已完成第一阶段学习
    this._isFirstPhaseComplete = false;
    // 初始化词库
    this.initWordList();
  }

  /**
   * 初始化词库 - 优先使用CET4词库
   */
  initWordList() {
    console.log('词库文件: ../data/cet4_converted.js');
    console.log('原始词库长度:', cet4Data.length);
    if (cet4Data && cet4Data.length > 0) {
      // 使用CET4词库
      this.currentWordList = cet4Data;
    } else {
      // 使用内置基础单词
      this.currentWordList = builtinWords;
    }
    console.log('当前词库长度:', this.currentWordList.length);
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
   * 从Storage获取已学习的单词ID列表
   * @returns {Array} 已学习单词ID数组
   */
  _getLearnedWordIds() {
    try {
      const record = wx.getStorageSync('wm_learning_record');
      if (record && record.learnedWordIds) {
        return record.learnedWordIds;
      }
    } catch (e) {
      console.error('获取已学习单词失败:', e);
    }
    return [];
  }

  /**
   * 检查是否已完成第一阶段（所有单词都学习过）
   * @returns {boolean}
   */
  isFirstPhaseComplete() {
    const learnedIds = this._getLearnedWordIds();
    const total = this.currentWordList.length;
    
    // 所有单词都已学习
    if (learnedIds.length >= total) {
      this._isFirstPhaseComplete = true;
      return true;
    }
    
    // 检查是否词库中所有单词都已学习
    const allLearned = this.currentWordList.every(word => 
      learnedIds.includes(word.id)
    );
    
    this._isFirstPhaseComplete = allLearned;
    return allLearned;
  }

  /**
   * 获取学习进度信息
   * @returns {Object} { learnedCount, totalCount, remainingCount, isComplete }
   */
  getStudyProgress() {
    const learnedIds = this._getLearnedWordIds();
    const total = this.currentWordList.length;
    const learnedCount = learnedIds.length;
    
    return {
      learnedCount: learnedCount,
      totalCount: total,
      remainingCount: total - learnedCount,
      isComplete: learnedCount >= total,
      isFirstPhase: learnedCount < total
    };
  }

  /**
   * 获取已学习单词数
   */
  getLearnedCount() {
    return this._getLearnedWordIds().length;
  }

  /**
   * 获取未学习单词列表
   * @returns {Array} 未学习的单词数组
   */
  _getUnlearnedWords() {
    const learnedIds = this._getLearnedWordIds();
    return this.currentWordList.filter(word => !learnedIds.includes(word.id));
  }

  /**
   * 获取下一个学习单词（优先未学习单词）
   * @returns {Object} 单词对象
   */
  getNextStudyWord() {
    const learnedIds = this._getLearnedWordIds();
    const total = this.currentWordList.length;
    
    // 第一阶段：优先从未学习单词中抽取
    if (learnedIds.length < total) {
      const unlearnedWords = this._getUnlearnedWords();
      
      // 过滤出会话中已访问过的单词（确保每次学习不重复）
      const availableWords = unlearnedWords.filter(
        word => !this.sessionVisitedIds.includes(word.id)
      );
      
      // 如果所有未学单词都已访问过，重置会话访问记录
      if (availableWords.length === 0) {
        this.sessionVisitedIds = [];
        return unlearnedWords[Math.floor(Math.random() * unlearnedWords.length)];
      }
      
      // 随机选择一个未学习单词
      const randomIndex = Math.floor(Math.random() * availableWords.length);
      const selectedWord = availableWords[randomIndex];
      
      // 标记为已访问
      this.sessionVisitedIds.push(selectedWord.id);
      
      return selectedWord;
    }
    
    // 第二阶段：所有单词都已学习，进入随机复习模式
    return this._getRandomReviewWord();
  }

  /**
   * 获取随机复习单词
   * @returns {Object} 随机单词对象
   */
  _getRandomReviewWord() {
    // 过滤出会话中已访问过的单词
    const availableWords = this.currentWordList.filter(
      word => !this.sessionVisitedIds.includes(word.id)
    );
    
    // 如果所有单词都已访问过，重置会话访问记录
    if (availableWords.length === 0) {
      this.sessionVisitedIds = [];
      return this.currentWordList[Math.floor(Math.random() * this.currentWordList.length)];
    }
    
    // 随机选择一个单词
    const randomIndex = Math.floor(Math.random() * availableWords.length);
    const selectedWord = availableWords[randomIndex];
    
    // 标记为已访问
    this.sessionVisitedIds.push(selectedWord.id);
    
    return selectedWord;
  }

  /**
   * 获取随机单词（兼容旧接口）
   * @returns {Object} 单词对象
   */
  getRandomWord() {
    return this.getNextStudyWord();
  }

  /**
   * 获取下一个单词（用于切换到下一题）
   * @returns {Object} 单词对象
   */
  getNextWord() {
    return this.getNextStudyWord();
  }

  /**
   * 重置学习进度
   */
  reset() {
    this.sessionVisitedIds = [];
    this._isFirstPhaseComplete = false;
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
