/**
 * LinyaIIT — Smart Campus Queue Management System
 * Mindanao State University – Iligan Institute of Technology (MSU-IIT)
 */

const STORAGE_KEY = 'linyaiit_state_v1';
const MY_TICKETS_KEY = 'linyaiit_my_tickets_v1';

// MSU-IIT Campus Offices and Services Catalog
const CAMPUS_OFFICES = [
    {
        id: 'registrar',
        name: 'Office of the University Registrar',
        prefix: 'REG',
        avgServiceMins: 5,
        services: [
            'Transcript of Records (TOR) Request',
            'Certificate of Registration (COR) / Enrollment',
            'Honorable Dismissal / Transfer Credentials',
            'Authentication / Certified True Copy',
            'Adding / Dropping / Changing of Subjects'
        ]
    },
    {
        id: 'cashier',
        name: 'Cashiering & Disbursement Office',
        prefix: 'CSH',
        avgServiceMins: 4,
        services: [
            'Tuition & Miscellaneous Fee Payment',
            'Transcript / Certification Fee Payment',
            'Scholarship Stipend / Allowance Inquiry',
            'Official Receipt Verification'
        ]
    },
    {
        id: 'admissions',
        name: 'Office of Admissions & Scholarships',
        prefix: 'ADM',
        avgServiceMins: 6,
        services: [
            'Freshmen / Transferee Admission Inquiry',
            'Scholarship Application & Renewal',
            'SASE / Entrance Exam Credentials',
            'Student ID Processing & Validation'
        ]
    },
    {
        id: 'guidance',
        name: 'Guidance & Counseling Center',
        prefix: 'GDC',
        avgServiceMins: 8,
        services: [
            'Good Moral Character Certificate',
            'Academic & Career Counseling',
            'Psychological Testing / Exit Interview',
            'Peer Facilitator Consultation'
        ]
    },
    {
        id: 'clinic',
        name: 'University Medical & Dental Clinic',
        prefix: 'MED',
        avgServiceMins: 7,
        services: [
            'Medical Certificate for Enrollment / OJT',
            'General Medical Consultation',
            'Dental Check-up & Consultation',
            'First Aid & Health Clearance'
        ]
    }
];

// Application State
let appState = {
    tickets: [],
    counters: {
        registrar: 100,
        cashier: 100,
        admissions: 100,
        guidance: 100,
        clinic: 100
    },
    darkMode: false,
    soundEnabled: true
};

let myTicketIds = [];
let activeStaffTab = 'waiting';
let servingTimerInterval = null;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    initSelectors();
    bindEvents();
    applyTheme();
    updateSoundIcon();
    startClock();
    renderAll();

    // Sync across multiple browser tabs in real-time
    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
            loadState();
            renderAll();
        }
    });
});

function loadState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            appState = { ...appState, ...parsed };
        }
        const savedMy = localStorage.getItem(MY_TICKETS_KEY);
        if (savedMy) {
            myTicketIds = JSON.parse(savedMy);
        }
    } catch (err) {
        console.error('Failed to load LinyaIIT state:', err);
    }
}

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
        localStorage.setItem(MY_TICKETS_KEY, JSON.stringify(myTicketIds));
    } catch (err) {
        console.error('Failed to save LinyaIIT state:', err);
    }
}

function initSelectors() {
    const officeSelect = document.getElementById('officeSelect');
    const staffOfficeFilter = document.getElementById('staffOfficeFilter');

    officeSelect.innerHTML = '';
    staffOfficeFilter.innerHTML = '';

    CAMPUS_OFFICES.forEach(office => {
        const opt1 = document.createElement('option');
        opt1.value = office.id;
        opt1.textContent = office.name;
        officeSelect.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = office.id;
        opt2.textContent = office.name;
        staffOfficeFilter.appendChild(opt2);
    });

    populateServices(officeSelect.value);
}

