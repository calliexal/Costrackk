let produkModal;
let komponenList = [];
let bomCounter = 0;

async function loadProduk() {
  const tbody = document.getElementById('produkTableBody');
  const tableContainer = tbody.closest('.table-responsive');
  
  try {
    tableContainer.classList.add('table-loading');
    const data = await fetchAPI('/api/produk');
    tableContainer.classList.remove('table-loading');
    
    if (data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="table-empty">
            <i class="bi bi-inbox"></i>
            <div>Belum ada data produk</div>
          </td>
        </tr>
      `;
      return;
    }
    
    tbody.innerHTML = data.map((item, index) => `
      <tr>
        <td class="text-center">${index + 1}</td>
        <td><span class="fw-bold">${item.namaProduk}</span></td>
        <td>${item.deskripsi || '-'}</td>
        <td class="text-center"><span class="badge badge-info">${item.bom.length} komponen</span></td>
        <td class="table-actions">
          <button class="btn btn-sm btn-info" onclick="viewBOM('${item._id}')" title="Lihat BOM"><i class="bi bi-eye"></i></button>
          <button class="btn btn-sm btn-warning" onclick="editProduk('${item._id}')" title="Edit"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-danger" onclick="deleteProduk('${item._id}', '${item.namaProduk.replace(/'/g, "\\'")}')" title="Hapus"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    tableContainer.classList.remove('table-loading');
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="table-empty">
          <i class="bi bi-exclamation-triangle"></i>
          <div>Gagal memuat data produk</div>
        </td>
      </tr>
    `;
    showAlert('Gagal memuat data produk', 'danger');
  }
}

async function loadKomponenList() {
  try {
    komponenList = await fetchAPI('/api/komponen');
  } catch (error) {
    console.error('Error loading komponen:', error);
  }
}

function showAddModal() {
  document.getElementById('modalTitle').textContent = 'Tambah Produk';
  document.getElementById('produkForm').reset();
  document.getElementById('produkId').value = '';
  document.getElementById('bomContainer').innerHTML = '';
  bomCounter = 0;
  produkModal.show();
}

function addBOMItem(data = null) {
  const id = bomCounter++;
  const container = document.getElementById('bomContainer');
  
  const div = document.createElement('div');
  div.className = 'bom-item';
  div.id = `bom-${id}`;
  div.innerHTML = `
    <div class="row">
      <div class="col-md-5">
        <label class="form-label">Komponen</label>
        <select class="form-select bom-komponen" data-id="${id}" required>
          <option value="">Pilih Komponen</option>
          ${komponenList.map(k => `
            <option value="${k._id}" data-nama="${k.namaKomponen}" data-satuan="${k.satuan}" 
              ${data && data.komponenId === k._id ? 'selected' : ''}>
              ${k.namaKomponen} (${k.satuan})
            </option>
          `).join('')}
        </select>
      </div>
      <div class="col-md-3">
        <label class="form-label">Quantity</label>
        <input type="number" class="form-control bom-quantity" min="0" step="0.01" 
          value="${data ? data.quantity : ''}" required>
      </div>
      <div class="col-md-3">
        <label class="form-label">Satuan</label>
        <input type="text" class="form-control bom-satuan" readonly 
          value="${data ? data.satuan : ''}">
      </div>
      <div class="col-md-1">
        <label class="form-label">&nbsp;</label>
        <button type="button" class="btn btn-danger btn-sm w-100" onclick="removeBOMItem(${id})">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </div>
  `;
  
  container.appendChild(div);
  
  const select = div.querySelector('.bom-komponen');
  select.addEventListener('change', function() {
    const option = this.options[this.selectedIndex];
    const satuan = option.getAttribute('data-satuan');
    div.querySelector('.bom-satuan').value = satuan || '';
  });
}

function removeBOMItem(id) {
  document.getElementById(`bom-${id}`).remove();
}

async function editProduk(id) {
  try {
    const data = await fetchAPI(`/api/produk/${id}`);
    document.getElementById('modalTitle').textContent = 'Edit Produk';
    document.getElementById('produkId').value = data._id;
    document.getElementById('namaProduk').value = data.namaProduk;
    document.getElementById('deskripsi').value = data.deskripsi || '';
    
    document.getElementById('bomContainer').innerHTML = '';
    bomCounter = 0;
    
    data.bom.forEach(item => {
      addBOMItem(item);
    });
    
    produkModal.show();
  } catch (error) {
    showAlert('Gagal memuat data produk', 'danger');
  }
}

async function saveProduk() {
  const id = document.getElementById('produkId').value;
  
  const bomItems = [];
  document.querySelectorAll('.bom-item').forEach(item => {
    const select = item.querySelector('.bom-komponen');
    const option = select.options[select.selectedIndex];
    const komponenId = select.value;
    
    if (komponenId) {
      bomItems.push({
        komponenId: komponenId,
        namaKomponen: option.getAttribute('data-nama'),
        quantity: parseFloat(item.querySelector('.bom-quantity').value),
        satuan: item.querySelector('.bom-satuan').value
      });
    }
  });
  
  const data = {
    namaProduk: document.getElementById('namaProduk').value,
    deskripsi: document.getElementById('deskripsi').value,
    bom: bomItems
  };
  
  try {
    if (id) {
      await fetchAPI(`/api/produk/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      showAlert('Produk berhasil diupdate', 'success');
    } else {
      await fetchAPI('/api/produk', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      showAlert('Produk berhasil ditambahkan', 'success');
    }
    
    produkModal.hide();
    loadProduk();
  } catch (error) {
    showAlert(error.message, 'danger');
  }
}

async function deleteProduk(id, nama) {
  if (!confirm(`Yakin ingin menghapus produk "${nama}"?`)) return;
  
  try {
    await fetchAPI(`${'/api/produk'}/${id}`, { method: 'DELETE' });
    showAlert('Produk berhasil dihapus', 'success');
    loadProduk();
  } catch (error) {
    showAlert(error.message, 'danger');
  }
}

async function viewBOM(id) {
  try {
    const data = await fetchAPI(`${'/api/produk'}/${id}`);
    let bomHTML = `<h5>${data.namaProduk}</h5><ul>`;
    data.bom.forEach(item => {
      bomHTML += `<li>${item.namaKomponen}: ${item.quantity} ${item.satuan}</li>`;
    });
    bomHTML += '</ul>';
    
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-info alert-dismissible fade show';
    alertDiv.innerHTML = `
      ${bomHTML}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => alertDiv.remove(), 5000);
  } catch (error) {
    showAlert('Gagal memuat BOM', 'danger');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  produkModal = new bootstrap.Modal(document.getElementById('produkModal'));
  await loadKomponenList();
  loadProduk();
});
