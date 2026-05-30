import React, { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import api from '@/core/api/client';
import { extractList } from '@/core/api/extractData';
import LocationSelect, { type LocationValue } from '@/core/Components/LocationSelect';
import './ApplicationForm.css';

export interface ApplicationFormData {
  id?: string;
  
  // Student Information
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'M' | 'F';
  placeOfBirth: string;
  nationality: string;
  
  // Contact Information
  phone?: string;
  email?: string;
  address: string;
  city: string;
  province: string;
  
  // Parent/Guardian Information
  parentName: string;
  parentRelation: string;
  parentPhone: string;
  parentEmail?: string;
  parentOccupation?: string;
  
  // Application Details
  appliedClass: string;
  appliedSection?: string;
  academicYear: string;
  previousSchool?: string;
  previousClass?: string;
  
  // Status
  applicationDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'interview' | 'waitlist';
  interviewDate?: string;
  
  // Documents Submitted
  hasBirthCertificate: boolean;
  hasReportCard: boolean;
  hasPhoto: boolean;
  hasTransferCertificate: boolean;
  
  // Notes
  notes?: string;
  reviewedBy?: string;
}

interface ApplicationFormProps {
  initialData?: ApplicationFormData;
  onSubmit: (data: ApplicationFormData) => void;
  onCancel: () => void;
  mode?: 'create' | 'edit';
}

const ApplicationForm: React.FC<ApplicationFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  mode = 'create'
}) => {
  const [formData, setFormData] = useState<ApplicationFormData>(initialData || {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'M',
    placeOfBirth: '',
    nationality: 'Congolaise (RDC)',
    address: '',
    city: '',
    province: '',
    parentName: '',
    parentRelation: 'Père',
    parentPhone: '',
    appliedClass: '',
    academicYear: new Date().getFullYear().toString(),
    applicationDate: new Date().toISOString().split('T')[0],
    status: 'pending',
    hasBirthCertificate: false,
    hasReportCard: false,
    hasPhoto: false,
    hasTransferCertificate: false
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ApplicationFormData, string>>>({});

  const [schoolClasses, setSchoolClasses] = useState<{ id: string; name: string }[]>([]);

  const [location, setLocation] = useState<LocationValue>({
    province_id: '',
    city_id: '',
    commune_id: '',
    quartier: '',
    address: initialData?.address || '',
    province: initialData?.province || '',
    city: initialData?.city || '',
  });

  useEffect(() => {
    api.get('/api/classes', { params: { per_page: 200 } })
      .then((res) => {
        setSchoolClasses(
          extractList<Record<string, unknown>>(res).map((c) => ({
            id: String(c.id),
            name: String(c.display_name || c.name || ''),
          }))
        );
      })
      .catch(() => setSchoolClasses([]));
  }, []);

  const sections = [
    'Scientifique Math-Physique',
    'Scientifique Chimie-Biologie',
    'Littéraire Latin-Philo',
    'Commerciale et Gestion',
    'Pédagogie Générale (Rénovée)',
    'Électricité',
    'Mécanique',
    'Construction',
    'Nutrition',
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name as keyof ApplicationFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ApplicationFormData, string>> = {};

    // Student info
    if (!formData.firstName) newErrors.firstName = 'Prénom requis';
    if (!formData.lastName) newErrors.lastName = 'Nom requis';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date de naissance requise';
    if (!formData.placeOfBirth) newErrors.placeOfBirth = 'Lieu de naissance requis';
    
    // Contact
    if (!formData.address) newErrors.address = 'Adresse requise';
    if (!formData.city) newErrors.city = 'Ville requise';
    if (!formData.province) newErrors.province = 'Province requise';
    
    // Parent
    if (!formData.parentName) newErrors.parentName = 'Nom du parent requis';
    if (!formData.parentPhone) newErrors.parentPhone = 'Téléphone du parent requis';
    if (!/^(\+243|0)[0-9]{9}$/.test(formData.parentPhone)) {
      newErrors.parentPhone = 'Format: +243XXXXXXXXX ou 0XXXXXXXXX';
    }
    
    // Application
    if (!formData.appliedClass) newErrors.appliedClass = 'Classe requise';
    if (!formData.applicationDate) newErrors.applicationDate = 'Date requise';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="application-form-container">
      <div className="application-form-header">
        <h2>{mode === 'create' ? 'Nouvelle Demande d\'Admission' : 'Modifier Demande'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="application-form">
        {/* Student Information */}
        <div className="form-section">
          <h3>Informations de l'Élève</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Prénom *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={errors.firstName ? 'error' : ''}
              />
              {errors.firstName && <span className="error-message">{errors.firstName}</span>}
            </div>

            <div className="form-group">
              <label>Nom *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={errors.lastName ? 'error' : ''}
              />
              {errors.lastName && <span className="error-message">{errors.lastName}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date de Naissance *</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className={errors.dateOfBirth ? 'error' : ''}
              />
              {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth}</span>}
            </div>

            <div className="form-group">
              <label>Sexe *</label>
              <select name="gender" value={formData.gender} onChange={handleChange}>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Lieu de Naissance *</label>
              <input
                type="text"
                name="placeOfBirth"
                value={formData.placeOfBirth}
                onChange={handleChange}
                className={errors.placeOfBirth ? 'error' : ''}
              />
              {errors.placeOfBirth && <span className="error-message">{errors.placeOfBirth}</span>}
            </div>

            <div className="form-group">
              <label>Nationalité *</label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="form-section">
          <h3>Adresse et Contact</h3>
          
          <LocationSelect
            value={location}
            onChange={(loc) => {
              setLocation(loc);
              setFormData((prev) => ({
                ...prev,
                address: loc.address,
                city: loc.city || prev.city,
                province: loc.province || prev.province,
              }));
            }}
          />
          {errors.address && <span className="error-message">{errors.address}</span>}

          <div className="form-row">
            <div className="form-group">
              <label>Téléphone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                placeholder="+243XXXXXXXXX"
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Parent Information */}
        <div className="form-section">
          <h3>Informations du Parent/Tuteur</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Nom Complet *</label>
              <input
                type="text"
                name="parentName"
                value={formData.parentName}
                onChange={handleChange}
                className={errors.parentName ? 'error' : ''}
              />
              {errors.parentName && <span className="error-message">{errors.parentName}</span>}
            </div>

            <div className="form-group">
              <label>Relation *</label>
              <select name="parentRelation" value={formData.parentRelation} onChange={handleChange}>
                <option value="Père">Père</option>
                <option value="Mère">Mère</option>
                <option value="Oncle">Oncle</option>
                <option value="Tante">Tante</option>
                <option value="Grand-parent">Grand-parent</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Téléphone *</label>
              <input
                type="tel"
                name="parentPhone"
                value={formData.parentPhone}
                onChange={handleChange}
                className={errors.parentPhone ? 'error' : ''}
                placeholder="+243XXXXXXXXX"
              />
              {errors.parentPhone && <span className="error-message">{errors.parentPhone}</span>}
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="parentEmail"
                value={formData.parentEmail || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Profession</label>
            <input
              type="text"
              name="parentOccupation"
              value={formData.parentOccupation || ''}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Application Details */}
        <div className="form-section">
          <h3>Détails de la Demande</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Classe Demandée *</label>
              <select
                name="appliedClass"
                value={formData.appliedClass}
                onChange={handleChange}
                className={errors.appliedClass ? 'error' : ''}
              >
                <option value="">Sélectionner...</option>
                {schoolClasses.length === 0 && (
                  <option value="" disabled>Créez des classes dans le module Classes</option>
                )}
                {schoolClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
              {errors.appliedClass && <span className="error-message">{errors.appliedClass}</span>}
            </div>

            <div className="form-group">
              <label>Option (Humanités)</label>
              <select name="appliedSection" value={formData.appliedSection || ''} onChange={handleChange}>
                <option value="">N/A</option>
                {sections.map(sec => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Année scolaire *</label>
              <input
                type="text"
                name="academicYear"
                value={formData.academicYear}
                onChange={handleChange}
                placeholder="2024-2025"
              />
            </div>

            <div className="form-group">
              <label>Date de Demande *</label>
              <input
                type="date"
                name="applicationDate"
                value={formData.applicationDate}
                onChange={handleChange}
                className={errors.applicationDate ? 'error' : ''}
              />
              {errors.applicationDate && <span className="error-message">{errors.applicationDate}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>École Précédente</label>
              <input
                type="text"
                name="previousSchool"
                value={formData.previousSchool || ''}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Classe Précédente</label>
              <input
                type="text"
                name="previousClass"
                value={formData.previousClass || ''}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Status and Documents */}
        <div className="form-section">
          <h3>Statut et Documents</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Statut *</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="pending">⏳ En Attente</option>
                <option value="approved">✅ Approuvée</option>
                <option value="rejected">❌ Rejetée</option>
                <option value="interview">📅 Entretien</option>
                <option value="waitlist">⏸️ Liste d'Attente</option>
              </select>
            </div>

            <div className="form-group">
              <label>Date d'Entretien</label>
              <input
                type="date"
                name="interviewDate"
                value={formData.interviewDate || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="documents-checklist">
            <h4>Documents Soumis:</h4>
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="hasBirthCertificate"
                checked={formData.hasBirthCertificate}
                onChange={handleChange}
              />
              <span>Acte de Naissance</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                name="hasReportCard"
                checked={formData.hasReportCard}
                onChange={handleChange}
              />
              <span>Bulletin Scolaire</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                name="hasPhoto"
                checked={formData.hasPhoto}
                onChange={handleChange}
              />
              <span>Photo d'Identité</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                name="hasTransferCertificate"
                checked={formData.hasTransferCertificate}
                onChange={handleChange}
              />
              <span>Certificat de Transfert</span>
            </label>
          </div>

          <div className="form-group">
            <label>Notes/Observations</label>
            <textarea
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Examiné Par</label>
            <input
              type="text"
              name="reviewedBy"
              value={formData.reviewedBy || ''}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn-cancel">
            Annuler
          </button>
          <button type="submit" className="btn-success">
            {mode === 'create' ? 'Soumettre la Demande' : 'Mettre à Jour'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplicationForm;