function populateServices(officeId) {
    const serviceSelect = document.getElementById('serviceSelect');
    const office = CAMPUS_OFFICES.find(o => o.id === officeId);
    serviceSelect.innerHTML = '';
    if (!office) return;

    office.services.forEach(srv => {
        const opt = document.createElement('option');
        opt.value = srv;
        opt.textContent = srv;
        serviceSelect.appendChild(opt);
    });
}

// ==================== EVENT LISTENERS ====================
function bindEvents() {
    // Navigation views
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const target = btn.dataset.view;
            document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
            document.getElementById(`view-${target}`).classList.add('active');
            renderAll();
        });
    });

    // Office change updates services
    document.getElementById('officeSelect').addEventListener('change', (e) => {
        populateServices(e.target.value);
    });

    // Student Ticket Generation
    document.getElementById('ticketForm').addEventListener('submit', handleTicketSubmit);

    // Clear device ticket history
    document.getElementById('clearMyHistoryBtn').addEventListener('click', () => {
        showConfirm('Clear Local History', 'Remove your personal ticket history from this device?', () => {
            myTicketIds = [];
            saveState();
            renderStudentView();
            showToast('Local ticket history cleared.');
        });
    });

    // Print Ticket Modal
    document.getElementById('printTicketBtn').addEventListener('click', openPrintModal);
    document.getElementById('triggerPrintBtn').addEventListener('click', () => window.print());
    document.getElementById('closePrintModalBtn').addEventListener('click', () => {
        document.getElementById('printModal').classList.add('hidden');
    });

    // Staff Office & Window filters
    document.getElementById('staffOfficeFilter').addEventListener('change', renderStaffView);
    document.getElementById('staffWindowSelect').addEventListener('change', (e) => {
        document.getElementById('servingWindowLabel').textContent = e.target.value;
    });

    // Staff Queue Actions
    document.getElementById('callNextBtn').addEventListener('click', handleCallNext);
    document.getElementById('completeBtn').addEventListener('click', handleMarkCompleted);
    document.getElementById('skipBtn').addEventListener('click', handleSkipTicket);
    document.getElementById('recallBtn').addEventListener('click', handleRecallTicket);

    // Staff Tabs
    document.querySelectorAll('.tab-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.tab-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeStaffTab = pill.dataset.tab;
            renderStaffTable();
        });
    });

    // Search
    document.getElementById('staffSearchInput').addEventListener('input', renderStaffTable);

    // Export CSV & Reset Queue
    document.getElementById('exportCsvBtn').addEventListener('click', exportToCSV);
    document.getElementById('resetQueueBtn').addEventListener('click', () => {
        showConfirm(
            'Reset All Queues',
            'This will permanently clear all tickets and reset ticket numbers across all offices. Continue?',
            () => {
                appState.tickets = [];
                appState.counters = { registrar: 100, cashier: 100, admissions: 100, guidance: 100, clinic: 100 };
                myTicketIds = [];
                saveState();
                renderAll();
                showToast('All campus queues have been reset.');
            }
        );
    });

    // Theme & Sound Toggles
    document.getElementById('themeToggleBtn').addEventListener('click', () => {
        appState.darkMode = !appState.darkMode;
        saveState();
        applyTheme();
        renderAnalyticsView();
    });

    document.getElementById('soundToggleBtn').addEventListener('click', () => {
        appState.soundEnabled = !appState.soundEnabled;
        saveState();
        updateSoundIcon();
        showToast(appState.soundEnabled ? 'Audio alerts enabled' : 'Audio alerts muted');
    });
}

