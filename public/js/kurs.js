let kursModal;
let uploadModal;
const kursErrorBoundary = new ErrorBoundary('kursTableBody');

async function loadKurs() {
  const tbody = document.getElementById('kursTableBody');
  try {
    console.log('Loading kurs data...');
    showLoading(true);
    
    const response = await retryAPI(() => fetchAPI('/api/kurs'), 3, 1000);
    console.log('Kurs response:', response);
    
    // Handle both array response and paginated response
    const data = Array.isArray(response) ? response : (response.data || []);
    
    if (!data || data.length === 0) {
      console.warn('No kurs data found');
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">Belum ada data kurs. Klik "Refresh JISDOR" untuk mengambil data terbaru.</td></tr>';
      return;
    }
    
    // Sort by date descending (newest first)
    data.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    
    tbody.innerHTML = data.map((item, index) => {
      const tanggal = new Date(item.tanggal);
      const tanggalStr = tanggal.toLocaleDateString('id-ID', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      });
      
      const badgeClass = getBadgeClass(item.sumber);
      const badgeIcon = getBadgeIcon(item.sumber);
      
      return `
        <tr>
          <td class="text-center">${index + 1}</td>
          <td><span class="fw-bold">${tanggalStr}</span></td>
          <td class="text-end"><span class="fw-bold currency-display">${formatCurrency(item.usdToIdr)}</span></td>
          <td class="text-center">
            <span class="badge bg-${badgeClass}">
              <i class="bi bi-${badgeIcon} me-1"></i>${sanitizeHTML(item.sumber)}
            </span>
          </td>
          <td class="text-center">
            <small class="text-muted">${formatDateTime(item.updatedAt || item.createdAt)}</small>
          </td>
          <td class="table-actions">
            <button class="btn btn-sm btn-info" onclick="refreshSingleKurs('${item.tanggal.split('T')[0]}')" title="Refresh JISDOR">
              <i class="bi bi-arrow-clockwise"></i>
            </button>
            <button class="btn btn-sm btn-warning" onclick="editKurs('${item._id}')" title="Edit">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteKurs('${item._id}')" title="Hapus">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading kurs:', error);
    kursErrorBoundary.showError(error, 'Kurs Data Loading');
    handleAPIError(error, 'loadKurs');
  } finally {
    showLoading(false);
  }
}

function getBadgeClass(sumber) {
  switch (sumber) {
    case 'JISDOR_API':
    case 'JISDOR':
      return 'success';
    case 'JISDOR_XML':
      return 'info';
    case 'MANUAL':
      return 'primary';
    case 'FALLBACK':
      return 'warning';
    default:
      return 'secondary';
  }
}

function getBadgeIcon(sumber) {
  switch (sumber) {
    case 'JISDOR_API':
    case 'JISDOR':
      return 'bank';
    case 'JISDOR_XML':
      return 'bank2';
    case 'MANUAL':
      return 'person-fill';
    case 'FALLBACK':
      return 'exclamation-triangle';
    default:
      return 'question-circle';
  }
}

function formatDateTime(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function refreshJisdorToday() {
  try {
    showLoading(true);
    console.log('🔄 Refreshing JISDOR for today...');
    
    const result = await fetchAPI('/api/kurs/refresh', {
      method: 'POST',
      body: JSON.stringify({})
    });
    
    showAlert(`✅ ${result.message} - Rate: ${formatCurrency(result.data.usdToIdr)} (${result.source})`, 'success');
    loadKurs();
  } catch (error) {
    console.error('Error refreshing JISDOR:', error);
    handleAPIError(error, 'refreshJisdorToday');
  } finally {
    showLoading(false);
  }
}

async function refreshSingleKurs(date) {
  try {
    showLoading(true);
    console.log(`🔄 Refreshing JISDOR for ${date}...`);
    
    const result = await fetchAPI('/api/kurs/refresh', {
      method: 'POST',
      body: JSON.stringify({ date })
    });
    
    showAlert(`✅ ${result.message} - Rate: ${formatCurrency(result.data.usdToIdr)} (${result.source})`, 'success');
    loadKurs();
  } catch (error) {
    console.error(`Error refreshing JISDOR for ${date}:`, error);
    handleAPIError(error, 'refreshSingleKurs');
  } finally {
    showLoading(false);
  }
}

async function getLatestJisdor() {
  try {
    showLoading(true);
    console.log('🔄 Getting latest available JISDOR...');
    
    const result = await fetchAPI('/api/kurs/latest');
    
    const message = result.isLatest 
      ? `Latest JISDOR (${result.daysOld} hari yang lalu): ${formatCurrency(result.usdToIdr)} (${result.sumber})`
      : `JISDOR hari ini: ${formatCurrency(result.usdToIdr)} (${result.sumber})`;
    
    showAlert(`✅ ${message}`, 'info');
    loadKurs();
  } catch (error) {
    console.error('Error getting latest JISDOR:', error);
    handleAPIError(error, 'getLatestJisdor');
  } finally {
    showLoading(false);
  }
}

function showAddModal() {
  document.getElementById('modalTitle').textContent = 'Tambah Kurs Manual';
  document.getElementById('kursForm').reset();
  document.getElementById('kursId').value = '';
  document.getElementById('tanggal').valueAsDate = new Date();
  kursModal.show();
}

async function editKurs(id) {
  try {
    showLoading(true);
    const data = await fetchAPI(`/api/kurs/${id}`);
    document.getElementById('modalTitle').textContent = 'Edit Kurs';
    document.getElementById('kursId').value = data._id;
    document.getElementById('tanggal').value = data.tanggal.split('T')[0];
    document.getElementById('usdToIdr').value = data.usdToIdr;
    kursModal.show();
  } catch (error) {
    handleAPIError(error, 'editKurs');
  } finally {
    showLoading(false);
  }
}

async function saveKurs() {
  const id = document.getElementById('kursId').value;
  const tanggal = document.getElementById('tanggal').value;
  const usdToIdr = parseFloat(document.getElementById('usdToIdr').value);
  
  // Validation rules
  const validationRules = {
    tanggal: { required: true, label: 'Tanggal' },
    usdToIdr: { required: true, type: 'number', min: 10000, max: 25000, label: 'Kurs USD to IDR' }
  };
  
  const data = { tanggal, usdToIdr };
  const errors = validateInput(data, validationRules);
  
  if (errors.length > 0) {
    showAlert(errors.join('<br>'), 'warning');
    return;
  }
  
  data.sumber = 'MANUAL';
  
  try {
    showLoading(true);
    
    if (id) {
      await fetchAPI(`/api/kurs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      showAlert('Kurs berhasil diupdate', 'success');
    } else {
      await fetchAPI('/api/kurs', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      showAlert('Kurs berhasil ditambahkan', 'success');
    }
    
    kursModal.hide();
    loadKurs();
  } catch (error) {
    handleAPIError(error, 'saveKurs');
  } finally {
    showLoading(false);
  }
}

async function deleteKurs(id) {
  if (!confirm('Yakin ingin menghapus data kurs ini?')) return;
  
  try {
    showLoading(true);
    await fetchAPI(`/api/kurs/${id}`, { method: 'DELETE' });
    showAlert('Kurs berhasil dihapus', 'success');
    loadKurs();
  } catch (error) {
    handleAPIError(error, 'deleteKurs');
  } finally {
    showLoading(false);
  }
}

async function uploadCSV() {
  const csvText = document.getElementById('csvData').value.trim();
  if (!csvText) {
    showAlert('Masukkan data CSV terlebih dahulu', 'warning');
    return;
  }
  
  try {
    showLoading(true);
    const lines = csvText.split('\n').filter(line => line.trim());
    const data = [];
    const errors = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip header if exists
      if (i === 0 && (line.toLowerCase().includes('tanggal') || line.toLowerCase().includes('date'))) {
        continue;
      }
      
      const parts = line.split(',').map(s => s.trim().replace(/"/g, ''));
      if (parts.length >= 2) {
        const tanggal = parts[0];
        const usdToIdr = parts[1];
        
        // Validate date format (YYYY-MM-DD)
        if (tanggal && usdToIdr && /^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
          const rate = parseFloat(usdToIdr);
          if (!isNaN(rate) && rate > 0) {
            data.push({ tanggal, usdToIdr: rate });
          } else {
            errors.push(`Baris ${i + 1}: Kurs tidak valid (${usdToIdr})`);
          }
        } else {
          errors.push(`Baris ${i + 1}: Format tidak valid (${line})`);
        }
      }
    }
    
    if (data.length === 0) {
      showAlert('Format CSV tidak valid. Gunakan format: tanggal,usdToIdr (contoh: 2024-01-15,15500)', 'danger');
      return;
    }
    
    const result = await fetchAPI('/api/kurs/upload-csv', {
      method: 'POST',
      body: JSON.stringify({ data })
    });
    
    let message = result.message || 'Data berhasil diupload';
    if (result.errors && result.errors.length > 0) {
      message += `<br><small>Errors: ${result.errors.slice(0, 3).join(', ')}${result.errors.length > 3 ? '...' : ''}</small>`;
    }
    
    showAlert(message, result.errors && result.errors.length > 0 ? 'warning' : 'success');
    document.getElementById('csvData').value = '';
    document.getElementById('csvFile').value = '';
    uploadModal.hide();
    loadKurs();
  } catch (error) {
    handleAPIError(error, 'uploadCSV');
  } finally {
    showLoading(false);
  }
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // Validate file type
  if (!file.name.endsWith('.csv')) {
    showAlert('File harus berformat CSV', 'danger');
    event.target.value = '';
    return;
  }
  
  // Validate file size (max 1MB)
  if (file.size > 1024 * 1024) {
    showAlert('File terlalu besar. Maksimal 1MB', 'danger');
    event.target.value = '';
    return;
  }
  
  const reader = new FileReader();
  
  reader.onload = function(e) {
    const csvText = e.target.result;
    document.getElementById('csvData').value = csvText;
    showAlert(`File "${sanitizeHTML(file.name)}" berhasil dimuat`, 'info');
  };
  
  reader.onerror = function() {
    showAlert('Gagal membaca file', 'danger');
    event.target.value = '';
  };
  
  reader.readAsText(file);
}

function showUploadModal() {
  document.getElementById('csvData').value = '';
  document.getElementById('csvFile').value = '';
  uploadModal.show();
}

function downloadSampleCSV() {
  const sampleData = `tanggal,usdToIdr
2024-01-15,15500
2024-01-16,15520
2024-01-17,15480`;
  
  const blob = new Blob([sampleData], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', 'sample_kurs.csv');
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showAlert('Sample CSV berhasil didownload', 'info');
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    kursModal = new bootstrap.Modal(document.getElementById('kursModal'));
    uploadModal = new bootstrap.Modal(document.getElementById('uploadModal'));
    
    // Load initial data
    await loadKurs();
    
    // Auto-refresh every 30 minutes
    setInterval(loadKurs, 30 * 60 * 1000);
  } catch (error) {
    console.error('Error initializing kurs page:', error);
    handleAPIError(error, 'kurs initialization');
  }
});