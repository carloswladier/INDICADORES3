<?php
/**
 * Conector MySQL & GitHub Proxy Hostinger para o Dashboard de Indicadores Claro
 * Suporta proxy inteligente com bypass de cache Fastly/GitHub CDN,
 * sincronização de arquivos Excel locais na Hostinger e API MySQL.
 */

ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, x-db-host, x-db-user, x-db-password, x-db-name, x-db-port, x-db-uri");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configurações padrão do Banco de Dados na Hostinger
$db_host = "localhost";
$db_user = "u688072783_CW_INDICADORES";
$db_pass = "Cwrocha2026";
$db_name = "u688072783_INDICADORES";

if (!empty($_SERVER['HTTP_X_DB_USER'])) $db_user = $_SERVER['HTTP_X_DB_USER'];
if (!empty($_SERVER['HTTP_X_DB_PASSWORD'])) $db_pass = $_SERVER['HTTP_X_DB_PASSWORD'];
if (!empty($_SERVER['HTTP_X_DB_NAME'])) $db_name = $_SERVER['HTTP_X_DB_NAME'];
if (!empty($_SERVER['HTTP_X_DB_HOST'])) $db_host = $_SERVER['HTTP_X_DB_HOST'];

// Detecta rota / endpoint
$uri = $_SERVER['REQUEST_URI'] ?? '';
$endpoint = $_GET['endpoint'] ?? '';
$action = $_GET['action'] ?? '';
$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if (empty($endpoint)) {
    if (strpos($uri, '/api/proxy-github') !== false) {
        $endpoint = 'proxy-github';
    } elseif (strpos($uri, '/api/github/status') !== false) {
        $endpoint = 'github-status';
    } elseif (strpos($uri, '/api/github/sync-all') !== false) {
        $endpoint = 'github-sync-all';
    } elseif (strpos($uri, '/api/github/upload-file') !== false) {
        $endpoint = 'github-upload-file';
    } elseif (strpos($uri, '/api/logs/') !== false) {
        $parts = explode('/api/logs/', $uri);
        if (!empty($parts[1])) {
            $id = intval(explode('?', $parts[1])[0]);
            $endpoint = 'logs';
        }
    } elseif (strpos($uri, '/api/logs') !== false) {
        $endpoint = 'logs';
    } elseif (strpos($uri, '/api/db-test') !== false) {
        $endpoint = 'db-test';
    } elseif (strpos($uri, '/api/db-status') !== false || strpos($uri, '/api/health') !== false) {
        $endpoint = 'status';
    }
} else {
    if (strpos($endpoint, 'logs/') === 0) {
        $id = intval(substr($endpoint, 5));
        $endpoint = 'logs';
    } elseif (strpos($endpoint, 'proxy-github') === 0) {
        $endpoint = 'proxy-github';
    } elseif (strpos($endpoint, 'github/status') === 0) {
        $endpoint = 'github-status';
    } elseif (strpos($endpoint, 'github/sync-all') === 0) {
        $endpoint = 'github-sync-all';
    } elseif (strpos($endpoint, 'github/upload-file') === 0) {
        $endpoint = 'github-upload-file';
    }
}

// Helper: obter o commit SHA mais recente do repositório no GitHub para bypass de cache
function getLatestGithubCommitSha($repo = "carloswladier/INDICADORES3", $branch = "main") {
    $ch = curl_init("https://api.github.com/repos/{$repo}/commits/{$branch}");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Claro-Indicadores-Sync');
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Accept: application/vnd.github.v3+json']);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($code >= 200 && $code < 300 && !empty($res)) {
        $data = json_decode($res, true);
        if (!empty($data['sha'])) {
            return $data['sha'];
        }
    }
    return null;
}

// Helper: salva arquivo localmente em diretórios possíveis na Hostinger
function saveFileLocally($fileName, $content) {
    if (empty($fileName) || empty($content)) return false;
    $paths = [
        __DIR__ . '/' . $fileName,
        __DIR__ . '/public/' . $fileName,
        dirname(__DIR__) . '/' . $fileName,
        dirname(__DIR__) . '/public/' . $fileName
    ];
    $saved = false;
    foreach ($paths as $p) {
        $dir = dirname($p);
        if (is_dir($dir) && is_writable($dir)) {
            @file_put_contents($p, $content);
            $saved = true;
        } elseif (file_exists($p) && is_writable($p)) {
            @file_put_contents($p, $content);
            $saved = true;
        }
    }
    return $saved;
}

