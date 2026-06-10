// 复习管理器 - 基于艾宾浩斯遗忘曲线的复习系统

// 存储键名常量
const STORAGE_KEY_PREFIX = 'wm_review_records_';

// 开发测试模式标志（开发完成后设为 false）
const DEV_MODE = false;

/**
 * 复习记录数据结构：
 * {
 *   wordId: number,           // 单词ID
 *   reviewCount: number,      // 复习次数
 *   lastStudyTime: string,    // 上次学习时间 (ISO格式)
 *   nextReviewTime: string    // 下次复习时间 (ISO格式)
 * }
 */

/**
 * 艾宾浩斯遗忘曲线复习间隔（单位：毫秒）
 * 
 * 正式模式：
 * 第1次：10分钟后复习
 * 第2次：1天后复习
 * 第3次：3天后复习
 * 第4次：7天后复习
 * 第5次：15天后复习
 * 第6次及以上：30天后复习
 * 
 * 开发测试模式：
 * 第1次：10秒后复习
 * 第2次：20秒后复习
 * 第3次：30秒后复习
 * 第4次：40秒后复习
 * 第5次及以上：50秒后复习
 */
let REVIEW_INTERVALS = [
  10 * 60 * 1000,      // 10分钟
  24 * 60 * 60 * 1000,  // 1天
  3 * 24 * 60 * 60 * 1000, // 3天
  7 * 24 * 60 * 60 * 1000, // 7天
  15 * 24 * 60 * 60 * 1000, // 15天
  30 * 24 * 60 * 60 * 1000  // 30天
];

// 开发测试模式的间隔
const DEV_INTERVALS = [
  10 * 1000,    // 10秒
  20 * 1000,    // 20秒
  30 * 1000,    // 30秒
  40 * 1000,    // 40秒
  50 * 1000     // 50秒
];

// 如果是开发模式，使用测试间隔
if (DEV_MODE) {
  REVIEW_INTERVALS = DEV_INTERVALS;
}

/**
 * 复习管理器类
 */
class ReviewManager {
  constructor() {
    // 内存缓存
    this._reviewRecordsCache = null;
    this._currentLibraryKey = 'cet4'; // 当前词库
    
    // 初始化复习记录
    this.initReviewRecords();
  }

  /**
   * 设置当前词库（用于复习记录分离）
   */
  setCurrentLibrary(libraryKey) {
    if (this._currentLibraryKey !== libraryKey) {
      console.log('[ReviewManager] 切换词库复习记录:', this._currentLibraryKey, '->', libraryKey);
      this._currentLibraryKey = libraryKey;
      // 清空缓存，下次读取会从新词库的存储中获取
      this._reviewRecordsCache = null;
    }
  }

  /**
   * 获取当前复习记录存储键
   */
  _getStorageKey() {
    return STORAGE_KEY_PREFIX + this._currentLibraryKey;
  }

  /**
   * 初始化复习记录（如果不存在则创建）
   */
  initReviewRecords() {
    const records = this.getReviewRecords();
    if (!records) {
      this._reviewRecordsCache = [];
      wx.setStorageSync(this._getStorageKey(), []);
    }
  }

  /**
   * 获取所有复习记录（优先从缓存读取）
   */
  getReviewRecords() {
    if (this._reviewRecordsCache) {
      return this._reviewRecordsCache;
    }
    try {
      const records = wx.getStorageSync(this._getStorageKey());
      this._reviewRecordsCache = records || [];
      return this._reviewRecordsCache;
    } catch (e) {
      console.error('[复习系统] 获取复习记录失败:', e);
      return [];
    }
  }

  /**
   * 保存复习记录（同时更新缓存和存储）
   */
  saveReviewRecords(records) {
    try {
      this._reviewRecordsCache = records;
      wx.setStorageSync(this._getStorageKey(), records);
      return true;
    } catch (e) {
      console.error('[复习系统] 保存复习记录失败:', e);
      return false;
    }
  }

  /**
   * 根据单词ID获取复习记录
   */
  getReviewRecord(wordId) {
    const records = this.getReviewRecords();
    return records.find(record => record.wordId === wordId);
  }

  /**
   * 计算下次复习时间
   * @param {number} reviewCount - 当前复习次数
   * @returns {string} - 下次复习时间（ISO格式）
   */
  calculateNextReviewTime(reviewCount) {
    // 根据复习次数选择间隔
    const intervalIndex = Math.min(reviewCount, REVIEW_INTERVALS.length - 1);
    const interval = REVIEW_INTERVALS[intervalIndex];
    
    // 计算下次复习时间
    const nextTime = new Date(Date.now() + interval);
    return nextTime.toISOString();
  }

