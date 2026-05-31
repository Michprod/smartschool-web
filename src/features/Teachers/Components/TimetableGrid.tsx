import React from 'react';
import './TimetableGrid.css';

export type TimetableSlot = {
  day: string;
  start: string;
  end: string;
  room?: string | null;
  class_name?: string | null;
  subject_name?: string | null;
};

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Lundi', tuesday: 'Mardi', wednesday: 'Mercredi',
  thursday: 'Jeudi', friday: 'Vendredi', saturday: 'Samedi',
};

interface Props {
  slots: TimetableSlot[];
}

const TimetableGrid: React.FC<Props> = ({ slots }) => {
  const byDay = DAYS.reduce<Record<string, TimetableSlot[]>>((acc, day) => {
    acc[day] = slots.filter((s) => s.day === day).sort((a, b) => a.start.localeCompare(b.start));
    return acc;
  }, {});

  return (
    <div className="timetable-grid">
      {DAYS.map((day) => (
        <div key={day} className="timetable-day">
          <h4>{DAY_LABELS[day]}</h4>
          {byDay[day].length === 0 ? (
            <p className="empty-slot">—</p>
          ) : (
            byDay[day].map((slot, i) => (
              <div key={`${day}-${i}`} className="timetable-slot">
                <strong>{slot.start} – {slot.end}</strong>
                <span>{slot.subject_name}</span>
                <small>{slot.class_name}{slot.room ? ` · ${slot.room}` : ''}</small>
              </div>
            ))
          )}
        </div>
      ))}
    </div>
  );
};

export default TimetableGrid;
