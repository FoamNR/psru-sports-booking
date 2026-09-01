checkAuth('admin');

let usersList = [];
let courtsList = [];

// Tab Switching
function switchTab(sectionId) {
    const panels = document.querySelectorAll('.admin-panel');
    panels.forEach(p => p.classList.add('hidden'));

    document.getElementById(sectionId).classList.remove('hidden');

    const buttons = document.querySelectorAll('.tab-menu-btn');
    buttons.forEach(b => {
        b.className = "tab-menu-btn w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-psruGreen transition-all text-left";
    });
    
    let btnId = '';
    if (sectionId === 'users-section') btnId = 'menu-users';
    else if (sectionId === 'courts-section') btnId = 'menu-courts';
    else if (sectionId === 'news-section') btnId = 'menu-news';
    else if (sectionId === 'closures-section') {
        btnId = 'menu-closures';
        fetchAdminClosures();
    }
    
    const activeBtn = document.getElementById(btnId);
    if (activeBtn) {
        activeBtn.className = "tab-menu-btn w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold bg-green-50 text-psruGreen transition-all text-left";
    }
}

// Fetch dashboard data
async function fetchAdminData() {
    try {
        const response = await fetch('../api/admin/dashboard.php');
        const result = await response.json();
        
        if (result.success) {
            usersList = result.users;
            courtsList = result.courts;
            
            renderUsers(usersList);
            renderCourts(courtsList);
            renderAdminClosureCourts(courtsList);
            await fetchAdminClosures();
        }
    } catch (e) {
        showAlert('danger', 'เกิดข้อผิดพลาดในการโหลดข้อมูลหลังบ้าน');
    }
}

