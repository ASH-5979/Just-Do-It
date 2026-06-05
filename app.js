// Supabase 配置
const SUPABASE_URL = 'https://strkcdsgvhryfcpqkgsp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0N87xvXEF2xsmLX47Xl8EA_mcoQUiFH';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 数据结构
let todos = [];
let notes = [];
let timelineEvents = { plan: [], execution: [] };
// 尝试从 localStorage 恢复最后访问的日期，否则使用今天
let savedDate = localStorage.getItem('lastVisitedDate');
let selectedDate = savedDate ? new Date(savedDate) : new Date();
let selectedHour = null;
let selectedSide = null;
let selectedTodoId = null;
let recognition = null;
let isLoading = false;

// 获取天气图标
function getWeatherIcon(condition) {
  const iconMap = {
    '晴': '☀️', '晴天': '☀️', '晴朗': '☀️', 'clear': '☀️', 'sunny': '☀️',
    '多云': '⛅', 'cloudy': '⛅', 'partly cloudy': '⛅',
    '阴': '☁️', '阴天': '☁️', 'overcast': '☁️',
    '雨': '🌧️', '下雨': '🌧️', 'rain': '🌧️', 'raining': '🌧️',
    '雷阵雨': '⛈️', 'thunderstorm': '⛈️',
    '雪': '❄️', '下雪': '❄️', 'snow': '❄️', 'snowing': '❄️',
    '雾': '🌫️', 'fog': '🌫️', 'mist': '🌫️',
    '风': '💨', 'wind': '💨'
  };
  
  for (const [key, icon] of Object.entries(iconMap)) {
    if (condition.includes(key) || condition.toLowerCase().includes(key.toLowerCase())) {
      return icon;
    }
  }
  return '🌤️';
}

// 更新天气信息（手动输入）
function updateWeather() {
  const weatherType = document.getElementById('weatherType').value;
  const temp = document.getElementById('weatherTempInput').value;
  
  // 更新天气图标
  const iconMap = {
    '晴': '☀️',
    '多云': '⛅',
    '阴': '☁️',
    '小雨': '🌧️',
    '大雨': '🌧️',
    '雷阵雨': '⛈️',
    '雪': '❄️',
    '雾': '🌫️'
  };
  
  document.getElementById('weatherIcon').textContent = iconMap[weatherType] || '🌤️';
  
  // 更新温度
  if (temp && !isNaN(temp)) {
    document.getElementById('weatherTemp').textContent = `${temp}°C`;
  }
  
  // 更新天气描述
  document.getElementById('weatherDesc').textContent = weatherType;
}

// 一周七天颜色和标签
const weekdayColors = ['#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];
const weekdayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const weekdayClasses = ['day-sunday', 'day-monday', 'day-tuesday', 'day-wednesday', 'day-thursday', 'day-friday', 'day-saturday'];

// 初始化
async function init() {
  await loadData();
  createStars();
  createMeteors();
  updateDateDisplay();
  updateTime();
  updateTheme();
  renderTodos();
  renderNotes();
  renderTimeline();
  
  setInterval(updateTime, 1000);
  
  // 设置定期同步（每30秒自动同步一次）
  setInterval(async () => {
    await loadData();
    renderTodos();
    renderNotes();
    renderTimeline();
  }, 30000);
  
  // 监听窗口大小变化，重新渲染时间轴以适配手机/桌面模式（带防抖）
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      renderTimeline();
    }, 200);
  });
}

// 创建星星
function createStars() {
  const starryBg = document.getElementById('starryBg');
  if (!starryBg) return;
  
  for (let i = 0; i < 100; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.width = Math.random() * 3 + 1 + 'px';
    star.style.height = star.style.width;
    star.style.animationDelay = Math.random() * 2 + 's';
    star.style.animationDuration = (Math.random() * 2 + 1) + 's';
    starryBg.appendChild(star);
  }
}

// 创建流星
function createMeteors() {
  const starryBg = document.getElementById('starryBg');
  if (!starryBg) return;
  
  setInterval(() => {
    const meteor = document.createElement('div');
    meteor.className = 'meteor';
    meteor.style.left = Math.random() * 80 + 20 + '%';
    meteor.style.top = Math.random() * 50 + '%';
    meteor.style.width = Math.random() * 100 + 50 + 'px';
    meteor.style.height = '2px';
    starryBg.appendChild(meteor);
    
    setTimeout(() => {
      meteor.remove();
    }, 3000);
  }, 5000);
}

// 更新主题
function updateTheme() {
  const weekday = selectedDate.getDay();
  const body = document.body;
  
  // 移除所有主题类
  weekdayClasses.forEach(cls => body.classList.remove(cls));
  
  // 添加当前主题类
  body.classList.add(weekdayClasses[weekday]);
  
  // 更新星期标签颜色
  const badge = document.getElementById('weekdayBadge');
  if (badge) {
    badge.style.backgroundColor = weekdayColors[weekday];
  }
}

// 更新时间
function updateTime() {
  const now = new Date();
}

// 更新日期显示
function updateDateDisplay() {
  const weekday = selectedDate.getDay();
  
  document.getElementById('datePicker').value = selectedDate.toISOString().split('T')[0];
  document.getElementById('weekdayBadge').textContent = weekdayLabels[weekday];
  document.getElementById('weekdayBadge').style.backgroundColor = weekdayColors[weekday];
}

