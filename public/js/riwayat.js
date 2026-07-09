let riwayatModal;
let komponenList = [];
const riwayatErrorBoundary = new ErrorBoundary('riwayatTableBody');

async function loadRiwayat() {
  const tbody = document.getElementById('riwayatTableBody');
  try {
    console.log('Loading riwayat...');
    showLoading(true);
    
    const data = await retryAPI(() => fetchAPI('/api/riwayat'), 3, 1000);
    console.log('Riwayat data:', data);
    
    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" class="text-center">Belum ada data riwayat pengadaan</td></tr>';
      return;
    }
    
    tbody.innerHTML = data.map((item, index) => {
      // Ensure all required fields exist and sanitize
      const hargaSatuan = item.hargaSatuan || item.harga || 0;
      const hargaIDR = item.hargaIDR || 0;
      const hargaUSD = item.hargaUSD || 0;
      const quantity = item.quantity || 0;
      const matauang = item.matauang || 'IDR';
      
      // Format harga satuan dengan simbol mata uang
      const displayPrice = matauang === 'USD' 
        ? `$${hargaSatuan.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
        : formatCurrency(hargaSatuan);
      
      // Format tanggal yang lebih ringkas
      const tanggal = new Date(item.tanggalPengadaan);
      const tanggalStr = tanggal.toLocaleDateString('id-ID', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
      
      // Format USD dengan simbol
      const usdDisplay = `$${hargaUSD.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      
      return `
        <tr>
          <td class="text-center">${index + 1}</td>
          <td>${tanggalStr}</td>
          <td><span class="fw-bold">${sanitizeHTML(item.namaKomponen || 'N/A')}</span></td>
          <td>${sanitizeHTML(item.supplier || "-")}</td>
          <td class="text-end">${quantity.toLocaleString('id-ID')}</td>
          <td class="text-end">${displayPrice} <span class="badge bg-${matauang === 'USD' ? 'success' : 'primary'}">${matauang}</span></td>
          <td class="text-end"><span class="fw-bold">${formatCurrency(hargaIDR)}</span></td>
          <td class="text-end">${usdDisplay}</td>
          <td class="text-center">${sanitizeHTML(item.noPO || '-')}</td>
          <td class="table-actions">
            <button class="btn btn-sm btn-warning" onclick="editRiwayat('${sanitizeHTML(item._id)}')" title="Edit"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-danger" onclick="deleteRiwayat('${sanitizeHTML(item._id)}')" title="Hapus"><i class="bi bi-trash"></i></button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading riwayat:', error);
    riwayatErrorBoundary.showError(error, 'Riwayat Data Loading');
    handleAPIError(error, 'loadRiwayat');
  } finally {
    showLoading(false);
  }
}

async function loadKomponenList() {
  try {
    komponenList = await retryAPI(() => fetchAPI('/api/komponen'), 3, 1000);
    const select = document.getElementById('komponenId');
    if (select) {
      select.innerHTML = '<option value="">Pilih Komponen</option>' +
        komponenList.map(k => `<option value="${sanitizeHTML(k._id)}" data-nama="${sanitizeHTML(k.namaKomponen)}">${sanitizeHTML(k.namaKomponen)}</option>`).join('');
    }
  } catch (error) {
    console.error('Error loading komponen:', error);
    handleAPIError(error, 'loadKomponenList');
  }
}

function showAddModal() {
  document.getElementById('modalTitle').textContent = 'Tambah Riwayat Pengadaan';
  document.getElementById('riwayatForm').reset();
  document.getElementById('riwayatId').value = '';
  document.getElementById('tanggalPengadaan').valueAsDate = new Date();
  document.getElementById('kursJisdor').value = 1;
  document.getElementById('matauang').value = 'IDR';
  toggleKurs();
  riwayatModal.show();
}

function toggleKurs() {
  const matauang = document.getElementById('matauang').value;
  const kursContainer = document.getElementById('kursContainer');
  const kursInput = document.getElementById('kursJisdor');
  
  if (matauang === 'USD') {
    kursContainer.style.display = 'block';
    kursInput.required = true;
    if (!kursInput.value || kursInput.value <= 0) {
      fetchKursToday();
    }
  } else {
    kursContainer.style.display = 'none';
    kursInput.required = false;
    kursInput.value = 1;
  }
}

async function fetchKursToday() {
  try {
    const tanggal = document.getElementById('tanggalPengadaan').value;
    if (!tanggal) {
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('tanggalPengadaan').value = today;
    }
    
    const dateToFetch = document.getElementById('tanggalPengadaan').value;
    const kurs = await fetchAPI(`/api/kurs/${dateToFetch}`);
    document.getElementById('kursJisdor').value = kurs.usdToIdr;
    showAlert(`Kurs ${formatDate(kurs.tanggal)}: ${formatCurrency(kurs.usdToIdr)} (${kurs.sumber})`, 'success');
  } catch (error) {
    console.error('Error fetching kurs:', error);
    document.getElementById('kursJisdor').value = 15500;
    showAlert('Menggunakan kurs fallback: Rp 15.500', 'warning');
  }
}

async function editRiwayat(id) {
  try {
    showLoading(true);
    const data = await fetchAPI(`/api/riwayat/${id}`);
    document.getElementById('modalTitle').textContent = 'Edit Riwayat Pengadaan';
    document.getElementById('riwayatId').value = data._id;
    document.getElementById('komponenId').value = data.komponenId;
    document.getElementById('supplier').value = data.supplier;
    document.getElementById('tanggalPengadaan').value = data.tanggalPengadaan.split('T')[0];
    document.getElementById('quantity').value = data.quantity;
    document.getElementById('hargaSatuan').value = data.hargaSatuan;
    document.getElementById('matauang').value = data.matauang;
    document.getElementById('kursJisdor').value = data.kursJisdor;
    document.getElementById('noPO').value = data.noPO || '';
    document.getElementById('catatan').value = data.catatan || '';
    toggleKurs();
    riwayatModal.show();
  } catch (error) {
    handleAPIError(error, 'editRiwayat');
  } finally {
    showLoading(false);
  }
}

async function saveRiwayat() {
  const id = document.getElementById('riwayatId').value;
  const komponenId = document.getElementById('komponenId').value;
  const matauang = document.getElementById('matauang').value;
  const kursValue = parseFloat(document.getElementById('kursJisdor').value);
  const supplier = document.getElementById('supplier').value.trim();
  const tanggalPengadaan = document.getElementById('tanggalPengadaan').value;
  const quantity = parseFloat(document.getElementById('quantity').value);
  const hargaSatuan = parseFloat(document.getElementById('hargaSatuan').value);
  
  // Validation rules
  const validationRules = {
    komponenId: { required: true, label: 'Komponen' },
    supplier: { required: true, type: 'string', maxLength: 100, label: 'Supplier' },
    tanggalPengadaan: { required: true, label: 'Tanggal Pengadaan' },
    quantity: { required: true, type: 'number', min: 0.01, label: 'Quantity' },
    hargaSatuan: { required: true, type: 'number', min: 0.01, label: 'Harga Satuan' }
  };
  
  if (matauang === 'USD') {
    validationRules.kursJisdor = { required: true, type: 'number', min: 1000, max: 50000, label: 'Kurs JISDOR' };
  }
  
  const data = {
    komponenId,
    supplier,
    tanggalPengadaan,
    quantity,
    hargaSatuan,
    matauang,
    kursJisdor: matauang === 'USD' ? kursValue : 1,
    noPO: document.getElementById('noPO').value.trim(),
    catatan: document.getElementById('catatan').value.trim()
  };
  
  // Validate input
  const errors = validateInput(data, validationRules);
  if (errors.length > 0) {
    showAlert(errors.join('<br>'), 'warning');
    return;
  }
  
  // Add namaKomponen from selected option
  const option = document.querySelector(`#komponenId option[value="${komponenId}"]`);
  if (option) {
    data.namaKomponen = option.getAttribute('data-nama');
  }
  
  console.log('Saving riwayat data:', data);
  
  try {
    showLoading(true);
    
    if (id) {
      await fetchAPI(`/api/riwayat/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      showAlert('Riwayat berhasil diupdate', 'success');
    } else {
      await fetchAPI('/api/riwayat', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      showAlert('Riwayat berhasil ditambahkan', 'success');
    }
    
    riwayatModal.hide();
    loadRiwayat();
  } catch (error) {
    console.error('Error saving riwayat:', error);
    handleAPIError(error, 'saveRiwayat');
  } finally {
    showLoading(false);
  }
}

async function deleteRiwayat(id) {
  if (!confirm('Yakin ingin menghapus riwayat ini?')) return;
  
  try {
    showLoading(true);
    await fetchAPI(`/api/riwayat/${id}`, { method: 'DELETE' });
    showAlert('Riwayat berhasil dihapus', 'success');
    loadRiwayat();
  } catch (error) {
    handleAPIError(error, 'deleteRiwayat');
  } finally {
    showLoading(false);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    riwayatModal = new bootstrap.Modal(document.getElementById('riwayatModal'));
    await loadKomponenList();
    loadRiwayat();
  } catch (error) {
    console.error('Error initializing riwayat page:', error);
    handleAPIError(error, 'riwayat initialization');
  }
});