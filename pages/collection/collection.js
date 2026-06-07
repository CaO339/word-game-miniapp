/**
 * 收藏页面逻辑
 */

const wordManager = require('../../utils/wordManager.js');
const collectionManager = require('../../utils/collectionManager.js');

const manager = wordManager.getWordManager();
const collection = collectionManager;

Page({
  data: {
    collectedWords: [],   // 收藏单词列表
    collectedCount: 0,     // 收藏数量
    isEmpty: true          // 是否为空
  },

  onLoad: function() {
    // 设置页面标题
    wx.setNavigationBarTitle({
      title: '我的收藏'
    });
  },

  onShow: function() {
    // 每次显示页面时刷新数据
    this.loadCollection();
  },

  // 加载收藏列表
  loadCollection: function() {
    // 获取收藏的单词ID列表
    const collectedIds = collection.getCollectedWordIds();
    
    // 获取对应的单词详情
    const collectedWords = [];
    for (let i = 0; i < collectedIds.length; i++) {
      const word = manager.getWordById(collectedIds[i]);
      if (word) {
        collectedWords.push(word);
      }
    }
    
    this.setData({
      collectedWords: collectedWords,
      collectedCount: collectedWords.length,
      isEmpty: collectedWords.length === 0
    });
  },

  // 取消收藏
  uncollectWord: function(e) {
    const wordId = e.currentTarget.dataset.id;
    collection.uncollectWord(wordId);
    
    // 重新加载收藏列表
    this.loadCollection();
    
    wx.showToast({
      title: '已取消收藏',
      icon: 'success',
      duration: 1000
    });
  },

  // 学习收藏单词
  studyWord: function(e) {
    const wordId = e.currentTarget.dataset.id;
    
    // 将当前单词设为学习目标，然后跳转到学习页
    wx.navigateTo({
      url: `/pages/study/study?wordId=${wordId}`
    });
  },

  // 返回首页
  goHome: function() {
    wx.navigateBack();
  }
});