// Render Users
function renderUsers(users) {
    const pendingStaffBody = document.getElementById('pending-staff-table-body');
    const usersTableBody = document.getElementById('users-table-body');
    
    pendingStaffBody.innerHTML = '';
    usersTableBody.innerHTML = '';
    
    const pendingStaff = users.filter(u => u.role === 'staff' && u.status === 'suspended');
    
    if (pendingStaff.length === 0) {
        pendingStaffBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-400">ไม่มีคำขอเปิดสิทธิ์บัญชีผู้ดูแลสนามเพิ่มใหม่ค้างอยู่</td></tr>`;
    } else {
        pendingStaff.forEach(staff => {
            pendingStaffBody.insertAdjacentHTML('beforeend', `
                <tr class="hover:bg-gray-50/50">
                    <td class="p-3">${staff.first_name} ${staff.last_name}</td>
                    <td class="p-3 font-mono">${staff.username}</td>
                    <td class="p-3">${staff.phone}</td>
                    <td class="p-3">${staff.email}</td>
                    <td class="p-3 text-right">
                        <button onclick="toggleUserStatus(${staff.id})" class="bg-psruGreen hover:bg-green-700 text-white font-bold py-1 px-3 rounded-lg transition-all">
                            อนุมัติสิทธิ์การใช้งาน
                        </button>
                    </td>
                </tr>
            `);
        });
    }
    
    users.forEach(user => {
        let role_label = 'นักศึกษา';
        let role_badge = 'bg-gray-100 text-gray-700';
        
        if (user.role === 'staff') {
            role_label = 'ผู้ดูแลสนาม';
            role_badge = 'bg-amber-100 text-amber-800';
        } else if (user.role === 'admin') {
            role_label = 'แอดมินระบบ';
            role_badge = 'bg-blue-100 text-blue-800';
        }
        
        const status_label = user.status === 'normal' ? 'เปิดสิทธิ์ใช้งาน' : 'ระงับสิทธิ์ชั่วคราว';
        const status_badge = user.status === 'normal' ? 'text-green-700 bg-green-50 border-green-100' : 'text-red-600 bg-red-50 border-red-100';
        const status_dot = user.status === 'normal' ? 'bg-green-500' : 'bg-red-500';
        const status_title = user.status === 'normal' ? 'ระงับบัญชี' : 'ปลดระงับ';

        usersTableBody.insertAdjacentHTML('beforeend', `
            <tr class="hover:bg-gray-50/50" 
                data-id="${user.id}"
                data-username="${user.username}"
                data-first-name="${user.first_name}"
                data-last-name="${user.last_name}"
                data-email="${user.email}"
                data-phone="${user.phone}"
                data-role="${user.role}"
                data-status="${user.status}">
                <td class="p-4">${user.first_name} ${user.last_name}</td>
                <td class="p-4 font-mono text-gray-600">${user.username}</td>
                <td class="p-4"><span class="${role_badge} px-2 py-0.5 rounded text-[10px] font-bold">${role_label}</span></td>
                <td class="p-4">
                    <span class="${status_badge} flex items-center w-max px-2.5 py-0.5 rounded-full border text-[10px] font-semibold">
                        <span class="w-1.5 h-1.5 ${status_dot} rounded-full inline-block mr-1"></span> 
                        ${status_label}
                    </span>
                </td>
                <td class="p-4 text-right space-x-3">
                    <button onclick="viewUserDetails('${user.first_name} ${user.last_name}', '${user.username}', '${role_label}', 'เบอร์โทร: ${user.phone} | อีเมล: ${user.email} | สถานะ: ${status_label}')" class="text-gray-500 hover:text-psruGreen" title="เรียกดูรายละเอียด"><i data-lucide="eye" class="w-4 h-4 inline"></i></button>
                    <button onclick="openEditUserModal(this)" class="text-gray-500 hover:text-blue-600" title="แก้ไขข้อมูลบัญชี"><i data-lucide="edit-2" class="w-4 h-4 inline"></i></button>
                    <button onclick="toggleUserStatus(${user.id})" class="text-gray-500 hover:text-amber-500" title="${status_title}"><i data-lucide="shield-alert" class="w-4 h-4 inline"></i></button>
                    <button onclick="deleteUser(${user.id}, '${user.first_name}')" class="text-gray-400 hover:text-red-500" title="ลบบัญชี"><i data-lucide="trash-2" class="w-4 h-4 inline"></i></button>
                </td>
            </tr>
        `);
    });
    
    lucide.createIcons();
}

// Filter Users via Search Input
function filterUsers() {
    const kw = document.getElementById('search-users-input').value.toLowerCase().trim();
    const rows = document.querySelectorAll('#users-table-body tr');
    
    rows.forEach(row => {
        const name = row.querySelector('td:first-child').textContent.toLowerCase();
        const uid = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
        if (name.includes(kw) || uid.includes(kw)) {
            row.classList.remove('hidden');
        } else {
            row.classList.add('hidden');
        }
    });
}

// Render Courts
function renderCourts(courts) {
    const container = document.getElementById('courts-grid-container');
    container.innerHTML = '';
    
    courts.forEach(court => {
        const campus_color = court.campus_id === 1 ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800';
        let status_label = '🟢 พร้อมใช้งาน';
        if (court.status === 'maintenance') status_label = '🟡 ปรับปรุงชั่วคราว';
        else if (court.status === 'closed') status_label = '🔴 ปิดให้บริการ';
        
        container.insertAdjacentHTML('beforeend', `
            <div class="border border-gray-200 rounded-xl p-4 flex justify-between items-start bg-gray-50/50">
                <div>
                    <span class="text-[10px] ${campus_color} px-2 py-0.5 rounded-md font-bold">${court.campus_name}</span>
                    <h3 class="font-bold text-sm text-gray-950 mt-1.5">${court.name}</h3>
                    <p class="text-gray-500 mt-1">ประเภท: ${court.sport_type} · สถานะ: ${status_label}</p>
                </div>
                <div class="flex space-x-1">
                    <a href="edit-court.html?court_id=${court.id}" class="p-2 border border-gray-200 hover:border-blue-300 text-gray-600 bg-white rounded-xl inline-block shadow-sm" title="แก้ไขสนาม"><i data-lucide="edit-2" class="w-4 h-4"></i></a>
                    <button onclick="deleteCourt(${court.id}, '${court.name}')" class="p-2 border border-gray-200 hover:border-red-300 text-red-500 bg-white rounded-xl shadow-sm" title="ลบสนาม"><i data-lucide="trash" class="w-4 h-4"></i></button>
                </div>
            </div>
        `);
    });
    
    lucide.createIcons();
}

