const axios = require('axios');

// JISDOR API Configuration
const JISDOR_CONFIG = {
  // Primary API - Bank Indonesia Official
  PRIMARY_URL: 'https://api-bi.go.id/api/jisdor',
  
  // Backup API - BI Web Service (XML)
  BACKUP_URL: 'https://www.bi.go.id/biwebservice/wskursbi.asmx/getSubKursJisdor2',
  
  // Fallback rate if all APIs fail
  FALLBACK_RATE: 15500,
  
  // Request timeout
  TIMEOUT: 10000,
  
  // Valid rate range
  MIN_RATE: 10000,
  MAX_RATE: 25000
};

/**
 * Fetch JISDOR rate from Bank Indonesia API
 * @param {Date} date - Target date
 * @returns {Object} { rate, source, date }
 */
async function fetchJisdorFromBI(date) {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  console.log(`🔄 Fetching JISDOR for ${formatDateForDisplay(targetDate)}`);
  
  // Try primary API first
  try {
    const primaryResult = await fetchFromPrimaryAPI(targetDate);
    if (primaryResult) {
      console.log(`✅ JISDOR Primary API success: ${primaryResult.rate}`);
      return primaryResult;
    }
  } catch (error) {
    console.warn(`⚠️ Primary API failed: ${error.message}`);
  }
  
  // Try backup API
  try {
    const backupResult = await fetchFromBackupAPI(targetDate);
    if (backupResult) {
      console.log(`✅ JISDOR Backup API success: ${backupResult.rate}`);
      return backupResult;
    }
  } catch (error) {
    console.warn(`⚠️ Backup API failed: ${error.message}`);
  }
  
  // Use fallback rate
  console.log(`⚠️ Using fallback rate: ${JISDOR_CONFIG.FALLBACK_RATE}`);
  return {
    rate: JISDOR_CONFIG.FALLBACK_RATE,
    source: 'FALLBACK',
    date: targetDate,
    error: 'All JISDOR APIs failed'
  };
}

/**
 * Fetch from primary JISDOR API (JSON)
 */
async function fetchFromPrimaryAPI(date) {
  const dateStr = formatDateForAPI(date);
  
  const response = await axios.get(JISDOR_CONFIG.PRIMARY_URL, {
    params: {
      date: dateStr,
      format: 'json'
    },
    timeout: JISDOR_CONFIG.TIMEOUT,
    headers: {
      'User-Agent': 'CostTrack/1.0',
      'Accept': 'application/json'
    }
  });
  
  if (response.data && response.data.data) {
    const data = Array.isArray(response.data.data) 
      ? response.data.data[0] 
      : response.data.data;
    
    if (data && data.kurs) {
      const rate = parseFloat(data.kurs);
      if (isValidRate(rate)) {
        return {
          rate: Math.round(rate),
          source: 'JISDOR_API',
          date: date,
          rawData: data
        };
      }
    }
  }
  
  throw new Error('Invalid response from primary API');
}

/**
 * Fetch from backup JISDOR API (XML)
 */
async function fetchFromBackupAPI(date) {
  const xml2js = require('xml2js');
  const dateStr = formatDateForBI(date);
  
  const response = await axios.get(JISDOR_CONFIG.BACKUP_URL, {
    params: { tgl: dateStr },
    timeout: JISDOR_CONFIG.TIMEOUT,
    headers: {
      'User-Agent': 'CostTrack/1.0',
      'Accept': 'application/xml'
    }
  });
  
  const parser = new xml2js.Parser({ 
    explicitArray: false,
    ignoreAttrs: false,
    trim: true
  });
  
  const result = await parser.parseStringPromise(response.data);
  
  // Parse XML response - Updated structure for BI API
  let rate = null;
  
  if (result?.DataSet?.['diffgr:diffgram']?.NewDataSet?.Table) {
    const table = result.DataSet['diffgr:diffgram'].NewDataSet.Table;
    
    // Check if this is USD data
    const currency = table.mts_subkursasing;
    if (currency && currency.trim() === 'USD') {
      // Try different rate fields
      const rateValue = table.jual_subkursasing || table.beli_subkursasing || table.nil_subkursasing;
      if (rateValue) {
        rate = parseFloat(String(rateValue).replace(/,/g, ''));
      }
    }
  }
  
  if (isValidRate(rate)) {
    return {
      rate: Math.round(rate),
      source: 'JISDOR_XML',
      date: date,
      rawData: result
    };
  }
  
  throw new Error('Invalid rate from backup API');
}

/**
 * Validate if rate is within acceptable range
 */
function isValidRate(rate) {
  return rate && 
         typeof rate === 'number' && 
         !isNaN(rate) && 
         rate >= JISDOR_CONFIG.MIN_RATE && 
         rate <= JISDOR_CONFIG.MAX_RATE;
}

/**
 * Format date for primary API (YYYY-MM-DD)
 */
function formatDateForAPI(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date for backup BI API (YYYY-MM-DD)
 */
function formatDateForBI(date) {
  return formatDateForAPI(date);
}

/**
 * Format date for display
 */
function formatDateForDisplay(date) {
  return new Date(date).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Get latest available JISDOR rate (for weekends/holidays)
 */
async function getLatestJisdorRate() {
  const today = new Date();
  const maxDaysBack = 7; // Look back maximum 7 days
  
  for (let i = 0; i < maxDaysBack; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    
    // Skip weekends
    if (checkDate.getDay() === 0 || checkDate.getDay() === 6) {
      continue;
    }
    
    try {
      const result = await fetchJisdorFromBI(checkDate);
      if (result.source !== 'FALLBACK') {
        return {
          ...result,
          isLatest: i > 0,
          daysOld: i
        };
      }
    } catch (error) {
      console.warn(`Failed to get JISDOR for ${formatDateForDisplay(checkDate)}`);
    }
  }
  
  // If all fails, return fallback
  return {
    rate: JISDOR_CONFIG.FALLBACK_RATE,
    source: 'FALLBACK',
    date: today,
    isLatest: false,
    daysOld: 0
  };
}

/**
 * Batch fetch JISDOR for multiple dates
 */
async function fetchJisdorBatch(dates) {
  const results = [];
  const delay = 1000; // 1 second delay between requests
  
  for (const date of dates) {
    try {
      const result = await fetchJisdorFromBI(date);
      results.push(result);
      
      // Add delay to avoid rate limiting
      if (dates.indexOf(date) < dates.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      console.error(`Failed to fetch JISDOR for ${formatDateForDisplay(date)}:`, error.message);
      results.push({
        rate: JISDOR_CONFIG.FALLBACK_RATE,
        source: 'FALLBACK',
        date: date,
        error: error.message
      });
    }
  }
  
  return results;
}

module.exports = {
  fetchJisdorFromBI,
  getLatestJisdorRate,
  fetchJisdorBatch,
  JISDOR_CONFIG
};