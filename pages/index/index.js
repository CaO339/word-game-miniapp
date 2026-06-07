// index.js - 首页逻辑
const storageManager = require('../../utils/storageManager.js');

// 获取存储管理器单例
const storage = storageManager.getStorageManager();

Page({
  data: {
    todayCount: 0,       // 今日学习数量
    totalCount: 0,       // 累计学习数量
    continuousDays: 0    // 连续打卡天数
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
    const stats = storage.getHomeStats();
    this.setData({
      todayCount: stats.todayCount,
      totalCount: stats.totalCount,
      continuousDays: stats.continuousDays
    });
  },

  // 开始学习按钮点击事件
  startStudy: function() {
    // 跳转到学习页面
    wx.navigateTo({
      url: '/pages/study/study'
    });
  }
});
