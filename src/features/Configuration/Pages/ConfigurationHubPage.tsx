import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/core/api/client';
import Skeleton from '@/core/Components/Skeleton';
import { CONFIG_LINKS, SetupStatus } from '../types';
import '../Configuration.css';

const ConfigurationHubPage: React.FC = () => {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/setup/status')
      .then((res) => setStatus(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="skel-h-24" />;

  const checkMap = Object.fromEntries((status?.checks || []).map((c) => [c.key, c.ok]));

  return (
    <div className="config-hub">
      <header className="page-hero">
        <div>
          <h1>Configuration</h1>
          <p>Paramétrez le système avant la mise en service.</p>
        </div>
        {!status?.ready && <span className="config-badge-warn">Configuration incomplète</span>}
        {status?.ready && <span className="config-badge-ok">Prêt</span>}
      </header>

      <section className="config-checklist">
        <h2>Checklist de démarrage</h2>
        <ul>
          {(status?.checks || []).map((c) => (
            <li key={c.key} className={c.ok ? 'ok' : 'ko'}>
              <span>{c.ok ? '✓' : '○'}</span> {c.label}
            </li>
          ))}
        </ul>
      </section>

      <section className="config-links-grid">
        {CONFIG_LINKS.map((link) => {
          const ok = link.checkKey ? checkMap[link.checkKey] : undefined;
          const content = (
            <article className={`config-link-card ${ok === false ? 'pending' : ''}`}>
              <span className="material-symbols-outlined">{link.icon}</span>
              <h3>{link.label}</h3>
              {ok === false && <small>À configurer</small>}
              {ok === true && <small className="ok-text">OK</small>}
            </article>
          );
          return link.external ? (
            <Link key={link.path} to={link.path}>{content}</Link>
          ) : (
            <Link key={link.path} to={link.path}>{content}</Link>
          );
        })}
      </section>
    </div>
  );
};

export default ConfigurationHubPage;
