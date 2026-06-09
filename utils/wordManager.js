// 词库管理器 - 支持多词库动态加载

// 词库配置
const WORD_LIBRARIES = {
  cet4: {
    name: 'CET-4',
    path: '../data/cet4_converted.js',
    description: '大学英语四级词汇'
  },
  cet6: {
    name: 'CET-6',
    path: '../data/cet6.js',
    description: '大学英语六级词汇'
  },
  kaoyan: {
    name: '考研',
    path: '../data/kaoyan.js',
    description: '考研英语词汇'
  },
  ielts: {
    name: '雅思',
    path: '../data/ielts.js',
    description: '雅思考试词汇'
  }
};

// 默认词库
const DEFAULT_LIBRARY = 'cet4';

// Storage keys
const STORAGE_KEYS = {
  SELECTED_LIBRARY: 'selectedWordLibrary',
  LEARNING_RECORD_PREFIX: 'wm_learning_record_'
};

// 内置基础单词（备用）
const builtinWords = [
  { id: 1001, english: 'apple', chinese: '苹果', meaning: '苹果', partOfSpeech: 'n', collocation: '' },
  { id: 1002, english: 'book', chinese: '书', meaning: '书', partOfSpeech: 'n', collocation: '' },
  { id: 1003, english: 'computer', chinese: '电脑', meaning: '电脑', partOfSpeech: 'n', collocation: '' }
];

// 预加载所有词库（解决 require 缓存问题）
const PRELOADED_LIBRARIES = {};

/**
 * 预加载所有词库
 */
function preloadAllLibraries() {
  console.log('[WordManager] ==================== 开始预加载词库 ====================');
  
  // 输出支持的词库列表
  const levels = Object.keys(WORD_LIBRARIES);
  console.log('[WordManager] supported levels:', levels);
  
  for (const key of levels) {
    try {
      const library = WORD_LIBRARIES[key];
      console.log('[WordManager] --------------------');
      console.log('[WordManager] current level:', key);
      
      // 根据词库类型加载对应的文件
      let data = null;
      let loadedFile = '';
      
      if (key === 'cet4') {
        // CET4 使用完整版
        loadedFile = '../data/cet4_converted.js';
        data = require('../data/cet4_converted.js');
      } else if (key === 'cet6') {
        // CET6 优先使用完整版，否则使用JSON文件
        loadedFile = '../data/cet6_full.js';
        try {
          data = require('../data/cet6_full.js');
        } catch (e) {
          console.warn('[WordManager] CET6完整版不存在，尝试加载JSON');
          loadedFile = '../data/4-CET6-顺序.json';
          try {
            const jsonContent = require('../data/4-CET6-顺序.json');
            data = convertJsonToWords(jsonContent, 20000);
          } catch (jsonError) {
            console.warn('[WordManager] JSON也无法加载，使用基础版');
            loadedFile = '../data/cet6.js';
            data = require('../data/cet6.js');
          }
        }
      } else if (key === 'kaoyan') {
        // 考研优先使用完整版，否则使用JSON文件
        loadedFile = '../data/kaoyan_full.js';
        try {
          data = require('../data/kaoyan_full.js');
        } catch (e) {
          console.warn('[WordManager] 考研完整版不存在，尝试加载JSON');
          loadedFile = '../data/5-考研-顺序.json';
          try {
            const jsonContent = require('../data/5-考研-顺序.json');
            data = convertJsonToWords(jsonContent, 30000);
          } catch (jsonError) {
            console.warn('[WordManager] JSON也无法加载，使用基础版');
            loadedFile = '../data/kaoyan.js';
            data = require('../data/kaoyan.js');
          }
        }
      } else {
        // 其他词库正常加载
        loadedFile = library.path;
        data = require(library.path);
      }
      
      console.log('[WordManager] loaded file:', loadedFile);
      console.log('[WordManager] words count:', data ? data.length : 'N/A');
      
      if (data && data.length > 0) {
        PRELOADED_LIBRARIES[key] = data;
        console.log('[WordManager] 预加载成功:', library.name, '-', data.length, '个单词');
      } else {
        console.warn('[WordManager] 词库为空:', library.name);
        PRELOADED_LIBRARIES[key] = builtinWords;
      }
    } catch (error) {
      console.error('[WordManager] 预加载失败:', key, '-', error.message);
      PRELOADED_LIBRARIES[key] = builtinWords;
    }
  }
  
  console.log('[WordManager] ==================== 预加载完成 ====================');
  for (const key of Object.keys(PRELOADED_LIBRARIES)) {
    console.log('[WordManager] 词库:', key, '- 单词数:', PRELOADED_LIBRARIES[key].length);
  }
}