// 日期变更
async function changeDate(days) {
  await saveData();
  selectedDate.setDate(selectedDate.getDate() + days);
  // 保存最后访问的日期到 localStorage
  localStorage.setItem('lastVisitedDate', selectedDate.toISOString().split('T')[0]);
  updateDateDisplay();
  updateTheme();
  await loadDayData();
}

// 日期选择器变更
async function onDateChange() {
  const dateStr = document.getElementById('datePicker').value;
  if (dateStr) {
    await saveData();
    selectedDate = new Date(dateStr);
    // 保存最后访问的日期到 localStorage
    localStorage.setItem('lastVisitedDate', dateStr);
    updateDateDisplay();
    updateTheme();
    await loadDayData();
  }
}

// 添加待办
async function addTodo(event) {
  if (event && event.key !== 'Enter') return;
  
  const input = document.getElementById('todoInput');
  const text = input.value.trim();
  if (!text) return;
  
  const todo = {
    id: Date.now().toString(),
    text,
    completed: false,
    date: selectedDate.toISOString().split('T')[0]
  };
  
  todos.push(todo);
  input.value = '';
  renderTodos();
  await saveData();
}

// 渲染待办列表
function renderTodos() {
  const filteredTodos = todos.filter(t => t.date === selectedDate.toISOString().split('T')[0]);
  const list = document.getElementById('todoList');
  
  document.getElementById('todoCount').textContent = filteredTodos.length;
  
  if (filteredTodos.length === 0) {
    list.innerHTML = '<p class="text-gray-400 text-center py-4">暂无待办事项</p>';
    return;
  }
  
  list.innerHTML = filteredTodos.map(todo => `
    <div class="flex items-center gap-3 p-3 bg-white/50 rounded-xl hover:bg-white/70 transition-colors group backdrop-blur-sm">
      <input type="checkbox" ${todo.completed ? 'checked' : ''} onclick="toggleTodo('${todo.id}')" class="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-400">
      <span class="${todo.completed ? 'line-through text-gray-400' : 'text-gray-700'} flex-1">${todo.text}</span>
      <button onclick="editTodo('${todo.id}')" class="text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 text-sm">修改</button>
      <button onclick="deleteTodo('${todo.id}')" class="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 text-sm">删除</button>
    </div>
  `).join('');
}

// 切换待办状态
async function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    renderTodos();
    await saveData();
  }
}

// 修改待办
async function editTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (todo) {
    const newText = prompt('请输入新的待办内容:', todo.text);
    if (newText !== null && newText.trim() !== '') {
      todo.text = newText.trim();
      renderTodos();
      await saveData();
    }
  }
}

// 删除待办
async function deleteTodo(id) {
  // 找到要删除的待办
  const todo = todos.find(t => t.id === id);
  const todoText = todo ? todo.text : '';
  
  // 删除待办
  todos = todos.filter(t => t.id !== id);
  
  // 删除相关的时间轴事件
  timelineEvents.plan = timelineEvents.plan.filter(e => e.text !== todoText);
  timelineEvents.execution = timelineEvents.execution.filter(e => e.text !== todoText);
  
  // 重新渲染
  renderTodos();
  renderTimeline();
  await saveData();
}

// 打开添加事件弹窗
function openAddEventModal(hour, side) {
  selectedHour = hour;
  selectedSide = side;
  selectedTodoId = null;
  
  // 设置默认时间
  const defaultStart = `${hour.toString().padStart(2, '0')}:00`;
  const defaultEnd = `${(hour + 1).toString().padStart(2, '0')}:00`;
  
  document.getElementById('customEventText').value = '';
  document.getElementById('eventStart').value = defaultStart;
  document.getElementById('eventEnd').value = defaultEnd;
  
  // 渲染待办选项
  renderTodoOptions();
  
  document.getElementById('eventModal').classList.remove('hidden');
}

// 渲染待办选项
function renderTodoOptions() {
  const filteredTodos = todos.filter(t => t.date === selectedDate.toISOString().split('T')[0] && !t.completed);
  const container = document.getElementById('todoOptions');
  
  if (filteredTodos.length === 0) {
    container.innerHTML = '<p class="text-gray-400 text-center py-2">暂无待办事项</p>';
    return;
  }
  
  const weekday = selectedDate.getDay();
  const themeColor = weekdayColors[weekday];
  
  container.innerHTML = filteredTodos.map(todo => {
    const isSelected = selectedTodoId === todo.id;
    return `
      <div 
        class="p-3 rounded-xl cursor-pointer transition-all shadow-lg"
        style="background-color: ${isSelected ? themeColor : '#f9fafb'}; color: ${isSelected ? 'white' : '#374151'};"
        onmouseover="if(!${isSelected}) this.style.backgroundColor='#f3f4f6'"
        onmouseout="if(!${isSelected}) this.style.backgroundColor='#f9fafb'"
        onclick="selectTodo('${todo.id}')"
      >
        ${todo.text}
      </div>
    `;
  }).join('');
}

// 选择待办
function selectTodo(id) {
  selectedTodoId = selectedTodoId === id ? null : id;
  renderTodoOptions();
}

