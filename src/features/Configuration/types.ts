export interface SetupCheck {
  key: string;
  label: string;
  ok: boolean;
}

export interface SetupStatus {
  ready: boolean;
  checks: SetupCheck[];
}

export const CONFIG_LINKS = [
  { path: '/configuration/ecole', label: 'École & année', icon: 'domain', checkKey: 'school_settings' },
  { path: '/configuration/finance', label: 'Finance & barèmes', icon: 'payments', checkKey: 'fee_rates' },
  { path: '/configuration/matieres', label: 'Matières', icon: 'menu_book', checkKey: 'subjects' },
  { path: '/configuration/affectations', label: 'Affectations enseignants', icon: 'co_present', checkKey: 'class_assignments' },
  { path: '/configuration/emploi-du-temps', label: 'Emploi du temps', icon: 'calendar_month', checkKey: 'class_assignments' },
  { path: '/configuration/geo', label: 'Géographie RDC', icon: 'map', checkKey: 'geo' },
  { path: '/configuration/personnel-ref', label: 'Référentiel RH', icon: 'badge', checkKey: 'personnel_ref' },
  { path: '/configuration/roles', label: 'Rôles & permissions', icon: 'admin_panel_settings', checkKey: 'roles' },
  { path: '/classes', label: 'Classes scolaires', icon: 'class', checkKey: 'classes', external: true },
  { path: '/personnel', label: 'Personnel enseignant', icon: 'groups', checkKey: 'personnel', external: true },
];
