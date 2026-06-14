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
    
    console.log('[Mistakes] 错题单词ID数量:', mistakeIds.length);
    console.log('[Mistakes] 错题单词IDs:', mistakeIds);
    
    // 获取对应的单词详情
    const mistakeWords = [];
    for (let i = 0; i < mistakeIds.length; i++) {
      const word = manager.getWordById(mistakeIds[i]);
      if (word) {
        mistakeWords.push(word);
      }
    }
    
    console.log('[Mistakes] 错题单词详情数量:', mistakeWords.length);
    console.log('[Mistakes] 错题单词详情:', JSON.stringify(mistakeWords.slice(0, 3)));
    
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

  // 导出PDF
  exportPdf: function() {
    console.log('[Mistakes] 开始导出PDF');
    
    // 检查数据是否为空
    const mistakeIds = mistakes.getMistakeWordIds();
    console.log('[Mistakes] 导出前检查 - 错题ID数量:', mistakeIds.length);
    
    if (mistakeIds.length === 0) {
      wx.showToast({
        title: '暂无可导出的单词',
        icon: 'none'
      });
      return;
    }
    
    // 只传递类型参数，PDF页面将直接从数据管理器获取数据
    wx.navigateTo({
      url: `/pages/exportPdf/exportPdf?type=wrong`
    });
  },

  // 返回首页
  goHome: function() {
    wx.navigateBack();
  }
});