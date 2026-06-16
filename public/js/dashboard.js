// Toast Notification Helper
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '❌';
  if (type === 'warning') icon = '⚠️';

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  // Auto remove toast
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}

// Global transactions state
let transactions = [];

// Get Category Badge HTML Class
function getCategoryBadgeClass(category) {
  switch (category) {
    case '餐飲': return 'badge-dining';
    case '交通': return 'badge-transport';
    case '娛樂': return 'badge-entertainment';
    case '購物': return 'badge-shopping';
    case '醫療': return 'badge-medical';
    default: return 'badge-others';
  }
}

// Get Category Icon
function getCategoryIcon(category) {
  switch (category) {
    case '餐飲': return '🍔';
    case '交通': return '🚗';
    case '娛樂': return '🎬';
    case '購物': return '🛍️';
    case '醫療': return '🏥';
    default: return '❓';
  }
}

// Format Date for display (e.g. YYYY/MM/DD HH:mm)
function formatDate(dateString) {
  const date = new Date(dateString);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
}

// Load and Render Transactions & Totals
async function loadTransactions() {
  try {
    const res = await fetch('/api/accounts');

    // Intercept unauthorized access at frontend
    if (res.status === 401) {
      showToast('登入狀態已過期，請重新登入！', 'warning');
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 1500);
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

// Update the ledger list and the metric sums
function updateUI() {
  const listContainer = document.getElementById('transactionList');
  const emptyState = document.getElementById('emptyState');
  
  const totalIncomeEl = document.getElementById('totalIncome');
  const totalExpenseEl = document.getElementById('totalExpense');
  const netBalanceEl = document.getElementById('netBalance');

  // Remove existing transaction items but keep emptyState
  const items = listContainer.querySelectorAll('.transaction-item');
  items.forEach(item => item.remove());

  let totalIncome = 0;
  let totalExpense = 0;

  if (transactions.length === 0) {
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';

    transactions.forEach(tx => {
      // Calculate sums
      const amt = Number(tx.amount);
      if (tx.type === 'income') {
        totalIncome += amt;
      } else {
        totalExpense += amt;
      }

      // Create item row
      const row = document.createElement('div');
      row.className = 'transaction-item';
      
      const badgeClass = getCategoryBadgeClass(tx.category);
      const categoryIcon = getCategoryIcon(tx.category);
      const typeClass = tx.type === 'income' ? 'amount-income' : 'amount-expense';

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
          <button class="btn-delete" onclick="deleteTransaction('${tx._id}')" title="刪除交易">
            🗑️
          </button>
        </div>
      `;
      
      listContainer.appendChild(row);
    });
  }

  // Update Summary numbers (+5 points bonus)
  totalIncomeEl.innerText = `$${totalIncome.toLocaleString()}`;
  totalExpenseEl.innerText = `$${totalExpense.toLocaleString()}`;
  
  const balance = totalIncome - totalExpense;
  netBalanceEl.innerText = `$${balance.toLocaleString()}`;
  
  // Style net balance color dynamically
  if (balance >= 0) {
    netBalanceEl.style.color = '#34d399'; // Green if positive/neutral
  } else {
    netBalanceEl.style.color = '#f87171'; // Red if in debt
  }
}

// Add Transaction (AJAX SPA style, no refresh)
async function addTransaction(e) {
  e.preventDefault();

  const description = document.getElementById('descInput').value.trim();
  const amount = parseFloat(document.getElementById('amountInput').value);
  const type = document.querySelector('input[name="type"]:checked').value;
  const category = document.getElementById('categorySelect').value;

  if (!description || isNaN(amount) || amount <= 0) {
    showToast('請填寫正確項目與正數金額！', 'warning');
    return;
  }

  try {
    const res = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, amount, type, category })
    });

    if (res.status === 401) {
      showToast('登入狀態已過期，請重新登入！', 'warning');
      setTimeout(() => { window.location.href = '/login.html'; }, 1500);
      return;
    }

    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || '新增項目失敗！', 'error');
      return;
    }

    showToast('交易項目已新增！', 'success');
    
    // Reset Form
    document.getElementById('transactionForm').reset();
    // Re-check expense option
    document.getElementById('typeExpense').checked = true;

    // Refresh transactions state locally & render updates
    transactions.unshift(data);
    updateUI();

  } catch (err) {
    console.error('Failed to add transaction:', err);
    showToast('伺服器無回應，請稍後再試！', 'error');
  }
}

// Helper for custom confirmation modal
function showCustomConfirm(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirmModal');
    const confirmBtn = document.getElementById('confirmConfirmBtn');
    const cancelBtn = document.getElementById('confirmCancelBtn');

    // Set message text
    modal.querySelector('.modal-body p').innerText = message;

    // Show modal overlay
    modal.style.display = 'flex';

    const handleConfirm = () => {
      cleanup();
      resolve(true);
    };

    const handleCancel = () => {
      cleanup();
      resolve(false);
    };

    const cleanup = () => {
      modal.style.display = 'none';
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
    };

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
  });
}

// Delete Transaction (AJAX SPA style, no refresh)
async function deleteTransaction(id) {
  const isConfirmed = await showCustomConfirm('您確定要刪除這筆收支項目嗎？');
  if (!isConfirmed) {
    return;
  }

  try {
    const res = await fetch(`/api/accounts/${id}`, {
      method: 'DELETE'
    });

    if (res.status === 401) {
      showToast('登入已逾時，請重登！', 'warning');
      setTimeout(() => { window.location.href = '/login.html'; }, 1500);
      return;
    }

    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || '刪除失敗！', 'error');
      return;
    }

    showToast('交易項目已刪除！', 'success');

    // Remove item from local array and update UI
    transactions = transactions.filter(tx => tx._id !== id);
    updateUI();

  } catch (err) {
    console.error('Failed to delete transaction:', err);
    showToast('網路連線失敗，刪除作業未完成！', 'error');
  }
}

// Handle Logout
async function handleLogout() {
  try {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    if (res.ok) {
      showToast('已安全登出！', 'success');
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 1000);
    } else {
      showToast('登出遭遇異常！', 'error');
    }
  } catch (err) {
    console.error('Logout error:', err);
    window.location.href = '/login.html';
  }
}

// HTML XSS escaping utility
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Initialize Auth & Data fetching on load
window.onload = async () => {
  try {
    const res = await fetch('/api/auth/me');
    
    if (res.status === 401) {
      // Not logged in, redirect
      window.location.href = '/login.html';
      return;
    }

    if (!res.ok) {
      window.location.href = '/login.html';
      return;
    }

    const user = await res.json();
    
    // Set headers
    document.getElementById('welcomeUsername').innerText = `${user.username} 的帳本`;
    document.getElementById('avatarLetter').innerText = user.username.charAt(0).toUpperCase();

    // Load ledger data
    loadTransactions();

  } catch (err) {
    console.error('Initial session check failed:', err);
    window.location.href = '/login.html';
  }
};