// ==================== CORE QUEUE LOGIC (FIFO + PRIORITY) ====================
function handleTicketSubmit(e) {
    e.preventDefault();
    const nameInput = document.getElementById('studentName');
    const idInput = document.getElementById('studentId');
    const officeId = document.getElementById('officeSelect').value;
    const service = document.getElementById('serviceSelect').value;
    const priority = document.querySelector('input[name="priority"]:checked').value;

    const office = CAMPUS_OFFICES.find(o => o.id === officeId);
    if (!office) return;

    appState.counters[officeId] = (appState.counters[officeId] || 100) + 1;
    const ticketNumber = `${office.prefix}-${appState.counters[officeId]}`;

    const newTicket = {
        id: 't_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        number: ticketNumber,
        studentName: nameInput.value.trim(),
        studentId: idInput.value.trim() || 'N/A',
        officeId: office.id,
        officeName: office.name,
        service: service,
        priority: priority, // 'priority' | 'regular'
        status: 'waiting',  // 'waiting' | 'serving' | 'completed' | 'skipped'
        window: null,
        createdAt: Date.now(),
        calledAt: null,
        completedAt: null
    };

    appState.tickets.push(newTicket);
    myTicketIds.unshift(newTicket.id);
    saveState();

    nameInput.value = '';
    idInput.value = '';
    playChime('new');
    showToast(`Ticket ${ticketNumber} generated for ${office.name}`);
    renderAll();
}

function getOrderedWaitingQueue(officeId) {
    const waiting = appState.tickets.filter(t => t.officeId === officeId && t.status === 'waiting');
    // Priority lane tickets are served ahead of regular tickets while preserving FIFO within each tier
    const priorityGroup = waiting.filter(t => t.priority === 'priority').sort((a, b) => a.createdAt - b.createdAt);
    const regularGroup = waiting.filter(t => t.priority !== 'priority').sort((a, b) => a.createdAt - b.createdAt);
    return [...priorityGroup, ...regularGroup];
}

function handleCallNext() {
    const officeId = document.getElementById('staffOfficeFilter').value;
    const windowName = document.getElementById('staffWindowSelect').value;

    // Auto-complete any currently serving ticket for this office if staff clicks Call Next directly
    const currentServing = appState.tickets.find(t => t.officeId === officeId && t.status === 'serving');
    if (currentServing) {
        currentServing.status = 'completed';
        currentServing.completedAt = Date.now();
    }

    const queue = getOrderedWaitingQueue(officeId);
    if (queue.length === 0) {
        showToast('No waiting tickets in this office queue.');
        saveState();
        renderAll();
        return;
    }

    const nextTicket = queue[0];
    nextTicket.status = 'serving';
    nextTicket.calledAt = Date.now();
    nextTicket.window = windowName;

    saveState();
    playChime('call');
    showToast(`Now serving ${nextTicket.number} at ${windowName}`);
    renderAll();
}

function handleMarkCompleted() {
    const officeId = document.getElementById('staffOfficeFilter').value;
    const currentServing = appState.tickets.find(t => t.officeId === officeId && t.status === 'serving');
    if (!currentServing) return;

    currentServing.status = 'completed';
    currentServing.completedAt = Date.now();
    saveState();
    showToast(`Ticket ${currentServing.number} marked completed.`);
    renderAll();
}

function handleSkipTicket() {
    const officeId = document.getElementById('staffOfficeFilter').value;
    const currentServing = appState.tickets.find(t => t.officeId === officeId && t.status === 'serving');
    if (!currentServing) return;

    currentServing.status = 'skipped';
    saveState();
    showToast(`Ticket ${currentServing.number} skipped.`);
    renderAll();
}

function handleRecallTicket() {
    const officeId = document.getElementById('staffOfficeFilter').value;
    const currentServing = appState.tickets.find(t => t.officeId === officeId && t.status === 'serving');
    if (!currentServing) return;

    playChime('call');
    showToast(`Recalling ${currentServing.number} (${currentServing.studentName}) to ${currentServing.window}`);
}

function requeueSkippedTicket(ticketId) {
    const ticket = appState.tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    ticket.status = 'waiting';
    ticket.createdAt = Date.now();
    saveState();
    showToast(`Ticket ${ticket.number} returned to waiting queue.`);
    renderAll();
}

