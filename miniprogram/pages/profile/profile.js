const api = require('../../utils/api')
const app = getApp()

Page({
  data: {
    userInfo: {},
    settings: {},
    serverOk: false,
    initial: 'T',
    achievementSummary: '查看成就',
    unreadCount: 0
  },

  onLoad() {
    this.setData({
      userInfo: wx.getStorageSync('userInfo') || { id: 'dev_user_001', nickname: 'Dev User' },
      initial: ((wx.getStorageSync('userInfo') || {}).nickname || 'T')[0].toUpperCase() || 'T',
    })
  },

  onShow() {
    this.loadData()
    this.checkServer()
  },

  async loadData() {
    try {
      let userInfo = wx.getStorageSync('userInfo') || { id: 'dev_user_001', nickname: 'Dev User' }

      try {
        // 微信登录：获取 code → 后端换 openid → 返回 JWT + 用户信息
        const loginData = await wx.login()
        const result = await api.wxLogin(loginData.code)
        wx.setStorageSync('token', result.token)
        wx.setStorageSync('userInfo', result.user)
        wx.setStorageSync('user_id', result.user.id)
        userInfo = result.user
      } catch(e) {}

      const initial = (userInfo.nickname || 'T')[0].toUpperCase()

      // 获取成就摘要
      try {
        const achievements = await api.getAchievements()
        const earned = achievements.filter(a => a.earned).length
        this.setData({
          achievementSummary: `已获得 ${earned}/${achievements.length} 个`
        })
      } catch(e) {}

      const unreadRes = await api.getUnreadCount().catch(() => ({ count: 0 }))
      this.setData({ unreadCount: unreadRes.count || 0 })

      this.setData({ userInfo, initial })
    } catch (err) {
      console.error(err)
    }
  },

  async checkServer() {
    try {
      const appData = getApp()
      const res = await new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('timeout')), 5000)
        wx.request({
          url: `${appData.globalData.baseUrl}`,
          success: (r) => { clearTimeout(t); resolve(r.data) },
          fail: (e) => { clearTimeout(t); reject(e) }
        })
      })
      this.setData({ serverOk: true })
    } catch(e) {
      this.setData({ serverOk: false })
    }
  },

  setNickname() {
    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '输入新昵称',
      success: async (res) => {
        if (res.confirm && res.content) {
          try {
            await api.updateMe({ nickname: res.content })
            wx.showToast({ title: '已更新' })
            this.loadData()
          } catch(e) {
            wx.showToast({ title: '更新失败', icon: 'none' })
          }
        }
      }
    })
  },

  goSpecialEvents() {
    wx.switchTab({ url: '/pages/special_events/special_events' })
  },

  goAchievements() {
    wx.navigateTo({ url: '/pages/achievements/achievements' })
  },

  goNotifications() {
    wx.navigateTo({ url: '/pages/notifications/notifications' })
  },

  copyUserId(e) {
    const id = e.currentTarget.dataset.id
    wx.setClipboardData({ data: id, success: () => wx.showToast({ title: 'ID 已复制' }) })
  },

  goArchivedTeams() {
    wx.setStorageSync('show_archived', '1')
    wx.switchTab({ url: '/pages/teams/teams' })
  },

  showAbout() {
    wx.showModal({
      title: '关于 Tribo',
      content: 'Tribo v1.1.5\n团队活动跟踪小程序\n=============\n👥 团队活动管理\n🎯 专项目标追踪\n🏅 成就系统\n📤 数据导出',
      showCancel: false
    })
  }
})
