import api from '@/core/api/client';
import React, { useEffect, useMemo, useState } from 'react';
import './DashboardHome.css';
import Skeleton from '@/core/Components/Skeleton';

const DashboardHome: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await api.get('/api/reports/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Erreur chargement dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const kpiValues = useMemo(
    () => ({
      students: Number(stats?.totalStudents ?? 0),
      teachers: Number(stats?.totalTeachers ?? 0),
      parents: Number(stats?.totalParents ?? 0),
      pendingAdmissions: Number(stats?.pendingApplications ?? 0),
      revenueUsd: Number(stats?.finance?.totalRevenue?.usd ?? 0),
      revenueCdf: Number(stats?.finance?.totalRevenue?.cdf ?? 0),
      pendingUsd: Number(stats?.finance?.pendingPayments?.usd ?? 0),
      pendingCdf: Number(stats?.finance?.pendingPayments?.cdf ?? 0),
    }),
    [stats]
  );

  if (loading) {
    return (
      <div className="dashboard-v3">
        <Skeleton className="skel-h-10" />
        <Skeleton className="skel-h-24" />
        <Skeleton className="skel-h-24" />
      </div>
    );
  }

  return (
    <div className="dashboard-v3">
      <section className="welcome-header">
        <div>
          <h2>Tableau de Bord Global</h2>
          <p>Indicateurs consolidés chargés depuis le backend SmartSchool.</p>
        </div>
      </section>

      <section className="kpi-grid">
        <article className="kpi-card">
          <div>
            <p>Nombre total d eleves</p>
            <h3>{Number(kpiValues.students).toLocaleString()}</h3>
            <small>Total enregistré</small>
          </div>
          <div className="kpi-icon primary">
            <span className="material-symbols-outlined">group</span>
          </div>
        </article>

        <article className="kpi-card">
          <div>
            <p>Professeurs</p>
            <h3 className="secondary-value">{Number(kpiValues.teachers).toLocaleString()}</h3>
            <small>Total enseignants</small>
          </div>
          <div className="kpi-icon success">
            <span className="material-symbols-outlined">school</span>
          </div>
        </article>

        <article className="kpi-card">
          <div>
            <p>Parents</p>
            <h3 className="tertiary-value">{Number(kpiValues.parents).toLocaleString()}</h3>
            <small>Total représentants</small>
          </div>
          <div className="kpi-icon tertiary">
            <span className="material-symbols-outlined">person</span>
          </div>
        </article>

        <article className="kpi-card">
          <div>
            <p>Admissions</p>
            <h3 className="danger-value">{Number(kpiValues.pendingAdmissions).toLocaleString()}</h3>
            <small>Dossiers en attente</small>
          </div>
          <div className="kpi-icon danger">
            <span className="material-symbols-outlined">pending_actions</span>
          </div>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel-card">
          <div className="panel-head">
            <h4>Aperçu Financier</h4>
          </div>
          <div className="finance-mini-cards">
            <div className="mini-card">
              <div className="mini-title">
                <span className="material-symbols-outlined">account_balance_wallet</span>
                Revenus (USD)
              </div>
              <p>{kpiValues.revenueUsd.toLocaleString()} USD</p>
            </div>
            <div className="mini-card">
              <div className="mini-title">
                <span className="material-symbols-outlined">account_balance</span>
                Revenus (CDF)
              </div>
              <p>{kpiValues.revenueCdf.toLocaleString()} FC</p>
            </div>
            <div className="mini-card">
              <div className="mini-title">
                <span className="material-symbols-outlined">pending_actions</span>
                Impayés (USD)
              </div>
              <p>{kpiValues.pendingUsd.toLocaleString()} USD</p>
            </div>
            <div className="mini-card">
              <div className="mini-title">
                <span className="material-symbols-outlined">schedule</span>
                Impayés (CDF)
              </div>
              <p>{kpiValues.pendingCdf.toLocaleString()} FC</p>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
};

export default DashboardHome;


