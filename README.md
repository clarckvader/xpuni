# XPUni — Plataforma de Créditos Universitarios en Blockchain

XPUni es una plataforma de gamificación educativa que incentiva la participación estudiantil mediante créditos digitales respaldados por la blockchain de Stellar. Los estudiantes completan actividades, envían pruebas de evidencia y, al ser aprobadas, reciben tokens XPU en su billetera Stellar. Esos créditos pueden canjearse por recompensas reales en negocios socios (cafeterías, librerías, gimnasios, etc.).

El historial de puntos, insignias y canjes queda registrado en contratos inteligentes Soroban: inmutable, auditable y sin fricción para el usuario final.

---

## Desarrollo del proyecto — 5 semanas

### Semana 1 — Arquitectura y autenticación

Se definió la estructura base del monorepo y las decisiones técnicas fundamentales.

- Monorepo con tres capas: `frontend/`, `backend/`, `contracts/`
- Patrón **Controller → Service → Repository** con inyección de dependencias manual (`container.ts`)
- Autenticación con JWT (7 días de expiración por defecto)
- Generación automática de billeteras Stellar al registrar un usuario; claves secretas cifradas con **AES-256-GCM**
- Base de datos **SQLite** gestionada con **Prisma v7** + adaptador `@prisma/adapter-better-sqlite3`
- Roles de usuario: `STUDENT`, `REVIEWER`, `ADMIN`
- Middleware centralizado de autenticación y manejo de errores (`AppError` + subclases)

### Semana 2 — Contratos inteligentes Soroban

Se desarrollaron y desplegaron los tres contratos Rust en Stellar Testnet.

- **`school_points`** — Token fungible SEP-41. Funciones: `mint`, `burn_from`, `balance`
- **`achievement_badges`** — Registro inmutable de logros. Cada insignia referencia la actividad, puntos otorgados y un hash SHA-256 de la prueba
- **`redemption_records`** — Registro semántico de canjes on-chain (complementa el burn de tokens)
- Integración backend con **Stellar SDK v14.5** para compatibilidad con XDR del Protocolo 22
- `StellarService` como singleton en el contenedor DI — una sola instancia de RPC/contrato

### Semana 3 — Backend completo

Se implementó el flujo de negocio completo con integración on-chain.

- **CRUD** de usuarios, actividades y recompensas con validación Zod en controladores
- **Flujo de envíos**: estudiante sube prueba (archivo + descripción) → revisor aprueba → se acuñan puntos y se emite insignia en Stellar
- **Flujo de canjes**: estudiante canjea puntos → se verifica saldo on-chain → burn de tokens → registro en `redemption_records`
- Subida de archivos con Multer (pruebas de actividades e imágenes de recompensas)
- Paginación en todos los listados
- Panel de salud (`/api/health`) que reporta estado de los contratos

### Semana 4 — Frontend completo

Se construyó la interfaz web con React 19, TypeScript y Vite.

- Diseño **dark mode** con paleta violeta/cian, sin dependencias de tema externo
- Dashboard **estudiante**: catálogo de actividades, mis envíos, catálogo de recompensas, saldo de créditos, historial on-chain
- Dashboard **revisor**: cola de envíos pendientes, detalle con archivo adjunto, aprobar/rechazar
- Panel **administrador**: tablas interactivas con **PrimeReact** (usuarios, actividades, recompensas, canjes, partners)
- Componente `StellarAddress` con truncado, copiado y enlace directo al explorador de Stellar
- Rutas protegidas por rol; `AuthContext` con persistencia de sesión

### Semana 5 — Modelo de socios y pulido final

Se redefinió el modelo de negocio hacia una plataforma con socios afiliados y se refactorizó el sistema completo.

- **Modelo de socios (Partners)**: los negocios afiliados se registran en el sistema con nombre, slug y categoría. No tienen contratos propios — todos los créditos son del token global de la plataforma
- Página pública de partner en `/i/:slug` con información y catálogo de recompensas disponibles
- Registro con enlace de institución: `?institution=slug` pre-asigna al estudiante al partner correspondiente
- Eliminación del modelo multi-contrato (hub de intercambio, swaps entre instituciones) para reducir complejidad innecesaria
- Refactorización completa de `submission.service.ts` y `redemption.service.ts` para operar siempre con el contrato global
- 0 errores TypeScript en backend y frontend al cierre del proyecto

---

## Arquitectura