// ==================== RENDERING ====================
function renderAll() {
    renderTicker();
    renderStudentView();
    renderStaffView();
    renderAnalyticsView();
}

function renderTicker() {
    const servingTickets = appState.tickets.filter(t => t.status === 'serving');
    const tickerEl = document.getElementById('liveTickerContent');
    if (servingTickets.length === 0) {
        tickerEl.textContent = 'All campus counters are ready. Generate a digital ticket to join a queue.';
        return;
    }
    const items = servingTickets.map(t => `${t.number} → ${t.officeName} (${t.window || 'Counter'})`);
    tickerEl.textContent = items.join('   •   ');
}

function renderStudentView() {
    const totalWaiting = appState.tickets.filter(t => t.status === 'waiting').length;
    document.getElementById('studentTotalWaiting').textContent = totalWaiting;

    // Find most recent active ticket belonging to this device
    const myTickets = myTicketIds
        .map(id => appState.tickets.find(t => t.id === id))
        .filter(Boolean);

    const activeTicket = myTickets.find(t => t.status === 'waiting' || t.status === 'serving');
    const activeCard = document.getElementById('activeTicketContainer');
    const placeholder = document.getElementById('noActiveTicketPlaceholder');

    if (activeTicket) {
        activeCard.classList.remove('hidden');
        placeholder.classList.add('hidden');

        document.getElementById('dispOffice').textContent = activeTicket.officeName;
        document.getElementById('dispNumber').textContent = activeTicket.number;
        document.getElementById('dispService').textContent = activeTicket.service;

        const prioBadge = document.getElementById('dispPriorityBadge');
        if (activeTicket.priority === 'priority') {
            prioBadge.classList.remove('hidden');
        } else {
            prioBadge.classList.add('hidden');
        }

        const queue = getOrderedWaitingQueue(activeTicket.officeId);
        const posIndex = queue.findIndex(t => t.id === activeTicket.id);
        const ahead = activeTicket.status === 'serving' ? 0 : Math.max(0, posIndex);

        const officeObj = CAMPUS_OFFICES.find(o => o.id === activeTicket.officeId);
        const estMins = ahead * (officeObj ? officeObj.avgServiceMins : 5);

        document.getElementById('dispAhead').textContent = ahead;
        document.getElementById('dispEstWait').textContent = activeTicket.status === 'serving' ? 'Now' : `${estMins}m`;
        document.getElementById('dispStatus').textContent = activeTicket.status === 'serving' ? 'Serving Now' : 'Waiting';

        const alertBanner = document.getElementById('turnAlertBanner');
        if (activeTicket.status === 'serving' || ahead <= 1) {
            alertBanner.classList.remove('hidden');
        } else {
            alertBanner.classList.add('hidden');
        }
    } else {
        activeCard.classList.add('hidden');
        placeholder.classList.remove('hidden');
    }

    // Render history list
    const historyList = document.getElementById('myHistoryList');
    if (myTickets.length === 0) {
        historyList.innerHTML = '<p class="muted-text">No tickets generated on this device yet.</p>';
    } else {
        historyList.innerHTML = myTickets.map(t => `
            <div class="history-item">
                <div>
                    <strong class="mono">${escapeHtml(t.number)}</strong> — ${escapeHtml(t.officeName)}
                    <div class="muted-text">${escapeHtml(t.service)} • ${formatTime(t.createdAt)}</div>
                </div>
                <span class="status-badge status-${t.status}">${t.status}</span>
            </div>
        `).join('');
    }
}

