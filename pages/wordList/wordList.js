// wordList.js - 词库单词浏览页面
const wordManager = require('../../utils/wordManager.js');

Page({
  data: {
    libraryName: '',           // 当前词库名称
    totalWords: 0,             // 总单词数
    words: [],                 // 完整单词列表（不显示）
    displayWords: [],          // 当前显示的单词列表
    searchText: '',            // 搜索关键词
    filteredWords: [],         // 过滤后的完整单词列表
    loading: true,             // 是否正在加载
    loadingMore: false,        // 是否正在加载更多
    hasMore: true,             // 是否还有更多数据
    pageSize: 100,             // 每页加载数量
    scrollIntoView: '',        // 滚动定位目标
    alphabetIndex: []          // 字母索引（只包含有单词的字母）
  },

  onLoad: function() {
    console.log('[WordList] onLoad - 页面加载');
  },

  onShow: function() {
    console.log('[WordList] onShow - 页面显示');
    this.loadWordList();
  },

  // 加载单词列表（分页加载）
  loadWordList: function() {
    console.log('[WordList] loadWordList - 开始加载单词列表');
    
    // 设置加载状态
    this.setData({ loading: true, hasMore: true });
    
    const wordMgr = wordManager.getWordManager();
    
    if (!wordMgr) {
      console.error('[WordList] loadWordList - wordManager 为 null');
      this.setData({ 
        loading: false,
        totalWords: 0,
        words: [],
        displayWords: [],
        filteredWords: []
      });
      return;
    }
    
    // 使用 getTotalCount() 获取词库总单词数
    const totalCount = wordMgr.getTotalCount();
    console.log('[WordList] loadWordList - getTotalCount返回:', totalCount);
    
    // 关键修复：确保词库已加载
    const allWords = this.ensureLibraryLoaded(wordMgr);
    console.log('[WordList] 词库总数=', allWords.length);
    
    const libraryName = wordMgr.getLibraryName();
    console.log('[WordList] loadWordList - 当前词库名称:', libraryName);
    
    // 确保是数组
    const wordsArray = Array.isArray(allWords) ? allWords : [];
    
    // 按字母排序
    const sortedWords = this.sortWordsByLetter(wordsArray);
    
    // 生成字母索引
    const alphabetIndex = this.generateAlphabetIndex(sortedWords);
    
    // 分页加载：只加载前100条（标记首字母）
    const pageSize = this.data.pageSize;
    const displayWords = this.markFirstLetterWords(sortedWords.slice(0, pageSize));
    const hasMore = sortedWords.length > pageSize;
    
    console.log('[WordList] 当前渲染=', displayWords.length);
    
    this.setData({
      libraryName: libraryName,
      totalWords: totalCount,
      words: sortedWords,           // 存储排序后的完整列表
      filteredWords: sortedWords,   // 存储排序后的完整列表
      displayWords: displayWords,   // 已标记首字母的显示列表
      alphabetIndex: alphabetIndex, // 字母索引
      loading: false,
      hasMore: hasMore
    });
    
    console.log('[WordList] loadWordList - 数据设置完成');
  },

  /**
   * 确保词库已加载
   */
  ensureLibraryLoaded: function(wordMgr) {
    let allWords = wordMgr.getAllWords();
    
    if (!Array.isArray(allWords) || allWords.length === 0) {
      console.log('[WordList] ensureLibraryLoaded - 当前词库为空，尝试重新加载');
      
      const libraryKey = wordMgr.getLibraryKey();
      const libraryData = wordManager.getLibraryData(libraryKey);
      console.log('[WordList] ensureLibraryLoaded - 从getLibraryData获取:', libraryData ? libraryData.length : 0);
      
      if (Array.isArray(libraryData) && libraryData.length > 0) {
        return libraryData;
      }
      
      return [];
    }
    
    return allWords;
  },
  
  // 按字母排序单词数组
  sortWordsByLetter: function(words) {
    return [...words].sort((a, b) => {
      const wordA = (a.word || '').toUpperCase();
      const wordB = (b.word || '').toUpperCase();
      return wordA.localeCompare(wordB);
    });
  },
  
  // 生成字母索引（只包含有单词的字母）
  generateAlphabetIndex: function(words) {
    const letters = new Set();
    words.forEach(word => {
      if (word && word.word && word.word.length > 0) {
        const firstLetter = word.word.charAt(0).toUpperCase();
        if (/[A-Z]/.test(firstLetter)) {
          letters.add(firstLetter);
        }
      }
    });
    return Array.from(letters).sort();
  },
  
  // 给单词添加首字母标记（用于 wxml 判断是否添加锚点）
  markFirstLetterWords: function(words) {
    const marked = [];
    let lastLetter = '';
    
    words.forEach(word => {
      if (word && word.word && word.word.length > 0) {
        const firstLetter = word.word.charAt(0).toUpperCase();
        if (/[A-Z]/.test(firstLetter) && firstLetter !== lastLetter) {
          marked.push({ ...word, isFirstLetter: true, firstLetter });
          lastLetter = firstLetter;
        } else {
          marked.push({ ...word, isFirstLetter: false, firstLetter: '' });
        }
      } else {
        marked.push({ ...word, isFirstLetter: false, firstLetter: '' });
      }
    });
    
    return marked;
  },
  
  // 点击字母跳转
  jumpToLetter: function(e) {
    const letter = e.currentTarget.dataset.letter;
    this.setData({
      scrollIntoView: `letter-${letter}`
    });
  },

  // 搜索单词
  searchWords: function(e) {
    const searchText = e.detail.value.toLowerCase();
    console.log('[WordList] 搜索关键词:', searchText);
    
    let filteredWords = this.data.words;
    
    if (searchText.trim() && Array.isArray(this.data.words)) {
      filteredWords = this.data.words.filter(word => {
        if (!word) return false;
        const wordMatch = word.word && word.word.toLowerCase().includes(searchText);
        const meaningMatch = word.meaning && word.meaning.toLowerCase().includes(searchText);
        return wordMatch || meaningMatch;
      });
    }
    
    // 搜索结果也排序并标记
    const sortedFiltered = this.sortWordsByLetter(filteredWords);
    const alphabetIndex = this.generateAlphabetIndex(sortedFiltered);
    
    // 搜索时也分页加载
    const pageSize = this.data.pageSize;
    const displayWords = this.markFirstLetterWords(sortedFiltered.slice(0, pageSize));
    const hasMore = sortedFiltered.length > pageSize;
    
    this.setData({
      searchText: searchText,
      filteredWords: sortedFiltered,
      displayWords: displayWords,
      alphabetIndex: alphabetIndex,
      hasMore: hasMore
    });
    
    console.log('[WordList] 搜索结果数量:', filteredWords.length);
    console.log('[WordList] 当前渲染=', displayWords.length);
  },

  // 加载更多
  loadMore: function() {
    if (this.data.loadingMore || !this.data.hasMore) {
      return;
    }
    
    console.log('[WordList] loadMore - 加载更多');
    
    this.setData({ loadingMore: true });
    
    const currentLength = this.data.displayWords.length;
    const totalLength = this.data.filteredWords.length;
    const pageSize = this.data.pageSize;
    
    // 加载下一页（需要标记首字母）
    const nextWords = this.markFirstLetterWords(this.data.filteredWords.slice(currentLength, currentLength + pageSize));
    const newDisplayWords = [...this.data.displayWords, ...nextWords];
    const hasMore = newDisplayWords.length < totalLength;
    
    console.log('[WordList] loadMore - 当前渲染:', newDisplayWords.length);
    
    setTimeout(() => {
      this.setData({
        displayWords: newDisplayWords,
        loadingMore: false,
        hasMore: hasMore
      });
    }, 100);
  },

  // 返回上一页
  goBack: function() {
    wx.navigateBack();
  },

  // 跳转到首页
  goHome: function() {
    wx.navigateBack();
  }
});