```
xpuni/
├── frontend/          React 19 + TypeScript + Vite + Tailwind CSS + PrimeReact
├── backend/           Express + Node.js 22 + SQLite + Prisma v7
└── contracts/         Contratos Soroban (Rust)
    ├── school_points/         Token XPU (SEP-41)
    ├── achievement_badges/    Insignias de logro
    └── redemption_records/    Registro de canjes
```

### Backend — estructura interna

```
backend/src/
├── index.ts              Punto de entrada, montaje de rutas
├── config.ts             Configuración desde variables de entorno
├── container.ts          Inyección de dependencias manual
├── errors.ts             Jerarquía AppError (NotFoundError, BadRequestError…)
├── controllers/          Validación Zod + despacho a servicios
├── services/             Lógica de negocio + integración Stellar
├── repositories/         Acceso a base de datos (Prisma)
├── routes/               Definición de rutas Express
└── middleware/
    ├── auth.ts           JWT + requireRole()
    ├── upload.ts         Multer para archivos adjuntos
    └── error-handler.ts  Manejador centralizado de errores
```

- **ORM**: Prisma v7 con `@prisma/adapter-better-sqlite3` (sin servidor de base de datos)
- **Autenticación**: JWT firmados, expiración configurable
- **Seguridad**: claves Stellar cifradas con AES-256-GCM antes de persistir
- **Blockchain**: Stellar Testnet — Protocolo 22, contratos Soroban

---

## Contratos inteligentes

### `school_points` — Token XPU (SEP-41)

Token fungible de créditos. Único contrato de la plataforma, compartido por todos los estudiantes.

| Función | Descripción |
|---|---|
| `initialize(admin, name, symbol)` | Inicialización única |
| `mint(to, amount)` | Acuña créditos al estudiante (solo admin) |
| `burn_from(spender, from, amount)` | Quema créditos (para canjes) |
| `balance(id)` | Consulta el saldo actual |

### `achievement_badges` — Insignias de logro

Registro inmutable de logros por estudiante.

| Función | Descripción |
|---|---|
| `initialize(admin)` | Inicialización única |
| `issue_badge(student, activity_id, title, image_uri, points, desc_hash)` | Emite insignia (solo admin) |
| `student_badges(student_address)` | Lista insignias de un estudiante |

### `redemption_records` — Registro de canjes

Contexto semántico del canje, complementa el burn de tokens.

| Función | Descripción |
|---|---|
| `initialize(admin)` | Inicialización única |
| `record_redemption(student, reward_name, points_spent)` | Registra el canje (solo admin) |
| `student_records(student_address)` | Lista canjes de un estudiante |

> `achievement_badges` y `redemption_records` son **opcionales**. Si no se configuran sus IDs de contrato, el sistema funciona igual: los puntos se acuñan/queman en `school_points` y los registros quedan en SQLite.

---

## Cómo funciona

```
Estudiante                       Revisor / Admin                Blockchain Stellar
──────────────────────────────────────────────────────────────────────────────────
1. Se registra                                                 → Billetera Stellar creada
   (opcionalmente con link                                       y fondeada vía Friendbot
    /register?institution=slug)

2. Envía prueba de               3. Revisa la prueba
   actividad (archivo +             ↓ Aprueba
   descripción)                  4. Se acuñan créditos ──────→ mint()  (school_points)
                                     Se emite insignia ──────→ issue_badge() (achievement_badges)

5. Ve su saldo ──────────────────────────────────────────────→ balance() (school_points)

6. Canjea créditos por           7. Admin marca como
   recompensa de un partner         entregado
   ↓ Se queman los créditos ────────────────────────────────→ burn_from() (school_points)
   ↓ Se registra el canje ─────────────────────────────────→ record_redemption()
```

---

## Prerrequisitos

### Backend y frontend

- **Node.js >= 22.5**
- **pnpm** (para el frontend): `npm install -g pnpm`
- **npm** (para el backend)

### Contratos Soroban (solo si se redesplegarán)

```bash
# Rust con target WASM
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown

# Stellar CLI
cargo install --locked stellar-cli --features opt
```

---

