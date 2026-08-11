import { supabase } from './connection.js';

// 1. Get current session from LocalStorage
const currentUser = JSON.parse(localStorage.getItem('currentUser'));

if (!currentUser) {
  window.location.href = 'login.html';
}

// --- XSS SANITIZATION HELPER ---
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// --- CROSS-TAB SESSION PROTECTION ---
window.addEventListener('storage', (event) => {
  if (event.key === 'currentUser') {
    if (!event.newValue) {
      // User logged out in another tab -> kick out immediately
      window.location.href = 'login.html';
    } else {
      // Session updated in another tab -> reload page to reflect changes
      window.location.reload();
    }
  }
});

const isAdmin = currentUser.Role === 'admin';

document.addEventListener('DOMContentLoaded', () => {
  renderUserInfo();
  loadDashboardData();
});

function renderUserInfo() {
  const display = document.getElementById('user-display');
  if (!display) return;
  const roleBadge = isAdmin 
    ? '<span class="badge badge-admin">Admin</span>' 
    : '<span class="badge badge-user">User</span>';
  
  display.innerHTML = `${escapeHTML(currentUser.Usr_Name || currentUser.Email)} ${roleBadge}`;
}

async function loadDashboardData() {
  const container = document.getElementById('table-container');
  if (!container) return;

  try {
    let query = supabase.from('Property').select(`
      id,
      Name_Property,
      Property_Type,
      Valuation,
      Description,
      user_id,
      Users (
        Usr_Name,
        Usr_Surname
      )
    `);

    if (!isAdmin) {
      query = query.eq('user_id', currentUser.user_id);
    }

    const { data: properties, error } = await query;

    if (error) throw error;

    if (!properties || properties.length === 0) {
      container.innerHTML = '<p>No properties found.</p>';
      return;
    }

    // Build base table framework
    let html = `
      <table>
        <thead>
          <tr>
            <th>Property Name</th>
            <th>Type</th>
            <th>Valuation</th>
            <th>Description</th>
            <th>Assigned Manager</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="property-table-body"></tbody>
      </table>
    `;

    container.innerHTML = html;
    const tbody = document.getElementById('property-table-body');

    // Populate rows securely using DOM API / dataset binding
    properties.forEach(prop => {
      const manager = prop.Users 
        ? `${prop.Users.Usr_Name || ''} ${prop.Users.Usr_Surname || ''}` 
        : 'Unassigned';

      const safeName = escapeHTML(prop.Name_Property);
      const safeType = escapeHTML(prop.Property_Type || 'Cell Tower');
      const safeValuation = prop.Valuation ? prop.Valuation.toLocaleString() : '0';
      const safeDesc = escapeHTML(prop.Description || '-');
      const safeManager = escapeHTML(manager);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${safeName}</strong></td>
        <td>${safeType}</td>
        <td>R ${safeValuation}</td>
        <td>${safeDesc}</td>
        <td>${safeManager}</td>
        <td>
          <button class="btn-primary edit-btn" style="padding: 0.3rem 0.6rem; font-size: 0.85rem;">Edit</button>
          <button class="btn-danger delete-btn">Delete</button>
        </td>
      `;

      // Attach event listeners safely without inline string interpolation
      const editBtn = tr.querySelector('.edit-btn');
      editBtn.addEventListener('click', () => {
        openEditModal(
          prop.id, 
          prop.Name_Property || '', 
          prop.Property_Type || '', 
          prop.Valuation || 0, 
          prop.Description || ''
        );
      });

      const deleteBtn = tr.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', () => {
        deleteProperty(prop.id);
      });

      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error('Error loading data:', err);
    container.innerHTML = `<p style="color:red">Failed to load data: ${escapeHTML(err.message)}</p>`;
  }
}

// Add Property
window.addProperty = async function() {
  const name = document.getElementById('prop-name').value.trim();
  const type = document.getElementById('prop-type').value.trim();
  const val = parseInt(document.getElementById('prop-val').value, 10);
  const desc = document.getElementById('prop-desc').value.trim();

  if (!name || isNaN(val)) {
    alert('Please enter a valid property name and valuation.');
    return;
  }

  const { error } = await supabase.from('Property').insert([
    {
      Name_Property: name,
      Property_Type: type,
      Valuation: val,
      Description: desc,
      user_id: currentUser.user_id
    }
  ]);

  if (error) {
    alert('Failed to add property: ' + error.message);
  } else {
    closeModal();
    loadDashboardData();
  }
};

// Delete Property
window.deleteProperty = async function(id) {
  if (!confirm('Are you sure you want to delete this property?')) return;

  const { error } = await supabase.from('Property').delete().eq('id', id);

  if (error) {
    alert('Error deleting property: ' + error.message);
  } else {
    loadDashboardData();
  }
};

// Open Edit Modal
window.openEditModal = function(id, name, type, val, desc) {
  document.getElementById('edit-prop-id').value = id;
  document.getElementById('edit-prop-name').value = name;
  document.getElementById('edit-prop-type').value = type;
  document.getElementById('edit-prop-val').value = val;
  document.getElementById('edit-prop-desc').value = desc;
  document.getElementById('edit-modal').style.display = 'flex';
};

// Close Edit Modal
window.closeEditModal = () => {
  document.getElementById('edit-modal').style.display = 'none';
};

// Update Property
window.updateProperty = async function() {
  const id = document.getElementById('edit-prop-id').value;
  const name = document.getElementById('edit-prop-name').value.trim();
  const type = document.getElementById('edit-prop-type').value.trim();
  const val = parseFloat(document.getElementById('edit-prop-val').value);
  const desc = document.getElementById('edit-prop-desc').value.trim();

  if (!name || isNaN(val)) {
    alert('Please enter a valid property name and valuation.');
    return;
  }

  const { error } = await supabase
    .from('Property')
    .update({ 
      Name_Property: name, 
      Property_Type: type, 
      Valuation: val, 
      Description: desc 
    })
    .eq('id', id);

  if (error) {
    alert('Update failed: ' + error.message);
  } else {
    closeEditModal();
    loadDashboardData();
  }
};

// UI Helpers
window.openModal = () => document.getElementById('property-modal').style.display = 'flex';
window.closeModal = () => document.getElementById('property-modal').style.display = 'none';

// Logout Handler
window.logout = () => {
  localStorage.clear();
  window.location.href = 'login.html';
};