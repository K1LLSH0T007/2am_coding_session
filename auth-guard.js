// auth-guard.js - Load this on all protected pages (dashboard.html, etc.)

function checkSession() {
  const currentUser = localStorage.getItem('currentUser');
  
  // If session was destroyed in another tab, redirect immediately
  if (!currentUser) {
    window.location.href = 'login.html';
  }
}

// 1. Check session state on initial page load
checkSession();

// 2. Listen for changes made to localStorage in OTHER tabs
window.addEventListener('storage', (event) => {
  // Triggers when logout or session clear occurs in another tab
  if (event.key === 'currentUser') {
    if (!event.newValue) {
      // User logged out elsewhere -> redirect immediately
      window.location.href = 'login.html';
    } else {
      // Session updated elsewhere (e.g. role change) -> reload state
      console.log('Session updated in another tab.');
    }
  }
});