## Instalación y puesta en marcha

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPO>
cd xpuni
```

### 2. Configurar el backend

```bash
cd backend
npm install
cp .env.example .env
```

Edita `backend/.env` con tus valores (ver sección de variables de entorno).

**Mínimo para arrancar sin blockchain:**
```env
PORT=3000
JWT_SECRET=<aleatorio_largo>
ENCRYPTION_KEY=<64_caracteres_hex>
DATABASE_URL=file:./school.db
INITIAL_ADMIN_EMAIL=admin@example.com
INITIAL_ADMIN_PASSWORD=admin123
```

### 3. Inicializar la base de datos

```bash
# Desde backend/
npx prisma db push
npx prisma generate
```

### 4. Iniciar el backend

```bash
npm run dev
```

El servidor arranca en `http://localhost:3000`. La primera vez crea automáticamente el usuario admin con las credenciales de `.env`.

### 5. Configurar y arrancar el frontend

```bash
cd ../frontend
pnpm install
cp .env.example .env
pnpm dev
```

La interfaz queda disponible en `http://localhost:5173`.

---

## Despliegue de contratos Soroban

Solo necesario para integración blockchain completa. Si ya tienes IDs de contratos, ve al paso 4.

### Paso 1 — Generar clave admin y fondear

```bash
make keys
stellar keys show admin --show-secret
```

Agrega en `backend/.env`:
```env
STELLAR_ADMIN_PUBLIC_KEY=G...
STELLAR_ADMIN_SECRET_KEY=S...
```

### Paso 2 — Compilar

```bash
make build
```

### Paso 3 — Desplegar

```bash
make deploy
# O uno a uno:
make deploy-points
make deploy-badges
make deploy-redemptions
```

### Paso 4 — Inicializar

```bash
make init-points       POINTS_CONTRACT_ID=C... ADMIN_PUBLIC_KEY=G...
make init-badges       BADGES_CONTRACT_ID=C... ADMIN_PUBLIC_KEY=G...
make init-redemptions  REDEMPTION_CONTRACT_ID=C... ADMIN_PUBLIC_KEY=G...
```

### Paso 5 — Agregar IDs al backend

```env
STELLAR_CONTRACT_ID=C...               # school_points (requerido)
STELLAR_BADGE_CONTRACT_ID=C...         # achievement_badges (opcional)
STELLAR_REDEMPTION_CONTRACT_ID=C...    # redemption_records (opcional)
```

Reinicia el backend para aplicar los cambios.

---

## Variables de entorno

### `backend/.env`

```env
# ── Servidor ──────────────────────────────────────────────────────────────────
PORT=3000
NODE_ENV=development

# ── JWT ───────────────────────────────────────────────────────────────────────
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=<secreto_largo_y_aleatorio>

# ── Cifrado AES-256-GCM ───────────────────────────────────────────────────────
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=<64_caracteres_hex>

# ── Base de datos ─────────────────────────────────────────────────────────────
DATABASE_URL=file:./school.db

# ── Red Stellar ───────────────────────────────────────────────────────────────
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015

# ── Keypair admin del contrato ────────────────────────────────────────────────
STELLAR_ADMIN_PUBLIC_KEY=G...
STELLAR_ADMIN_SECRET_KEY=S...

# ── IDs de contratos ──────────────────────────────────────────────────────────
STELLAR_CONTRACT_ID=C...               # school_points (requerido)
STELLAR_BADGE_CONTRACT_ID=C...         # achievement_badges (opcional)
STELLAR_REDEMPTION_CONTRACT_ID=C...    # redemption_records (opcional)

# ── Archivos adjuntos ─────────────────────────────────────────────────────────
UPLOADS_DIR=./uploads
UPLOADS_BASE_URL=http://localhost:3000

# ── Admin inicial ─────────────────────────────────────────────────────────────
INITIAL_ADMIN_EMAIL=admin@universidad.edu
INITIAL_ADMIN_PASSWORD=admin123
```

