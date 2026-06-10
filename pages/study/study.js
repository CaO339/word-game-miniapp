// 学习页面逻辑
const wordManager = require('../../utils/wordManager.js');
const storageManager = require('../../utils/storageManager.js');
const levelManager = require('../../utils/levelManager.js');
const reviewManager = require('../../utils/reviewManager.js');
const collectionManager = require('../../utils/collectionManager.js');
const mistakeManager = require('../../utils/mistakeManager.js');

// 获取词库管理器、存储管理器、等级管理器、复习管理器、收藏管理器和错题本管理器单例
const manager = wordManager.getWordManager();
const storage = storageManager.getStorageManager();
const level = levelManager.getLevelManager();
const review = reviewManager.getReviewManager();
const collection = collectionManager;
const mistakes = mistakeManager;

Page({
  data: {
    currentWord: {},      // 当前单词对象
    showAnswer: false,    // 是否显示答案
    showResultButtons: false, // 是否显示认识/不认识按钮
    learnedCount: 0,      // 已学习单词数（本次会话）
    totalWords: 0,       // 总单词数
    wordListName: '',     // 当前词库名称
    currentLibrary: '',   // 当前词库名称（用于显示）
    todayCount: 0,       // 今日学习数量
    totalCount: 0,       // 累计学习数量
    currentLevel: 1,     // 当前等级
    currentXp: 0,        // 当前经验值
    xpToNextLevel: 100,  // 升级还需经验值
    isCollected: false,   // 当前单词是否已收藏
    target: 20,           // 每日目标
    targetTodayNewCount: 0, // 今日新单词数
    targetIsCompleted: false // 目标是否完成
  },

  onLoad: function() {
    this.loadWordData();
  },

  onShow: function() {
    // 每次页面显示时重新加载数据（词库可能已切换）
    // 同步 storageManager 和 reviewManager 的当前词库
    const libraryKey = manager.getLibraryKey();
    storage.setCurrentLibrary(libraryKey);
    review.setCurrentLibrary(libraryKey);
    this.loadWordData();
  },

  /**
   * 加载单词数据
   */
  loadWordData: function() {
    // 获取词库信息
    const totalWords = manager.getTotalCount();
    const wordListName = manager.getLibraryName();
    const libraryKey = manager.getLibraryKey();
    const allWords = manager.getAllWords();
    
    // 获取学习统计数据
    const stats = storage.getHomeStats();
    
    // 获取每日目标统计
    const targetStats = storage.getHomeTargetStats();
    
    // 获取等级数据
    const levelStats = level.getHomeStats();
    
    // 获取第一个单词
    const firstWord = manager.getRandomWord();
    
    // 详细调试日志
    console.log('========== [Study] 学习页面加载日志 ==========');
    console.log('[Study] 当前词库名称:', wordListName);
    console.log('[Study] 当前词库Key:', libraryKey);
    console.log('[Study] 词库总单词数:', totalWords);
    console.log('[Study] manager.currentWordList.length:', allWords.length);
    console.log('[Study] 已学单词数:', manager.getLearnedCount());
    console.log('[Study] 未学单词数:', totalWords - manager.getLearnedCount());
    console.log('[Study] 当前单词:', firstWord.english);
    console.log('[Study] 当前单词ID:', firstWord.id);
    console.log('===========================================');
    
    if (!firstWord || Object.keys(firstWord).length === 0) {
      console.error('[Study] 无法获取单词，词库可能为空');
      return;
    }
    
    // 检查当前单词是否已收藏
    const isCollected = collection.isCollected(firstWord.id);
    
    this.setData({
      currentWord: firstWord,
      totalWords: totalWords,
      wordListName: wordListName,
      currentLibrary: wordListName,
      learnedCount: manager.getLearnedCount(),
      todayCount: stats.todayCount,
      totalCount: stats.totalCount,
      currentLevel: levelStats.level,
      currentXp: levelStats.xp,
      xpToNextLevel: levelStats.remainingXp,
      isCollected: isCollected,
      target: targetStats.target,
      targetTodayNewCount: targetStats.todayNewCount,
      targetIsCompleted: targetStats.isCompleted,
      showAnswer: false,
      showResultButtons: false
    });
  },

  // 显示答案按钮点击事件
  showAnswer: function() {
    this.setData({
      showAnswer: true,
      showResultButtons: true  // 显示认识/不认识按钮
    });
  },

  // 认识按钮点击事件
  markKnown: function() {
    this.processWord(true);
  },

  // 不认识按钮点击事件
  markUnknown: function() {
    this.processWord(false);
  },

  // 处理单词学习（记录学习并进入下一题）
  processWord: function(isKnown) {
    const wordId = this.data.currentWord.id;
    
    // 如果不认识，添加到错题本
    if (!isKnown) {
      mistakes.addMistake(wordId);
    }
    
    // 获取当前已学习的单词ID列表，检查是否是新单词
    const learnedWordIds = storage.getLearnedWordIds();
    const isNewWord = !learnedWordIds.includes(wordId);
    
    // 更新学习记录
    const record = storage.updateLearningRecord(wordId);
    
    // 记录每日学习数量
    storage.recordDailyStudy(record.todayCount);
    
    // 更新每日目标（仅新单词计入目标）
    storage.updateDailyTarget(wordId, isNewWord);
    
    // 更新复习记录（学习后计算下次复习时间）
    review.updateStudyRecord(wordId);
    
    // 增加经验值（每学习一个单词获得10 XP）
    const xpResult = level.addXPForWord();
    
    // 检查是否升级
    if (xpResult.levelUp && xpResult.levelUpTo) {
      // 弹出升级提示
      wx.showToast({
        title: `恭喜升级到 Lv${xpResult.levelUpTo}`,
        icon: 'success',
        duration: 2000
      });
    }
    
    // 获取下一个单词
    const nextWord = manager.getNextWord();
    
    // 调试：打印下一个单词对象
    console.log('[Study] 下一个单词对象:', JSON.stringify(nextWord));
    
    // 检查下一个单词是否已收藏
    const isCollected = collection.isCollected(nextWord.id);
    
    // 获取最新等级数据
    const levelStats = level.getHomeStats();
    
    // 获取最新每日目标数据
    const targetStats = storage.getHomeTargetStats();
    
    this.setData({
      currentWord: nextWord,
      showAnswer: false,
      showResultButtons: false,
      learnedCount: manager.getLearnedCount(),
      todayCount: record.todayCount,
      totalCount: record.totalCount,
      currentLevel: levelStats.level,
      currentXp: levelStats.xp,
      xpToNextLevel: levelStats.remainingXp,
      isCollected: isCollected,
      target: targetStats.target,
      targetTodayNewCount: targetStats.todayNewCount,
      targetIsCompleted: targetStats.isCompleted
    });
  },

  // 切换收藏状态
  toggleCollect: function() {
    const wordId = this.data.currentWord.id;
    const newCollected = collection.toggleCollect(wordId);
    
    this.setData({
      isCollected: newCollected
    });
    
    // 显示提示
    wx.showToast({
      title: newCollected ? '已收藏' : '已取消收藏',
      icon: 'success',
      duration: 1000
    });
  },

  // 返回首页按钮点击事件
  goHome: function() {
    wx.navigateBack();
  }
});
