checkAuth('staff');

let staffData = {
    kpis: {},
    pending_bookings: [],
    approved_bookings: [],
    rejected_bookings: [],
    courts: []
};
let activeStaffTab = 'pending';

// Load staff dashboard data
async function fetchStaffDashboard() {
    try {
        const response = await fetch('../api/staff/dashboard.php');
        const result = await response.json();
        
        if (result.success) {
            staffData = result;
            updateKPIs(result.kpis);
            renderStaffBookings();
            renderCourtsStatus(result.courts);
            populateReportCourts(result.courts);
            populateClosureCourts(result.courts);
            await fetchClosuresList();
        }
    } catch (e) {
        showStaffAlert('danger', 'เกิดข้อผิดพลาดในการโหลดข้อมูลหลังบ้าน');
    }
}

function updateKPIs(kpis) {
    document.getElementById('kpi-pending').textContent = `${kpis.pending_count} คำขอ`;
    document.getElementById('kpi-approved-today').textContent = `${kpis.approved_today_count} รอบ`;
    document.getElementById('kpi-checkin-rate').textContent = `${kpis.checkin_rate}%`;
    document.getElementById('kpi-popular').textContent = kpis.popular_court_name;
    
    // Update Tab counts
    document.getElementById('btn-staff-pending').textContent = `รอพิจารณา (${staffData.pending_bookings.length})`;
    document.getElementById('btn-staff-approved').textContent = `อนุมัติแล้ว (${staffData.approved_bookings.length})`;
    document.getElementById('btn-staff-rejected').textContent = `ปฏิเสธแล้ว (${staffData.rejected_bookings.length})`;
}

function switchStaffBookingTab(tab) {
    activeStaffTab = tab;
    
    const tabs = ['pending', 'approved', 'rejected'];
    tabs.forEach(t => {
        const btn = document.getElementById(`btn-staff-${t}`);
        if (t === tab) {
            btn.className = "px-2.5 py-1.5 rounded-lg bg-psruGreen text-white shadow-sm font-bold transition-all";
        } else {
            btn.className = "px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-psruGreen transition-all";
        }
    });
    
    renderStaffBookings();
}

