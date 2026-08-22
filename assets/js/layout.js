// JS Layout and Auth Controller for PSRU Sports Decoupled Architecture

// Get relative root path depending on where we are
const isSubFolder = window.location.pathname.includes('/admin/') || window.location.pathname.includes('/staff/');
const rootPrefix = isSubFolder ? '../' : '';

// 1. Session Auth Checker
async function checkAuth(requiredRole = null) {
    // Exclude checking on login and register pages
    const isAuthPage = window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('register.html');
    
    try {
        const response = await fetch(rootPrefix + 'api/auth/check.php');
        if (!response.ok) {
            throw new Error('Unauthorized');
        }
        const data = await response.json();
        
        if (data.logged_in) {
            // Store user profile globally
            window.currentUser = data.user;
            
            // Redirect logged-in users away from login/register
            if (isAuthPage) {
                if (data.user.role === 'admin') window.location.href = 'admin/dashboard.html';
                else if (data.user.role === 'staff') window.location.href = 'staff/dashboard.html';
                else window.location.href = 'index.html';
            }
            
            // Role enforcement
            if (requiredRole && data.user.role !== requiredRole) {
                // Access Denied Alert
                document.body.innerHTML = `
                    <div class="min-h-screen flex items-center justify-center bg-gray-50 p-6 text-center">
                        <div class="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm max-w-sm w-full">
                            <div class="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="lucide lucide-shield-alert"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                            </div>
                            <h2 class="font-bold text-gray-900 text-lg mb-2">Access Denied</h2>
                            <p class="text-xs text-gray-500 mb-6">คุณไม่มีสิทธิ์ในการเข้าถึงหน้าควบคุมการทำงานนี้เฉพาะกลุ่มเท่านั้น</p>
                            <button onclick="window.location.href='${rootPrefix}login.html'" class="w-full bg-gray-900 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-gray-800 transition-all">กลับหน้าล็อกอิน</button>
                        </div>
                    </div>
                `;
            }
        }
    } catch (error) {
        if (!isAuthPage) {
            // Redirect to login page if unauthorized
            window.location.href = rootPrefix + 'login.html';
        }
    }
}

// 2. Load Common Layout Modules (Navbar and Footer)
async function loadLayout() {
    const navbarContainer = document.getElementById('navbar-container');
    const footerContainer = document.getElementById('footer-container');
    
    // Inject navbar
    if (navbarContainer) {
        try {
            const res = await fetch(rootPrefix + 'includes/navbar.html');
            if (res.ok) {
                let html = await res.text();
                // Replace root paths depending on location
                if (isSubFolder) {
                    html = html.replace(/href="index.html"/g, 'href="../index.html"');
                    html = html.replace(/href="my-bookings.html"/g, 'href="../my-bookings.html"');
                    html = html.replace(/href="rules.html"/g, 'href="../rules.html"');
                    html = html.replace(/src="assets\/images\/logo.png"/g, 'src="../assets/images/logo.png"');
                }
                navbarContainer.innerHTML = html;
                
                // Set active link highlight
                const pageName = window.location.pathname.split('/').pop() || 'index.html';
                const links = navbarContainer.querySelectorAll('nav a');
                links.forEach(link => {
                    const href = link.getAttribute('href') || '';
                    if (href.endsWith(pageName)) {
                        link.className = "px-3 py-2 rounded-xl text-xs font-bold bg-green-50 text-psruGreen transition-all";
                    }
                });
                
                // Show user details in navbar
                if (window.currentUser) {
                    const profileSpan = navbarContainer.querySelector('#navbar-user-profile');
                    if (profileSpan) {
                        profileSpan.innerHTML = `
                            <div class="flex items-center space-x-2">
                                <div class="w-8 h-8 rounded-full bg-psruGreen/10 text-psruGreen flex items-center justify-center font-bold text-xs">
                                    ${window.currentUser.first_name.charAt(0)}
                                </div>
                                <div class="text-left">
                                    <span class="font-bold text-xs text-gray-900 block leading-tight">${window.currentUser.first_name}</span>
                                    <span class="text-[9px] text-gray-400 block leading-none font-mono">UID: ${window.currentUser.username}</span>
                                </div>
                            </div>
                        `;
                    }
                }
            }
        } catch (e) {
            console.error('Navbar injection failed', e);
        }
    }
    
    // Inject footer
    if (footerContainer) {
        try {
            const res = await fetch(rootPrefix + 'includes/footer.html');
            if (res.ok) {
                footerContainer.innerHTML = await res.text();
            }
        } catch (e) {
            console.error('Footer injection failed', e);
        }
    }
    
    // Re-initialize Lucide Icons if loaded
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// 3. Global Logout Helper
async function handleLogout() {
    try {
        const response = await fetch(rootPrefix + 'api/auth/logout.php');
        if (response.ok) {
            window.location.href = rootPrefix + 'login.html';
        }
    } catch (e) {
        console.error('Logout error', e);
    }
}
