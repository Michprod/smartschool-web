import React, { useState } from 'react';
import Pagination from '@/core/Components/Pagination';
import './ReportsPage.css';
import api from '@/core/api/client';
import Skeleton from '@/core/Components/Skeleton';

interface Report {
  id: string;
  name: string;
  description: string;
  category: 'academic' | 'financial' | 'administrative' | 'students';
  icon: string;
}

const ReportsPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const reports: Report[] = [
    {
      id: 'student-list',
      name: 'Liste des élèves',
      description: 'Liste complète des élèves avec informations détaillées',
      category: 'students',
      icon: 'school'
    },
    {
      id: 'class-roster',
      name: 'Effectif par classe',
      description: 'Nombre d\'élèves par classe et niveau',
      category: 'academic',
      icon: 'bar_chart'
    },
    {
      id: 'attendance',
      name: 'Rapport de présence',
      description: 'Taux de présence par classe et par période',
      category: 'academic',
      icon: 'event_available'
    },
    {
      id: 'grades',
      name: 'Rapport de notes',
      description: 'Résultats académiques par classe et matière',
      category: 'academic',
      icon: 'insights'
    },
    {
      id: 'payment-summary',
      name: 'Résumé des paiements',
      description: 'Synthèse des paiements reçus (CDF/USD)',
      category: 'financial',
      icon: 'payments'
    },
    {
      id: 'payment-detail',
      name: 'Détails des paiements',
      description: 'Liste détaillée de tous les paiements',
      category: 'financial',
      icon: 'receipt_long'
    },
    {
      id: 'outstanding',
      name: 'Impayés',
      description: 'Élèves avec paiements en retard',
      category: 'financial',
      icon: 'warning'
    },
    {
      id: 'mobile-money',
      name: 'Transactions Mobile Money',
      description: 'Rapport des paiements via Mobile Money',
      category: 'financial',
      icon: 'smartphone'
    },
    {
      id: 'revenue',
      name: 'Revenus par période',
      description: 'Analyse des revenus mensuels/trimestriels',
      category: 'financial',
      icon: 'monitoring'
    },
    {
      id: 'admissions',
      name: 'Rapport d\'admissions',
      description: 'Statistiques des nouvelles inscriptions',
      category: 'administrative',
      icon: 'assignment'
    },
    {
      id: 'staff',
      name: 'Liste du personnel',
      description: 'Personnel enseignant et administratif',
      category: 'administrative',
      icon: 'group'
    },
    {
      id: 'events',
      name: 'Calendrier des événements',
      description: 'Événements passés et à venir',
      category: 'administrative',
      icon: 'calendar_month'
    },
    {
      id: 'student-profile',
      name: 'Fiche élève',
      description: 'Dossier complet d\'un élève',
      category: 'students',
      icon: 'badge'
    },
    {
      id: 'parent-contacts',
      name: 'Contacts parents',
      description: 'Liste des contacts parents/tuteurs',
      category: 'students',
      icon: 'call'
    },
    {
      id: 'student-demographics',
      name: 'Données démographiques',
      description: 'Répartition par âge, genre, province',
      category: 'students',
      icon: 'pie_chart'
    }
  ];

  const categories = [
    { id: 'all', label: 'Tous les rapports' },
    { id: 'academic', label: 'Académique' },
    { id: 'financial', label: 'Financier' },
    { id: 'administrative', label: 'Administratif' },
    { id: 'students', label: 'Élèves' }
  ];

  const filteredReports = reports.filter(report => {
    const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory;
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          report.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentReports = filteredReports.slice(indexOfFirstItem, indexOfLastItem);

  const handleGenerateReport = (reportId: string, reportName: string) => {
    console.log('Generating report:', reportId);
    alert(`Génération de "${reportName}" en cours.\nLe rapport sera disponible en PDF et Excel.`);
  };

  const handlePreviewReport = (reportName: string) => {
    alert(`Aperçu de "${reportName}" bientôt disponible.`);
  };

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await api.get('/api/reports/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="reports-page revamped-reports">
        <Skeleton className="skel-h-10" />
        <Skeleton className="skel-h-24" />
        <Skeleton className="skel-h-24" />
      </div>
    );
  }

  const revenueCdf = Number(stats?.finance?.totalRevenue?.cdf || 0);
  const attendanceRate = Number(stats?.attendanceRate || 94.8);

  const kpis = [
    {
      title: 'Élèves Actifs',
      value: (stats?.totalStudents || 0).toLocaleString('fr-FR'),
      sub: '+12% depuis l\'année passée',
      trend: 'up',
      icon: 'groups',
      tone: 'blue'
    },
    {
      title: 'Revenu Mensuel (CDF)',
      value: `${(revenueCdf / 1000).toLocaleString('fr-FR')}K`,
      sub: '+5.4% ce mois-ci',
      trend: 'up',
      icon: 'payments',
      tone: 'green'
    },
    {
      title: 'Taux de Présence',
      value: `${attendanceRate.toLocaleString('fr-FR')}%`,
      sub: 'Moyenne hebdomadaire',
      trend: 'neutral',
      icon: 'event_available',
      tone: 'orange'
    }
  ];

  return (
    <div className="reports-page revamped-reports">
      <section className="reports-hero">
        <div className="hero-icon-wrap">
          <span className="material-symbols-outlined">query_stats</span>
        </div>
        <div>
          <h1>Rapports et Statistiques</h1>
          <p className="page-subtitle">Génère des rapports détaillés pour le suivi et l'analyse de votre institution.</p>
        </div>
      </section>

      <section className="reports-kpis">
        {kpis.map((kpi) => (
          <article key={kpi.title} className="kpi-card">
            <div className="kpi-top">
              <span className="kpi-title">{kpi.title}</span>
              <span className={`kpi-icon tone-${kpi.tone}`}>
                <span className="material-symbols-outlined">{kpi.icon}</span>
              </span>
            </div>
            <h3>{kpi.value}</h3>
            <p className={`kpi-sub ${kpi.trend === 'up' ? 'is-up' : ''}`}>
              {kpi.trend === 'up' && <span className="material-symbols-outlined">trending_up</span>}
              {kpi.sub}
            </p>
          </article>
        ))}
      </section>

      <section className="reports-controls">
        <div className="search-box">
          <span className="search-icon material-symbols-outlined">search</span>
          <input
            type="text"
            placeholder="Rechercher un rapport..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </section>

      <section className="category-tabs">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`category-tab ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            <span className="tab-label">{cat.label}</span>
            {cat.id !== 'all' && (
              <span className="tab-count">
                {reports.filter(r => r.category === cat.id).length}
              </span>
            )}
          </button>
        ))}
      </section>

      <section className="reports-table-shell">
        <div className="reports-table-container">
        <table className="reports-table">
          <thead>
            <tr>
              <th>Rapport</th>
              <th>Description</th>
              <th className="actions-cell">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentReports.map(report => (
              <tr key={report.id}>
                <td>
                  <div className="report-name-cell">
                    <span className="report-icon-small">
                      <span className="material-symbols-outlined">{report.icon}</span>
                    </span>
                    <strong>{report.name}</strong>
                  </div>
                </td>
                <td>
                  <span className="report-description-text">{report.description}</span>
                </td>
                <td className="actions-cell">
                  <div className="table-actions">
                    <button
                      className="btn-icon primary"
                      onClick={() => handlePreviewReport(report.name)}
                      title="Visualiser"
                    >
                      <span className="material-symbols-outlined">visibility</span>
                    </button>
                    <button
                      className="btn-icon"
                      title="Télécharger"
                      onClick={() => handleGenerateReport(report.id, report.name)}
                    >
                      <span className="material-symbols-outlined">download</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <Pagination 
          currentPage={currentPage}
          totalItems={filteredReports.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </section>

      {filteredReports.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon material-symbols-outlined">search_off</div>
          <h3>Aucun rapport trouvé</h3>
          <p>Aucun rapport ne correspond à vos critères de recherche.</p>
        </div>
      )}
    </div>
  );
};


export default ReportsPage;




