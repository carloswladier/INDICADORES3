import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  MousePointerClick, 
  Check, 
  Percent,
  Layers
} from 'lucide-react';
import { formatInteger, formatPercent } from '../lib/utils';

export interface TooltipMetric {
  label: string;
  value: string;
  badge?: string;
  highlight?: boolean;
  color?: string;
}

export interface SingleMetricTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string | number;
  category: string;
  icon?: React.ReactNode;
  valueLabel?: string;
  unit?: string;
  total?: number;
  isAlreadyPercent?: boolean;
  extraMetrics?: (data: any) => TooltipMetric[];
  isSelected?: (data: any) => boolean;
  clickHint?: string;
  accentColor?: string;
}

export const SingleMetricTooltip: React.FC<SingleMetricTooltipProps> = ({
  active,
  payload,
  label,
  category,
  icon,
  valueLabel = 'Volume',
  unit = 'OS',
  total,
  isAlreadyPercent = false,
  extraMetrics,
  isSelected,
  clickHint = 'Clique para filtrar',
  accentColor = '#EE1D23'
}) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload || {};
  const itemName = String(data.name || data.cidade || data.terminal || data.area || label || '');
  const rawValue = typeof data.value === 'number' ? data.value : Number(payload[0]?.value) || 0;
  
  // Calculate percentage of total if total is provided
  let pct = 0;
  if (isAlreadyPercent) {
    pct = rawValue;
  } else if (data.percentage !== undefined && data.percentage !== null) {
    pct = Number(data.percentage);
  } else if (total && total > 0) {
    pct = (rawValue / total) * 100;
  }

  const selected = isSelected ? isSelected(data) : false;
  const extras = extraMetrics ? extraMetrics(data) : [];

  return (
    <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-slate-100 min-w-[260px] max-w-[340px] text-slate-800 transition-all select-none">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 min-w-0">
          {icon && (
            <div 
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
            >
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block leading-tight truncate">
              {category}
            </span>
            <span className="text-sm font-black text-slate-900 truncate block leading-tight" title={itemName}>
              {itemName}
            </span>
          </div>
        </div>

        {selected && (
          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-tight bg-red-50 text-[#EE1D23] px-2 py-0.5 rounded-full shrink-0 border border-red-100">
            <Check className="w-2.5 h-2.5 stroke-[3]" />
            Ativo
          </span>
        )}
      </div>

      {/* Main Metric */}
      <div className="py-3 space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">
            {valueLabel}:
          </span>
          <div className="text-right">
            <span className="text-lg font-black" style={{ color: accentColor }}>
              {isAlreadyPercent ? formatPercent(rawValue) : formatInteger(rawValue)}
            </span>
            {!isAlreadyPercent && unit && (
              <span className="text-[11px] font-bold text-slate-400 ml-1">
                {unit}
              </span>
            )}
          </div>
        </div>

        {/* Percentage of total row & progress bar */}
        {(total !== undefined && total > 0 || data.percentage !== undefined) && !isAlreadyPercent && (
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100/80 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold">
              <span className="text-slate-500 flex items-center gap-1">
                <Percent className="w-3 h-3 text-slate-400" />
                Participação no Total:
              </span>
              <span className="font-black text-slate-800 bg-white px-1.5 py-0.5 rounded-md shadow-xs border border-slate-200/60">
                {formatPercent(pct)}
              </span>
            </div>
            <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(100, Math.max(0, pct))}%`,
                  backgroundColor: accentColor 
                }}
              />
            </div>
          </div>
        )}

        {/* Extra metrics */}
        {extras.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {extras.map((extra, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 text-[11px]">
                <span className="text-slate-500 font-bold">{extra.label}:</span>
                <span className={`font-black ${extra.color || 'text-slate-800'}`}>
                  {extra.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer / Interactive Tip */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold">
        <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-slate-400">
          <MousePointerClick className="w-3 h-3 text-[#EE1D23]" />
          {selected ? 'Clique para desmarcar' : clickHint}
        </span>
      </div>
    </div>
  );
};

export interface ComparisonMetricTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string | number;
  category: string;
  icon?: React.ReactNode;
  currentLabel?: string;
  previousLabel?: string;
  unit?: string;
  currentTotal?: number;
  isRateOrPercent?: boolean;
  showShareOfTotal?: boolean;
  showImpactOnBase?: boolean;
  extraCurrentMetrics?: (data: any) => TooltipMetric[];
  isSelected?: (data: any) => boolean;
  clickHint?: string;
  reverseTrend?: boolean; // true = decrease is good (green), increase is bad (red)
  description?: (data: any) => string | null;
}

export const ComparisonMetricTooltip: React.FC<ComparisonMetricTooltipProps> = ({
  active,
  payload,
  label,
  category,
  icon,
  currentLabel = 'Atual',
  previousLabel = 'Anterior',
  unit = 'OS',
  currentTotal,
  isRateOrPercent = false,
  showShareOfTotal = false,
  showImpactOnBase = true,
  extraCurrentMetrics,
  isSelected,
  clickHint = 'Clique para filtrar',
  reverseTrend = true,
  description
}) => {
  if (!active || !payload || !payload.length) return null;

  // Find data object (often payload[0].payload)
  const data = payload[0]?.payload || {};
  const itemName = String(data.displayName || data.name || label || '');
  const itemDesc = description ? description(data) : data.description && data.description !== 'N/A' ? data.description : null;

  const currentVal = typeof data.current === 'number' ? data.current : 0;
  const previousVal = typeof data.previous === 'number' ? data.previous : 0;

  // Impact on base if available
  const impactCurr = typeof data.impact === 'number' ? data.impact : undefined;
  const impactPrev = typeof data.impactPrev === 'number' ? data.impactPrev : undefined;

  // Share of total if currentTotal is provided
  const shareOfTotal = currentTotal && currentTotal > 0 ? (currentVal / currentTotal) * 100 : 0;

  // Delta calculation
  const delta = currentVal - previousVal;
  const deltaPct = previousVal > 0 ? ((currentVal - previousVal) / previousVal) * 100 : 0;

  // Good/Bad trend evaluation
  // If reverseTrend is true: lower is good (green), higher is bad (red)
  const isBetter = reverseTrend ? delta < 0 : delta > 0;
  const isWorse = reverseTrend ? delta > 0 : delta < 0;
  const isNeutral = delta === 0;

  const selected = isSelected ? isSelected(data) : false;
  const extras = extraCurrentMetrics ? extraCurrentMetrics(data) : [];

  return (
    <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-slate-100 min-w-[280px] max-w-[360px] text-slate-800 transition-all select-none">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 min-w-0">
          {icon && (
            <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center shrink-0 text-[#EE1D23]">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block leading-tight truncate">
              {category}
            </span>
            <span className="text-sm font-black text-slate-900 truncate block leading-tight" title={itemName}>
              {itemName}
            </span>
          </div>
        </div>

        {selected && (
          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-tight bg-red-50 text-[#EE1D23] px-2 py-0.5 rounded-full shrink-0 border border-red-100">
            <Check className="w-2.5 h-2.5 stroke-[3]" />
            Ativo
          </span>
        )}
      </div>

      {/* Description tag if present */}
      {itemDesc && (
        <div className="mt-2.5 text-[11px] font-bold text-[#EE1D23] italic leading-snug bg-red-50/70 p-2 rounded-xl border border-red-100/60">
          {itemDesc}
        </div>
      )}

      {/* Values Grid */}
      <div className="py-3 space-y-2.5">
        {/* Current Month Box */}
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#EE1D23]" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                {currentLabel} (Mês Atual)
              </span>
            </div>
            <span className="text-sm font-black text-[#EE1D23]">
              {isRateOrPercent ? formatPercent(currentVal) : `${formatInteger(currentVal)} ${unit}`}
            </span>
          </div>

          {/* Sub-metrics: Impact / % of Total */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] pt-1 border-t border-slate-200/50">
            {showImpactOnBase && impactCurr !== undefined && (
              <div className="flex items-center gap-1 text-slate-500 font-bold">
                <span>Impacto s/ Base:</span>
                <span className="font-black text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200/60">
                  {formatPercent(impactCurr)}
                </span>
              </div>
            )}
            {showShareOfTotal && currentTotal !== undefined && currentTotal > 0 && (
              <div className="flex items-center gap-1 text-slate-500 font-bold">
                <span>% do Top:</span>
                <span className="font-black text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200/60">
                  {formatPercent(shareOfTotal)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Previous Month Row */}
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50/60 border border-slate-100 text-[11px]">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-slate-300" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {previousLabel} (Anterior)
            </span>
          </div>
          <div className="text-right flex items-center gap-2">
            <span className="font-black text-slate-600">
              {isRateOrPercent ? formatPercent(previousVal) : `${formatInteger(previousVal)} ${unit}`}
            </span>
            {showImpactOnBase && impactPrev !== undefined && (
              <span className="text-[9px] font-bold text-slate-400">
                ({formatPercent(impactPrev)})
              </span>
            )}
          </div>
        </div>

        {/* Comparison / Variation Delta */}
        {previousVal > 0 && (
          <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-bold">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider">Variação vs Anterior:</span>
            <div className={`flex items-center gap-1 text-xs font-black ${
              isNeutral ? 'text-slate-500' : isBetter ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {isBetter ? (
                <TrendingDown className="w-3.5 h-3.5" />
              ) : isWorse ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : null}
              <span>
                {delta > 0 ? `+${isRateOrPercent ? delta.toFixed(2) + ' p.p.' : formatInteger(delta)}` : isRateOrPercent ? delta.toFixed(2) + ' p.p.' : formatInteger(delta)}
              </span>
              {!isRateOrPercent && (
                <span className="text-[10px] font-bold opacity-80">
                  ({deltaPct > 0 ? `+${deltaPct.toFixed(1)}%` : `${deltaPct.toFixed(1)}%`})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Extra metrics */}
        {extras.length > 0 && (
          <div className="space-y-1 pt-1 border-t border-slate-100">
            {extras.map((extra, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-bold">{extra.label}:</span>
                <span className={`font-black ${extra.color || 'text-slate-800'}`}>
                  {extra.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer / Interactive Tip */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold">
        <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-slate-400">
          <MousePointerClick className="w-3 h-3 text-[#EE1D23]" />
          {selected ? 'Clique para desmarcar' : clickHint}
        </span>
      </div>
    </div>
  );
};