// Helper: busca arquivo local existente
function findLocalFilePath($fileName) {
    if (empty($fileName)) return null;
    $paths = [
        __DIR__ . '/' . $fileName,
        __DIR__ . '/public/' . $fileName,
        dirname(__DIR__) . '/' . $fileName,
        dirname(__DIR__) . '/public/' . $fileName
    ];
    foreach ($paths as $p) {
        if (file_exists($p) && filesize($p) > 1000) {
            return $p;
        }
    }
    return null;
}

// Endpoint de Proxy para o GitHub com bypass de cache e sincronização de arquivo
if ($endpoint === 'proxy-github' || $action === 'proxy-github') {
    $rawUrl = $_GET['url'] ?? '';
    if (empty($rawUrl)) {
        http_response_code(400);
        header("Content-Type: application/json; charset=UTF-8");
        echo json_encode(["error" => "Parâmetro 'url' é obrigatório"]);
        exit();
    }

    $target = trim($rawUrl);
    if (strpos($target, 'ladier/') === 0) {
        $target = 'carlosw' . $target;
    }
    if (strpos($target, 'carloswladier/') === 0) {
        $target = 'https://raw.githubusercontent.com/' . $target;
    }

    // Normaliza repositórios legados para o atual INDICADORES3
    $target = str_replace(
        ['/carloswladier/DASH_AT1_G1/', '/carloswladier/INDICADORES_MANUT/', '/carloswladier/INDICADORES2/', '/carloswladier/INDICADORES/'],
        '/carloswladier/INDICADORES3/',
        $target
    );

    if (strpos($target, 'github.com') !== false && strpos($target, 'raw.githubusercontent.com') === false) {
        $target = str_replace(['github.com', '/blob/', '/raw/'], ['raw.githubusercontent.com', '/', '/'], $target);
    }
    $target = str_replace('/refs/heads/', '/', $target);
    $target = str_replace(' ', '%20', $target);

    $urlPath = parse_url($target, PHP_URL_PATH);
    $localName = basename(urldecode($urlPath));

    // Resolve commit SHA no GitHub para contornar qualquer cache estático ou CDN Fastly
    $commitSha = getLatestGithubCommitSha("carloswladier/INDICADORES3", "main");
    $urlsToTry = [];
    if (!empty($commitSha) && strpos($target, '/INDICADORES3/main/') !== false) {
        $urlsToTry[] = str_replace('/INDICADORES3/main/', "/INDICADORES3/{$commitSha}/", $target);
    }
    $cacheBusterUrl = (strpos($target, '?') !== false) ? "{$target}&_t=" . time() : "{$target}?_t=" . time();
    $urlsToTry[] = $cacheBusterUrl;
    $urlsToTry[] = $target;

    $content = null;
    $httpCode = 0;
    $errorMsg = '';

    foreach ($urlsToTry as $fetchUrl) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $fetchUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Claro-Indicadores-Sync');
        curl_setopt($ch, CURLOPT_TIMEOUT, 60);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Cache-Control: no-cache, no-store, must-revalidate',
            'Pragma: no-cache',
            'Expires: 0'
        ]);
        $content = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $errorMsg = curl_error($ch);
        curl_close($ch);

        if ($httpCode >= 200 && $httpCode < 300 && !empty($content) && strlen($content) > 1000) {
            $magic = substr($content, 0, 4);
            $isXlsx = ($magic === "PK\x03\x04");
            $isXls = (substr($content, 0, 8) === "\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1");
            if ($isXlsx || $isXls || strlen($content) > 5000) {
                // Atualiza e sincroniza a cópia local na Hostinger para manter os arquivos sempre atualizados
                saveFileLocally($localName, $content);

                header("Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                header("Content-Length: " . strlen($content));
                header("Content-Disposition: attachment; filename=\"" . $localName . "\"");
                header("Cache-Control: no-cache, no-store, must-revalidate");
                header("Pragma: no-cache");
                header("Expires: 0");
                if ($commitSha) header("X-Github-Commit: " . $commitSha);
                echo $content;
                exit();
            }
        }
    }

    // Se o download remoto falhar (offline/timeout), serve do fallback local como última opção
    $localFallbackPath = findLocalFilePath($localName);
    if ($localFallbackPath) {
        header("Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        header("Content-Length: " . filesize($localFallbackPath));
        header("Content-Disposition: attachment; filename=\"" . $localName . "\"");
        header("X-Source: local-fallback");
        readfile($localFallbackPath);
        exit();
    }

    http_response_code($httpCode >= 400 ? $httpCode : 502);
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode([
        "error" => "Falha ao baixar arquivo atualizado do GitHub via proxy",
        "httpCode" => $httpCode,
        "details" => $errorMsg ?: "Código HTTP $httpCode retornado pelo GitHub",
        "url" => $target
    ]);
    exit();
}

