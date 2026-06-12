export async function fetchWithRetry(url, options = {}, retries = 3, delayMs = 800) {
  let lastError;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, options);

      if (res.status >= 500 && attempt < retries - 1) {
        await sleep(delayMs * (attempt + 1));
        continue;
      }

      return res;
    } catch (err) {
      lastError = err;
      if (attempt < retries - 1) {
        await sleep(delayMs * (attempt + 1));
      }
    }
  }

  throw lastError || new Error('Request failed after retries');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
