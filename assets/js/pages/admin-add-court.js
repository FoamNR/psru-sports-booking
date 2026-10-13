checkAuth('admin');

const sportSelect = document.getElementById('sport-type-select');
const otherSportContainer = document.getElementById('other-sport-container');
const customSportInput = document.getElementById('custom-sport-input');

// Event listener for sport type selection toggle
if (sportSelect) {
    sportSelect.addEventListener('change', function() {
        if (this.value === 'other') {
            otherSportContainer?.classList.remove('hidden');
            customSportInput?.setAttribute('required', 'required');
            customSportInput?.focus();
        } else {
            otherSportContainer?.classList.add('hidden');
            customSportInput?.removeAttribute('required');
            if (customSportInput) customSportInput.value = '';
        }
        if (window.lucide) lucide.createIcons();
    });
}

// Fetch Campuses list & existing sport types
async function fetchCampuses() {
    try {
        const response = await fetch('../api/admin/dashboard.php');
        const result = await response.json();
        
        if (result.success) {
            const select = document.getElementById('campus-select');
            if (select) {
                select.innerHTML = '<option value="">-- เลือกพื้นที่ศูนย์การศึกษา --</option>';
                result.campuses.forEach(camp => {
                    select.insertAdjacentHTML('beforeend', `<option value="${camp.id}">${camp.name}</option>`);
                });
            }

            // Populate existing custom sports from database into dropdown
            if (result.courts && sportSelect) {
                const knownValues = ['futsal', 'badminton', 'football', 'tennis', 'basketball', 'volleyball', 'petanque', 'other'];
                const existingCustomSports = new Set();
                result.courts.forEach(c => {
                    if (c.sport_type && !knownValues.includes(c.sport_type)) {
                        existingCustomSports.add(c.sport_type);
                    }
                });

                const otherOption = sportSelect.querySelector('option[value="other"]');
                existingCustomSports.forEach(sport => {
                    if (!sportSelect.querySelector(`option[value="${sport}"]`)) {
                        const opt = document.createElement('option');
                        opt.value = sport;
                        opt.textContent = sport;
                        if (otherOption) {
                            sportSelect.insertBefore(opt, otherOption);
                        } else {
                            sportSelect.appendChild(opt);
                        }
                    }
                });
            }
        }
    } catch(e) {
        console.error(e);
    }
}

fetchCampuses();

function handleFileSelect(input) {
    const preview = document.getElementById('file-preview-list');
    if (!preview) return;
    if (input.files && input.files.length > 0) {
        preview.classList.remove('hidden');
        preview.innerHTML = `✓ เลือกรูปภาพแล้ว: ${input.files[0].name}`;
    } else {
        preview.classList.add('hidden');
    }
}

// Form Submit
document.getElementById('add-court-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = this.querySelector('button[type="submit"]');
    const alertBox = document.getElementById('error-alert');
    const alertText = document.getElementById('error-alert-text');
    
    alertBox.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `⏳ กำลังบันทึกสนาม...`;
    
    const formData = new FormData(this);

    // Validate and set sport_type
    const selectedSport = sportSelect ? sportSelect.value : '';
    if (selectedSport === 'other') {
        const customVal = customSportInput ? customSportInput.value.trim() : '';
        if (!customVal) {
            alertText.textContent = 'กรุณาระบุชื่อประเภทกีฬา/สนามในช่อง "อื่นๆ"';
            alertBox.classList.remove('hidden');
            Swal.fire({
                title: 'ข้อมูลไม่ครบถ้วน',
                text: 'กรุณาระบุชื่อประเภทกีฬา/สนามในช่อง "อื่นๆ"',
                icon: 'warning',
                confirmButtonColor: '#01a715',
                customClass: { popup: 'rounded-3xl' }
            });
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> <span>บันทึกเพิ่มสนามกีฬา</span>`;
            if (window.lucide) lucide.createIcons();
            if (customSportInput) customSportInput.focus();
            return;
        }
        formData.set('sport_type', customVal);
    } else {
        formData.set('sport_type', selectedSport);
    }

    // Append checked facilities
    const checkedFacs = this.querySelectorAll('input[name="facilities[]"]:checked');
    formData.delete('facilities[]');
    checkedFacs.forEach(f => {
        formData.append('facilities[]', f.value);
    });
    
    try {
        const response = await fetch('../api/admin/court-action.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        if (result.success) {
            await Swal.fire({
                title: 'บันทึกสำเร็จ!',
                text: result.message || 'เพิ่มข้อมูลสนามกีฬาใหม่เรียบร้อยแล้ว',
                icon: 'success',
                confirmButtonColor: '#01a715',
                customClass: { popup: 'rounded-3xl' }
            });
            window.location.href = 'dashboard.html';
        } else {
            alertText.textContent = result.message;
            alertBox.classList.remove('hidden');
            Swal.fire({
                title: 'ไม่สามารถบันทึกได้',
                text: result.message,
                icon: 'error',
                confirmButtonColor: '#ef4444',
                customClass: { popup: 'rounded-3xl' }
            });
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> <span>บันทึกเพิ่มสนามกีฬา</span>`;
            if (window.lucide) lucide.createIcons();
        }
    } catch (err) {
        alertText.textContent = "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์";
        alertBox.classList.remove('hidden');
        Swal.fire({
            title: 'เกิดข้อผิดพลาด',
            text: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์',
            icon: 'error',
            confirmButtonColor: '#ef4444',
            customClass: { popup: 'rounded-3xl' }
        });
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> <span>บันทึกเพิ่มสนามกีฬา</span>`;
        if (window.lucide) lucide.createIcons();
    }
});

// Bind file input change event safely
const fileInput = document.getElementById('file-upload') || document.getElementById('court-image-input');
if (fileInput) {
    fileInput.addEventListener('change', function() {
        handleFileSelect(this);
    });
}

window.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();
});