function renderStaffView() {
    const officeId = document.getElementById('staffOfficeFilter').value;
    const currentServing = appState.tickets.find(t => t.officeId === officeId && t.status === 'serving');

    const numEl = document.getElementById('currentServingNumber');
    const detEl = document.getElementById('currentServingDetails');
    const timerEl = document.getElementById('servingTimer');

    const completeBtn = document.getElementById('completeBtn');
    const skipBtn = document.getElementById('skipBtn');
    const recallBtn = document.getElementById('recallBtn');

    if (servingTimerInterval) {
        clearInterval(servingTimerInterval);
        servingTimerInterval = null;
    }

    if (currentServing) {
        numEl.textContent = currentServing.number;
        detEl.textContent = `${currentServing.studentName} (${currentServing.studentId}) — ${currentServing.service}`;
        timerEl.classList.remove('hidden');
        completeBtn.disabled = false;
        skipBtn.disabled = false;
        recallBtn.disabled = false;

        const updateElapsed = () => {
            const secs = Math.floor((Date.now() - (currentServing.calledAt || Date.now())) / 1000);
            const mins = String(Math.floor(secs / 60)).padStart(2, '0');
            const remSecs = String(secs % 60).padStart(2, '0');
            timerEl.textContent = `Elapsed: ${mins}:${remSecs}`;
        };
        updateElapsed();
        servingTimerInterval = setInterval(updateElapsed, 1000);
    } else {
        numEl.textContent = '---';
        detEl.textContent = 'No student currently being served';
        timerEl.classList.add('hidden');
        completeBtn.disabled = true;
        skipBtn.disabled = true;
        recallBtn.disabled = true;
    }

    // Update counts for active office
    const waitingCount = getOrderedWaitingQueue(officeId).length;
    const skippedCount = appState.tickets.filter(t => t.officeId === officeId && t.status === 'skipped').length;
    const completedCount = appState.tickets.filter(t => t.officeId === officeId && t.status === 'completed').length;

    document.getElementById('countWaiting').textContent = waitingCount;
    document.getElementById('countSkipped').textContent = skippedCount;
    document.getElementById('countCompleted').textContent = completedCount;

    renderStaffTable();
}

function renderStaffTable() {
    const officeId = document.getElementById('staffOfficeFilter').value;
    const query = document.getElementById('staffSearchInput').value.trim().toLowerCase();
    const tbody = document.getElementById('staffQueueTableBody');

    let list = [];
    if (activeStaffTab === 'waiting') {
        list = getOrderedWaitingQueue(officeId);
    } else {
        list = appState.tickets
            .filter(t => t.officeId === officeId && t.status === activeStaffTab)
            .sort((a, b) => b.createdAt - a.createdAt);
    }

    if (query) {
        list = list.filter(t =>
            t.number.toLowerCase().includes(query) ||
            t.studentName.toLowerCase().includes(query) ||
            t.service.toLowerCase().includes(query)
        );
    }

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="muted-text" style="text-align:center; padding: 24px;">No tickets in ${activeStaffTab} list.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(t => {
        const waitMins = Math.max(0, Math.round(((t.calledAt || Date.now()) - t.createdAt) / 60000));
        const prioLabel = t.priority === 'priority'
            ? '<span class="status-badge status-skipped">Priority</span>'
            : '<span class="muted-text">Regular</span>';

        let actionHtml = '—';
        if (activeStaffTab === 'skipped') {
            actionHtml = `<button class="btn btn-sm btn-outline" onclick="requeueSkippedTicket('${t.id}')">↩️ Requeue</button>`;
        }

        return `
            <tr>
                <td class="mono">${escapeHtml(t.number)}</td>
                <td><strong>${escapeHtml(t.studentName)}</strong><br><span class="muted-text">${escapeHtml(t.studentId)}</span></td>
                <td>${escapeHtml(t.service)}</td>
                <td>${prioLabel}</td>
                <td>${formatTime(t.createdAt)}</td>
                <td>${waitMins} min</td>
                <td>${actionHtml}</td>
            </tr>
        `;
    }).join('');
}

