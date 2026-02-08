import type { ReportPayload } from '@/types/report';

function escapePdfText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function formatEntryLine(index: number, line: string): string {
  return `${index + 1}. ${line}`;
}

export function generateSummaryPdf(payload: ReportPayload): Buffer {
  const lines: string[] = [
    payload.title,
    `Date range: ${payload.dateStart} to ${payload.dateEnd}`,
    `Generated: ${new Date(payload.generatedAt).toLocaleString()}`,
    `Entries: ${payload.summary.entryCount}`,
    `Average pain: ${payload.summary.avgPain}`,
    `Worst pain: ${payload.summary.worst}`,
    `Best pain: ${payload.summary.best}`,
    '',
    'Recent entries:',
  ];

  payload.entries.slice(0, 25).forEach((entry, index) => {
    const timestamp = new Date(entry.timestamp).toLocaleDateString();
    lines.push(formatEntryLine(index, `${timestamp} - pain ${entry.painLevel} - ${entry.notes || 'No notes'}`));
  });

  const pageLines = lines.slice(0, 38);

  let textOperations = 'BT\n/F1 11 Tf\n50 790 Td\n14 TL\n';
  pageLines.forEach((line, index) => {
    if (index === 0) {
      textOperations += `(${escapePdfText(line)}) Tj\n`;
    } else {
      textOperations += `T* (${escapePdfText(line)}) Tj\n`;
    }
  });
  textOperations += 'ET';

  const stream = `${textOperations}`;

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    `5 0 obj\n<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream\nendobj\n`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += object;
  });

  const xrefStart = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';

  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, 'utf8');
}