/**
 * 将JSON格式转换为单词格式
 */
function convertJsonToWords(jsonData, startId) {
  if (!jsonData || !Array.isArray(jsonData)) {
    return [];
  }
  
  return jsonData.map((item, index) => {
    const translation = item.translations?.[0]?.translation || '';
    const partOfSpeech = item.translations?.[0]?.type || '';
    
    return {
      word: item.word,
      id: startId + index + 1,
      english: item.word,
      meaning: translation,
      partOfSpeech: partOfSpeech,
      collocation: (item.phrases || []).map(p => p.phrase).join('; ') || '',
      chinese: translation
    };
  });
}

// 立即预加载所有词库
preloadAllLibraries();

/**
 * 获取预加载的词库数据
 * @param {string} libraryKey - 词库标识
 * @returns {Array} - 词库数组
 */
function getLibraryData(libraryKey) {
  if (PRELOADED_LIBRARIES[libraryKey]) {
    console.log('[WordManager] 使用预加载词库:', WORD_LIBRARIES[libraryKey]?.name || libraryKey);
    return PRELOADED_LIBRARIES[libraryKey];
  }
  
  console.warn('[WordManager] 词库不存在，使用内置词库:', libraryKey);
  return builtinWords;
}

/**
 * 获取当前选中的词库
 * @returns {string} - 词库标识
 */
function getSelectedLibrary() {
  try {
    const selected = wx.getStorageSync(STORAGE_KEYS.SELECTED_LIBRARY);
    if (selected && WORD_LIBRARIES[selected]) {
      console.log('[WordManager] 使用已保存的词库:', selected);
      return selected;
    }
  } catch (e) {
    console.error('[WordManager] 读取词库选择失败:', e);
  }
  
  console.log('[WordManager] 使用默认词库:', DEFAULT_LIBRARY);
  return DEFAULT_LIBRARY;
}

/**
 * 保存选中的词库
 * @param {string} libraryKey - 词库标识
 */
function saveSelectedLibrary(libraryKey) {
  if (!WORD_LIBRARIES[libraryKey]) {
    console.warn('[WordManager] 无效的词库标识:', libraryKey);
    return false;
  }
  
  try {
    wx.setStorageSync(STORAGE_KEYS.SELECTED_LIBRARY, libraryKey);
    console.log('[WordManager] 词库选择已保存:', libraryKey);
    return true;
  } catch (e) {
    console.error('[WordManager] 保存词库选择失败:', e);
    return false;
  }
}

/**
 * 获取所有可用词库列表
 * @returns {Array} - 词库信息数组
 */
function getLibraryList() {
  return Object.entries(WORD_LIBRARIES).map(([key, value]) => ({
    key: key,
    name: value.name,
    description: value.description,
    wordCount: PRELOADED_LIBRARIES[key]?.length || 0
  }));
}

/**
 * 词库管理器类
 */
class WordManager {
  constructor() {
    // 当前词库
    this.currentLibraryKey = getSelectedLibrary();
    this.currentWordList = [];
    // 当前学习会话中已访问过的单词ID列表
    this.sessionVisitedIds = [];
    // 是否已完成第一阶段学习
    this._isFirstPhaseComplete = false;
    // 初始化词库
    this.initWordList();
  }

  /**
   * 初始化词库
   */
  initWordList() {
    const data = getLibraryData(this.currentLibraryKey);
    this.currentWordList = data || builtinWords;
    
    // 调试日志
    const learnedIds = this._getLearnedWordIds();
    const learnedCount = learnedIds.length;
    const unlearnedCount = this.currentWordList.length - learnedCount;
    
    console.log(`[${WORD_LIBRARIES[this.currentLibraryKey]?.name || this.currentLibraryKey}]`);
    console.log(`loaded words: ${this.currentWordList.length}`);
    console.log(`learned words: ${learnedCount}`);
    console.log(`unlearned words: ${unlearnedCount}`);
  }

  /**
   * 切换词库
   * @param {string} libraryKey - 词库标识
   */
  switchLibrary(libraryKey) {
    if (!WORD_LIBRARIES[libraryKey]) {
      console.warn('[WordManager] 无效的词库:', libraryKey);
      return false;
    }
    
    if (this.currentLibraryKey === libraryKey) {
      console.log('[WordManager] 已是当前词库，无需切换:', libraryKey);
      return true;
    }
    
    console.log('[WordManager] 切换词库:', this.currentLibraryKey, '->', libraryKey);
    
    // 保存新词库选择
    saveSelectedLibrary(libraryKey);
    
    // 重置学习状态
    this.currentLibraryKey = libraryKey;
    this.sessionVisitedIds = [];
    this._isFirstPhaseComplete = false;
    
    // 使用预加载的数据重新初始化
    const data = getLibraryData(libraryKey);
    this.currentWordList = data || builtinWords;
    
    console.log('[WordManager] 词库切换完成:', this.getLibraryName(), '- 单词数:', this.currentWordList.length);
    
    return true;
  }

