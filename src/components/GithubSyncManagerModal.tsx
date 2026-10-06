import React, { useState, useEffect, useRef } from 'react';
import { 
  RefreshCw, 
  Upload, 
  Github, 
  CheckCircle2, 
  AlertCircle, 
  FileSpreadsheet, 
  ExternalLink, 
  X, 
  HardDrive, 
  Clock, 
  GitCommit, 
  Key, 
  ShieldCheck, 
  HelpCircle,
  ArrowDownCircle,
  FileCheck
} from 'lucide-react';
import { 
  fetchGithubRepoStatus, 
  triggerSyncAllGithubFiles, 
  uploadExcelFileToServer, 
  GithubRepoStatus, 
  fetchGithubFileArrayBuffer 
} from '../lib/githubSync';

interface GithubSyncManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataUpdated?: (fileName?: string) => void;
}

export const GithubSyncManagerModal: React.FC<GithubSyncManagerModalProps> = ({
  isOpen,
  onClose,
  onDataUpdated
}) => {
  const [repoStatus, setRepoStatus] = useState<GithubRepoStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncingFile, setSyncingFile] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [githubToken, setGithubToken] = useState<string>(() => {
    try {
      return localStorage.getItem('CLARO_GITHUB_PAT') || '';
    } catch {
      return '';
    }
  });
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetUploadNameRef = useRef<string>('');

  const loadStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const data = await fetchGithubRepoStatus();
      if (data) {
        setRepoStatus(data);
      }
    } catch (err: any) {
      console.warn('Erro ao carregar status do repositório:', err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStatus();
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveToken = (val: string) => {
    setGithubToken(val);
    try {
      if (val.trim()) {
        localStorage.setItem('CLARO_GITHUB_PAT', val.trim());
      } else {
        localStorage.removeItem('CLARO_GITHUB_PAT');
      }
    } catch {}
  };

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    setStatusMessage({ type: 'info', text: 'Buscando commit mais recente e sincronizando todos os arquivos do GitHub...' });
    try {
      const res = await triggerSyncAllGithubFiles();
      const successCount = res.results.filter(r => r.success).length;
      setStatusMessage({
        type: 'success',
        text: `Sincronização concluída! ${successCount} de ${res.results.length} arquivos atualizados com sucesso do GitHub.`
      });
      await loadStatus();
      if (onDataUpdated) onDataUpdated();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Erro ao sincronizar do GitHub: ${err.message || 'Falha de conexão'}`
      });
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleSyncSingleFile = async (rawUrl: string, fileName: string) => {
    setSyncingFile(fileName);
    setStatusMessage({ type: 'info', text: `Baixando versão mais recente de "${fileName}" do GitHub...` });
    try {
      await fetchGithubFileArrayBuffer(rawUrl);
      setStatusMessage({
        type: 'success',
        text: `Arquivo "${fileName}" sincronizado e atualizado com sucesso do GitHub!`
      });
      await loadStatus();
      if (onDataUpdated) onDataUpdated(fileName);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Não foi possível baixar "${fileName}" do GitHub: ${err.message}`
      });
    } finally {
      setSyncingFile(null);
    }
  };

  const triggerUploadFor = (fileName: string) => {
    targetUploadNameRef.current = fileName;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const targetName = targetUploadNameRef.current || file.name;

    // Create a new File object with target name if different
    const uploadFile = targetName !== file.name 
      ? new File([file], targetName, { type: file.type }) 
      : file;

    setUploadingFile(targetName);
    setStatusMessage({ type: 'info', text: `Enviando "${targetName}" para o servidor...` });

    try {
      const res = await uploadExcelFileToServer(uploadFile, githubToken);
      setStatusMessage({
        type: 'success',
        text: res.message || `Arquivo "${targetName}" atualizado com sucesso!`
      });
      await loadStatus();
      if (onDataUpdated) onDataUpdated(targetName);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Erro ao atualizar "${targetName}": ${err.message}`
      });
    } finally {
      setUploadingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Não disponível';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileInputChange} 
        accept=".xlsx, .xls, .csv" 
        className="hidden" 
      />

      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-800 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight uppercase">Central de Sincronização & Atualização</h2>
                <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                  INDICADORES3
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Sincronize arquivos do GitHub ou envie planilhas atualizadas diretamente para o dashboard
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Status Message Alert */}
          {statusMessage && (
            <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              <div className="flex items-center gap-2.5">
                {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                {statusMessage.type === 'info' && <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />}
                <span>{statusMessage.text}</span>
              </div>
              <button 
                onClick={() => setStatusMessage(null)}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* GitHub Repository Status Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <GitCommit className="w-3.5 h-3.5 text-red-600" />
                <span>Repositório GitHub Oficial</span>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href="https://github.com/carloswladier/INDICADORES3" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-black text-blue-700 hover:underline flex items-center gap-1"
                >
                  carloswladier/INDICADORES3
                  <ExternalLink className="w-3 h-3 text-blue-600" />
                </a>
                <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">
                  main
                </span>
              </div>
              {repoStatus?.latestCommit && (
                <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-800">
                    Último commit: &ldquo;{repoStatus.latestCommit.message}&rdquo;
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3 h-3" />
                    {formatDate(repoStatus.latestCommit.date)}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="font-mono bg-slate-200/80 px-1.5 py-0.5 rounded text-[10px]">
                    {repoStatus.latestCommit.sha}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={loadStatus}
                disabled={isLoadingStatus}
                className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Recarregar informações do GitHub"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStatus ? 'animate-spin' : ''}`} />
                <span>Atualizar Status</span>
              </button>

              <button
                onClick={handleSyncAll}
                disabled={isSyncingAll}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-black uppercase tracking-wide flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
                <span>{isSyncingAll ? 'Sincronizando...' : 'Sincronizar Tudo do GitHub'}</span>
              </button>
            </div>
          </div>

          {/* Files List Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Planilhas do Sistema & Status de Atualização
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                {repoStatus?.files.length || 6} arquivos rastreados
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {(repoStatus?.files || [
                { key: 'at1', fileName: 'DASH AT1 PERSONA_ATUALIZADO.xlsx', label: 'AT1 (Indicadores Técnicos & Persona)', existsLocally: true, sizeBytes: 10724379, modifiedAt: '', rawUrl: 'https://raw.githubusercontent.com/carloswladier/INDICADORES3/main/DASH%20AT1%20PERSONA_ATUALIZADO.xlsx' },
                { key: 'outage', fileName: 'OUTAGE_SGO.xlsx', label: 'Outage SGO (Indisponibilidade)', existsLocally: true, sizeBytes: 8417467, modifiedAt: '', rawUrl: 'https://raw.githubusercontent.com/carloswladier/INDICADORES3/main/OUTAGE_SGO.xlsx' },
                { key: 'revisitaJulDez', fileName: 'REVISITA_30D_Jul_Dez.xlsx', label: 'Revisita 30D (Julho a Dezembro)', existsLocally: true, sizeBytes: 10141542, modifiedAt: '', rawUrl: 'https://raw.githubusercontent.com/carloswladier/INDICADORES3/main/REVISITA_30D_Jul_Dez.xlsx' },
                { key: 'revisitaJanJun', fileName: 'REVISITA_30D_Jan_Jun.xlsx', label: 'Revisita 30D (Janeiro a Junho)', existsLocally: true, sizeBytes: 24956931, modifiedAt: '', rawUrl: 'https://raw.githubusercontent.com/carloswladier/INDICADORES3/main/REVISITA_30D_Jan_Jun.xlsx' },
                { key: 'qoeGpon', fileName: 'QOE_GPON_NORTE.xlsx', label: 'QOE GPON Norte', existsLocally: true, sizeBytes: 12213841, modifiedAt: '', rawUrl: 'https://raw.githubusercontent.com/carloswladier/INDICADORES3/main/QOE_GPON_NORTE.xlsx' },
                { key: 'at5', fileName: 'AT5_NORTE.xlsx', label: 'AT5 Norte', existsLocally: false, sizeBytes: 0, modifiedAt: '', rawUrl: 'https://raw.githubusercontent.com/carloswladier/INDICADORES3/main/AT5_NORTE.xlsx' }
              ]).map((file) => {
                const isThisSyncing = syncingFile === file.fileName;
                const isThisUploading = uploadingFile === file.fileName;

                return (
                  <div key={file.fileName} className="p-3.5 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 truncate">
                          {file.label}
                        </span>
                        {file.existsLocally ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full shrink-0">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full shrink-0">
                            Pendente
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                        <span className="font-mono text-slate-600 text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
                          {file.fileName}
                        </span>
                        {file.sizeBytes > 0 && (
                          <span className="flex items-center gap-1">
                            <HardDrive className="w-3 h-3 text-slate-400" />
                            {formatBytes(file.sizeBytes)}
                          </span>
                        )}
                        {file.modifiedAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formatDate(file.modifiedAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons for this specific file */}
                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                      <button
                        onClick={() => handleSyncSingleFile(file.rawUrl, file.fileName)}
                        disabled={isThisSyncing || isThisUploading}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                        title="Baixar versão mais recente do GitHub"
                      >
                        <ArrowDownCircle className={`w-3.5 h-3.5 text-blue-600 ${isThisSyncing ? 'animate-bounce' : ''}`} />
                        <span>{isThisSyncing ? 'Baixando...' : 'Puxar do GitHub'}</span>
                      </button>

                      <button
                        onClick={() => triggerUploadFor(file.fileName)}
                        disabled={isThisSyncing || isThisUploading}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                        title="Enviar nova versão desta planilha do seu computador"
                      >
                        <Upload className={`w-3.5 h-3.5 ${isThisUploading ? 'animate-bounce' : ''}`} />
                        <span>{isThisUploading ? 'Enviando...' : 'Subir Arquivo Local'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guide Section: "Não consegue atualizar direto no GitHub?" */}
          <div className="border border-blue-200 bg-blue-50/60 rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Não está conseguindo atualizar direto no GitHub?</span>
              </div>
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="text-xs text-blue-700 hover:text-blue-900 font-bold underline"
              >
                {showInstructions ? 'Ocultar instruções' : 'Ver soluções rápidas'}
              </button>
            </div>

            <p className="text-xs text-blue-800 leading-relaxed">
              O GitHub Web possui um limite rígido de upload no navegador (25MB) e frequentemente descarta ou falha em planilhas grandes de indicadores. 
              <strong> Você não precisa passar pelo GitHub para atualizar seus dados!</strong>
            </p>

            {showInstructions && (
              <div className="bg-white rounded-lg p-3.5 border border-blue-200 text-xs text-slate-700 space-y-3 mt-2 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center font-bold">1</span>
                    <span>Opção Mais Rápida: Botão &ldquo;Subir Arquivo Local&rdquo;</span>
                  </div>
                  <p className="text-slate-600 pl-6.5">
                    Clique no botão azul <strong>&ldquo;Subir Arquivo Local&rdquo;</strong> ao lado da planilha desejada na tabela acima. 
                    O arquivo é salvo diretamente no servidor da aplicação e todos os gráficos e relatórios passam a utilizar os novos dados imediatamente.
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center font-bold">2</span>
                    <span>Se preferir atualizar no site do GitHub:</span>
                  </div>
                  <div className="text-slate-600 pl-6.5 space-y-1">
                    <p>1. Acesse: <a href="https://github.com/carloswladier/INDICADORES3" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold">github.com/carloswladier/INDICADORES3</a></p>
                    <p>2. Clique em <strong>&ldquo;Add file&rdquo;</strong> &rarr; <strong>&ldquo;Upload files&rdquo;</strong>.</p>
                    <p>3. Arraste o arquivo com o mesmo nome (ex: <code>DASH AT1 PERSONA_ATUALIZADO.xlsx</code>) e clique em <strong>Commit changes</strong>.</p>
                    <p>4. Em seguida, volte aqui e clique em <strong>&ldquo;Puxar do GitHub&rdquo;</strong> (nosso sistema usa o commit SHA para evitar o cache de 5 minutos do GitHub).</p>
                  </div>
                </div>

                <div className="space-y-1 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[11px] flex items-center justify-center font-bold">3</span>
                      <span>Configurar GitHub Token (Opcional - Envio automático do App para o GitHub)</span>
                    </div>
                    <button
                      onClick={() => setShowTokenInput(!showTokenInput)}
                      className="text-xs text-purple-700 hover:text-purple-900 font-bold underline"
                    >
                      {showTokenInput ? 'Fechar' : 'Configurar Token'}
                    </button>
                  </div>

                  {showTokenInput && (
                    <div className="mt-2 p-3 bg-purple-50 rounded-lg border border-purple-200 space-y-2">
                      <label className="block text-[11px] font-bold text-purple-900">
                        GitHub Personal Access Token (PAT):
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={githubToken}
                          onChange={(e) => handleSaveToken(e.target.value)}
                          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                          className="flex-1 px-3 py-1.5 bg-white border border-purple-300 rounded text-xs font-mono"
                        />
                        <button
                          onClick={() => handleSaveToken('')}
                          className="px-2 py-1 bg-white border border-slate-300 text-slate-600 rounded text-xs font-semibold hover:bg-slate-100"
                        >
                          Limpar
                        </button>
                      </div>
                      <p className="text-[11px] text-purple-700">
                        Com o token configurado, ao clicar em &ldquo;Subir Arquivo Local&rdquo;, o app além de salvar no servidor também realizará o commit direto no repositório GitHub para você!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-5 py-3.5 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Cache-busting ativo: versões sempre sincronizadas com o commit mais recente.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
