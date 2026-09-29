import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Download, 
  FileSpreadsheet, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Filter,
  Layers,
  Maximize2,
  Minimize2,
  Eye,
  Copy,
  Check,
  RotateCcw,
  SlidersHorizontal,
  X,
  Radio,
  Clock,
  Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { VisitData } from '../data';
import { cn } from '../lib/utils';

interface At1AnaliticoTableProps {
  data: VisitData[];
  totalDataCount: number;
}

type SortField = 'fullDate' | 'contrato' | 'cidade' | 'area' | 'tecnologia' | 'tipoOs' | 'status' | 'expurgo' | 'notaAT1' | 'node' | 'tipoEquipamento' | 'cdBaixa';
type SortOrder = 'asc' | 'desc';
type DensityMode = 'compact' | 'normal' | 'spacious';

export const At1AnaliticoTable: React.FC<At1AnaliticoTableProps> = ({ data, totalDataCount }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Executada' | 'Cancelada'>('Todos');
  const [expurgoFilter, setExpurgoFilter] = useState<'Todos' | 'Sem Expurgo' | 'Com Expurgo'>('Todos');
  const [techFilter, setTechFilter] = useState<'Todos' | 'GPON' | 'HFC' | 'HÍBRIDO' | 'OUTROS'>('Todos');
  const [tipoOsFilter, setTipoOsFilter] = useState<string>('Todos');
  
  const [sortField, setSortField] = useState<SortField>('fullDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);
  const [density, setDensity] = useState<DensityMode>('compact');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [selectedRow, setSelectedRow] = useState<VisitData | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Available unique Tipo OS list
  const availableTiposOs = useMemo(() => {
    const set = new Set<string>();
    data.forEach(item => {
      if (item.tipoOs) set.add(item.tipoOs);
    });
    return Array.from(set).sort();
  }, [data]);

  // Toggle sort direction or change column
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Filtered list
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Status filter
      if (statusFilter !== 'Todos' && item.status !== statusFilter) return false;
      
      // Expurgo filter
      if (expurgoFilter === 'Sem Expurgo' && item.expurgo) return false;
      if (expurgoFilter === 'Com Expurgo' && !item.expurgo) return false;
      
      // Tech filter
      if (techFilter !== 'Todos' && item.tecnologia !== techFilter) return false;

      // Tipo OS filter
      if (tipoOsFilter !== 'Todos' && item.tipoOs !== tipoOsFilter) return false;

      // Text search across all relevant fields
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const contractStr = (item.contrato || item.id || '').toLowerCase();
        const cidadeStr = (item.cidade || '').toLowerCase();
        const areaStr = (item.area || '').toLowerCase();
        const techStr = (item.tecnologia || '').toLowerCase();
        const tipoOsStr = (item.tipoOs || '').toLowerCase();
        const nodeStr = (item.node || '').toLowerCase();
        const terminalStr = (item.terminal || '').toLowerCase();
        const cdBaixaStr = (item.cdBaixa || '').toLowerCase();
        const grupoBaixaStr = (item.grupoBaixa || '').toLowerCase();
        const descBaixaStr = (item.descriptionBaixa || '').toLowerCase();
        const eqStr = (item.tipoEquipamento || '').toLowerCase();
        const modStr = (item.modelo || '').toLowerCase();
        const agendaStr = (item.periodoAgenda || '').toLowerCase();

        const match = 
          contractStr.includes(q) ||
          cidadeStr.includes(q) ||
          areaStr.includes(q) ||
          techStr.includes(q) ||
          tipoOsStr.includes(q) ||
          nodeStr.includes(q) ||
          terminalStr.includes(q) ||
          cdBaixaStr.includes(q) ||
          grupoBaixaStr.includes(q) ||
          descBaixaStr.includes(q) ||
          eqStr.includes(q) ||
          modStr.includes(q) ||
          agendaStr.includes(q);

        if (!match) return false;
      }

      return true;
    });
  }, [data, statusFilter, expurgoFilter, techFilter, tipoOsFilter, searchTerm]);

  // Sorted list
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'contrato') {
        valA = a.contrato || a.id || '';
        valB = b.contrato || b.id || '';
      } else if (sortField === 'fullDate') {
        valA = a.fullDate ? new Date(a.fullDate).getTime() : 0;
        valB = b.fullDate ? new Date(b.fullDate).getTime() : 0;
      } else if (sortField === 'notaAT1') {
        valA = Number(a.notaAT1) || 0;
        valB = Number(b.notaAT1) || 0;
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortField, sortOrder]);

  // Summary KPIs for filtered dataset
  const summaryKpis = useMemo(() => {
    const total = sortedData.length;
    if (total === 0) {
      return { total: 0, executadas: 0, canceladas: 0, expurgos: 0, txResolucao: 0, mediaNota: 0, gponCount: 0, hfcCount: 0 };
    }
    let exec = 0;
    let canc = 0;
    let exp = 0;
    let sumNota = 0;
    let countNota = 0;
    let gpon = 0;
    let hfc = 0;

    for (const r of sortedData) {
      if (r.status === 'Executada') exec++;
      if (r.status === 'Cancelada') canc++;
      if (r.expurgo) exp++;
      if (Number(r.notaAT1) > 0) {
        sumNota += Number(r.notaAT1);
        countNota++;
      }
      if (r.tecnologia === 'GPON') gpon++;
      if (r.tecnologia === 'HFC') hfc++;
    }

    return {
      total,
      executadas: exec,
      canceladas: canc,
      expurgos: exp,
      txResolucao: total > 0 ? (exec / total) * 100 : 0,
      mediaNota: countNota > 0 ? sumNota / countNota : 0,
      gponCount: gpon,
      hfcCount: hfc
    };
  }, [sortedData]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const currentSafePage = Math.min(currentPage, totalPages);
  const startIndex = (currentSafePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, sortedData.length);
  const paginatedRows = useMemo(() => {
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, startIndex, endIndex]);

  // Copy to clipboard helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Export to Excel / CSV
  const handleExport = (format: 'xlsx' | 'csv') => {
    if (sortedData.length === 0) return;

    const rowsToExport = sortedData.map((row, idx) => ({
      'Item': idx + 1,
      'Data': row.fullDate ? new Date(row.fullDate).toLocaleDateString('pt-BR') : '',
      'Mês': row.mes || '',
      'Contrato / OS': row.contrato || row.id || '',
      'Cidade': row.cidade || '',
      'Área': row.area || '',
      'Tecnologia': row.tecnologia || '',
      'Tipo de OS': row.tipoOs || 'REPARO',
      'Tipo de Equipamento': row.tipoEquipamento || '',
      'Modelo': row.modelo || '',
      'Janela de Agenda': row.periodoAgenda || '',
      'Status': row.status || '',
      'Expurgo': row.expurgo ? 'Sim' : 'Não',
      'Nota AT1': Number(row.notaAT1 || 0).toFixed(1),
      'Node': row.node || '',
      'Terminal': row.terminal || '',
      'Grupo Baixa': row.grupoBaixa || '',
      'Código Baixa': row.cdBaixa || '',
      'Descrição Baixa': row.descriptionBaixa || ''
    }));

    const ws = XLSX.utils.json_to_sheet(rowsToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Analitico_AT1');

    const fileName = `Analitico_AT1_${new Date().toISOString().slice(0, 10)}.${format}`;
    XLSX.writeFile(wb, fileName, { bookType: format });
  };

  // Helper for sort icon
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-50 group-hover:opacity-100 transition-opacity" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-[#EE1D23] font-black" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[#EE1D23] font-black" />
    );
  };

  // Density styling tokens
  const densityStyles = {
    compact: {
      th: 'py-2.5 px-3 text-[10px]',
      td: 'py-2 px-3 text-[11px]',
      badge: 'text-[9px] px-1.5 py-0.2',
      rowHeight: 'h-9'
    },
    normal: {
      th: 'py-3.5 px-3.5 text-[11px]',
      td: 'py-3 px-3.5 text-xs',
      badge: 'text-[10px] px-2 py-0.5',
      rowHeight: 'h-12'
    },
    spacious: {
      th: 'py-4 px-4 text-xs',
      td: 'py-4 px-4 text-xs',
      badge: 'text-[11px] px-2.5 py-1',
      rowHeight: 'h-14'
    }
  }[density];

  const hasActiveFilters = statusFilter !== 'Todos' || expurgoFilter !== 'Todos' || techFilter !== 'Todos' || tipoOsFilter !== 'Todos' || Boolean(searchTerm);

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('Todos');
    setExpurgoFilter('Todos');
    setTechFilter('Todos');
    setTipoOsFilter('Todos');
    setCurrentPage(1);
  };

  return (
    <section 
      id="at1-analitico-view" 
      className={cn(
        "At1AnaliticoTable w-full mx-auto my-4 transition-all duration-200",
        isExpanded 
          ? "fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto flex flex-col" 
          : "max-w-full px-1 sm:px-2"
      )}
    >
      <div className={cn(
        "bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200/90 overflow-hidden flex flex-col transition-all",
        isExpanded ? "flex-1 min-h-[92vh] max-w-[99vw] mx-auto w-full" : "w-full"
      )}>
        
        {/* Header Section: Title, Stats and Quick Export */}
        <div className="p-4 sm:p-6 border-b border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-red-50/20">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            
            {/* Title & Description */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-200/60 flex items-center justify-center text-[#EE1D23] shadow-xs shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-black uppercase italic tracking-tight text-slate-900">
                    Visão Analítica de Ordens de Serviço (AT1)
                  </h3>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-100/70 text-red-700 border border-red-200">
                    <Sparkles className="w-3 h-3" />
                    Alta Densidade
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Detalhamento individual das visitas técnicas, notas AT1, contratos, expurgos e códigos de baixa.
                </p>
              </div>
            </div>

            {/* Quick Action Buttons & Toolbar Controls */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Density Switch */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setDensity('compact')}
                  className={cn(
                    "px-2.5 py-1.5 text-[11px] font-black uppercase italic rounded-lg transition-all cursor-pointer",
                    density === 'compact' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  )}
                  title="Modo Compacto: Máximo de registros na tela"
                >
                  Compacto
                </button>
                <button
                  type="button"
                  onClick={() => setDensity('normal')}
                  className={cn(
                    "px-2.5 py-1.5 text-[11px] font-black uppercase italic rounded-lg transition-all cursor-pointer",
                    density === 'normal' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  )}
                  title="Modo Normal"
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => setDensity('spacious')}
                  className={cn(
                    "px-2.5 py-1.5 text-[11px] font-black uppercase italic rounded-lg transition-all cursor-pointer",
                    density === 'spacious' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  )}
                  title="Modo Confortável"
                >
                  Amplo
                </button>
              </div>

              {/* Fullscreen / Expand Toggle */}
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                  "flex items-center gap-1.5 font-black py-1.5 px-3 rounded-xl border transition-all text-xs uppercase italic cursor-pointer shadow-xs",
                  isExpanded 
                    ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800" 
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                )}
                title={isExpanded ? "Restaurar tamanho normal" : "Aproveitar todo o espaço da tela (Expandir)"}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isExpanded ? "Reduzir" : "Tela Cheia"}</span>
              </button>

              {/* Export to Excel */}
              <button
                id="btn-export-excel-at1"
                type="button"
                onClick={() => handleExport('xlsx')}
                disabled={sortedData.length === 0}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-1.5 px-3.5 rounded-xl transition-all shadow-xs active:scale-95 text-xs uppercase italic cursor-pointer disabled:opacity-50"
                title="Exportar todos os registros filtrados para Excel (.xlsx)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Excel ({sortedData.length.toLocaleString()})</span>
              </button>

              {/* Export to CSV */}
              <button
                id="btn-export-csv-at1"
                type="button"
                onClick={() => handleExport('csv')}
                disabled={sortedData.length === 0}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-1.5 px-3 rounded-xl transition-all active:scale-95 text-xs uppercase italic cursor-pointer disabled:opacity-50 border border-slate-200/60"
                title="Exportar formato CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Cards Strip: Aproveitar todo o espaço horizontal */}
          <div className="mt-4 pt-3 border-t border-slate-200/70 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {/* Total Filtrado */}
            <div className="bg-white/90 border border-slate-200/80 rounded-xl p-2.5 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Total Filtrado</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base sm:text-lg font-black text-slate-900 font-mono tabular-nums">{summaryKpis.total.toLocaleString()}</span>
                {totalDataCount > 0 && (
                  <span className="text-[10px] text-slate-400 font-bold truncate">/ {totalDataCount.toLocaleString()}</span>
                )}
              </div>
            </div>

            {/* Executadas */}
            <div className="bg-emerald-50/50 border border-emerald-200/70 rounded-xl p-2.5 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-emerald-700 block tracking-wider">Executadas</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-base sm:text-lg font-black text-emerald-800 font-mono tabular-nums">{summaryKpis.executadas.toLocaleString()}</span>
                <span className="text-[10px] font-black text-emerald-600 font-mono tabular-nums">
                  ({summaryKpis.txResolucao.toFixed(1)}%)
                </span>
              </div>
            </div>

            {/* Canceladas */}
            <div className="bg-red-50/50 border border-red-200/70 rounded-xl p-2.5 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-red-700 block tracking-wider">Canceladas</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-base sm:text-lg font-black text-red-800 font-mono tabular-nums">{summaryKpis.canceladas.toLocaleString()}</span>
                <span className="text-[10px] font-black text-red-600 font-mono tabular-nums">
                  ({summaryKpis.total > 0 ? ((summaryKpis.canceladas / summaryKpis.total) * 100).toFixed(1) : '0.0'}%)
                </span>
              </div>
            </div>

            {/* Com Expurgo */}
            <div className="bg-amber-50/50 border border-amber-200/70 rounded-xl p-2.5 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-amber-700 block tracking-wider">Expurgos</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base sm:text-lg font-black text-amber-800 font-mono tabular-nums">{summaryKpis.expurgos.toLocaleString()}</span>
                <span className="text-[10px] font-black text-amber-600 font-mono tabular-nums">
                  ({summaryKpis.total > 0 ? ((summaryKpis.expurgos / summaryKpis.total) * 100).toFixed(1) : '0.0'}%)
                </span>
              </div>
            </div>

            {/* Média Nota AT1 */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-slate-500 block tracking-wider">Média Nota AT1</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className={cn(
                  "text-base sm:text-lg font-black font-mono tabular-nums",
                  summaryKpis.mediaNota >= 8.5 ? "text-emerald-700" : summaryKpis.mediaNota >= 7.0 ? "text-amber-700" : "text-red-700"
                )}>
                  {summaryKpis.mediaNota > 0 ? summaryKpis.mediaNota.toFixed(2) : '-'}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">/ 10</span>
              </div>
            </div>

            {/* GPON vs HFC */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 shadow-2xs">
              <span className="text-[10px] font-black uppercase text-slate-500 block tracking-wider">Tecnologias</span>
              <div className="flex items-center gap-2 mt-1 text-[11px] font-black font-mono tabular-nums">
                <span className="text-emerald-700">GPON: {summaryKpis.gponCount}</span>
                <span className="text-slate-300">|</span>
                <span className="text-blue-700">HFC: {summaryKpis.hfcCount}</span>
              </div>
            </div>
          </div>

          {/* Quick Filters and Search Toolbar: Full space row */}
          <div className="mt-4 pt-3 border-t border-slate-200/70 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2.5">
            {/* Search Input */}
            <div className="md:col-span-4 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-search-at1-analitico"
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Buscar contrato, cidade, área, tipo OS, equipamento, node..."
                className="w-full pl-10 pr-7 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-[#EE1D23] transition-all shadow-2xs"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-black p-0.5"
                  title="Limpar busca"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="md:col-span-2">
              <select
                id="select-status-at1-analitico"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#EE1D23] transition-all cursor-pointer shadow-2xs"
              >
                <option value="Todos">Status: Todos</option>
                <option value="Executada">Executada</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>

            {/* Expurgo Filter */}
            <div className="md:col-span-2">
              <select
                id="select-expurgo-at1-analitico"
                value={expurgoFilter}
                onChange={(e) => {
                  setExpurgoFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#EE1D23] transition-all cursor-pointer shadow-2xs"
              >
                <option value="Todos">Expurgo: Todos</option>
                <option value="Sem Expurgo">Sem Expurgo</option>
                <option value="Com Expurgo">Com Expurgo</option>
              </select>
            </div>

            {/* Tecnologia Filter */}
            <div className="md:col-span-2">
              <select
                id="select-tech-at1-analitico"
                value={techFilter}
                onChange={(e) => {
                  setTechFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#EE1D23] transition-all cursor-pointer shadow-2xs"
              >
                <option value="Todos">Tecnologia: Todas</option>
                <option value="GPON">GPON</option>
                <option value="HFC">HFC</option>
                <option value="HÍBRIDO">HÍBRIDO</option>
                <option value="OUTROS">OUTROS</option>
              </select>
            </div>

            {/* Tipo OS Filter */}
            <div className="md:col-span-2">
              <select
                id="select-tipo-os-at1-analitico"
                value={tipoOsFilter}
                onChange={(e) => {
                  setTipoOsFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#EE1D23] transition-all cursor-pointer shadow-2xs"
              >
                <option value="Todos">Tipo OS: Todos</option>
                {availableTiposOs.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Feedback Bar */}
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-2">
              <span>
                Exibindo <strong className="text-slate-900 font-mono tabular-nums">{paginatedRows.length}</strong> de <strong className="text-slate-900 font-mono tabular-nums">{sortedData.length.toLocaleString()}</strong> ordens filtradas
              </span>
              {selectedRow && (
                <span className="inline-flex items-center gap-1 text-[11px] bg-red-100 text-red-700 px-2 py-0.5 rounded-md font-bold">
                  Contrato selecionado: {selectedRow.contrato || selectedRow.id}
                  <button onClick={() => setSelectedRow(null)} className="hover:text-red-900 cursor-pointer ml-1">✕</button>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[11px] font-black text-[#EE1D23] hover:underline cursor-pointer flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpar filtros da tabela</span>
                </button>
              )}

              {/* Rows Per Page */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold">
                <span>Por página:</span>
                <select
                  id="select-pagesize-at1-analitico"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="py-1 px-2 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-800 focus:outline-none focus:border-[#EE1D23] cursor-pointer"
                >
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                  <option value={500}>500</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Table Body Container: Full Space with Sticky Header and Sticky Identification Columns */}
        <div className={cn(
          "w-full overflow-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100",
          isExpanded ? "flex-1 min-h-[500px]" : "max-h-[calc(100vh-270px)] min-h-[440px]"
        )}>
          <table className="At1AnaliticoTable w-full text-left border-collapse table-auto min-w-[1200px]">
            <thead>
              <tr className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 text-slate-600 font-black uppercase tracking-wider select-none shadow-2xs">
                
                {/* 1. Data (Sticky Col 1) */}
                <th 
                  onClick={() => handleSort('fullDate')}
                  className={cn(
                    "cursor-pointer hover:bg-slate-200/70 transition-colors group sticky left-0 z-30 bg-slate-100/95 min-w-[105px]",
                    densityStyles.th,
                    sortField === 'fullDate' && "text-[#EE1D23] bg-red-50/50"
                  )}
                  title="Ordenar por Data"
                >
                  <div className="flex items-center gap-1">
                    <span>Data</span>
                    {renderSortIcon('fullDate')}
                  </div>
                </th>

                {/* 2. Contrato / OS (Sticky Col 2) */}
                <th 
                  onClick={() => handleSort('contrato')}
                  className={cn(
                    "cursor-pointer hover:bg-slate-200/70 transition-colors group sticky left-[105px] z-30 bg-slate-100/95 min-w-[135px] border-r border-slate-200",
                    densityStyles.th,
                    sortField === 'contrato' && "text-[#EE1D23] bg-red-50/50"
                  )}
                  title="Ordenar por Contrato ou OS"
                >
                  <div className="flex items-center gap-1">
                    <span>Contrato / OS</span>
                    {renderSortIcon('contrato')}
                  </div>
                </th>

                {/* 3. Cidade */}
                <th 
                  onClick={() => handleSort('cidade')}
                  className={cn(
                    "cursor-pointer hover:bg-slate-200/70 transition-colors group min-w-[120px]",
                    densityStyles.th,
                    sortField === 'cidade' && "text-[#EE1D23] bg-red-50/50"
                  )}
                  title="Ordenar por Cidade"
                >
                  <div className="flex items-center gap-1">
                    <span>Cidade</span>
                    {renderSortIcon('cidade')}
                  </div>
                </th>

                {/* 4. Área */}
                <th 
                  onClick={() => handleSort('area')}
                  className={cn(
                    "cursor-pointer hover:bg-slate-200/70 transition-colors group min-w-[100px]",
                    densityStyles.th,
                    sortField === 'area' && "text-[#EE1D23] bg-red-50/50"
                  )}
                  title="Ordenar por Área"
                >
                  <div className="flex items-center gap-1">
                    <span>Área</span>
                    {renderSortIcon('area')}
                  </div>
                </th>

                {/* 5. Tecnologia */}
                <th 
                  onClick={() => handleSort('tecnologia')}
                  className={cn(
                    "cursor-pointer hover:bg-slate-200/70 transition-colors group min-w-[100px]",
                    densityStyles.th,
                    sortField === 'tecnologia' && "text-[#EE1D23] bg-red-50/50"
                  )}
                  title="Ordenar por Tecnologia"
                >
                  <div className="flex items-center gap-1">
                    <span>Tecnologia</span>
                    {renderSortIcon('tecnologia')}
                  </div>
                </th>

                {/* 6. Tipo de OS */}
                <th 
                  onClick={() => handleSort('tipoOs')}
                  className={cn(
                    "cursor-pointer hover:bg-slate-200/70 transition-colors group min-w-[110px]",
                    densityStyles.th,
                    sortField === 'tipoOs' && "text-[#EE1D23] bg-red-50/50"
                  )}
                  title="Ordenar por Tipo de OS"
                >
                  <div className="flex items-center gap-1">
                    <span>Tipo de OS</span>
                    {renderSortIcon('tipoOs')}
                  </div>
                </th>

                {/* 7. Status */}
                <th 
                  onClick={() => handleSort('status')}
                  className={cn(
                    "cursor-pointer hover:bg-slate-200/70 transition-colors group text-center min-w-[100px]",
                    densityStyles.th,
                    sortField === 'status' && "text-[#EE1D23] bg-red-50/50"
                  )}
                  title="Ordenar por Status"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Status</span>
                    {renderSortIcon('status')}
                  </div>
                </th>

                {/* 8. Expurgo */}
                <th 
                  onClick={() => handleSort('expurgo')}
                  className={cn(
                    "cursor-pointer hover:bg-slate-200/70 transition-colors group text-center min-w-[85px]",
                    densityStyles.th,
                    sortField === 'expurgo' && "text-[#EE1D23] bg-red-50/50"
                  )}
                  title="Ordenar por Expurgo"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Expurgo</span>
                    {renderSortIcon('expurgo')}
                  </div>
                </th>

                {/* 9. Nota AT1 */}
                <th 
                  onClick={() => handleSort('notaAT1')}
                  className={cn(
                    "cursor-pointer hover:bg-slate-200/70 transition-colors group text-center min-w-[90px]",
                    densityStyles.th,
                    sortField === 'notaAT1' && "text-[#EE1D23] bg-red-50/50"
                  )}
                  title="Ordenar por Nota AT1"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Nota AT1</span>
                    {renderSortIcon('notaAT1')}
                  </div>
                </th>

                {/* 10. Node / Terminal */}
                <th 
                  onClick={() => handleSort('node')}
                  className={cn(
                    "cursor-pointer hover:bg-slate-200/70 transition-colors group min-w-[110px]",
                    densityStyles.th,
                    sortField === 'node' && "text-[#EE1D23] bg-red-50/50"
                  )}
                  title="Ordenar por Node"
                >
                  <div className="flex items-center gap-1">
                    <span>Node / Terminal</span>
                    {renderSortIcon('node')}
                  </div>
                </th>

                {/* 11. Equipamento / Modelo / Janela */}
                <th 
                  onClick={() => handleSort('tipoEquipamento')}
                  className={cn(
                    "cursor-pointer hover:bg-slate-200/70 transition-colors group min-w-[150px]",
                    densityStyles.th,
                    sortField === 'tipoEquipamento' && "text-[#EE1D23] bg-red-50/50"
                  )}
                  title="Ordenar por Equipamento"
                >
                  <div className="flex items-center gap-1">
                    <span>Equipamento / Janela</span>
                    {renderSortIcon('tipoEquipamento')}
                  </div>
                </th>

                {/* 12. Grupo & Código de Baixa */}
                <th 
                  onClick={() => handleSort('cdBaixa')}
                  className={cn(
                    "cursor-pointer hover:bg-slate-200/70 transition-colors group min-w-[180px]",
                    densityStyles.th,
                    sortField === 'cdBaixa' && "text-[#EE1D23] bg-red-50/50"
                  )}
                  title="Ordenar por Código de Baixa"
                >
                  <div className="flex items-center gap-1">
                    <span>Grupo / Cód. Baixa</span>
                    {renderSortIcon('cdBaixa')}
                  </div>
                </th>

                {/* 13. Ações / Detalhes */}
                <th className={cn("text-center min-w-[70px]", densityStyles.th)}>
                  <span>Ações</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedRows.map((row, idx) => {
                const isExecuted = row.status === 'Executada';
                const isSelected = selectedRow?.id === row.id;
                const formattedDate = row.fullDate 
                  ? new Date(row.fullDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                  : row.mes;

                // Tech color
                const techColors: Record<string, string> = {
                  'GPON': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  'HFC': 'bg-blue-50 text-blue-700 border-blue-200',
                  'HÍBRIDO': 'bg-purple-50 text-purple-700 border-purple-200',
                  'OUTROS': 'bg-slate-100 text-slate-700 border-slate-200'
                };

                // Tipo OS color
                const tipoOs = row.tipoOs || 'REPARO';
                const isReparo = tipoOs.includes('REPARO');
                const isInstalacao = tipoOs.includes('INSTAL') || tipoOs.includes('ATIV');
                const tipoOsColor = isInstalacao
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : isReparo
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200';

                return (
                  <tr 
                    key={`${row.id}-${idx}`}
                    onClick={() => setSelectedRow(isSelected ? null : row)}
                    className={cn(
                      "group transition-all duration-100 border-b border-slate-100 cursor-pointer select-none",
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50/45",
                      isSelected && "is-selected !bg-red-50/90 shadow-xs ring-1 ring-inset ring-red-400/60 font-bold",
                      densityStyles.rowHeight
                    )}
                    title="Clique para selecionar e fixar a linha na visualização"
                  >
                    
                    {/* 1. Data (Sticky Col 1 with Row-Hover Left Accent) */}
                    <td className={cn(
                      "whitespace-nowrap font-medium font-mono tabular-nums sticky left-0 z-10 transition-colors border-l-4",
                      isSelected ? "border-l-[#EE1D23] bg-red-50/90 text-red-950" : "border-l-transparent group-hover:border-l-[#EE1D23] bg-inherit text-slate-600 group-hover:text-slate-950",
                      densityStyles.td
                    )}>
                      {formattedDate}
                    </td>

                    {/* 2. Contrato / OS (Sticky Col 2) */}
                    <td className={cn(
                      "whitespace-nowrap sticky left-[105px] z-10 transition-colors border-r border-slate-200/90",
                      isSelected ? "bg-red-50/90" : "bg-inherit",
                      densityStyles.td
                    )}>
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "font-mono font-bold px-2 py-0.5 rounded-md border text-[11px] transition-colors tabular-nums",
                          isSelected 
                            ? "bg-white text-red-700 border-red-300 shadow-2xs" 
                            : "bg-slate-100/90 text-slate-900 border-slate-200 group-hover:bg-white group-hover:border-red-300 group-hover:text-red-700"
                        )}>
                          {row.contrato || row.id}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(row.contrato || row.id || '', `contract-${row.id}`);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-slate-700"
                          title="Copiar Contrato / OS"
                        >
                          {copiedKey === `contract-${row.id}` ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* 3. Cidade */}
                    <td className={cn(
                      "font-bold whitespace-nowrap transition-colors",
                      isSelected ? "text-slate-950" : "text-slate-800 group-hover:text-slate-950",
                      densityStyles.td
                    )}>
                      {row.cidade}
                    </td>

                    {/* 4. Área */}
                    <td className={cn(
                      "whitespace-nowrap transition-colors",
                      isSelected ? "text-slate-900 font-bold" : "text-slate-600 group-hover:text-slate-900",
                      densityStyles.td
                    )}>
                      {row.area}
                    </td>

                    {/* 5. Tecnologia */}
                    <td className={cn("whitespace-nowrap", densityStyles.td)}>
                      <span className={cn(
                        "font-black uppercase rounded-full border tracking-wide",
                        densityStyles.badge,
                        techColors[row.tecnologia] || techColors['OUTROS']
                      )}>
                        {row.tecnologia}
                      </span>
                    </td>

                    {/* 6. Tipo de OS */}
                    <td className={cn("whitespace-nowrap", densityStyles.td)}>
                      <span className={cn(
                        "font-black uppercase rounded-md border tracking-wide",
                        densityStyles.badge,
                        tipoOsColor
                      )}>
                        {tipoOs}
                      </span>
                    </td>

                    {/* 7. Status */}
                    <td className={cn("text-center whitespace-nowrap", densityStyles.td)}>
                      {isExecuted ? (
                        <span className={cn(
                          "inline-flex items-center gap-1 font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full",
                          densityStyles.badge
                        )}>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          Executada
                        </span>
                      ) : (
                        <span className={cn(
                          "inline-flex items-center gap-1 font-black uppercase bg-red-50 text-red-600 border border-red-200 rounded-full",
                          densityStyles.badge
                        )}>
                          <XCircle className="w-3 h-3 text-red-500 shrink-0" />
                          Cancelada
                        </span>
                      )}
                    </td>

                    {/* 8. Expurgo */}
                    <td className={cn("text-center whitespace-nowrap", densityStyles.td)}>
                      {row.expurgo ? (
                        <span className={cn(
                          "inline-flex items-center gap-1 font-black uppercase bg-red-100 text-red-700 border border-red-200 rounded-md",
                          densityStyles.badge
                        )}>
                          <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
                          Sim
                        </span>
                      ) : (
                        <span className={cn(
                          "font-bold text-slate-400 bg-slate-100/70 border border-slate-200 rounded-md",
                          densityStyles.badge
                        )}>
                          Não
                        </span>
                      )}
                    </td>

                    {/* 9. Nota AT1 */}
                    <td className={cn("text-center whitespace-nowrap", densityStyles.td)}>
                      {Number(row.notaAT1) > 0 ? (
                        <span className={cn(
                          "inline-block font-black font-mono tabular-nums rounded-lg border",
                          densityStyles.badge,
                          row.notaAT1 >= 8.5
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : row.notaAT1 >= 7.0
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-red-50 text-red-600 border-red-200"
                        )}>
                          {Number(row.notaAT1).toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-slate-300 font-bold">-</span>
                      )}
                    </td>

                    {/* 10. Node / Terminal */}
                    <td className={cn("whitespace-nowrap", densityStyles.td)}>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 group-hover:text-slate-950 font-mono text-[11px]">{row.node || 'N/A'}</span>
                        <span className="text-slate-400 font-mono text-[10px]">{row.terminal || 'N/A'}</span>
                      </div>
                    </td>

                    {/* 11. Equipamento / Janela */}
                    <td className={cn("whitespace-nowrap", densityStyles.td)}>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 group-hover:text-slate-950 truncate max-w-[180px]">
                          {row.tipoEquipamento && row.tipoEquipamento !== 'NÃO INFORMADO' ? row.tipoEquipamento : (row.modelo || 'N/A')}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {row.modelo && row.modelo !== 'NÃO INFORMADO' && row.tipoEquipamento !== row.modelo && (
                            <span className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]" title={row.modelo}>
                              {row.modelo}
                            </span>
                          )}
                          {row.periodoAgenda && row.periodoAgenda !== 'NÃO INFORMADO' && (
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-bold border border-slate-200 shrink-0">
                              {row.periodoAgenda}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 12. Grupo & Código Baixa */}
                    <td className={cn("whitespace-nowrap", densityStyles.td)}>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 group-hover:text-slate-950 text-[11px]">{row.grupoBaixa || 'N/A'}</span>
                          {row.cdBaixa && row.cdBaixa !== 'N/A' && (
                            <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-600 border border-slate-200">
                              {row.cdBaixa}
                            </span>
                          )}
                        </div>
                        {row.descriptionBaixa && row.descriptionBaixa !== 'N/A' && (
                          <span className="text-[10px] text-slate-400 group-hover:text-slate-600 truncate max-w-[240px]" title={row.descriptionBaixa}>
                            {row.descriptionBaixa}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 13. Ações / Ver Detalhes */}
                    <td className={cn("text-center whitespace-nowrap", densityStyles.td)}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRow(row);
                        }}
                        className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-[#EE1D23] transition-colors cursor-pointer"
                        title="Ver dossiê completo deste registro"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>

                  </tr>
                );
              })}

              {paginatedRows.length === 0 && (
                <tr>
                  <td colSpan={13} className="py-14 text-center text-slate-400 font-bold text-xs">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Filter className="w-8 h-8 text-slate-300" />
                      <p className="text-slate-600 font-black">Nenhum registro encontrado</p>
                      <p className="text-slate-400 text-[11px]">Tente ajustar a busca ou limpar os filtros aplicados.</p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="mt-2 text-xs font-black text-white bg-[#EE1D23] px-3.5 py-1.5 rounded-xl hover:bg-red-600 transition-colors shadow-xs"
                        >
                          Redefinir Filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer: Full Width Controls */}
        <div className="p-3.5 sm:p-5 border-t border-slate-200/80 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
          <div className="text-xs font-semibold text-slate-600">
            Mostrando <strong className="text-slate-900 font-mono tabular-nums">{sortedData.length > 0 ? startIndex + 1 : 0}</strong> a <strong className="text-slate-900 font-mono tabular-nums">{endIndex}</strong> de <strong className="text-slate-900 font-mono tabular-nums">{sortedData.length.toLocaleString()}</strong> registros
            {hasActiveFilters && totalDataCount > 0 && (
              <span className="text-slate-400"> (filtrados de {totalDataCount.toLocaleString()} totais)</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 self-center sm:self-auto">
            {/* First Page */}
            <button
              id="btn-page-first"
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={currentSafePage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-2xs"
              title="Primeira Página"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* Prev Page */}
            <button
              id="btn-page-prev"
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentSafePage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-2xs"
              title="Página Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 text-xs font-black text-slate-800 font-mono tabular-nums">
              Página {currentSafePage} de {totalPages}
            </span>

            {/* Next Page */}
            <button
              id="btn-page-next"
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentSafePage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-2xs"
              title="Próxima Página"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Last Page */}
            <button
              id="btn-page-last"
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentSafePage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer shadow-2xs"
              title="Última Página"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Record Details Modal: Dossiê Completo da Ordem Selecionada */}
      {selectedRow && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedRow(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#EE1D23] flex items-center justify-center font-black">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 uppercase italic">
                    Dossiê de Ordem de Serviço
                  </h4>
                  <p className="text-xs font-mono font-bold text-slate-500">
                    Contrato / OS: <strong className="text-[#EE1D23]">{selectedRow.contrato || selectedRow.id}</strong>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRow(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Grid */}
            <div className="mt-5 space-y-4 text-xs">
              
              {/* Status & Scores */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Status</span>
                  <span className={cn(
                    "font-black mt-0.5 inline-block text-xs uppercase",
                    selectedRow.status === 'Executada' ? "text-emerald-700" : "text-red-600"
                  )}>
                    {selectedRow.status}
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Nota AT1</span>
                  <span className="font-mono font-black mt-0.5 inline-block text-xs text-slate-900">
                    {Number(selectedRow.notaAT1) > 0 ? Number(selectedRow.notaAT1).toFixed(1) : 'Sem Nota'}
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Expurgo</span>
                  <span className={cn(
                    "font-black mt-0.5 inline-block text-xs uppercase",
                    selectedRow.expurgo ? "text-red-600" : "text-slate-600"
                  )}>
                    {selectedRow.expurgo ? 'Sim' : 'Não'}
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Tecnologia</span>
                  <span className="font-black mt-0.5 inline-block text-xs text-slate-900 uppercase">
                    {selectedRow.tecnologia}
                  </span>
                </div>
              </div>

              {/* Localização e Data */}
              <div className="border border-slate-200/80 rounded-2xl p-4 bg-slate-50/50 space-y-2">
                <h5 className="font-black text-slate-800 uppercase text-[11px] tracking-wider text-slate-400">Dados de Localização & Agenda</h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Cidade</span>
                    <span className="font-bold text-slate-900">{selectedRow.cidade}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Área</span>
                    <span className="font-bold text-slate-900">{selectedRow.area}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Data da Visita</span>
                    <span className="font-mono font-bold text-slate-900">
                      {selectedRow.fullDate ? new Date(selectedRow.fullDate).toLocaleDateString('pt-BR') : selectedRow.mes}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Janela de Agenda</span>
                    <span className="font-bold text-slate-900">{selectedRow.periodoAgenda || 'NÃO INFORMADO'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Tipo de OS</span>
                    <span className="font-bold text-slate-900">{selectedRow.tipoOs || 'REPARO'}</span>
                  </div>
                </div>
              </div>

              {/* Rede & Equipamento */}
              <div className="border border-slate-200/80 rounded-2xl p-4 bg-slate-50/50 space-y-2">
                <h5 className="font-black uppercase text-[11px] tracking-wider text-slate-400">Rede & Equipamento</h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Node</span>
                    <span className="font-mono font-bold text-slate-900">{selectedRow.node || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Terminal</span>
                    <span className="font-mono font-bold text-slate-900">{selectedRow.terminal || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Tipo Equipamento</span>
                    <span className="font-bold text-slate-900">{selectedRow.tipoEquipamento || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Modelo</span>
                    <span className="font-bold text-slate-900 font-mono text-[11px]">{selectedRow.modelo || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Baixa Técnica */}
              <div className="border border-slate-200/80 rounded-2xl p-4 bg-slate-50/50 space-y-2">
                <h5 className="font-black uppercase text-[11px] tracking-wider text-slate-400">Informações de Baixa Técnica</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Grupo de Baixa</span>
                    <span className="font-bold text-slate-900">{selectedRow.grupoBaixa || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Código de Baixa</span>
                    <span className="font-mono font-bold text-slate-900">{selectedRow.cdBaixa || 'N/A'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold block">Descrição da Baixa</span>
                    <span className="font-semibold text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200 block text-xs">
                      {selectedRow.descriptionBaixa || 'Nenhuma descrição informada'}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const text = `Contrato: ${selectedRow.contrato || selectedRow.id}\nCidade: ${selectedRow.cidade}\nStatus: ${selectedRow.status}\nTecnologia: ${selectedRow.tecnologia}\nTipo OS: ${selectedRow.tipoOs}\nEquipamento: ${selectedRow.tipoEquipamento || selectedRow.modelo}\nBaixa: [${selectedRow.cdBaixa}] ${selectedRow.descriptionBaixa}`;
                  handleCopy(text, 'modal-summary');
                }}
                className="flex items-center gap-1.5 text-xs font-black text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                {copiedKey === 'modal-summary' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'modal-summary' ? 'Copiado!' : 'Copiar Resumo'}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRow(null)}
                className="text-xs font-black text-white bg-slate-900 hover:bg-slate-800 px-5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

    </section>
  );
};
