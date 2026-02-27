# ══════════════════════════════════════════════════════════════════════════════
# Stellar School Rewards — Makefile
# Gestiona build, tests y despliegue de los contratos Soroban
# ══════════════════════════════════════════════════════════════════════════════

# ── Variables configurables ───────────────────────────────────────────────────
NETWORK  ?= testnet
SOURCE   ?= admin   # alias de la clave en `stellar keys` (ver: make keys)

# Leer claves del .env si existen y no se pasaron por CLI
-include backend/.env
ADMIN_PUBLIC_KEY      ?= $(STELLAR_ADMIN_PUBLIC_KEY)

# IDs de contratos ya desplegados (para inicializar sin redesplegar)
POINTS_CONTRACT_ID     ?= $(STELLAR_CONTRACT_ID)
BADGES_CONTRACT_ID     ?= $(STELLAR_BADGE_CONTRACT_ID)
REDEMPTION_CONTRACT_ID ?= $(STELLAR_REDEMPTION_CONTRACT_ID)
HUB_CONTRACT_ID        ?= $(STELLAR_HUB_CONTRACT_ID)

# ── Rutas ─────────────────────────────────────────────────────────────────────
WASM_DIR         := target/wasm32-unknown-unknown/release
POINTS_WASM      := $(WASM_DIR)/school_points.wasm
BADGES_WASM      := $(WASM_DIR)/achievement_badges.wasm
REDEMPTION_WASM  := $(WASM_DIR)/redemption_records.wasm
HUB_WASM         := $(WASM_DIR)/institution_hub.wasm

