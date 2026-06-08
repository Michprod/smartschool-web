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

export type TeacherOption = { id: number; first_name: string; last_name: string };

/** Profils enseignants (paginés) ou comptes users. */
export function mapTeacherOptions(response: { data: unknown }): TeacherOption[] {
  return extractList<{ user?: TeacherOption } & TeacherOption>(response)
    .map((t) => {
      const u = t.user ?? t;
      return {
        id: Number(u.id),
        first_name: u.first_name,
        last_name: u.last_name,
      };
    })
    .filter((t) => t.id > 0);
}

export function extractItem<T>(response: { data: unknown }): T {
  const payload = response.data as Record<string, unknown>;

  if (payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    return payload.data as T;
  }

  return response.data as T;
}
