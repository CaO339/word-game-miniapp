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
    displayWordList: [],     // 当前显示的单词列表（分页用）
    
    // 搜索
    searchKeyword: '',
    
    // 状态过滤
    currentFilter: 'all',  // all: 全部, learned: 已学, pending: 待复习, notLearned: 未学
    
    // 分页控制
    pageSize: 100,          // 每页加载数量
    currentPage: 0,         // 当前页码
    hasMore: true           // 是否还有更多数据
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
    
    console.log('词库总数:', allWords.length);
    console.log('第一条单词:', allWords[0]);
    
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
    
    // 更新页面数据（重置分页）
    this.setData({
      totalCount: wordList.length,
      learnedCount: learnedCount,
      pendingReviewCount: pendingReviewCount,
      notLearnedCount: notLearnedCount,
      wordList: wordList,
      filteredWordList: wordList,
      currentPage: 0,
      hasMore: true
    });
    
    // 加载第一页数据
    this.loadNextPage();
  },

  /**
   * 加载下一页数据
   */
  loadNextPage: function() {
    const { filteredWordList, currentPage, pageSize, displayWordList } = this.data;
    
    if (!this.data.hasMore) return;
    
    const start = currentPage * pageSize;
    const end = start + pageSize;
    const newItems = filteredWordList.slice(start, end);
    
    if (newItems.length === 0) {
      this.setData({
        hasMore: false
      });
      return;
    }
    
    this.setData({
      displayWordList: [...displayWordList, ...newItems],
      currentPage: currentPage + 1,
      hasMore: end < filteredWordList.length
    });
  },

  /**
   * 滚动到底部加载更多
   */
  onScrollToLower: function() {
    console.log('滚动到底部，加载更多');
    this.loadNextPage();
  },

  /**
   * 搜索输入事件
   */
  onSearchInput: function(e) {
    const keyword = e.detail.value.toLowerCase();
    this.setData({
      searchKeyword: keyword,
      currentPage: 0,
      displayWordList: [],
      hasMore: true
    });
    this.filterWords();
  },

  /**
   * 清除搜索
   */
  onClearSearch: function() {
    this.setData({
      searchKeyword: '',
      currentPage: 0,
      displayWordList: [],
      hasMore: true
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
    
    // 重置分页并加载第一页
    this.setData({
      filteredWordList: filtered,
      currentPage: 0,
      displayWordList: [],
      hasMore: true
    });
    
    // 加载第一页
    this.loadNextPage();
  },

  /**
   * 切换状态筛选
   */
  onFilterChange: function(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({
      currentFilter: filter,
      currentPage: 0,
      displayWordList: [],
      hasMore: true
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