# ── Colores ───────────────────────────────────────────────────────────────────
BOLD  := \033[1m
CYAN  := \033[0;36m
GREEN := \033[0;32m
YELLOW:= \033[0;33m
RED   := \033[0;31m
RESET := \033[0m

# ── Default ───────────────────────────────────────────────────────────────────
.DEFAULT_GOAL := help

.PHONY: help keys build build-points build-badges build-redemptions build-hub \
        test test-points test-badges test-redemptions test-hub \
        deploy deploy-points deploy-badges deploy-redemptions deploy-hub \
        init-points init-badges init-redemptions init-hub \
        register-institution set-rate \
        clean

# ══════════════════════════════════════════════════════════════════════════════
# AYUDA
# ══════════════════════════════════════════════════════════════════════════════
help:
	@printf "$(BOLD)Stellar School Rewards$(RESET) — Gestión de contratos Soroban\n\n"
	@printf "$(CYAN)── Prerequisitos ────────────────────────────────────────────────$(RESET)\n"
	@printf "  make keys                  Genera clave admin + fondea con Friendbot\n\n"
	@printf "$(CYAN)── Build ─────────────────────────────────────────────────────────$(RESET)\n"
	@printf "  make build                 Compila los 3 contratos a WASM\n"
	@printf "  make build-points          school_points\n"
	@printf "  make build-badges          achievement_badges\n"
	@printf "  make build-redemptions     redemption_records\n\n"
	@printf "$(CYAN)── Test ──────────────────────────────────────────────────────────$(RESET)\n"
	@printf "  make test                  Tests de los 3 contratos\n"
	@printf "  make test-points           school_points\n"
	@printf "  make test-badges           achievement_badges\n"
	@printf "  make test-redemptions      redemption_records\n\n"
	@printf "$(CYAN)── Deploy ────────────────────────────────────────────────────────$(RESET)\n"
	@printf "  make deploy                Build + despliega los 3 contratos\n"
	@printf "  make deploy-points         school_points\n"
	@printf "  make deploy-badges         achievement_badges\n"
	@printf "  make deploy-redemptions    redemption_records\n\n"
	@printf "$(CYAN)── Initialize ────────────────────────────────────────────────────$(RESET)\n"
	@printf "  make init-points       POINTS_CONTRACT_ID=C...     ADMIN_PUBLIC_KEY=G...\n"
	@printf "  make init-badges       BADGES_CONTRACT_ID=C...     ADMIN_PUBLIC_KEY=G...\n"
	@printf "  make init-redemptions  REDEMPTION_CONTRACT_ID=C... ADMIN_PUBLIC_KEY=G...\n\n"
	@printf "$(CYAN)── Limpieza ──────────────────────────────────────────────────────$(RESET)\n"
	@printf "  make clean                 Elimina los artefactos de compilación\n\n"
	@printf "$(CYAN)── Variables actuales ────────────────────────────────────────────$(RESET)\n"
	@printf "  NETWORK=$(BOLD)$(NETWORK)$(RESET)\n"
	@printf "  SOURCE=$(BOLD)$(SOURCE)$(RESET)  (alias en \`stellar keys\`)\n"
	@printf "  ADMIN_PUBLIC_KEY=$(BOLD)$(ADMIN_PUBLIC_KEY)$(RESET)\n"
	@printf "  POINTS_CONTRACT_ID=$(BOLD)$(POINTS_CONTRACT_ID)$(RESET)\n"
	@printf "  BADGES_CONTRACT_ID=$(BOLD)$(BADGES_CONTRACT_ID)$(RESET)\n"
	@printf "  REDEMPTION_CONTRACT_ID=$(BOLD)$(REDEMPTION_CONTRACT_ID)$(RESET)\n"
	@printf "  HUB_CONTRACT_ID=$(BOLD)$(HUB_CONTRACT_ID)$(RESET)\n\n"
	@printf "$(YELLOW)Flujo completo (primera vez):$(RESET)\n"
	@printf "  1. make keys\n"
	@printf "  2. Copia las claves en backend/.env\n"
	@printf "  3. make deploy\n"
	@printf "  4. make init-points       POINTS_CONTRACT_ID=<ID>     ADMIN_PUBLIC_KEY=<G...>\n"
	@printf "  5. make init-badges       BADGES_CONTRACT_ID=<ID>     ADMIN_PUBLIC_KEY=<G...>\n"
	@printf "  6. make init-redemptions  REDEMPTION_CONTRACT_ID=<ID> ADMIN_PUBLIC_KEY=<G...>\n"
	@printf "  7. make init-hub          HUB_CONTRACT_ID=<ID>        ADMIN_PUBLIC_KEY=<G...>\n"
	@printf "  8. Agrega los IDs en backend/.env y arranca el servidor\n\n"

# ══════════════════════════════════════════════════════════════════════════════
# PREREQUISITOS: generar clave admin
# ══════════════════════════════════════════════════════════════════════════════
keys:
	@printf "$(BOLD)Verificando clave '$(SOURCE)' en stellar keys...$(RESET)\n"
	@if stellar keys show $(SOURCE) --network $(NETWORK) > /dev/null 2>&1; then \
	  printf "$(YELLOW)La clave '$(SOURCE)' ya existe.$(RESET)\n"; \
	else \
	  printf "Generando clave '$(SOURCE)'...\n"; \
	  stellar keys generate $(SOURCE) --network $(NETWORK); \
	fi
	@printf "\n$(CYAN)Clave pública:$(RESET)\n"
	@stellar keys address $(SOURCE)
	@printf "\n$(CYAN)Fondeando con Friendbot (testnet)...$(RESET)\n"
	@PUBKEY=$$(stellar keys address $(SOURCE)) && \
	  curl -s "https://friendbot.stellar.org?addr=$$PUBKEY" | \
	  python3 -c "import sys,json; d=json.load(sys.stdin); print('$(GREEN)✓ Fondeado$(RESET)') if 'hash' in d else print('$(YELLOW)Respuesta:', d.get('detail','ver stderr'), '$(RESET)')" 2>/dev/null || \
	  printf "$(YELLOW)Friendbot no disponible o cuenta ya fondeada$(RESET)\n"
	@printf "\n$(YELLOW)Agrega en backend/.env:$(RESET)\n"
	@printf "  STELLAR_ADMIN_PUBLIC_KEY=$$(stellar keys address $(SOURCE))\n"
	@printf "  STELLAR_ADMIN_SECRET_KEY=<ver: stellar keys show $(SOURCE) --show-secret>\n\n"

# ══════════════════════════════════════════════════════════════════════════════
# BUILD
# ══════════════════════════════════════════════════════════════════════════════
build: build-points build-badges build-redemptions build-hub

build-points:
	@printf "$(BOLD)Compilando school_points...$(RESET)\n"
	cargo build --target wasm32-unknown-unknown --release -p school-points
	@printf "$(GREEN)✓ $(POINTS_WASM)$(RESET)\n"

build-badges:
	@printf "$(BOLD)Compilando achievement_badges...$(RESET)\n"
	cargo build --target wasm32-unknown-unknown --release -p achievement-badges
	@printf "$(GREEN)✓ $(BADGES_WASM)$(RESET)\n"

build-redemptions:
	@printf "$(BOLD)Compilando redemption_records...$(RESET)\n"
	cargo build --target wasm32-unknown-unknown --release -p redemption-records
	@printf "$(GREEN)✓ $(REDEMPTION_WASM)$(RESET)\n"

build-hub:
	@printf "$(BOLD)Compilando institution_hub...$(RESET)\n"
	cargo build --target wasm32-unknown-unknown --release -p institution-hub
	@printf "$(GREEN)✓ $(HUB_WASM)$(RESET)\n"

# ══════════════════════════════════════════════════════════════════════════════
# TEST
# ══════════════════════════════════════════════════════════════════════════════
test: test-points test-badges test-redemptions test-hub

test-points:
	@printf "$(BOLD)Tests school_points...$(RESET)\n"
	cargo test -p school-points

test-badges:
	@printf "$(BOLD)Tests achievement_badges...$(RESET)\n"
	cargo test -p achievement-badges

test-redemptions:
	@printf "$(BOLD)Tests redemption_records...$(RESET)\n"
	cargo test -p redemption-records

test-hub:
	@printf "$(BOLD)Tests institution_hub...$(RESET)\n"
	cargo test -p institution-hub

# ══════════════════════════════════════════════════════════════════════════════
# DEPLOY
# ══════════════════════════════════════════════════════════════════════════════
deploy: deploy-points deploy-badges deploy-redemptions deploy-hub

deploy-points: build-points
	@printf "$(BOLD)Desplegando school_points en $(NETWORK)...$(RESET)\n"
	@printf "$(CYAN)Esto puede tardar 30-60 segundos$(RESET)\n"
	@CONTRACT_ID=$$(stellar contract deploy \
	  --wasm $(POINTS_WASM) \
	  --source $(SOURCE) \
	  --network $(NETWORK)) && \
	printf "$(GREEN)✓ school_points desplegado$(RESET)\n" && \
	printf "\n  $(BOLD)CONTRACT_ID: $$CONTRACT_ID$(RESET)\n\n" && \
	printf "$(YELLOW)Pasos siguientes:$(RESET)\n" && \
	printf "  1. backend/.env  →  STELLAR_CONTRACT_ID=$$CONTRACT_ID\n" && \
	printf "  2. make init-points POINTS_CONTRACT_ID=$$CONTRACT_ID ADMIN_PUBLIC_KEY=$(ADMIN_PUBLIC_KEY)\n\n"

deploy-badges: build-badges
	@printf "$(BOLD)Desplegando achievement_badges en $(NETWORK)...$(RESET)\n"
	@printf "$(CYAN)Esto puede tardar 30-60 segundos$(RESET)\n"
	@CONTRACT_ID=$$(stellar contract deploy \
	  --wasm $(BADGES_WASM) \
	  --source $(SOURCE) \
	  --network $(NETWORK)) && \
	printf "$(GREEN)✓ achievement_badges desplegado$(RESET)\n" && \
	printf "\n  $(BOLD)CONTRACT_ID: $$CONTRACT_ID$(RESET)\n\n" && \
	printf "$(YELLOW)Pasos siguientes:$(RESET)\n" && \
	printf "  1. backend/.env  →  STELLAR_BADGE_CONTRACT_ID=$$CONTRACT_ID\n" && \
	printf "  2. make init-badges BADGES_CONTRACT_ID=$$CONTRACT_ID ADMIN_PUBLIC_KEY=$(ADMIN_PUBLIC_KEY)\n\n"

deploy-redemptions: build-redemptions
	@printf "$(BOLD)Desplegando redemption_records en $(NETWORK)...$(RESET)\n"
	@printf "$(CYAN)Esto puede tardar 30-60 segundos$(RESET)\n"
	@CONTRACT_ID=$$(stellar contract deploy \
	  --wasm $(REDEMPTION_WASM) \
	  --source $(SOURCE) \
	  --network $(NETWORK)) && \
	printf "$(GREEN)✓ redemption_records desplegado$(RESET)\n" && \
	printf "\n  $(BOLD)CONTRACT_ID: $$CONTRACT_ID$(RESET)\n\n" && \
	printf "$(YELLOW)Pasos siguientes:$(RESET)\n" && \
	printf "  1. backend/.env  →  STELLAR_REDEMPTION_CONTRACT_ID=$$CONTRACT_ID\n" && \
	printf "  2. make init-redemptions REDEMPTION_CONTRACT_ID=$$CONTRACT_ID ADMIN_PUBLIC_KEY=$(ADMIN_PUBLIC_KEY)\n\n"

deploy-hub: build-hub
	@printf "$(BOLD)Desplegando institution_hub en $(NETWORK)...$(RESET)\n"
	@printf "$(CYAN)Esto puede tardar 30-60 segundos$(RESET)\n"
	@CONTRACT_ID=$$(stellar contract deploy \
	  --wasm $(HUB_WASM) \
	  --source $(SOURCE) \
	  --network $(NETWORK)) && \
	printf "$(GREEN)✓ institution_hub desplegado$(RESET)\n" && \
	printf "\n  $(BOLD)CONTRACT_ID: $$CONTRACT_ID$(RESET)\n\n" && \
	printf "$(YELLOW)Pasos siguientes:$(RESET)\n" && \
	printf "  1. backend/.env  →  STELLAR_HUB_CONTRACT_ID=$$CONTRACT_ID\n" && \
	printf "  2. make init-hub HUB_CONTRACT_ID=$$CONTRACT_ID ADMIN_PUBLIC_KEY=$(ADMIN_PUBLIC_KEY)\n\n"

# ══════════════════════════════════════════════════════════════════════════════
# INITIALIZE
# ══════════════════════════════════════════════════════════════════════════════

init-points:
	@test -n "$(POINTS_CONTRACT_ID)" || \
	  (printf "$(RED)Error: POINTS_CONTRACT_ID es requerido$(RESET)\n" && exit 1)
	@test -n "$(ADMIN_PUBLIC_KEY)" || \
	  (printf "$(RED)Error: ADMIN_PUBLIC_KEY es requerido$(RESET)\n" && exit 1)
	@printf "$(BOLD)Inicializando school_points ($(POINTS_CONTRACT_ID))...$(RESET)\n"
	stellar contract invoke \
	  --id $(POINTS_CONTRACT_ID) \
	  --source $(SOURCE) \
	  --network $(NETWORK) \
	  -- initialize \
	  --admin $(ADMIN_PUBLIC_KEY) \
	  --name "School Points" \
	  --symbol "SPTS"
	@printf "$(GREEN)✓ school_points inicializado$(RESET)\n"

init-badges:
	@test -n "$(BADGES_CONTRACT_ID)" || \
	  (printf "$(RED)Error: BADGES_CONTRACT_ID es requerido$(RESET)\n" && exit 1)
	@test -n "$(ADMIN_PUBLIC_KEY)" || \
	  (printf "$(RED)Error: ADMIN_PUBLIC_KEY es requerido$(RESET)\n" && exit 1)
	@printf "$(BOLD)Inicializando achievement_badges ($(BADGES_CONTRACT_ID))...$(RESET)\n"
	stellar contract invoke \
	  --id $(BADGES_CONTRACT_ID) \
	  --source $(SOURCE) \
	  --network $(NETWORK) \
	  -- initialize \
	  --admin $(ADMIN_PUBLIC_KEY)
	@printf "$(GREEN)✓ achievement_badges inicializado$(RESET)\n"

init-redemptions:
	@test -n "$(REDEMPTION_CONTRACT_ID)" || \
	  (printf "$(RED)Error: REDEMPTION_CONTRACT_ID es requerido$(RESET)\n" && exit 1)
	@test -n "$(ADMIN_PUBLIC_KEY)" || \
	  (printf "$(RED)Error: ADMIN_PUBLIC_KEY es requerido$(RESET)\n" && exit 1)
	@printf "$(BOLD)Inicializando redemption_records ($(REDEMPTION_CONTRACT_ID))...$(RESET)\n"
	stellar contract invoke \
	  --id $(REDEMPTION_CONTRACT_ID) \
	  --source $(SOURCE) \
	  --network $(NETWORK) \
	  -- initialize \
	  --admin $(ADMIN_PUBLIC_KEY)
	@printf "$(GREEN)✓ redemption_records inicializado$(RESET)\n"

init-hub:
	@test -n "$(HUB_CONTRACT_ID)" || \
	  (printf "$(RED)Error: HUB_CONTRACT_ID es requerido$(RESET)\n" && exit 1)
	@test -n "$(ADMIN_PUBLIC_KEY)" || \
	  (printf "$(RED)Error: ADMIN_PUBLIC_KEY es requerido$(RESET)\n" && exit 1)
	@printf "$(BOLD)Inicializando institution_hub ($(HUB_CONTRACT_ID))...$(RESET)\n"
	stellar contract invoke \
	  --id $(HUB_CONTRACT_ID) \
	  --source $(SOURCE) \
	  --network $(NETWORK) \
	  -- initialize \
	  --admin $(ADMIN_PUBLIC_KEY)
	@printf "$(GREEN)✓ institution_hub inicializado$(RESET)\n"

# Register an institution in the hub. Usage:
#   make register-institution HUB_CONTRACT_ID=C... INST_ID=1 TOKEN_CONTRACT=C... INST_ADMIN=G...
register-institution:
	@test -n "$(HUB_CONTRACT_ID)" || (printf "$(RED)Error: HUB_CONTRACT_ID requerido$(RESET)\n" && exit 1)
	@test -n "$(INST_ID)" || (printf "$(RED)Error: INST_ID requerido$(RESET)\n" && exit 1)
	@test -n "$(TOKEN_CONTRACT)" || (printf "$(RED)Error: TOKEN_CONTRACT requerido$(RESET)\n" && exit 1)
	@test -n "$(INST_ADMIN)" || (printf "$(RED)Error: INST_ADMIN requerido$(RESET)\n" && exit 1)
	stellar contract invoke \
	  --id $(HUB_CONTRACT_ID) \
	  --source $(SOURCE) \
	  --network $(NETWORK) \
	  -- register_institution \
	  --institution_id $(INST_ID) \
	  --token_contract $(TOKEN_CONTRACT) \
	  --inst_admin $(INST_ADMIN)
	@printf "$(GREEN)✓ Institución $(INST_ID) registrada$(RESET)\n"

# Set swap rate between two token contracts. Usage:
#   make set-rate HUB_CONTRACT_ID=C... FROM=C... TO=C... RATE=1000000
set-rate:
	@test -n "$(HUB_CONTRACT_ID)" || (printf "$(RED)Error: HUB_CONTRACT_ID requerido$(RESET)\n" && exit 1)
	@test -n "$(FROM)" || (printf "$(RED)Error: FROM (contract) requerido$(RESET)\n" && exit 1)
	@test -n "$(TO)" || (printf "$(RED)Error: TO (contract) requerido$(RESET)\n" && exit 1)
	@test -n "$(RATE)" || (printf "$(RED)Error: RATE requerido (1_000_000 = 1:1)$(RESET)\n" && exit 1)
	stellar contract invoke \
	  --id $(HUB_CONTRACT_ID) \
	  --source $(SOURCE) \
	  --network $(NETWORK) \
	  -- set_exchange_rate \
	  --from_contract $(FROM) \
	  --to_contract $(TO) \
	  --rate $(RATE)
	@printf "$(GREEN)✓ Tasa $(FROM) → $(TO) = $(RATE)$(RESET)\n"

# ══════════════════════════════════════════════════════════════════════════════
# CLEAN
# ══════════════════════════════════════════════════════════════════════════════
clean:
	cargo clean
	@printf "$(GREEN)✓ Artefactos eliminados$(RESET)\n"
