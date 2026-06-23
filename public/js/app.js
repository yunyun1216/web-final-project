// ============================================================
// SPA 畫面切換控制（不跳頁，URL 永遠不變）
// ============================================================

/**
 * 顯示指定畫面，隱藏其他畫面
 * @param {'auth'|'dashboard'} view
 */
function showView(view) {
  const authView = document.getElementById('authView');
  const dashboardView = document.getElementById('dashboardView');

  if (view === 'auth') {
    dashboardView.style.display = 'none';
    authView.style.display = 'flex';
  } else {
    authView.style.display = 'none';
    dashboardView.style.display = 'flex';
  }
}

// ============================================================
// Toast 通知
// ============================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error')   icon = '❌';
  if (type === 'warning') icon = '⚠️';

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ============================================================
// 登入 / 註冊 表單切換
// ============================================================
function toggleAuth(showRegister) {
  const loginCard    = document.getElementById('loginCard');
  const registerCard = document.getElementById('registerCard');

  if (showRegister) {
    loginCard.style.display    = 'none';
    registerCard.style.display = 'block';
  } else {
    registerCard.style.display = 'none';
    loginCard.style.display    = 'block';
  }
}

// ============================================================
// 登入
// ============================================================
async function handleLogin(e) {
  e.preventDefault();

  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!username || !password) {
    showToast('請填寫所有欄位！', 'warning');
    return;
  }

  try {
    const res  = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || '登入失敗，請重試！', 'error');
      return;
    }

    showToast('登入成功！', 'success');

    // ✅ 切換畫面，URL 完全不變
    document.getElementById('loginForm').reset();
    await enterDashboard(data.username || username);

  } catch (err) {
    console.error('Login request failed:', err);
    showToast('網路連線失敗，請檢查伺服器狀態！', 'error');
  }
}

// ============================================================
// 註冊
// ============================================================
async function handleRegister(e) {
  e.preventDefault();

  const username        = document.getElementById('registerUsername').value.trim();
  const password        = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirmPassword').value;

  if (!username || !password || !confirmPassword) {
    showToast('請填寫所有欄位！', 'warning');
    return;
  }

  // 密碼長度限制 (+5 分)
  if (password.length < 6) {
    showToast('密碼長度太短！最少需要 6 個字元。', 'warning');
    return;
  }

  if (password !== confirmPassword) {
    showToast('密碼與確認密碼不一致！', 'warning');
    return;
  }

  try {
    const res  = await fetch('/api/auth/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || '註冊失敗！', 'error');
      return;
    }

    showToast('註冊成功！已切換至登入畫面。', 'success');
    document.getElementById('registerForm').reset();

    // 切回登入卡，並自動填入帳號
    setTimeout(() => {
      toggleAuth(false);
      document.getElementById('loginUsername').value = username;
    }, 1200);

  } catch (err) {
    console.error('Registration request failed:', err);
    showToast('網路連線失敗，請稍後再試！', 'error');
  }
}

// ============================================================
// 登出
// ============================================================
async function handleLogout() {
  try {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    if (res.ok) {
      showToast('已安全登出！', 'success');
      transactions = [];

      // ✅ 切換回登入畫面，URL 完全不變
      setTimeout(() => {
        toggleAuth(false);
        showView('auth');
      }, 800);
    } else {
      showToast('登出遭遇異常！', 'error');
    }
  } catch (err) {
    console.error('Logout error:', err);
    showToast('登出失敗，請重試！', 'error');
  }
}

// ============================================================
// Dashboard 初始化
// ============================================================
async function enterDashboard(username) {
  // 設定 header 顯示
  document.getElementById('welcomeUsername').innerText = `${username} 的帳本`;
  document.getElementById('avatarLetter').innerText = username.charAt(0).toUpperCase();

  // 切換畫面（URL 完全不動）
  showView('dashboard');

  // 載入記帳資料
  await loadTransactions();
}

// ============================================================
// 記帳 — 全域資料
// ============================================================
let transactions = [];

function getCategoryBadgeClass(category) {
  switch (category) {
    case '餐飲': return 'badge-dining';
    case '交通': return 'badge-transport';
    case '娛樂': return 'badge-entertainment';
    case '購物': return 'badge-shopping';
    case '醫療': return 'badge-medical';
    default:     return 'badge-others';
  }
}

