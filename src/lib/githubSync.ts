export const DEFAULT_GITHUB_URLS = {
  at1: "https://raw.githubusercontent.com/carloswladier/INDICADORES3/main/DASH%20AT1%20PERSONA_ATUALIZADO.xlsx",
  outage: "https://raw.githubusercontent.com/carloswladier/INDICADORES3/main/OUTAGE_SGO.xlsx",
  revisita: "https://raw.githubusercontent.com/carloswladier/INDICADORES3/main/REVISITA_30D_Jul_Dez.xlsx",
  revisitaJanJun: "https://raw.githubusercontent.com/carloswladier/INDICADORES3/main/REVISITA_30D_Jan_Jun.xlsx",
  revisitaJulDez: "https://raw.githubusercontent.com/carloswladier/INDICADORES3/main/REVISITA_30D_Jul_Dez.xlsx",
  at5: "https://raw.githubusercontent.com/carloswladier/INDICADORES3/main/AT5_NORTE.xlsx",
  qoeGpon: "https://raw.githubusercontent.com/carloswladier/INDICADORES3/main/QOE_GPON_NORTE.xlsx",
};

// Migrate deprecated repository URLs to current repository INDICADORES3
function migrateDeprecatedRepoUrl(url: string): string {
  if (!url) return '';
  return url
    .replace('/carloswladier/DASH_AT1_G1/', '/carloswladier/INDICADORES3/')
    .replace('/carloswladier/INDICADORES_MANUT/', '/carloswladier/INDICADORES3/')
    .replace('/carloswladier/INDICADORES2/', '/carloswladier/INDICADORES3/')
    .replace('/carloswladier/INDICADORES/', '/carloswladier/INDICADORES3/');
}

export function getEnvValue(key: string, altKeys: string[] = [], fallback = ''): string {
  const metaEnv = (import.meta as any).env || {};
  if (metaEnv[key] && String(metaEnv[key]).trim() !== '') {
    return migrateDeprecatedRepoUrl(String(metaEnv[key]).trim());
  }
  for (const alt of altKeys) {
    if (metaEnv[alt] && String(metaEnv[alt]).trim() !== '') {
      return migrateDeprecatedRepoUrl(String(metaEnv[alt]).trim());
    }
  }
  try {
    const localVal = localStorage.getItem(key);
    if (localVal && localVal.trim() !== '') {
      const migrated = migrateDeprecatedRepoUrl(localVal.trim());
      if (migrated !== localVal.trim()) {
        try { localStorage.setItem(key, migrated); } catch {}
      }
      return migrated;
    }
    for (const alt of altKeys) {
      const altLocal = localStorage.getItem(alt);
      if (altLocal && altLocal.trim() !== '') {
        const migrated = migrateDeprecatedRepoUrl(altLocal.trim());
        if (migrated !== altLocal.trim()) {
          try { localStorage.setItem(alt, migrated); } catch {}
        }
        return migrated;
      }
    }
  } catch {
    // Ignore localStorage exceptions
  }
  return fallback;
}

