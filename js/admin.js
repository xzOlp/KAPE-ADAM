(function () {
  'use strict';

  const SUPABASE_URL = 'https://uqvayowsuyrkqcdmdfnw.supabase.co';
  const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdmF5b3dzdXlya3FjZG1kZm53Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODgwMDU3OSwiZXhwIjoyMDk0Mzc2NTc5fQ.L2S-w4ujca80A63wfo9-33_fzBfIr82VzA4YjmDwWxk';

  const { createClient } = window.supabase;
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const ADMIN_PASSWORD = 'admin123';

  const gate       = document.getElementById('adminGate');
  const dashboard  = document.getElementById('adminDashboard');
  const gateError  = document.getElementById('gateError');
  const gatePass   = document.getElementById('gatePassword');
  const gateBtn    = document.getElementById('gateBtn');
  const lockBtn    = document.getElementById('adminLockBtn');
  const adminStatus = document.getElementById('adminStatus');

  const usersBody  = document.getElementById('usersBody');
  const ordersBody = document.getElementById('ordersBody');
  const itemsBody  = document.getElementById('itemsBody');

  const usersCount  = document.getElementById('usersCount');
  const ordersCount = document.getElementById('ordersCount');
  const itemsCount  = document.getElementById('itemsCount');

  let profilesCache = {};

  function showAdminError(msg) {
    gateError.style.display = msg ? 'block' : 'none';
    gateError.textContent = msg;
  }

  function toast(msg) {
    let el = document.querySelector('.admin-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'admin-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 2200);
  }

  async function fetchProfiles() {
    const { data } = await supabase.from('profiles').select('id, email');
    if (data) {
      data.forEach(p => { profilesCache[p.id] = p.email; });
    }
    return data || [];
  }

  function getEmail(userId) {
    return profilesCache[userId] || userId.slice(0, 8) + '...';
  }

  /* ---- Tab switching ---- */
  document.querySelectorAll('.admin-tab').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.admin-content').forEach(s => s.classList.remove('active'));
      this.classList.add('active');
      document.getElementById(this.dataset.tab).classList.add('active');
    });
  });

  function unlock() {
    sessionStorage.setItem('admin_unlocked', '1');
    gate.style.display = 'none';
    dashboard.style.display = 'block';
    showAdminError('');
    loadData();
  }

  function lock() {
    sessionStorage.removeItem('admin_unlocked');
    dashboard.style.display = 'none';
    gate.style.display = 'flex';
    gatePass.value = '';
    showAdminError('');
  }

  /* ---- Gate ---- */
  if (sessionStorage.getItem('admin_unlocked')) {
    unlock();
  }

  gateBtn.addEventListener('click', function () {
    if (gatePass.value === ADMIN_PASSWORD) {
      unlock();
    } else {
      showAdminError('Incorrect password');
    }
  });
  gatePass.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') gateBtn.click();
  });

  lockBtn.addEventListener('click', lock);

  /* ---- Load all data ---- */
  async function loadData() {
    adminStatus.textContent = 'Loading...';
    await fetchProfiles();
    await Promise.all([
      loadUsers(),
      loadOrders(),
      loadItems(),
    ]);
    adminStatus.textContent = 'Connected';
  }

  /* ======= USERS ======= */
  async function loadUsers() {
    const { data } = await supabase.from('profiles').select('id, email, name, created_at').order('created_at', { ascending: false });
    usersBody.innerHTML = '';
    if (!data || data.length === 0) {
      usersBody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:32px;color:var(--text-light)">No users found</td></tr>';
      usersCount.textContent = '0';
      return;
    }
    usersCount.textContent = data.length;
    data.forEach(user => {
      const tr = document.createElement('tr');
      tr.dataset.id = user.id;
      tr.innerHTML = `
        <td class="cell-email">${user.email || '—'}</td>
        <td><span class="user-name-display">${user.name || ''}</span></td>
        <td style="color:var(--text-light);font-size:13px">${new Date(user.created_at).toLocaleDateString()}</td>
        <td>
          <button class="admin-btn-edit user-edit">Edit</button>
          <button class="admin-btn-delete user-delete">Delete</button>
        </td>`;
      usersBody.appendChild(tr);
    });

    usersBody.querySelectorAll('.user-edit').forEach(btn => {
      btn.addEventListener('click', function () {
        const tr = this.closest('tr');
        const display = tr.querySelector('.user-name-display');
        const current = display.textContent;
        display.innerHTML = `<input class="inline-input" value="${current}" />`;
        this.textContent = 'Save';
        this.className = 'admin-btn-save user-edit';
        const cancel = document.createElement('button');
        cancel.className = 'admin-btn-cancel';
        cancel.textContent = 'Cancel';
        this.parentNode.insertBefore(cancel, this.nextSibling);
        cancel.addEventListener('click', function () {
          display.innerHTML = current;
          btn.textContent = 'Edit';
          btn.className = 'admin-btn-edit user-edit';
          cancel.remove();
        });
        this.removeEventListener('click', this._handler);
        this.addEventListener('click', async function saveHandler() {
          const input = display.querySelector('.inline-input');
          const newName = input.value.trim();
          const { error } = await supabase.from('profiles').update({ name: newName }).eq('id', tr.dataset.id);
          if (error) { toast('Error: ' + error.message); return; }
          display.innerHTML = newName || '';
          btn.textContent = 'Edit';
          btn.className = 'admin-btn-edit user-edit';
          cancel.remove();
          toast('User updated');
        });
      });
    });

    usersBody.querySelectorAll('.user-delete').forEach(btn => {
      btn.addEventListener('click', async function () {
        const tr = this.closest('tr');
        if (!confirm('Delete user ' + (tr.querySelector('.cell-email').textContent) + '? This will also delete their orders.')) return;
        const { error } = await supabase.from('profiles').delete().eq('id', tr.dataset.id);
        if (error) { toast('Error: ' + error.message); return; }
        tr.remove();
        usersCount.textContent = usersBody.querySelectorAll('tr').length;
        toast('User deleted');
      });
    });
  }

  /* ======= ORDERS ======= */
  async function loadOrders() {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    ordersBody.innerHTML = '';
    if (!data || data.length === 0) {
      ordersBody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--text-light)">No orders found</td></tr>';
      ordersCount.textContent = '0';
      return;
    }

    ordersCount.textContent = data.length;
    data.forEach(order => {
      const itemsArr = order.items || [];
      const itemCount = itemsArr.length;
      const tr = document.createElement('tr');
      tr.dataset.id = order.id;
      const date = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      tr.innerHTML = `
        <td class="cell-id">${order.id.slice(0, 8)}</td>
        <td class="cell-email">${getEmail(order.user_id)}</td>
        <td>${itemCount}</td>
        <td class="cell-price">$${parseFloat(order.subtotal).toFixed(2)}</td>
        <td class="cell-price">$${parseFloat(order.tax).toFixed(2)}</td>
        <td class="cell-price">$${parseFloat(order.total).toFixed(2)}</td>
        <td class="cell-status">
          <select class="status-select order-status-sel">
            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
          </select>
        </td>
        <td style="color:var(--text-light);font-size:12px">${date}</td>
        <td><button class="admin-btn-delete order-delete">Delete</button></td>`;
      ordersBody.appendChild(tr);

      tr.querySelector('.order-status-sel').addEventListener('change', async function () {
        const { error } = await supabase.from('orders').update({ status: this.value }).eq('id', tr.dataset.id);
        if (error) { toast('Error: ' + error.message); return; }
        toast('Status updated to ' + this.value);
      });

      tr.querySelector('.order-delete').addEventListener('click', async function () {
        if (!confirm('Delete order ' + tr.dataset.id.slice(0, 8) + '?')) return;
        const { error } = await supabase.from('orders').delete().eq('id', tr.dataset.id);
        if (error) { toast('Error: ' + error.message); return; }
        tr.remove();
        ordersCount.textContent = ordersBody.querySelectorAll('tr').length;
        toast('Order deleted');
      });
    });
  }

  /* ======= ORDER ITEMS ======= */
  async function loadItems() {
    const { data } = await supabase.from('orders').select('id, items').order('created_at', { ascending: false });
    itemsBody.innerHTML = '';
    if (!data || data.length === 0) {
      itemsBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--text-light)">No items found</td></tr>';
      itemsCount.textContent = '0';
      return;
    }

    const allItems = [];
    data.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          allItems.push({ ...item, order_id: order.id });
        });
      }
    });

    itemsCount.textContent = allItems.length;

    if (allItems.length === 0) {
      itemsBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--text-light)">No items found</td></tr>';
      return;
    }

    allItems.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="cell-id">${item.order_id.slice(0, 8)}</td>
        <td>${item.name}</td>
        <td class="cell-price">$${parseFloat(item.price).toFixed(2)}</td>
        <td>${item.quantity}</td>
        <td class="cell-price">$${(item.price * item.quantity).toFixed(2)}</td>`;
      itemsBody.appendChild(tr);
    });
  }

  console.log('\u{1F332} Ember & Oak Admin loaded.');
})();
