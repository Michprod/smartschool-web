import api from '@/core/api/client';

type DownloadOptions = {
  studentId: number;
  term: string;
  academicYear: string;
  /** Route parent : /api/parent/children/... */
  parentPortal?: boolean;
};

function defaultFilename(studentId: number, term: string, academicYear: string): string {
  return `bulletin_${studentId}_${term}_${academicYear.replace('/', '-')}.pdf`;
}

/**
 * Télécharge le bulletin PDF via l'API authentifiée (Sanctum).
 */
export async function downloadReportCardPdf({
  studentId,
  term,
  academicYear,
  parentPortal = false,
}: DownloadOptions): Promise<void> {
  const base = parentPortal
    ? `/api/parent/children/${studentId}/report-card/pdf`
    : `/api/grades/students/${studentId}/report-card/pdf`;

  const response = await api.get(base, {
    params: { term, academic_year: academicYear },
    responseType: 'blob',
    headers: {
      Accept: 'application/pdf',
    },
  });

  const contentType = String(response.headers['content-type'] || '');
  const blobData = response.data as Blob;

  if (!contentType.includes('application/pdf')) {
    const message = await blobData.text();
    throw new Error(message || 'Réponse invalide (PDF attendu).');
  }

  const blob = blobData instanceof Blob
    ? blobData
    : new Blob([blobData], { type: 'application/pdf' });

  const disposition = response.headers['content-disposition'] as string | undefined;
  const filenameMatch = disposition?.match(/filename="?([^";]+)"?/i);
  const filename = filenameMatch?.[1] || defaultFilename(studentId, term, academicYear);

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
