// 学习页面逻辑
const wordManager = require('../../utils/wordManager.js');
const storageManager = require('../../utils/storageManager.js');

// 获取词库管理器和存储管理器单例
const manager = wordManager.getWordManager();
const storage = storageManager.getStorageManager();

Page({
  data: {
    currentWord: {},      // 当前单词对象
    showAnswer: false,    // 是否显示答案
    showResultButtons: false, // 是否显示认识/不认识按钮
    learnedCount: 0,      // 已学习单词数（本次会话）
    totalWords: 0,       // 总单词数
    wordListName: '',     // 当前词库名称
    todayCount: 0,       // 今日学习数量
    totalCount: 0        // 累计学习数量
  },

  onLoad: function() {
    // 获取词库信息
    const totalWords = manager.getTotalCount();
    const wordListName = manager.getWordListName();
    
    // 获取学习统计数据
    const stats = storage.getHomeStats();
    
    // 获取第一个单词
    const firstWord = manager.getRandomWord();
    
    this.setData({
      currentWord: firstWord,
      totalWords: totalWords,
      wordListName: wordListName,
      learnedCount: manager.getLearnedCount(),
      todayCount: stats.todayCount,
      totalCount: stats.totalCount
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
    
    // 获取下一个单词
    const nextWord = manager.getNextWord();
    
    this.setData({
      currentWord: nextWord,
      showAnswer: false,
      showResultButtons: false,
      learnedCount: manager.getLearnedCount(),
      todayCount: record.todayCount,
      totalCount: record.totalCount
    });
  },

  // 返回首页按钮点击事件
  goHome: function() {
    wx.navigateTo({
      url: '/pages/index/index'
    });
  }
});