function getCategoryIcon(category) {
  switch (category) {
    case '餐飲': return '🍔';
    case '交通': return '🚗';
    case '娛樂': return '🎬';
    case '購物': return '🛍️';
    case '醫療': return '🏥';
    default:     return '❓';
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const yyyy = date.getFullYear();
  const mm   = String(date.getMonth() + 1).padStart(2, '0');
  const dd   = String(date.getDate()).padStart(2, '0');
  const hh   = String(date.getHours()).padStart(2, '0');
  const min  = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
}

// HTML XSS 防護
function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// ============================================================
// 讀取記帳清單（SPA，不跳頁）
// ============================================================
async function loadTransactions() {
  try {
    const res = await fetch('/api/accounts');

    if (res.status === 401) {
      showToast('登入狀態已過期，請重新登入！', 'warning');
      setTimeout(() => showView('auth'), 1500);
      return;
    }

    if (!res.ok) {
      showToast('讀取資料明細失敗！', 'error');
      return;
    }

    transactions = await res.json();
    updateUI();
  } catch (err) {
    console.error('Fetch transactions failed:', err);
    showToast('網路連線失敗，無法取得帳務資料！', 'error');
  }
}

// ============================================================
// 更新畫面（局部渲染，不重載）
// ============================================================
function updateUI() {
  const listContainer   = document.getElementById('transactionList');
  const emptyState      = document.getElementById('emptyState');
  const totalIncomeEl   = document.getElementById('totalIncome');
  const totalExpenseEl  = document.getElementById('totalExpense');
  const netBalanceEl    = document.getElementById('netBalance');

  // 移除舊的列表項目，保留 emptyState
  listContainer.querySelectorAll('.transaction-item').forEach(el => el.remove());

  let totalIncome  = 0;
  let totalExpense = 0;

  if (transactions.length === 0) {
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';

    transactions.forEach(tx => {
      const amt = Number(tx.amount);
      if (tx.type === 'income') {
        totalIncome += amt;
      } else {
        totalExpense += amt;
      }

      const row = document.createElement('div');
      row.className = 'transaction-item';

      const badgeClass   = getCategoryBadgeClass(tx.category);
      const categoryIcon = getCategoryIcon(tx.category);
      const typeClass    = tx.type === 'income' ? 'amount-income' : 'amount-expense';

      row.innerHTML = `
        <div class="transaction-left">
          <span class="category-badge ${badgeClass}">${categoryIcon} ${tx.category}</span>
          <div class="transaction-details">
            <div class="desc">${escapeHtml(tx.description)}</div>
            <div class="date">${formatDate(tx.date)}</div>
          </div>
        </div>
        <div class="transaction-right">
          <span class="transaction-amount ${typeClass}">$${amt.toLocaleString()}</span>
          <button class="btn-delete" onclick="deleteTransaction('${tx._id}')" title="刪除交易">🗑️</button>
        </div>
      `;

      listContainer.appendChild(row);
    });
  }

  // 更新統計數字 (+5 分)
  totalIncomeEl.innerText  = `$${totalIncome.toLocaleString()}`;
  totalExpenseEl.innerText = `$${totalExpense.toLocaleString()}`;

  const balance = totalIncome - totalExpense;
  netBalanceEl.innerText   = `$${balance.toLocaleString()}`;
  netBalanceEl.style.color = balance >= 0 ? '#34d399' : '#f87171';
}

// ============================================================
// 新增記帳（AJAX，不跳頁，不重載）
// ============================================================
async function addTransaction(e) {
  e.preventDefault();

  const description = document.getElementById('descInput').value.trim();
  const amount      = parseFloat(document.getElementById('amountInput').value);
  const type        = document.querySelector('input[name="type"]:checked').value;
  const category    = document.getElementById('categorySelect').value;

  if (!description || isNaN(amount) || amount <= 0) {
    showToast('請填寫正確項目與正數金額！', 'warning');
    return;
  }

  try {
    const res = await fetch('/api/accounts', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ description, amount, type, category })
    });

    if (res.status === 401) {
      showToast('登入狀態已過期，請重新登入！', 'warning');
      setTimeout(() => showView('auth'), 1500);
      return;
    }

    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || '新增項目失敗！', 'error');
      return;
    }

    showToast('交易項目已新增！', 'success');

    // 清空表單
    document.getElementById('transactionForm').reset();
    document.getElementById('typeExpense').checked = true;

    // 局部更新畫面，不重載
    transactions.unshift(data);
    updateUI();

  } catch (err) {
    console.error('Failed to add transaction:', err);
    showToast('伺服器無回應，請稍後再試！', 'error');
  }
}

// ============================================================
// 自訂確認 Modal
// ============================================================
function showCustomConfirm(message) {
  return new Promise((resolve) => {
    const modal      = document.getElementById('confirmModal');
    const confirmBtn = document.getElementById('confirmConfirmBtn');
    const cancelBtn  = document.getElementById('confirmCancelBtn');

    modal.querySelector('.modal-body p').innerText = message;
    modal.style.display = 'flex';

    const cleanup = () => {
      modal.style.display = 'none';
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
    };

    const handleConfirm = () => { cleanup(); resolve(true);  };
    const handleCancel  = () => { cleanup(); resolve(false); };

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
  });
}

// ============================================================
// 刪除記帳（AJAX，不跳頁，不重載）
// ============================================================
async function deleteTransaction(id) {
  const isConfirmed = await showCustomConfirm('您確定要刪除這筆收支項目嗎？');
  if (!isConfirmed) return;

  try {
    const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });

    if (res.status === 401) {
      showToast('登入已逾時，請重登！', 'warning');
      setTimeout(() => showView('auth'), 1500);
      return;
    }

    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || '刪除失敗！', 'error');
      return;
    }

    showToast('交易項目已刪除！', 'success');

    // 局部移除，不重載
    transactions = transactions.filter(tx => tx._id !== id);
    updateUI();

  } catch (err) {
    console.error('Failed to delete transaction:', err);
    showToast('網路連線失敗，刪除作業未完成！', 'error');
  }
}

// ============================================================
// 頁面載入時的 Session 檢查
// ============================================================
window.onload = async () => {
  try {
    const res = await fetch('/api/auth/me');

    if (res.ok) {
      // 已登入 → 直接進 dashboard，URL 不跳轉
      const user = await res.json();
      await enterDashboard(user.username);
    } else {
      // 未登入 → 顯示登入畫面
      showView('auth');
    }
  } catch (err) {
    console.error('Session check failed:', err);
    showView('auth');
  }
};
