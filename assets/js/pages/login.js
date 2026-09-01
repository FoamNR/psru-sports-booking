// Check session on load (redirects if already logged in)
checkAuth();

// Load Footer layout
loadLayout();

// Toggle Password visibility
function togglePasswordVisibility() {
    const pwd = document.getElementById('password');
    const icon = document.getElementById('toggle-password-icon');
    if (pwd.type === 'password') {
        pwd.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
    } else {
        pwd.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
    }
    lucide.createIcons();
}

// Form submission
document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submit-btn');
    const errorAlert = document.getElementById('error-alert');
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="animate-spin mr-2">⏳</span> กำลังส่งข้อมูล...`;
    errorAlert.classList.add('hidden');
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('api/auth/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            if (result.role === 'admin') {
                window.location.href = 'admin/dashboard.html';
            } else if (result.role === 'staff') {
                window.location.href = 'staff/dashboard.html';
            } else {
                window.location.href = 'index.html';
            }
        } else {
            errorAlert.textContent = result.message;
            errorAlert.classList.remove('hidden');
            Swal.fire({
                title: 'เข้าสู่ระบบไม่สำเร็จ',
                text: result.message,
                icon: 'error',
                confirmButtonColor: '#ef4444',
                customClass: { popup: 'rounded-3xl' }
            });
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i data-lucide="log-in" class="w-4 h-4"></i> <span>เข้าสู่ระบบด้วย PSRU Account</span>`;
            lucide.createIcons();
        }
    } catch (err) {
        errorAlert.textContent = "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง";
        errorAlert.classList.remove('hidden');
        Swal.fire({
            title: 'เกิดข้อผิดพลาด',
            text: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง',
            icon: 'error',
            confirmButtonColor: '#ef4444',
            customClass: { popup: 'rounded-3xl' }
        });
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i data-lucide="log-in" class="w-4 h-4"></i> <span>เข้าสู่ระบบด้วย PSRU Account</span>`;
        lucide.createIcons();
    }
});
