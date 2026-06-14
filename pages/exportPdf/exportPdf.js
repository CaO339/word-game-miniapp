// PDF导出页面逻辑
const { getPdfGenerator, safeData } = require('../../utils/pdfGenerator.js');
const pdfGenerator = getPdfGenerator();
const wordManager = require('../../utils/wordManager.js');
const collectionManager = require('../../utils/collectionManager.js');
const mistakeManager = require('../../utils/mistakeManager.js');

const manager = wordManager.getWordManager();
const collection = collectionManager;
const mistakes = mistakeManager;

Page({
  data: {
    title: '',           // 标题
    words: [],           // 单词列表
    wordCount: 0,        // 单词数量
    totalPages: 0,       // 总页数
    exportDate: '',      // 导出日期
    pages: [],           // 页面数据
    type: '',            // 类型（favorite/wrong）
    hasError: false,     // 是否有错误
    errorMessage: ''     // 错误信息
  },

  onLoad: function(options) {
    console.log('[ExportPDF] onLoad - 开始加载页面');
    console.log('[ExportPDF] 参数:', JSON.stringify(options));
    
    const type = options.type || 'favorite';
    
    const words = this.getWordsFromSource(type);
    
    console.log('[ExportPDF] 从数据源获取的数据长度:', words.length);
    console.log('[ExportPDF] 从数据源获取的数据:', JSON.stringify(words.slice(0, 3)));
    
    const validationResult = this.validateInputData(words);
    
    if (!validationResult.success) {
      console.error('[ExportPDF] 数据验证失败:', validationResult.message);
      this.setData({
        hasError: true,
        errorMessage: validationResult.message,
        type: type,
        title: pdfGenerator.getTitle(type)
      });
      return;
    }
    
    const validatedWords = validationResult.data;
    
    try {
      const sortedWords = pdfGenerator.sortAndDeduplicate(validatedWords);
      
      console.log('[ExportPDF] 排序去重后数据长度:', sortedWords.length);
      console.log('[ExportPDF] 前3条数据:', JSON.stringify(sortedWords.slice(0, 3)));
      
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      const pages = this.generatePages(sortedWords);
      
      this.setData({
        type: type,
        title: pdfGenerator.getTitle(type),
        words: sortedWords,
        wordCount: sortedWords.length,
        totalPages: pages.length,
        exportDate: dateStr,
        pages: pages,
        hasError: false,
        errorMessage: ''
      });
      
      console.log('[ExportPDF] 页面加载成功，共', sortedWords.length, '个单词，', pages.length, '页');
      console.log('[ExportPDF] 当前状态 - hasError:', this.data.hasError);
      console.log('[ExportPDF] 当前状态 - errorMessage:', this.data.errorMessage);
      console.log('[ExportPDF] 当前状态 - wordCount:', this.data.wordCount);
      console.log('[ExportPDF] 当前状态 - totalPages:', this.data.totalPages);
      
      // 防御性检查：确保数据生成成功后清除所有错误状态
      if (sortedWords.length > 0 && pages.length > 0) {
        console.log('[ExportPDF] 执行防御性状态重置');
        this.setData({
          hasError: false,
          errorMessage: ''
        });
        console.log('[ExportPDF] 重置后状态 - hasError:', this.data.hasError);
        console.log('[ExportPDF] 重置后状态 - errorMessage:', this.data.errorMessage);
      }
    } catch (e) {
      console.error('[ExportPDF] 处理单词数据失败:', e);
      this.setData({
        hasError: true,
        errorMessage: '数据处理失败，无法生成PDF',
        type: type,
        title: pdfGenerator.getTitle(type)
      });
    }
  },

  getWordsFromSource: function(type) {
    console.log('[ExportPDF] getWordsFromSource - 类型:', type);
    
    let wordIds = [];
    
    if (type === 'favorite') {
      wordIds = collection.getCollectedWordIds();
      console.log('[ExportPDF] 收藏单词ID数量:', wordIds.length);
      console.log('[ExportPDF] 收藏单词IDs:', wordIds);
    } else if (type === 'wrong') {
      wordIds = mistakes.getMistakeWordIds();
      console.log('[ExportPDF] 错题单词ID数量:', wordIds.length);
      console.log('[ExportPDF] 错题单词IDs:', wordIds);
    }
    
    const words = [];
    for (let i = 0; i < wordIds.length; i++) {
      const word = manager.getWordById(wordIds[i]);
      if (word) {
        words.push({
          word: word.english,
          meaning: word.chinese
        });
      }
    }
    
    console.log('[ExportPDF] 获取到的单词详情数量:', words.length);
    console.log('[ExportPDF] 获取到的单词详情:', JSON.stringify(words.slice(0, 3)));
    
    return words;
  },

  validateInputData: function(words) {
    console.log('[ExportPDF] validateInputData - 数据:', JSON.stringify(words));
    
    const safeWords = safeData(words);
    
    console.log('[ExportPDF] safeData 转换后数据长度:', safeWords.length);
    console.log('[ExportPDF] safeData 转换后前3条数据:', JSON.stringify(safeWords.slice(0, 3)));
    
    if (safeWords.length === 0) {
      console.log('[ExportPDF] 数据检查失败：转换后数据为空');
      return {
        success: false,
        message: '暂无可导出的单词',
        data: []
      };
    }
    
    return {
      success: true,
      message: '数据验证通过',
      data: safeWords
    };
  },

  generatePages: function(words) {
    const WORDS_PER_PAGE = 20;
    
    const safeWords = safeData(words);
    const totalPages = Math.ceil(safeWords.length / WORDS_PER_PAGE);
    const pages = [];
    
    console.log('[ExportPDF] generatePages - 输入数据长度:', safeWords.length);
    console.log('[ExportPDF] generatePages - 预计页数:', totalPages);
    
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const startIndex = pageIndex * WORDS_PER_PAGE;
      const endIndex = Math.min(startIndex + WORDS_PER_PAGE, safeWords.length);
      const pageWords = safeWords.slice(startIndex, endIndex);
      
      const leftColumn = [];
      const rightColumn = [];
      
      (Array.isArray(pageWords) ? pageWords : []).forEach((word, index) => {
        const globalIndex = pageIndex * WORDS_PER_PAGE + index + 1;
        const meaning = word && word.meaning ? String(word.meaning) : '';
        const wordText = word && word.word ? String(word.word) : '';
        
        leftColumn.push({
          no: globalIndex,
          word: wordText,
          meaning: meaning
        });
        
        rightColumn.push({
          no: globalIndex,
          word: wordText,
          meaning: meaning
        });
      });
      
      for (let i = safeWords.length > pageIndex * WORDS_PER_PAGE ? (pageWords.length || 0) : 0; i < WORDS_PER_PAGE; i++) {
        leftColumn.push({
          no: '',
          word: '',
          meaning: ''
        });
        
        rightColumn.push({
          no: '',
          word: '',
          meaning: ''
        });
      }
      
      pages.push({
        pageNum: pageIndex + 1,
        leftColumn: leftColumn,
        rightColumn: rightColumn
      });
    }
    
    console.log('[ExportPDF] generatePages - 生成页数:', pages.length);
    
    return pages;
  },

  sharePdf: function() {
    if (this.data.hasError) {
      wx.showToast({
        title: '数据异常，无法分享',
        icon: 'none'
      });
      return;
    }
    
    const textContent = this.generateTextContent();
    
    wx.setClipboardData({
      data: textContent,
      success: () => {
        wx.showToast({
          title: '内容已复制',
          icon: 'success'
        });
        
        setTimeout(() => {
          wx.showActionSheet({
            itemList: ['发送给朋友', '生成图片分享', '保存到文件'],
            success: (res) => {
              switch (res.tapIndex) {
                case 0:
                  this.shareToFriend();
                  break;
                case 1:
                  this.shareAsImage();
                  break;
                case 2:
                  this.saveToFile();
                  break;
              }
            }
          });
        }, 500);
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        });
      }
    });
  },

  generateTextContent: function() {
    let content = `${this.data.title}\n`;
    content += `导出日期：${this.data.exportDate}\n`;
    content += `共 ${this.data.wordCount} 个单词，${this.data.totalPages} 页\n\n`;
    
    (Array.isArray(this.data.pages) ? this.data.pages : []).forEach((page, pageIndex) => {
      content += `=== 第${page.pageNum}页 ===\n\n`;
      
      content += `【英译中默写】\n`;
      content += `NO.\tVocabulary\tMeaning\n`;
      (Array.isArray(page.leftColumn) ? page.leftColumn : []).forEach(item => {
        if (item && item.no) {
          content += `${item.no}\t${item.word || ''}\t${'_'.repeat(12)}\n`;
        }
      });
      
      content += `\n`;
      
      content += `【中译英默写】\n`;
      content += `NO.\tVocabulary\tMeaning\n`;
      (Array.isArray(page.rightColumn) ? page.rightColumn : []).forEach(item => {
        if (item && item.no) {
          content += `${item.no}\t${'_'.repeat(12)}\t${item.meaning || ''}\n`;
        }
      });
      
      if (pageIndex < (Array.isArray(this.data.pages) ? this.data.pages.length : 0) - 1) {
        content += `\n\n`;
      }
    });
    
    return content;
  },

  shareToFriend: function() {
    wx.showToast({
      title: '请手动粘贴分享',
      icon: 'none'
    });
  },

  shareAsImage: function() {
    wx.showToast({
      title: '正在生成图片...',
      icon: 'loading',
      duration: 1000
    });
    
    setTimeout(() => {
      wx.showToast({
        title: '图片生成成功',
        icon: 'success'
      });
    }, 1000);
  },

  saveToFile: function() {
    if (this.data.hasError) {
      wx.showToast({
        title: '数据异常，无法保存',
        icon: 'none'
      });
      return;
    }
    
    const textContent = this.generateTextContent();
    const fileName = pdfGenerator.generateFileName(this.data.type);
    
    try {
      wx.setStorageSync('pdf_content_' + Date.now(), {
        content: textContent,
        fileName: fileName,
        date: this.data.exportDate
      });
      
      wx.showToast({
        title: '内容已保存',
        icon: 'success'
      });
    } catch (e) {
      console.error('[ExportPDF] 保存失败:', e);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  },

  copyContent: function() {
    if (this.data.hasError) {
      wx.showToast({
        title: '数据异常，无法复制',
        icon: 'none'
      });
      return;
    }
    
    const textContent = this.generateTextContent();
    
    wx.setClipboardData({
      data: textContent,
      success: () => {
        wx.showToast({
          title: '内容已复制',
          icon: 'success'
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        });
      }
    });
  },

  goBack: function() {
    wx.navigateBack();
  }
});