// Endpoint de Status dos Arquivos e do Repositório GitHub
if ($endpoint === 'github-status') {
    header("Content-Type: application/json; charset=UTF-8");
    header("Cache-Control: no-cache, no-store, must-revalidate");
    $commitSha = getLatestGithubCommitSha("carloswladier/INDICADORES3", "main");
    $trackedFiles = [
        ['key' => 'at1', 'name' => 'DASH AT1 PERSONA_ATUALIZADO.xlsx', 'label' => 'AT1 (Indicadores Técnicos & Persona)'],
        ['key' => 'outage', 'name' => 'OUTAGE_SGO.xlsx', 'label' => 'Outage SGO (Indisponibilidade)'],
        ['key' => 'revisitaJulDez', 'name' => 'REVISITA_30D_Jul_Dez.xlsx', 'label' => 'Revisita 30D (Julho a Dezembro)'],
        ['key' => 'revisitaJanJun', 'name' => 'REVISITA_30D_Jan_Jun.xlsx', 'label' => 'Revisita 30D (Janeiro a Junho)'],
        ['key' => 'qoeGpon', 'name' => 'QOE_GPON_NORTE.xlsx', 'label' => 'QOE GPON Norte'],
        ['key' => 'at5', 'name' => 'AT5_NORTE.xlsx', 'label' => 'AT5 Norte']
    ];
    $filesInfo = [];
    foreach ($trackedFiles as $tf) {
        $lp = findLocalFilePath($tf['name']);
        $filesInfo[] = [
            'key' => $tf['key'],
            'fileName' => $tf['name'],
            'label' => $tf['label'],
            'existsLocally' => !empty($lp),
            'sizeBytes' => $lp ? filesize($lp) : 0,
            'modifiedAt' => $lp ? date('c', filemtime($lp)) : null,
            'rawUrl' => "https://raw.githubusercontent.com/carloswladier/INDICADORES3/main/" . rawurlencode($tf['name'])
        ];
    }
    echo json_encode([
        'repo' => 'carloswladier/INDICADORES3',
        'branch' => 'main',
        'latestCommit' => $commitSha ? ['sha' => substr($commitSha, 0, 7), 'fullSha' => $commitSha] : null,
        'files' => $filesInfo
    ]);
    exit();
}

// Endpoint de Sincronização Completa de Todos os Arquivos Excel
if ($endpoint === 'github-sync-all') {
    header("Content-Type: application/json; charset=UTF-8");
    $files = [
        'DASH AT1 PERSONA_ATUALIZADO.xlsx',
        'OUTAGE_SGO.xlsx',
        'REVISITA_30D_Jul_Dez.xlsx',
        'REVISITA_30D_Jan_Jun.xlsx',
        'QOE_GPON_NORTE.xlsx'
    ];
    $commitSha = getLatestGithubCommitSha("carloswladier/INDICADORES3", "main");
    $results = [];
    foreach ($files as $fn) {
        $url = "https://raw.githubusercontent.com/carloswladier/INDICADORES3/" . ($commitSha ?: "main") . "/" . rawurlencode($fn);
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Claro-Indicadores-Sync');
        curl_setopt($ch, CURLOPT_TIMEOUT, 40);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Cache-Control: no-cache, no-store, must-revalidate',
            'Pragma: no-cache'
        ]);
        $c = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($code >= 200 && $code < 300 && strlen($c) > 1000) {
            saveFileLocally($fn, $c);
            $results[] = ['file' => $fn, 'status' => 'synced', 'size' => strlen($c)];
        } else {
            $results[] = ['file' => $fn, 'status' => 'failed', 'httpCode' => $code];
        }
    }
    echo json_encode([
        'success' => true,
        'commitSha' => $commitSha,
        'results' => $results
    ]);
    exit();
}

