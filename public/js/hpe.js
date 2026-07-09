let currentHPEData = null;
let currentCurrency = 'IDR';
const hpeErrorBoundary = new ErrorBoundary('hpeResult');

async function loadProdukList() {
  try {
    const produk = await retryAPI(() => fetchAPI('/api/produk'), 3, 1000);
    const select = document.getElementById('produkSelect');
    if (select) {
      select.innerHTML = '<option value="">Pilih Produk...</option>' +
        produk.map(p => `<option value="${sanitizeHTML(p._id)}">${sanitizeHTML(p.namaProduk)}</option>`).join('');
    }
  } catch (error) {
    handleAPIError(error, 'loadProdukList');
  }
}

async function calculateHPE() {
  const produkId = document.getElementById('produkSelect').value;
  if (!produkId) {
    showAlert('Pilih produk terlebih dahulu', 'warning');
    return;
  }
  
  currentCurrency = document.getElementById('currencySelect').value;
  
  document.getElementById('hpeResult').style.display = 'none';
  document.getElementById('loadingHPE').style.display = 'block';
  
  try {
    const data = await retryAPI(() => 
      fetchAPI(`/api/hpe/${produkId}?currency=${currentCurrency}`), 3, 2000
    );
    currentHPEData = data;
    displayHPEResult(data);
  } catch (error) {
    console.error('Error calculating HPE:', error);
    hpeErrorBoundary.showError(error, 'HPE Calculation');
    handleAPIError(error, 'calculateHPE');
    document.getElementById('loadingHPE').style.display = 'none';
  }
}

function displayHPEResult(data) {
  try {
    document.getElementById('loadingHPE').style.display = 'none';
    document.getElementById('hpeResult').style.display = 'block';
    
    safeSetTextContent(document.getElementById('produkName'), data.produk?.nama || 'N/A');
    safeSetTextContent(document.getElementById('produkDesc'), data.produk?.deskripsi || '');
    
    const formatPrice = (amount) => {
      if (data.currency === 'USD') {
        return '$' + (amount || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
      }
      return formatCurrency(amount || 0);
    };
    
    const currencyInfo = data.currency === 'USD' && data.kursReference
      ? `<div class="alert alert-info"><small>Kurs Referensi: ${formatCurrency(data.kursReference)}</small></div>`
      : '';
    
    const komponenDetailsElement = document.getElementById('komponenDetails');
    if (komponenDetailsElement) {
      komponenDetailsElement.innerHTML = currencyInfo;
    }
    
    const komponenHTML = (data.komponen || []).map(k => {
      if (!k.hpePerSatuan) {
        return `
          <div class="hpe-result">
            <h6>${sanitizeHTML(k.namaKomponen || 'N/A')}</h6>
            <p class="text-warning">${sanitizeHTML(k.message || 'Tidak ada data')}</p>
          </div>
        `;
      }
      
      const dataInfo = k.dataBreakdown 
        ? `<span class="badge bg-success">${k.dataBreakdown.idr || 0} IDR</span> <span class="badge bg-primary">${k.dataBreakdown.usd || 0} USD</span>`
        : '';
      
      return `
        <div class="hpe-result">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <h6 class="mb-0">${sanitizeHTML(k.namaKomponen || 'N/A')}</h6>
            <div>
              <span class="badge bg-secondary">${k.quantity || 0} ${sanitizeHTML(k.satuan || 'pcs')}</span>
              <span class="badge bg-info">${k.jumlahData || 0} data</span>
              ${dataInfo}
            </div>
          </div>
          
          <div class="row">
            <div class="col-md-6">
              <small class="text-muted">HPE Per Satuan (${data.currency}):</small>
              <ul class="list-unstyled">
                <li>Min: <strong>${formatPrice(k.hpePerSatuan.minimum)}</strong></li>
                <li>Max: <strong>${formatPrice(k.hpePerSatuan.maksimum)}</strong></li>
                <li>Median: <strong>${formatPrice(k.hpePerSatuan.median)}</strong></li>
                <li>Rata-rata: <strong>${formatPrice(k.hpePerSatuan.rataRata)}</strong></li>
              </ul>
            </div>
            <div class="col-md-6">
              <small class="text-muted">HPE Total (${k.quantity || 0} ${sanitizeHTML(k.satuan || 'pcs')}):</small>
              <ul class="list-unstyled">
                <li>Min: <strong>${formatPrice(k.hpeTotal.minimum)}</strong></li>
                <li>Max: <strong>${formatPrice(k.hpeTotal.maksimum)}</strong></li>
                <li>Median: <strong>${formatPrice(k.hpeTotal.median)}</strong></li>
                <li>Rata-rata: <strong>${formatPrice(k.hpeTotal.rataRata)}</strong></li>
              </ul>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    if (komponenDetailsElement) {
      komponenDetailsElement.innerHTML += komponenHTML;
    }
    
    // Update total HPE safely
    safeSetTextContent(document.getElementById('totalMin'), formatPrice(data.totalHPE?.minimum));
    safeSetTextContent(document.getElementById('totalMax'), formatPrice(data.totalHPE?.maksimum));
    safeSetTextContent(document.getElementById('totalMedian'), formatPrice(data.totalHPE?.median));
    safeSetTextContent(document.getElementById('totalMean'), formatPrice(data.totalHPE?.rataRata));
    
  } catch (error) {
    console.error('Error displaying HPE result:', error);
    hpeErrorBoundary.showError(error, 'HPE Result Display');
  }
}

function exportToCSV() {
  if (!currentHPEData) {
    showAlert('Tidak ada data untuk diekspor', 'warning');
    return;
  }
  
  try {
    const currency = currentHPEData.currency || 'IDR';
    let csv = `Produk,Komponen,Quantity,Satuan,Mata Uang,Data IDR,Data USD,HPE Min,HPE Max,HPE Median,HPE Rata-rata\n`;
    
    if (currency === 'USD' && currentHPEData.kursReference) {
      csv += `Kurs Referensi: ${currentHPEData.kursReference}\n\n`;
    }
    
    (currentHPEData.komponen || []).forEach(k => {
      if (k.hpeTotal) {
        const produkName = sanitizeHTML(currentHPEData.produk?.nama || 'N/A').replace(/"/g, '""');
        const komponenName = sanitizeHTML(k.namaKomponen || 'N/A').replace(/"/g, '""');
        const satuan = sanitizeHTML(k.satuan || 'pcs').replace(/"/g, '""');
        
        const dataBreakdown = k.dataBreakdown ? `${k.dataBreakdown.idr || 0},${k.dataBreakdown.usd || 0}` : '0,0';
        csv += `"${produkName}","${komponenName}",${k.quantity || 0},"${satuan}",${currency},${dataBreakdown},`;
        csv += `${k.hpeTotal.minimum || 0},${k.hpeTotal.maksimum || 0},${k.hpeTotal.median || 0},${k.hpeTotal.rataRata || 0}\n`;
      }
    });
    
    csv += `\nTotal HPE,,,,${currency},,,${currentHPEData.totalHPE?.minimum || 0},${currentHPEData.totalHPE?.maksimum || 0},`;
    csv += `${currentHPEData.totalHPE?.median || 0},${currentHPEData.totalHPE?.rataRata || 0}\n`;
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const produkName = sanitizeHTML(currentHPEData.produk?.nama || 'HPE').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `HPE_${produkName}_${currency}_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAlert('Data berhasil diekspor ke CSV', 'success');
  } catch (error) {
    console.error('Error exporting CSV:', error);
    handleAPIError(error, 'exportToCSV');
  }
}

document.addEventListener('DOMContentLoaded', loadProdukList);