// 关闭事件弹窗
function closeEventModal() {
  document.getElementById('eventModal').classList.add('hidden');
}

// 删除选中的待办事项
async function deleteSelectedTodo() {
  if (!selectedTodoId) {
    alert('请先选择一个待办事项');
    return;
  }
  
  if (confirm('确定要删除这个待办事项吗？')) {
    const todoToDelete = todos.find(t => t.id === selectedTodoId);
    
    // 从待办列表中删除
    todos = todos.filter(t => t.id !== selectedTodoId);
    
    // 同时删除时间轴中相关的计划和执行事件
    if (todoToDelete) {
      timelineEvents.plan = timelineEvents.plan.filter(e => e.text !== todoToDelete.text);
      timelineEvents.execution = timelineEvents.execution.filter(e => e.text !== todoToDelete.text);
    }
    
    closeEventModal();
    renderTodos();
    renderTimeline();
    await saveData();
  }
}

// 保存事件
async function saveEvent() {
  console.log('========== saveEvent 被调用 ==========');
  let text = '';
  
  // 优先使用选中的待办
  if (selectedTodoId) {
    const todo = todos.find(t => t.id === selectedTodoId);
    if (todo) {
      text = todo.text;
    }
  }
  
  // 如果没有选中待办，使用自定义输入
  if (!text) {
    text = document.getElementById('customEventText').value.trim();
  }
  
  if (!text) return;
  
  const start = document.getElementById('eventStart').value;
  const end = document.getElementById('eventEnd').value;
  
  const event = {
    id: Date.now().toString(),
    text,
    start,
    end,
    hour: selectedHour,
    date: selectedDate.toISOString().split('T')[0],
    side: selectedSide,
    status: selectedSide === 'execution' ? 'pending' : null
  };
  
  console.log(`saveEvent: selectedSide=${selectedSide}, event.date=${event.date}, selectedDate=${selectedDate.toISOString().split('T')[0]}`);
  console.log(`saveEvent before push: plan=${timelineEvents.plan.length}, execution=${timelineEvents.execution.length}`);
  
  timelineEvents[selectedSide].push(event);
  
  console.log(`saveEvent after push: plan=${timelineEvents.plan.length}, execution=${timelineEvents.execution.length}`);
  
  closeEventModal();
  renderTimeline();
  await saveData();
}

// 渲染时间轴
function renderTimeline() {
  // 先清理重复事件
  removeDuplicateEvents();
  
  // 然后同步执行从计划，确保执行侧有数据
  syncExecutionFromPlan();
  
  // 检查是否为手机端
  const isMobile = window.innerWidth <= 768;
  
  if (isMobile) {
    // 手机端：渲染紧凑的垂直时间轴
    renderMobileTimeline();
  } else {
    // 桌面端：渲染正常的时间轴
    renderTimelineSide('planTimeline', 'plan');
    renderTimelineSide('executionTimeline', 'execution');
  }
}

function renderMobileTimeline() {
  const currentDate = selectedDate.toISOString().split('T')[0];
  
  // 获取所有计划事件
  const planEvents = timelineEvents.plan
    .filter(e => e.date === currentDate)
    .sort((a, b) => a.start.localeCompare(b.start));
  
  // 获取所有执行事件
  const executionEvents = timelineEvents.execution
    .filter(e => e.date === currentDate)
    .sort((a, b) => a.start.localeCompare(b.start));
  
  // 创建手机端时间轴HTML
  let planHtml = '';
  let executionHtml = '';
  
  // 渲染计划事件
  if (planEvents.length === 0) {
    planHtml = '<div class="text-gray-400 text-sm text-center py-4">暂无计划</div>';
  } else {
    planEvents.forEach(event => {
      planHtml += `
        <div class="mobile-timeline-item">
          <div class="mobile-timeline-time">${event.start}</div>
          <div class="mobile-timeline-content">
            <div class="mobile-plan-event">
              <div style="font-size: 13px;">${event.text}</div>
              <div style="font-size: 11px; opacity: 0.8; margin-top: 2px;">${event.start} - ${event.end}</div>
            </div>
          </div>
        </div>
      `;
    });
  }
  
  // 渲染执行事件
  if (executionEvents.length === 0) {
    executionHtml = '<div class="text-gray-400 text-sm text-center py-4">暂无执行记录</div>';
  } else {
    executionEvents.forEach(event => {
      const statusInfo = getStatusInfo(event.status, event.statusText);
      const completedClass = event.status === 'done' ? 'completed' : '';
      executionHtml += `
        <div class="mobile-timeline-item">
          <div class="mobile-timeline-time">${event.start}</div>
          <div class="mobile-timeline-content">
            <div class="mobile-execution-event ${completedClass}">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <span style="font-size: 13px;">${event.text}</span>
                ${event.status && event.status !== 'pending' ? `<span class="${statusInfo.color} px-1.5 py-0.5 rounded text-xs">${statusInfo.label}</span>` : ''}
              </div>
              <div style="font-size: 11px; opacity: 0.7; margin-top: 2px;">${event.start} - ${event.end}</div>
            </div>
          </div>
        </div>
      `;
    });
  }
  
  // 更新DOM
  const planContainer = document.getElementById('planTimeline');
  const executionContainer = document.getElementById('executionTimeline');
  
  if (planContainer) {
    planContainer.innerHTML = `
      <div class="bg-white/80 rounded-xl p-2 mb-2 backdrop-blur-sm">
        <h3 class="text-sm font-semibold text-blue-700 text-center">📋 今日计划</h3>
      </div>
      <div class="mobile-timeline">${planHtml}</div>
    `;
  }
  
  if (executionContainer) {
    executionContainer.innerHTML = `
      <div class="bg-white/80 rounded-xl p-2 mb-2 backdrop-blur-sm">
        <h3 class="text-sm font-semibold text-green-700 text-center">✅ 今日执行</h3>
      </div>
      <div class="mobile-timeline">${executionHtml}</div>
    `;
  }
}