  /**
   * 更新单词学习记录（学习完成后调用）
   * @param {number} wordId - 单词ID
   */
  updateStudyRecord(wordId) {
    const records = this.getReviewRecords();
    const now = new Date().toISOString();
    
    console.log('[ReviewManager] updateStudyRecord - currentLevel:', this._currentLibraryKey);
    console.log('[ReviewManager] updateStudyRecord - wordId:', wordId);
    console.log('[ReviewManager] updateStudyRecord - records before:', records.length);
    
    // 查找现有记录
    const existingRecord = records.find(record => record.wordId === wordId);
    
    if (existingRecord) {
      // 更新现有记录，学习时也累计复习次数
      existingRecord.reviewCount += 1;
      existingRecord.lastStudyTime = now;
      existingRecord.nextReviewTime = this.calculateNextReviewTime(existingRecord.reviewCount);
      console.log('[ReviewManager] updateStudyRecord - updated existing record:', existingRecord);
    } else {
      // 创建新记录，初始复习次数为 1（便于演示）
      const newRecord = {
        wordId: wordId,
        reviewCount: 1,
        lastStudyTime: now,
        nextReviewTime: this.calculateNextReviewTime(1)
      };
      records.push(newRecord);
      console.log('[ReviewManager] updateStudyRecord - created new record:', newRecord);
    }
    
    // 保存记录
    this.saveReviewRecords(records);
    console.log('[ReviewManager] updateStudyRecord - records after:', records.length);
  }

  /**
   * 处理复习结果
   * @param {number} wordId - 单词ID
   * @param {boolean} isKnown - 是否认识（true=认识，false=不认识）
   */
  handleReviewResult(wordId, isKnown) {
    const records = this.getReviewRecords();
    const now = new Date().toISOString();
    
    // 查找现有记录
    const index = records.findIndex(record => record.wordId === wordId);
    
    if (index !== -1) {
      if (isKnown) {
        // 认识：增加复习次数，更新下次复习时间
        records[index].reviewCount += 1;
        records[index].lastStudyTime = now;
        records[index].nextReviewTime = this.calculateNextReviewTime(records[index].reviewCount);
      } else {
        // 不认识：重置复习次数，重新开始记忆周期
        records[index].reviewCount = 0;
        records[index].lastStudyTime = now;
        records[index].nextReviewTime = this.calculateNextReviewTime(0);
      }
      
      // 保存记录
      this.saveReviewRecords(records);
    }
  }

  /**
   * 获取待复习单词列表
   * @returns {Array} - 待复习的单词ID列表
   */
  getPendingReviewWordIds() {
    const records = this.getReviewRecords();
    const now = new Date().getTime();
    
    // 筛选出需要复习的单词（下次复习时间 <= 当前时间）
    const pendingRecords = records.filter(record => {
      const nextReviewTime = new Date(record.nextReviewTime).getTime();
      return nextReviewTime <= now;
    });
    
    // 调试日志
    console.log('[ReviewManager] currentLevel:', this._currentLibraryKey);
    console.log('[ReviewManager] learnedWords length:', records.length);
    console.log('[ReviewManager] reviewWords length:', pendingRecords.length);
    
    return pendingRecords.map(record => record.wordId);
  }

  /**
   * 获取待复习单词数量
   * @returns {number} - 待复习单词数量
   */
  getPendingReviewCount() {
    return this.getPendingReviewWordIds().length;
  }

  /**
   * 获取单词的复习状态
   * @param {number} wordId - 单词ID
   * @returns {Object|null} - 复习状态信息
   */
  getWordReviewStatus(wordId) {
    const record = this.getReviewRecord(wordId);
    if (!record) return null;
    
    const now = new Date().getTime();
    const nextReviewTime = new Date(record.nextReviewTime).getTime();
    const isPending = nextReviewTime <= now;
    
    // 计算剩余时间（如果还没到复习时间）
    let remainingTime = null;
    if (!isPending) {
      remainingTime = this.formatRemainingTime(nextReviewTime - now);
    }
    
    return {
      reviewCount: record.reviewCount,
      lastStudyTime: record.lastStudyTime,
      nextReviewTime: record.nextReviewTime,
      isPending: isPending,
      remainingTime: remainingTime
    };
  }

  /**
   * 格式化剩余时间
   * @param {number} ms - 剩余毫秒数
   * @returns {string} - 格式化的时间字符串
   */
  formatRemainingTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}天`;
    } else if (hours > 0) {
      return `${hours}小时`;
    } else if (minutes > 0) {
      return `${minutes}分钟`;
    } else {
      return `${seconds}秒`;
    }
  }

  /**
   * 获取今日待复习的单词列表（包含单词详情）
   * @param {Array} wordList - 完整单词列表
   * @returns {Array} - 待复习的单词详情列表
   */
  getTodayReviewWords(wordList) {
    const pendingIds = this.getPendingReviewWordIds();
    
    // 修复类型不匹配问题：确保ID类型一致后再匹配
    return wordList.filter(word => 
      pendingIds.some(id => Number(id) === Number(word.id))
    );
  }

  /**
   * 重置所有复习记录（测试用）
   */
  reset() {
    this._reviewRecordsCache = [];
    wx.setStorageSync(this._getStorageKey(), []);
  }
}

// 导出单例实例
module.exports = {
  ReviewManager: ReviewManager,
  getReviewManager: function() {
    if (!global.reviewManagerInstance) {
      global.reviewManagerInstance = new ReviewManager();
    }
    return global.reviewManagerInstance;
  }
};