export function normalizeGithubRawUrl(targetUrl: string): string {
  if (!targetUrl) return '';
  let url = targetUrl.trim();
  
  // Handle partial string pastes like 'ladier/INDICADORES3/...' or 'carloswladier/INDICADORES3/...'
  if (url.startsWith('ladier/')) {
    url = 'carlosw' + url;
  }
  if (url.startsWith('carloswladier/')) {
    url = 'https://raw.githubusercontent.com/' + url;
  }

  // Transform github.com web URLs to raw.githubusercontent.com
  if (url.includes('github.com') && !url.includes('raw.githubusercontent.com')) {
    url = url
      .replace('github.com', 'raw.githubusercontent.com')
      .replace('/blob/', '/')
      .replace('/raw/', '/');
  }
  
  // Normalize /refs/heads/
  url = url.replace('/refs/heads/', '/');

  // Strip accidental double slashes
  url = url.replace(/(https?:\/\/)([^/]+)\/\//g, '$1$2/');

  // Migrate legacy repo paths to INDICADORES3
  url = migrateDeprecatedRepoUrl(url);
  
  // Ensure spaces in file names are encoded for fetch
  return url.replace(/ /g, '%20');
}

export async function fetchGithubFileArrayBuffer(targetUrl: string): Promise<ArrayBuffer> {
  const primaryUrl = normalizeGithubRawUrl(targetUrl);
  
  // Remote URL candidates to attempt
  const remoteCandidates: string[] = [];

  // 1. Primary requested URL
  remoteCandidates.push(primaryUrl);

  // 2. INDICADORES3 explicit equivalent
  if (primaryUrl.includes('carloswladier')) {
    const indic3 = primaryUrl
      .replace('/carloswladier/DASH_AT1_G1/', '/carloswladier/INDICADORES3/')
      .replace('/carloswladier/INDICADORES_MANUT/', '/carloswladier/INDICADORES3/')
      .replace('/carloswladier/INDICADORES2/', '/carloswladier/INDICADORES3/')
      .replace('/carloswladier/INDICADORES/', '/carloswladier/INDICADORES3/');
    if (!remoteCandidates.includes(indic3)) {
      remoteCandidates.push(indic3);
    }
  }

  // 3. Known official URLs in INDICADORES3
  if (primaryUrl.includes('DASH') && primaryUrl.includes('AT1')) {
    remoteCandidates.push('https://raw.githubusercontent.com/carloswladier/INDICADORES3/main/DASH%20AT1%20PERSONA_ATUALIZADO.xlsx');
  }
  if (primaryUrl.includes('OUTAGE_SGO') || primaryUrl.includes('outage')) {
    remoteCandidates.push('https://raw.githubusercontent.com/carloswladier/INDICADORES3/main/OUTAGE_SGO.xlsx');
  }
  if (primaryUrl.includes('REVISITA_30D_Jul_Dez') || primaryUrl.includes('REVISITA_30D_Norte')) {
    remoteCandidates.push('https://raw.githubusercontent.com/carloswladier/INDICADORES3/main/REVISITA_30D_Jul_Dez.xlsx');
  }
  if (primaryUrl.includes('REVISITA_30D_Jan_Jun')) {
    remoteCandidates.push('https://raw.githubusercontent.com/carloswladier/INDICADORES3/main/REVISITA_30D_Jan_Jun.xlsx');
  }
  if (primaryUrl.includes('QOE_GPON') || primaryUrl.includes('QOE')) {
    remoteCandidates.push('https://raw.githubusercontent.com/carloswladier/INDICADORES3/main/QOE_GPON_NORTE.xlsx');
  }

  // 4. Raw targetUrl with encoded spaces if different
  if (targetUrl && targetUrl !== primaryUrl && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://'))) {
    remoteCandidates.push(targetUrl.trim().replace(/ /g, '%20'));
  }

  // Extract file name for local fallback
  const extractFilename = (u: string) => {
    try {
      const parts = u.split('/');
      return parts[parts.length - 1];
    } catch {
      return '';
    }
  };
  const fileName = extractFilename(primaryUrl);
  const localFallbacks: string[] = [];
  if (fileName) {
    localFallbacks.push(`/${fileName}`);
    localFallbacks.push(`./${fileName}`);
    localFallbacks.push(fileName);
  }

  // Helper to ensure array buffer is real binary excel data, not an HTML error or empty JSON
  const isValidExcelOrDataBuffer = (buf: ArrayBuffer): boolean => {
    if (!buf || buf.byteLength < 50) return false;
    const b = new Uint8Array(buf.slice(0, 8));
    // ZIP / XLSX magic: PK (0x50, 0x4B, 0x03, 0x04)
    if (b[0] === 0x50 && b[1] === 0x4b) return true;
    // XLS (BIFF8) magic: 0xD0, 0xCF, 0x11, 0xE0
    if (b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0) return true;
    // Reject HTML ('<') and JSON ('{', '[')
    if (b[0] === 0x3c || b[0] === 0x7b || b[0] === 0x5b) return false;
    return true;
  };

  const uniqueRemoteCandidates = Array.from(new Set(remoteCandidates.filter(u => u.startsWith('http://') || u.startsWith('https://'))));

  // STEP 1: Attempt via server proxy FIRST.
  // The backend server resolves the latest commit SHA, bypasses Fastly CDN cache, avoids browser CORS,
  // and saves the fresh file to the server disk.
  for (const url of uniqueRemoteCandidates) {
    try {
      const proxyUrl = `/api/proxy-github?url=${encodeURIComponent(url)}&_t=${Date.now()}`;
      const res = await fetch(proxyUrl, { cache: 'no-cache' });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        if (isValidExcelOrDataBuffer(buf)) {
          return buf;
        }
      }
    } catch {
      // Continue to next candidate / direct fetch
    }
  }

  // STEP 2: Try direct browser fetch with cache-busting (for static hosting like Hostinger without Node server)
  for (const url of uniqueRemoteCandidates) {
    try {
      const fetchUrl = url.includes('?') ? `${url}&_t=${Date.now()}` : `${url}?_t=${Date.now()}`;
      const res = await fetch(fetchUrl, { cache: 'no-cache' });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        if (isValidExcelOrDataBuffer(buf)) {
          return buf;
        }
      }
    } catch {
      // Continue
    }
  }

  // STEP 3: Only if all remote attempts failed, try local fallback as last resort
  for (const localUrl of localFallbacks) {
    try {
      const res = await fetch(localUrl, { cache: 'no-cache' });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        if (isValidExcelOrDataBuffer(buf)) {
          console.warn(`[githubSync] Usando arquivo local como fallback para ${fileName}`);
          return buf;
        }
      }
    } catch {
      // Continue
    }
  }
  
  throw new Error(`Não foi possível baixar o arquivo do GitHub. Verifique a URL: ${primaryUrl}`);
}

