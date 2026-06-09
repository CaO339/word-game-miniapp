// 存储管理器 - 负责管理学习记录和打卡信息
// 使用微信小程序 Storage API 进行数据持久化

// 存储键名常量
const STORAGE_KEYS = {
  LEARNING_RECORD_PREFIX: 'wm_learning_record_',  // 学习记录前缀（按词库区分）
  CHECKIN_INFO: 'wm_checkin_info',               // 打卡信息
  DAILY_TARGET: 'wm_daily_target'                  // 每日目标
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
 * 每日目标数据结构：
 * {
 *   target: number,            // 每日目标数（默认20）
 *   todayNewCount: number,     // 今日新单词数
 *   lastTargetDate: string     // 最后更新目标日期
 * }
 */

/**
 * 存储管理器类
 */
class StorageManager {
  constructor() {
    // 内存缓存
    this._learningRecordCache = null;
    this._currentLibraryKey = 'cet4'; // 当前词库
    this._checkinInfoCache = null;
    this._dailyTargetCache = null;
    
    // 初始化学习记录
    this.initLearningRecord();
    // 初始化打卡信息
    this.initCheckinInfo();
    // 初始化每日目标
    this.initDailyTarget();
  }

  /**
   * 设置当前词库（用于学习记录分离）
   */
  setCurrentLibrary(libraryKey) {
    // 切换词库时，先保存当前词库的学习记录
    if (this._currentLibraryKey !== libraryKey) {
      console.log('[StorageManager] 切换词库学习记录:', this._currentLibraryKey, '->', libraryKey);
      this._currentLibraryKey = libraryKey;
      // 清空缓存，下次读取会从新词库的存储中获取
      this._learningRecordCache = null;
    }
  }

  /**
   * 获取当前学习记录存储键
   */
  _getLearningRecordKey() {
    return STORAGE_KEYS.LEARNING_RECORD_PREFIX + this._currentLibraryKey;
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
      this._learningRecordCache = defaultRecord;
      wx.setStorageSync(this._getLearningRecordKey(), defaultRecord);
    }
  }

  /**
   * 获取学习记录（优先从缓存读取）
   */
  getLearningRecord() {
    if (this._learningRecordCache) {
      return this._learningRecordCache;
    }
    try {
      const record = wx.getStorageSync(this._getLearningRecordKey());
      this._learningRecordCache = record;
      return record;
    } catch (e) {
      console.error('获取学习记录失败:', e);
      return null;
    }
  }

  /**
   * 保存学习记录（同时更新缓存和存储）
   */
  saveLearningRecord(record) {
    this._learningRecordCache = record;
    wx.setStorageSync(this._getLearningRecordKey(), record);
  }

  /**
   * 更新学习记录（学习一个单词）
   * @param {number} wordId - 单词ID
   */
  updateLearningRecord(wordId) {
    const today = this.getTodayString();
    // 从 Storage 读取后做深拷贝，避免修改只读对象
    const rawRecord = wx.getStorageSync(this._getLearningRecordKey());
    const record = rawRecord ? JSON.parse(JSON.stringify(rawRecord)) : {};
    
    // 如果是新的一天，重置今日学习数量
    if (!record || record.lastStudyDate !== today) {
      record.todayCount = 0;
      record.lastStudyDate = today;
    }

    // 如果该单词未学习过，更新统计
    if (!record.learnedWordIds) {
      record.learnedWordIds = [];
    }
    if (!record.learnedWordIds.includes(wordId)) {
      record.learnedWordIds.push(wordId);
      record.totalCount = (record.totalCount || 0) + 1;
    }
    
    // 今日学习数量+1
    record.todayCount++;

    // 保存到存储和缓存
    this.saveLearningRecord(record);
    
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
      this._checkinInfoCache = defaultInfo;
      wx.setStorageSync(STORAGE_KEYS.CHECKIN_INFO, defaultInfo);
    }
  }

  /**
   * 获取打卡信息（优先从缓存读取）
   */
  getCheckinInfo() {
    if (this._checkinInfoCache) {
      return this._checkinInfoCache;
    }
    try {
      const info = wx.getStorageSync(STORAGE_KEYS.CHECKIN_INFO);
      this._checkinInfoCache = info;
      return info;
    } catch (e) {
      console.error('获取打卡信息失败:', e);
      return null;
    }
  }

  /**
   * 保存打卡信息（同时更新缓存和存储）
   */
  saveCheckinInfo(info) {
    this._checkinInfoCache = info;
    wx.setStorageSync(STORAGE_KEYS.CHECKIN_INFO, info);
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

    // 保存到存储和缓存
    this.saveCheckinInfo(info);
    
    return info;
  }

  /**
   * 手动打卡（备用方法）
   */
  checkin() {
    return this.autoCheckin();
  }

  /**
   * 初始化每日目标（如果不存在则创建）
   */
  initDailyTarget() {
    const target = this.getDailyTarget();
    if (!target) {
      const defaultTarget = {
        target: 20,
        todayNewCount: 0,
        lastTargetDate: ''
      };
      this._dailyTargetCache = defaultTarget;
      wx.setStorageSync(STORAGE_KEYS.DAILY_TARGET, defaultTarget);
    }
  }

  /**
   * 获取每日目标（优先从缓存读取）
   */
  getDailyTarget() {
    if (this._dailyTargetCache) {
      return this._dailyTargetCache;
    }
    try {
      const target = wx.getStorageSync(STORAGE_KEYS.DAILY_TARGET);
      this._dailyTargetCache = target;
      return target;
    } catch (e) {
      console.error('获取每日目标失败:', e);
      return null;
    }
  }

  /**
   * 保存每日目标（同时更新缓存和存储）
   */
  saveDailyTarget(targetData) {
    this._dailyTargetCache = targetData;
    wx.setStorageSync(STORAGE_KEYS.DAILY_TARGET, targetData);
  }

  /**
   * 更新每日目标中的新单词计数
   * @param {number} wordId - 单词ID
   * @param {boolean} isNewWord - 是否是新单词
   * @returns {Object} 更新后的目标数据
   */
  updateDailyTarget(wordId, isNewWord) {
    const today = this.getTodayString();
    const targetData = this.getDailyTarget() || { target: 20, todayNewCount: 0, lastTargetDate: '' };
    
    // 如果是新的一天，重置今日新单词计数
    if (targetData.lastTargetDate !== today) {
      targetData.todayNewCount = 0;
      targetData.lastTargetDate = today;
    }
    
    // 如果是新单词，增加计数
    if (isNewWord) {
      targetData.todayNewCount++;
    }
    
    this.saveDailyTarget(targetData);
    return targetData;
  }

  /**
   * 获取每日目标数据（用于首页显示）
   * @returns {Object} 包含target和todayNewCount
   */
  getHomeTargetStats() {
    const today = this.getTodayString();
    const targetData = this.getDailyTarget() || { target: 20, todayNewCount: 0, lastTargetDate: '' };
    
    // 如果是新的一天，重置计数
    if (targetData.lastTargetDate !== today) {
      targetData.todayNewCount = 0;
      targetData.lastTargetDate = today;
      this.saveDailyTarget(targetData);
    }
    
    return {
      target: targetData.target,
      todayNewCount: targetData.todayNewCount,
      isCompleted: targetData.todayNewCount >= targetData.target
    };
  }

  /**
   * 设置每日目标数
   * @param {number} newTarget - 新的目标数
   */
  setDailyTarget(newTarget) {
    const targetData = this.getDailyTarget() || { target: 20, todayNewCount: 0, lastTargetDate: '' };
    targetData.target = newTarget;
    this.saveDailyTarget(targetData);
    return targetData;
  }

  /**
   * 获取首页统计数据
   * @returns {Object} 包含今日学习数、累计学习数、连续打卡天数
   */
  getHomeStats() {
    // 每次都从 Storage 读取最新数据，避免缓存导致的数据不一致
    const record = wx.getStorageSync(this._getLearningRecordKey());
    const checkin = this.getCheckinInfo();
    const today = this.getTodayString();
    
    // 如果今天没有学习记录，今日学习数量为0
    let todayCount = 0;
    if (record && record.lastStudyDate === today) {
      todayCount = record.todayCount;
    }
    
    // totalCount 只统计去重单词数，不与 todayCount 混淆
    const totalCount = record ? record.totalCount : 0;
    
    // 更新内存缓存
    if (record) {
      this._learningRecordCache = record;
    }
    
    console.log('[StorageManager] getHomeStats - 当前词库:', this._currentLibraryKey, '已学:', totalCount);
    
    return {
      todayCount: todayCount,
      totalCount: totalCount,
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
