document.addEventListener('DOMContentLoaded', function() {
    
    // --- Utils ---
    function showError(elementId, message) {
        const errorEl = document.getElementById(elementId);
        if(errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    }

    function hideError(elementId) {
        const errorEl = document.getElementById(elementId);
        if(errorEl) {
            errorEl.style.display = 'none';
        }
    }

    // --- Global Password Toggle ---
    const togglePassword = document.getElementById('togglePassword');
    const passwordInputGlobal = document.getElementById('password'); // Used for toggle and strength 

    if (togglePassword && passwordInputGlobal) {
        togglePassword.addEventListener('click', function () {
            const type = passwordInputGlobal.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInputGlobal.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    // --- Password Strength (Register Page Only) ---
    const strengthMeter = document.getElementById('strengthMeter');
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');

    if (passwordInputGlobal && strengthMeter && strengthBar && strengthText) {
        passwordInputGlobal.addEventListener('input', function() {
            const val = this.value;
            if(val.length > 0) strengthMeter.style.display = 'block';
            else strengthMeter.style.display = 'none';

            let strength = 0;
            if (val.length >= 8) strength++; // Min length
            if (val.match(/[a-z]/) && val.match(/[A-Z]/)) strength++; // Mixed case
            if (val.match(/\d/)) strength++; // Numbers
            if (val.match(/[^a-zA-Z\d]/)) strength++; // Special char

            // Update UI
            let color = '#ff5252';
            let width = '25%';
            let text = 'Weak';

            switch(strength) {
                case 0:
                case 1: width = '25%'; color = '#ff5252'; text = 'Weak'; break;
                case 2: width = '50%'; color = '#ff9800'; text = 'Fair'; break;
                case 3: width = '75%'; color = '#2196f3'; text = 'Good'; break;
                case 4: width = '100%'; color = '#4caf50'; text = 'Strong'; break;
            }

            strengthBar.style.width = width;
            strengthBar.style.backgroundColor = color;
            strengthText.textContent = text;
            strengthText.style.color = color;
        });
    }

    // --- Role Selection (Register Page) ---
    const urlParams = new URLSearchParams(window.location.search);
    const roleParam = urlParams.get('role');
    const roleSelect = document.getElementById('role');
    if (roleSelect && roleParam) {
        roleSelect.value = roleParam;
    }

    // --- REGISTER FORM ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function (e) {
            e.preventDefault();
            
            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const confirmPasswordInput = document.getElementById('confirm-password');
            const termsInput = document.getElementById('terms');
            const roleInput = document.getElementById('role');
            
            // Clear previous errors
            document.querySelectorAll('.error-msg').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.form-control').forEach(el => el.style.borderColor = '#e0e0e0');

            let isValid = true;
            
            // Validate Name
            if(nameInput.value.trim().length < 2) {
                 showError('nameError', "Full name must be at least 2 characters.");
                 nameInput.style.borderColor = 'var(--danger)';
                 isValid = false;
            }

            // Validate Email
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(emailInput.value)) {
              showError('emailError', "Please enter a valid email address.");
              emailInput.style.borderColor = 'var(--danger)';
              isValid = false;
            }

            // Validate Password
            if (passwordInput.value.length < 8) {
              showError('passwordError', "Password must be at least 8 characters.");
              passwordInput.style.borderColor = 'var(--danger)';
              isValid = false;
            }

            // Validate Confirm Password
            if (confirmPasswordInput.value !== passwordInput.value) {
              showError('confirmPasswordError', "Passwords do not match.");
              confirmPasswordInput.style.borderColor = 'var(--danger)';
              isValid = false;
            }

            // Validate Terms
            if (!termsInput.checked) {
                 showError('termsError', "You must accept the terms.");
                 isValid = false;
            }

            if(isValid) {
                const email = emailInput.value.toLowerCase().trim();
                const users = JSON.parse(localStorage.getItem('navigi_users')) || [];
                
                // Check if exists
                if(users.find(u => u.email === email)) {
                    showError('generalError', "This email is already registered. Please login.");
                    return;
                }

                // Create User
                const newUser = {
                    id: Date.now(),
                    name: nameInput.value.trim(),
                    email: email,
                    role: roleInput ? roleInput.value : 'buyer',
                    password: passwordInput.value // In Prod: Hash this!
                };

                // Save User
                users.push(newUser);
                localStorage.setItem('navigi_users', JSON.stringify(users));

                // Auto Login Logic
                const session = {
                    user: newUser,
                    token: 'mock-token-' + Date.now(),
                    expiry: Date.now() + 3600000 // 1 hour
                };
                localStorage.setItem('navigi_session', JSON.stringify(session));

                // UI Feedback
                const btn = this.querySelector('button[type="submit"]');
                if(btn) {
                    btn.innerText = 'Account Created! Redirecting...';
                    btn.disabled = true;
                }
                const successMsg = document.getElementById('successMsg');
                if(successMsg) {
                    successMsg.textContent = "Welcome to NavigiFood!";
                    successMsg.style.display = 'block';
                }

                // Redirect
                setTimeout(() => {
                    // Redirect to dashboard if donor/ngo, else home
                    const partnerRoles = ['donor', 'ngo', 'restaurant', 'hotel', 'bakery', 'market', 'catering', 'admin'];
                    if(partnerRoles.includes(newUser.role)) {
                         window.location.href = 'dashboard.html';
                    } else {
                         window.location.href = 'index.html';
                    }
                }, 1500);
            }
        });
    }

    // --- LOGIN FORM ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const btn = this.querySelector('button[type="submit"]');
            const originalBtnText = btn ? btn.innerText : 'Login';
            const successMsg = document.getElementById('successMsg');

            // Reset UI
            document.querySelectorAll('.error-msg').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.form-control').forEach(el => el.style.borderColor = '#e0e0e0');
            
            let isValid = true;
    
            if (!emailInput.value.trim()) {
                showError('emailError', "Email is required.");
                emailInput.style.borderColor = 'var(--danger)';
                isValid = false;
            }
    
            if (!passwordInput.value) {
                showError('passwordError', "Password is required.");
                passwordInput.style.borderColor = 'var(--danger)';
                isValid = false;
            }
    
            if (isValid) {
                const email = emailInput.value.toLowerCase().trim();
                const password = passwordInput.value;
    
                if(btn) {
                    btn.innerText = 'Verifying...';
                    btn.disabled = true;
                }
    
                // Simulate Network Delay
                setTimeout(() => {
                    const users = JSON.parse(localStorage.getItem('navigi_users')) || [];
                    
                    // Super Admin Backdoor (for testing)
                    if (email === 'admin@navigifood.com' && password === 'admin123') {
                        users.push({ name: 'Admin', email: email, role: 'admin', password: password });
                    }

                    const user = users.find(u => u.email === email && u.password === password);
    
                    if (user) {
                        // Success
                        const session = {
                            user: user,
                            token: 'mock-token-' + Date.now(),
                            expiry: Date.now() + 3600000 // 1 hour
                        };
                        localStorage.setItem('navigi_session', JSON.stringify(session));
        
                        if(successMsg) {
                            successMsg.textContent = "Login successful! Redirecting...";
                            successMsg.style.display = 'block';
                        }
                        
                        setTimeout(() => {
                           const partnerRoles = ['donor', 'ngo', 'restaurant', 'hotel', 'bakery', 'market', 'catering', 'admin'];
                           if(partnerRoles.includes(user.role)) {
                               window.location.href = 'dashboard.html';
                           } else {
                               window.location.href = 'index.html';
                           }
                        }, 1000);
                    } else {
                        // Failure
                        showError('generalError', "Invalid email or password. Please try again.");
                        if(btn) {
                            btn.innerText = originalText;
                            btn.disabled = false;
                        }
                    }
                }, 800);
            }
        });
    }
});
