// 词库管理器 - 支持多词库动态加载

// 固定词库配置
const FIXED_LIBRARIES = {
  cet4: {
    name: 'CET-4',
    path: '../data/cet4_converted.js',
    description: '大学英语四级词汇',
    type: 'fixed'
  },
  cet6: {
    name: 'CET-6',
    path: '../data/cet6.js',
    description: '大学英语六级词汇',
    type: 'fixed'
  },
  kaoyan: {
    name: '考研',
    path: '../data/kaoyan.js',
    description: '考研英语词汇',
    type: 'fixed'
  }
};

// 自定义词库存储键
const CUSTOM_LIBRARIES_KEY = 'wm_custom_libraries';

// 获取所有词库（固定词库 + 自定义词库）
function getAllLibraries() {
  const customLibraries = getCustomLibraries();
  return { ...FIXED_LIBRARIES, ...customLibraries };
}

// 获取自定义词库
function getCustomLibraries() {
  try {
    const data = wx.getStorageSync(CUSTOM_LIBRARIES_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error('[WordManager] 读取自定义词库失败:', e);
    return {};
  }
}

// 保存自定义词库
function saveCustomLibraries(customLibraries) {
  try {
    wx.setStorageSync(CUSTOM_LIBRARIES_KEY, JSON.stringify(customLibraries));
  } catch (e) {
    console.error('[WordManager] 保存自定义词库失败:', e);
  }
}

// 添加自定义词库
function addCustomLibrary(libraryId, name, words) {
  const customLibraries = getCustomLibraries();
  customLibraries[libraryId] = {
    name: name,
    description: `${words.length} 个单词`,
    words: words,
    type: 'custom',
    createdAt: Date.now()
  };
  saveCustomLibraries(customLibraries);
  return true;
}

// 删除自定义词库
function removeCustomLibrary(libraryId) {
  const customLibraries = getCustomLibraries();
  if (customLibraries[libraryId]) {
    delete customLibraries[libraryId];
    saveCustomLibraries(customLibraries);
    return true;
  }
  return false;
}

// 更新自定义词库名称
function updateCustomLibraryName(libraryId, newName) {
  const customLibraries = getCustomLibraries();
  if (customLibraries[libraryId]) {
    customLibraries[libraryId].name = newName;
    saveCustomLibraries(customLibraries);
    return true;
  }
  return false;
}

// 词库配置（兼容旧代码）
const WORD_LIBRARIES = FIXED_LIBRARIES;

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
        // CET6 使用完整版（已包含所有单词）
        loadedFile = '../data/cet6.js';
        const rawData = require('../data/cet6.js');
        data = convertJsonToWords(rawData, 20000);
      } else if (key === 'kaoyan') {
        // 考研使用完整版（已包含所有单词）
        loadedFile = '../data/kaoyan.js';
        const rawData = require('../data/kaoyan.js');
        data = convertJsonToWords(rawData, 30000);
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
 * 获取词库数据（支持固定词库和自定义词库）
 * @param {string} libraryKey - 词库标识
 * @returns {Array} - 词库数组
 */
function getLibraryData(libraryKey) {
  // 首先检查预加载的固定词库
  if (PRELOADED_LIBRARIES[libraryKey]) {
    console.log('[WordManager] 使用预加载词库:', FIXED_LIBRARIES[libraryKey]?.name || libraryKey);
    return PRELOADED_LIBRARIES[libraryKey];
  }
  
  // 然后检查自定义词库
  const customLibraries = getCustomLibraries();
  if (customLibraries[libraryKey]) {
    console.log('[WordManager] 使用自定义词库:', customLibraries[libraryKey].name);
    return customLibraries[libraryKey].words || [];
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
    if (selected) {
      // 检查是否是固定词库
      if (FIXED_LIBRARIES[selected]) {
        console.log('[WordManager] 使用已保存的固定词库:', selected);
        return selected;
      }
      // 检查是否是自定义词库
      const customLibraries = getCustomLibraries();
      if (customLibraries[selected]) {
        console.log('[WordManager] 使用已保存的自定义词库:', selected);
        return selected;
      }
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
  // 检查是否是固定词库
  if (FIXED_LIBRARIES[libraryKey]) {
    try {
      wx.setStorageSync(STORAGE_KEYS.SELECTED_LIBRARY, libraryKey);
      console.log('[WordManager] 词库选择已保存:', libraryKey);
      return true;
    } catch (e) {
      console.error('[WordManager] 保存词库选择失败:', e);
      return false;
    }
  }
  
  // 检查是否是自定义词库
  const customLibraries = getCustomLibraries();
  if (customLibraries[libraryKey]) {
    try {
      wx.setStorageSync(STORAGE_KEYS.SELECTED_LIBRARY, libraryKey);
      console.log('[WordManager] 自定义词库选择已保存:', libraryKey);
      return true;
    } catch (e) {
      console.error('[WordManager] 保存词库选择失败:', e);
      return false;
    }
  }
  
  console.warn('[WordManager] 无效的词库标识:', libraryKey);
  return false;
}

/**
 * 获取所有可用词库列表（固定词库 + 自定义词库）
 * @returns {Array} - 词库信息数组
 */
function getLibraryList() {
  const libraries = [];
  
  // 添加固定词库
  for (const [key, value] of Object.entries(FIXED_LIBRARIES)) {
    libraries.push({
      key: key,
      name: value.name,
      description: value.description,
      wordCount: PRELOADED_LIBRARIES[key]?.length || 0,
      type: 'fixed'
    });
  }
  
  // 添加自定义词库
  const customLibraries = getCustomLibraries();
  for (const [key, value] of Object.entries(customLibraries)) {
    libraries.push({
      key: key,
      name: value.name,
      description: value.description,
      wordCount: value.words?.length || 0,
      type: 'custom',
      createdAt: value.createdAt
    });
  }
  
  return libraries;
}

/**
 * 检查词库是否存在
 * @param {string} libraryKey - 词库标识
 * @returns {boolean} - 是否存在
 */
function libraryExists(libraryKey) {
  if (FIXED_LIBRARIES[libraryKey]) return true;
  const customLibraries = getCustomLibraries();
  return !!customLibraries[libraryKey];
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
    
    const libraryName = FIXED_LIBRARIES[this.currentLibraryKey]?.name || 
                        (getCustomLibraries()[this.currentLibraryKey]?.name) || 
                        this.currentLibraryKey;
    console.log(`[${libraryName}]`);
    console.log(`loaded words: ${this.currentWordList.length}`);
    console.log(`learned words: ${learnedCount}`);
    console.log(`unlearned words: ${unlearnedCount}`);
  }

  /**
   * 切换词库
   * @param {string} libraryKey - 词库标识
   */
  switchLibrary(libraryKey) {
    // 检查词库是否存在（支持固定词库和自定义词库）
    if (!libraryExists(libraryKey)) {
      console.warn('[WordManager] 无效的词库:', libraryKey);
      return false;
    }
    
    if (this.currentLibraryKey === libraryKey) {
      console.log('[WordManager] 已是当前词库，无需切换:', libraryKey);
      return true;
    }
    
    const oldLibraryKey = this.currentLibraryKey;
    console.log('[WordManager] ==================== 开始切换词库 ====================');
    
    // 获取词库名称（支持固定词库和自定义词库）
    const getLibraryName = (key) => {
      if (FIXED_LIBRARIES[key]) return FIXED_LIBRARIES[key].name;
      const customLibraries = getCustomLibraries();
      return customLibraries[key]?.name || key;
    };
    
    console.log('[WordManager] 切换前词库:', oldLibraryKey, '-', getLibraryName(oldLibraryKey));
    console.log('[WordManager] 切换后词库:', libraryKey, '-', getLibraryName(libraryKey));
    
    // 保存新词库选择
    saveSelectedLibrary(libraryKey);
    
    // 重置学习状态
    this.currentLibraryKey = libraryKey;
    this.sessionVisitedIds = [];
    this._isFirstPhaseComplete = false;
    
    // 使用预加载的数据重新初始化
    const data = getLibraryData(libraryKey);
    this.currentWordList = data || builtinWords;
    
    console.log('[WordManager] 加载单词数:', this.currentWordList.length);
    console.log('[WordManager] 词库切换完成:', this.getLibraryName());
    console.log('[WordManager] ==================== 词库切换结束 ====================');
    
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
    // 检查固定词库
    if (FIXED_LIBRARIES[this.currentLibraryKey]) {
      return FIXED_LIBRARIES[this.currentLibraryKey].name;
    }
    // 检查自定义词库
    const customLibraries = getCustomLibraries();
    if (customLibraries[this.currentLibraryKey]) {
      return customLibraries[this.currentLibraryKey].name;
    }
    return '未知词库';
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
  FIXED_LIBRARIES: FIXED_LIBRARIES,
  DEFAULT_LIBRARY: DEFAULT_LIBRARY,
  preloadAllLibraries: preloadAllLibraries,
  getLibraryData: getLibraryData,
  // 自定义词库管理
  getCustomLibraries: getCustomLibraries,
  addCustomLibrary: addCustomLibrary,
  removeCustomLibrary: removeCustomLibrary,
  updateCustomLibraryName: updateCustomLibraryName,
  libraryExists: libraryExists,
  convertJsonToWords: convertJsonToWords
};
