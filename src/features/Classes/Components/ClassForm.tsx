import React, { useEffect, useMemo, useState } from 'react';
import api from '@/core/api/client';
import { extractList } from '@/core/api/extractData';
import type { ClassFormData, EducationCycle } from '../types';
import './ClassForm.css';

interface ClassFormProps {
  initialData?: ClassFormData;
  onSubmit: (data: ClassFormData) => Promise<void>;
  onCancel: () => void;
}

const ClassForm: React.FC<ClassFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [cycles, setCycles] = useState<EducationCycle[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [cycleCode, setCycleCode] = useState('');
  const [form, setForm] = useState<ClassFormData>({
    grade_level_id: '',
    study_option_id: '',
    section: 'A',
    academic_year: '2025-2026',
    capacity: 35,
    teacher_id: '',
    ...initialData,
  });

  useEffect(() => {
    const load = async () => {
      const [catalogRes, usersRes] = await Promise.all([
        api.get('/api/classes/catalog'),
        api.get('/api/users', { params: { per_page: 100 } }),
      ]);
      setCycles(catalogRes.data?.cycles || []);
      const users = extractList<Record<string, unknown>>(usersRes);
      setTeachers(
        users
          .filter((u) => u.role === 'teacher' || u.role === 'admin')
          .map((u) => ({
            id: String(u.id),
            name: `${u.first_name} ${u.last_name}`,
          }))
      );
    };
    load();
  }, []);

  useEffect(() => {
    if (initialData?.grade_level_id && cycles.length) {
      for (const c of cycles) {
        if (c.grade_levels.some((gl) => String(gl.id) === initialData.grade_level_id)) {
          setCycleCode(c.code);
          break;
        }
      }
    }
  }, [initialData, cycles]);

  const selectedCycle = useMemo(
    () => cycles.find((c) => c.code === cycleCode),
    [cycles, cycleCode]
  );

  const selectedLevel = useMemo(
    () => selectedCycle?.grade_levels.find((gl) => String(gl.id) === form.grade_level_id),
    [selectedCycle, form.grade_level_id]
  );

  const previewName = useMemo(() => {
    if (!selectedLevel) return '';
    const section = form.section.toUpperCase();
    if (selectedCycle?.requires_study_option) {
      const opt = selectedCycle.study_options.find((o) => String(o.id) === form.study_option_id);
      return opt ? `${selectedLevel.official_name} ${opt.name} ${section}` : '';
    }
    return `${selectedLevel.official_name} ${section}`;
  }, [selectedCycle, selectedLevel, form.section, form.study_option_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  return (
    <form className="class-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="form-group">
          <label>Cycle scolaire *</label>
          <select
            value={cycleCode}
            onChange={(e) => {
              setCycleCode(e.target.value);
              setForm((f) => ({ ...f, grade_level_id: '', study_option_id: '' }));
            }}
            required
          >
            <option value="">Sélectionner un cycle</option>
            {cycles.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Niveau *</label>
          <select
            value={form.grade_level_id}
            onChange={(e) => setForm((f) => ({ ...f, grade_level_id: e.target.value }))}
            required
            disabled={!cycleCode}
          >
            <option value="">Sélectionner un niveau</option>
            {selectedCycle?.grade_levels.map((gl) => (
              <option key={gl.id} value={gl.id}>{gl.official_name}</option>
            ))}
          </select>
        </div>

        {selectedCycle?.requires_study_option && (
          <div className="form-group">
            <label>Option / Filière *</label>
            <select
              value={form.study_option_id}
              onChange={(e) => setForm((f) => ({ ...f, study_option_id: e.target.value }))}
              required
            >
              <option value="">Sélectionner une option</option>
              {selectedCycle.study_options.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label>Salle (section) *</label>
          <select
            value={form.section}
            onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}
            required
          >
            {['A', 'B', 'C', 'D', 'E'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Année scolaire *</label>
          <input
            type="text"
            value={form.academic_year}
            onChange={(e) => setForm((f) => ({ ...f, academic_year: e.target.value }))}
            placeholder="2025-2026"
            required
          />
        </div>

        <div className="form-group">
          <label>Capacité *</label>
          <input
            type="number"
            min={0}
            value={form.capacity}
            onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) }))}
            required
          />
        </div>

        <div className="form-group">
          <label>Professeur titulaire</label>
          <select
            value={form.teacher_id}
            onChange={(e) => setForm((f) => ({ ...f, teacher_id: e.target.value }))}
          >
            <option value="">Non assigné</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {previewName && (
        <div className="class-name-preview">
          <span className="material-symbols-outlined">badge</span>
          <div>
            <small>Nom de la classe généré</small>
            <strong>{previewName}</strong>
          </div>
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Annuler</button>
        <button type="submit" className="btn btn-primary">Enregistrer</button>
      </div>
    </form>
  );
};

export default ClassForm;