### `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_STELLAR_EXPLORER_URL=https://soroban-testnet.stellar.expert
```

---

## Roles y permisos

| Rol | Capacidades |
|---|---|
| **STUDENT** | Registrarse, ver actividades, enviar pruebas, ver saldo, canjear créditos, ver historial on-chain |
| **REVIEWER** | Aprobar o rechazar pruebas (dispara mint + insignia en Stellar) |
| **ADMIN** | Todo + gestionar usuarios, actividades, recompensas, canjes y partners |

---

## API — endpoints principales

### Autenticación

```
POST  /api/auth/register          Crear cuenta (opcionalmente con institutionSlug)
POST  /api/auth/login             Iniciar sesión → JWT
GET   /api/auth/me                Perfil del usuario autenticado
```

### Usuarios (ADMIN)

```
GET    /api/users
POST   /api/users
PATCH  /api/users/:id/role
DELETE /api/users/:id
```

### Actividades

```
GET    /api/activities            (STUDENT: solo ACTIVE)
POST   /api/activities            (ADMIN)
PATCH  /api/activities/:id        (ADMIN)
DELETE /api/activities/:id        (ADMIN)
POST   /api/activities/:id/badge-image
```

### Envíos

```
GET    /api/submissions
POST   /api/submissions           Subir prueba con archivo (STUDENT)
PATCH  /api/submissions/:id/approve   → mint + badge on-chain
PATCH  /api/submissions/:id/reject
```

### Recompensas

```
GET    /api/rewards
POST   /api/rewards               (ADMIN)
PATCH  /api/rewards/:id
DELETE /api/rewards/:id
POST   /api/rewards/:id/image
```

### Canjes

```
GET    /api/redemptions
POST   /api/redemptions           → burn on-chain (STUDENT)
PATCH  /api/redemptions/:id/complete  (ADMIN)
```

### Partners / Socios

```
GET    /api/institutions          Listar partners activos
GET    /api/institutions/:slug    Detalle de un partner
POST   /api/institutions          Crear partner (ADMIN)
PATCH  /api/institutions/:id      Editar (ADMIN)
DELETE /api/institutions/:id      Desactivar (ADMIN)
```

### Sistema

```
GET    /api/health                Estado del sistema y contratos
```

Todos los endpoints protegidos requieren:
```
Authorization: Bearer <JWT>
```

---

## Estructura del proyecto

```
xpuni/
├── Makefile                          Build, deploy e inicialización de contratos
├── Cargo.toml                        Workspace Rust
│
├── contracts/
│   ├── school_points/src/lib.rs      Token XPU (SEP-41)
│   ├── achievement_badges/src/lib.rs Insignias de logro
│   └── redemption_records/src/lib.rs Registro de canjes
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma             Modelos de base de datos
│   ├── prisma.config.ts              Configuración Prisma v7 con adaptador SQLite
│   ├── src/
│   │   ├── index.ts                  Punto de entrada
│   │   ├── config.ts                 Variables de entorno tipadas
│   │   ├── container.ts              Inyección de dependencias
│   │   ├── errors.ts                 AppError + subclases
│   │   ├── controllers/              auth, users, activities, submissions,
│   │   │                             rewards, redemptions, institutions
│   │   ├── services/                 auth, submission, redemption, reward,
│   │   │                             activity, user, institution, stellar
│   │   ├── repositories/             Acceso a Prisma por entidad
│   │   ├── routes/                   Rutas Express
│   │   └── middleware/
│   │       ├── auth.ts
│   │       ├── upload.ts
│   │       └── error-handler.ts
│
└── frontend/
    └── src/
        ├── App.tsx                   Rutas protegidas por rol
        ├── pages/
        │   ├── Landing.tsx
        │   ├── InstitutionPage.tsx   Página pública del partner (/i/:slug)
        │   ├── Login.tsx / Register.tsx
        │   ├── Profile.tsx
        │   ├── student/              Activities, Submissions, Rewards,
        │   │                         Balance, Transactions
        │   ├── reviewer/             Submissions, SubmissionDetail
        │   └── admin/                Users, Activities, Institutions (Partners),
        │                             Rewards, Redemptions, Health
        ├── components/
        │   ├── Navigation.tsx
        │   ├── StellarAddress.tsx    Dirección truncada + enlace al explorador
        │   └── Layout.tsx
        ├── services/api.ts           Cliente Axios tipado
        ├── types/api.ts              Tipos compartidos frontend↔backend
        └── context/                  AuthContext, NotificationContext
```

---

## Comandos útiles

```bash
# Generar secretos
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"  # JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # ENCRYPTION_KEY

# Base de datos (backend/)
npx prisma db push        # Aplicar schema
npx prisma generate       # Regenerar cliente Prisma
npx prisma studio         # Explorador visual de la BD

# Contratos Soroban
make build                # Compilar WASM
make deploy               # Desplegar en testnet
make test                 # Tests unitarios Rust
make clean                # Limpiar artefactos

# TypeScript checks
cd backend  && npx tsc --noEmit
cd frontend && npx tsc --noEmit
```