function renderStaffBookings() {
    const pendingContainer = document.getElementById('staff-tab-pending');
    const approvedContainer = document.getElementById('staff-tab-approved');
    const rejectedContainer = document.getElementById('staff-tab-rejected');
    
    // Hide all tab views
    pendingContainer.classList.add('hidden');
    approvedContainer.classList.add('hidden');
    rejectedContainer.classList.add('hidden');
    
    const activeView = document.getElementById(`staff-tab-${activeStaffTab}`);
    activeView.classList.remove('hidden');
    activeView.innerHTML = '';
    
    let list = [];
    if (activeStaffTab === 'pending') list = staffData.pending_bookings;
    else if (activeStaffTab === 'approved') list = staffData.approved_bookings;
    else if (activeStaffTab === 'rejected') list = staffData.rejected_bookings;
    
    if (list.length === 0) {
        activeView.innerHTML = `
            <div class="p-8 text-center text-gray-400">
                <i data-lucide="check-circle-2" class="w-10 h-10 text-gray-300 mx-auto mb-2"></i>
                <p class="font-medium text-xs">ไม่มีรายการในหมวดหมู่นี้</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    list.forEach(booking => {
        const optDate = new Date(booking.booking_date).toLocaleDateString('th-TH');
        
        if (activeStaffTab === 'pending') {
            activeView.insertAdjacentHTML('beforeend', `
                <div class="p-5 hover:bg-gray-50/50 transition-colors space-y-4">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div class="flex items-center space-x-3">
                            <div class="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold text-xs">
                                ${booking.first_name.charAt(0)}
                            </div>
                            <div>
                                <h4 class="text-sm font-bold text-gray-950 cursor-pointer hover:text-psruGreen" 
                                    onclick="openUserModal('${booking.first_name} ${booking.last_name}', '${booking.username}', 'รหัสนักศึกษา: ${booking.username}', '${booking.phone}', 'ประวัติ: ปกติ (อีเมล: ${booking.email})')">
                                    นศ. ${booking.first_name} ${booking.last_name} <i data-lucide="external-link" class="w-3.5 h-3.5 inline text-gray-400 ml-0.5"></i>
                                </h4>
                                <p class="text-[11px] text-gray-400">รหัส: ${booking.username} · โทร: ${booking.phone}</p>
                            </div>
                        </div>
                        <span class="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded self-start sm:self-center">ID: ${booking.booking_code}</span>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 bg-gray-50 rounded-xl p-3 gap-2 text-xs text-gray-600">
                        <div><span class="font-medium">🏟️ สนาม:</span> <span class="text-gray-900 font-semibold">${booking.court_name}</span></div>
                        <div><span class="font-medium">⏱️ เวลา:</span> <span class="text-gray-900 font-semibold">${optDate} · ${booking.start_time.slice(0, 5)} - ${booking.end_time.slice(0, 5)} น.</span></div>
                        <div class="sm:col-span-2 border-t border-gray-200/60 pt-2 mt-1">
                            <span class="font-medium text-psruGreen">🎯 หัวข้อ/วัตถุประสงค์:</span> 
                            <span class="text-gray-900 bg-green-50/70 px-2 py-0.5 rounded border border-green-100 font-semibold">${booking.booking_title || 'ไม่ได้ระบุ'}</span>
                        </div>
                        ${booking.additional_request ? `
                        <div class="sm:col-span-2">
                            <span class="font-medium text-amber-700">💡 รายละเอียดเพิ่มเติม:</span> 
                            <span class="text-gray-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 font-medium">"${booking.additional_request}"</span>
                        </div>` : ''}
                    </div>

                    <div class="flex justify-end space-x-2 text-xs pt-1">
                        <button onclick="openApprovalModal(${booking.id}, '${booking.booking_code}', 'approve')" class="bg-psruGreen hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-xl shadow-sm transition-all flex items-center space-x-1">
                            <i data-lucide="check" class="w-3.5 h-3.5"></i>
                            <span>อนุมัติการจอง</span>
                        </button>
                        <button onclick="openApprovalModal(${booking.id}, '${booking.booking_code}', 'reject')" class="border border-red-200 hover:bg-red-50 text-red-500 font-semibold py-2 px-4 rounded-xl transition-all flex items-center space-x-1">
                            <i data-lucide="x" class="w-3.5 h-3.5"></i>
                            <span>ไม่อนุมัติ</span>
                        </button>
                    </div>
                </div>
            `);
        } else if (activeStaffTab === 'approved') {
            const staffName = booking.staff_first ? `👤 ผู้พิจารณา: เจ้าหน้าที่ ${booking.staff_first} ${booking.staff_last}` : '';
            activeView.insertAdjacentHTML('beforeend', `
                <div class="p-5 hover:bg-gray-50/50 transition-colors space-y-3">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div class="flex items-center space-x-3">
                            <div class="w-8 h-8 rounded-full bg-green-50 text-psruGreen flex items-center justify-center font-bold text-xs">
                                ${booking.first_name.charAt(0)}
                            </div>
                            <div>
                                <h4 class="text-sm font-bold text-gray-900">นศ. ${booking.first_name} ${booking.last_name}</h4>
                                <p class="text-[11px] text-gray-400">รหัส: ${booking.username} · โทร: ${booking.phone}</p>
                            </div>
                        </div>
                        <span class="text-xs bg-green-50 text-psruGreen border border-green-100 px-2 py-0.5 rounded font-bold">🟢 อนุมัติสิทธิ์แล้ว</span>
                    </div>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-2 bg-gray-50 rounded-xl p-3 gap-2 text-xs text-gray-600">
                        <div><span class="font-medium">🏟️ สนาม:</span> <span class="text-gray-900 font-semibold">${booking.court_name}</span></div>
                        <div><span class="font-medium">⏱️ เวลา:</span> <span class="text-gray-900 font-semibold">${optDate} · ${booking.start_time.slice(0, 5)} - ${booking.end_time.slice(0, 5)} น.</span></div>
                        ${booking.booking_title ? `
                        <div class="sm:col-span-2 border-t border-gray-200/50 pt-2 mt-1">
                            <span class="font-medium text-psruGreen">🎯 วัตถุประสงค์:</span> 
                            <span class="text-gray-900 font-semibold">${booking.booking_title}</span>
                        </div>` : ''}
                        ${staffName ? `<div class="sm:col-span-2 text-[10px] text-gray-400 border-t border-gray-200/50 pt-2 mt-1">${staffName}</div>` : ''}
                    </div>
                </div>
            `);
        } else if (activeStaffTab === 'rejected') {
            const staffName = booking.staff_first ? `👤 ผู้จัดการ: เจ้าหน้าที่ ${booking.staff_first} ${booking.staff_last}` : '';
            activeView.insertAdjacentHTML('beforeend', `
                <div class="p-5 hover:bg-gray-50/50 transition-colors space-y-3">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div class="flex items-center space-x-3">
                            <div class="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center font-bold text-xs">
                                ${booking.first_name.charAt(0)}
                            </div>
                            <div>
                                <h4 class="text-sm font-bold text-gray-900">นศ. ${booking.first_name} ${booking.last_name}</h4>
                                <p class="text-[11px] text-gray-400">รหัส: ${booking.username}</p>
                            </div>
                        </div>
                        <span class="text-xs bg-red-50 text-red-500 border border-red-100 px-2 py-0.5 rounded font-bold">🔴 ปฏิเสธการจอง</span>
                    </div>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-2 bg-gray-50 rounded-xl p-3 gap-2 text-xs text-gray-600">
                        <div><span class="font-medium">🏟️ สนาม:</span> <span class="text-gray-900 font-semibold">${booking.court_name}</span></div>
                        <div><span class="font-medium">⏱️ เวลา:</span> <span class="text-gray-900 font-semibold">${optDate} · ${booking.start_time.slice(0, 5)} - ${booking.end_time.slice(0, 5)} น.</span></div>
                        ${booking.booking_title ? `
                        <div class="sm:col-span-2 border-t border-gray-200/50 pt-2 mt-1">
                            <span class="font-medium text-psruGreen">🎯 วัตถุประสงค์:</span> 
                            <span class="text-gray-900 font-semibold">${booking.booking_title}</span>
                        </div>` : ''}
                        <div class="sm:col-span-2 border-t border-gray-200/50 pt-2 mt-1">
                            <span class="font-medium text-red-700">❌ เหตุผลการปฏิเสธ:</span>
                            <span class="text-gray-800 font-medium">"${booking.rejection_reason}"</span>
                        </div>
                        ${staffName ? `<div class="sm:col-span-2 text-[10px] text-gray-400 border-t border-gray-100/50 pt-1">${staffName}</div>` : ''}
                    </div>
                </div>
            `);
        }
    });
    
    lucide.createIcons();
}

// Render court readiness checkboxes
function renderCourtsStatus(courts) {
    const list = document.getElementById('courts-status-list');
    list.innerHTML = '';
    
    courts.forEach(court => {
        let select_class = "bg-green-50 text-psruGreen focus:ring-psruGreen";
        if (court.status === 'maintenance') select_class = "bg-amber-50 text-amber-600 focus:ring-amber-500";
        else if (court.status === 'closed') select_class = "bg-red-50 text-red-500 focus:ring-red-500";
        
        list.insertAdjacentHTML('beforeend', `
            <div class="border border-gray-100 rounded-xl p-3 bg-gray-50/50 flex items-center justify-between">
                <div class="max-w-[60%]">
                    <h4 class="font-bold text-gray-900 truncate">${court.name}</h4>
                    <p class="text-[10px] text-gray-400 mt-0.5">ประเภท: ${court.sport_type}</p>
                </div>
                <select onchange="updateCourtStatus(this, ${court.id})" class="${select_class} font-semibold border-none py-1 px-2 rounded-lg text-[11px] focus:outline-none">
                    <option value="ready" ${court.status === 'ready' ? 'selected' : ''}>🟢 พร้อมใช้งาน</option>
                    <option value="maintenance" ${court.status === 'maintenance' ? 'selected' : ''}>🟡 ปรับปรุงชั่วคราว</option>
                    <option value="closed" ${court.status === 'closed' ? 'selected' : ''}>🔴 ปิดให้บริการ</option>
                </select>
            </div>
        `);
    });
}

function populateReportCourts(courts) {
    const select = document.getElementById('report-court-id');
    select.innerHTML = '<option value="">-- กรุณาเลือกสนามกีฬา --</option>';
    courts.forEach(court => {
        select.insertAdjacentHTML('beforeend', `<option value="${court.id}">${court.name}</option>`);
    });
}

// Action Submits
async function updateCourtStatus(selectElement, id) {
    const status = selectElement.value;
    try {
        const response = await fetch('../api/staff/actions.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update_court_status', court_id: id, court_status: status })
        });
        const result = await response.json();
        if (result.success) {
            showStaffAlert('success', result.message);
            fetchStaffDashboard();
        }
    } catch(e) {
        showStaffAlert('danger', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
}

document.getElementById('action-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = this.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    
    const payload = {
        action: 'booking_action',
        booking_id: document.getElementById('action-booking-id').value,
        action_type: document.getElementById('action-type').value,
        reason: document.getElementById('action-reason').value
    };
    
    try {
        const response = await fetch('../api/staff/actions.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.success) {
            showStaffAlert('success', result.message);
            closeModal('action-modal');
            fetchStaffDashboard();
        } else {
            alert(result.message);
        }
    } catch(e) {
        alert('เกิดข้อผิดพลาด');
    } finally {
        submitBtn.disabled = false;
    }
});

document.getElementById('report-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = this.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    
    const payload = {
        action: 'report_issue',
        report_court_id: document.getElementById('report-court-id').value,
        report_description: document.getElementById('report-description').value
    };
    
    try {
        const response = await fetch('../api/staff/actions.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.success) {
            showStaffAlert('success', result.message);
            closeModal('report-modal');
            document.getElementById('report-form').reset();
        } else {
            alert(result.message);
        }
    } catch (e) {
        alert('เกิดข้อผิดพลาด');
    } finally {
        submitBtn.disabled = false;
    }
});

// Modals triggers
function openUserModal(name, id, faculty, phone, history) {
    document.getElementById('u-name').textContent = name;
    document.getElementById('u-id').textContent = id;
    document.getElementById('u-faculty').textContent = faculty;
    document.getElementById('u-phone').textContent = phone;
    document.getElementById('u-history').innerHTML = `<i data-lucide='shield' class='w-3.5 h-3.5 inline mr-1'></i> ${history}`;
    document.getElementById('user-modal').classList.remove('hidden');
    lucide.createIcons();
}

function openApprovalModal(id, code, actionType) {
    document.getElementById('action-booking-id').value = id;
    document.getElementById('action-target-code').textContent = code;
    document.getElementById('action-type').value = actionType;
    
    const container = document.getElementById('action-icon-container');
    const title = document.getElementById('action-title');
    const textarea = document.getElementById('action-reason');

    if (actionType === 'approve') {
        container.className = "w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-3 bg-green-50 text-psruGreen";
        container.innerHTML = `<i data-lucide="check" class="w-6 h-6"></i>`;
        title.textContent = "ยืนยันการอนุมัติการจอง";
        textarea.value = "อนุมัติคำขอจองสนามกีฬา สิทธิ์นักศึกษาเข้าใช้งานฟรีตามเวลาดังกล่าว";
    } else {
        container.className = "w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-3 bg-red-50 text-red-500";
        container.innerHTML = `<i data-lucide="x" class="w-6 h-6"></i>`;
        title.textContent = "ปฏิเสธ/ไม่อนุมัติคำขอจอง";
        textarea.value = "";
        textarea.placeholder = "โปรดระบุเหตุผล เช่น ติดกิจกรรมด่วนของมหาวิทยาลัย หรือสนามปิดปรับปรุง...";
    }

    document.getElementById('action-modal').classList.remove('hidden');
    lucide.createIcons();
}

function populateClosureCourts(courts) {
    const select = document.getElementById('closure-court-id');
    if (!select) return;
    select.innerHTML = '<option value="" disabled selected>-- เลือกสนามกีฬา --</option>';
    courts.forEach(court => {
        select.insertAdjacentHTML('beforeend', `<option value="${court.id}">${court.name} (${court.campus_name})</option>`);
    });
}

// Fetch and render list of active/upcoming closures
async function fetchClosuresList() {
    const container = document.getElementById('closures-list');
    if (!container) return;

    try {
        const res = await fetch('../api/closures/list.php?upcoming=1');
        const data = await res.json();

        if (data.success) {
            if (data.closures.length === 0) {
                container.innerHTML = `<p class="text-gray-400 text-center py-2 text-[11px]">ไม่มีรายการปิดให้บริการสนาม</p>`;
            } else {
                container.innerHTML = '';
                data.closures.forEach(cl => {
                    const sDate = new Date(cl.start_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
                    const eDate = new Date(cl.end_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
                    const dateText = cl.start_date === cl.end_date ? sDate : `${sDate} - ${eDate}`;
                    
                    container.insertAdjacentHTML('beforeend', `
                        <div class="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 flex items-start justify-between gap-2">
                            <div>
                                <span class="font-bold text-gray-900 block leading-tight">${cl.court_name}</span>
                                <span class="text-[10px] text-amber-700 font-semibold block mt-0.5">📅 ${dateText}</span>
                                <span class="text-[10px] text-gray-500 block mt-0.5">เหตุผล: ${cl.reason}</span>
                            </div>
                            <button onclick="deleteClosure(${cl.id})" class="text-gray-400 hover:text-red-500 p-1 transition-colors" title="ยกเลิกการปิดสนาม">
                                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                            </button>
                        </div>
                    `);
                });
                if (window.lucide) lucide.createIcons();
            }
        }
    } catch (e) {
        container.innerHTML = `<p class="text-red-500 text-center py-1 text-[11px]">โหลดรายการไม่สำเร็จ</p>`;
    }
}

function openClosureModal() {
    const today = new Date().toISOString().split('T')[0];
    const sInput = document.getElementById('closure-start-date');
    const eInput = document.getElementById('closure-end-date');
    if (sInput) sInput.value = today;
    if (eInput) eInput.value = today;
    document.getElementById('closure-modal').classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
}

function setClosurePreset(reason) {
    const reasonInput = document.getElementById('closure-reason');
    if (reasonInput) reasonInput.value = reason;
}

// Handle Closure form submit
const closureForm = document.getElementById('closure-form');
if (closureForm) {
    closureForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const submitBtn = document.getElementById('closure-submit-btn');
        const courtId = document.getElementById('closure-court-id').value;
        const startDate = document.getElementById('closure-start-date').value;
        const endDate = document.getElementById('closure-end-date').value;
        const reason = document.getElementById('closure-reason').value.trim();

        if (!courtId || !startDate || !endDate || !reason) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'กำลังบันทึก...';

        try {
            const res = await fetch('../api/closures/create.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    court_id: courtId,
                    start_date: startDate,
                    end_date: endDate,
                    reason: reason
                })
            });
            const result = await res.json();
            if (result.success) {
                showStaffAlert('success', result.message);
                closeModal('closure-modal');
                closureForm.reset();
                await fetchClosuresList();
            } else {
                alert(result.message);
            }
        } catch (e) {
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'บันทึกการปิดสนาม';
        }
    });
}

// Delete closure
async function deleteClosure(id) {
    if (!confirm('ต้องการยกเลิกการปิดให้บริการสนามนี้ใช่หรือไม่?')) return;

    try {
        const res = await fetch('../api/closures/delete.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });
        const result = await res.json();
        if (result.success) {
            showStaffAlert('success', result.message);
            await fetchClosuresList();
        } else {
            alert(result.message);
        }
    } catch (e) {
        alert('เกิดข้อผิดพลาด');
    }
}

function openReportModal() {
    document.getElementById('report-modal').classList.remove('hidden');
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

function showStaffAlert(type, msg) {
    const alert = document.getElementById('status-alert');
    const alertIcon = document.getElementById('status-alert-icon');
    const alertText = document.getElementById('status-alert-text');
    
    alert.className = type === 'success' 
        ? "bg-green-50 text-green-700 p-4 rounded-xl border border-green-100 font-medium text-xs flex items-center space-x-2 shadow-sm"
        : "bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 font-medium text-xs flex items-center space-x-2 shadow-sm";
        
    alertIcon.setAttribute('data-lucide', type === 'success' ? 'check-circle' : 'alert-circle');
    alertText.textContent = msg;
    alert.classList.remove('hidden');
    
    lucide.createIcons();
    
    setTimeout(() => {
        alert.classList.add('hidden');
    }, 4000);
}

// Bootstrapping
window.addEventListener('DOMContentLoaded', async () => {
    await fetchStaffDashboard();
    if (window.lucide) lucide.createIcons();
});
