const dashboardErrorBoundary = new ErrorBoundary('dashboardContent');

async function loadDashboardData() {
  try {
    console.log('Loading dashboard data...');
    
    const stats = await retryAPI(() => fetchAPI('/api/stats/dashboard'), 3, 1000);
    console.log('Dashboard stats:', stats);
    
    // Safely update DOM elements
    safeSetTextContent(document.getElementById('totalProduk'), stats.counts?.produk || 0);
    safeSetTextContent(document.getElementById('totalKomponen'), stats.counts?.komponen || 0);
    safeSetTextContent(document.getElementById('totalRiwayat'), stats.counts?.riwayat || 0);
    
    const kursInfo = stats.kursToday?.tanggal 
      ? `<small>${formatDate(stats.kursToday.tanggal)}</small>`
      : '';
    
    const kursElement = document.getElementById('kursToday');
    if (kursElement && stats.kursToday) {
      kursElement.innerHTML = `
        <strong>${formatCurrency(stats.kursToday.usdToIdr || 15500)}</strong><br>
        ${kursInfo}
        <span class="badge bg-${stats.kursToday.sumber === 'JISDOR' ? 'success' : 'warning'} mt-1">
          ${sanitizeHTML(stats.kursToday.sumber || 'MANUAL')}
        </span>
      `;
    }
    
    // Hide loading indicators
    const loadingElements = document.querySelectorAll('.loading-placeholder');
    loadingElements.forEach(el => el.style.display = 'none');
    
  } catch (error) {
    console.error('Error loading dashboard:', error);
    dashboardErrorBoundary.showError(error, 'Dashboard Data Loading');
    handleAPIError(error, 'loadDashboardData');
  }
}

// Refresh dashboard data
function refreshDashboard() {
  showLoading(true);
  loadDashboardData().finally(() => {
    showLoading(false);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();
  
  // Auto refresh every 5 minutes
  setInterval(loadDashboardData, 5 * 60 * 1000);
});
