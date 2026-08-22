checkAuth('admin');

// Fetch Campuses list
async function fetchCampuses() {
    try {
        const response = await fetch('../api/admin/dashboard.php');
        const result = await response.json();
        
        if (result.success) {
            const select = document.getElementById('campus-select');
            select.innerHTML = '<option value="">-- เลือกพื้นที่ศูนย์การศึกษา --</option>';
            result.campuses.forEach(camp => {
                select.insertAdjacentHTML('beforeend', `<option value="${camp.id}">${camp.name}</option>`);
            });
        }
    } catch(e) {
        console.error(e);
    }
}

fetchCampuses();

function handleFileSelect(input) {
    const preview = document.getElementById('file-preview-list');
    if (input.files.length > 0) {
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
            window.location.href = 'dashboard.html';
        } else {
            alertText.textContent = result.message;
            alertBox.classList.remove('hidden');
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> <span>บันทึกเพิ่มสนามกีฬา</span>`;
            lucide.createIcons();
        }
    } catch (err) {
        alertText.textContent = "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์";
        alertBox.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> <span>บันทึกเพิ่มสนามกีฬา</span>`;
        lucide.createIcons();
    }
});

// Bind file input change event
document.getElementById('court-image-input').addEventListener('change', function() {
    handleFileSelect(this);
});

window.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();
});
