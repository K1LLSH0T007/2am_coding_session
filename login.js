import { supabase } from './connection.js';

document.getElementById('login-btn').addEventListener('click', login);

async function login(e) {
  if (e) e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorElement = document.getElementById('error-message');
  errorElement.textContent = '';

  // 1. Client-side input validation
  if (!email || !password) {
    errorElement.textContent = 'Please enter both email and password.';
    return;
  }

  try {
    // 2. Fetch login record safely via parameterized query
    const { data: loginData, error: loginError } = await supabase
      .from('User_Login')
      .select('id, Email, user_id, Pass')
      .eq('Email', email)
      .single();

    if (loginError || !loginData) {
      errorElement.textContent = 'Invalid email or password.';
      return;
    }

    // 3. Securely verify password hash (or fallback to plaintext for old records during migration)
    const isHash = loginData.Pass.startsWith('$2a$') || loginData.Pass.startsWith('$2b$');
    const isPasswordValid = isHash 
      ? dcodeIO.bcrypt.compareSync(password, loginData.Pass)
      : loginData.Pass === password; // Temporary fallback for unhashed test accounts

    if (!isPasswordValid) {
      errorElement.textContent = 'Invalid email or password.';
      return;
    }

    // 4. Fetch associated user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('Users')
      .select('Usr_Name, Role')
      .eq('id', loginData.user_id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError.message);
    }

    // 5. Build session state
    const sessionData = {
      user_id: loginData.user_id,
      Email: loginData.Email,
      Usr_Name: userProfile ? userProfile.Usr_Name : 'User',
      Role: userProfile ? userProfile.Role : 'user'
    };

    localStorage.setItem('currentUser', JSON.stringify(sessionData));
    window.location.href = 'dashboard.html';

  } catch (err) {
    console.error('Login error:', err);
    errorElement.textContent = 'An unexpected error occurred.';
  }
  
}