const api = require('../../utils/api')

Page({
  data: {
    teams: [],
    archived: false,
    currentUserId: '10001',
    showCreate: false,
    showJoin: false,
    submittingCreate: false,
    submittingJoin: false,
    createForm: { name: '', description: '' },
    joinCode: ''
  },

  onLoad() {
    const showCreate = wx.getStorageSync('show_create') === '1'
    if (showCreate) {
      wx.setStorageSync('show_create', '')
      this.setData({ showCreate: true, showJoin: false, createForm: { name: '', description: '' } })
    }
    this.loadTeams(false)
  },

  onShow() {
    const archived = wx.getStorageSync('show_archived') === '1'
    if (archived) {
      wx.setStorageSync('show_archived', '')
      this.setData({ archived: true })
      this.loadTeams(true)
    } else if (this.data.archived) {
      this.setData({ archived: false })
      this.loadTeams(false)
    } else {
      this.loadTeams(false)
    }
  },

  async loadTeams(archived) {
    try {
      const teams = await api.getTeams(archived)
      const currentUserId = wx.getStorageSync('user_id') || '10001'
      this.setData({
        currentUserId,
        teams: (teams || []).map(t => ({ ...t, initial: (t.name || 'T')[0].toUpperCase() })),
      })
    } catch (err) {
      console.error(err)
    }
  },

  // 创建团队
  showCreateDialog() {
    this.setData({ showCreate: true, showJoin: false, createForm: { name: '', description: '' } })
  },

  closeCreate() {
    this.setData({ showCreate: false })
  },

  onCreateInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['createForm.' + field]: e.detail.value })
  },

  async submitCreate() {
    const f = this.data.createForm
    if (!f.name.trim()) {
      wx.showToast({ title: '请输入团队名称', icon: 'none' })
      return
    }
    this.setData({ submittingCreate: true })
    try {
      const team = await api.createTeam({
        name: f.name.trim(),
        description: f.description.trim()
      })
      wx.showToast({ title: `已创建：${team.name} 🎉` })
      this.setData({ showCreate: false })
      this.loadTeams()
    } catch (err) {
      wx.showToast({ title: err.msg || '创建失败', icon: 'none' })
    }
    this.setData({ submittingCreate: false })
  },

  // 加入团队
  showJoinDialog() {
    this.setData({ showJoin: true, showCreate: false, joinCode: '' })
  },

  closeJoin() {
    this.setData({ showJoin: false })
  },

  onJoinInput(e) {
    this.setData({ joinCode: e.detail.value.toUpperCase() })
  },

  async submitJoin() {
    if (!this.data.joinCode.trim()) {
      wx.showToast({ title: '请输入邀请码', icon: 'none' })
      return
    }
    this.setData({ submittingJoin: true })
    try {
      const team = await api.joinTeam({ invite_code: this.data.joinCode.trim() })
      wx.showToast({ title: `已加入：${team.name} 🎉` })
      this.setData({ showJoin: false })
      wx.navigateTo({ url: `/pages/team_detail/team_detail?id=${team.id}` })
    } catch (err) {
      wx.showToast({ title: err.msg || '加入失败', icon: 'none' })
    }
    this.setData({ submittingJoin: false })
  },

  // 进入详情
  goTeamDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/team_detail/team_detail?id=${id}` })
  },

  copyInviteCode(e) {
    const code = e.currentTarget.dataset.code
    wx.setClipboardData({
      data: code,
      success: () => wx.showToast({ title: '邀请码已复制' }),
    })
  }
})