  /**
   * 获取词库总单词数
   */
  getTotalCount() {
    return this.currentWordList.length;
  }

  /**
   * 获取所有单词列表
   */
  getAllWords() {
    return this.currentWordList;
  }

  /**
   * 获取当前词库名称
   */
  getLibraryName() {
    const library = WORD_LIBRARIES[this.currentLibraryKey];
    return library ? library.name : '未知词库';
  }

  /**
   * 获取当前词库标识
   */
  getLibraryKey() {
    return this.currentLibraryKey;
  }

  /**
   * 从Storage获取已学习的单词ID列表
   */
  _getLearnedWordIds() {
    const recordKey = STORAGE_KEYS.LEARNING_RECORD_PREFIX + this.currentLibraryKey;
    try {
      const record = wx.getStorageSync(recordKey);
      if (record && record.learnedWordIds) {
        return record.learnedWordIds;
      }
    } catch (e) {
      console.error('获取已学习单词失败:', e);
    }
    return [];
  }

  /**
   * 检查是否已完成第一阶段
   */
  isFirstPhaseComplete() {
    const learnedIds = this._getLearnedWordIds();
    const total = this.currentWordList.length;
    
    if (learnedIds.length >= total) {
      this._isFirstPhaseComplete = true;
      return true;
    }
    
    const allLearned = this.currentWordList.every(word => 
      learnedIds.includes(word.id)
    );
    
    this._isFirstPhaseComplete = allLearned;
    return allLearned;
  }

  /**
   * 获取学习进度信息
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
      isFirstPhase: learnedCount < total,
      libraryName: this.getLibraryName(),
      libraryKey: this.currentLibraryKey
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
   */
  _getUnlearnedWords() {
    const learnedIds = this._getLearnedWordIds();
    return this.currentWordList.filter(word => !learnedIds.includes(word.id));
  }

  /**
   * 获取下一个学习单词
   */
  getNextStudyWord() {
    const learnedIds = this._getLearnedWordIds();
    const total = this.currentWordList.length;
    
    if (learnedIds.length < total) {
      const unlearnedWords = this._getUnlearnedWords();
      const availableWords = unlearnedWords.filter(
        word => !this.sessionVisitedIds.includes(word.id)
      );
      
      if (availableWords.length === 0) {
        this.sessionVisitedIds = [];
        return unlearnedWords[Math.floor(Math.random() * unlearnedWords.length)];
      }
      
      const randomIndex = Math.floor(Math.random() * availableWords.length);
      const selectedWord = availableWords[randomIndex];
      this.sessionVisitedIds.push(selectedWord.id);
      
      return selectedWord;
    }
    
    return this._getRandomReviewWord();
  }

  /**
   * 获取随机复习单词
   */
  _getRandomReviewWord() {
    const availableWords = this.currentWordList.filter(
      word => !this.sessionVisitedIds.includes(word.id)
    );
    
    if (availableWords.length === 0) {
      this.sessionVisitedIds = [];
      return this.currentWordList[Math.floor(Math.random() * this.currentWordList.length)];
    }
    
    const randomIndex = Math.floor(Math.random() * availableWords.length);
    const selectedWord = availableWords[randomIndex];
    this.sessionVisitedIds.push(selectedWord.id);
    
    return selectedWord;
  }

  /**
   * 获取随机单词
   */
  getRandomWord() {
    return this.getNextStudyWord();
  }

  /**
   * 获取下一个单词
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
   * 根据ID获取单词详情
   */
  getWordById(wordId) {
    return this.currentWordList.find(word => word.id === wordId) || null;
  }
}

// 导出单例实例和方法
module.exports = {
  WordManager: WordManager,
  getWordManager: function() {
    if (!global.wordManagerInstance) {
      global.wordManagerInstance = new WordManager();
    }
    return global.wordManagerInstance;
  },
  getLibraryList: getLibraryList,
  getSelectedLibrary: getSelectedLibrary,
  saveSelectedLibrary: saveSelectedLibrary,
  WORD_LIBRARIES: WORD_LIBRARIES,
  DEFAULT_LIBRARY: DEFAULT_LIBRARY,
  preloadAllLibraries: preloadAllLibraries,
  getLibraryData: getLibraryData
};
