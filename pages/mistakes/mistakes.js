/**
 * 错题本页面的逻辑
 */

const wordManager = require('../../utils/wordManager.js');
const mistakeManager = require('../../utils/mistakeManager.js');

const manager = wordManager.getWordManager();
const mistakes = mistakeManager;

Page({
  data: {
    mistakeWords: [],   // 错题单词列表
    mistakeCount: 0,    // 错题数量
    isEmpty: true       // 是否为空
  },

  onLoad: function() {
    // 设置页面标题
    wx.setNavigationBarTitle({
      title: '错题本'
    });
  },

  onShow: function() {
    // 每次显示页面时刷新数据
    this.loadMistakes();
  },

  // 加载错题列表
  loadMistakes: function() {
    // 获取错题的单词ID列表
    const mistakeIds = mistakes.getMistakeWordIds();
    
    // 获取对应的单词详情
    const mistakeWords = [];
    for (let i = 0; i < mistakeIds.length; i++) {
      const word = manager.getWordById(mistakeIds[i]);
      if (word) {
        mistakeWords.push(word);
      }
    }
    
    this.setData({
      mistakeWords: mistakeWords,
      mistakeCount: mistakeWords.length,
      isEmpty: mistakeWords.length === 0
    });
  },

  // 移除错题（学习后调用）
  removeMistake: function(e) {
    const wordId = e.currentTarget.dataset.id;
    mistakes.removeMistake(wordId);
    
    // 重新加载错题列表
    this.loadMistakes();
    
    wx.showToast({
      title: '已移出错题本',
      icon: 'success',
      duration: 1000
    });
  },

  // 学习错题
  studyWord: function(e) {
    const wordId = e.currentTarget.dataset.id;
    
    // 跳转到学习页学习指定单词
    wx.navigateTo({
      url: `/pages/study/study?wordId=${wordId}`
    });
  },

  // 返回首页
  goHome: function() {
    wx.navigateBack();
  }
});