export interface GithubRepoStatus {
  repo: string;
  branch: string;
  latestCommit: {
    sha: string;
    fullSha: string;
    message: string;
    date: string;
    author: string;
  } | null;
  files: Array<{
    key: string;
    fileName: string;
    label: string;
    existsLocally: boolean;
    sizeBytes: number;
    modifiedAt: string;
    rawUrl: string;
  }>;
}

export async function fetchGithubRepoStatus(): Promise<GithubRepoStatus | null> {
  try {
    const res = await fetch(`/api/github/status?_t=${Date.now()}`);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // ignore
  }
  return null;
}

export async function triggerSyncAllGithubFiles(): Promise<{ success: boolean; commitSha?: string; results: any[] }> {
  const res = await fetch(`/api/github/sync-all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    throw new Error(`Erro ao sincronizar arquivos do GitHub (status ${res.status})`);
  }
  return await res.json();
}

export async function uploadExcelFileToServer(file: File, githubToken?: string): Promise<{ success: boolean; message: string; pushedToGithub: boolean }> {
  const arrayBuffer = await file.arrayBuffer();
  // Convert arrayBuffer to base64 in chunks to avoid call stack overflow on large files
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.byteLength; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.byteLength));
    binary += String.fromCharCode.apply(null, chunk as any);
  }
  const fileBase64 = btoa(binary);

  const res = await fetch('/api/github/upload-file', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      fileBase64,
      githubToken
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erro ao salvar arquivo no servidor (${res.status})`);
  }

  return await res.json();
}

