/** Extrait les données d'une réponse API Laravel (tableau direct, paginé ou Resource). */
export function extractList<T>(response: { data: unknown }): T[] {
  const payload = response.data as Record<string, unknown> | unknown[];

  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;

    if (Array.isArray(obj.data)) {
      return obj.data as T[];
    }

    if (obj.data && typeof obj.data === 'object' && Array.isArray((obj.data as Record<string, unknown>).data)) {
      return (obj.data as Record<string, unknown>).data as T[];
    }
  }

  return [];
}

export function extractItem<T>(response: { data: unknown }): T {
  const payload = response.data as Record<string, unknown>;

  if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return payload.data as T;
  }

  return response.data as T;
}