// Endpoint de Upload Direto para a Hostinger e opcional Commit no GitHub
if ($endpoint === 'github-upload-file') {
    header("Content-Type: application/json; charset=UTF-8");
    $fileName = '';
    $binaryContent = '';
    $githubToken = '';

    if (!empty($_FILES['file']['tmp_name'])) {
        $fileName = basename($_FILES['file']['name']);
        $binaryContent = file_get_contents($_FILES['file']['tmp_name']);
        $githubToken = $_POST['githubToken'] ?? '';
    } else {
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true) ?: [];
        $fileName = basename($input['fileName'] ?? '');
        $githubToken = $input['githubToken'] ?? '';
        if (!empty($input['fileBase64'])) {
            $binaryContent = base64_decode($input['fileBase64']);
        }
    }

    if (empty($fileName) || empty($binaryContent)) {
        http_response_code(400);
        echo json_encode(['error' => 'Arquivo inválido ou vazio']);
        exit();
    }

    saveFileLocally($fileName, $binaryContent);

    $pushedToGithub = false;
    $githubMessage = '';

    if (!empty($githubToken)) {
        $encodedPath = rawurlencode($fileName);
        $apiUrl = "https://api.github.com/repos/carloswladier/INDICADORES3/contents/{$encodedPath}";
        
        $currentSha = null;
        $ch = curl_init($apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Claro-Indicadores-Sync');
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Bearer {$githubToken}",
            "Accept: application/vnd.github.v3+json"
        ]);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $res = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($code >= 200 && $code < 300) {
            $fData = json_decode($res, true);
            $currentSha = $fData['sha'] ?? null;
        }

        $putPayload = [
            'message' => "Atualização {$fileName} via Dashboard Claro (" . date('d/m/Y H:i') . ")",
            'content' => base64_encode($binaryContent),
            'branch' => 'main'
        ];
        if ($currentSha) $putPayload['sha'] = $currentSha;

        $ch = curl_init($apiUrl);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($putPayload));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Claro-Indicadores-Sync');
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Bearer {$githubToken}",
            "Accept: application/vnd.github.v3+json",
            "Content-Type: application/json"
        ]);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $putRes = curl_exec($ch);
        $putCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($putCode >= 200 && $putCode < 300) {
            $pushedToGithub = true;
            $githubMessage = ' e commit salvo diretamente no GitHub!';
        } else {
            $githubMessage = ' (Salvo na Hostinger com sucesso. Falha no GitHub API: código ' . $putCode . ')';
        }
    }

    echo json_encode([
        'success' => true,
        'message' => "Arquivo \"{$fileName}\" salvo com sucesso na Hostinger{$githubMessage}",
        'pushedToGithub' => $pushedToGithub
    ]);
    exit();
}