export function getGithubAt1Url(): string {
  return normalizeGithubRawUrl(
    getEnvValue(
      'VITE_GITHUB_AT1',
      [
        'VITE_GITHUB_AT1_URL',
        'VITE_GITHUB_EXCEL_URL',
        'VITE_GITHUB_EXCEL',
        'GITHUB_AT1',
        'GITHUB_AT1_URL',
        'GITHUB_EXCEL',
        'VITE_GITHUB_EXCEL_URL_1'
      ],
      DEFAULT_GITHUB_URLS.at1
    )
  );
}

export function getGithubOutageUrl(): string {
  return normalizeGithubRawUrl(
    getEnvValue(
      'VITE_GITHUB_OUTAGE',
      [
        'VITE_GITHUB_OUTAGE_URL',
        'VITE_GITHUB_EXCEL_OUTAGE',
        'GITHUB_OUTAGE',
        'GITHUB_OUTAGE_URL',
        'GITHUB_EXCEL_OUTAGE',
        'VITE_GITHUB_EXCEL_URL_2'
      ],
      DEFAULT_GITHUB_URLS.outage
    )
  );
}

export function getGithubRevisitaUrl(): string {
  return normalizeGithubRawUrl(
    getEnvValue(
      'VITE_GITHUB_REVISITA',
      [
        'VITE_GITHUB_REVISITA_URL',
        'VITE_GITHUB_EXCEL_REVISITA',
        'GITHUB_REVISITA',
        'GITHUB_REVISITA_URL',
        'GITHUB_EXCEL_REVISITA',
        'VITE_GITHUB_EXCEL_URL_3',
        'VITE_GITHUB_EXCEL_REVISITA_URL'
      ],
      DEFAULT_GITHUB_URLS.revisita
    )
  );
}

export function getGithubRevisitaJanJunUrl(): string {
  return normalizeGithubRawUrl(
    getEnvValue(
      'VITE_GITHUB_REVISITA_JAN_JUN',
      [
        'VITE_GITHUB_REVISITA_JAN_JUN_URL',
        'VITE_GITHUB_EXCEL_REVISITA_JAN_JUN',
        'GITHUB_REVISITA_JAN_JUN',
        'GITHUB_EXCEL_REVISITA_JAN_JUN'
      ],
      DEFAULT_GITHUB_URLS.revisitaJanJun
    )
  );
}

export function getGithubRevisitaJulDezUrl(): string {
  return normalizeGithubRawUrl(
    getEnvValue(
      'VITE_GITHUB_REVISITA_JUL_DEZ',
      [
        'VITE_GITHUB_REVISITA_JUL_DEZ_URL',
        'VITE_GITHUB_EXCEL_REVISITA_JUL_DEZ',
        'GITHUB_REVISITA_JUL_DEZ',
        'GITHUB_EXCEL_REVISITA_JUL_DEZ'
      ],
      DEFAULT_GITHUB_URLS.revisitaJulDez
    )
  );
}

export function getGithubAt5Url(): string {
  return normalizeGithubRawUrl(
    getEnvValue(
      'VITE_GITHUB_AT5',
      [
        'VITE_GITHUB_AT5_URL',
        'VITE_GITHUB_EXCEL_URL_AT5',
        'GITHUB_AT5',
        'GITHUB_AT5_URL',
        'GITHUB_EXCEL_AT5',
        'VITE_GITHUB_EXCEL_URL_5'
      ],
      DEFAULT_GITHUB_URLS.at5
    )
  );
}

export function getGithubQoeGponUrl(): string {
  return normalizeGithubRawUrl(
    getEnvValue(
      'VITE_GITHUB_QOE_GPON',
      [
        'VITE_GITHUB_QOE_GPON_URL',
        'VITE_GITHUB_EXCEL_URL_QOE_GPON',
        'GITHUB_QOE_GPON',
        'GITHUB_QOE_GPON_URL',
        'GITHUB_EXCEL_QOE_GPON',
        'VITE_GITHUB_EXCEL_URL_QOE'
      ],
      DEFAULT_GITHUB_URLS.qoeGpon
    )
  );
}