function renderTimelineSide(containerId, side) {
  const container = document.getElementById(containerId);
  const currentDate = selectedDate.toISOString().split('T')[0];
  const events = timelineEvents[side].filter(e => e.date === currentDate);
  
  // 清空所有时间段
  container.querySelectorAll('[data-hour]').forEach(el => {
    el.innerHTML = '';
    el.style.position = 'relative';
  });
  
  // 如果没有事件，直接返回
  if (events.length === 0) {
    return;
  }
  
  // 按开始时间排序事件
  const sortedEvents = [...events].sort((a, b) => {
    if (a.start !== b.start) return a.start.localeCompare(b.start);
    if (a.end !== b.end) return a.end.localeCompare(b.end);
    return a.text.localeCompare(b.text);
  });
  
  // 为每个小时段计算列分配
  const hourColumnMap = {};
  for (let h = 8; h <= 23; h++) hourColumnMap[h] = { columns: [], events: [] };
  hourColumnMap[0] = { columns: [], events: [] };
  hourColumnMap[1] = { columns: [], events: [] };
  
  // 计算每个事件在各小时段的位置
  sortedEvents.forEach(event => {
    const [startHour, startMin] = event.start.split(':').map(Number);
    const [endHour, endMin] = event.end.split(':').map(Number);
    
    let currentHour = startHour;
    while (true) {
      if (hourColumnMap[currentHour] !== undefined) {
        hourColumnMap[currentHour].events.push(event);
      }
      
      if (currentHour === endHour) break;
      currentHour++;
      if (currentHour >= 24) currentHour = 0;
      if (currentHour === 2) break;
    }
  });
  
  // 找出全局最大重叠数
  let globalMaxOverlap = 1;
  Object.values(hourColumnMap).forEach(hourData => {
    if (hourData.events.length > globalMaxOverlap) {
      globalMaxOverlap = hourData.events.length;
    }
  });
  
  // 两边使用相同的最大列数限制，确保卡片宽度一致
  const maxColumns = Math.min(globalMaxOverlap, 2);
  const gap = 4;
  const columnWidth = maxColumns > 1 ? (100 - (maxColumns - 1) * gap) / maxColumns : 100;
  
  // 为每个事件创建卡片
  // 使用贪心算法为事件分配列，确保同一时段的事件并排显示
  const eventColumns = new Map(); // 记录每个事件已分配的列
  
  sortedEvents.forEach(event => {
    const [startHour, startMin] = event.start.split(':').map(Number);
    const [endHour, endMin] = event.end.split(':').map(Number);
    
    // 找出与当前事件重叠的所有事件
    const overlappingEvents = sortedEvents.filter(e => {
      if (e.id === event.id) return false;
      
      // 转换为分钟数进行比较
      const eventStart = startHour * 60 + startMin;
      const eventEnd = endHour * 60 + endMin;
      
      const [eh, em] = e.start.split(':').map(Number);
      const [eeh, eem] = e.end.split(':').map(Number);
      const otherStart = eh * 60 + em;
      const otherEnd = eeh * 60 + eem;
      
      // 检查两个时间范围是否重叠
      return eventStart < otherEnd && eventEnd > otherStart;
    });
    
    // 找到最小的可用列
    let colIndex = 0;
    const usedCols = new Set();
    
    // 收集所有重叠事件已占用的列
    overlappingEvents.forEach(other => {
      const otherCol = eventColumns.get(other.id);
      if (otherCol !== undefined) {
        usedCols.add(otherCol);
      }
    });
    
    // 找最小的可用列
    for (let i = 0; i < maxColumns; i++) {
      if (!usedCols.has(i)) {
        colIndex = i;
        break;
      }
    }
    
    // 记录当前事件的列分配
    eventColumns.set(event.id, colIndex);
    
    // 判断是否需要堆叠（当所有列都被占用时）
    const isStacked = usedCols.size >= maxColumns;
    
    // 计算事件高度和位置
    const durationMinutes = (endHour - startHour) * 60 + (endMin - startMin);
    const baseHeight = (durationMinutes / 60) * 56 - 4;
    const stackedHeight = isStacked ? Math.max(baseHeight / 2 - 2, 18) : Math.max(baseHeight, 20);
    const totalHeight = isStacked ? stackedHeight : Math.max(baseHeight, 24);
    const topOffset = (startMin / 60) * 56;
    
    // 创建事件卡片
    const eventCard = document.createElement('div');
    eventCard.className = side === 'plan' ? 'timeline-event plan-event' : 'timeline-event execution-event cursor-pointer';
    eventCard.style.width = `calc(${columnWidth}% - ${gap}px)`;
    eventCard.style.height = `${totalHeight}px`;
    eventCard.style.position = 'absolute';
    eventCard.style.left = `calc(${colIndex * (columnWidth + gap)}%)`;
    
    // 堆叠时的垂直偏移处理
    if (isStacked) {
      // 找到有多少个事件在这个位置堆叠
      const sameColEvents = overlappingEvents.filter((_, idx) => idx % maxColumns === colIndex);
      eventCard.style.top = `${topOffset + sameColEvents.length * stackedHeight}px`;
      eventCard.style.zIndex = 15 + sameColEvents.length;
    } else {
      eventCard.style.top = `${topOffset}px`;
      eventCard.style.zIndex = 10;
    }
    
    eventCard.style.overflow = 'hidden';
    
    // 填充卡片内容
    if (side === 'plan') {
      eventCard.innerHTML = `
        <div class="font-medium text-sm px-2 pt-1 leading-tight" style="white-space: normal; word-break: break-all;">${event.text}</div>
        <div class="text-xs opacity-80 px-2">${event.start} - ${event.end}</div>
      `;
      eventCard.onclick = function(e) { 
        e.stopPropagation();
        openPlanDetail(event); 
      };
    } else {
      const statusInfo = getStatusInfo(event.status, event.statusText);
      
      // 状态标签放在右上角
      let statusDisplay = '';
      if (event.status && event.status !== 'pending') {
        statusDisplay = `
          <div style="position: absolute; top: 2px; right: 2px; z-index: 20;">
            <span class="${statusInfo.color} px-1.5 py-0.5 rounded text-xs">${statusInfo.label}</span>
          </div>
        `;
      }
      
      // 堆叠时隐藏时间显示
      if (isStacked) {
        eventCard.innerHTML = `
          ${statusDisplay}
          <div class="font-medium text-xs px-2 pt-0.5 leading-tight" style="white-space: normal; word-break: break-all;">${event.text}</div>
        `;
      } else {
        eventCard.innerHTML = `
          ${statusDisplay}
          <div class="font-medium text-sm px-2 pt-1 leading-tight" style="white-space: normal; word-break: break-all;">${event.text}</div>
          <div class="text-xs opacity-80 px-2">${event.start} - ${event.end}</div>
        `;
      }
      eventCard.onclick = function() { openExecutionDetail(event.id); };
    }
    
    // 添加到开始小时的容器
    const hourEl = container.querySelector(`[data-hour="${startHour.toString()}"]`);
    if (hourEl) {
      hourEl.appendChild(eventCard);
    }
  });
}

