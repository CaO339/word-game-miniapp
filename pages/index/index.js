// index.js - 首页逻辑
const storageManager = require('../../utils/storageManager.js');
const levelManager = require('../../utils/levelManager.js');
const reviewManager = require('../../utils/reviewManager.js');

// 获取存储管理器、等级管理器和复习管理器单例
const storage = storageManager.getStorageManager();
const level = levelManager.getLevelManager();
const review = reviewManager.getReviewManager();

Page({
  data: {
    todayCount: 0,       // 今日学习数量
    totalCount: 0,       // 累计学习数量
    continuousDays: 0,   // 连续打卡天数
    currentLevel: 1,     // 当前等级
    currentXp: 0,        // 当前经验值
    maxXp: 100,         // 当前等级最大经验值
    xpProgress: 0,       // 经验值进度百分比
    pendingReviewCount: 0 // 待复习单词数量
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
    console.time('[首页] 加载统计数据总耗时');
    
    // 获取学习记录统计
    console.time('[首页] 获取学习记录统计');
    const studyStats = storage.getHomeStats();
    console.timeEnd('[首页] 获取学习记录统计');
    
    // 获取等级数据
    console.time('[首页] 获取等级数据');
    const levelStats = level.getHomeStats();
    console.timeEnd('[首页] 获取等级数据');
    
    // 获取待复习单词数量
    console.time('[首页] 获取待复习单词数量');
    const pendingReviewCount = review.getPendingReviewCount();
    console.timeEnd('[首页] 获取待复习单词数量');
    
    // 更新页面数据
    console.time('[首页] setData更新');
    this.setData({
      todayCount: studyStats.todayCount,
      totalCount: studyStats.totalCount,
      continuousDays: studyStats.continuousDays,
      currentLevel: levelStats.level,
      currentXp: levelStats.currentXp,
      maxXp: levelStats.maxXp,
      xpProgress: levelStats.progress,
      pendingReviewCount: pendingReviewCount
    });
    console.timeEnd('[首页] setData更新');
    
    console.timeEnd('[首页] 加载统计数据总耗时');
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
  }
});