// Conexão com o banco de dados via PDO para funcionalidades de LOG e CRUD
try {
    $pdo = new PDO("mysql:host={$db_host};dbname={$db_name};charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 5
    ]);

    $pdo->exec("CREATE TABLE IF NOT EXISTS log_entries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        data VARCHAR(50),
        cidade VARCHAR(100),
        numero_chamado VARCHAR(100),
        incidente VARCHAR(255),
        descricao TEXT,
        status VARCHAR(50) DEFAULT 'Pendente',
        data_conclusao VARCHAR(50) NULL,
        created_at VARCHAR(100)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

} catch (PDOException $e) {
    http_response_code(500);
    header("Content-Type: application/json; charset=UTF-8");
    echo json_encode([
        "success" => false,
        "configured" => false,
        "type" => "Hostinger MySQL (PHP Bridge)",
        "status" => "error",
        "error" => $e->getMessage(),
        "details" => "Erro ao conectar ao MySQL na Hostinger. Verifique se o banco de dados e usuário existem no hPanel.",
        "config" => [
            "host" => $db_host,
            "user" => $db_user,
            "database" => $db_name
        ]
    ]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

// Rota de Teste de Conexão (SELECT 1)
if ($endpoint === 'db-test' || $action === 'test') {
    header("Content-Type: application/json; charset=UTF-8");
    try {
        $stmt = $pdo->query("SELECT 1 AS connected");
        $res = $stmt->fetch();
        echo json_encode([
            "success" => true,
            "message" => "Conexão com o banco MySQL da Hostinger estabelecida com sucesso!",
            "result" => $res,
            "config" => [
                "host" => $db_host,
                "user" => $db_user,
                "database" => $db_name
            ]
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Falha na query SELECT 1",
            "error" => $e->getMessage()
        ]);
    }
    exit();
}

// Rota de Status / Verificação
if ($endpoint === 'status' || $endpoint === 'db-status' || $endpoint === 'health' || $action === 'status') {
    header("Content-Type: application/json; charset=UTF-8");
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM log_entries");
        $res = $stmt->fetch();
        echo json_encode([
            "success" => true,
            "configured" => true,
            "type" => "Hostinger MySQL",
            "status" => "connected",
            "count" => intval($res['count'] ?? 0)
        ]);
    } catch (Exception $e) {
        echo json_encode([
            "success" => false,
            "status" => "error",
            "error" => $e->getMessage()
        ]);
    }
    exit();
}

// GET - Listar registros
if ($method === 'GET') {
    header("Content-Type: application/json; charset=UTF-8");
    if (!empty($endpoint) && $endpoint !== 'logs') {
        http_response_code(404);
        echo json_encode(["error" => "Rota GET /api/{$endpoint} não encontrada"]);
        exit();
    }
    $stmt = $pdo->query("SELECT * FROM log_entries ORDER BY data DESC, id DESC");
    $rows = $stmt->fetchAll();
    $formatted = array_map(function($row) {
        return [
            "id" => strval($row['id']),
            "data" => $row['data'] ?? '',
            "cidade" => $row['cidade'] ?? '',
            "numero_chamado" => $row['numero_chamado'] ?? '',
            "incidente" => $row['incidente'] ?? '',
            "descricao" => $row['descricao'] ?? '',
            "status" => $row['status'] ?? 'Pendente',
            "data_conclusao" => $row['data_conclusao'] ?? null,
            "created_at" => $row['created_at'] ?? ''
        ];
    }, $rows);
    echo json_encode($formatted);
    exit();
}

// POST - Inserir novo registro
if ($method === 'POST') {
    header("Content-Type: application/json; charset=UTF-8");
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true) ?: [];
    
    $data = $input['data'] ?? '';
    $cidade = $input['cidade'] ?? '';
    $numero_chamado = $input['numero_chamado'] ?? '';
    $incidente = $input['incidente'] ?? '';
    $descricao = $input['descricao'] ?? '';
    $status = $input['status'] ?? 'Pendente';
    $data_conclusao = !empty($input['data_conclusao']) ? $input['data_conclusao'] : null;
    $created_at = $input['created_at'] ?? date('c');

    $stmt = $pdo->prepare("INSERT INTO log_entries (data, cidade, numero_chamado, incidente, descricao, status, data_conclusao, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$data, $cidade, $numero_chamado, $incidente, $descricao, $status, $data_conclusao, $created_at]);
    
    $newId = $pdo->lastInsertId();
    http_response_code(201);
    echo json_encode([
        "id" => strval($newId),
        "data" => $data,
        "cidade" => $cidade,
        "numero_chamado" => $numero_chamado,
        "incidente" => $incidente,
        "descricao" => $descricao,
        "status" => $status,
        "data_conclusao" => $data_conclusao,
        "created_at" => $created_at
    ]);
    exit();
}

// PUT - Atualizar registro existente
if ($method === 'PUT') {
    header("Content-Type: application/json; charset=UTF-8");
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true) ?: [];
    $targetId = $id > 0 ? $id : intval($input['id'] ?? 0);

    $stmt = $pdo->prepare("UPDATE log_entries SET data = ?, cidade = ?, numero_chamado = ?, incidente = ?, descricao = ?, status = ?, data_conclusao = ? WHERE id = ?");
    $stmt->execute([
        $input['data'] ?? '',
        $input['cidade'] ?? '',
        $input['numero_chamado'] ?? '',
        $input['incidente'] ?? '',
        $input['descricao'] ?? '',
        $input['status'] ?? 'Pendente',
        !empty($input['data_conclusao']) ? $input['data_conclusao'] : null,
        $targetId
    ]);

    echo json_encode(array_merge($input, ["id" => strval($targetId)]));
    exit();
}

// DELETE - Excluir registro
if ($method === 'DELETE') {
    header("Content-Type: application/json; charset=UTF-8");
    $targetId = $id;
    if ($targetId <= 0) {
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true) ?: [];
        $targetId = intval($input['id'] ?? 0);
    }
    
    $stmt = $pdo->prepare("DELETE FROM log_entries WHERE id = ?");
    $stmt->execute([$targetId]);
    echo json_encode(["message" => "Registro excluído com sucesso"]);
    exit();
}
