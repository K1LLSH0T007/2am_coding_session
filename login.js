import { supabase } from './connection.js';

document.getElementById('login-btn').addEventListener('click', login);

async function login() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorElement = document.getElementById('error-message');
  errorElement.textContent = '';

  if (!email || !password) {
    errorElement.textContent = 'Please enter both email and password.';
    return;
  }

  // --- HARDCODED ADMIN BYPASS FOR TESTING ---
  if (email === 'admin@admin.com' && password === 'admin123') {
    const adminSession = {
      Email: 'admin@admin.com',
      user_id: 5,
      Usr_Name: 'System Admin',
      Role: 'admin'
    };
    localStorage.setItem('currentUser', JSON.stringify(adminSession));
    window.location.href = 'dashboard.html';
    return;
  }

  try {
    // 1. Fetch credentials from User_Login
    const { data: loginData, error: loginError } = await supabase
      .from('User_Login')
      .select('id, Email, user_id, Pass')
      .eq('Email', email)
      .single();

    if (loginError || !loginData) {
      errorElement.textContent = 'Invalid email or password.';
      return;
    }

    // 2. Validate Password
    if (loginData.Pass === password) {

      // 3. Fetch User profile details and role
      const { data: userProfile } = await supabase
        .from('Users')
        .select('Usr_Name, Role')
        .eq('id', loginData.user_id)
        .single();

      // 4. Combine session data
      const sessionData = {
        ...loginData,
        Usr_Name: userProfile ? userProfile.Usr_Name : 'User',
        Role: userProfile ? userProfile.Role : 'user'
      };

      // 5. Store session and redirect
      localStorage.setItem('currentUser', JSON.stringify(sessionData));
      window.location.href = 'dashboard.html';

    } else {
      errorElement.textContent = 'Invalid email or password.';
    }
  } catch (err) {
    console.error('Login error:', err);
    errorElement.textContent = 'An unexpected error occurred.';
  }
}