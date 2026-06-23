// Toast Notification Helper
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // Decide icon based on type
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';
  if (type === 'warning') icon = '⚠️';

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  // Auto remove toast after 3.5s
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}

// Toggle between Login and Register Cards
function toggleAuth(showRegister) {
  const loginCard = document.getElementById('loginCard');
  const registerCard = document.getElementById('registerCard');

  if (showRegister) {
    loginCard.style.display = 'none';
    registerCard.style.display = 'block';
  } else {
    registerCard.style.display = 'none';
    loginCard.style.display = 'block';
  }
}

// Handle Login Form Submission
async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!username || !password) {
    showToast('請填寫所有欄位！', 'warning');
    return;
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || '登入失敗，請重試！', 'error');
      return;
    }

    showToast('登入成功！正在跳轉...', 'success');
    setTimeout(() => {
      window.location.href = '/dashboard.html';
    }, 1000);

  } catch (err) {
    console.error('Login request failed:', err);
    showToast('網路連線失敗，請檢查伺服器狀態！', 'error');
  }
}

// Handle Register Form Submission
async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('registerUsername').value.trim();
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirmPassword').value;

  if (!username || !password || !confirmPassword) {
    showToast('請填寫所有欄位！', 'warning');
    return;
  }

  // Password length restriction check (+5 points bonus)
  if (password.length < 6) {
    showToast('密碼長度太短！最少需要 6 個字元。', 'warning');
    return; // Block registration
  }

  if (password !== confirmPassword) {
    showToast('密碼與確認密碼不一致！', 'warning');
    return;
  }

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || '註冊失敗！', 'error');
      return;
    }

    showToast('註冊成功！已切換至登入畫面。', 'success');
    
    // Clear registration fields
    document.getElementById('registerForm').reset();
    
    // Switch to login card
    setTimeout(() => {
      toggleAuth(false);
      // Auto-fill registered username to save effort
      document.getElementById('loginUsername').value = username;
    }, 1200);

  } catch (err) {
    console.error('Registration request failed:', err);
    showToast('網路連線失敗，請稍後再試！', 'error');
  }
}

// Check session on page load: if already logged in, redirect to dashboard.
window.onload = async () => {
  try {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      window.location.href = '/dashboard.html';
    }
  } catch (err) {
    // Silently ignore if not logged in
  }
};
