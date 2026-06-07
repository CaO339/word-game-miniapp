// 学习页面逻辑
const wordManager = require('../../utils/wordManager.js');

// 获取词库管理器单例
const manager = wordManager.getWordManager();

Page({
  data: {
    currentWord: {},      // 当前单词对象
    showAnswer: false,    // 是否显示答案
    learnedCount: 0,      // 已学习单词数
    totalWords: 0,       // 总单词数
    wordListName: ''      // 当前词库名称
  },

  onLoad: function() {
    // 获取词库信息
    const totalWords = manager.getTotalCount();
    const wordListName = manager.getWordListName();
    
    // 获取第一个单词
    const firstWord = manager.getRandomWord();
    
    this.setData({
      currentWord: firstWord,
      totalWords: totalWords,
      wordListName: wordListName,
      learnedCount: manager.getLearnedCount()
    });
  },

  // 显示答案按钮点击事件
  showAnswer: function() {
    this.setData({
      showAnswer: true
    });
  },

  // 下一题按钮点击事件 - 随机抽取新单词
  nextWord: function() {
    // 随机获取下一个单词
    const nextWord = manager.getNextWord();
    
    this.setData({
      currentWord: nextWord,
      showAnswer: false,
      learnedCount: manager.getLearnedCount()
    });
  },

  // 返回首页按钮点击事件
  goHome: function() {
    wx.navigateTo({
      url: '/pages/index/index'
    });
  }
});
