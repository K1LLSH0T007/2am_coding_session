import { supabase } from './connection.js';

// Get current session from LocalStorage
const currentUser = JSON.parse(localStorage.getItem('currentUser'));

if (!currentUser) {
  window.location.href = 'login.html';
}

const isAdmin = currentUser.Role === 'admin';

document.addEventListener('DOMContentLoaded', () => {
  renderUserInfo();
  loadDashboardData();
});

function renderUserInfo() {
  const display = document.getElementById('user-display');
  const roleBadge = isAdmin ? '<span class="badge badge-admin">Admin</span>' : '<span class="badge badge-user">User</span>';
  display.innerHTML = `${currentUser.Usr_Name || currentUser.Email} ${roleBadge}`;
}

async function loadDashboardData() {
  const container = document.getElementById('table-container');

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

    // Non-admin users only see properties assigned to their user ID
    if (!isAdmin) {
      query = query.eq('user_id', currentUser.user_id);
    }

    const { data: properties, error } = await query;

    if (error) throw error;

    if (!properties || properties.length === 0) {
      container.innerHTML = '<p>No properties found.</p>';
      return;
    }

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
        <tbody>
    `;

    properties.forEach(prop => {
      const manager = prop.Users ? `${prop.Users.Usr_Name} ${prop.Users.Usr_Surname}` : 'Unassigned';
      
      html += `
        <tr>
          <td><strong>${prop.Name_Property}</strong></td>
          <td>${prop.Property_Type || 'Cell Tower'}</td>
          <td>R ${prop.Valuation ? prop.Valuation.toLocaleString() : '0'}</td>
          <td>${prop.Description || '-'}</td>
          <td>${manager}</td>
          <td>
            <button class="btn-primary" style="padding: 0.3rem 0.6rem; font-size: 0.85rem;" 
                onclick="openEditModal(${prop.id}, '${prop.Name_Property.replace(/'/g, "\\'")}', '${prop.Property_Type}', ${prop.Valuation || 0}, '${(prop.Description || '').replace(/'/g, "\\'")}')">
                Edit
            </button>
            <button class="btn-danger" onclick="deleteProperty(${prop.id})">Delete</button>
            </td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;

  } catch (err) {
    console.error('Error loading data:', err);
    container.innerHTML = `<p style="color:red">Failed to load data: ${err.message}</p>`;
  }
}

// Add Property
window.addProperty = async function() {
  const name = document.getElementById('prop-name').value;
  const type = document.getElementById('prop-type').value;
  const val = parseInt(document.getElementById('prop-val').value, 10);
  const desc = document.getElementById('prop-desc').value;

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
window.openEditModal = function(id, name, type, val, desc) {
  document.getElementById('edit-prop-id').value = id;
  document.getElementById('edit-prop-name').value = name;
  document.getElementById('edit-prop-type').value = type;
  document.getElementById('edit-prop-val').value = val;
  document.getElementById('edit-prop-desc').value = desc;
  document.getElementById('edit-modal').style.display = 'flex';
};

window.closeEditModal = () => {
  document.getElementById('edit-modal').style.display = 'none';
};

window.updateProperty = async function() {
  const id = document.getElementById('edit-prop-id').value;
  const name = document.getElementById('edit-prop-name').value;
  const type = document.getElementById('edit-prop-type').value;
  const val = parseFloat(document.getElementById('edit-prop-val').value);
  const desc = document.getElementById('edit-prop-desc').value;

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
window.logout = () => {
  localStorage.clear();
  window.location.href = 'login.html';
};