document.addEventListener('DOMContentLoaded', function() {
    
    // --- Utils ---
    function showError(elementId, message) {
        const errorEl = document.getElementById(elementId);
        if(errorEl) {
            errorEl.textContent = message;
            errorEl.style.color = 'var(--danger, #e74c3c)';
            errorEl.style.display = 'block';
        }
    }

    function hideError(elementId) {
        const errorEl = document.getElementById(elementId);
        if(errorEl) {
            errorEl.style.display = 'none';
        }
    }

    function setFieldState(input, isValid, successMsg, errorId, errorMsg) {
        if (!input) return;
        if (isValid) {
            input.style.borderColor = 'var(--success, #2ecc71)';
            input.style.boxShadow = '0 0 0 3px rgba(46,204,113,0.1)';
            hideError(errorId);
            if (successMsg) showSuccess(errorId, successMsg);
        } else {
            input.style.borderColor = 'var(--danger, #e74c3c)';
            input.style.boxShadow = '0 0 0 3px rgba(231,76,60,0.1)';
            showError(errorId, errorMsg);
        }
    }

    function clearFieldState(input, errorId) {
        if (!input) return;
        input.style.borderColor = '';
        input.style.boxShadow = '';
        hideError(errorId);
    }

    function showSuccess(errorId, message) {
        const el = document.getElementById(errorId);
        if (el) {
            el.textContent = message;
            el.style.color = 'var(--success, #2ecc71)';
            el.style.display = 'block';
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
    const planSection = document.getElementById('planSection');
    
    // Define role categories
    const sellerRoles   = ['restaurant', 'hotel', 'bakery', 'market', 'catering'];
    const buyerRoles    = ['buyer', 'ngo'];

    function togglePlanVisibility() {
        if (!planSection || !roleSelect) return;
        if (sellerRoles.includes(roleSelect.value)) {
            planSection.style.display = 'block';
        } else {
            planSection.style.display = 'none';
        }
    }

    if (roleSelect) {
        // Handle Plan Selection UI
        const planCards = document.querySelectorAll('.plan-card');
        planCards.forEach(card => {
            card.addEventListener('click', function() {
                planCards.forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                // FIX: also check the hidden radio input so input.checked works on submit
                const radio = this.querySelector('input[type="radio"]');
                if (radio) radio.checked = true;
                hideError('planError');
            });
        });

        // Toggle plan section based on role change
        roleSelect.addEventListener('change', togglePlanVisibility);
    }

    if (roleSelect && roleParam) {
        const allOptions    = Array.from(roleSelect.options);
        const optgroups     = Array.from(roleSelect.querySelectorAll('optgroup'));

        if (roleParam === 'donor') {
            // Coming as a Seller → hide buyer/NGO options, keep only business options
            allOptions.forEach(opt => {
                if (buyerRoles.includes(opt.value)) {
                    opt.style.display = 'none';
                    opt.disabled = true;
                }
            });
            // Pre-select first business option
            roleSelect.value = 'restaurant';
            // Update label hint
            const label = roleSelect.closest('.form-group')?.querySelector('.form-label');
            if (label) label.textContent = 'My Business Type';

        } else if (roleParam === 'buyer') {
            // Coming as a Buyer → hide all business options + optgroup
            allOptions.forEach(opt => {
                if (sellerRoles.includes(opt.value)) {
                    opt.style.display = 'none';
                    opt.disabled = true;
                }
            });
            optgroups.forEach(og => og.style.display = 'none');
            // Pre-select buyer
            roleSelect.value = 'buyer';
            // Update label hint
            const label = roleSelect.closest('.form-group')?.querySelector('.form-label');
            if (label) label.textContent = 'I want to...';

        } else {
            // Generic fallback — just pre-select whatever value is in the URL
            roleSelect.value = roleParam;
        }
    }

    // Call it once on load to set initial state
    togglePlanVisibility();

    // ================================================================
    //   REGISTER — Live Validation
    // ================================================================
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {

        const nameInput            = document.getElementById('name');
        const emailInput           = document.getElementById('email');
        const passwordInput        = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirm-password');
        const termsInput           = document.getElementById('terms');
        const planInputs           = document.querySelectorAll('input[name="plan"]');
        const emailPattern         = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // --- Live: Name ---
        if (nameInput) {
            nameInput.addEventListener('input', () => {
                const len = nameInput.value.trim().length;
                if (len === 0) {
                    clearFieldState(nameInput, 'nameError');
                } else if (len < 2) {
                    setFieldState(nameInput, false, null, 'nameError', `Name too short — ${2 - len} more character${2 - len > 1 ? 's' : ''} needed.`);
                } else {
                    setFieldState(nameInput, true, '✓ Looks good!', 'nameError', null);
                }
            });
            nameInput.addEventListener('blur', () => {
                if (nameInput.value.trim().length === 0)
                    setFieldState(nameInput, false, null, 'nameError', 'Full name is required.');
            });
        }

        // --- Live: Email ---
        if (emailInput) {
            emailInput.addEventListener('input', () => {
                const val = emailInput.value.trim();
                if (val === '') {
                    clearFieldState(emailInput, 'emailError');
                } else if (!emailPattern.test(val)) {
                    setFieldState(emailInput, false, null, 'emailError', 'Please enter a valid email (e.g. name@email.com).');
                } else {
                    setFieldState(emailInput, true, '✓ Valid email address', 'emailError', null);
                }
            });
            emailInput.addEventListener('blur', () => {
                if (emailInput.value.trim() && !emailPattern.test(emailInput.value.trim()))
                    setFieldState(emailInput, false, null, 'emailError', 'Invalid email format.');
            });
        }

        // --- Live: Password ---
        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                const len = passwordInput.value.length;
                if (len === 0) {
                    clearFieldState(passwordInput, 'passwordError');
                } else if (len < 8) {
                    setFieldState(passwordInput, false, null, 'passwordError', `Password too short — ${8 - len} more character${8 - len > 1 ? 's' : ''} needed.`);
                } else {
                    setFieldState(passwordInput, true, '✓ Password strength OK', 'passwordError', null);
                }
                if (confirmPasswordInput && confirmPasswordInput.value) {
                    liveCheckConfirmPassword();
                }
            });
        }

        // --- Live: Confirm Password ---
        function liveCheckConfirmPassword() {
            if (!confirmPasswordInput || !passwordInput) return;
            const val  = confirmPasswordInput.value;
            const pass = passwordInput.value;
            if (val === '') {
                clearFieldState(confirmPasswordInput, 'confirmPasswordError');
            } else if (val !== pass) {
                setFieldState(confirmPasswordInput, false, null, 'confirmPasswordError', 'Passwords do not match.');
            } else {
                setFieldState(confirmPasswordInput, true, '✓ Passwords match!', 'confirmPasswordError', null);
            }
        }
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', liveCheckConfirmPassword);
        }

        // ---- Submit ----
        registerForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const btn             = this.querySelector('button[type="submit"]');
            const originalBtnText = btn ? btn.innerText : 'Create Account';
            const roleInput       = document.getElementById('role');

            // Reset all error styles on submit
            document.querySelectorAll('.error-msg').forEach(el => {
                el.style.display = 'none';
                el.style.color = 'var(--danger, #e74c3c)';
            });
            document.querySelectorAll('.form-control').forEach(el => {
                el.style.borderColor = '';
                el.style.boxShadow = '';
            });

            let isValid = true;

            if (!nameInput || nameInput.value.trim().length < 2) {
                setFieldState(nameInput, false, null, 'nameError', 'Full name must be at least 2 characters.');
                isValid = false;
            }
            if (!emailInput || !emailPattern.test(emailInput.value)) {
                setFieldState(emailInput, false, null, 'emailError', 'Please enter a valid email address.');
                isValid = false;
            }
            if (!passwordInput || passwordInput.value.length < 8) {
                setFieldState(passwordInput, false, null, 'passwordError', 'Password must be at least 8 characters.');
                isValid = false;
            }
            if (!confirmPasswordInput || confirmPasswordInput.value !== passwordInput.value) {
                setFieldState(confirmPasswordInput, false, null, 'confirmPasswordError', 'Passwords do not match.');
                isValid = false;
            }
            if (!termsInput || !termsInput.checked) {
                showError('termsError', 'You must accept the Terms & Conditions.');
                isValid = false;
            }

            let selectedPlan = null;
            if (roleInput && sellerRoles.includes(roleInput.value)) {
                planInputs.forEach(input => { if (input.checked) selectedPlan = input.value; });
                if (!selectedPlan) {
                    const activeCard = document.querySelector('.plan-card.active');
                    if (activeCard) {
                        const r = activeCard.querySelector('input[type="radio"]');
                        if (r) selectedPlan = r.value;
                    }
                }
                if (!selectedPlan) {
                    showError('planError', 'Please select a business plan to continue.');
                    isValid = false;
                }
            }

            if (!isValid) return;

            const email = emailInput.value.toLowerCase().trim();
            const name  = nameInput.value.trim();
            const role  = roleInput ? roleInput.value : 'buyer';
            const plan  = selectedPlan || 'none';

            if (btn) { btn.innerText = 'Creating account...'; btn.disabled = true; }

            try {
                const { data: authData, error: authError } = await window.supabaseClient.auth.signUp({
                    email, password: passwordInput.value,
                    options: { data: { name, role, plan } }
                });
                if (authError) throw authError;

                if (authData.user) {
                    const { error: profileError } = await window.supabaseClient
                        .from('profiles')
                        .insert({ id: authData.user.id, name, email, role, plan });
                    if (profileError) console.error('Profile creation error:', profileError);
                }

                if (successMsg) {
                    successMsg.textContent = '🎉 Welcome to NavigiFood! Redirecting...';
                    successMsg.style.display = 'block';
                }
                if (btn) btn.innerText = 'Account created! Redirecting...';

                setTimeout(() => {
                    const providerRoles = ['donor', 'restaurant', 'hotel', 'bakery', 'market', 'catering', 'admin'];
                    if (providerRoles.includes(role) || role === 'ngo') {
                        window.location.href = 'dashboard.html';
                    } else {
                        window.location.href = 'browse-food.html';
                    }
                }, 1500);

            } catch (error) {
                console.error('Registration error:', error);
                let message = 'An error occurred during registration. Please try again.';
                if (error.message) {
                    if (error.message.includes('already registered') || error.message.includes('already been registered')) {
                        message = 'This email is already registered. Please log in instead.';
                    } else if (error.message.toLowerCase().includes('password')) {
                        message = 'Password must be at least 6 characters.';
                    } else {
                        message = error.message;
                    }
                }
                showError('generalError', message);
                if (btn) { btn.innerText = originalBtnText; btn.disabled = false; }
            }
        });
    }

    // ================================================================
    //   LOGIN — Live Validation
    // ================================================================
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        const emailInput    = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const emailPattern  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // --- Live: Email ---
        if (emailInput) {
            emailInput.addEventListener('input', () => {
                const val = emailInput.value.trim();
                if (val === '') {
                    clearFieldState(emailInput, 'emailError');
                } else if (!emailPattern.test(val)) {
                    setFieldState(emailInput, false, null, 'emailError', 'Invalid email format.');
                } else {
                    setFieldState(emailInput, true, '✓ Valid email address', 'emailError', null);
                }
            });
        }

        // --- Live: Password ---
        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                if (passwordInput.value.length > 0) {
                    setFieldState(passwordInput, true, null, 'passwordError', null);
                } else {
                    clearFieldState(passwordInput, 'passwordError');
                }
            });
        }

        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const btn             = this.querySelector('button[type="submit"]');
            const originalBtnText = btn ? btn.innerText : 'Login';
            const successMsg      = document.getElementById('successMsg');

            document.querySelectorAll('.error-msg').forEach(el => {
                el.style.display = 'none';
                el.style.color = 'var(--danger, #e74c3c)';
            });
            document.querySelectorAll('.form-control').forEach(el => {
                el.style.borderColor = '';
                el.style.boxShadow = '';
            });

            let isValid = true;
            if (!emailInput || !emailInput.value.trim()) {
                setFieldState(emailInput, false, null, 'emailError', 'Email address is required.');
                isValid = false;
            }
            if (!passwordInput || !passwordInput.value) {
                setFieldState(passwordInput, false, null, 'passwordError', 'Password is required.');
                isValid = false;
            }
            if (!isValid) return;

            const email = emailInput.value.toLowerCase().trim();
            if (btn) { btn.innerText = 'Verifying...'; btn.disabled = true; }

            try {
                const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                    email, password: passwordInput.value
                });
                if (error) throw error;

                const { data: profile } = await window.supabaseClient
                    .from('profiles').select('*').eq('id', data.user.id).single();

                if (successMsg) {
                    successMsg.textContent = '✓ Login successful! Redirecting...';
                    successMsg.style.display = 'block';
                }

                setTimeout(() => {
                    const role = profile ? profile.role : (data.user.user_metadata?.role || 'buyer');
                    const partnerRoles = ['donor', 'ngo', 'restaurant', 'hotel', 'bakery', 'market', 'catering', 'admin'];
                    window.location.href = partnerRoles.includes(role) ? 'dashboard.html' : 'browse-food.html';
                }, 1000);

            } catch (error) {
                console.error('Login error:', error);
                let message = 'An error occurred. Please try again.';
                if (error.message === 'Invalid login credentials') {
                    message = 'Incorrect email or password. Please try again.';
                } else if (error.message.includes('Email not confirmed')) {
                    message = 'Please confirm your email first. Check your inbox.';
                } else {
                    message = error.message;
                }
                showError('generalError', message);
                if (btn) { btn.innerText = originalBtnText; btn.disabled = false; }
            }
        });
    }
});