// Admin Action handlers
async function toggleUserStatus(id) {
    try {
        const response = await fetch('../api/admin/dashboard.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'toggle_status', target_id: id })
        });
        const result = await response.json();
        if (result.success) {
            showAlert('success', result.message);
            fetchAdminData();
        }
    } catch (e) {
        showAlert('danger', 'เกิดข้อผิดพลาดในการทำรายการ');
    }
}

async function deleteUser(id, name) {
    const swalRes = await Swal.fire({
        title: 'ยืนยันการลบผู้ใช้?',
        html: `คุณต้องการลบข้อมูลบัญชีของ <strong>"${name}"</strong> ออกจากระบบใช่หรือไม่?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'ยืนยันลบข้อมูล',
        cancelButtonText: 'ยกเลิก',
        customClass: { popup: 'rounded-3xl' }
    });

    if (swalRes.isConfirmed) {
        try {
            const response = await fetch('../api/admin/dashboard.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_user', target_id: id })
            });
            const result = await response.json();
            if (result.success) {
                showAlert('success', result.message);
                fetchAdminData();
                Swal.fire({
                    title: 'ลบสำเร็จ!',
                    text: result.message,
                    icon: 'success',
                    confirmButtonColor: '#01a715',
                    customClass: { popup: 'rounded-3xl' }
                });
            } else {
                Swal.fire({
                    title: 'ไม่สำเร็จ',
                    text: result.message,
                    icon: 'error',
                    confirmButtonColor: '#ef4444',
                    customClass: { popup: 'rounded-3xl' }
                });
            }
        } catch (e) {
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: 'เกิดข้อผิดพลาดในการลบผู้ใช้งาน',
                icon: 'error',
                confirmButtonColor: '#ef4444',
                customClass: { popup: 'rounded-3xl' }
            });
        }
    }
}

async function deleteCourt(id, name) {
    const swalRes = await Swal.fire({
        title: 'ยืนยันการลบสนามกีฬา?',
        html: `คุณต้องการลบข้อมูลสนามกีฬา <strong>"${name}"</strong> ออกจากระบบใช่หรือไม่?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'ยืนยันลบสนาม',
        cancelButtonText: 'ยกเลิก',
        customClass: { popup: 'rounded-3xl' }
    });

    if (swalRes.isConfirmed) {
        try {
            const response = await fetch(`../api/admin/court-action.php?action=delete_court&court_id=${id}`);
            const result = await response.json();
            if (result.success) {
                showAlert('success', result.message);
                fetchAdminData();
                Swal.fire({
                    title: 'ลบสำเร็จ!',
                    text: result.message,
                    icon: 'success',
                    confirmButtonColor: '#01a715',
                    customClass: { popup: 'rounded-3xl' }
                });
            } else {
                Swal.fire({
                    title: 'ไม่สำเร็จ',
                    text: result.message,
                    icon: 'error',
                    confirmButtonColor: '#ef4444',
                    customClass: { popup: 'rounded-3xl' }
                });
            }
        } catch (e) {
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: 'เกิดข้อผิดพลาดในการลบสนาม',
                icon: 'error',
                confirmButtonColor: '#ef4444',
                customClass: { popup: 'rounded-3xl' }
            });
        }
    }
}

