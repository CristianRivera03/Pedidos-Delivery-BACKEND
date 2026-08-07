.DEFAULT_GOAL := help
.PHONY: help setup dev dev-up up up-api down logs logs-api ps fresh reset migrate migrate-deploy seed studio generate test test-watch test-coverage lint lint-fix format typecheck build start clean shell psql prisma-studio-docker

# Docker compose (v2). En Windows funciona con WSL o Git Bash.
COMPOSE := docker compose -f docker/docker-compose.yml

help: ## Mostrar este help
	@echo ""
	@echo "Pedidos Delivery Backend - Comandos disponibles:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?##' Makefile | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'
	@echo ""

setup: ## Wizard interactivo de setup (Supabase o Local)
	@node bin/setup.mjs

dev: ## Levantar app en modo desarrollo (con watch)
	@npm run dev

dev-up: ## Levantar DB local en Docker y luego la app
	@$(COMPOSE) up -d postgres pgadmin
	@npm run dev

up: ## Levantar todos los servicios en Docker
	@$(COMPOSE) up -d

up-api: ## Levantar solo la API en Docker
	@$(COMPOSE) up -d api

down: ## Apagar servicios Docker (conserva datos)
	@$(COMPOSE) down

logs: ## Ver logs en vivo de todos los servicios
	@$(COMPOSE) logs -f

logs-api: ## Ver logs solo de la API
	@$(COMPOSE) logs -f api

ps: ## Estado de los contenedores
	@$(COMPOSE) ps

fresh: ## Reset DB local + migrar + seed (solo local)
	@echo "Terminando conexiones activas..."
	@$(COMPOSE) exec -T postgres psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='pedidos_delivery' AND pid <> pg_backend_pid();"
	@$(COMPOSE) exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS pedidos_delivery;"
	@$(COMPOSE) exec -T postgres psql -U postgres -c "CREATE DATABASE pedidos_delivery;"
	@npm run prisma:migrate
	@npm run prisma:seed

reset: ## Apagar y borrar todos los volúmenes (cuidado!)
	@$(COMPOSE) down -v

migrate: ## Crear nueva migración: make migrate name=add_orders
	@if [ -z "$(name)" ]; then echo "Uso: make migrate name=add_orders"; exit 1; fi
	@npm run prisma:migrate -- --name $(name)

migrate-deploy: ## Aplicar migraciones pendientes (producción)
	@npm run prisma:deploy

seed: ## Cargar datos iniciales
	@npm run prisma:seed

studio: ## Abrir Prisma Studio (GUI de DB)
	@npm run prisma:studio

generate: ## Generar Prisma Client
	@npx prisma generate

test: ## Ejecutar tests
	@npm test

test-watch: ## Tests en modo watch
	@npm run test:watch

test-coverage: ## Tests con cobertura
	@npm run test:coverage

lint: ## Ejecutar ESLint
	@npm run lint

lint-fix: ## ESLint con auto-fix
	@npm run lint:fix

format: ## Formatear con Prettier
	@npm run format

typecheck: ## Verificar tipos sin compilar
	@npm run typecheck

build: ## Compilar TypeScript a dist/
	@npm run build

start: ## Ejecutar en producción (requiere build previo)
	@npm start

clean: ## Limpiar artifacts generados
	@rm -rf dist coverage node_modules/.cache
	@echo "Limpieza completa"

shell: ## Abrir shell en el contenedor de la API
	@$(COMPOSE) exec api sh

psql: ## Conectarse a Postgres via psql
	@$(COMPOSE) exec postgres psql -U postgres -d pedidos_delivery

prisma-studio-docker: ## Prisma Studio dentro del contenedor
	@$(COMPOSE) exec api npx prisma studio