// 获取状态信息
function getStatusInfo(status, statusText) {
  switch(status) {
    case 'done':
      return { label: '✅', color: 'bg-green-200 text-green-700' };
    case 'fail':
      return { label: '❌', color: 'bg-red-200 text-red-700' };
    case 'other':
      return { label: statusText || '其他', color: 'bg-yellow-200 text-yellow-700' };
    default:
      return { label: '', color: '' };
  }
}

// 当前选中的执行事件 ID
let currentExecutionEventId = null;
let currentPlanEventId = null;

// 打开计划详情弹窗
function openPlanDetail(event) {
  currentPlanEventId = event.id;
  const currentDate = selectedDate.toISOString().split('T')[0];
  
  // 设置当前计划内容
  const input = document.getElementById('planDetailText');
  input.value = event.text;
  
  // 填充待办事项下拉列表（只显示当前日期的待办事项）
  const dropdown = document.getElementById('planDetailDropdown');
  const filteredTodos = todos.filter(t => t.date === currentDate);
  
  if (filteredTodos.length === 0) {
    dropdown.innerHTML = '<div class="p-3 text-gray-400 text-center">暂无待办事项</div>';
  } else {
    dropdown.innerHTML = filteredTodos.map(todo => `
      <div 
        class="p-3 hover:bg-gray-100 cursor-pointer transition-colors"
        onclick="selectPlanDetailTodo('${todo.text}')"
      >
        ${todo.text}
      </div>
    `).join('');
  }
  
  // 设置时间
  document.getElementById('planDetailStart').value = event.start;
  document.getElementById('planDetailEnd').value = event.end;
  
  // 显示弹窗
  document.getElementById('planDetailModal').classList.remove('hidden');
  
  // 添加事件监听
  input.onfocus = function() { 
    dropdown.classList.remove('hidden'); 
  };
  
  input.onblur = function() { 
    setTimeout(() => dropdown.classList.add('hidden'), 200); 
  };
}

// 选择待办事项填充到计划详情输入框
function selectPlanDetailTodo(text) {
  document.getElementById('planDetailText').value = text;
  document.getElementById('planDetailDropdown').classList.add('hidden');
}

// 关闭计划详情弹窗
function closePlanDetailModal() {
  document.getElementById('planDetailModal').classList.add('hidden');
  currentPlanEventId = null;
}

