import React, { useEffect, useState } from 'react';
import api from '@/core/api/client';
import './ScheduleEditorModal.css';

export type ScheduleSlot = { start: string; end: string; room?: string | null };
export type ScheduleData = Record<string, ScheduleSlot[]>;

const DAYS = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
];

type ConflictWarning = {
  type: string;
  day: string;
  start: string;
  end: string;
  details?: Array<{ class_name?: string; subject_name?: string; teacher_name?: string }>;
};

interface Props {
  assignmentId: number;
  label: string;
  initialSchedule?: ScheduleData | null;
  onClose: () => void;
  onSaved: () => void;
}

const emptySchedule = (): ScheduleData =>
  DAYS.reduce<ScheduleData>((acc, d) => {
    acc[d.key] = [];
    return acc;
  }, {});

const ScheduleEditorModal: React.FC<Props> = ({
  assignmentId,
  label,
  initialSchedule,
  onClose,
  onSaved,
}) => {
  const [schedule, setSchedule] = useState<ScheduleData>(() => {
    const base = emptySchedule();
    if (initialSchedule) {
      for (const day of DAYS) {
        if (Array.isArray(initialSchedule[day.key])) {
          base[day.key] = initialSchedule[day.key].map((s) => ({
            start: s.start || '08:00',
            end: s.end || '09:00',
            room: s.room ?? '',
          }));
        }
      }
    }
    return base;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<ConflictWarning[]>([]);

  const addSlot = (day: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: [...(prev[day] || []), { start: '08:00', end: '09:00', room: '' }],
    }));
  };

  const removeSlot = (day: string, index: number) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index),
    }));
  };

  const updateSlot = (day: string, index: number, field: keyof ScheduleSlot, value: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: prev[day].map((slot, i) => (i === index ? { ...slot, [field]: value } : slot)),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setWarnings([]);
    try {
      const payload: ScheduleData = {};
      for (const day of DAYS) {
        const slots = schedule[day.key].filter((s) => s.start && s.end);
        if (slots.length > 0) {
          payload[day.key] = slots.map((s) => ({
            start: s.start,
            end: s.end,
            room: s.room?.trim() || null,
          }));
        }
      }
      const res = await api.put(`/api/class-subjects/${assignmentId}/schedule`, { schedule: payload });
      const w = res.data?.warnings;
      if (Array.isArray(w) && w.length > 0) {
        setWarnings(w);
      }
      onSaved();
      if (!w?.length) onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  const conflictLabel = (type: string) => {
    if (type === 'teacher_overlap') return 'Conflit professeur';
    if (type === 'room_overlap') return 'Conflit salle';
    if (type === 'class_overlap') return 'Conflit classe';
    return type;
  };

  return (
    <div className="schedule-modal-backdrop" onClick={onClose}>
      <div className="schedule-modal" onClick={(e) => e.stopPropagation()}>
        <header className="schedule-modal-header">
          <h3>Planifier — {label}</h3>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Fermer">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        {error && <p className="schedule-modal-error">{error}</p>}

        {warnings.length > 0 && (
          <div className="schedule-modal-warnings">
            <strong>Conflits détectés (planning enregistré) :</strong>
            <ul>
              {warnings.map((w, i) => (
                <li key={i}>
                  {conflictLabel(w.type)} — {w.day} {w.start}–{w.end}
                  {w.details?.map((d) => ` · ${d.subject_name} (${d.class_name})`).join('')}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="schedule-modal-body">
          {DAYS.map(({ key, label: dayLabel }) => (
            <div key={key} className="schedule-day-block">
              <div className="schedule-day-head">
                <h4>{dayLabel}</h4>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => addSlot(key)}>
                  + Créneau
                </button>
              </div>
              {schedule[key].length === 0 ? (
                <p className="schedule-empty">Aucun créneau</p>
              ) : (
                schedule[key].map((slot, index) => (
                  <div key={index} className="schedule-slot-row">
                    <input type="time" value={slot.start} onChange={(e) => updateSlot(key, index, 'start', e.target.value)} />
                    <span>–</span>
                    <input type="time" value={slot.end} onChange={(e) => updateSlot(key, index, 'end', e.target.value)} />
                    <input
                      type="text"
                      placeholder="Salle"
                      value={slot.room ?? ''}
                      onChange={(e) => updateSlot(key, index, 'room', e.target.value)}
                    />
                    <button type="button" className="btn-icon danger" onClick={() => removeSlot(key, index)}>
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>

        <footer className="schedule-modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>Annuler</button>
          <button type="button" className="btn btn-primary" disabled={saving} onClick={handleSave}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ScheduleEditorModal;
