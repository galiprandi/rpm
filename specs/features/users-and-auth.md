🚦 Estado: 🟢 Completamente implementado (100%)

# Autenticación, Usuarios y Permisos

## 1. Propósito / Alcance
Gestionar la identidad y el acceso a la plataforma. Define quién puede entrar (Autenticación mediante Better Auth) y qué puede hacer cada usuario según su rol (Autorización).

## 2. Casos de Uso Principales (Flujos de éxito)
- **Login/Logout**: Ingreso seguro a la aplicación administrativa y al portal del agente.
- **Gestión de Usuarios (CRUD)**: Creación, modificación y desactivación de cuentas de personal por parte de un ADMIN.
- **Roles y Permisos**: Asignación de roles (`ADMIN`, `SELLER`, `TECHNICIAN`, `CASHIER`) que habilitan o restringen vistas y acciones.

## 3. Restricciones (Qué NO hace / Fuera de alcance)
- **RES-01**: Los clientes finales no tienen cuentas de acceso al panel administrativo (no hay portal de clientes con login por ahora).
- **RES-02**: No hay un constructor de permisos granulares (RBAC dinámico); los roles son estáticos y predefinidos en código/BD.

## 4. Comportamiento Esperado y Casos Límite
- **Límite 1**: Intento de acceso a ruta protegida sin sesión -> Redirección a `/login`.
- **Límite 2**: Intento de acceso a una ruta de admin siendo `SELLER` -> Pantalla de acceso denegado o redirección al dashboard principal.
- **Validación 1**: Las contraseñas se almacenan de forma segura (hasheadas) gestionado internamente por Better Auth.

## 5. Dependencias Técnicas Clave
- **Tablas BD**: `User`, `Session`, `Account` (tablas estándar de Better Auth)
- **Servicios**: `lib/auth-client.ts`, middleware de protección de rutas de Next.js
- **Librería**: `better-auth`
