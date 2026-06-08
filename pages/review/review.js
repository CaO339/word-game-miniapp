// 复习页面逻辑
const wordManager = require('../../utils/wordManager.js');
const reviewManager = require('../../utils/reviewManager.js');

// 获取词库管理器和复习管理器单例
const manager = wordManager.getWordManager();
const review = reviewManager.getReviewManager();

Page({
  data: {
    currentWord: {},      // 当前单词对象
    showAnswer: false,    // 是否显示答案
    showResultButtons: false, // 是否显示认识/不认识按钮
    pendingCount: 0,      // 待复习单词总数
    currentIndex: 0,      // 当前复习索引
    reviewWords: [],      // 待复习单词列表
    reviewCompleted: false, // 是否完成复习
    hasPendingWords: true // 是否有待复习单词
  },

  onLoad: function() {
    // 获取待复习单词列表
    this.loadReviewWords();
  },

  /**
   * 加载待复习单词列表
   */
  loadReviewWords: function() {
    // 获取所有单词列表
    const allWords = manager.getAllWords();
    
    // 获取待复习单词ID列表（用于验证数量）
    const pendingIds = review.getPendingReviewWordIds();
    
    // 获取今日待复习单词详情
    const pendingWords = review.getTodayReviewWords(allWords);
    
    // 使用ID列表的数量作为待复习数量（更准确）
    const actualPendingCount = pendingIds.length;
    
    if (actualPendingCount === 0) {
      // 没有待复习单词
      this.setData({
        reviewCompleted: false,
        hasPendingWords: false,
        pendingCount: 0,
        reviewWords: [],
        currentWord: {},
        currentIndex: 0,
        showAnswer: false,
        showResultButtons: false
      });
      return;
    }
    
    // 有待复习单词，开始复习
    // 调试：打印第一个复习单词
    console.log('[Review] 当前复习单词对象:', JSON.stringify(pendingWords[0]));
    
    this.setData({
      reviewCompleted: false,
      hasPendingWords: true,
      reviewWords: pendingWords,
      pendingCount: pendingWords.length,
      currentWord: pendingWords[0],
      currentIndex: 0,
      showAnswer: false,
      showResultButtons: false
    });
  },

  /**
   * 显示答案按钮点击事件
   */
  showAnswer: function() {
    this.setData({
      showAnswer: true,
      showResultButtons: true
    });
  },

  /**
   * 认识按钮点击事件
   */
  markKnown: function() {
    this.processReview(true);
  },

  /**
   * 不认识按钮点击事件
   */
  markUnknown: function() {
    this.processReview(false);
  },

  /**
   * 处理复习结果
   */
  processReview: function(isKnown) {
    const wordId = this.data.currentWord.id;
    
    // 更新复习记录
    review.handleReviewResult(wordId, isKnown);
    
    // 进入下一个单词或完成复习
    const nextIndex = this.data.currentIndex + 1;
    
    if (nextIndex >= this.data.reviewWords.length) {
      // 复习完成
      this.setData({
        reviewCompleted: true,
        showAnswer: false,
        showResultButtons: false
      });
    } else {
      // 继续下一个单词
      const nextWord = this.data.reviewWords[nextIndex];
      // 调试：打印下一个复习单词
      console.log('[Review] 下一个复习单词对象:', JSON.stringify(nextWord));
      this.setData({
        currentWord: nextWord,
        currentIndex: nextIndex,
        showAnswer: false,
        showResultButtons: false
      });
    }
  },

  /**
   * 返回首页按钮点击事件
   */
  goHome: function() {
    wx.navigateTo({
      url: '/pages/index/index'
    });
  },

  /**
   * 继续复习按钮点击事件（完成后重新加载）
   */
  continueReview: function() {
    this.loadReviewWords();
  }
});