// 保存计划详情修改
async function savePlanDetail() {
  const event = timelineEvents.plan.find(e => e.id === currentPlanEventId);
  if (event) {
    const oldText = event.text;
    const oldStart = event.start;
    
    // 更新计划侧
    event.text = document.getElementById('planDetailText').value;
    event.start = document.getElementById('planDetailStart').value;
    event.end = document.getElementById('planDetailEnd').value;
    
    // 同步更新执行侧对应的事件
    const execEvent = timelineEvents.execution.find(e => 
      e.text === oldText && e.start === oldStart && e.date === event.date
    );
    if (execEvent) {
      execEvent.text = event.text;
      execEvent.start = event.start;
      execEvent.end = event.end;
    }
    
    closePlanDetailModal();
    renderTimeline();
    await saveData();
  }
}

// 删除计划事件
async function deletePlanEvent() {
  if (confirm('确定要删除这个计划吗？')) {
    // 先找到要删除的事件
    const event = timelineEvents.plan.find(e => e.id === currentPlanEventId);
    
    // 从计划侧删除
    timelineEvents.plan = timelineEvents.plan.filter(e => e.id !== currentPlanEventId);
    
    // 也从执行侧删除对应事件
    if (event) {
      timelineEvents.execution = timelineEvents.execution.filter(e => 
        !(e.text === event.text && e.start === event.start && e.date === event.date)
      );
    }
    
    closePlanDetailModal();
    renderTimeline();
    await saveData();
  }
}

// 打开执行详情弹窗
function openExecutionDetail(eventId) {
  currentExecutionEventId = eventId;
  const event = timelineEvents.execution.find(e => e.id === eventId);
  
  if (!event) return;
  
  // 填充弹窗内容
  document.getElementById('detailEventName').textContent = event.text;
  document.getElementById('detailEventTime').textContent = `计划时间：${event.start} - ${event.end}`;
  
  // 设置实际执行时间（默认为计划时间，或使用已保存的实际时间）
  document.getElementById('detailActualStart').value = event.actualStart || event.start;
  document.getElementById('detailActualEnd').value = event.actualEnd || event.end;
  
  // 设置其他状态输入框
  document.getElementById('statusOtherInput').value = event.statusText || '';
  
  // 更新状态按钮样式
  updateStatusButtons(event.status);
  
  // 显示弹窗
  document.getElementById('executionDetailModal').style.display = 'flex';
}

// 更新状态按钮样式
function updateStatusButtons(status) {
  const doneBtn = document.getElementById('statusDone');
  const failBtn = document.getElementById('statusFail');
  const otherBtn = document.getElementById('statusOther');
  const otherInput = document.getElementById('statusOtherInput');
  
  // 重置所有按钮样式
  [doneBtn, failBtn, otherBtn].forEach(btn => {
    btn.className = 'flex-1 px-4 py-2 rounded-lg text-sm transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200';
  });
  
  // 隐藏其他状态输入框
  otherInput.classList.add('hidden');
  
  // 设置当前状态按钮样式
  switch(status) {
    case 'done':
      doneBtn.className = 'flex-1 px-4 py-2 rounded-lg text-sm transition-colors bg-green-200 text-green-700 ring-1 ring-green-400';
      break;
    case 'fail':
      failBtn.className = 'flex-1 px-4 py-2 rounded-lg text-sm transition-colors bg-red-200 text-red-700 ring-1 ring-red-400';
      break;
    case 'other':
      otherBtn.className = 'flex-1 px-4 py-2 rounded-lg text-sm transition-colors bg-yellow-200 text-yellow-700 ring-1 ring-yellow-400';
      otherInput.classList.remove('hidden');
      break;
  }
}

// 更新执行详情状态（在弹窗中）
async function updateExecutionDetailStatus(status) {
  const event = timelineEvents.execution.find(e => e.id === currentExecutionEventId);
  if (event) {
    event.status = status;
    updateStatusButtons(status);
    renderTimeline(); // 立即重新渲染时间轴，同步显示状态
    await saveData();
  }
}

// 关闭执行详情弹窗
function closeExecutionDetailModal() {
  const modal = document.getElementById('executionDetailModal');
  if (modal) {
    modal.style.display = 'none';
  }
  currentExecutionEventId = null;
}

// 保存执行详情
async function saveExecutionDetail() {
  // 立即关闭弹窗
  const modal = document.getElementById('executionDetailModal');
  if (modal) {
    modal.style.display = 'none';
  }
  
  const event = timelineEvents.execution.find(e => e.id === currentExecutionEventId);
  if (event) {
    event.actualStart = document.getElementById('detailActualStart').value;
    event.actualEnd = document.getElementById('detailActualEnd').value;
    event.statusText = document.getElementById('statusOtherInput').value;
    await saveData();
  }
  currentExecutionEventId = null;
}

// 删除执行事件
async function deleteExecutionEvent() {
  if (confirm('确定要删除这个计划吗？')) {
    // 先找到要删除的事件
    const event = timelineEvents.execution.find(e => e.id === currentExecutionEventId);
    
    // 从执行侧删除
    timelineEvents.execution = timelineEvents.execution.filter(e => e.id !== currentExecutionEventId);
    
    // 也从计划侧删除对应事件
    if (event) {
      timelineEvents.plan = timelineEvents.plan.filter(e => 
        !(e.text === event.text && e.start === event.start && e.date === event.date)
      );
    }
    
    closeExecutionDetailModal();
    renderTimeline();
    await saveData();
  }
}

