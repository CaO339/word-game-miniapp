// index.js - 首页逻辑
Page({
  data: {
    // 页面数据
  },

  // 开始学习按钮点击事件
  startStudy: function() {
    // 跳转到学习页面
    wx.navigateTo({
      url: '/pages/study/study'
    });
  }
});
