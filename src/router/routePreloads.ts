/** Précharge les chunks des pages au survol du menu pour réduire le flash au clic. */
export function preloadRoute(path: string): void {
  const normalized = path === '/' ? '/dashboard' : path;

  switch (normalized) {
    case '/dashboard':
      void import('@/features/Dashboard/Pages/DashboardHome');
      break;
    case '/students':
      void import('@/features/Students/Pages/StudentManagement');
      break;
    case '/classes':
      void import('@/features/Classes/Pages/ClassManagement');
      break;
    case '/finance':
      void import('@/features/Finance/Pages/FinancialDashboard');
      break;
    case '/teacher':
      void import('@/features/Teachers/Pages/TeacherDashboardPage');
      break;
    case '/teachers':
      void import('@/features/Teachers/Pages/TeacherProfilePage');
      break;
    case '/teachers/workload':
      void import('@/features/Teachers/Pages/TeacherWorkloadPage');
      break;
    case '/conduct':
      void import('@/features/Conduct/Pages/ConductPage');
      break;
    case '/grades':
      void import('@/features/Grades/Pages/GradesPage');
      break;
    case '/admissions':
      void import('@/features/Admissions/Pages/AdmissionManagement');
      break;
    case '/communication':
      void import('@/features/Communication/Pages/CommunicationCenter');
      break;
    case '/events':
      void import('@/features/Events/Pages/EventsPage');
      break;
    case '/inventory':
      void import('@/features/Inventory/Pages/InventoryPage');
      break;
    case '/users':
      void import('@/features/Users/Pages/UserManagement');
      break;
    case '/discipline':
      void import('@/features/Discipline/Pages/DisciplinePage');
      break;
    case '/reports':
      void import('@/features/Reports/Pages/ReportsPage');
      break;
    case '/settings':
      void import('@/features/Settings/Pages/SettingsPage');
      break;
    case '/profile':
      void import('@/features/Users/Pages/ProfilePage');
      break;
  }
}
