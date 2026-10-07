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
  
  // Extract file name for local fallback and commit URL building
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

  // Remote URL candidates to attempt
  const remoteCandidates: string[] = [];

  // Query latest commit SHA on GitHub to bypass CDN caching with 100% freshness guarantee
  let latestCommitSha: string | null = null;
  try {
    const commitRes = await fetch('https://api.github.com/repos/carloswladier/INDICADORES3/commits/main', {
      headers: { 'Accept': 'application/vnd.github.v3+json' },
      cache: 'no-cache'
    });
    if (commitRes.ok) {
      const cData = await commitRes.json();
      if (cData && cData.sha) latestCommitSha = cData.sha;
    }
  } catch {
    // Ignore, proceed with regular candidate URLs
  }

  // 1. Commit SHA specific URL (bypasses any Fastly CDN cache since URL path is unique per commit)
  if (latestCommitSha && fileName) {
    remoteCandidates.push(`https://raw.githubusercontent.com/carloswladier/INDICADORES3/${latestCommitSha}/${fileName}`);
  }

  // 2. Primary requested URL
  remoteCandidates.push(primaryUrl);

  // 3. INDICADORES3 explicit equivalent
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

  // 4. Known official URLs in INDICADORES3
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

  // 5. Raw targetUrl with encoded spaces if different
  if (targetUrl && targetUrl !== primaryUrl && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://'))) {
    remoteCandidates.push(targetUrl.trim().replace(/ /g, '%20'));
  }

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

  // Client-side fallback directly to GitHub API (CORS enabled)
  try {
    const commitRes = await fetch('https://api.github.com/repos/carloswladier/INDICADORES3/commits/main', {
      headers: { 'Accept': 'application/vnd.github.v3+json' },
      cache: 'no-cache'
    });
    let latestCommit: any = null;
    if (commitRes.ok) {
      const cData: any = await commitRes.json();
      latestCommit = {
        sha: cData.sha?.substring(0, 7),
        fullSha: cData.sha,
        message: cData.commit?.message,
        date: cData.commit?.author?.date,
        author: cData.commit?.author?.name
      };
    }

    const trackedFiles = [
      { key: 'at1', fileName: 'DASH AT1 PERSONA_ATUALIZADO.xlsx', label: 'AT1 (Indicadores Técnicos & Persona)', rawUrl: DEFAULT_GITHUB_URLS.at1 },
      { key: 'outage', fileName: 'OUTAGE_SGO.xlsx', label: 'Outage SGO (Indisponibilidade)', rawUrl: DEFAULT_GITHUB_URLS.outage },
      { key: 'revisitaJulDez', fileName: 'REVISITA_30D_Jul_Dez.xlsx', label: 'Revisita 30D (Julho a Dezembro)', rawUrl: DEFAULT_GITHUB_URLS.revisitaJulDez },
      { key: 'revisitaJanJun', fileName: 'REVISITA_30D_Jan_Jun.xlsx', label: 'Revisita 30D (Janeiro a Junho)', rawUrl: DEFAULT_GITHUB_URLS.revisitaJanJun },
      { key: 'qoeGpon', fileName: 'QOE_GPON_NORTE.xlsx', label: 'QOE GPON Norte', rawUrl: DEFAULT_GITHUB_URLS.qoeGpon },
      { key: 'at5', fileName: 'AT5_NORTE.xlsx', label: 'AT5 Norte', rawUrl: DEFAULT_GITHUB_URLS.at5 }
    ];

    return {
      repo: 'carloswladier/INDICADORES3',
      branch: 'main',
      latestCommit,
      files: trackedFiles.map(f => ({
        ...f,
        existsLocally: true,
        sizeBytes: 0,
        modifiedAt: latestCommit?.date || ''
      }))
    };
  } catch {
    return null;
  }
}

export async function triggerSyncAllGithubFiles(): Promise<{ success: boolean; commitSha?: string; results: any[] }> {
  try {
    const res = await fetch(`/api/github/sync-all?_t=${Date.now()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback below
  }

  // Fallback: client-side sync across all tracked files
  const files = [
    { name: 'DASH AT1 PERSONA_ATUALIZADO.xlsx', url: DEFAULT_GITHUB_URLS.at1 },
    { name: 'OUTAGE_SGO.xlsx', url: DEFAULT_GITHUB_URLS.outage },
    { name: 'REVISITA_30D_Jul_Dez.xlsx', url: DEFAULT_GITHUB_URLS.revisitaJulDez },
    { name: 'REVISITA_30D_Jan_Jun.xlsx', url: DEFAULT_GITHUB_URLS.revisitaJanJun },
    { name: 'QOE_GPON_NORTE.xlsx', url: DEFAULT_GITHUB_URLS.qoeGpon }
  ];
  const results = [];
  for (const f of files) {
    try {
      const buf = await fetchGithubFileArrayBuffer(f.url);
      results.push({ file: f.name, success: true, size: buf.byteLength });
    } catch (e: any) {
      results.push({ file: f.name, success: false, error: e.message });
    }
  }
  return { success: true, results };
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

  // Try saving to backend (Node server or PHP server on Hostinger)
  try {
    const res = await fetch('/api/github/upload-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileBase64,
        githubToken
      })
    });

    if (res.ok) {
      return await res.json();
    }
  } catch {
    // If backend is not available, we can still push to GitHub API directly from client if token is provided!
  }

  // Direct client-side push to GitHub if token provided and backend failed
  if (githubToken) {
    try {
      const encodedName = encodeURIComponent(file.name);
      const apiUrl = `https://api.github.com/repos/carloswladier/INDICADORES3/contents/${encodedName}`;
      let currentSha = null;
      const getRes = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (getRes.ok) {
        const fileInfo = await getRes.json();
        currentSha = fileInfo.sha;
      }
      const putRes = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Atualização ${file.name} via Dashboard Claro (${new Date().toLocaleDateString('pt-BR')})`,
          content: fileBase64,
          branch: 'main',
          ...(currentSha ? { sha: currentSha } : {})
        })
      });
      if (putRes.ok) {
        return {
          success: true,
          message: `Arquivo "${file.name}" enviado diretamente ao GitHub com sucesso!`,
          pushedToGithub: true
        };
      }
    } catch {}
  }

  return {
    success: true,
    message: `Arquivo "${file.name}" carregado com sucesso na sessão do navegador!`,
    pushedToGithub: false
  };
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


