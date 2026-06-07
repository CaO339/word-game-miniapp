// index.js - 首页逻辑
const storageManager = require('../../utils/storageManager.js');
const levelManager = require('../../utils/levelManager.js');
const reviewManager = require('../../utils/reviewManager.js');
const collectionManager = require('../../utils/collectionManager.js');
const mistakeManager = require('../../utils/mistakeManager.js');

// 获取存储管理器、等级管理器、复习管理器、收藏管理器和错题本管理器单例
const storage = storageManager.getStorageManager();
const level = levelManager.getLevelManager();
const review = reviewManager.getReviewManager();
const collection = collectionManager;
const mistakes = mistakeManager;

Page({
  data: {
    todayCount: 0,       // 今日学习数量
    totalCount: 0,       // 累计学习数量
    continuousDays: 0,   // 连续打卡天数
    currentLevel: 1,     // 当前等级
    currentXp: 0,        // 当前经验值
    maxXp: 100,         // 当前等级最大经验值
    xpProgress: 0,       // 经验值进度百分比
    pendingReviewCount: 0, // 待复习单词数量
    collectedCount: 0,    // 收藏单词数量
    mistakeCount: 0       // 错题数量
  },

  onLoad: function() {
    // 获取学习统计数据
    this.loadStats();
  },

  onShow: function() {
    // 页面显示时重新加载统计数据（从学习页面返回时更新）
    this.loadStats();
  },

  // 加载统计数据
  loadStats: function() {
    // 获取学习记录统计
    const studyStats = storage.getHomeStats();
    
    // 获取等级数据
    const levelStats = level.getHomeStats();
    
    // 获取待复习单词数量
    const pendingReviewCount = review.getPendingReviewCount();
    
    // 获取收藏单词数量
    const collectedCount = collection.getCollectionCount();
    
    // 获取错题数量
    const mistakeCount = mistakes.getMistakeCount();
    
    // 更新页面数据
    this.setData({
      todayCount: studyStats.todayCount,
      totalCount: studyStats.totalCount,
      continuousDays: studyStats.continuousDays,
      currentLevel: levelStats.level,
      currentXp: levelStats.currentXp,
      maxXp: levelStats.maxXp,
      xpProgress: levelStats.progress,
      pendingReviewCount: pendingReviewCount,
      collectedCount: collectedCount,
      mistakeCount: mistakeCount
    });
  },

  // 开始学习按钮点击事件
  startStudy: function() {
    // 跳转到学习页面
    wx.navigateTo({
      url: '/pages/study/study'
    });
  },

  // 开始复习按钮点击事件
  startReview: function() {
    // 跳转到复习页面
    wx.navigateTo({
      url: '/pages/review/review'
    });
  },

  // 查看学习统计按钮点击事件
  viewStats: function() {
    // 跳转到统计页面
    wx.navigateTo({
      url: '/pages/statistics/statistics'
    });
  },

  // 查看收藏按钮点击事件
  viewCollection: function() {
    // 跳转到收藏页面
    wx.navigateTo({
      url: '/pages/collection/collection'
    });
  },

  // 查看错题本按钮点击事件
  viewMistakes: function() {
    // 跳转到错题本页面
    wx.navigateTo({
      url: '/pages/mistakes/mistakes'
    });
  }
});
