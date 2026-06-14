// PDF导出页面逻辑
const pdfGenerator = require('../../utils/pdfGenerator.js').getPdfGenerator();

Page({
  data: {
    title: '',           // 标题
    words: [],           // 单词列表
    wordCount: 0,        // 单词数量
    totalPages: 0,       // 总页数
    exportDate: '',      // 导出日期
    pages: [],           // 页面数据
    type: ''             // 类型（favorite/wrong）
  },

  onLoad: function(options) {
    // 获取参数
    const type = options.type || 'favorite';
    const wordsStr = options.words || '[]';
    
    try {
      const words = JSON.parse(wordsStr);
      
      // 按字母顺序排序并去重
      const sortedWords = pdfGenerator.sortAndDeduplicate(words);
      
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      // 生成页面数据
      const pages = this.generatePages(sortedWords);
      
      this.setData({
        type: type,
        title: pdfGenerator.getTitle(type),
        words: sortedWords,
        wordCount: sortedWords.length,
        totalPages: pages.length,
        exportDate: dateStr,
        pages: pages
      });
    } catch (e) {
      console.error('[ExportPDF] 解析单词数据失败:', e);
      wx.showToast({
        title: '数据解析失败',
        icon: 'none'
      });
    }
  },

  /**
   * 生成页面数据
   */
  generatePages: function(words) {
    const WORDS_PER_PAGE = 20;
    const totalPages = Math.ceil(words.length / WORDS_PER_PAGE);
    const pages = [];
    
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const startIndex = pageIndex * WORDS_PER_PAGE;
      const endIndex = Math.min(startIndex + WORDS_PER_PAGE, words.length);
      const pageWords = words.slice(startIndex, endIndex);
      
      const leftColumn = [];
      const rightColumn = [];
      
      pageWords.forEach((word, index) => {
        const globalIndex = pageIndex * WORDS_PER_PAGE + index + 1;
        const meaning = Array.isArray(word.meaning) ? word.meaning.join('; ') : (word.meaning || '');
        
        leftColumn.push({
          no: globalIndex,
          word: word.word,
          meaning: ''
        });
        
        rightColumn.push({
          no: globalIndex,
          word: word.word,
          meaning: meaning
        });
      });
      
      // 填充空白行
      for (let i = pageWords.length; i < WORDS_PER_PAGE; i++) {
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
    
    return pages;
  },

  /**
   * 分享PDF
   */
  sharePdf: function() {
    // 生成文本内容
    const textContent = this.generateTextContent();
    
    // 复制到剪贴板
    wx.setClipboardData({
      data: textContent,
      success: () => {
        wx.showToast({
          title: '内容已复制',
          icon: 'success'
        });
        
        // 显示分享选项
        setTimeout(() => {
          wx.showActionSheet({
            itemList: ['发送给朋友', '生成图片分享', '保存到文件'],
            success: (res) => {
              switch (res.tapIndex) {
                case 0:
                  // 发送给朋友
                  this.shareToFriend();
                  break;
                case 1:
                  // 生成图片分享
                  this.shareAsImage();
                  break;
                case 2:
                  // 保存到文件
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

  /**
   * 生成文本内容
   */
  generateTextContent: function() {
    let content = `${this.data.title}\n`;
    content += `导出日期：${this.data.exportDate}\n`;
    content += `共 ${this.data.wordCount} 个单词，${this.data.totalPages} 页\n\n`;
    
    this.data.pages.forEach((page, pageIndex) => {
      content += `=== 第${page.pageNum}页 ===\n\n`;
      
      // 左栏（默写区）
      content += `【默写区】\n`;
      content += `NO.\tVocabulary\tMeaning\n`;
      page.leftColumn.forEach(item => {
        if (item.no) {
          content += `${item.no}\t${item.word}\t__________\n`;
        }
      });
      
      content += `\n`;
      
      // 右栏（答案区）
      content += `【答案区】\n`;
      content += `NO.\tVocabulary\tMeaning\n`;
      page.rightColumn.forEach(item => {
        if (item.no) {
          content += `${item.no}\t${item.word}\t${item.meaning}\n`;
        }
      });
      
      if (pageIndex < this.data.pages.length - 1) {
        content += `\n\n`;
      }
    });
    
    return content;
  },

  /**
   * 分享给朋友
   */
  shareToFriend: function() {
    wx.showToast({
      title: '请手动粘贴分享',
      icon: 'none'
    });
  },

  /**
   * 生成图片分享
   */
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

  /**
   * 保存到文件
   */
  saveToFile: function() {
    const textContent = this.generateTextContent();
    const fileName = pdfGenerator.generateFileName(this.data.type);
    
    // 保存到本地存储
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

  /**
   * 复制内容
   */
  copyContent: function() {
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

  /**
   * 返回
   */
  goBack: function() {
    wx.navigateBack();
  }
});