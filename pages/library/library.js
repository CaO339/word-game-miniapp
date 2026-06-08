// 词库浏览页面逻辑
const storageManager = require('../../utils/storageManager.js');
const reviewManager = require('../../utils/reviewManager.js');
const wordManager = require('../../utils/wordManager.js');

// 获取管理器单例
const storage = storageManager.getStorageManager();
const review = reviewManager.getReviewManager();
const wordMgr = wordManager.getWordManager();

Page({
  data: {
    // 统计数据
    totalCount: 0,           // 总词数
    learnedCount: 0,         // 已学数量
    pendingReviewCount: 0,   // 待复习数量
    notLearnedCount: 0,      // 未学数量
    
    // 单词列表
    wordList: [],
    filteredWordList: [],
    
    // 搜索
    searchKeyword: '',
    
    // 状态过滤
    currentFilter: 'all'  // all: 全部, learned: 已学, pending: 待复习, notLearned: 未学
  },

  onLoad: function() {
    this.loadWordLibrary();
  },

  onShow: function() {
    // 每次显示页面时刷新数据
    this.loadWordLibrary();
  },

  /**
   * 加载词库数据
   */
  loadWordLibrary: function() {
    // 获取完整词库
    const allWords = wordMgr.getAllWords();
    
    // 获取已学习单词ID列表
    const learnedWordIds = storage.getLearnedWordIds();
    
    // 获取待复习单词ID列表
    const pendingReviewWordIds = review.getPendingReviewWordIds();
    
    // 为每个单词标记状态
    const wordList = allWords.map(word => {
      const wordId = word.id;
      const isLearned = learnedWordIds.includes(wordId);
      const isPendingReview = pendingReviewWordIds.includes(wordId);
      
      let status = 'notLearned';  // 默认未学
      if (isPendingReview) {
        status = 'pendingReview';
      } else if (isLearned) {
        status = 'learned';
      }
      
      return {
        ...word,
        status: status
      };
    });
    
    // 统计数量
    const learnedCount = wordList.filter(w => w.status === 'learned').length;
    const pendingReviewCount = wordList.filter(w => w.status === 'pendingReview').length;
    const notLearnedCount = wordList.filter(w => w.status === 'notLearned').length;
    
    // 更新页面数据
    this.setData({
      totalCount: wordList.length,
      learnedCount: learnedCount,
      pendingReviewCount: pendingReviewCount,
      notLearnedCount: notLearnedCount,
      wordList: wordList,
      filteredWordList: wordList
    });
  },

  /**
   * 搜索输入事件
   */
  onSearchInput: function(e) {
    const keyword = e.detail.value.toLowerCase();
    this.setData({
      searchKeyword: keyword
    });
    this.filterWords();
  },

  /**
   * 清除搜索
   */
  onClearSearch: function() {
    this.setData({
      searchKeyword: ''
    });
    this.filterWords();
  },

  /**
   * 筛选单词
   */
  filterWords: function() {
    const { wordList, searchKeyword, currentFilter } = this.data;
    
    let filtered = wordList;
    
    // 按状态筛选
    if (currentFilter !== 'all') {
      filtered = filtered.filter(word => word.status === currentFilter);
    }
    
    // 按关键词搜索
    if (searchKeyword) {
      filtered = filtered.filter(word => 
        word.english.toLowerCase().includes(searchKeyword) ||
        word.chinese.toLowerCase().includes(searchKeyword)
      );
    }
    
    this.setData({
      filteredWordList: filtered
    });
  },

  /**
   * 切换状态筛选
   */
  onFilterChange: function(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({
      currentFilter: filter
    });
    this.filterWords();
  },

  /**
   * 返回首页
   */
  goHome: function() {
    wx.navigateBack();
  }
});
