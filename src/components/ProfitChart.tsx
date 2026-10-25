'use client';

import { SimRow, formatUsd, formatNum } from '@/lib/model';

interface ProfitChartProps {
  rows: SimRow[];
}

export function ProfitChart({ rows }: ProfitChartProps) {
  if (rows.length === 0) return null;
  
  const W = 1000;
  const H = 300;
  const pad = 40;
  const N = rows.length;
  const bw = (W - 2 * pad) / N;
  const maxP = Math.max(1, ...rows.map(r => Math.abs(r.profit)));
  const mid = H / 2;
  const maxM = Math.max(1, ...rows.map(r => r.mau));
  
  return (
    <div className="bg-card border rounded-lg p-4">
      <h3 className="font-serif text-lg mb-4">Profit by month</h3>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        style={{ maxHeight: '300px' }}
      >
        {/* Zero line */}
        <line
          x1={pad}
          y1={mid}
          x2={W - pad}
          y2={mid}
          stroke="#e4e2dd"
          strokeWidth={1}
        />
        
        {/* Profit bars */}
        {rows.map((r, i) => {
          const h = Math.abs(r.profit) / maxP * (mid - 20);
          const x = pad + i * bw + bw * 0.15;
          const y = r.profit >= 0 ? mid - h : mid;
          return (
            <g key={r.m}>
              <rect
                x={x}
                y={y}
                width={bw * 0.7}
                height={h}
                fill={r.profit >= 0 ? '#1f7a3f' : '#b3261e'}
                opacity={0.8}
              >
                <title>Month {r.m}: {formatUsd(r.profit)}</title>
              </rect>
              <text
                x={pad + i * bw + bw / 2}
                y={H - 8}
                fontSize={11}
                textAnchor="middle"
                fill="#888"
              >
                {r.m}
              </text>
            </g>
          );
        })}
        
        {/* Active users line */}
        <polyline
          points={rows.map((r, i) => 
            `${pad + i * bw + bw / 2},${H - 30 - (r.mau / maxM) * (H - 60)}`
          ).join(' ')}
          fill="none"
          stroke="#2f5d50"
          strokeWidth={2.5}
        />
        
        {/* Labels */}
        <text x={W - pad} y={16} fontSize={12} textAnchor="end" fill="#2f5d50">
          {formatNum(maxM)} users
        </text>
        <text x={pad} y={16} fontSize={12} fill="#555">
          +{formatUsd(maxP)}
        </text>
        <text x={pad} y={H - 28} fontSize={12} fill="#555">
          -{formatUsd(maxP)}
        </text>
      </svg>
      <p className="text-xs text-muted-foreground mt-2">
        Bars: monthly profit (green above water, red below). Line: active users (right scale).
      </p>
    </div>
  );
}
