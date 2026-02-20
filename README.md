# XPUni — Sistema de Recompensas Universitarias con Blockchain

XPUni es una plataforma de gamificación educativa que incentiva la participación estudiantil mediante puntos y logros almacenados en la blockchain de Stellar. Los estudiantes completan actividades, envían pruebas, y al ser aprobadas reciben tokens XPU en su billetera Stellar. Esos tokens pueden canjearse por recompensas reales (objetos físicos, bonificaciones de calificación, etc.).

Todo el historial de puntos, insignias y canjes queda registrado de forma permanente e inmutable en contratos inteligentes Soroban.

---

## Tabla de contenidos

1. [¿Cómo funciona?](#cómo-funciona)
2. [Arquitectura](#arquitectura)
3. [Contratos inteligentes](#contratos-inteligentes)
4. [Prerrequisitos](#prerrequisitos)
5. [Instalación y puesta en marcha (desarrollo)](#instalación-y-puesta-en-marcha-desarrollo)
6. [Despliegue de contratos Soroban](#despliegue-de-contratos-soroban)
7. [Variables de entorno](#variables-de-entorno)
8. [Estructura del proyecto](#estructura-del-proyecto)
9. [Roles y permisos](#roles-y-permisos)
10. [API — resumen de endpoints](#api--resumen-de-endpoints)
11. [Colección Postman](#colección-postman)

---

## ¿Cómo funciona?

```
Estudiante                     Revisor / Admin                  Blockchain Stellar
─────────────────────────────────────────────────────────────────────────────────
1. Se registra                                                  → Se crea una billetera
   (billetera Stellar                                             y se fondea vía Friendbot
    generada automáticamente)                                     (testnet)

2. Envía prueba de             3. Revisa la prueba
   actividad (archivo +           ↓ Aprueba
   descripción)                4. Se acuñan puntos XPU ───────→ mintPoints()  (school_points)
                                  Se emite insignia ──────────→ issueBadge()  (achievement_badges)

5. Ve su saldo de puntos ─────────────────────────────────────→ getBalance()  (simulación RPC)

6. Canjea puntos por          7. Admin marca el canje
   una recompensa                 como entregado
   ↓ Se queman los puntos ────────────────────────────────────→ burnPoints()  (school_points)
   ↓ Se registra el canje ──────────────────────────────────→ recordRedemption() (redemption_records)
```

### Roles

| Rol | Capacidades principales |
|---|---|
| **STUDENT** | Enviar pruebas, ver saldo, canjear puntos, ver historial on-chain |
| **REVIEWER** | Aprobar o rechazar pruebas de estudiantes |
| **ADMIN** | Todo lo anterior + gestionar usuarios, actividades, recompensas y canjes |

---

## Arquitectura

```
xpuni/
├── frontend/          React 19 + TypeScript + Vite + Tailwind CSS
├── backend/           Express + Node.js 22 + SQLite + Drizzle ORM
└── contracts/         Contratos Soroban (Rust)
    ├── school_points/
    ├── achievement_badges/
    └── redemption_records/
```

- **Base de datos**: SQLite local (gestionada por Drizzle ORM, sin servidor externo requerido)
- **Autenticación**: JWT (tokens firmados, expiran en 7 días por defecto)
- **Seguridad**: Las claves secretas Stellar de los usuarios se cifran con AES-256-GCM antes de guardarse
- **Blockchain**: Stellar Testnet (o Mainnet) — contratos Soroban v25

---

## Contratos inteligentes

### `school_points` — Token XPU (SEP-41)

Token fungible de puntos. Sigue el estándar SEP-41 de Stellar.

| Función | Descripción |
|---|---|
| `initialize(admin, name, symbol)` | Inicialización única (solo se llama una vez) |
| `mint(to, amount)` | Acuña puntos al estudiante (solo admin) |
| `burn_from(spender, from, amount)` | Quema puntos del estudiante (clawback, para canjes) |
| `balance(id)` | Consulta el saldo de puntos |

### `achievement_badges` — Insignias de logro

Registro inmutable de logros. Cada insignia referencia la actividad, imagen, puntos otorgados y un hash SHA-256 de la descripción del envío.

| Función | Descripción |
|---|---|
| `initialize(admin)` | Inicialización única |
| `issue_badge(student, activity_id, title, image_uri, points, desc_hash)` | Emite una insignia (solo admin) |
| `student_badges(student_address)` | Lista todas las insignias de un estudiante |

### `redemption_records` — Registro de canjes

Complementa el burn de puntos con contexto semántico (qué recompensa se canjeó).

| Función | Descripción |
|---|---|
| `initialize(admin)` | Inicialización única |
| `record_redemption(student, reward_name, points_spent)` | Registra un canje (solo admin) |
| `student_records(student_address)` | Lista todos los canjes de un estudiante |

> El contrato `redemption_records` es **opcional**. Si no se configura `STELLAR_REDEMPTION_CONTRACT_ID`, el burn de puntos igualmente ocurre; solo se omite el registro semántico on-chain.

---

## Prerrequisitos

### Para el backend y frontend

- **Node.js >= 22.5** (requerido para el módulo nativo `node:sqlite`)
- **pnpm** (para el frontend): `npm install -g pnpm`
- **npm** (para el backend)

### Para los contratos Soroban (solo si se redesplegarán)

- **Rust** con target `wasm32-unknown-unknown`:
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  rustup target add wasm32-unknown-unknown
  ```
- **Stellar CLI**:
  ```bash
  cargo install --locked stellar-cli --features opt
  ```

---

## Instalación y puesta en marcha (desarrollo)

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPO>
cd xpuni
```

### 2. Configurar el backend

```bash
cd backend
npm install

# Copiar el archivo de entorno
cp .env.example .env
```

Edita `backend/.env` con tus valores (ver sección [Variables de entorno](#variables-de-entorno)).

**Mínimo para arrancar sin blockchain:**
```env
PORT=3000
JWT_SECRET=<genera_uno_aleatorio>
ENCRYPTION_KEY=<64_caracteres_hex_aleatorios>
INITIAL_ADMIN_EMAIL=admin@example.com
INITIAL_ADMIN_PASSWORD=admin123
```

> Si no se configuran los contratos Soroban, el sistema funciona completamente en modo base de datos: los puntos y aprobaciones se registran en SQLite, sin transacciones on-chain.

### 3. Iniciar el backend

```bash
# Desde la carpeta backend/
npm run dev
```

El servidor arranca en `http://localhost:3000`. La primera vez crea automáticamente:
- Las tablas SQLite
- El usuario admin inicial con las credenciales de `.env`

### 4. Configurar el frontend

```bash
cd ../frontend
pnpm install

# Copiar el archivo de entorno
cp .env.example .env
```

El `.env` del frontend por defecto ya apunta a `http://localhost:3000`, no requiere cambios para desarrollo local.

### 5. Iniciar el frontend

```bash
# Desde la carpeta frontend/
pnpm dev
```

La interfaz queda disponible en `http://localhost:5173`.

---

## Despliegue de contratos Soroban

Este proceso es necesario solo si se quiere la integración completa con la blockchain. Si ya tienes IDs de contratos desplegados, salta al paso 4.

### Paso 1 — Generar clave admin y fondear

```bash
# Desde la raíz del proyecto
make keys
```

Este comando:
- Genera un keypair `admin` en la configuración de Stellar CLI
- Fondea la cuenta usando el Friendbot de testnet (gratis, solo testnet)
- Imprime la clave pública y te recuerda dónde colocar los valores

Anota la clave pública (`G...`) y obtén la clave secreta:
```bash
stellar keys show admin --show-secret
```

Agrégalas a `backend/.env`:
```env
STELLAR_ADMIN_PUBLIC_KEY=GABC...
STELLAR_ADMIN_SECRET_KEY=SABC...
```

### Paso 2 — Compilar los contratos

```bash
make build
```

Compila los tres contratos Rust a WASM. Los artefactos quedan en `target/wasm32-unknown-unknown/release/`.

### Paso 3 — Desplegar los contratos

```bash
make deploy
```

Despliega los tres contratos en Stellar Testnet. Cada contrato imprime su `CONTRACT_ID` (empieza con `C...`).

También puedes desplegar uno a uno:
```bash
make deploy-points
make deploy-badges
make deploy-redemptions
```

> El despliegue puede tardar entre 30 y 60 segundos por contrato.

### Paso 4 — Inicializar los contratos

Cada contrato debe inicializarse una sola vez con el admin como administrador:

```bash
make init-points \
  POINTS_CONTRACT_ID=C... \
  ADMIN_PUBLIC_KEY=G...

make init-badges \
  BADGES_CONTRACT_ID=C... \
  ADMIN_PUBLIC_KEY=G...

make init-redemptions \
  REDEMPTION_CONTRACT_ID=C... \
  ADMIN_PUBLIC_KEY=G...
```

> Si ya tienes los IDs en `backend/.env`, puedes omitir los argumentos y el Makefile los leerá del archivo.

### Paso 5 — Agregar los IDs en el backend

Edita `backend/.env` con los tres IDs obtenidos:

```env
STELLAR_CONTRACT_ID=C...            # school_points
STELLAR_BADGE_CONTRACT_ID=C...      # achievement_badges
STELLAR_REDEMPTION_CONTRACT_ID=C... # redemption_records
```

Reinicia el backend para que tome los cambios:
```bash
# Ctrl+C para detener, luego:
npm run dev
```

---

## Variables de entorno

### `backend/.env`

```env
# ── Servidor ──────────────────────────────────────────────────────────────────
PORT=3000
NODE_ENV=development

# ── JWT ───────────────────────────────────────────────────────────────────────
# Genera con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=<secreto_largo_y_aleatorio>

# ── Cifrado AES-256-GCM para claves Stellar de usuarios ───────────────────────
# Debe ser exactamente 64 caracteres hexadecimales (32 bytes)
# Genera con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=<64_caracteres_hex>

# ── Red Stellar ───────────────────────────────────────────────────────────────
STELLAR_NETWORK=testnet
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015

# ── Keypair del administrador del contrato ────────────────────────────────────
STELLAR_ADMIN_PUBLIC_KEY=G...
STELLAR_ADMIN_SECRET_KEY=S...

# ── IDs de contratos desplegados ──────────────────────────────────────────────
STELLAR_CONTRACT_ID=C...               # school_points (requerido para puntos on-chain)
STELLAR_BADGE_CONTRACT_ID=C...         # achievement_badges (opcional)
STELLAR_REDEMPTION_CONTRACT_ID=C...    # redemption_records (opcional)

# ── Archivos adjuntos (pruebas de actividades) ────────────────────────────────
UPLOADS_DIR=./uploads
UPLOADS_BASE_URL=http://localhost:3000

# ── Base de datos SQLite ──────────────────────────────────────────────────────
DATABASE_PATH=./school.db

# ── Admin inicial (se crea automáticamente al iniciar si no existe ningún admin)
INITIAL_ADMIN_EMAIL=admin@universidad.edu
INITIAL_ADMIN_PASSWORD=admin123
```

### `frontend/.env`

```env
# URL base del backend (sin /api al final)
VITE_API_BASE_URL=http://localhost:3000

# URL del explorador de Stellar para los links de transacciones
VITE_STELLAR_EXPLORER_URL=https://soroban-testnet.stellar.expert
```

---

## Estructura del proyecto

```
xpuni/
├── Makefile                        # Build, deploy e inicialización de contratos
├── Cargo.toml                      # Workspace Rust
│
├── contracts/
│   ├── school_points/src/lib.rs    # Contrato token XPU (SEP-41)
│   ├── achievement_badges/src/lib.rs   # Contrato insignias de logro
│   └── redemption_records/src/lib.rs   # Contrato registro de canjes
│
├── backend/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── index.ts                # Punto de entrada, montaje de rutas
│       ├── config.ts               # Configuración desde variables de entorno
│       ├── db/
│       │   ├── index.ts            # Conexión SQLite + migraciones automáticas
│       │   └── schema.ts           # Definición de tablas con Drizzle ORM
│       ├── middleware/
│       │   ├── auth.ts             # Autenticación JWT + requireRole()
│       │   └── upload.ts           # Multer para archivos adjuntos
│       ├── services/
│       │   ├── stellar.ts          # Interacciones con contratos Soroban
│       │   ├── badges.ts           # Emisión de insignias on-chain
│       │   └── redemptions.ts      # Registro de canjes on-chain
│       └── routes/
│           ├── auth.ts             # POST /login, POST /register, GET /me
│           ├── users.ts            # CRUD usuarios
│           ├── activities.ts       # CRUD actividades
│           ├── submissions.ts      # Envíos, aprobación, rechazo
│           ├── rewards.ts          # CRUD recompensas
│           └── redemptions.ts      # Canjes y completado
│
└── frontend/
    ├── .env.example
    ├── package.json
    └── src/
        ├── App.tsx                 # Rutas protegidas por rol
        ├── pages/
        │   ├── Landing.tsx
        │   ├── Login.tsx / Register.tsx
        │   ├── Profile.tsx
        │   ├── student/            # Dashboard estudiante
        │   ├── reviewer/           # Dashboard revisor
        │   └── admin/              # Dashboard administrador
        ├── components/
        │   ├── Layout.tsx
        │   ├── Navigation.tsx
        │   └── StellarAddress.tsx  # Componente de dirección/hash con enlace a explorador
        ├── services/api.ts         # Cliente Axios tipado
        └── context/                # AuthContext, NotificationContext
```

---

## Roles y permisos

### Estudiante (STUDENT)

- Registrarse (se crea una billetera Stellar automáticamente)
- Ver el catálogo de actividades activas
- Enviar pruebas de actividades (texto + archivo opcional)
- Ver el estado de sus envíos
- Ver su saldo de puntos XPU (consultado directamente desde la blockchain)
- Canjear puntos por recompensas del catálogo
- Ver su historial de transacciones on-chain

### Revisor (REVIEWER)

- Ver todos los envíos pendientes
- Aprobar envíos → dispara acuñado de puntos e insignia en Stellar
- Rechazar envíos con nota explicativa

### Administrador (ADMIN)

- Todo lo del revisor
- Crear, editar y desactivar actividades (con imagen de badge opcional)
- Crear, editar y desactivar recompensas (con imagen, stock, tipo)
- Gestionar usuarios (crear, cambiar rol, eliminar)
- Marcar canjes como entregados
- Ver el panel de salud del sistema (estado de contratos, configuración)

---

## API — resumen de endpoints

### Autenticación

```
POST   /api/auth/register          Crear cuenta de estudiante
POST   /api/auth/login             Iniciar sesión → devuelve JWT
GET    /api/auth/me                Datos del usuario autenticado
```

### Usuarios (solo ADMIN)

```
GET    /api/users                  Listar todos los usuarios
POST   /api/users                  Crear reviewer o admin
GET    /api/users/:id              Detalle de usuario
PATCH  /api/users/:id/role         Cambiar rol
DELETE /api/users/:id              Eliminar usuario
```

### Actividades

```
GET    /api/activities             Listar (STUDENT: solo ACTIVE)
GET    /api/activities/:id         Detalle
POST   /api/activities             Crear (ADMIN)
PATCH  /api/activities/:id         Editar (ADMIN)
DELETE /api/activities/:id         Desactivar (ADMIN)
POST   /api/activities/:id/badge-image   Subir imagen de badge (ADMIN)
```

### Envíos de prueba

```
GET    /api/submissions            Listar (STUDENT: solo los propios)
GET    /api/submissions/:id        Detalle
POST   /api/submissions            Enviar prueba con archivo (STUDENT)
PATCH  /api/submissions/:id/approve    Aprobar → mint + badge (ADMIN/REVIEWER)
PATCH  /api/submissions/:id/reject     Rechazar con nota (ADMIN/REVIEWER)
```

### Recompensas

```
GET    /api/rewards                Listar (STUDENT: solo ACTIVE)
GET    /api/rewards/:id            Detalle
POST   /api/rewards                Crear (ADMIN)
PATCH  /api/rewards/:id            Editar (ADMIN)
DELETE /api/rewards/:id            Desactivar (ADMIN)
POST   /api/rewards/:id/image      Subir imagen (ADMIN)
```

### Canjes

```
GET    /api/redemptions            Listar (STUDENT: solo los propios)
GET    /api/redemptions/:id        Detalle
POST   /api/redemptions            Canjear puntos por recompensa (STUDENT)
PATCH  /api/redemptions/:id/complete   Marcar como entregado (ADMIN)
```

### Sistema

```
GET    /api/health                 Estado del sistema y contratos
```

Todos los endpoints protegidos requieren el header:
```
Authorization: Bearer <JWT>
```

---

## Colección Postman

El archivo `stellar-projects.postman_collection.json` en la raíz contiene ejemplos de todas las peticiones. Importarlo en Postman o en cualquier cliente compatible (Insomnia, Bruno, etc.).

1. Importar el archivo en Postman
2. Crear una variable de colección `base_url` con valor `http://localhost:3000`
3. Usar el endpoint de login para obtener el JWT y guardarlo en la variable `token`
4. El resto de peticiones autenticadas usan `{{token}}` automáticamente

---

## Comandos útiles

```bash
# Generar secretos aleatorios para .env
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"  # JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"  # ENCRYPTION_KEY

# Ver todos los targets del Makefile
make help

# Compilar contratos
make build

# Desplegar y inicializar todo (primera vez)
make keys
make deploy
make init-points    POINTS_CONTRACT_ID=C... ADMIN_PUBLIC_KEY=G...
make init-badges    BADGES_CONTRACT_ID=C... ADMIN_PUBLIC_KEY=G...
make init-redemptions REDEMPTION_CONTRACT_ID=C... ADMIN_PUBLIC_KEY=G...

# Tests de contratos Rust
make test

# Limpiar artefactos de compilación
make clean
```
