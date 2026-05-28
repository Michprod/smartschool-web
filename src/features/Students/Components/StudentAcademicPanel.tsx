import React, { useEffect, useState } from 'react';
import api from '@/core/api/client';

type PeriodOption = { code: string; label: string };

type EvolutionTimelineItem = {
  term: string;
  term_label: string;
  general_average: number | null;
  class_rank: number | null;
  total_students: number | null;
  rank_display: string | null;
};

type AssessmentItem = {
  id: number;
  type: string;
  type_label: string;
  subject?: string;
  score: number;
  max_score: number;
  score_on_20: number;
  date?: string;
  title?: string;
};

type AcademicProfile = {
  term_label: string;
  general_average: number | null;
  rank_display: string | null;
  report_card?: { decision?: string; decision_label?: string; class_council_observation?: string };
  subject_averages?: Array<{ subject?: { name: string }; average_score: number; appreciation?: string }>;
  assessments_by_type?: Array<{ type: string; type_label: string; count: number; assessments: AssessmentItem[] }>;
};

interface StudentAcademicPanelProps {
  studentId: number;
  classId?: number | null;
  academicYear: string;
  term: string;
  onTermChange: (term: string) => void;
  onPeriodsLoaded?: (periods: PeriodOption[]) => void;
}

const StudentAcademicPanel: React.FC<StudentAcademicPanelProps> = ({
  studentId,
  classId,
  academicYear,
  term,
  onTermChange,
  onPeriodsLoaded,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periods, setPeriods] = useState<PeriodOption[]>([]);
  const [schemeLabel, setSchemeLabel] = useState('Trimestre');
  const [timeline, setTimeline] = useState<EvolutionTimelineItem[]>([]);
  const [profile, setProfile] = useState<AcademicProfile | null>(null);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const params: Record<string, string | number> = { student_id: studentId };
        if (classId) params.class_id = classId;
        const res = await api.get('/api/grades/catalog', { params });
        const list = res.data?.periods || [];
        setPeriods(list);
        setSchemeLabel(res.data?.period_scheme_label || 'Trimestre');
        onPeriodsLoaded?.(list);
        if (list.length && !list.some((p: PeriodOption) => p.code === term)) {
          onTermChange(list[0].code);
        }
      } catch {
        setPeriods([
          { code: 'T1', label: '1er Trimestre' },
          { code: 'T2', label: '2ème Trimestre' },
          { code: 'T3', label: '3ème Trimestre' },
        ]);
      }
    };
    loadCatalog();
  }, [studentId, classId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [evoRes, profileRes] = await Promise.all([
          api.get(`/api/grades/students/${studentId}/evolution`, { params: { academic_year: academicYear } }),
          api.get(`/api/grades/students/${studentId}/academic-profile`, {
            params: { term, academic_year: academicYear },
          }),
        ]);
        setTimeline(evoRes.data?.timeline || []);
        setProfile(profileRes.data || null);
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Impossible de charger les données académiques.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    if (term) load();
  }, [studentId, term, academicYear]);

  if (loading) return <p className="tab-loading">Chargement du parcours scolaire…</p>;
  if (error) return <p className="tab-error">{error}</p>;

  const decisionLabel =
    profile?.report_card?.decision_label || profile?.report_card?.decision || '—';

  return (
    <div className="academic-panel">
      <div className="metrics-row">
        <div className="metric-box">
          <small>Moyenne ({profile?.term_label || term})</small>
          <strong>{profile?.general_average != null ? profile.general_average.toFixed(2) : '—'}</strong>
        </div>
        <div className="metric-box">
          <small>Position ({schemeLabel.toLowerCase()})</small>
          <strong>{profile?.rank_display || '—'}</strong>
        </div>
        <div className="metric-box">
          <small>Décision bulletin</small>
          <strong>{decisionLabel}</strong>
        </div>
      </div>

      <section className="academic-section">
        <h4>Évolution sur l&apos;année {academicYear}</h4>
        <div className="evolution-grid">
          {timeline.map((item) => (
            <div
              key={item.term}
              className={`evolution-card ${item.term === term ? 'active' : ''}`}
              onClick={() => onTermChange(item.term)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onTermChange(item.term)}
            >
              <span className="evolution-label">{item.term_label}</span>
              <strong>{item.general_average != null ? item.general_average.toFixed(2) : '—'}</strong>
              <small>{item.rank_display ? `${item.rank_display}e` : 'Rang —'}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="academic-section">
        <h4>Moyennes par matière</h4>
        <div className="tab-table-wrap">
          <table className="tab-table">
            <thead>
              <tr>
                <th>Matière</th>
                <th>Moyenne /20</th>
                <th>Appréciation</th>
              </tr>
            </thead>
            <tbody>
              {(profile?.subject_averages || []).map((row, idx) => (
                <tr key={`${row.subject?.name}-${idx}`}>
                  <td>{row.subject?.name || 'Matière'}</td>
                  <td>{Number(row.average_score).toFixed(2)}</td>
                  <td>{row.appreciation || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!profile?.subject_averages?.length && (
            <p className="tab-empty">Aucune moyenne calculée pour cette période.</p>
          )}
        </div>
      </section>

      <section className="academic-section">
        <h4>Détail des évaluations (travaux hebdo, concours, devoirs…)</h4>
        {(profile?.assessments_by_type || []).map((group) => (
          <div key={group.type} className="assessment-type-block">
            <header>
              <strong>{group.type_label}</strong>
              <span>{group.count} note(s)</span>
            </header>
            <div className="tab-table-wrap">
              <table className="tab-table compact">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Matière</th>
                    <th>Note</th>
                    <th>/20</th>
                    <th>Intitulé</th>
                  </tr>
                </thead>
                <tbody>
                  {group.assessments.map((a) => (
                    <tr key={a.id}>
                      <td>{a.date ? new Date(a.date).toLocaleDateString('fr-FR') : '—'}</td>
                      <td>{a.subject || '—'}</td>
                      <td>
                        {a.score}/{a.max_score}
                      </td>
                      <td>{a.score_on_20.toFixed(2)}</td>
                      <td>{a.title || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        {!profile?.assessments_by_type?.length && (
          <p className="tab-empty">Aucune évaluation publiée pour cette période.</p>
        )}
      </section>

      {profile?.report_card?.class_council_observation && (
        <section className="academic-section">
          <h4>Observations du conseil de classe</h4>
          <p className="council-note">{profile.report_card.class_council_observation}</p>
        </section>
      )}
    </div>
  );
};

export default StudentAcademicPanel;
