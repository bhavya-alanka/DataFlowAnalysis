/**
 * CFG Studio API Service
 * Manages communication with the FastAPI backend compiler service.
 */

const BASE_URL = 'http://127.0.0.1:8000';

async function request(endpoint, options = {}) {
  // First attempt via relative URL (Vite dev proxy)
  try {
    const res = await fetch(endpoint, options);
    return res;
  } catch {
    // Fallback directly to backend port
    return fetch(`${BASE_URL}${endpoint}`, options);
  }
}

export async function checkBackendHealth() {
  try {
    const res = await request('/health', { method: 'GET' });
    if (!res.ok) return { healthy: false };
    const data = await res.json();
    return { healthy: data.status === 'healthy', data };
  } catch {
    return { healthy: false };
  }
}

export async function fetchSamples() {
  const res = await request('/api/samples', { method: 'GET' });
  if (!res.ok) {
    throw new Error(`Failed to fetch samples: ${res.statusText}`);
  }
  return res.json();
}

export async function analyzeProgram(code, language = 'c') {
  if (!code || !code.trim()) {
    throw {
      error_type: 'InputError',
      message: 'Source code cannot be empty. Please enter C source code.',
      line: null,
      col: null
    };
  }

  let res;
  try {
    res = await request('/api/analyze/all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language })
    });
  } catch (netErr) {
    throw {
      error_type: 'NetworkError',
      message: `Failed to connect to compiler backend: ${netErr.message || 'Server unreachable at 127.0.0.1:8000'}`,
      line: null,
      col: null
    };
  }

  const data = await res.json();

  if (!res.ok) {
    let msg = 'Compilation and analysis failed';
    let line = null;
    let col = null;
    let errorType = 'CompilationError';

    if (typeof data.detail === 'string') {
      msg = data.detail;
    } else if (Array.isArray(data.detail)) {
      msg = data.detail.map(d => d.msg || JSON.stringify(d)).join(', ');
    } else if (typeof data.detail === 'object' && data.detail !== null) {
      msg = data.detail.message || data.detail.msg || JSON.stringify(data.detail);
      line = data.detail.line ?? null;
      col = data.detail.col ?? null;
      errorType = data.detail.error_type || 'CompilationError';
    }

    throw {
      error_type: errorType,
      message: msg,
      line,
      col
    };
  }

  return data;
}
