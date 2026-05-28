import React, { useEffect, useMemo, useState } from 'react';
import api from '@/core/api/client';
import { useNavigate } from 'react-router-dom';
import type { Student } from '../types';
import StudentForm from '../Components/StudentForm';
import type { StudentFormData } from '../Components/StudentForm';
import StudentDetails from '../Components/StudentDetails';
import { extractList } from '@/core/api/extractData';
import './StudentManagement.css';
import Can from '@/core/Components/Can';
import Skeleton from '@/core/Components/Skeleton';

const StudentManagement: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentFormData | undefined>(undefined);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [allClasses, setAllClasses] = useState<{ id: string; name: string }[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedClass, selectedStatus]);

  const mapStudent = (s: any): Student => ({
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
    province_id: s.province_id ? String(s.province_id) : '',
    city_id: s.city_id ? String(s.city_id) : '',
    commune_id: s.commune_id ? String(s.commune_id) : '',
    quartier: s.quartier || '',
    phone: s.phone || '',
    email: s.email || '',
    parentIds: Array.isArray(s.parent_ids) ? s.parent_ids.map(String) : [],
    guardianName: s.guardian_name || '',
    guardianRelation: s.guardian_relation || '',
    guardianPhone: s.guardian_phone || '',
    guardianEmail: s.guardian_email || '',
    classId: String(s.class_id || ''),
    class: s.school_class?.display_name || s.school_class?.name || 'Non assignée',
    academicYear: s.academic_year || '',
    academicStatus: s.academic_status || '',
    previousSchool: s.previous_school || '',
    enrollmentDate: s.enrollment_date ? new Date(s.enrollment_date) : new Date(),
    allergies: s.allergies || '',
    medicalConditions: s.medical_conditions || '',
    emergencyContact: s.emergency_contact || '',
    medicalInfo: s.medical_info || undefined,
    isActive: Boolean(s.is_active ?? s.status === 'active'),
    status: (s.status || 'active') as Student['status'],
  });

  const handleViewDetailsClick = async (student: Student) => {
    try {
      const response = await api.get(`/api/students/${student.id}`);
      const payload = response.data?.data ?? response.data;
      setSelectedStudent(mapStudent(payload));
    } catch (error) {
      console.error('Erreur chargement dossier eleve:', error);
      setSelectedStudent(student);
    }
    setShowDetails(true);
  };

  const loadStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/students', { params: { per_page: 100 } });
      const list = extractList<Record<string, unknown>>(response);

      const mapped = list.map((s: any) => mapStudent(s));

      setStudents(mapped);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const response = await api.get('/api/classes');
      setAllClasses(
        extractList<Record<string, unknown>>(response).map((c) => ({
          id: String(c.id),
          name: String(c.display_name || c.name || ''),
          display_name: String(c.display_name || c.name || ''),
        }))
      );
    } catch (e) { console.error('Error loading classes:', e); }
  };

  useEffect(() => {
    loadStudents();
    loadClasses();
  }, []);

  const getStatusLabel = (student: Student) => {
    if (student.status === 'suspended') return 'Suspendu';
    return student.isActive ? 'Actif' : 'Inactif';
  };

  const filteredStudents = useMemo(() => students.filter(student => {
    const matchesSearch = `${student.firstName} ${student.lastName} ${student.matricule} ${student.studentNumber}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'all' || student.classId === selectedClass;
    const statusValue = getStatusLabel(student).toLowerCase();
    const matchesStatus = selectedStatus === 'all' || statusValue === selectedStatus;
    return matchesSearch && matchesClass && matchesStatus;
  }), [students, searchTerm, selectedClass, selectedStatus]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));

  const newThisMonth = students.filter((student) => {
    const d = new Date(student.enrollmentDate);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const getInitials = (student: Student) => {
    const f = student.firstName?.[0] ?? '';
    const l = student.lastName?.[0] ?? '';
    return `${f}${l}`.toUpperCase();
  };

  const handleAddStudent = () => {
    setEditingStudent(undefined);
    setShowDetails(false);
    setShowForm(true);
  };

  const handleEditStudent = (student: Student) => {
    const formData: StudentFormData = {
      id: student.id,
      matricule: student.studentNumber || student.matricule || '',
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
      gender: student.gender || 'M',
      placeOfBirth: student.placeOfBirth || '',
      nationality: student.nationality || 'Congolaise (RDC)',
      address: student.address || '',
      city: student.city || 'Kinshasa',
      province: student.province || '',
      province_id: student.province_id || '',
      city_id: student.city_id || '',
      commune_id: student.commune_id || '',
      quartier: student.quartier || '',
      guardianName: student.guardianName || '',
      guardianRelation: student.guardianRelation || 'Pere',
      guardianPhone: student.guardianPhone || '',
      class: student.classId || '',
      academicYear: student.academicYear || new Date().getFullYear().toString(),
      admissionDate: student.enrollmentDate ? new Date(student.enrollmentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      emergencyContact: student.emergencyContact || student.guardianName || '',
      emergencyPhone: student.phone || student.guardianPhone || '',
      hasbirthCertificate: false,
      hasVaccinationCard: false,
      hasReportCard: false,
      hasPhoto: !!student.photo,
      tuitionStatus: 'unpaid',
      status: (student.status === 'suspended' ? 'inactive' : student.status) as any
    };
    setEditingStudent(formData);
    setShowDetails(false);
    setShowForm(true);
  };

  const handleSubmitStudent = async (data: StudentFormData) => {
    try {
      console.log('Sending student data via axios:', data);
      const url = editingStudent ? `/api/students/${editingStudent.id}` : '/api/students';
      const method = editingStudent ? 'put' : 'post';
      
      const payload = {
        matricule: data.matricule,
        student_number: data.matricule,
        first_name: data.firstName,
        last_name: data.lastName,
        date_of_birth: data.dateOfBirth,
        gender: data.gender,
        class_id: data.class,
        enrollment_date: data.admissionDate,
        guardian_name: data.guardianName,
        guardian_phone: data.guardianPhone,
        status: data.status,
        address: data.address,
        city: data.city,
        province: data.province,
        province_id: data.province_id ? Number(data.province_id) : null,
        city_id: data.city_id ? Number(data.city_id) : null,
        commune_id: data.commune_id ? Number(data.commune_id) : null,
        quartier: data.quartier || null,
        phone: data.phone,
        email: data.email,
      };

      const response =
        method === 'put'
          ? await api.put(url, payload)
          : await api.post(url, payload);

      console.log('Server response:', response.data);
      await loadStudents();
      setShowForm(false);
      setEditingStudent(undefined);
    } catch (error: any) {
      console.error('Error saving student:', error);
      const msg = error.response?.data?.message || error.message || 'Erreur lors du transfert';
      alert(`Erreur: ${msg}`);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingStudent(undefined);
  };

  const handleViewPayments = (studentId: string) => {
    navigate(`/finance?studentId=${encodeURIComponent(studentId)}`);
  };

  const handleContactParent = (student: Student) => {
    const phone = (student.guardianPhone || '').trim();
    const email = (student.guardianEmail || '').trim();

    if (phone) {
      window.location.href = `tel:${phone}`;
      return;
    }
    if (email) {
      window.location.href = `mailto:${email}`;
      return;
    }
    alert('Aucun contact parent disponible pour cet élève.');
  };

  if (loading) {
    return (
      <div className="student-directory-page">
        <div className="skeleton-stack">
          <Skeleton className="skel-h-10" />
          <Skeleton className="skel-h-24" />
          <Skeleton className="skel-h-24" />
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="student-directory-page">
        <div className="fullpage-view-card">
          <div className="fullpage-view-head">
            <button className="view-back-btn" onClick={handleCancelForm}>
              <span className="material-symbols-outlined">arrow_back</span>
              Retour à la liste
            </button>
          </div>
          <StudentForm
            initialData={editingStudent}
            classes={allClasses}
            onSubmit={handleSubmitStudent}
            onCancel={handleCancelForm}
            mode={editingStudent ? 'edit' : 'create'}
          />
        </div>
      </div>
    );
  }

  if (showDetails && selectedStudent) {
    return (
      <div className="student-directory-page">
        <div className="fullpage-view-card">
          <StudentDetails
            student={selectedStudent}
            onClose={() => {
              setShowDetails(false);
              setSelectedStudent(null);
            }}
            onEdit={(s) => {
              setShowDetails(false);
              setSelectedStudent(null);
              handleEditStudent(s);
            }}
            onViewPayments={handleViewPayments}
            onContactParent={handleContactParent}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="student-directory-page">
      <div className="directory-header">
        <div>
          <h2>Liste des élèves</h2>
          <div className="breadcrumbs">
            <span>SmartSchool ERP</span>
            <span className="material-symbols-outlined">chevron_right</span>
            <span className="active">Annuaire</span>
          </div>
        </div>
        <Can permission="students:write">
          <button className="add-student-btn" onClick={handleAddStudent}>
            <span className="material-symbols-outlined">add</span>
            Ajouter un eleve
          </button>
        </Can>
      </div>

      <div className="directory-filter-grid">
        <div className="glass-card filter-main">
          <span className="material-symbols-outlined">filter_list</span>
          <div className="filter-controls">
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
              <option value="all">Toutes les classes</option>
              {allClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
              <option value="all">Tous les statuts</option>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
              <option value="diplome">Diplome</option>
            </select>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-left">
            <div className="stat-icon secondary">
              <span className="material-symbols-outlined">person</span>
            </div>
            <p>Total élèves</p>
          </div>
          <strong>{students.length.toLocaleString()}</strong>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-left">
            <div className="stat-icon tertiary">
              <span className="material-symbols-outlined">trending_up</span>
            </div>
            <p>Nouveaux (Mois)</p>
          </div>
          <strong>{newThisMonth}</strong>
        </div>
      </div>

      <div className="students-table-card">
        <div className="search-line">
          <span className="material-symbols-outlined">search</span>
          <input
            type="text"
            placeholder="Rechercher un eleve, matricule..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="students-table-scroll">
          <table className="students-table">
            <thead>
              <tr>
                <th>Matricule</th>
                <th>Élève</th>
                <th>Classe</th>
                <th>Statut</th>
                <th className="align-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentStudents.map((student) => {
                const statusLabel = getStatusLabel(student);
                return (
                  <tr key={student.id}>
                    <td>{student.studentNumber || student.matricule}</td>
                    <td>
                      <div className="student-info-cell">
                        <div className="student-avatar-sm">
                          {student.photo ? <img src={student.photo} alt={`${student.firstName} ${student.lastName}`} /> : getInitials(student)}
                        </div>
                        <div>
                          <p>{student.firstName} {student.lastName}</p>
                          <small>{student.email || '-'}</small>
                        </div>
                      </div>
                    </td>
                    <td>{student.class || 'Non assigne'}</td>
                    <td>
                      <span className={`status-badge ${statusLabel.toLowerCase()}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="align-right">
                      <div className="row-actions">
                        <button className="row-btn primary" onClick={() => handleViewDetailsClick(student)} title="Voir">
                          <span className="material-symbols-outlined">visibility</span>
                        </button>
                        <Can permission="students:write">
                          <button className="row-btn edit" onClick={() => handleEditStudent(student)} title="Editer">
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                        </Can>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="students-pagination">
          <p>
            Affichage de {filteredStudents.length === 0 ? 0 : indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredStudents.length)} sur {filteredStudents.length} eleves
          </p>
          <div className="pagination-buttons">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            {Array.from({ length: Math.min(3, totalPages) }, (_, idx) => idx + 1).map((page) => (
              <button
                key={page}
                className={currentPage === page ? 'active' : ''}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            {totalPages > 3 ? <span>...</span> : null}
            {totalPages > 3 ? (
              <button onClick={() => setCurrentPage(totalPages)}>{totalPages}</button>
            ) : null}
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};


export default StudentManagement;



