checkAuth('student');
loadLayout();

let globalBookings = [];
let activeTab = 'upcoming';

async function fetchBookings() {
    try {
        const response = await fetch('api/bookings/user.php');
        const result = await response.json();
        
        if (result.success) {
            globalBookings = result.bookings;
            renderTabContent();
        }
    } catch (e) {
        document.getElementById('bookings-list-container').innerHTML = `<p class="text-center text-xs text-red-500 py-10">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>`;
    }
}

function switchTab(tabName) {
    activeTab = tabName;
    
    // Toggle active style
    const tabs = ['upcoming', 'completed', 'cancelled'];
    tabs.forEach(t => {
        const btn = document.getElementById(`tab-btn-${t}`);
        if (t === tabName) {
            btn.className = "flex-1 py-2.5 text-center rounded-xl bg-psruGreen text-white shadow-sm font-bold transition-all";
        } else {
            btn.className = "flex-1 py-2.5 text-center rounded-xl text-gray-500 hover:text-psruGreen transition-all";
        }
    });
    
    renderTabContent();
}

function renderTabContent() {
    const container = document.getElementById('bookings-list-container');
    container.innerHTML = '';
    
    let filtered = [];
    if (activeTab === 'upcoming') {
        filtered = globalBookings.filter(b => b.status === 'pending' || b.status === 'approved');
    } else if (activeTab === 'completed') {
        filtered = globalBookings.filter(b => b.status === 'completed');
    } else if (activeTab === 'cancelled') {
        filtered = globalBookings.filter(b => b.status === 'cancelled' || b.status === 'rejected');
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="text-center py-16 border border-dashed border-gray-200 rounded-2xl bg-white shadow-sm">
                <i data-lucide="calendar-x" class="w-12 h-12 text-gray-300 mx-auto mb-3"></i>
                <p class="text-gray-500 text-sm font-medium">ไม่พบประวัติรายการจองในแท็บนี้</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    filtered.forEach(booking => {
        let badge_color = 'bg-blue-50 text-blue-600 border-blue-100';
        let badge_label = 'รอการพิจารณาสิทธิ์';
        
        if (booking.status === 'approved') {
            badge_color = 'bg-green-50 text-psruGreen border-green-100';
            badge_label = 'อนุมัติการเข้าจอง';
        } else if (booking.status === 'completed') {
            badge_color = 'bg-gray-100 text-gray-500 border-gray-200';
            badge_label = 'ใช้งานสนามเรียบร้อย';
        } else if (booking.status === 'cancelled') {
            badge_color = 'bg-gray-50 text-gray-400 border-gray-200';
            badge_label = 'ยกเลิกคำขอ';
        } else if (booking.status === 'rejected') {
            badge_color = 'bg-red-50 text-red-500 border-red-100';
            badge_label = 'คำขอถูกปฏิเสธ';
        }
        
        let icon = 'dribbble';
        if (booking.sport_type === 'badminton') icon = 'activity';
        else if (booking.sport_type === 'football') icon = 'circle-dot';
        else if (booking.sport_type === 'tennis') icon = 'target';
        else if (booking.sport_type === 'basketball') icon = 'target';
        
        // Format dates nicely
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        const formattedDate = new Date(booking.booking_date).toLocaleDateString('th-TH', options);
        
        const showCodeBtn = (booking.status === 'pending' || booking.status === 'approved')
            ? `<button onclick="openTicketModal(${booking.id})" class="bg-psruGreen hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-all flex items-center space-x-1.5 shadow-sm">
                   <i data-lucide="ticket" class="w-4 h-4"></i>
                   <span>แสดงรหัสคิว</span>
               </button>`
            : '';
            
        const cancelBtn = (booking.status === 'pending')
            ? `<button onclick="cancelBooking(${booking.id}, '${booking.booking_code}')" class="border border-gray-200 hover:border-red-200 text-gray-500 hover:text-red-500 font-medium py-2 px-3 rounded-xl text-xs transition-all" title="ยกเลิกการจอง">
                   ยกเลิก
               </button>`
            : '';
        
        let staffNoteBox = '';
        if (booking.rejection_reason && booking.rejection_reason.trim() !== '') {
            const staffName = booking.staff_first ? `เจ้าหน้าที่ ${booking.staff_first} ${booking.staff_last || ''}` : 'เจ้าหน้าที่ศูนย์กีฬา';
            
            if (booking.status === 'rejected') {
                staffNoteBox = `
                    <div class="mt-3 text-xs bg-red-50 text-red-700 p-3 rounded-xl border border-red-100 flex items-start space-x-2.5">
                        <i data-lucide="alert-circle" class="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5"></i>
                        <div>
                            <span class="font-bold text-red-800">เหตุผลการไม่อนุมัติคำขอ:</span>
                            <p class="mt-0.5 text-red-700 leading-relaxed font-medium">"${escapeHtml(booking.rejection_reason)}"</p>
                            <span class="text-red-400 text-[10px] block mt-1 font-normal">ผู้พิจารณา: ${staffName}</span>
                        </div>
                    </div>
                `;
            } else if (booking.status === 'approved') {
                staffNoteBox = `
                    <div class="mt-3 text-xs bg-green-50 text-green-800 p-3 rounded-xl border border-green-100 flex items-start space-x-2.5">
                        <i data-lucide="message-square" class="w-4 h-4 text-psruGreen flex-shrink-0 mt-0.5"></i>
                        <div>
                            <span class="font-bold text-psruGreen">ข้อความ / คำแนะนำจากเจ้าหน้าที่:</span>
                            <p class="mt-0.5 text-gray-700 leading-relaxed font-medium">"${escapeHtml(booking.rejection_reason)}"</p>
                            <span class="text-gray-400 text-[10px] block mt-1 font-normal">ผู้พิจารณา: ${staffName}</span>
                        </div>
                    </div>
                `;
            } else if (booking.status === 'completed') {
                staffNoteBox = `
                    <div class="mt-3 text-xs bg-gray-50 text-gray-700 p-2.5 rounded-xl border border-gray-200/80 flex items-start space-x-2.5">
                        <i data-lucide="message-square" class="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5"></i>
                        <div>
                            <span class="font-bold text-gray-700">บันทึกจากเจ้าหน้าที่:</span>
                            <p class="mt-0.5 text-gray-600 text-[11px]">"${escapeHtml(booking.rejection_reason)}"</p>
                        </div>
                    </div>
                `;
            }
        }

        const cardHtml = `
            <div class="booking-card bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:border-green-300">
                <div class="p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div class="flex items-start space-x-4">
                        <div class="w-12 h-12 rounded-xl bg-green-50 text-psruGreen flex items-center justify-center flex-shrink-0">
                            <i data-lucide="${icon}" class="w-6 h-6"></i>
                        </div>
                        <div>
                            <div class="flex items-center space-x-2 mb-1">
                                <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badge_color}">${badge_label}</span>
                                <span class="text-xs text-gray-400">ID: ${booking.booking_code}</span>
                            </div>
                            <h3 class="font-bold text-lg text-gray-900">${booking.court_name}</h3>
                            ${booking.booking_title ? `<p class="text-xs text-psruGreen font-semibold mt-0.5 flex items-center"><i data-lucide="tag" class="w-3 h-3 mr-1"></i> วัตถุประสงค์: ${escapeHtml(booking.booking_title)}</p>` : ''}
                            
                            <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-gray-600">
                                <div class="flex items-center space-x-1.5">
                                    <i data-lucide="calendar" class="w-3.5 h-3.5 text-gray-400"></i>
                                    <span class="font-medium">วันใช้งาน:</span>
                                    <span class="text-gray-900">${formattedDate}</span>
                                </div>
                                <div class="flex items-center space-x-1.5">
                                    <i data-lucide="clock" class="w-3.5 h-3.5 text-gray-400"></i>
                                    <span class="font-medium">ช่วงเวลา:</span>
                                    <span class="text-gray-900">${booking.start_time.slice(0, 5)} - ${booking.end_time.slice(0, 5)} น.</span>
                                </div>
                                <div class="flex items-center space-x-1.5 sm:col-span-2">
                                    <i data-lucide="map-pin" class="w-3.5 h-3.5 text-gray-400"></i>
                                    <span class="font-medium">ศูนย์ศึกษา:</span>
                                    <span class="text-gray-900">${booking.campus_name}</span>
                                </div>
                            </div>
                            ${staffNoteBox}
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between md:flex-col md:items-end border-t md:border-t-0 pt-4 md:pt-0 border-gray-100">
                        <div class="text-left md:text-right mb-0 md:mb-3">
                            <span class="text-[10px] text-gray-400 block font-semibold uppercase">หมายเลขการจอง</span>
                            <span class="text-sm font-bold text-gray-700">#${String(booking.id).padStart(5, '0')}</span>
                        </div>
                        <div class="flex space-x-2">
                            ${showCodeBtn}
                            ${cancelBtn}
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', cardHtml);
    });
    
    lucide.createIcons();
}

// Helper to escape HTML characters
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Cancel booking
async function cancelBooking(id, code) {
    const swalRes = await Swal.fire({
        title: 'ยืนยันการยกเลิกคำขอจอง?',
        html: `คุณต้องการยกเลิกคำขอจองสนามกีฬาหมายเลข <strong class="text-gray-900 font-mono">${code}</strong> ใช่หรือไม่?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'ยืนยันยกเลิกการจอง',
        cancelButtonText: 'ปิดหน้าต่าง',
        customClass: {
            popup: 'rounded-3xl shadow-xl'
        }
    });

    if (swalRes.isConfirmed) {
        try {
            const response = await fetch('api/bookings/cancel.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ booking_id: id })
            });
            
            const result = await response.json();
            if (result.success) {
                Swal.fire({
                    title: 'สำเร็จ!',
                    text: result.message,
                    icon: 'success',
                    confirmButtonColor: '#01a715',
                    confirmButtonText: 'ตกลง',
                    customClass: { popup: 'rounded-3xl' }
                });
                fetchBookings();
            } else {
                Swal.fire({
                    title: 'ไม่สามารถยกเลิกได้',
                    text: result.message,
                    icon: 'error',
                    confirmButtonColor: '#ef4444',
                    confirmButtonText: 'ตกลง',
                    customClass: { popup: 'rounded-3xl' }
                });
            }
        } catch (e) {
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: 'เกิดข้อผิดพลาดในการติดต่อเซิร์ฟเวอร์',
                icon: 'error',
                confirmButtonColor: '#ef4444',
                confirmButtonText: 'ตกลง',
                customClass: { popup: 'rounded-3xl' }
            });
        }
    }
}

// Modal triggers
function openTicketModal(bookingId) {
    const booking = globalBookings.find(b => b.id == bookingId);
    if (!booking) return;

    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const formattedDate = new Date(booking.booking_date).toLocaleDateString('th-TH', options);
    const timeStr = `วันที่ ${formattedDate} เวลา ${booking.start_time.slice(0, 5)} - ${booking.end_time.slice(0, 5)} น.`;

    document.getElementById('m-code').textContent = booking.booking_code;
    document.getElementById('m-large-code').textContent = booking.booking_code;
    document.getElementById('m-court').textContent = booking.court_name;
    document.getElementById('m-time').textContent = timeStr;
    
    const noteContainer = document.getElementById('m-reason-container');
    const noteText = document.getElementById('m-reason');
    if (booking.rejection_reason && booking.rejection_reason.trim() !== '') {
        noteText.textContent = `"${booking.rejection_reason}"`;
        noteContainer.classList.remove('hidden');
    } else {
        noteContainer.classList.add('hidden');
    }

    document.getElementById('ticket-modal').classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
}

function closeModal() {
    document.getElementById('ticket-modal').classList.add('hidden');
}

window.addEventListener('DOMContentLoaded', async () => {
    await fetchBookings();
    await loadLayout();
});
