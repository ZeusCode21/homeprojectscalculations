'use client';

import { useModel } from '@/lib/context';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function ChangeLog() {
  const { changeLog, currentScenarioId } = useModel();
  
  const relevantLogs = changeLog
    .filter(entry => entry.scenarioId === currentScenarioId)
    .sort((a, b) => b.at - a.at);
  
  if (relevantLogs.length === 0) {
    return null;
  }
  
  return (
    <section id="change-log" className="scroll-mt-16">
      <h2 className="font-serif text-2xl mb-4">Change log</h2>
      
      <div className="bg-card border rounded-lg p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>What</TableHead>
              <TableHead>Old value</TableHead>
              <TableHead>New value</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {relevantLogs.map(entry => (
              <TableRow key={entry.id}>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(entry.at).toLocaleDateString()}{' '}
                  {new Date(entry.at).toLocaleTimeString()}
                </TableCell>
                <TableCell>{entry.what}</TableCell>
                <TableCell className="tabular-nums">{entry.oldValue}</TableCell>
                <TableCell className="tabular-nums">{entry.newValue}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{entry.reason}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
