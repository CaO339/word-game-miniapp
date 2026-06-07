// 存储管理器 - 负责管理学习记录和打卡信息
// 使用微信小程序 Storage API 进行数据持久化

// 存储键名常量
const STORAGE_KEYS = {
  LEARNING_RECORD: 'wm_learning_record',  // 学习记录
  CHECKIN_INFO: 'wm_checkin_info'         // 打卡信息
};

/**
 * 学习记录数据结构：
 * {
 *   todayCount: number,        // 今日学习数量
 *   totalCount: number,        // 累计学习数量
 *   learnedWordIds: array,     // 已学习单词ID列表
 *   lastStudyDate: string      // 最后学习日期
 * }
 */

/**
 * 打卡信息数据结构：
 * {
 *   lastCheckinDate: string,   // 最后打卡日期
 *   continuousDays: number,    // 连续打卡天数
 *   totalCheckins: number      // 累计打卡次数
 * }
 */

/**
 * 存储管理器类
 */
class StorageManager {
  constructor() {
    // 初始化学习记录
    this.initLearningRecord();
    // 初始化打卡信息
    this.initCheckinInfo();
  }

  /**
   * 获取今日日期字符串（YYYY-MM-DD）
   */
  getTodayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 初始化学习记录（如果不存在则创建）
   */
  initLearningRecord() {
    const record = this.getLearningRecord();
    if (!record) {
      const defaultRecord = {
        todayCount: 0,
        totalCount: 0,
        learnedWordIds: [],
        lastStudyDate: ''
      };
      wx.setStorageSync(STORAGE_KEYS.LEARNING_RECORD, defaultRecord);
    }
  }

  /**
   * 获取学习记录
   */
  getLearningRecord() {
    try {
      return wx.getStorageSync(STORAGE_KEYS.LEARNING_RECORD);
    } catch (e) {
      console.error('获取学习记录失败:', e);
      return null;
    }
  }

  /**
   * 更新学习记录（学习一个单词）
   * @param {number} wordId - 单词ID
   */
  updateLearningRecord(wordId) {
    const today = this.getTodayString();
    let record = this.getLearningRecord();
    
    // 如果是新的一天，重置今日学习数量
    if (record.lastStudyDate !== today) {
      record.todayCount = 0;
      record.lastStudyDate = today;
    }

    // 如果该单词未学习过，更新统计
    if (!record.learnedWordIds.includes(wordId)) {
      record.learnedWordIds.push(wordId);
      record.totalCount++;
    }
    
    // 今日学习数量+1
    record.todayCount++;

    // 保存到存储
    wx.setStorageSync(STORAGE_KEYS.LEARNING_RECORD, record);
    
    // 尝试打卡（每天第一次学习自动打卡）
    this.autoCheckin();
    
    return record;
  }

  /**
   * 初始化打卡信息（如果不存在则创建）
   */
  initCheckinInfo() {
    const info = this.getCheckinInfo();
    if (!info) {
      const defaultInfo = {
        lastCheckinDate: '',
        continuousDays: 0,
        totalCheckins: 0
      };
      wx.setStorageSync(STORAGE_KEYS.CHECKIN_INFO, defaultInfo);
    }
  }

  /**
   * 获取打卡信息
   */
  getCheckinInfo() {
    try {
      return wx.getStorageSync(STORAGE_KEYS.CHECKIN_INFO);
    } catch (e) {
      console.error('获取打卡信息失败:', e);
      return null;
    }
  }

  /**
   * 自动打卡（每天第一次学习时触发）
   */
  autoCheckin() {
    const today = this.getTodayString();
    let info = this.getCheckinInfo();
    
    // 如果今天已经打过卡，不再重复打卡
    if (info.lastCheckinDate === today) {
      return info;
    }

    // 计算连续打卡天数
    const lastDate = info.lastCheckinDate;
    if (lastDate) {
      const last = new Date(lastDate);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate - last) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        // 连续打卡，天数+1
        info.continuousDays++;
      } else if (diffDays > 1) {
        // 断签，重置连续天数为1
        info.continuousDays = 1;
      }
    } else {
      // 第一次打卡
      info.continuousDays = 1;
    }

    // 更新打卡信息
    info.lastCheckinDate = today;
    info.totalCheckins++;

    // 保存到存储
    wx.setStorageSync(STORAGE_KEYS.CHECKIN_INFO, info);
    
    return info;
  }

  /**
   * 手动打卡（备用方法）
   */
  checkin() {
    return this.autoCheckin();
  }

  /**
   * 获取首页统计数据
   * @returns {Object} 包含今日学习数、累计学习数、连续打卡天数
   */
  getHomeStats() {
    const record = this.getLearningRecord();
    const checkin = this.getCheckinInfo();
    const today = this.getTodayString();
    
    // 如果今天没有学习记录，今日学习数量为0
    const todayCount = record.lastStudyDate === today ? record.todayCount : 0;
    
    return {
      todayCount: todayCount,
      totalCount: record.totalCount,
      continuousDays: checkin.continuousDays
    };
  }

  /**
   * 获取已学习的单词ID列表
   */
  getLearnedWordIds() {
    const record = this.getLearningRecord();
    return record.learnedWordIds || [];
  }

  /**
   * 获取今日学习数量
   */
  getTodayCount() {
    const record = this.getLearningRecord();
    const today = this.getTodayString();
    return record.lastStudyDate === today ? record.todayCount : 0;
  }

  /**
   * 获取累计学习数量
   */
  getTotalCount() {
    const record = this.getLearningRecord();
    return record.totalCount;
  }

  /**
   * 获取连续打卡天数
   */
  getContinuousDays() {
    const checkin = this.getCheckinInfo();
    return checkin.continuousDays;
  }
}

// 导出单例实例
module.exports = {
  StorageManager: StorageManager,
  getStorageManager: function() {
    if (!global.storageManagerInstance) {
      global.storageManagerInstance = new StorageManager();
    }
    return global.storageManagerInstance;
  }
};
