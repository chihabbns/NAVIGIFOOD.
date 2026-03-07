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
    //    REGISTER FORM — Supabase Auth
    // ================================================================
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            
            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const confirmPasswordInput = document.getElementById('confirm-password');
            const termsInput = document.getElementById('terms');
            const roleInput = document.getElementById('role');
            const planInputs = document.querySelectorAll('input[name="plan"]');
            const btn = this.querySelector('button[type="submit"]');
            const originalBtnText = btn ? btn.innerText : 'Create Account';
            
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

            // Validate Plan for Sellers
            let selectedPlan = null;
            if (roleInput && sellerRoles.includes(roleInput.value)) {
                planInputs.forEach(input => {
                    if (input.checked) selectedPlan = input.value;
                });
                if (!selectedPlan) {
                    showError('planError', "Please select a plan for your business.");
                    isValid = false;
                }
            }

            if(isValid) {
                const email = emailInput.value.toLowerCase().trim();
                const name = nameInput.value.trim();
                const role = roleInput ? roleInput.value : 'buyer';
                const plan = selectedPlan || 'none';

                // Show loading state
                if(btn) {
                    btn.innerText = 'Creating Account...';
                    btn.disabled = true;
                }

                try {
                    // 1. Sign up with Supabase Auth
                    const { data: authData, error: authError } = await window.supabaseClient.auth.signUp({
                        email: email,
                        password: passwordInput.value,
                        options: {
                            data: {
                                name: name,
                                role: role,
                                plan: plan
                            }
                        }
                    });

                    if (authError) {
                        throw authError;
                    }

                    // 2. Insert profile into profiles table
                    if (authData.user) {
                        const { error: profileError } = await window.supabaseClient
                            .from('profiles')
                            .insert({
                                id: authData.user.id,
                                name: name,
                                email: email,
                                role: role,
                                plan: plan
                            });

                        if (profileError) {
                            console.error('Profile creation error:', profileError);
                            // Non-fatal — auth account was created, profile can be created later
                        }
                    }

                    // 3. Success UI
                    const successMsg = document.getElementById('successMsg');
                    if(successMsg) {
                        successMsg.textContent = "Welcome to NavigiFood!";
                        successMsg.style.display = 'block';
                    }
                    if(btn) {
                        btn.innerText = 'Account Created! Redirecting...';
                    }

                    // 4. Redirect
                    setTimeout(() => {
                        const partnerRoles = ['donor', 'ngo', 'restaurant', 'hotel', 'bakery', 'market', 'catering', 'admin'];
                        if(partnerRoles.includes(role)) {
                             window.location.href = 'dashboard.html';
                        } else {
                             window.location.href = 'index.html';
                        }
                    }, 1500);

                } catch (error) {
                    console.error('Registration error:', error);
                    let message = 'An error occurred during registration. Please try again.';
                    
                    if (error.message) {
                        if (error.message.includes('already registered')) {
                            message = 'This email is already registered. Please login.';
                        } else if (error.message.includes('password')) {
                            message = 'Password must be at least 6 characters.';
                        } else {
                            message = error.message;
                        }
                    }

                    showError('generalError', message);
                    if(btn) {
                        btn.innerText = originalBtnText;
                        btn.disabled = false;
                    }
                }
            }
        });
    }

    // ================================================================
    //    LOGIN FORM — Supabase Auth
    // ================================================================
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
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

                if(btn) {
                    btn.innerText = 'Verifying...';
                    btn.disabled = true;
                }

                try {
                    // Sign in with Supabase
                    const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                        email: email,
                        password: passwordInput.value
                    });

                    if (error) {
                        throw error;
                    }

                    // Fetch user profile from profiles table
                    const { data: profile } = await window.supabaseClient
                        .from('profiles')
                        .select('*')
                        .eq('id', data.user.id)
                        .single();

                    if(successMsg) {
                        successMsg.textContent = "Login successful! Redirecting...";
                        successMsg.style.display = 'block';
                    }
                    
                    // Redirect based on role
                    setTimeout(() => {
                        const role = profile ? profile.role : (data.user.user_metadata?.role || 'buyer');
                        const partnerRoles = ['donor', 'ngo', 'restaurant', 'hotel', 'bakery', 'market', 'catering', 'admin'];
                        if(partnerRoles.includes(role)) {
                            window.location.href = 'dashboard.html';
                        } else {
                            window.location.href = 'index.html';
                        }
                    }, 1000);

                } catch (error) {
                    console.error('Login error:', error);
                    let message = 'Invalid email or password. Please try again.';
                    
                    // Custom messages in Arabic for better user experience
                    if (error.message === 'Invalid login credentials') {
                        message = 'البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى المحاولة مرة أخرى.';
                    } else if (error.message.includes('Email not confirmed')) {
                        message = 'يرجى تأكيد بريدك الإلكتروني من خلال الرابط المرسل إليك.';
                    } else {
                        message = error.message;
                    }

                    showError('generalError', message);
                    if(btn) {
                        btn.innerText = originalBtnText;
                        btn.disabled = false;
                    }
                }
            }
        });
    }
});