// Form submits
document.getElementById('add-user-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const payload = {
        action: 'create_user',
        username: document.getElementById('add-username').value,
        password: document.getElementById('add-password').value,
        first_name: document.getElementById('add-first-name').value,
        last_name: document.getElementById('add-last-name').value,
        role: document.getElementById('add-role').value,
        status: document.getElementById('add-status').value,
        email: document.getElementById('add-email').value,
        phone: document.getElementById('add-phone').value
    };
    
    try {
        const response = await fetch('../api/admin/dashboard.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        if (result.success) {
            showAlert('success', result.message);
            closeModal('add-user-modal');
            document.getElementById('add-user-form').reset();
            fetchAdminData();
            Swal.fire({
                title: 'สำเร็จ!',
                text: result.message,
                icon: 'success',
                confirmButtonColor: '#01a715',
                customClass: { popup: 'rounded-3xl' }
            });
        } else {
            Swal.fire({
                title: 'ไม่สำเร็จ',
                text: result.message,
                icon: 'error',
                confirmButtonColor: '#ef4444',
                customClass: { popup: 'rounded-3xl' }
            });
        }
    } catch (e) {
        Swal.fire({
            title: 'เกิดข้อผิดพลาด',
            text: 'เกิดข้อผิดพลาดในการลงทะเบียนผู้ใช้',
            icon: 'error',
            confirmButtonColor: '#ef4444',
            customClass: { popup: 'rounded-3xl' }
        });
    }
});

document.getElementById('edit-user-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const payload = {
        action: 'edit_user',
        target_id: document.getElementById('edit-user-id').value,
        first_name: document.getElementById('edit-first-name').value,
        last_name: document.getElementById('edit-last-name').value,
        role: document.getElementById('edit-role').value,
        status: document.getElementById('edit-status').value,
        email: document.getElementById('edit-email').value,
        phone: document.getElementById('edit-phone').value,
        new_password: document.getElementById('edit-password').value
    };
    
    try {
        const response = await fetch('../api/admin/dashboard.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        if (result.success) {
            showAlert('success', result.message);
            closeModal('edit-user-modal');
            document.getElementById('edit-user-form').reset();
            fetchAdminData();
            Swal.fire({
                title: 'บันทึกสำเร็จ!',
                text: result.message,
                icon: 'success',
                confirmButtonColor: '#01a715',
                customClass: { popup: 'rounded-3xl' }
            });
        } else {
            Swal.fire({
                title: 'ไม่สำเร็จ',
                text: result.message,
                icon: 'error',
                confirmButtonColor: '#ef4444',
                customClass: { popup: 'rounded-3xl' }
            });
        }
    } catch (e) {
        Swal.fire({
            title: 'เกิดข้อผิดพลาด',
            text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
            icon: 'error',
            confirmButtonColor: '#ef4444',
            customClass: { popup: 'rounded-3xl' }
        });
    }
});

document.getElementById('news-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const payload = {
        action: 'publish_news',
        news_title: document.getElementById('news-title').value,
        news_content: document.getElementById('news-content').value
    };
    
    try {
        const response = await fetch('../api/admin/dashboard.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        if (result.success) {
            showAlert('success', result.message);
            document.getElementById('news-form').reset();
            Swal.fire({
                title: 'ประกาศสำเร็จ!',
                text: result.message,
                icon: 'success',
                confirmButtonColor: '#01a715',
                customClass: { popup: 'rounded-3xl' }
            });
        } else {
            Swal.fire({
                title: 'ไม่สำเร็จ',
                text: result.message,
                icon: 'error',
                confirmButtonColor: '#ef4444',
                customClass: { popup: 'rounded-3xl' }
            });
        }
    } catch (e) {
        Swal.fire({
            title: 'เกิดข้อผิดพลาด',
            text: 'เกิดข้อผิดพลาดในการประกาศข่าวสาร',
            icon: 'error',
            confirmButtonColor: '#ef4444',
            customClass: { popup: 'rounded-3xl' }
        });
    }
});

