import React, { useState, useEffect } from 'react';
import type { Notification } from '../types';
import Pagination from '@/core/Components/Pagination';
import './CommunicationCenter.css';
import api from '@/core/api/client';
import Skeleton from '@/core/Components/Skeleton';

const CommunicationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'send' | 'history' | 'templates'>('send');
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'success' | 'error',
    recipients: 'all' as 'all' | 'parents' | 'teachers' | 'students',
    channels: ['push'] as ('push' | 'sms' | 'email')[]
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/announcements');
      const data = response.data?.data || response.data || [];
      const mappedNotifications = (Array.isArray(data) ? data : []).map((n: any) => ({
        id: n.id.toString(),
        title: n.title || 'Sans titre',
        message: n.content ?? n.message ?? '',
        type: n.type === 'urgent' ? 'error' : n.type,
        recipients: n.target_audience === 'all' ? ['Tous'] : [n.target_audience],
        sentAt: new Date(n.sent_at || n.created_at),
        readBy: [], 
        channels: ['push'] as ('push' | 'sms' | 'email')[]
      }));
      setNotifications(mappedNotifications);
    } catch (error) {
      console.error('Error loading communication data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    
    // Handle query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const studentId = urlParams.get('student');
    const type = urlParams.get('type');
    
    if (studentId && type === 'parent') {
      setActiveTab('send');
      setNewNotification(prev => ({
        ...prev,
        recipients: 'parents',
        title: 'Communication concernant l\'élève (ID: ' + studentId + ')',
        message: 'Bonjour, nous souhaitons vous informer que...'
      }));
    }
  }, []);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
        channels: newNotification.channels,
        recipients: [newNotification.recipients]
      };
      
      const response = await api.post('/api/announcements', payload);
      const n = response.data;
      
      const notification: Notification = {
        id: n.id.toString(),
        title: n.title || 'Sans titre',
        message: n.message ?? n.content ?? '',
        type: n.type,
        recipients: n.recipients || [],
        sentAt: new Date(n.created_at),
        readBy: [],
        channels: newNotification.channels
      };
      
      setNotifications(prev => [notification, ...prev]);
      
      setNewNotification({
        title: '',
        message: '',
        type: 'info',
        recipients: 'all',
        channels: ['push']
      });
      
      alert('Notification envoyée avec succès!');
    } catch (e: any) {
      console.error('Erreur lors de l\'envoi:', e);
      alert("Erreur lors de l'envoi de la notification.");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'push': return '📱';
      case 'sms': return '💬';
      case 'email': return '📧';
      default: return '📱';
    }
  };

  const messageTemplates = [
    {
      id: '1',
      name: 'Rappel de paiement',
      category: 'Finance',
      title: 'Rappel de paiement - {studentName}',
      message: 'Cher parent, votre enfant {studentName} a un paiement en attente. Montant: {amount} {currency}. Échéance: {dueDate}.'
    },
    {
      id: '2',
      name: 'Réunion parents',
      category: 'Événement',
      title: 'Réunion parents-enseignants',
      message: 'Une réunion parents-enseignants aura lieu le {date} à {time}. Votre présence est importante pour le suivi de {studentName}.'
    },
    {
      id: '3',
      name: 'Absence élève',
      category: 'Académique',
      title: 'Absence de {studentName}',
      message: 'Votre enfant {studentName} a été absent le {date}. Merci de nous informer de la raison de cette absence.'
    }
  ];

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedNotifications = notifications.slice(indexOfFirstItem, indexOfLastItem);
  const paginatedTemplates = messageTemplates.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) {
    return (
      <div className="communication-center">
        <Skeleton className="skel-h-10" />
        <Skeleton className="skel-h-24" />
        <Skeleton className="skel-h-24" />
      </div>
    );
  }

  return (
    <div className="communication-center">
      <div className="page-header">
        <h1>Centre de Communication</h1>
        <p className="page-subtitle">
          Système de notifications multi-canal - SMS, Push, Email
        </p>
      </div>

      {/* Statistiques de communication */}
      <div className="communication-stats">
        <div className="stat-card sent">
          <span className="stat-icon material-symbols-outlined">send</span>
          <div className="stat-content">
            <h3>Envoyées</h3>
            <span className="stat-number">{notifications.length}</span>
            <span className="stat-label">Ce mois</span>
          </div>
        </div>
        
        <div className="stat-card delivered">
          <span className="stat-icon material-symbols-outlined">check_circle</span>
          <div className="stat-content">
            <h3>Délivrées</h3>
            <span className="stat-number">{notifications.length}</span>
            <span className="stat-label">Taux: 100%</span>
          </div>
        </div>
        
        <div className="stat-card read">
          <span className="stat-icon material-symbols-outlined">visibility</span>
          <div className="stat-content">
            <h3>Lues</h3>
            <span className="stat-number">{notifications.filter(n => n.readBy.length > 0).length}</span>
            <span className="stat-label">Taux: {Math.round((notifications.filter(n => n.readBy.length > 0).length / notifications.length) * 100)}%</span>
          </div>
        </div>
        
        <div className="stat-card channels">
          <span className="stat-icon material-symbols-outlined">hub</span>
          <div className="stat-content">
            <h3>Canaux</h3>
            <span className="stat-number">3</span>
            <span className="stat-label">Push, SMS, Email</span>
          </div>
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="tabs-navigation">
        <button 
          className={`tab-btn ${activeTab === 'send' ? 'active' : ''}`}
          onClick={() => setActiveTab('send')}
        >
          <span className="tab-icon material-symbols-outlined">send</span>
          Envoyer
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <span className="tab-icon material-symbols-outlined">history</span>
          Historique
        </button>
        <button 
          className={`tab-btn ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          <span className="tab-icon material-symbols-outlined">description</span>
          Modèles
        </button>
      </div>

      {/* Onglet Envoyer */}
      {activeTab === 'send' && (
        <div className="send-notification-content">
          <div className="send-form-container">
            <h2>Nouvelle notification</h2>
            
            <form onSubmit={handleSendNotification} className="notification-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Titre</label>
                  <input
                    type="text"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Titre de la notification"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={newNotification.type}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, type: e.target.value as any }))}
                  >
                    <option value="info">Information</option>
                    <option value="warning">Avertissement</option>
                    <option value="success">Succès</option>
                    <option value="error">Erreur</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label>Message</label>
                <textarea
                  value={newNotification.message}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Contenu de la notification..."
                  rows={4}
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Destinataires</label>
                  <select
                    value={newNotification.recipients}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, recipients: e.target.value as any }))}
                  >
                    <option value="all">Tous les utilisateurs</option>
                    <option value="parents">Parents uniquement</option>
                    <option value="teachers">Enseignants uniquement</option>
                    <option value="students">Élèves uniquement</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Canaux de diffusion</label>
                  <div className="channels-selection">
                    <label className="channel-option">
                      <input
                        type="checkbox"
                        checked={newNotification.channels.includes('push')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewNotification(prev => ({ 
                              ...prev, 
                              channels: [...prev.channels, 'push']
                            }));
                          } else {
                            setNewNotification(prev => ({ 
                              ...prev, 
                              channels: prev.channels.filter(c => c !== 'push')
                            }));
                          }
                        }}
                      />
                      <span className="channel-icon material-symbols-outlined">notifications</span>
                      Push
                    </label>
                    
                    <label className="channel-option">
                      <input
                        type="checkbox"
                        checked={newNotification.channels.includes('sms')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewNotification(prev => ({ 
                              ...prev, 
                              channels: [...prev.channels, 'sms']
                            }));
                          } else {
                            setNewNotification(prev => ({ 
                              ...prev, 
                              channels: prev.channels.filter(c => c !== 'sms')
                            }));
                          }
                        }}
                      />
                      <span className="channel-icon material-symbols-outlined">sms</span>
                      SMS
                    </label>
                    
                    <label className="channel-option">
                      <input
                        type="checkbox"
                        checked={newNotification.channels.includes('email')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewNotification(prev => ({ 
                              ...prev, 
                              channels: [...prev.channels, 'email']
                            }));
                          } else {
                            setNewNotification(prev => ({ 
                              ...prev, 
                              channels: prev.channels.filter(c => c !== 'email')
                            }));
                          }
                        }}
                      />
                      <span className="channel-icon material-symbols-outlined">mail</span>
                      Email
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn btn-outline">
                  <span className="material-symbols-outlined">save</span>
                  Sauver comme modèle
                </button>
                <button type="submit" className="btn btn-primary">
                  <span className="material-symbols-outlined">send</span>
                  Envoyer notification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Onglet Historique */}
      {activeTab === 'history' && (
        <div className="history-content">
          <div className="notifications-table-container">
            <table className="notifications-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Message</th>
                  <th>Audience</th>
                  <th>Statistiques</th>
                  <th>Canaux</th>
                  <th className="actions-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedNotifications.map((notification) => {
                  const messageText = typeof notification.message === 'string' ? notification.message : '';
                  const preview = messageText.length > 50 ? `${messageText.substring(0, 50)}...` : messageText || 'Aucun message';

                  return (
                  <tr key={notification.id}>
                    <td>
                      <div className="table-date-compact">
                        <span className="date-main">{notification.sentAt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                        <span className="time-sub">{notification.sentAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td>
                      <span className="notification-icon" title={notification.type}>
                        {getNotificationIcon(notification.type)}
                      </span>
                    </td>
                    <td>
                      <div className="message-cell-content">
                        <strong>{notification.title}</strong>
                        <span className="message-truncate">{preview}</span>
                      </div>
                    </td>
                    <td>
                      <span className="audience-badge">{notification.recipients.length} dest.</span>
                    </td>
                    <td>
                      <div className="stats-compact">
                        <span title="Lues">{notification.readBy.length} lues</span>
                        <span className="rate">({notification.recipients.length > 0 ? Math.round((notification.readBy.length / notification.recipients.length) * 100) : 0}%)</span>
                      </div>
                    </td>
                    <td>
                      <div className="table-channels">
                        {notification.channels.map(channel => (
                          <span key={channel} className="channel-badge" title={channel}>
                            {getChannelIcon(channel)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="actions-cell">
                      <div className="table-actions">
                        <button className="btn-icon" title="Renvoyer">
                          <span className="material-symbols-outlined">refresh</span>
                        </button>
                        <button className="btn-icon danger" title="Supprimer">
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination
              currentPage={currentPage}
              totalItems={notifications.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {/* Onglet Modèles */}
      {activeTab === 'templates' && (
        <div className="templates-content">
          <div className="templates-header">
            <h2>Modèles de messages</h2>
            <button className="btn btn-primary">
              <span className="material-symbols-outlined">add</span>
              Nouveau modèle
            </button>
          </div>
          
          <div className="templates-table-container">
            <table className="templates-table">
              <thead>
                <tr>
                  <th>Modèle</th>
                  <th>Catégorie</th>
                  <th>Aperçu</th>
                  <th className="actions-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTemplates.map(template => (
                    <tr key={template.id}>
                    <td>
                      <div className="template-name-cell">
                        <strong>{template.name}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="template-category-badge">{template.category}</span>
                    </td>
                    <td>
                      <div className="template-preview-cell">
                        <div className="template-preview-title">{template.title}</div>
                        <div className="template-preview-text">{template.message.substring(0, 60)}...</div>
                      </div>
                    </td>
                    <td className="actions-cell">
                      <div className="table-actions">
                        <button className="btn-icon primary" title="Utiliser">
                          <span className="material-symbols-outlined">play_arrow</span>
                        </button>
                        <button className="btn-icon" title="Modifier">
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button className="btn-icon danger" title="Supprimer">
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))}
              </tbody>
            </table>
            <Pagination
              currentPage={currentPage}
              totalItems={messageTemplates.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}
    </div>
  );
};


export default CommunicationCenter;



