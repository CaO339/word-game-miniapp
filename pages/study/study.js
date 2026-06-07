// 学习页面逻辑
const wordManager = require('../../utils/wordManager.js');
const storageManager = require('../../utils/storageManager.js');
const levelManager = require('../../utils/levelManager.js');

// 获取词库管理器、存储管理器和等级管理器单例
const manager = wordManager.getWordManager();
const storage = storageManager.getStorageManager();
const level = levelManager.getLevelManager();

Page({
  data: {
    currentWord: {},      // 当前单词对象
    showAnswer: false,    // 是否显示答案
    showResultButtons: false, // 是否显示认识/不认识按钮
    learnedCount: 0,      // 已学习单词数（本次会话）
    totalWords: 0,       // 总单词数
    wordListName: '',     // 当前词库名称
    todayCount: 0,       // 今日学习数量
    totalCount: 0,       // 累计学习数量
    currentLevel: 1,     // 当前等级
    currentXp: 0,        // 当前经验值
    xpToNextLevel: 100   // 升级还需经验值
  },

  onLoad: function() {
    // 获取词库信息
    const totalWords = manager.getTotalCount();
    const wordListName = manager.getWordListName();
    
    // 获取学习统计数据
    const stats = storage.getHomeStats();
    
    // 获取等级数据
    const levelStats = level.getHomeStats();
    
    // 获取第一个单词
    const firstWord = manager.getRandomWord();
    
    this.setData({
      currentWord: firstWord,
      totalWords: totalWords,
      wordListName: wordListName,
      learnedCount: manager.getLearnedCount(),
      todayCount: stats.todayCount,
      totalCount: stats.totalCount,
      currentLevel: levelStats.level,
      currentXp: levelStats.xp,
      xpToNextLevel: levelStats.remainingXp
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
    
    // 更新学习记录
    const record = storage.updateLearningRecord(wordId);
    
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
    
    // 获取最新等级数据
    const levelStats = level.getHomeStats();
    
    this.setData({
      currentWord: nextWord,
      showAnswer: false,
      showResultButtons: false,
      learnedCount: manager.getLearnedCount(),
      todayCount: record.todayCount,
      totalCount: record.totalCount,
      currentLevel: levelStats.level,
      currentXp: levelStats.xp,
      xpToNextLevel: levelStats.remainingXp
    });
  },

  // 返回首页按钮点击事件
  goHome: function() {
    wx.navigateTo({
      url: '/pages/index/index'
    });
  }
});
