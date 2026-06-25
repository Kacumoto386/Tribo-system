const api = require('../../utils/api')

Page({
  data: {
    notifications: [],
    loading: true
  },

  onLoad() {
    this.loadNotifications()
  },

  onPullDownRefresh() {
    this.loadNotifications()
  },

  async loadNotifications() {
    this.setData({ loading: true })
    try {
      const notifications = await api.getNotifications({ limit: 50 })
      this.setData({ notifications })
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
    this.setData({ loading: false })
    wx.stopPullDownRefresh()
  },

  async onTapNotification(e) {
    const item = e.currentTarget.dataset.item
    if (!item.is_read) {
      try {
        await api.markNotificationRead(item.id)
        this.loadNotifications()
      } catch (e) {}
    }
    if (item.ref_team_id) {
      wx.navigateTo({
        url: `/pages/team_detail/team_detail?id=${item.ref_team_id}`
      })
    }
  },

  async markAllRead() {
    try {
      await api.markAllRead()
      wx.showToast({ title: '已全部标记为已读' })
      this.loadNotifications()
    } catch (err) {
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  }
})
