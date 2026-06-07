// 等级管理器 - 负责管理经验值和等级系统

// 存储键名常量
const STORAGE_KEY = 'wm_level_data';

/**
 * 等级数据结构：
 * {
 *   xp: number,              // 当前经验值
 *   level: number,           // 当前等级
 *   lastLevelUpXp: number    // 上次升级时的经验值
 * }
 */

/**
 * 等级规则：
 * Lv1：0-99 XP
 * Lv2：100-199 XP
 * Lv3：200-299 XP
 * Lv4：300-399 XP
 * ...
 * 
 * 计算公式：level = Math.floor(xp / 100) + 1
 * 每级需要 100 XP
 */

/**
 * 等级管理器类
 */
class LevelManager {
  constructor() {
    // 每级所需经验值
    this.XP_PER_LEVEL = 100;
    // 学习一个单词获得的经验值
    this.XP_PER_WORD = 10;
    
    // 初始化等级数据
    this.initLevelData();
  }

  /**
   * 初始化等级数据（如果不存在则创建）
   */
  initLevelData() {
    const data = this.getLevelData();
    if (!data) {
      const defaultData = {
        xp: 0,
        level: 1,
        lastLevelUpXp: 0
      };
      wx.setStorageSync(STORAGE_KEY, defaultData);
    }
  }

  /**
   * 获取等级数据
   */
  getLevelData() {
    try {
      return wx.getStorageSync(STORAGE_KEY);
    } catch (e) {
      console.error('获取等级数据失败:', e);
      return null;
    }
  }

  /**
   * 保存等级数据
   */
  saveLevelData(data) {
    try {
      wx.setStorageSync(STORAGE_KEY, data);
      return true;
    } catch (e) {
      console.error('保存等级数据失败:', e);
      return false;
    }
  }

  /**
   * 获取当前经验值
   */
  getXP() {
    const data = this.getLevelData();
    return data ? data.xp : 0;
  }

  /**
   * 获取当前等级
   */
  getLevel() {
    const data = this.getLevelData();
    if (!data) return 1;
    
    // 使用公式计算等级: level = Math.floor(xp / 100) + 1
    return Math.floor(data.xp / this.XP_PER_LEVEL) + 1;
  }

  /**
   * 计算当前等级的经验值范围
   * @returns {Object} { current: 当前经验, max: 升级所需经验, progress: 进度百分比 }
   */
  getLevelProgress() {
    const data = this.getLevelData();
    if (!data) return { current: 0, max: this.XP_PER_LEVEL, progress: 0 };
    
    const currentLevel = this.getLevel();
    const currentXpInLevel = data.xp % this.XP_PER_LEVEL;
    
    return {
      current: data.xp,
      max: currentLevel * this.XP_PER_LEVEL,
      currentInLevel: currentXpInLevel,
      maxInLevel: this.XP_PER_LEVEL,
      progress: (currentXpInLevel / this.XP_PER_LEVEL) * 100
    };
  }

  /**
   * 增加经验值
   * @param {number} amount - 增加的经验值数量
   * @returns {Object} { newXp: 新经验值, newLevel: 新等级, levelUp: 是否升级, levelUpTo: 升级到的等级 }
   */
  addXP(amount) {
    const data = this.getLevelData();
    if (!data) {
      this.initLevelData();
      return this.addXP(amount);
    }

    const oldXp = data.xp;
    const oldLevel = this.getLevel();
    
    // 增加经验值
    data.xp = oldXp + amount;
    
    // 计算新等级
    const newLevel = this.getLevel();
    
    // 检查是否升级
    const levelUp = newLevel > oldLevel;
    
    if (levelUp) {
      data.level = newLevel;
      data.lastLevelUpXp = data.xp;
    }
    
    // 保存数据
    this.saveLevelData(data);
    
    return {
      newXp: data.xp,
      newLevel: newLevel,
      levelUp: levelUp,
      levelUpTo: levelUp ? newLevel : null
    };
  }

  /**
   * 学习单词增加经验值（每词10 XP）
   * @returns {Object} 升级结果
   */
  addXPForWord() {
    return this.addXP(this.XP_PER_WORD);
  }

  /**
   * 获取升级所需的剩余经验值
   */
  getRemainingXPForNextLevel() {
    const data = this.getLevelData();
    if (!data) return this.XP_PER_LEVEL;
    
    const currentLevel = this.getLevel();
    const nextLevelXp = currentLevel * this.XP_PER_LEVEL;
    return nextLevelXp - data.xp;
  }

  /**
   * 获取等级标题
   */
  getLevelTitle(level) {
    const titles = [
      '初学者',      // Lv1
      '入门者',      // Lv2
      '学习者',      // Lv3
      '进步者',      // Lv4
      '熟练者',      // Lv5
      '精通者',      // Lv6
      '专家',        // Lv7
      '大师',        // Lv8
      '宗师',        // Lv9
      '词神'         // Lv10+
    ];
    
    if (level <= 0) return '初学者';
    if (level > titles.length) return titles[titles.length - 1];
    return titles[level - 1];
  }

  /**
   * 获取首页统计数据
   */
  getHomeStats() {
    const data = this.getLevelData();
    const level = this.getLevel();
    const progress = this.getLevelProgress();
    
    return {
      xp: data.xp,
      level: level,
      levelTitle: this.getLevelTitle(level),
      currentXp: progress.current,
      maxXp: progress.max,
      progress: progress.progress,
      remainingXp: this.getRemainingXPForNextLevel()
    };
  }

  /**
   * 重置所有数据（测试用）
   */
  reset() {
    const defaultData = {
      xp: 0,
      level: 1,
      lastLevelUpXp: 0
    };
    wx.setStorageSync(STORAGE_KEY, defaultData);
  }
}

// 导出单例实例
module.exports = {
  LevelManager: LevelManager,
  getLevelManager: function() {
    if (!global.levelManagerInstance) {
      global.levelManagerInstance = new LevelManager();
    }
    return global.levelManagerInstance;
  }
};
