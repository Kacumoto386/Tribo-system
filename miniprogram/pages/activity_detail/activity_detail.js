const api = require('../../utils/api')

Page({
  data: {
    activityId: 0,
    teamId: 0,
    currentTab: 0,
    // 概览
    activity: null,
    participants: [],
    comments: [],
    commentText: '',
    // 物资
    resources: [],
    assignments: {},
    showCreateResource: false,
    submittingRes: false,
    resourceForm: { name: '', category: '', total_quantity: '1', unit: '个', remark: '' },
    showAssign: false,
    assignResourceId: 0,
    assignForm: { user_id: '', quantity: '1', remark: '' },
    submittingAssign: false,
    // 场地
    venue: null,
    setupItems: [],
    showCreateVenue: false,
    submittingVenue: false,
    venueForm: { name: '', address: '', capacity: '0', setup_requirements: '', setup_time: '', contact_name: '', contact_phone: '' },
    showEditVenue: false,
    editingVenue: false,
    showCreateSetupItem: false,
    setupItemForm: { name: '', assigned_to: '' },
    submittingSetupItem: false,
    // 采购
    procurementItems: [],
    filterProcStatus: -1,
    procurementSubTab: 0,
    showCreateProcurement: false,
    submittingProcurement: false,
    procurementForm: { name: '', category: '', total_quantity: '1', unit: '个', estimated_cost: '', remark: '' },
    showClaimProcurement: false,
    claimProcurementId: 0,
    claimForm: { quantity: '1', remark: '' },
    showPurchasedDialog: false,
    purchasedClaimId: 0,
    purchasedForm: { actual_cost: '', receipt_url: '' },
    submittingClaim: false,
    expenseStats: {},
    memberPickerList: [],
    memberListDisplay: [],
    // 多选成员（三处通用）
    assignSelectedMembers: [],
    taskSelectedMembers: [],
    setupSelectedMembers: [],
    // 任务
    tasks: [],
    filterTaskStatus: -1,
    showCreateTask: false,
    submittingTask: false,
    taskForm: { title: '', description: '', assigned_to: '', priority: 0, deadline: '' },
  },

  prevent() {},

  onLoad(options) {
    const activityId = parseInt(options.id)
    const teamId = parseInt(options.team_id)
    const tab = parseInt(options.tab) || 0
    this.setData({ activityId, teamId, currentTab: tab })
    this.loadFullDetail()
  },

  onShow() {
    if (this.data.activityId) this.loadFullDetail()
  },

  async loadFullDetail() {
    wx.showLoading({ title: '加载中...' })
    try {
      const data = await api.getActivityFullDetail(this.data.activityId)

      // Load participants (actual signups from full-detail) and comments
      const participants = data.participants || []
      // Load all team members for the member picker
      // Use team_id from full-detail response as fallback
      const tid = this.data.teamId || data.team_id
      let allMembers = []
      try {
        allMembers = await api.getTeamMembers(tid)
        console.log('Members loaded:', allMembers.length)
      } catch (e) { console.error('getTeamMembers error:', e) }
      let comments = []
      try {
        comments = await api.getActivityComments(this.data.teamId, this.data.activityId)
      } catch (e) { /* ignore */ }

      // 构建 userId → nickname 映射（用于替换各处的 user_id 显示）
      const nickMap = {}
      for (const m of allMembers) {
        nickMap[m.user_id] = m.nickname || m.user_id
      }

      // Build assignments lookup and embed into resources
      const assignments = {}
      for (const a of (data.assignments || [])) {
        if (!assignments[a.resource_id]) assignments[a.resource_id] = []
        assignments[a.resource_id].push({ ...a, _nickname: nickMap[a.user_id] || a.user_id })
      }
      const resourcesWithAssign = (data.resources || []).map(r => ({
        ...r,
        _assignments: assignments[r.id] || [],
      }))

      // Build procurement claims lookup and embed into items
      const claimsByProc = {}
      for (const c of (data.procurement_claims || [])) {
        if (!claimsByProc[c.procurement_id]) claimsByProc[c.procurement_id] = []
        claimsByProc[c.procurement_id].push({ ...c, _nickname: nickMap[c.user_id] || c.user_id })
      }
      const procurementsWithClaims = (data.procurements || []).map(p => ({
        ...p,
        _claims: claimsByProc[p.id] || [],
      }))

      const raw = (data.activity_date || '')
      data._displayDate = raw.replace('T', ' ').slice(0, 16)
      data._displayEndDate = (data.end_date || '').replace('T', ' ').slice(0, 16)
      // 构建成员选择列表，昵称优先，当前用户显示「我」，去重
      const currentUid = wx.getStorageSync('user_id') || 'dev_user_001'
      const seenIds = new Set()
      const memberList = []
      // 先把当前用户放最前面（兼容 dev_user_001 / 10001 等 ID）
      const me = allMembers.find(p => p.user_id === currentUid || p.user_id === 'dev_user_001')
      if (me) {
        seenIds.add(me.user_id)
        memberList.push({ id: me.user_id, label: '我' + (me.role === 2 ? ' (群主)' : me.role === 1 ? ' (管理员)' : '') })
      } else {
        memberList.push({ id: currentUid, label: '我' })
        seenIds.add(currentUid)
      }
      // 其他成员（排除已出现的 ID）
      for (const p of allMembers) {
        if (!seenIds.has(p.user_id)) {
          seenIds.add(p.user_id)
          memberList.push({
            id: p.user_id,
            label: (p.nickname || p.user_id) + (p.role === 2 ? ' (群主)' : p.role === 1 ? ' (管理员)' : ''),
          })
        }
      }
      this.setData({
        activity: data,
        nickMap,
        participants: participants.map(p => ({
          ...p,
          initial: ((p.nickname || p.user_id) || 'U')[0].toUpperCase()
        })),
        memberPickerList: [{ id: '', label: '-- 手动输入 --' }, ...memberList],
        memberListDisplay: memberList.map(m => ({ ...m, _sel: false })),
        resources: resourcesWithAssign,
        venue: data.venue,
        setupItems: (data.setup_items || []).map(s => ({
          ...s,
          _assigned_nickname: nickMap[s.assigned_to] || s.assigned_to || '',
        })),
        tasks: (data.tasks || []).map(t => ({
          ...t,
          _assigned_nickname: nickMap[t.assigned_to] || t.assigned_to || '',
        })),
        procurementItems: procurementsWithClaims,
        comments,
        commentText: '',
      })
      this._updateFilters()
    } catch (err) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
    wx.hideLoading()
  },

  switchTab(e) {
    this.setData({
      currentTab: e.currentTarget.dataset.index,
      showCreateTask: false,
      showCreateResource: false,
      showAssign: false,
      showCreateVenue: false,
      showEditVenue: false,
      showCreateSetupItem: false,
      showCreateProcurement: false,
      showClaimProcurement: false,
      showPurchasedDialog: false,
    })
  },

  // ===== 任务 =====

  showCreateTaskDialog() {
    this.setData({
      showCreateTask: true,
      taskForm: { title: '', description: '', assigned_to: '', priority: 0, deadline: '' },
      taskSelectedMembers: [],
    })
  },

  closeCreateTask() {
    this.setData({ showCreateTask: false })
  },

  onTaskInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['taskForm.' + field]: e.detail.value })
  },

  onTaskPriorityChange(e) {
    this.setData({ 'taskForm.priority': parseInt(e.detail.value) })
  },

  async submitTask() {
    const f = this.data.taskForm
    if (!f.title.trim()) {
      wx.showToast({ title: '请输入任务名称', icon: 'none' })
      return
    }
    const members = this.data.taskSelectedMembers
    if (!members || members.length === 0) {
      wx.showToast({ title: '请选择至少一个负责人', icon: 'none' })
      return
    }
    this.setData({ submittingTask: true })
    try {
      const base = {
        title: f.title.trim(),
        description: f.description.trim(),
        priority: parseInt(f.priority) || 0,
      }
      if (f.deadline) base.deadline = f.deadline + 'T23:59:59+08:00'
      for (const uid of members) {
        await api.createTask(this.data.activityId, { ...base, assigned_to: uid })
      }
      wx.showToast({ title: `已分配给 ${members.length} 人` })
      this.setData({ showCreateTask: false, taskSelectedMembers: [] })
      this.loadFullDetail()
    } catch (err) {
      wx.showToast({ title: err.msg || '创建失败', icon: 'none' })
    }
    this.setData({ submittingTask: false })
  },

  async updateTaskStatus(e) {
    const taskId = e.currentTarget.dataset.id
    const status = parseInt(e.currentTarget.dataset.status)
    try {
      await api.updateTaskStatus(taskId, { status })
      wx.showToast({ title: '状态已更新' })
      this.loadFullDetail()
    } catch (err) {
      wx.showToast({ title: err.msg || '操作失败', icon: 'none' })
    }
  },

  async deleteTask(e) {
    const taskId = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除任务',
      content: '确定删除该任务吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.deleteTask(taskId)
            wx.showToast({ title: '已删除' })
            this.loadFullDetail()
          } catch (err) {
            wx.showToast({ title: err.msg || '删除失败', icon: 'none' })
          }
        }
      }
    })
  },

  _updateFilters() {
    const tasks = this.data.tasks || []
    let ft = tasks
    if (this.data.filterTaskStatus >= 0) {
      ft = tasks.filter(t => t.status === this.data.filterTaskStatus)
    }
    const procs = this.data.procurementItems || []
    let fp = procs
    if (this.data.filterProcStatus >= 0) {
      fp = procs.filter(p => p.status === this.data.filterProcStatus)
    }
    this.setData({ _filteredTasks: ft, _filteredProcurements: fp })
  },

  onTaskFilterChange(e) {
    this.setData({ filterTaskStatus: parseInt(e.currentTarget.dataset.status) })
    this._updateFilters()
  },

  onProcFilterChange(e) {
    this.setData({ filterProcStatus: parseInt(e.currentTarget.dataset.status) })
    this._updateFilters()
  },

  // ===== 物资 =====

  showCreateResourceDialog() {
    this.setData({
      showCreateResource: true,
      resourceForm: { name: '', category: '', total_quantity: '1', unit: '个', remark: '' }
    })
  },

  closeCreateResource() {
    this.setData({ showCreateResource: false })
  },

  onResInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['resourceForm.' + field]: e.detail.value })
  },

  async submitResource() {
    const f = this.data.resourceForm
    if (!f.name.trim()) {
      wx.showToast({ title: '请输入物资名称', icon: 'none' })
      return
    }
    this.setData({ submittingRes: true })
    try {
      await api.createResource(this.data.activityId, {
        name: f.name.trim(),
        category: f.category.trim(),
        total_quantity: parseInt(f.total_quantity) || 1,
        unit: f.unit || '个',
        remark: f.remark.trim(),
      })
      wx.showToast({ title: '添加成功' })
      this.setData({ showCreateResource: false })
      this.loadFullDetail()
    } catch (err) {
      wx.showToast({ title: err.msg || '添加失败', icon: 'none' })
    }
    this.setData({ submittingRes: false })
  },

  async deleteResource(e) {
    const resourceId = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除物资',
      content: '确定删除该物资吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.deleteResource(resourceId)
            wx.showToast({ title: '已删除' })
            this.loadFullDetail()
          } catch (err) {
            wx.showToast({ title: err.msg || '删除失败', icon: 'none' })
          }
        }
      }
    })
  },

  // 物资分派
  showAssignDialog(e) {
    const resourceId = e.currentTarget.dataset.id
    this.setData({
      showAssign: true,
      assignResourceId: resourceId,
      assignForm: { user_id: '', quantity: '1', remark: '' },
      assignSelectedMembers: [],
    })
  },

  closeAssign() {
    this.setData({ showAssign: false })
  },

  onAssignInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['assignForm.' + field]: e.detail.value })
  },

  async submitAssignment() {
    const members = this.data.assignSelectedMembers
    if (!members || members.length === 0) {
      wx.showToast({ title: '请选择至少一个成员', icon: 'none' })
      return
    }
    this.setData({ submittingAssign: true })
    try {
      for (const uid of members) {
        await api.createAssignment(this.data.assignResourceId, {
          user_id: uid,
          quantity: parseInt(this.data.assignForm.quantity) || 1,
          remark: this.data.assignForm.remark.trim(),
        })
      }
      wx.showToast({ title: `已分派给 ${members.length} 人` })
      this.setData({ showAssign: false, assignSelectedMembers: [] })
      this.loadFullDetail()
    } catch (err) {
      wx.showToast({ title: err.msg || '分派失败', icon: 'none' })
    }
    this.setData({ submittingAssign: false })
  },

  // ===== 场地 =====

  showCreateVenueDialog() {
    this.setData({
      showCreateVenue: true,
      venueForm: { name: '', address: '', capacity: '0', setup_requirements: '', setup_time: '', contact_name: '', contact_phone: '' }
    })
  },

  closeCreateVenue() {
    this.setData({ showCreateVenue: false })
  },

  onVenueInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['venueForm.' + field]: e.detail.value })
  },

  async submitVenue() {
    const f = this.data.venueForm
    if (!f.name.trim()) {
      wx.showToast({ title: '请输入场地名称', icon: 'none' })
      return
    }
    this.setData({ submittingVenue: true })
    try {
      const data = {
        name: f.name.trim(),
        address: f.address.trim(),
        capacity: parseInt(f.capacity) || 0,
        setup_requirements: f.setup_requirements.trim(),
        contact_name: f.contact_name.trim(),
        contact_phone: f.contact_phone.trim(),
      }
      if (f.setup_time) data.setup_time = f.setup_time + 'T00:00:00+08:00'
      await api.createVenue(this.data.activityId, data)
      wx.showToast({ title: '创建成功' })
      this.setData({ showCreateVenue: false })
      this.loadFullDetail()
    } catch (err) {
      wx.showToast({ title: err.msg || '创建失败', icon: 'none' })
    }
    this.setData({ submittingVenue: false })
  },

  async deleteVenue() {
    if (!this.data.venue) return
    wx.showModal({
      title: '删除场地',
      content: '确定删除场地信息吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.deleteVenue(this.data.venue.id)
            wx.showToast({ title: '已删除' })
            this.loadFullDetail()
          } catch (err) {
            wx.showToast({ title: err.msg || '删除失败', icon: 'none' })
          }
        }
      }
    })
  },

  // 布设子项
  showCreateSetupItemDialog() {
    this.setData({
      showCreateSetupItem: true,
      setupItemForm: { name: '', assigned_to: '' },
      setupSelectedMembers: [],
    })
  },

  closeCreateSetupItem() {
    this.setData({ showCreateSetupItem: false })
  },

  onSetupItemInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['setupItemForm.' + field]: e.detail.value })
  },

  async submitSetupItem() {
    const f = this.data.setupItemForm
    if (!f.name.trim()) {
      wx.showToast({ title: '请输入布设项名称', icon: 'none' })
      return
    }
    const members = this.data.setupSelectedMembers
    if (!members || members.length === 0) {
      wx.showToast({ title: '请选择至少一个负责人', icon: 'none' })
      return
    }
    this.setData({ submittingSetupItem: true })
    try {
      for (const uid of members) {
        await api.createSetupItem(this.data.venue.id, {
          name: f.name.trim(),
          assigned_to: uid,
        })
      }
      wx.showToast({ title: `已分配给 ${members.length} 人` })
      this.setData({ showCreateSetupItem: false, setupSelectedMembers: [] })
      this.loadFullDetail()
    } catch (err) {
      wx.showToast({ title: err.msg || '添加失败', icon: 'none' })
    }
    this.setData({ submittingSetupItem: false })
  },

  async toggleSetupItem(e) {
    const itemId = e.currentTarget.dataset.id
    const item = this.data.setupItems.find(s => s.id === itemId)
    if (!item) return
    try {
      await api.updateSetupItem(itemId, { status: item.status === 1 ? 0 : 1 })
      this.loadFullDetail()
    } catch (err) {
      wx.showToast({ title: err.msg || '操作失败', icon: 'none' })
    }
  },

  async deleteSetupItem(e) {
    const itemId = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除布设项',
      content: '确定删除该布设项吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.deleteSetupItem(itemId)
            wx.showToast({ title: '已删除' })
            this.loadFullDetail()
          } catch (err) {
            wx.showToast({ title: err.msg || '删除失败', icon: 'none' })
          }
        }
      }
    })
  },

  // ===== 成员选择器 =====

  onMemberPickerChange(e) {
    const idx = e.detail.value
    const picked = this.data.memberPickerList[idx]
    if (!picked || !picked.id) return
    const field = e.currentTarget.dataset.field
    this.setData({ [field]: picked.id })
  },

  // ===== 成员多选 =====

  toggleMemberSelect(e) {
    const uid = e.currentTarget.dataset.uid
    const key = e.currentTarget.dataset.key
    if (!uid || !key) { wx.showToast({ title: '无效选择', icon: 'none' }); return }
    const list = [...(this.data[key] || [])]
    const idx = list.indexOf(uid)
    if (idx >= 0) { list.splice(idx, 1) } else { list.push(uid) }
    // Also update memberListDisplay _sel flags for immediate visual feedback
    const display = (this.data.memberListDisplay || []).map(m => ({
      ...m, _sel: list.indexOf(m.id) >= 0,
    }))
    this.setData({ [key]: list, memberListDisplay: display })
  },

  // ===== 评论 =====

  onCommentInput(e) {
    this.setData({ commentText: e.detail.value })
  },

  async submitComment() {
    const content = this.data.commentText
    if (!content || !content.trim()) {
      wx.showToast({ title: '请输入评论', icon: 'none' })
      return
    }
    try {
      await api.addActivityComment(this.data.teamId, this.data.activityId, { content: content.trim() })
      this.setData({ commentText: '' })
      this.loadFullDetail()
      wx.showToast({ title: '评论成功' })
    } catch (err) {
      wx.showToast({ title: err.msg || '评论失败', icon: 'none' })
    }
  },

  // ===== 采购 =====

  switchProcurementSubTab(e) {
    const tab = parseInt(e.currentTarget.dataset.tab)
    this.setData({ procurementSubTab: tab })
    if (tab === 1) this.loadExpenseStats()
  },

  onProcFilterChange(e) {
    this.setData({ filterProcStatus: parseInt(e.currentTarget.dataset.status) })
  },

  showCreateProcurementDialog() {
    this.setData({
      showCreateProcurement: true,
      procurementForm: { name: '', category: '', total_quantity: '1', unit: '个', estimated_cost: '', remark: '' }
    })
  },

  closeCreateProcurement() {
    this.setData({ showCreateProcurement: false })
  },

  onProcurementInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['procurementForm.' + field]: e.detail.value })
  },

  async submitProcurement() {
    const f = this.data.procurementForm
    if (!f.name.trim()) {
      wx.showToast({ title: '请输入采购物品名称', icon: 'none' })
      return
    }
    this.setData({ submittingProcurement: true })
    try {
      await api.createProcurement(this.data.activityId, {
        name: f.name.trim(),
        category: f.category.trim(),
        total_quantity: parseInt(f.total_quantity) || 1,
        unit: f.unit || '个',
        estimated_cost: parseFloat(f.estimated_cost) || 0,
        remark: f.remark.trim(),
      })
      wx.showToast({ title: '添加成功' })
      this.setData({ showCreateProcurement: false })
      this.loadFullDetail()
    } catch (err) {
      wx.showToast({ title: err.msg || '添加失败', icon: 'none' })
    }
    this.setData({ submittingProcurement: false })
  },

  async deleteProcurement(e) {
    const pid = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除采购项',
      content: '确定删除该采购项吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.deleteProcurement(pid)
            wx.showToast({ title: '已删除' })
            this.loadFullDetail()
          } catch (err) {
            wx.showToast({ title: err.msg || '删除失败', icon: 'none' })
          }
        }
      }
    })
  },

  showClaimDialog(e) {
    const pid = e.currentTarget.dataset.id
    const item = this.data.procurementItems.find(p => p.id === pid)
    const remaining = (item.total_quantity || 0) - (item.claimed_quantity || 0)
    this.setData({
      showClaimProcurement: true,
      claimProcurementId: pid,
      claimForm: { quantity: String(Math.min(1, remaining)), remark: '' }
    })
  },

  closeClaimProcurement() {
    this.setData({ showClaimProcurement: false })
  },

  onClaimInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['claimForm.' + field]: e.detail.value })
  },

  async submitClaim() {
    const f = this.data.claimForm
    const qty = parseInt(f.quantity) || 1
    if (qty <= 0) {
      wx.showToast({ title: '数量必须大于 0', icon: 'none' })
      return
    }
    this.setData({ submittingClaim: true })
    try {
      await api.createProcurementClaim(this.data.claimProcurementId, {
        quantity: qty,
        remark: f.remark.trim(),
      })
      wx.showToast({ title: '认领成功' })
      this.setData({ showClaimProcurement: false })
      this.loadFullDetail()
    } catch (err) {
      wx.showToast({ title: err.msg || '认领失败', icon: 'none' })
    }
    this.setData({ submittingClaim: false })
  },

  markClaimPurchased(e) {
    const claimId = e.currentTarget.dataset.id
    let claim = null
    for (const p of this.data.procurementItems) {
      for (const c of (p._claims || [])) {
        if (c.id === claimId) claim = c
      }
    }
    this.setData({
      showPurchasedDialog: true,
      purchasedClaimId: claimId,
      purchasedForm: {
        actual_cost: claim && claim.actual_cost ? String(claim.actual_cost) : '',
        receipt_url: claim && claim.receipt_url ? claim.receipt_url : '',
      }
    })
  },

  closePurchasedDialog() {
    this.setData({ showPurchasedDialog: false })
  },

  onPurchasedInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['purchasedForm.' + field]: e.detail.value })
  },

  async submitPurchased() {
    const f = this.data.purchasedForm
    this.setData({ submittingClaim: true })
    try {
      await api.updateProcurementClaim(this.data.purchasedClaimId, {
        actual_cost: parseFloat(f.actual_cost) || null,
        receipt_url: f.receipt_url.trim(),
        status: 1,
      })
      wx.showToast({ title: '已记录' })
      this.setData({ showPurchasedDialog: false })
      this.loadFullDetail()
    } catch (err) {
      wx.showToast({ title: err.msg || '操作失败', icon: 'none' })
    }
    this.setData({ submittingClaim: false })
  },

  async confirmClaim(e) {
    const claimId = e.currentTarget.dataset.id
    try {
      await api.updateProcurementClaim(claimId, { status: 2 })
      this.loadFullDetail()
    } catch (err) {
      wx.showToast({ title: err.msg || '操作失败', icon: 'none' })
    }
  },

  async deleteClaim(e) {
    const claimId = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除认领',
      content: '确定删除该认领记录吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.deleteProcurementClaim(claimId)
            wx.showToast({ title: '已删除' })
            this.loadFullDetail()
          } catch (err) {
            wx.showToast({ title: err.msg || '删除失败', icon: 'none' })
          }
        }
      }
    })
  },

  async loadExpenseStats() {
    try {
      const stats = await api.getProcurementStats(this.data.activityId)
      // Pre-compute display fields for WXML
      const nickMap = this.data.nickMap || {}
      if (stats.by_person) {
        stats.by_person = stats.by_person.map(p => ({
          ...p,
          _nickname: nickMap[p.user_id] || p.user_id,
          _balanceClass: p.balance >= 0 ? 'positive' : 'negative',
          _balanceLabel: p.balance >= 0 ? '应收' : '应付',
          _balanceDisplay: Math.abs(p.balance).toFixed(2),
        }))
      }
      this.setData({ expenseStats: stats })
    } catch (err) {
      console.error(err)
    }
  },
})
