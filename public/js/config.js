// ========================================
// PRODUCTION API MODE - Connected to Vercel Backend
// ========================================

// API Base URL - Auto detect environment
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000'  // Development
  : window.location.origin;   // Production (same domain)

// Real API Helper
async function fetchAPI(url, options = {}) {
  try {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    
    const config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };
    
    // Add body for POST/PUT requests
    if (options.body && typeof options.body === 'string') {
      config.body = options.body;
    } else if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }
    
    console.log(`API Call: ${config.method} ${fullUrl}`);
    
    const response = await fetch(fullUrl, config);
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Use default error message if JSON parsing fails
      }
      throw new Error(errorMessage);
    }
    
    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log(`API Response:`, data);
      return data;
    } else {
      const text = await response.text();
      return text;
    }
    
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Alert Helper
function showAlert(message, type = 'info') {
  // Remove existing alerts
  const existingAlerts = document.querySelectorAll('.alert');
  existingAlerts.forEach(alert => alert.remove());
  
  // Icon mapping
  const icons = {
    success: '✓',
    danger: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.innerHTML = `
    <div class="alert-content">
      <span class="alert-icon">${icons[type] || 'ℹ'}</span>
      <span class="alert-message">${message}</span>
    </div>
    <button class="alert-ok-btn">OK</button>
  `;
  
  document.body.appendChild(alertDiv);
  
  // Function to close alert
  const closeAlert = () => {
    if (alertDiv.parentElement) {
      alertDiv.style.animation = 'alertSlideUp 0.3s ease-out';
      setTimeout(() => alertDiv.remove(), 300);
    }
  };
  
  // Click anywhere on alert to close
  alertDiv.addEventListener('click', closeAlert);
  
  // Auto remove after 3 seconds
  setTimeout(closeAlert, 3000);
}

// Format Currency
function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value);
}

// Format Date
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Loading Helper
function showLoading(show = true) {
  let loadingOverlay = document.getElementById('loadingOverlay');
  
  if (show) {
    if (!loadingOverlay) {
      loadingOverlay = document.createElement('div');
      loadingOverlay.id = 'loadingOverlay';
      loadingOverlay.className = 'loading-overlay';
      loadingOverlay.innerHTML = '<div class="spinner-modern"></div>';
      document.body.appendChild(loadingOverlay);
    }
    loadingOverlay.style.display = 'flex';
  } else {
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
  }
}

// Error Handler for API calls
function handleAPIError(error, context = '') {
  console.error(`API Error in ${context}:`, error);
  
  let message = 'Terjadi kesalahan pada server';
  
  if (error.message.includes('Failed to fetch')) {
    message = 'Tidak dapat terhubung ke server. Pastikan server berjalan.';
  } else if (error.message.includes('404')) {
    message = 'Data tidak ditemukan';
  } else if (error.message.includes('400')) {
    message = 'Data yang dikirim tidak valid';
  } else if (error.message.includes('500')) {
    message = 'Terjadi kesalahan pada server';
  } else if (error.message) {
    message = error.message;
  }
  
  showAlert(message, 'danger');
  return message;
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  console.log('CostTrack initialized with real API connection');
  
  // Test API connection
  fetchAPI('/api/stats/dashboard')
    .then(data => {
      console.log('✓ API Connection successful:', data);
    })
    .catch(error => {
      console.warn('⚠ API Connection failed:', error.message);
      showAlert('Peringatan: Tidak dapat terhubung ke server. Beberapa fitur mungkin tidak berfungsi.', 'warning');
    });
});
// Input Sanitization Helper
function sanitizeHTML(str) {
  if (typeof str !== 'string') return str;
  
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Safe DOM insertion
function safeSetTextContent(element, text) {
  if (element) {
    element.textContent = text || '';
  }
}

function safeSetInnerHTML(element, html) {
  if (element && typeof html === 'string') {
    element.innerHTML = sanitizeHTML(html);
  }
}

// Validate input data
function validateInput(data, rules) {
  const errors = [];
  
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];
    
    if (rule.required && (!value || value.toString().trim() === '')) {
      errors.push(`${rule.label || field} harus diisi`);
      continue;
    }
    
    if (value && rule.type === 'number') {
      const num = parseFloat(value);
      if (isNaN(num)) {
        errors.push(`${rule.label || field} harus berupa angka`);
      } else if (rule.min !== undefined && num < rule.min) {
        errors.push(`${rule.label || field} minimal ${rule.min}`);
      } else if (rule.max !== undefined && num > rule.max) {
        errors.push(`${rule.label || field} maksimal ${rule.max}`);
      }
    }
    
    if (value && rule.type === 'string' && rule.maxLength) {
      if (value.length > rule.maxLength) {
        errors.push(`${rule.label || field} maksimal ${rule.maxLength} karakter`);
      }
    }
    
    if (value && rule.pattern && !rule.pattern.test(value)) {
      errors.push(`${rule.label || field} format tidak valid`);
    }
  }
  
  return errors;
}
// Error Boundary for UI
class ErrorBoundary {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.originalContent = this.container ? this.container.innerHTML : '';
  }
  
  showError(error, context = '') {
    if (!this.container) return;
    
    console.error(`Error in ${context}:`, error);
    
    const errorHTML = `
      <div class="alert alert-danger" role="alert">
        <div class="d-flex align-items-center mb-2">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>Terjadi Kesalahan</strong>
        </div>
        <p class="mb-2">${error.message || 'Terjadi kesalahan yang tidak diketahui'}</p>
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-outline-danger" onclick="location.reload()">
            <i class="bi bi-arrow-clockwise me-1"></i>Refresh Halaman
          </button>
          <button class="btn btn-sm btn-outline-secondary" onclick="this.parentElement.parentElement.parentElement.style.display='none'">
            <i class="bi bi-x-lg me-1"></i>Tutup
          </button>
        </div>
        ${context ? `<small class="text-muted mt-2 d-block">Context: ${context}</small>` : ''}
      </div>
    `;
    
    this.container.innerHTML = errorHTML;
  }
  
  restore() {
    if (this.container) {
      this.container.innerHTML = this.originalContent;
    }
  }
}

// Global error handler for unhandled promises
window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled promise rejection:', event.reason);
  showAlert('Terjadi kesalahan sistem: ' + (event.reason.message || 'Unknown error'), 'danger');
});

// Global error handler for JavaScript errors
window.addEventListener('error', function(event) {
  console.error('JavaScript error:', event.error);
  showAlert('Terjadi kesalahan JavaScript: ' + (event.error.message || 'Unknown error'), 'danger');
});

// Retry mechanism for failed API calls
async function retryAPI(apiCall, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiCall();
    } catch (error) {
      console.warn(`API call failed (attempt ${i + 1}/${maxRetries}):`, error.message);
      
      if (i === maxRetries - 1) {
        throw error; // Last attempt failed
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
}