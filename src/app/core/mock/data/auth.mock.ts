import { AuthSignInResponse } from 'app/core/interfaces/auth/auth.interface';

export const MOCK_AUTH_RESPONSE: AuthSignInResponse = {
  success:      true,
  accessToken:  'mock.jwt.token.access',
  refreshToken: 'mock.jwt.token.refresh',
  access:       'security.users,security.roles,security.access,training.assignment,training.tracking,training.requests,training.operators,training.config,adm-sys.actions,adm-sys.displays,adm-sys.entities',
  roles:        ['Administrador', 'Solicitante', 'Aprobador Entrenamiento'],
  user_Code:    'U001',
  user_Name:    'ANTONIO FUENTES ALVARADO',
  user_Email:   'antoniofuentes.09.01@gmail.com',
  company_Code: 'IMHON',
};

export const MOCK_NAVIGATION = [
  {
    id: 'security', title: 'Seguridad', icon: 'pi pi-shield', type: 'collapsable',
    children: [
      { id: 'security.users',  title: 'Usuarios', icon: 'pi pi-users',     type: 'basic', route: '/security/users'  },
      { id: 'security.roles',  title: 'Roles',    icon: 'pi pi-id-card',   type: 'basic', route: '/security/roles'  },
      { id: 'security.access', title: 'Accesos',  icon: 'pi pi-lock',      type: 'basic', route: '/security/access' },
    ],
  },
  {
    id: 'training', title: 'Entrenamiento', icon: 'pi pi-chart-line', type: 'collapsable',
    children: [
      { id: 'training.assignment', title: 'Asignación de Curvas',   icon: 'pi pi-calendar',    type: 'basic', route: '/training/curve-assignment'      },
      { id: 'training.tracking',   title: 'Seguimiento',            icon: 'pi pi-chart-bar',   type: 'basic', route: '/training/curve-tracking'         },
      { id: 'training.requests',   title: 'Solicitudes de Cambio',  icon: 'pi pi-bell',        type: 'basic', route: '/training/curve-requests'         },
      { id: 'training.operators',  title: 'Gestión de Operarios',   icon: 'pi pi-user-edit',   type: 'basic', route: '/training/operators-management'   },
      { id: 'training.config',     title: 'Configuración de Curvas',icon: 'pi pi-cog',         type: 'basic', route: '/training/config/training-curves' },
    ],
  },
  {
    id: 'adm-sys', title: 'Administración del Sistema', icon: 'pi pi-server', type: 'collapsable',
    children: [
      { id: 'adm-sys.actions',  title: 'Acciones',  icon: 'pi pi-bolt',    type: 'basic', route: '/adm-sys/actions'         },
      { id: 'adm-sys.displays', title: 'Pantallas', icon: 'pi pi-desktop', type: 'basic', route: '/adm-sys/displays'        },
      { id: 'adm-sys.entities', title: 'Entidades', icon: 'pi pi-database', type: 'basic', route: '/adm-sys/system-entities' },
    ],
  },
];
