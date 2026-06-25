App({
  globalData: {
    userInfo: null,
    baseUrl: 'https://kacumoto.com.cn'  // 线上正式域名
  },

  onLaunch() {
    // 检查登录状态
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.token = token
    }
  },

  // 获取用户ID（开发环境用默认值）
  getUserId() {
    const id = wx.getStorageSync('user_id')
    return id || '10001'
  }
})
