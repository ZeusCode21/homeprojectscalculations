'use client';

import { SimRow, SimResult, Scenario, ChanMonthResult } from '@/lib/model';

interface RoadmapStripProps {
  scenario: Scenario;
  simResult: SimResult;
  breakEvenMonth: number | null;
}

const STAGE_COLORS = ['#2f5d50', '#5f8a6e', '#b07a2a', '#4f6d8a', '#8a5a7a', '#7a6f62'];

export function RoadmapStrip({ scenario, simResult, breakEvenMonth }: RoadmapStripProps) {
  const { rows, cm } = simResult;
  const N = scenario.months;
  
  if (rows.length === 0) return null;
  
  const P = (m: number) => ((m - 1) / N) * 100;
  
  // Build stage bands
  const bands: { start: number; end: number; label: string; color: string }[] = [];
  let s0 = 1;
  let ci = 0;
  for (let m = 2; m <= N + 1; m++) {
    if (m > N || scenario.grid.stage[m - 1] !== scenario.grid.stage[s0 - 1]) {
      const lab = scenario.grid.stage[s0 - 1];
      if (lab) {
        bands.push({
          start: s0,
          end: m - 1,
          label: lab,
          color: STAGE_COLORS[ci % STAGE_COLORS.length],
        });
      }
      ci++;
      s0 = m;
    }
  }
  
  // Build markers
  const markers: { month: number; label: string; lane: number }[] = [];
  
  // Plan launches
  scenario.plans.forEach(p => {
    if (p.on) {
      markers.push({ month: p.start, label: p.name, lane: 0 });
    }
  });
  
  // Source starts (when they first produce sign-ups)
  scenario.chans.forEach((c, i) => {
    if (c.on) {
      const firstMonth = (cm[i] as ChanMonthResult[]).findIndex(x => x.u > 0);
      if (firstMonth > 0) {
        markers.push({ month: firstMonth + 1, label: `${c.name} starts`, lane: 0 });
      }
    }
  });
  
  // Affiliate
  if (scenario.aff.on) {
    markers.push({ month: scenario.aff.start, label: 'Materials links', lane: 0 });
  }
  
  // Contractor leads
  if (scenario.lead.on) {
    const reachedMonth = rows.find(r => r.lead > 0);
    markers.push({
      month: reachedMonth ? reachedMonth.m : scenario.lead.start,
      label: `Contractor leads${reachedMonth ? '' : ' (not reached)'}`,
      lane: 0,
    });
  }
  
  // Sort and assign lanes to prevent overlap
  markers.sort((a, b) => a.month - b.month);
  const lanes: number[] = [];
  markers.forEach(mk => {
    let L = lanes.findIndex(lastMonth => mk.month - lastMonth >= 3);
    if (L < 0) {
      L = lanes.length;
      lanes.push(0);
    }
    lanes[L] = mk.month;
    mk.lane = L;
  });
  
  return (
    <div className="bg-card border rounded-lg p-4">
      <h3 className="font-serif text-lg mb-3">Roadmap</h3>
      <div className="relative">
        {/* Month labels */}
        <div
          className="grid text-[11px] text-muted-foreground text-center mb-1"
          style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }}
        >
          {rows.map(r => (
            <div key={r.m}>{r.m}</div>
          ))}
        </div>
        
        {/* Stage bands */}
        <div className="relative h-7 my-1">
          {bands.map((band, i) => (
            <div
              key={i}
              className="absolute top-0 h-7 rounded text-xs text-white px-2 py-1 overflow-hidden text-ellipsis whitespace-nowrap"
              style={{
                left: `${P(band.start)}%`,
                width: `${((band.end - band.start + 1) / N) * 100}%`,
                backgroundColor: band.color,
              }}
              title={band.label}
            >
              {band.label}
            </div>
          ))}
        </div>
        
        {/* Marker lanes */}
        {Array.from({ length: Math.max(1, ...markers.map(m => m.lane + 1)) }).map((_, laneIdx) => (
          <div key={laneIdx} className="relative h-7 my-1">
            {markers
              .filter(m => m.lane === laneIdx && m.month <= N)
              .map((m, i) => (
                <div
                  key={i}
                  className="absolute top-0 text-[11px] bg-white border border-primary text-primary rounded-full px-2 py-0.5 whitespace-nowrap"
                  style={{
                    left: `${P(m.month) + 50 / N}%`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  {m.label}
                </div>
              ))}
          </div>
        ))}
        
        {/* Break-even line */}
        {breakEvenMonth && (
          <div
            className="absolute top-0 bottom-0 border-l-2 border-dashed border-success"
            style={{ left: `${P(breakEvenMonth)}%` }}
          />
        )}
      </div>
    </div>
  );
}