// ==================== ANALYTICS & CHARTS ====================
function renderAnalyticsView() {
    const total = appState.tickets.length;
    const completed = appState.tickets.filter(t => t.status === 'completed');
    const skipped = appState.tickets.filter(t => t.status === 'skipped');

    document.getElementById('kpiTotal').textContent = total;
    document.getElementById('kpiCompleted').textContent = completed.length;
    document.getElementById('kpiSkipped').textContent = skipped.length;

    // Average waiting time computed only when sufficient completed/called tickets exist
    const servedTickets = appState.tickets.filter(t => t.calledAt && t.createdAt);
    if (servedTickets.length >= 2) {
        const totalWaitMs = servedTickets.reduce((acc, t) => acc + (t.calledAt - t.createdAt), 0);
        const avgMins = Math.round((totalWaitMs / servedTickets.length) / 60000);
        document.getElementById('kpiAvgWait').textContent = `${avgMins} min`;
    } else {
        document.getElementById('kpiAvgWait').textContent = 'Insufficient data';
    }

    // Service Breakdown
    const serviceCounts = {};
    appState.tickets.forEach(t => {
        serviceCounts[t.service] = (serviceCounts[t.service] || 0) + 1;
    });
    const sortedServices = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const serviceListEl = document.getElementById('serviceBreakdownList');
    if (sortedServices.length === 0) {
        serviceListEl.innerHTML = '<p class="muted-text">No service data recorded yet.</p>';
    } else {
        serviceListEl.innerHTML = sortedServices.map(([srv, count]) => `
            <div class="breakdown-row">
                <span>${escapeHtml(srv)}</span>
                <strong>${count} ticket${count > 1 ? 's' : ''}</strong>
            </div>
        `).join('');
    }

    // Office Breakdown
    const officeCounts = CAMPUS_OFFICES.map(o => ({
        label: o.prefix,
        name: o.name,
        count: appState.tickets.filter(t => t.officeId === o.id).length
    }));

    const officeListEl = document.getElementById('officeBreakdownList');
    officeListEl.innerHTML = officeCounts.map(o => `
        <div class="breakdown-row">
            <span>${escapeHtml(o.name)}</span>
            <strong>${o.count} ticket${o.count !== 1 ? 's' : ''}</strong>
        </div>
    `).join('');

    drawBarChart('officeChart', officeCounts.map(o => o.label), officeCounts.map(o => o.count));
    drawDonutChart('serviceChart', sortedServices);
}

function drawBarChart(canvasId, labels, values) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const isDark = appState.darkMode;
    const textColor = isDark ? '#CBD5E1' : '#334155';
    const gridColor = isDark ? '#263B54' : '#E2E8F0';
    const maxVal = Math.max(...values, 5);

    const padLeft = 36;
    const padBottom = 32;
    const padTop = 20;
    const chartW = w - padLeft - 20;
    const chartH = h - padTop - padBottom;

    // Grid lines
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padTop + (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padLeft, y);
        ctx.lineTo(w - 15, y);
        ctx.stroke();
    }

    const barWidth = (chartW / labels.length) * 0.52;
    const gap = chartW / labels.length;

    labels.forEach((lbl, idx) => {
        const val = values[idx];
        const barH = (val / maxVal) * chartH;
        const x = padLeft + idx * gap + (gap - barWidth) / 2;
        const y = padTop + chartH - barH;

        ctx.fillStyle = idx % 2 === 0 ? '#2685D8' : '#53BECF';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barH, [6, 6, 0, 0]);
        ctx.fill();

        ctx.fillStyle = textColor;
        ctx.font = '600 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(lbl, x + barWidth / 2, h - 10);
        if (val > 0) {
            ctx.fillText(String(val), x + barWidth / 2, y - 6);
        }
    });
}

