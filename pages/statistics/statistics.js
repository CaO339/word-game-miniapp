// 统计页面逻辑
const storageManager = require('../../utils/storageManager.js');
const levelManager = require('../../utils/levelManager.js');
const reviewManager = require('../../utils/reviewManager.js');
const wordManager = require('../../utils/wordManager.js');

// 获取管理器单例
const storage = storageManager.getStorageManager();
const level = levelManager.getLevelManager();
const review = reviewManager.getReviewManager();
const wordMgr = wordManager.getWordManager();

Page({
  data: {
    // 学习数据
    todayCount: 0,           // 今日学习数量
    totalCount: 0,           // 累计学习数量
    masteredCount: 0,        // 已掌握单词数量
    masteryRate: '0',        // 掌握率
    target: 20,              // 每日目标
    studyProgress: '0',      // 学习进度（今日完成/每日目标）
    
    // 打卡数据
    continuousDays: 0,       // 连续打卡天数
    totalCheckins: 0,        // 总打卡天数
    
    // 等级数据
    currentLevel: 1,         // 当前等级
    currentXp: 0,            // 当前XP
    nextLevelXp: 100,        // 下一等级所需XP
    
    // 复习数据
    pendingReviewCount: 0,   // 待复习数量
    completedReviewCount: 0, // 已完成复习数量
    
    // 学习趋势（最近7天）
    weeklyData: [],          // 最近7天学习数据
    
    // 页面标题
    pageTitle: '学习统计'
  },

  onLoad: function() {
    // 加载所有统计数据
    this.loadAllStats();
  },

  onShow: function() {
    // 页面显示时同步词库并重新加载数据
    const libraryKey = wordMgr.getLibraryKey();
    storage.setCurrentLibrary(libraryKey);
    review.setCurrentLibrary(libraryKey);
    this.loadAllStats();
  },

  /**
   * 加载所有统计数据
   */
  loadAllStats: function() {
    // 加载学习数据
    this.loadStudyStats();
    
    // 加载打卡数据
    this.loadCheckinStats();
    
    // 加载等级数据
    this.loadLevelStats();
    
    // 加载复习数据
    this.loadReviewStats();
    
    // 加载学习趋势数据
    this.loadWeeklyData();
  },

  /**
   * 加载学习数据
   */
  loadStudyStats: function() {
    // 获取当前词库信息
    const currentLibraryKey = wordMgr.getLibraryKey();
    const allWords = wordMgr.getAllWords();
    const totalWords = allWords.length;
    
    // 获取已学习单词列表（当前词库）
    const learnedWordIds = storage.getLearnedWordIds();
    
    // 调试日志
    console.log('[Statistics] currentLevel:', currentLibraryKey);
    console.log('[Statistics] totalWords:', totalWords);
    console.log('[Statistics] learnedWordIds (去重前):', learnedWordIds.length);
    
    // 去重已学单词
    const uniqueLearnedIds = [...new Set(learnedWordIds)];
    console.log('[Statistics] learnedWordIds (去重后):', uniqueLearnedIds.length);
    
    // 计算掌握率：去重后的已学单词数 / 当前词库总单词数 * 100%
    const masteredCount = uniqueLearnedIds.length;
    let masteryRate = 0;
    if (totalWords > 0) {
      masteryRate = Math.min((masteredCount / totalWords) * 100, 100); // 不超过100%
    }
    
    // 获取学习统计和每日目标
    const studyStats = storage.getHomeStats();
    const todayCount = studyStats.todayCount;
    const targetData = storage.getDailyTarget();
    const target = targetData ? targetData.target : 20;
    
    // 计算学习进度：今日学习数量 / 每日目标 * 100%
    let studyProgress = 0;
    if (target > 0) {
      studyProgress = Math.min((todayCount / target) * 100, 100);
    }
    
    this.setData({
      todayCount: todayCount,
      totalCount: masteredCount,  // 使用去重后的已学数量
      masteredCount: masteredCount,
      masteryRate: masteryRate.toFixed(1),
      target: target,
      studyProgress: studyProgress.toFixed(1)
    });
    
    console.log('[Statistics] masteryRate:', masteryRate.toFixed(1) + '%');
    console.log('[Statistics] studyProgress:', studyProgress.toFixed(1) + '%');
  },

  /**
   * 计算已掌握单词数量（复习次数 >= 1 视为掌握，降低阈值便于演示）
   * 保留此方法供其他地方使用
   */
  calculateMasteredCount: function() {
    const records = review.getReviewRecords();
    // 复习次数 >= 1 次视为掌握
    const mastered = records.filter(record => record.reviewCount >= 1);
    return mastered.length;
  },

  /**
   * 加载打卡数据
   */
  loadCheckinStats: function() {
    const checkinInfo = storage.getCheckinInfo();
    
    // 计算总打卡天数
    const totalCheckins = this.calculateTotalCheckins();
    
    this.setData({
      continuousDays: checkinInfo.continuousDays,
      totalCheckins: totalCheckins
    });
  },

  /**
   * 计算总打卡天数
   */
  calculateTotalCheckins: function() {
    const checkinInfo = storage.getCheckinInfo();
    // 使用连续打卡天数作为总打卡天数（简化实现）
    // 实际应用中可以存储每日打卡记录
    return checkinInfo.continuousDays;
  },

  /**
   * 加载等级数据
   */
  loadLevelStats: function() {
    const levelStats = level.getHomeStats();
    
    this.setData({
      currentLevel: levelStats.level,
      currentXp: levelStats.currentXp,
      nextLevelXp: levelStats.maxXp
    });
  },

  /**
   * 加载复习数据
   */
  loadReviewStats: function() {
    const pendingCount = review.getPendingReviewCount();
    const completedCount = this.calculateCompletedReviews();
    
    this.setData({
      pendingReviewCount: pendingCount,
      completedReviewCount: completedCount
    });
  },

  /**
   * 计算已完成复习数量
   */
  calculateCompletedReviews: function() {
    const records = review.getReviewRecords();
    // 总复习次数 = 所有单词的复习次数之和
    const totalReviews = records.reduce((sum, record) => sum + record.reviewCount, 0);
    return totalReviews;
  },

  /**
   * 加载最近7天学习数据
   */
  loadWeeklyData: function() {
    // 从 storageManager 获取真实的学习历史数据
    const weeklyData = storage.getRecentStudyData(7);
    
    // 输出调试日志
    console.log('[Statistics] trendData:', JSON.stringify(weeklyData));
    console.log('[Statistics] trendData length:', weeklyData.length);
    
    // 不再过滤数据，显示最近7天的所有数据（包括未学习的日期）
    // 这样可以避免趋势图空白
    this.setData({
      weeklyData: weeklyData
    });
    console.log('[Statistics] 已设置 weeklyData:', JSON.stringify(weeklyData));
  },

  /**
   * 返回首页
   */
  goHome: function() {
    wx.navigateBack();
  },

  /**
   * 跳转到学习页面
   */
  goStudy: function() {
    wx.navigateTo({
      url: '/pages/study/study'
    });
  },

  /**
   * 跳转到复习页面
   */
  goReview: function() {
    wx.navigateTo({
      url: '/pages/review/review'
    });
  }
});
