import type { Rol } from './roles';

// ⚠️ TEMPORAL — usuarios de prueba mostrados bajo el login para QA rápido.
// Quitar antes de producción (eliminar este archivo y <DevUsers/> del login).
export const DEV_PASSWORD = 'Azur2026!';

export const DEV_USERS: { email: string; nombre: string; rol: Rol }[] = [
  { email: 'gerencia@azur.pe', nombre: 'Juan Pérez', rol: 'gerencia' },
  { email: 'proyectos@azur.pe', nombre: 'Carlos Ruiz', rol: 'jefe_proyectos' },
  { email: 'presupuestos@azur.pe', nombre: 'Andrea Salas', rol: 'presupuestos' },
  { email: 'admin@azur.pe', nombre: 'Pamela Díaz', rol: 'administrador' },
  { email: 'comercial@azur.pe', nombre: 'Lucía Torres', rol: 'comercial' },
  { email: 'residente@azur.pe', nombre: 'Miguel Quispe', rol: 'residente' },
  { email: 'soma@azur.pe', nombre: 'Rosa Mendoza', rol: 'prevencionista' },
  { email: 'logistica@azur.pe', nombre: 'Diego Flores', rol: 'logistico' },
];
