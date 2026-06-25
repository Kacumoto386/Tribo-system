const api = require('../../utils/api')

Page({
  data: {
    teamId: 0,
    team: {},
    currentTab: 0,
    activities: [],
    members: [],
    announcements: [],
    showCreateActivity: false,
    submittingAct: false,
    activityForm: {
      title: '', description: '', location: '',
      date: '', time: '09:00', max: '0',
      endDate: '', endTime: '23:59',
    },
    showCreateAnnouncement: false,
    announcementForm: { title: '', content: '' },
    submittingAnn: false,
    // 团队编辑
    showEditTeam: false,
    submittingEditTeam: false,
    editTeamForm: { name: '', description: '' },
    // 活动编辑
    showEditActivity: false,
    editActivityId: 0,
    submittingEdit: false,
    editForm: { title: '', description: '', location: '', date: '', time: '09:00', max: '0', endDate: '', endTime: '23:59' },
    // 成员留言
    showMessageDialog: false,
    messageTargetUser: '',
    messageTargetInitial: '',
    messages: [],
    messageInput: '',
    currentUserId: wx.getStorageSync('user_id') || '10001',
  },

  onLoad(options) {
    const teamId = parseInt(options && options.id)
    if (!teamId) return
    this.setData({ teamId })
    if (options && options.shared) {
      this.autoJoinTeam(teamId)
    } else {
      this.loadData()
    }
  },

  async autoJoinTeam(teamId) {
    try {
      await api.autoJoinTeam(teamId)
    } catch (e) { /* ignore if already member */ }
    this.loadData()
  },

  onShow() {
    if (this.data.teamId) this.loadData()
  },

  onShareAppMessage() {
    const team = this.data.team
    return {
      title: team ? `「${team.name}」- 来一起参加活动吧！` : 'Tribo 团队活动',
      path: `pages/team_detail/team_detail?id=${this.data.teamId}&shared=1`,
    }
  },

  async loadData() {
    wx.showLoading({ title: '加载中...' })
    const teamId = this.data.teamId
    try {
      const [team, activities, members, announcements] = await Promise.all([
        api.getTeamDetails(teamId),
        api.getTeamActivities(teamId),
        this.getMembers(teamId),
        api.getTeamAnnouncements(teamId).catch(() => [])
      ])

      const actWithStatus = activities.map(a => {
        const raw = a.activity_date || ''
        const d = raw.replace('T', ' ').slice(0, 16)
        return { ...a, my_status: a.my_status !== null ? a.my_status : undefined, _displayDate: d, _expanded: false, _comments: [], _commentInput: '', _commentCount: a.comment_count || 0 }
      })

      this.setData({
        team: { ...team, initial: (team.name || 'T')[0].toUpperCase() },
        activities: actWithStatus,
        members: (members || []).map(m => ({ ...m, initial: ((m.nickname || m.user_id) || 'U')[0].toUpperCase() })),
        announcements,
        activityForm: {
          ...this.data.activityForm,
          date: new Date().toISOString().slice(0, 10)
        }
      })
    } catch (err) {
      console.error(err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
    wx.hideLoading()
  },

  async getMembers(teamId) {
    try {
      return await api.getTeamMembers(teamId)
    } catch(e) {
      return []
    }
  },

  switchTab(e) {
    this.setData({
      currentTab: e.currentTarget.dataset.index,
      showCreateActivity: false,
      showCreateAnnouncement: false,
      showMessageDialog: false,
    })
  },

  // === 活动相关 ===

  showCreateActivity() {
    this.setData({
      showCreateActivity: true,
      activityForm: {
        title: '', description: '', location: '',
        date: new Date().toISOString().slice(0, 10),
        time: '09:00', max: '0'
      }
    })
  },

  closeCreateActivity() {
    this.setData({ showCreateActivity: false })
  },

  onActInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['activityForm.' + field]: e.detail.value })
  },

  onActDateChange(e) {
    this.setData({ 'activityForm.date': e.detail.value })
  },

  onActTimeChange(e) {
    this.setData({ 'activityForm.time': e.detail.value })
  },

  onActEndDateChange(e) {
    this.setData({ 'activityForm.endDate': e.detail.value })
  },

  onActEndTimeChange(e) {
    this.setData({ 'activityForm.endTime': e.detail.value })
  },

  async submitActivity() {
    const f = this.data.activityForm
    if (!f.title.trim()) {
      wx.showToast({ title: '请输入活动名称', icon: 'none' })
      return
    }

    this.setData({ submittingAct: true })
    try {
      const actDateTime = `${f.date}T${f.time}:00+08:00`
      const data = {
        title: f.title.trim(),
        description: f.description.trim(),
        location: f.location.trim(),
        activity_date: actDateTime,
        max_participants: parseInt(f.max) || 0,
      }
      if (f.endDate) {
        data.end_date = `${f.endDate}T${f.endTime || '23:59'}:00+08:00`
      }
      await api.createTeamActivity(this.data.teamId, data)
      wx.showToast({ title: '发布成功 🎉' })
      this.setData({ showCreateActivity: false })
      this.loadData()
    } catch (err) {
      wx.showToast({ title: err.msg || '发布失败', icon: 'none' })
    }
    this.setData({ submittingAct: false })
  },

  // 报名/签到/取消
  async signupActivity(e) {
    const activityId = e.currentTarget.dataset.id
    try {
      await api.signupActivity(activityId)
      wx.showToast({ title: '报名成功 📝' })
      this.loadData()
    } catch (err) {
      wx.showToast({ title: err.msg || '报名失败', icon: 'none' })
    }
  },

  async checkinActivity(e) {
    const activityId = e.currentTarget.dataset.id
    try {
      await api.checkinActivity(activityId)
      wx.showToast({ title: '签到成功 ✅' })
      this.loadData()
    } catch (err) {
      wx.showToast({ title: err.msg || '签到失败', icon: 'none' })
    }
  },

  cancelSignup(e) {
    const activityId = e.currentTarget.dataset.id
    wx.showModal({
      title: '取消报名',
      content: '确定取消报名吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.cancelSignup(activityId)
            wx.showToast({ title: '已取消' })
            this.loadData()
          } catch (err) {
            wx.showToast({ title: err.msg || '取消失败', icon: 'none' })
          }
        }
      }
    })
  },

  // === 公告相关 ===

  showCreateAnnouncement() {
    this.setData({
      showCreateAnnouncement: true,
      announcementForm: { title: '', content: '' }
    })
  },

  closeCreateAnnouncement() {
    this.setData({ showCreateAnnouncement: false })
  },

  onAnnInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['announcementForm.' + field]: e.detail.value })
  },

  async submitAnnouncement() {
    const f = this.data.announcementForm
    if (!f.title.trim() || !f.content.trim()) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }
    this.setData({ submittingAnn: true })
    try {
      await api.createAnnouncement(this.data.teamId, {
        title: f.title.trim(),
        content: f.content.trim()
      })
      wx.showToast({ title: '发布成功' })
      this.setData({ showCreateAnnouncement: false })
      this.loadData()
    } catch (err) {
      wx.showToast({ title: err.msg || '发布失败', icon: 'none' })
    }
    this.setData({ submittingAnn: false })
  },

  // === 评论相关 ===

  async toggleComments(e) {
    const activityId = e.currentTarget.dataset.id
    const activities = [...this.data.activities]
    const idx = activities.findIndex(a => a.id === activityId)
    if (idx === -1) return

    if (!activities[idx]._expanded) {
      try {
        const comments = await api.getActivityComments(this.data.teamId, activityId)
        activities[idx]._expanded = true
        activities[idx]._comments = comments
        activities[idx]._commentCount = comments.length
        this.setData({ activities })
      } catch (err) {
        wx.showToast({ title: '加载评论失败', icon: 'none' })
      }
    } else {
      activities[idx]._expanded = false
      this.setData({ activities })
    }
  },

  onCommentInput(e) {
    const activityId = e.currentTarget.dataset.id
    const activities = [...this.data.activities]
    const idx = activities.findIndex(a => a.id === activityId)
    if (idx === -1) return
    activities[idx]._commentInput = e.detail.value
    this.setData({ activities })
  },

  async submitComment(e) {
    const activityId = e.currentTarget.dataset.id
    const activities = [...this.data.activities]
    const idx = activities.findIndex(a => a.id === activityId)
    if (idx === -1) return

    const content = activities[idx]._commentInput
    if (!content || !content.trim()) {
      wx.showToast({ title: '请输入评论', icon: 'none' })
      return
    }
    try {
      await api.addActivityComment(this.data.teamId, activityId, { content: content.trim() })
      activities[idx]._commentInput = ''
      const comments = await api.getActivityComments(this.data.teamId, activityId)
      activities[idx]._comments = comments
      activities[idx]._commentCount = comments.length
      this.setData({ activities })
    } catch (err) {
      wx.showToast({ title: err.msg || '评论失败', icon: 'none' })
    }
  },

  // === 活动详情导航 ===

  goToActivity(e) {
    const activityId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/activity_detail/activity_detail?id=${activityId}&team_id=${this.data.teamId}`
    })
  },

  // === 活动编辑/下架 ===

  showEditActivity(e) {
    const activityId = e.currentTarget.dataset.id
    const activity = this.data.activities.find(a => a.id === activityId)
    if (!activity) return
    const d = (activity.activity_date || '').slice(0, 10)
    const t = (activity.activity_date || '').slice(11, 16) || '09:00'
    this.setData({
      showEditActivity: true,
      editActivityId: activityId,
      editForm: {
        title: activity.title || '',
        description: activity.description || '',
        location: activity.location || '',
        date: d,
        time: t,
        max: String(activity.max_participants || '0'),
      }
    })
  },

  closeEditActivity() {
    this.setData({ showEditActivity: false })
  },

  onEditInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['editForm.' + field]: e.detail.value })
  },

  onEditDateChange(e) {
    this.setData({ 'editForm.date': e.detail.value })
  },

  onEditTimeChange(e) {
    this.setData({ 'editForm.time': e.detail.value })
  },

  onEditEndDateChange(e) {
    this.setData({ 'editForm.endDate': e.detail.value })
  },

  onEditEndTimeChange(e) {
    this.setData({ 'editForm.endTime': e.detail.value })
  },

  async submitEditActivity() {
    const f = this.data.editForm
    if (!f.title.trim()) {
      wx.showToast({ title: '请输入活动名称', icon: 'none' })
      return
    }
    this.setData({ submittingEdit: true })
    try {
      const actDateTime = `${f.date}T${f.time}:00+08:00`
      const data = {
        title: f.title.trim(),
        description: f.description.trim(),
        location: f.location.trim(),
        activity_date: actDateTime,
        max_participants: parseInt(f.max) || 0,
      }
      if (f.endDate) {
        data.end_date = `${f.endDate}T${f.endTime || '23:59'}:00+08:00`
      }
      await api.updateActivity(this.data.editActivityId, data)
      wx.showToast({ title: '已更新' })
      this.setData({ showEditActivity: false })
      this.loadData()
    } catch (err) {
      wx.showToast({ title: err.msg || '更新失败', icon: 'none' })
    }
    this.setData({ submittingEdit: false })
  },

  async archiveActivity(e) {
    const activityId = e.currentTarget.dataset.id
    wx.showModal({
      title: '下架活动',
      content: '确定下架该活动吗？下架后成员将不可见。',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.updateActivity(activityId, { status: 4 })
            wx.showToast({ title: '已下架' })
            this.loadData()
          } catch (err) {
            wx.showToast({ title: err.msg || '操作失败', icon: 'none' })
          }
        }
      }
    })
  },

  async restoreActivity(e) {
    const activityId = e.currentTarget.dataset.id
    try {
      await api.updateActivity(activityId, { status: 0 })
      wx.showToast({ title: '已重新上架' })
      this.loadData()
    } catch (err) {
      wx.showToast({ title: err.msg || '操作失败', icon: 'none' })
    }
  },

  copyInviteCode(e) {
    const code = e.currentTarget.dataset.code
    wx.setClipboardData({
      data: code,
      success: () => wx.showToast({ title: '邀请码已复制' }),
    })
  },

  // === 团队编辑/撤回 ===

  showEditTeamDialog() {
    const team = this.data.team
    this.setData({
      showEditTeam: true,
      editTeamForm: { name: team.name || '', description: team.description || '' }
    })
  },

  closeEditTeam() {
    this.setData({ showEditTeam: false })
  },

  onEditTeamInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['editTeamForm.' + field]: e.detail.value })
  },

  async submitEditTeam() {
    const f = this.data.editTeamForm
    if (!f.name.trim()) {
      wx.showToast({ title: '请输入团队名称', icon: 'none' })
      return
    }
    this.setData({ submittingEditTeam: true })
    try {
      await api.updateTeam(this.data.teamId, {
        name: f.name.trim(),
        description: f.description.trim(),
      })
      wx.showToast({ title: '已更新' })
      this.setData({ showEditTeam: false })
      this.loadData()
    } catch (err) {
      wx.showToast({ title: err.msg || '更新失败', icon: 'none' })
    }
    this.setData({ submittingEditTeam: false })
  },

  async leaveTeam() {
    wx.showModal({
      title: '退出团队',
      content: '确定退出该团队吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.leaveTeam(this.data.teamId)
            wx.showToast({ title: '已退出' })
            setTimeout(() => wx.switchTab({ url: '/pages/teams/teams' }), 500)
          } catch (err) {
            wx.showToast({ title: err.msg || '操作失败', icon: 'none' })
          }
        }
      }
    })
  },

  async archiveTeam() {
    wx.showModal({
      title: '撤回团队',
      content: '确定撤回该团队吗？撤回后仅自己可见。',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.archiveTeam(this.data.teamId)
            wx.showToast({ title: '已撤回' })
            setTimeout(() => wx.switchTab({ url: '/pages/teams/teams' }), 500)
          } catch (err) {
            wx.showToast({ title: err.msg || '操作失败', icon: 'none' })
          }
        }
      }
    })
  },

  async restoreTeam() {
    try {
      await api.restoreTeam(this.data.teamId)
      wx.showToast({ title: '已恢复' })
      this.loadData()
    } catch (err) {
      wx.showToast({ title: err.msg || '操作失败', icon: 'none' })
    }
  },

  // === 成员留言 ===

  tapMemberCard(e) {
    const targetUserId = e.currentTarget.dataset.userid
    const member = (this.data.members || []).find(m => m.user_id === targetUserId)
    this.setData({
      showMessageDialog: true,
      messageTargetUser: targetUserId,
      messageTargetNickname: (member ? (member.nickname || member.user_id) : targetUserId),
      messageTargetInitial: member ? member.initial : 'U',
      messages: [],
      messageInput: '',
    })
    this.loadMessages(targetUserId)
  },

  closeMessageDialog() {
    this.setData({ showMessageDialog: false })
  },

  async loadMessages(targetUserId) {
    try {
      const messages = await api.getTeamMessages(this.data.teamId, targetUserId)
      this.setData({ messages })
    } catch (err) {
      console.error(err)
    }
  },

  onMessageInput(e) {
    this.setData({ messageInput: e.detail.value })
  },

  async submitMessage() {
    const content = this.data.messageInput
    if (!content || !content.trim()) {
      wx.showToast({ title: '请输入留言内容', icon: 'none' })
      return
    }
    try {
      await api.addTeamMessage(this.data.teamId, this.data.messageTargetUser, { content: content.trim() })
      this.setData({ messageInput: '' })
      this.loadMessages(this.data.messageTargetUser)
    } catch (err) {
      wx.showToast({ title: err.msg || '留言失败', icon: 'none' })
    }
  },

  deleteMessage(e) {
    const messageId = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除留言',
      content: '确定删除这条留言吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.deleteTeamMessage(messageId)
            this.loadMessages(this.data.messageTargetUser)
          } catch (err) {
            wx.showToast({ title: err.msg || '删除失败', icon: 'none' })
          }
        }
      }
    })
  },
})
