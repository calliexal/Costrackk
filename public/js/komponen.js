let komponenModal;

async function loadKomponen() {
  const tbody = document.getElementById('komponenTableBody');
  const tableContainer = tbody.closest('.table-responsive');
  
  try {
    tableContainer.classList.add('table-loading');
    const data = await fetchAPI('/api/komponen');
    tableContainer.classList.remove('table-loading');
    
    if (data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="table-empty">
            <i class="bi bi-inbox"></i>
            <div>Belum ada data komponen</div>
          </td>
        </tr>
      `;
      return;
    }
    
    tbody.innerHTML = data.map((item, index) => `
      <tr>
        <td class="text-center">${index + 1}</td>
        <td><span class="fw-bold">${item.namaKomponen}</span></td>
        <td class="text-center"><span class="badge badge-secondary">${item.satuan}</span></td>
        <td>${item.deskripsi || '-'}</td>
        <td class="table-actions">
          <button class="btn btn-sm btn-warning" onclick="editKomponen('${item._id}')" title="Edit"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-danger" onclick="deleteKomponen('${item._id}', '${item.namaKomponen.replace(/'/g, "\\'")}')" title="Hapus"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    tableContainer.classList.remove('table-loading');
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="table-empty">
          <i class="bi bi-exclamation-triangle"></i>
          <div>Gagal memuat data komponen</div>
        </td>
      </tr>
    `;
    showAlert('Gagal memuat data komponen', 'danger');
  }
}

function showAddModal() {
  document.getElementById('modalTitle').textContent = 'Tambah Komponen';
  document.getElementById('komponenForm').reset();
  document.getElementById('komponenId').value = '';
  komponenModal.show();
}

async function editKomponen(id) {
  try {
    const data = await fetchAPI(`${'/api/komponen'}/${id}`);
    document.getElementById('modalTitle').textContent = 'Edit Komponen';
    document.getElementById('komponenId').value = data._id;
    document.getElementById('namaKomponen').value = data.namaKomponen;
    document.getElementById('satuan').value = data.satuan;
    document.getElementById('deskripsi').value = data.deskripsi || '';
    komponenModal.show();
  } catch (error) {
    showAlert('Gagal memuat data komponen', 'danger');
  }
}

async function saveKomponen() {
  const id = document.getElementById('komponenId').value;
  const data = {
    namaKomponen: document.getElementById('namaKomponen').value,
    satuan: document.getElementById('satuan').value,
    deskripsi: document.getElementById('deskripsi').value
  };
  
  try {
    if (id) {
      await fetchAPI(`${'/api/komponen'}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      showAlert('Komponen berhasil diupdate', 'success');
    } else {
      await fetchAPI('/api/komponen', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      showAlert('Komponen berhasil ditambahkan', 'success');
    }
    
    komponenModal.hide();
    loadKomponen();
  } catch (error) {
    showAlert(error.message, 'danger');
  }
}

async function deleteKomponen(id, nama) {
  if (!confirm(`Yakin ingin menghapus komponen "${nama}"?`)) return;
  
  try {
    await fetchAPI(`${'/api/komponen'}/${id}`, { method: 'DELETE' });
    showAlert('Komponen berhasil dihapus', 'success');
    loadKomponen();
  } catch (error) {
    showAlert(error.message, 'danger');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  komponenModal = new bootstrap.Modal(document.getElementById('komponenModal'));
  loadKomponen();
});
