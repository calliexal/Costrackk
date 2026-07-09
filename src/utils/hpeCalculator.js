function calculateStatistics(numbers) {
  if (!numbers || numbers.length === 0) {
    return { min: 0, max: 0, mean: 0, median: 0 };
  }
  
  const sorted = [...numbers].sort((a, b) => a - b);
  
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const mean = sum / sorted.length;
  
  let median;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    median = (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    median = sorted[mid];
  }
  
  return {
    min: Math.round(min),
    max: Math.round(max),
    mean: Math.round(mean),
    median: Math.round(median)
  };
}

module.exports = { calculateStatistics };