// Modals management
function openAddUserModal() {
    document.getElementById('add-user-modal').classList.remove('hidden');
}

function openEditUserModal(btn) {
    const row = btn.closest('tr');
    
    document.getElementById('edit-user-id').value = row.getAttribute('data-id');
    document.getElementById('edit-username').value = row.getAttribute('data-username');
    document.getElementById('edit-first-name').value = row.getAttribute('data-first-name');
    document.getElementById('edit-last-name').value = row.getAttribute('data-last-name');
    document.getElementById('edit-email').value = row.getAttribute('data-email');
    document.getElementById('edit-phone').value = row.getAttribute('data-phone');
    document.getElementById('edit-role').value = row.getAttribute('data-role');
    document.getElementById('edit-status').value = row.getAttribute('data-status');
    
    document.getElementById('edit-user-modal').classList.remove('hidden');
}

function viewUserDetails(name, username, role, meta) {
    document.getElementById('dt-name').textContent = name;
    document.getElementById('dt-uid').textContent = username;
    document.getElementById('dt-role').textContent = role;
    document.getElementById('dt-meta').textContent = meta;
    document.getElementById('details-modal').classList.remove('hidden');
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

function showAlert(type, msg) {
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

// Populate Court Options for Admin Closure Modal
function renderAdminClosureCourts(courts) {
    const select = document.getElementById('admin-closure-court-id');
    if (!select) return;
    select.innerHTML = '<option value="" disabled selected>-- เลือกสนามกีฬา --</option>';
    courts.forEach(court => {
        select.insertAdjacentHTML('beforeend', `<option value="${court.id}">${court.name} (${court.campus_name})</option>`);
    });
}

// Fetch and render all closures for Admin
async function fetchAdminClosures() {
    const tbody = document.getElementById('admin-closures-table-body');
    if (!tbody) return;

    try {
        const res = await fetch('../api/closures/list.php');
        const data = await res.json();

        if (data.success) {
            tbody.innerHTML = '';
            if (data.closures.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-gray-400">ยังไม่มีรายการกำหนดวันปิดให้บริการสนามกีฬา</td></tr>`;
                return;
            }

            data.closures.forEach(cl => {
                const sDate = new Date(cl.start_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
                const eDate = new Date(cl.end_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
                const dateText = cl.start_date === cl.end_date ? sDate : `${sDate} - ${eDate}`;
                const timeText = (cl.start_time && cl.end_time) ? `${cl.start_time.slice(0,5)} - ${cl.end_time.slice(0,5)} น.` : 'ตลอดวัน';
                const creatorText = `${cl.creator_first} ${cl.creator_last} (${cl.creator_role === 'admin' ? 'แอดมิน' : 'เจ้าหน้าที่'})`;

                const tr = document.createElement('tr');
                tr.className = "hover:bg-gray-50/80 transition-colors";
                tr.innerHTML = `
                    <td class="p-3">
                        <span class="font-bold text-gray-900 block">${cl.court_name}</span>
                        <span class="text-[10px] text-gray-400 font-medium">${cl.campus_name}</span>
                    </td>
                    <td class="p-3 font-medium text-gray-800">📅 ${dateText}</td>
                    <td class="p-3 font-medium text-gray-600">${timeText}</td>
                    <td class="p-3 font-semibold text-amber-700">${cl.reason}</td>
                    <td class="p-3 text-gray-500">${creatorText}</td>
                    <td class="p-3 text-right">
                        <button onclick="deleteAdminClosure(${cl.id})" class="px-2.5 py-1 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-100 transition-all flex items-center space-x-1 ml-auto">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                            <span>ยกเลิก</span>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            if (window.lucide) lucide.createIcons();
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-red-500">เกิดข้อผิดพลาดในการโหลดรายการ</td></tr>`;
    }
}

function openAdminClosureModal() {
    const today = new Date().toISOString().split('T')[0];
    const sInput = document.getElementById('admin-closure-start-date');
    const eInput = document.getElementById('admin-closure-end-date');
    if (sInput) sInput.value = today;
    if (eInput) eInput.value = today;
    document.getElementById('admin-closure-modal').classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
}

function setAdminClosurePreset(reason) {
    const reasonInput = document.getElementById('admin-closure-reason');
    if (reasonInput) reasonInput.value = reason;
}

// Handle Admin Closure Form Submit
const adminClosureForm = document.getElementById('admin-closure-form');
if (adminClosureForm) {
    adminClosureForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const submitBtn = document.getElementById('admin-closure-submit-btn');
        const courtId = document.getElementById('admin-closure-court-id').value;
        const startDate = document.getElementById('admin-closure-start-date').value;
        const endDate = document.getElementById('admin-closure-end-date').value;
        const reason = document.getElementById('admin-closure-reason').value.trim();

        if (!courtId || !startDate || !endDate || !reason) {
            Swal.fire({
                title: 'ข้อมูลไม่ครบถ้วน',
                text: 'กรุณากรอกข้อมูลสนาม วันที่ และเหตุผลการปิดใช้งานให้ครบถ้วน',
                icon: 'warning',
                confirmButtonColor: '#f59e0b',
                customClass: { popup: 'rounded-3xl' }
            });
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
                showAlert('success', result.message);
                closeModal('admin-closure-modal');
                adminClosureForm.reset();
                await fetchAdminClosures();
                Swal.fire({
                    title: 'บันทึกสำเร็จ!',
                    text: result.message,
                    icon: 'success',
                    confirmButtonColor: '#01a715',
                    customClass: { popup: 'rounded-3xl' }
                });
            } else {
                Swal.fire({
                    title: 'ไม่สำเร็จ',
                    text: result.message,
                    icon: 'error',
                    confirmButtonColor: '#ef4444',
                    customClass: { popup: 'rounded-3xl' }
                });
            }
        } catch (e) {
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์',
                icon: 'error',
                confirmButtonColor: '#ef4444',
                customClass: { popup: 'rounded-3xl' }
            });
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'บันทึกการปิดสนาม';
        }
    });
}

// Delete Closure by Admin
async function deleteAdminClosure(id) {
    const swalRes = await Swal.fire({
        title: 'ยืนยันการยกเลิก?',
        text: 'ต้องการยกเลิกการปิดให้บริการสนามนี้ใช่หรือไม่?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'ยืนยันยกเลิกการปิดสนาม',
        cancelButtonText: 'ปิด',
        customClass: { popup: 'rounded-3xl' }
    });

    if (!swalRes.isConfirmed) return;

    try {
        const res = await fetch('../api/closures/delete.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });
        const result = await res.json();
        if (result.success) {
            showAlert('success', result.message);
            await fetchAdminClosures();
            Swal.fire({
                title: 'สำเร็จ!',
                text: result.message,
                icon: 'success',
                confirmButtonColor: '#01a715',
                customClass: { popup: 'rounded-3xl' }
            });
        } else {
            Swal.fire({
                title: 'ไม่สำเร็จ',
                text: result.message,
                icon: 'error',
                confirmButtonColor: '#ef4444',
                customClass: { popup: 'rounded-3xl' }
            });
        }
    } catch (e) {
        Swal.fire({
            title: 'เกิดข้อผิดพลาด',
            text: 'เกิดข้อผิดพลาดในการดำเนินการ',
            icon: 'error',
            confirmButtonColor: '#ef4444',
            customClass: { popup: 'rounded-3xl' }
        });
    }
}

// Bind search input to filter users
document.getElementById('search-users-input').addEventListener('input', filterUsers);

// Bootstrapping
window.addEventListener('DOMContentLoaded', async () => {
    await fetchAdminData();
    if (window.lucide) lucide.createIcons();
});