// 清理重复事件
function removeDuplicateEvents() {
  const seenPlan = new Set();
  timelineEvents.plan = timelineEvents.plan.filter(event => {
    // 使用事件ID作为唯一标识去重，允许同一时间段有多个不同事件
    if (event.id && seenPlan.has(event.id)) {
      return false;
    }
    if (event.id) {
      seenPlan.add(event.id);
    }
    return true;
  });
  
  const seenExecution = new Set();
  timelineEvents.execution = timelineEvents.execution.filter(event => {
    // 使用事件ID作为唯一标识去重
    if (event.id && seenExecution.has(event.id)) {
      return false;
    }
    if (event.id) {
      seenExecution.add(event.id);
    }
    return true;
  });
}

// 同步今日执行从计划
function syncExecutionFromPlan() {
  const currentDate = selectedDate.toISOString().split('T')[0];
  const planEvents = timelineEvents.plan.filter(e => e.date === currentDate);
  
  console.log(`=== syncExecutionFromPlan ===`);
  console.log(`计划事件:`, planEvents.map(e => `${e.text} (${e.start}-${e.end})`));
  
  let addedCount = 0;
  
  planEvents.forEach(planEvent => {
    // 使用 text + start + end 作为唯一标识来匹配执行侧事件
    const eventKey = `${planEvent.text}_${planEvent.start}_${planEvent.end}`;
    
    const existingEvent = timelineEvents.execution.find(e => {
      if (e.date !== currentDate) return false;
      const eKey = `${e.text}_${e.start}_${e.end}`;
      return eKey === eventKey;
    });
    
    if (!existingEvent) {
      // 如果不存在，添加新事件
      console.log(`添加到执行侧: ${planEvent.text} (${planEvent.start}-${planEvent.end})`);
      const newEvent = {
        id: Date.now().toString(),
        text: planEvent.text,
        start: planEvent.start,
        end: planEvent.end,
        hour: planEvent.hour,
        date: planEvent.date,
        side: 'execution',
        status: 'pending',
        statusText: null
      };
      timelineEvents.execution.push(newEvent);
      addedCount++;
    }
  });
  
  console.log(`同步完成: 添加了 ${addedCount} 个事件`);
}

// 添加备注
async function addNote(event) {
  if (event && event.key !== 'Enter') return;
  
  const input = document.getElementById('noteInput');
  const text = input.value.trim();
  if (!text) return;
  
  const note = {
    id: Date.now().toString(),
    type: 'text',
    content: text,
    date: selectedDate.toISOString().split('T')[0],
    timestamp: new Date().toISOString()
  };
  
  notes.push(note);
  input.value = '';
  renderNotes();
  await saveData();
}

// 添加图片
function addImage() {
  const input = document.getElementById('imageInput');
  const file = input.files[0];
  
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = async function(e) {
    const note = {
      id: Date.now().toString(),
      type: 'image',
      content: e.target.result,
      date: selectedDate.toISOString().split('T')[0],
      timestamp: new Date().toISOString()
    };
    
    notes.push(note);
    renderNotes();
    await saveData();
    input.value = '';
  };
  
  reader.readAsDataURL(file);
}

// 语音输入
function toggleVoiceInput() {
  const voiceBtn = document.getElementById('voiceBtn');
  const voiceStatus = document.getElementById('voiceStatus');
  
  if (!recognition) {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'zh-CN';
    recognition.interimResults = false;
    recognition.continuous = false;
    
    recognition.onresult = async function(event) {
      const transcript = event.results[0][0].transcript;
      
      const note = {
        id: Date.now().toString(),
        type: 'text',
        content: transcript,
        date: selectedDate.toISOString().split('T')[0],
        timestamp: new Date().toISOString()
      };
      
      notes.push(note);
      renderNotes();
      await saveData();
    };
    
    recognition.onend = function() {
      voiceBtn.textContent = '🎤';
      voiceBtn.classList.remove('bg-red-200/80');
      voiceBtn.classList.add('bg-red-100/80');
      voiceStatus.classList.add('hidden');
    };
  }
  
  if (recognition.start) {
    voiceBtn.textContent = '⏹️';
    voiceBtn.classList.remove('bg-red-100/80');
    voiceBtn.classList.add('bg-red-200/80');
    voiceStatus.classList.remove('hidden');
    recognition.start();
  }
}

