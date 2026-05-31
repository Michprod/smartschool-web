import React from 'react';
import { Navigate } from 'react-router-dom';

/** Redirige vers Paramètres onglet Profils (ProfileManagement existant). */
const RolesConfigPage: React.FC = () => <Navigate to="/settings?tab=profiles" replace />;

export default RolesConfigPage;
