// library.js - 词库管理页面
const wordManager = require('../../utils/wordManager.js');

Page({
  data: {
    fixedLibraries: [],      // 固定词库
    customLibraries: [],     // 自定义词库
    showImportModal: false,  // 显示导入弹窗
    importType: 'json',      // 导入类型 (json/txt/csv)
    libraryName: '',         // 词库名称
    fileContent: '',         // 文件内容
    uploading: false         // 是否正在上传
  },

  onLoad: function() {
    this.loadLibraries();
  },

  onShow: function() {
    this.loadLibraries();
  },

  // 加载词库列表
  loadLibraries: function() {
    const allLibraries = wordManager.getLibraryList();
    
    // 分离固定词库和自定义词库
    const fixedLibraries = allLibraries.filter(item => item.type === 'fixed');
    const customLibraries = allLibraries.filter(item => item.type === 'custom');
    
    this.setData({
      fixedLibraries: fixedLibraries,
      customLibraries: customLibraries
    });
    
    console.log('[Library] 固定词库:', fixedLibraries);
    console.log('[Library] 自定义词库:', customLibraries);
  },

  // 选择词库
  selectLibrary: function(e) {
    const libraryKey = e.currentTarget.dataset.key;
    const wordMgr = wordManager.getWordManager();
    
    wordMgr.switchLibrary(libraryKey);
    
    // 返回首页
    wx.navigateBack({
      success: () => {
        wx.showToast({
          title: '词库切换成功',
          icon: 'success'
        });
      }
    });
  },

  // 删除自定义词库
  deleteLibrary: function(e) {
    const libraryKey = e.currentTarget.dataset.key;
    const libraryName = e.currentTarget.dataset.name;
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除词库 "${libraryName}" 吗？删除后无法恢复。`,
      success: (res) => {
        if (res.confirm) {
          const result = wordManager.removeCustomLibrary(libraryKey);
          if (result) {
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
            this.loadLibraries();
          } else {
            wx.showToast({
              title: '删除失败',
              icon: 'error'
            });
          }
        }
      }
    });
  },

  // 编辑词库名称
  editLibraryName: function(e) {
    const libraryKey = e.currentTarget.dataset.key;
    const currentName = e.currentTarget.dataset.name;
    
    wx.showModal({
      title: '编辑词库名称',
      editable: true,
      placeholderText: '请输入新词库名称',
      defaultValue: currentName,
      success: (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          const result = wordManager.updateCustomLibraryName(libraryKey, res.content.trim());
          if (result) {
            wx.showToast({
              title: '修改成功',
              icon: 'success'
            });
            this.loadLibraries();
          } else {
            wx.showToast({
              title: '修改失败',
              icon: 'error'
            });
          }
        }
      }
    });
  },

  // 显示导入弹窗
  showImportModal: function(e) {
    const importType = e.currentTarget.dataset.type;
    this.setData({
      showImportModal: true,
      importType: importType,
      libraryName: '',
      fileContent: ''
    });
  },

  // 关闭导入弹窗
  closeImportModal: function() {
    this.setData({
      showImportModal: false,
      importType: 'json',
      libraryName: '',
      fileContent: ''
    });
  },

  // 输入词库名称
  inputLibraryName: function(e) {
    this.setData({
      libraryName: e.detail.value
    });
  },

  // 输入文件内容
  inputFileContent: function(e) {
    this.setData({
      fileContent: e.detail.value
    });
  },

  // 选择文件
  chooseFile: function() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: (res) => {
        const file = res.tempFiles[0];
        const fileName = file.name.toLowerCase();
        
        // 检查文件类型
        let importType = 'json';
        if (fileName.endsWith('.txt')) {
          importType = 'txt';
        } else if (fileName.endsWith('.csv')) {
          importType = 'csv';
        } else if (!fileName.endsWith('.json')) {
          wx.showToast({
            title: '不支持的文件类型',
            icon: 'error'
          });
          return;
        }
        
        this.setData({
          importType: importType,
          libraryName: fileName.replace(/\.[^/.]+$/, '') // 去除扩展名
        });
        
        // 读取文件内容
        const fileManager = wx.getFileSystemManager();
        fileManager.readFile({
          filePath: file.path,
          encoding: 'utf-8',
          success: (result) => {
            this.setData({
              fileContent: result.data
            });
          },
          fail: (err) => {
            console.error('[Library] 读取文件失败:', err);
            wx.showToast({
              title: '读取文件失败',
              icon: 'error'
            });
          }
        });
      },
      fail: () => {
        wx.showToast({
          title: '选择文件失败',
          icon: 'error'
        });
      }
    });
  },

  // 导入词库
  importLibrary: function() {
    const { importType, libraryName, fileContent } = this.data;
    
    if (!libraryName.trim()) {
      wx.showToast({
        title: '请输入词库名称',
        icon: 'none'
      });
      return;
    }
    
    if (!fileContent.trim()) {
      wx.showToast({
        title: '请输入词库内容',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ uploading: true });
    
    try {
      let words = [];
      let startId = Date.now(); // 使用时间戳作为起始ID
      
      if (importType === 'json') {
        // JSON格式: [{"word": "xxx", "translations": [{"translation": "xxx", "type": "n"}]}]
        const jsonData = JSON.parse(fileContent);
        words = wordManager.convertJsonToWords(jsonData, startId);
      } else if (importType === 'txt') {
        // TXT格式: 每行一个单词，格式为 "word 翻译" 或 "word|翻译"
        const lines = fileContent.split('\n').filter(line => line.trim());
        words = lines.map((line, index) => {
          let word = '';
          let meaning = '';
          const parts = line.split(/[\t|]/);
          if (parts.length >= 2) {
            word = parts[0].trim();
            meaning = parts[1].trim();
          } else {
            const spaceIndex = line.indexOf(' ');
            if (spaceIndex > 0) {
              word = line.substring(0, spaceIndex).trim();
              meaning = line.substring(spaceIndex + 1).trim();
            } else {
              word = line.trim();
              meaning = '';
            }
          }
          return {
            word: word,
            id: startId + index + 1,
            english: word,
            meaning: meaning,
            partOfSpeech: '',
            collocation: '',
            chinese: meaning
          };
        });
      } else if (importType === 'csv') {
        // CSV格式: word,meaning,partOfSpeech
        const lines = fileContent.split('\n').filter(line => line.trim());
        words = lines.slice(1).map((line, index) => { // 跳过标题行
          const parts = line.split(',');
          const word = parts[0]?.trim() || '';
          const meaning = parts[1]?.trim() || '';
          const partOfSpeech = parts[2]?.trim() || '';
          return {
            word: word,
            id: startId + index + 1,
            english: word,
            meaning: meaning,
            partOfSpeech: partOfSpeech,
            collocation: '',
            chinese: meaning
          };
        }).filter(item => item.word);
      }
      
      if (words.length === 0) {
        wx.showToast({
          title: '未解析到单词',
          icon: 'error'
        });
        this.setData({ uploading: false });
        return;
      }
      
      // 生成唯一ID
      const libraryId = 'custom_' + Date.now();
      
      // 添加词库
      const result = wordManager.addCustomLibrary(libraryId, libraryName.trim(), words);
      
      if (result) {
        wx.showToast({
          title: '导入成功',
          icon: 'success'
        });
        this.closeImportModal();
        this.loadLibraries();
      } else {
        wx.showToast({
          title: '导入失败',
          icon: 'error'
        });
      }
    } catch (e) {
      console.error('[Library] 导入词库失败:', e);
      wx.showToast({
        title: '解析失败: ' + e.message,
        icon: 'error'
      });
    } finally {
      this.setData({ uploading: false });
    }
  },

  // 跳转到首页
  goHome: function() {
    wx.navigateBack();
  }
});
