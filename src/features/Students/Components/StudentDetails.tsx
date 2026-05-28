import React, { useEffect, useMemo, useState } from 'react';
import api from '@/core/api/client';
import { extractItem, extractList } from '@/core/api/extractData';
import Skeleton from '@/core/Components/Skeleton';
import StudentAcademicPanel from './StudentAcademicPanel';
import type { Student, StudentAttendance, StudentDocument } from '../types';
import './StudentDetails.css';

type StudentTab = 'profil' | 'academique' | 'finance' | 'presences' | 'documents';

interface StudentDetailsProps {
  student: Student;
  onClose: () => void;
  onEdit?: (student: Student) => void;
  onViewPayments?: (studentId: string) => void;
  onContactParent?: (student: Student) => void;
}

const StudentDetails: React.FC<StudentDetailsProps> = ({ 
  student, 
  onClose,
  onEdit,
  onContactParent
}) => {
  const [activeTab, setActiveTab] = useState<StudentTab>('profil');
  const [profileStudent, setProfileStudent] = useState<Student>(student);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [term, setTerm] = useState('T1');
  const [periodOptions, setPeriodOptions] = useState<Array<{ code: string; label: string }>>([]);
  const [heroAverage, setHeroAverage] = useState<number | null>(null);
  const [academicYear, setAcademicYear] = useState(student.academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);

  const [loadingFinance, setLoadingFinance] = useState(false);
  const [financeError, setFinanceError] = useState<string | null>(null);
  const [payments, setPayments] = useState<Array<{ id: string; date: string; type: string; amount: number; currency: string; status: string }>>([]);

  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<{ rate: number; present: number; late: number; absent: number; excused: number }>({
    rate: 0,
    present: 0,
    late: 0,
    absent: 0,
    excused: 0,
  });
  const [attendanceRecords, setAttendanceRecords] = useState<StudentAttendance[]>([]);
  const [attendanceForm, setAttendanceForm] = useState({
    date: new Date().toISOString().split('T')[0],
    status: 'present' as StudentAttendance['status'],
    reason: '',
    notes: '',
  });
  const [savingAttendance, setSavingAttendance] = useState(false);

  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [docType, setDocType] = useState('general');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const mapStudentFromApi = (s: any): Student => ({
    id: String(s.id),
    matricule: s.matricule || '',
    studentNumber: s.student_number || s.matricule || '',
    firstName: s.first_name || '',
    lastName: s.last_name || '',
    dateOfBirth: s.date_of_birth ? new Date(s.date_of_birth) : new Date(),
    gender: s.gender === 'F' ? 'F' : 'M',
    placeOfBirth: s.place_of_birth || '',
    nationality: s.nationality || '',
    bloodGroup: s.blood_group || '',
    photo: s.photo || '',
    address: s.address || '',
    city: s.city || '',
    province: s.province || '',
    phone: s.phone || '',
    email: s.email || '',
    parentIds: Array.isArray(s.parent_ids) ? s.parent_ids.map(String) : [],
    guardianName: s.guardian_name || '',
    guardianRelation: s.guardian_relation || '',
    guardianPhone: s.guardian_phone || '',
    guardianEmail: s.guardian_email || '',
    classId: String(s.class_id || ''),
    class: s.school_class?.name || s.class || 'Non assignée',
    academicYear: s.academic_year || '',
    academicStatus: s.academic_status || '',
    previousSchool: s.previous_school || '',
    enrollmentDate: s.enrollment_date ? new Date(s.enrollment_date) : new Date(),
    allergies: s.allergies || '',
    medicalConditions: s.medical_conditions || '',
    emergencyContact: s.emergency_contact || '',
    medicalInfo: s.medical_info || undefined,
    isActive: Boolean(s.is_active ?? s.status === 'active'),
    status: s.status || (Boolean(s.is_active) ? 'active' : 'inactive'),
  });

  const loadStudentProfile = async () => {
    try {
      setLoadingProfile(true);
      setProfileError(null);
      const res = await api.get(`/api/students/${student.id}`);
      const data = extractItem<any>(res);
      setProfileStudent(mapStudentFromApi(data));
    } catch (error) {
      console.error('Erreur chargement profil eleve:', error);
      setProfileError("Impossible de charger le profil complet de l'élève.");
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadAcademicData = async () => {
    try {
      const avgRes = await api.get(`/api/grades/students/${student.id}/averages`, {
        params: { term, academic_year: academicYear },
      });
      setHeroAverage(avgRes.data?.general_average ?? null);
    } catch {
      setHeroAverage(null);
    }
  };

  const loadFinanceData = async () => {
    try {
      setLoadingFinance(true);
      setFinanceError(null);
      const res = await api.get('/api/payments', { params: { student_id: student.id } });
      const list = extractList<any>(res);
      setPayments(
        list.map((row) => ({
          id: String(row.id),
          date: row.paid_at || row.created_at || '',
          type: row.type || 'Frais',
          amount: Number(row.amount || 0),
          currency: row.currency || 'USD',
          status: row.status || 'pending',
        }))
      );
    } catch (error) {
      console.error('Erreur chargement finance eleve:', error);
      setFinanceError("Impossible de charger l'historique financier.");
    } finally {
      setLoadingFinance(false);
    }
  };

  const loadAttendanceData = async () => {
    try {
      setLoadingAttendance(true);
      setAttendanceError(null);
      const [summaryRes, listRes] = await Promise.all([
        api.get(`/api/students/${student.id}/attendance/summary`),
        api.get(`/api/students/${student.id}/attendance`, { params: { per_page: 50 } }),
      ]);

      const summary = summaryRes.data?.summary || {};
      setAttendanceSummary({
        rate: Number(summary.attendance_rate || 0),
        present: Number(summary.present || 0),
        late: Number(summary.late || 0),
        absent: Number(summary.absent || 0),
        excused: Number(summary.excused || 0),
      });

      const mappedRecords = extractList<any>(listRes).map((row) => ({
        id: String(row.id),
        studentId: String(row.student_id),
        attendanceDate: row.attendance_date,
        status: row.status,
        reason: row.reason || '',
        notes: row.notes || '',
      }));
      setAttendanceRecords(mappedRecords);
    } catch (error) {
      console.error('Erreur chargement presences:', error);
      setAttendanceError("Impossible de charger les présences.");
    } finally {
      setLoadingAttendance(false);
    }
  };

  const loadDocuments = async () => {
    try {
      setLoadingDocuments(true);
      setDocumentsError(null);
      const res = await api.get(`/api/students/${student.id}/documents`);
      const mapped = extractList<any>(res).map((row) => ({
        id: String(row.id),
        studentId: String(row.student_id),
        type: row.type || 'general',
        filePath: row.file_path || '',
        url: row.url || '',
        originalName: row.original_name || 'Document',
        mimeType: row.mime_type || '',
        size: Number(row.size || 0),
        createdAt: row.created_at || '',
      }));
      setDocuments(mapped);
    } catch (error) {
      console.error('Erreur chargement documents:', error);
      setDocumentsError('Impossible de charger les documents.');
    } finally {
      setLoadingDocuments(false);
    }
  };

  useEffect(() => {
    setProfileStudent(student);
    loadStudentProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student.id]);

  useEffect(() => {
    if (activeTab === 'academique' || activeTab === 'profil') {
      loadAcademicData();
    } else if (activeTab === 'finance') {
      loadFinanceData();
    } else if (activeTab === 'presences') {
      loadAttendanceData();
    } else if (activeTab === 'documents') {
      loadDocuments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, student.id, term, academicYear]);

  const fullName = `${profileStudent.firstName} ${profileStudent.lastName}`.trim();
  const initials = `${profileStudent.firstName?.[0] ?? ''}${profileStudent.lastName?.[0] ?? ''}`.toUpperCase();
  const statusLabel = profileStudent.status === 'active' ? 'ACTIF' : profileStudent.status === 'suspended' ? 'SUSPENDU' : 'INACTIF';
  const genderLabel = profileStudent.gender === 'M' ? 'Masculin' : 'Féminin';
  const age = (() => {
    const dob = new Date(profileStudent.dateOfBirth);
    const now = new Date();
    let years = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) years--;
    return Number.isFinite(years) && years >= 0 ? years : null;
  })();

  const financeSummary = useMemo(() => {
    const totalPaid = payments.filter((p) => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
    const totalPending = payments.filter((p) => p.status !== 'completed').reduce((sum, p) => sum + p.amount, 0);
    return { totalPaid, totalPending, total: totalPaid + totalPending };
  }, [payments]);

  const saveAttendance = async () => {
    try {
      setSavingAttendance(true);
      await api.post(`/api/students/${student.id}/attendance`, {
        attendance_date: attendanceForm.date,
        status: attendanceForm.status,
        reason: attendanceForm.reason || null,
        notes: attendanceForm.notes || null,
      });
      await loadAttendanceData();
      setAttendanceForm((prev) => ({ ...prev, reason: '', notes: '' }));
    } catch (error) {
      console.error('Erreur enregistrement presence:', error);
      alert("Impossible d'enregistrer la présence.");
    } finally {
      setSavingAttendance(false);
    }
  };

  const uploadDocument = async () => {
    if (!docFile) {
      alert('Sélectionnez un fichier.');
      return;
    }
    try {
      setUploadingDoc(true);
      const formData = new FormData();
      formData.append('type', docType);
      formData.append('file', docFile);
      await api.post(`/api/students/${student.id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDocFile(null);
      await loadDocuments();
    } catch (error) {
      console.error('Erreur upload document:', error);
      alert("Échec de l'upload du document.");
    } finally {
      setUploadingDoc(false);
    }
  };

  const deleteDocument = async (documentId: string) => {
    const confirmed = window.confirm('Supprimer ce document ?');
    if (!confirmed) {
      return;
    }
    try {
      await api.delete(`/api/students/${student.id}/documents/${documentId}`);
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
    } catch (error) {
      console.error('Erreur suppression document:', error);
      alert('Suppression impossible.');
    }
  };

  return (
    <div className="student-file-page">
      <div className="student-file-top-actions">
        <button className="action-btn outline" onClick={onClose}>
          <span className="material-symbols-outlined">arrow_back</span>
          Retour à la liste
        </button>
        <div className="action-group">
          <button className="action-btn outline" onClick={() => window.print()}>
            <span className="material-symbols-outlined">print</span>
            Imprimer le dossier
          </button>
          {onEdit && (
            <button className="action-btn primary" onClick={() => onEdit(profileStudent)}>
              <span className="material-symbols-outlined">edit</span>
              Modifier le dossier
            </button>
          )}
        </div>
      </div>

      <section className="student-file-hero">
        <div className="hero-profile">
          <div className="hero-avatar">
            {profileStudent.photo ? <img src={profileStudent.photo} alt={fullName} /> : <span>{initials}</span>}
            <i />
          </div>
          <div className="hero-info">
            <div className="hero-title-row">
              <h2>{fullName}</h2>
              <span className={`status-chip ${profileStudent.status}`}>{statusLabel}</span>
            </div>
            <div className="hero-meta">
              <span><span className="material-symbols-outlined">tag</span> Matricule: {profileStudent.matricule || profileStudent.studentNumber}</span>
              <span><span className="material-symbols-outlined">school</span> {profileStudent.class || 'Classe non assignée'}</span>
              <span><span className="material-symbols-outlined">calendar_today</span> Année: {profileStudent.academicYear || '2024-2025'}</span>
            </div>
          </div>
        </div>
        <div className="hero-stats">
          <div className="hero-stat-box">
            <p>Présences</p>
            <strong>{attendanceSummary.rate.toFixed(1)}%</strong>
          </div>
          <div className="hero-stat-box">
            <p>Moyenne</p>
            <strong>{heroAverage !== null ? heroAverage.toFixed(2) : '--'}</strong>
          </div>
        </div>
      </section>

      <div className="student-file-tabs">
        <button className={activeTab === 'profil' ? 'active' : ''} onClick={() => setActiveTab('profil')}>Profil</button>
        <button className={activeTab === 'academique' ? 'active' : ''} onClick={() => setActiveTab('academique')}>Notes & bulletins</button>
        <button className={activeTab === 'finance' ? 'active' : ''} onClick={() => setActiveTab('finance')}>Finance</button>
        <button className={activeTab === 'presences' ? 'active' : ''} onClick={() => setActiveTab('presences')}>Présences</button>
        <button className={activeTab === 'documents' ? 'active' : ''} onClick={() => setActiveTab('documents')}>Documents</button>
      </div>

      {activeTab === 'profil' && (
      <div className="profile-tab-stack">
      <div className="student-file-grid">
        <div className="main-column">
          <section className="info-card">
            <header>
              <h3><span className="material-symbols-outlined">person</span> Informations Personnelles</h3>
            </header>
            {loadingProfile ? (
              <div className="card-loading"><Skeleton className="skel-h-24" /></div>
            ) : (
            <div className="info-grid">
              <div><label>Date de naissance</label><p>{new Date(profileStudent.dateOfBirth).toLocaleDateString('fr-FR')}{age !== null ? ` (${age} ans)` : ''}</p></div>
              <div><label>Genre</label><p>{genderLabel}</p></div>
              <div><label>Nationalité</label><p>{profileStudent.nationality || 'Congolaise (RDC)'}</p></div>
              <div><label>Groupe sanguin</label><p>{profileStudent.bloodGroup || 'Non renseigné'}</p></div>
              <div className="full"><label>Adresse complète</label><p>{profileStudent.address || 'Non renseignée'}</p></div>
              <div><label>Ville</label><p>{profileStudent.city || 'Non renseignée'}</p></div>
              <div><label>Province</label><p>{profileStudent.province || 'Non renseignée'}</p></div>
            </div>
            )}
            {profileError && <p className="tab-error">{profileError}</p>}
          </section>

          <section className="info-card">
            <header>
              <h3><span className="material-symbols-outlined">school</span> Informations scolaires</h3>
            </header>
            <div className="info-grid">
              <div><label>Classe actuelle</label><p>{profileStudent.class || 'Non assignée'}</p></div>
              <div><label>Année scolaire</label><p>{profileStudent.academicYear || '2024-2025'}</p></div>
              <div><label>Date d'inscription</label><p>{new Date(profileStudent.enrollmentDate).toLocaleDateString('fr-FR')}</p></div>
              <div><label>Statut académique</label><p>{profileStudent.academicStatus || 'Régulier'}</p></div>
              {profileStudent.previousSchool && <div className="full"><label>École précédente</label><p>{profileStudent.previousSchool}</p></div>}
            </div>
          </section>
        </div>

        <aside className="side-column">
          <section className="parent-card">
            <header>
              <h3><span className="material-symbols-outlined">family_restroom</span> Tuteur / Parent</h3>
            </header>
            <div className="parent-body">
              <div className="parent-identity">
                <div className="parent-avatar">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <div>
                  <p>{profileStudent.guardianName || 'Non renseigné'}</p>
                  <small>{profileStudent.guardianRelation || 'Parent/Tuteur'}</small>
                </div>
              </div>
              <button className="parent-contact" onClick={() => onContactParent?.(profileStudent)}>
                <span className="material-symbols-outlined">call</span>
                <span>{profileStudent.guardianPhone || 'Non renseigné'}</span>
              </button>
              <button className="parent-contact" onClick={() => onContactParent?.(profileStudent)}>
                <span className="material-symbols-outlined">mail</span>
                <span>{profileStudent.guardianEmail || 'Non renseigné'}</span>
              </button>
            </div>
          </section>

          <section className="quick-actions-card">
            <p>Accès Rapide</p>
            <button onClick={() => setActiveTab('finance')}>
              <span className="material-symbols-outlined">receipt_long</span>
              Voir les paiements
              <span className="material-symbols-outlined end">chevron_right</span>
            </button>
            <button onClick={() => setActiveTab('academique')}>
              <span className="material-symbols-outlined">history_edu</span>
              Bulletin de notes
              <span className="material-symbols-outlined end">chevron_right</span>
            </button>
            <button onClick={() => setActiveTab('presences')}>
              <span className="material-symbols-outlined">event_busy</span>
              Signaler une absence
              <span className="material-symbols-outlined end">chevron_right</span>
            </button>
          </section>
        </aside>
      </div>
      {(profileStudent.allergies || profileStudent.medicalConditions || profileStudent.emergencyContact) && (
        <section className="info-card">
          <header>
            <h3><span className="material-symbols-outlined">health_and_safety</span> Informations Médicales</h3>
          </header>
          <div className="info-grid">
            {profileStudent.allergies && <div className="full"><label>Allergies</label><p>{profileStudent.allergies}</p></div>}
            {profileStudent.medicalConditions && <div className="full"><label>Conditions médicales</label><p>{profileStudent.medicalConditions}</p></div>}
            {profileStudent.emergencyContact && <div><label>Contact d'urgence</label><p>{profileStudent.emergencyContact}</p></div>}
          </div>
        </section>
      )}
      </div>
      )}

      {activeTab === 'academique' && (
        <section className="info-card">
          <header className="tab-head">
            <h3><span className="material-symbols-outlined">school</span> Parcours scolaire & bulletin</h3>
            <div className="tab-filters">
              <select value={term} onChange={(e) => setTerm(e.target.value)}>
                {(periodOptions.length ? periodOptions : [{ code: 'T1', label: 'T1' }, { code: 'T2', label: 'T2' }, { code: 'T3', label: 'T3' }]).map((p) => (
                  <option key={p.code} value={p.code}>{p.label}</option>
                ))}
              </select>
              <input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="2025-2026" />
            </div>
          </header>
          <div className="tab-body">
            <StudentAcademicPanel
              studentId={Number(profileStudent.id)}
              classId={profileStudent.classId ? Number(profileStudent.classId) : null}
              academicYear={academicYear}
              term={term}
              onTermChange={setTerm}
              onPeriodsLoaded={setPeriodOptions}
            />
          </div>
        </section>
      )}

      {activeTab === 'finance' && (
        <section className="info-card">
          <header><h3><span className="material-symbols-outlined">payments</span> Situation financière</h3></header>
          <div className="tab-body">
            {loadingFinance && <Skeleton className="skel-h-24" />}
            {financeError && <p className="tab-error">{financeError}</p>}
            {!loadingFinance && !financeError && (
              <>
                <div className="metrics-row">
                  <div className="metric-box"><small>Total</small><strong>{financeSummary.total.toLocaleString()} USD/CDF</strong></div>
                  <div className="metric-box"><small>Payé</small><strong>{financeSummary.totalPaid.toLocaleString()} USD/CDF</strong></div>
                  <div className="metric-box"><small>Restant</small><strong>{financeSummary.totalPending.toLocaleString()} USD/CDF</strong></div>
                </div>
                <div className="tab-table-wrap">
                  <table className="tab-table">
                    <thead>
                      <tr><th>Date</th><th>Type</th><th>Montant</th><th>Statut</th></tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id}>
                          <td>{p.date ? new Date(p.date).toLocaleDateString('fr-FR') : '-'}</td>
                          <td>{p.type}</td>
                          <td>{p.amount.toLocaleString()} {p.currency}</td>
                          <td>{p.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!payments.length && <p className="tab-empty">Aucun paiement enregistré pour cet élève.</p>}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {activeTab === 'presences' && (
        <section className="info-card">
          <header><h3><span className="material-symbols-outlined">event_available</span> Présences</h3></header>
          <div className="tab-body">
            {loadingAttendance && <Skeleton className="skel-h-24" />}
            {attendanceError && <p className="tab-error">{attendanceError}</p>}
            {!loadingAttendance && !attendanceError && (
              <>
                <div className="metrics-row">
                  <div className="metric-box"><small>Taux</small><strong>{attendanceSummary.rate.toFixed(1)}%</strong></div>
                  <div className="metric-box"><small>Présent/Late</small><strong>{attendanceSummary.present + attendanceSummary.late}</strong></div>
                  <div className="metric-box"><small>Absent/Excusé</small><strong>{attendanceSummary.absent + attendanceSummary.excused}</strong></div>
                </div>
                <div className="attendance-form">
                  <input type="date" value={attendanceForm.date} onChange={(e) => setAttendanceForm((p) => ({ ...p, date: e.target.value }))} />
                  <select value={attendanceForm.status} onChange={(e) => setAttendanceForm((p) => ({ ...p, status: e.target.value as StudentAttendance['status'] }))}>
                    <option value="present">Présent</option>
                    <option value="late">Retard</option>
                    <option value="absent">Absent</option>
                    <option value="excused">Excusé</option>
                  </select>
                  <input value={attendanceForm.reason} onChange={(e) => setAttendanceForm((p) => ({ ...p, reason: e.target.value }))} placeholder="Motif (optionnel)" />
                  <input value={attendanceForm.notes} onChange={(e) => setAttendanceForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Notes (optionnel)" />
                  <button type="button" className="action-btn primary" onClick={saveAttendance} disabled={savingAttendance}>
                    {savingAttendance ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
                <div className="tab-table-wrap">
                  <table className="tab-table">
                    <thead>
                      <tr><th>Date</th><th>Statut</th><th>Motif</th><th>Notes</th></tr>
                    </thead>
                    <tbody>
                      {attendanceRecords.map((row) => (
                        <tr key={row.id}>
                          <td>{new Date(row.attendanceDate).toLocaleDateString('fr-FR')}</td>
                          <td>{row.status}</td>
                          <td>{row.reason || '-'}</td>
                          <td>{row.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!attendanceRecords.length && <p className="tab-empty">Aucun enregistrement de présence pour cet élève.</p>}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {activeTab === 'documents' && (
        <section className="info-card">
          <header><h3><span className="material-symbols-outlined">folder</span> Documents</h3></header>
          <div className="tab-body">
            {loadingDocuments && <Skeleton className="skel-h-24" />}
            {documentsError && <p className="tab-error">{documentsError}</p>}
            {!loadingDocuments && !documentsError && (
              <>
                <div className="documents-upload">
                  <select value={docType} onChange={(e) => setDocType(e.target.value)}>
                    <option value="general">Général</option>
                    <option value="bulletin">Bulletin</option>
                    <option value="identite">Identité</option>
                    <option value="sante">Santé</option>
                  </select>
                  <input type="file" onChange={(e) => setDocFile(e.target.files?.[0] || null)} />
                  <button type="button" className="action-btn primary" onClick={uploadDocument} disabled={uploadingDoc}>
                    {uploadingDoc ? 'Upload...' : 'Uploader'}
                  </button>
                </div>
                <div className="tab-table-wrap">
                  <table className="tab-table">
                    <thead>
                      <tr><th>Type</th><th>Nom</th><th>Taille</th><th>Date</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => (
                        <tr key={doc.id}>
                          <td>{doc.type}</td>
                          <td>{doc.originalName}</td>
                          <td>{(doc.size / 1024).toFixed(1)} KB</td>
                          <td>{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('fr-FR') : '-'}</td>
                          <td className="table-actions">
                            <a href={doc.url} target="_blank" rel="noreferrer">
                              <span className="material-symbols-outlined">download</span>
                            </a>
                            <button type="button" onClick={() => deleteDocument(doc.id)}>
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!documents.length && <p className="tab-empty">Aucun document disponible pour cet élève.</p>}
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default StudentDetails;