// 渲染备注
function renderNotes() {
  const filteredNotes = notes.filter(n => n.date === selectedDate.toISOString().split('T')[0]);
  const list = document.getElementById('notesList');
  
  if (filteredNotes.length === 0) {
    list.innerHTML = '';
    return;
  }
  
  list.innerHTML = filteredNotes.map(note => {
    const time = new Date(note.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    
    if (note.type === 'image') {
      return `
        <div class="flex gap-3 p-3 bg-white/50 rounded-xl backdrop-blur-sm">
          <span class="text-gray-400 text-sm shrink-0">${time}</span>
          <img src="${note.content}" class="max-w-xs rounded-lg">
          <button onclick="deleteNote(${note.id})" class="text-gray-400 hover:text-red-500 shrink-0">删除</button>
        </div>
      `;
    }
    
    return `
      <div class="flex gap-3 p-3 bg-white/50 rounded-xl backdrop-blur-sm">
        <span class="text-gray-400 text-sm shrink-0">${time}</span>
        <span class="text-gray-700 flex-1">${note.content}</span>
        <button onclick="deleteNote(${note.id})" class="text-gray-400 hover:text-red-500 shrink-0">删除</button>
      </div>
    `;
  }).join('');
}

// 删除备注
async function deleteNote(id) {
  notes = notes.filter(n => n.id !== id);
  renderNotes();
  await saveData();
}

// 数据持久化 - 使用 Supabase
async function saveData() {
  if (isLoading) {
    console.log('saveData skipped: isLoading is true');
    return;
  }
  
  const saveButton = document.getElementById('saveButton');
  const originalText = saveButton ? saveButton.textContent : '';
  
  // 显示保存中状态
  if (saveButton) {
    saveButton.textContent = '⏳ 保存中...';
    saveButton.disabled = true;
  }
  
  const currentDate = selectedDate.toISOString().split('T')[0];
  console.log(`saveData called for date: ${currentDate}`);
  console.log(`Saving ${timelineEvents.plan.length} plan events, ${timelineEvents.execution.length} execution events`);
  
  try {
    // 保存待办事项
    for (const todo of todos) {
      await supabaseClient.from('todos').upsert({
        id: todo.id,
        text: todo.text,
        date: todo.date,
        completed: todo.completed || false
      });
    }
    
    // 保存时间轴事件
    const allEvents = [...timelineEvents.plan, ...timelineEvents.execution];
    for (const event of allEvents) {
      const { error } = await supabaseClient.from('timeline_events').upsert({
        id: event.id,
        text: event.text,
        date: event.date,
        "start": event.start,
        "end": event.end,
        side: event.side,
        status: event.status || 'pending',
        status_text: event.statusText || null
      });
      if (error) {
        console.error('Failed to save event:', error);
        throw error;
      }
    }
    
    // 保存备注
    for (const note of notes) {
      await supabaseClient.from('notes').upsert({
        id: note.id,
        content: note.content || '',
        images: note.images || [],
        date: note.date
      });
    }
    
    console.log('Data saved to Supabase successfully');
    
    // 显示保存成功状态
    if (saveButton) {
      saveButton.textContent = '✅ 已保存';
      setTimeout(() => {
        saveButton.textContent = originalText;
        saveButton.disabled = false;
      }, 2000);
    }
  } catch (error) {
    console.error('Failed to save data:', error);
    
    // 显示保存失败状态
    if (saveButton) {
      saveButton.textContent = '❌ 保存失败';
      setTimeout(() => {
        saveButton.textContent = originalText;
        saveButton.disabled = false;
      }, 2000);
    }
  }
}

async function loadData() {
  if (isLoading) {
    console.log('loadData skipped: isLoading is true');
    return;
  }
  isLoading = true;
  
  const currentDate = selectedDate.toISOString().split('T')[0];
  console.log(`loadData called for date: ${currentDate}`);
  
  try {
    // 加载待办事项
    const { data: todosData, error: todosError } = await supabaseClient
      .from('todos')
      .select('*')
      .eq('date', currentDate);
    
    if (todosError) throw todosError;
    todos = todosData || [];
    console.log(`Loaded ${todos.length} todos`);
    
    // 加载时间轴事件
    const { data: eventsData, error: eventsError } = await supabaseClient
      .from('timeline_events')
      .select('*')
      .eq('date', currentDate);
    
    if (eventsError) throw eventsError;
    
    timelineEvents = { plan: [], execution: [] };
    if (eventsData) {
      const seenIds = new Set();
      
      eventsData.forEach(event => {
        // 基于 ID 去重，避免重复加载同一事件
        if (seenIds.has(event.id)) {
          return;
        }
        seenIds.add(event.id);
        
        const eventObj = {
          id: event.id,
          text: event.text,
          date: event.date,
          start: event.start,
          end: event.end,
          side: event.side,
          status: event.status,
          statusText: event.status_text
        };
        
        if (event.side === 'plan') {
          timelineEvents.plan.push(eventObj);
        } else {
          timelineEvents.execution.push(eventObj);
        }
      });
    }
    console.log(`Loaded ${timelineEvents.plan.length} plan events, ${timelineEvents.execution.length} execution events`);
    
    // 加载备注
    const { data: notesData, error: notesError } = await supabaseClient
      .from('notes')
      .select('*')
      .eq('date', currentDate);
    
    if (notesError) throw notesError;
    notes = notesData || [];
    
    console.log('Data loaded from Supabase');
  } catch (error) {
    console.error('Failed to load data:', error);
    // 如果 Supabase 加载失败，使用空数据
    todos = [];
    notes = [];
    timelineEvents = { plan: [], execution: [] };
  } finally {
    isLoading = false;
  }
}

// 加载指定日期的数据
async function loadDayData() {
  await loadData();
  removeDuplicateEvents(); // 加载后先清理重复
  renderTodos();
  renderNotes();
  renderTimeline();
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);

// 页面关闭前保存数据
window.addEventListener('beforeunload', async function(e) {
  await saveData();
});