function drawDonutChart(canvasId, entries) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.36;
    const colors = ['#132A44', '#2685D8', '#53BECF', '#16A34A', '#D97706'];

    const total = entries.reduce((sum, e) => sum + e[1], 0);
    if (total === 0) {
        ctx.strokeStyle = appState.darkMode ? '#263B54' : '#DCE4EC';
        ctx.lineWidth = 22;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = appState.darkMode ? '#94A3B8' : '#64748B';
        ctx.font = '600 13px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No Tickets Yet', cx, cy + 5);
        return;
    }

    let startAngle = -Math.PI / 2;
    entries.forEach(([_, count], idx) => {
        const sliceAngle = (count / total) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
        ctx.strokeStyle = colors[idx % colors.length];
        ctx.lineWidth = 26;
        ctx.stroke();
        startAngle += sliceAngle;
    });

    ctx.fillStyle = appState.darkMode ? '#F1F5F9' : '#132A44';
    ctx.font = '800 20px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(total), cx, cy + 4);
    ctx.font = '600 11px Inter, sans-serif';
    ctx.fillText('TOTAL', cx, cy + 20);
}

// ==================== UTILITIES & MODALS ====================
function openPrintModal() {
    const myTickets = myTicketIds
        .map(id => appState.tickets.find(t => t.id === id))
        .filter(Boolean);
    const ticket = myTickets.find(t => t.status === 'waiting' || t.status === 'serving') || myTickets[0];
    if (!ticket) return;

    document.getElementById('printOffice').textContent = ticket.officeName;
    document.getElementById('printNumber').textContent = ticket.number;
    document.getElementById('printService').textContent = ticket.service;
    document.getElementById('printStudent').textContent = `${ticket.studentName} (${ticket.studentId})`;
    document.getElementById('printTime').textContent = `Issued: ${new Date(ticket.createdAt).toLocaleString()}`;
    document.getElementById('printPriority').textContent = ticket.priority === 'priority' ? 'PRIORITY LANE' : 'REGULAR LANE';

    document.getElementById('printModal').classList.remove('hidden');
}

function exportToCSV() {
    if (appState.tickets.length === 0) {
        showToast('No queue records available to export.');
        return;
    }

    const headers = ['Ticket Number', 'Student Name', 'Student ID', 'Office', 'Service', 'Priority', 'Status', 'Window', 'Issued At', 'Completed At'];
    const rows = appState.tickets.map(t => [
        t.number,
        `"${t.studentName.replace(/"/g, '""')}"`,
        `"${t.studentId.replace(/"/g, '""')}"`,
        `"${t.officeName}"`,
        `"${t.service}"`,
        t.priority,
        t.status,
        t.window || '',
        new Date(t.createdAt).toISOString(),
        t.completedAt ? new Date(t.completedAt).toISOString() : ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LinyaIIT_Queue_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('CSV report downloaded.');
}

function showConfirm(title, message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    modal.classList.remove('hidden');

    const okBtn = document.getElementById('confirmOkBtn');
    const cancelBtn = document.getElementById('confirmCancelBtn');

    const cleanup = () => {
        modal.classList.add('hidden');
        okBtn.replaceWith(okBtn.cloneNode(true));
        cancelBtn.replaceWith(cancelBtn.cloneNode(true));
    };

    document.getElementById('confirmOkBtn').addEventListener('click', () => {
        cleanup();
        onConfirm();
    });

    document.getElementById('confirmCancelBtn').addEventListener('click', cleanup);
}

function showToast(msg) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3500);
}

function applyTheme() {
    const html = document.documentElement;
    const icon = document.getElementById('themeIcon');
    if (appState.darkMode) {
        html.classList.add('dark');
        icon.textContent = '☀️';
    } else {
        html.classList.remove('dark');
        icon.textContent = '🌙';
    }
}

function updateSoundIcon() {
    document.getElementById('soundIcon').textContent = appState.soundEnabled ? '🔔' : '🔕';
}

function playChime(type) {
    if (!appState.soundEnabled) return;
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'call') {
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
        } else {
            osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        }

        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
    } catch (e) {
        // Ignore audio restrictions if user has not interacted yet
    }
}

function startClock() {
    const clockEl = document.getElementById('liveClock');
    const tick = () => {
        clockEl.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };
    tick();
    setInterval(tick, 1000);
}

function formatTime(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
