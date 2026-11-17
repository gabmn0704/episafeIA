# Desarrollo local

## Requisitos

Docker Desktop (Compose v2), Git y, opcionalmente, Node 20+ para correr servicios fuera de contenedores.

## Estructura de carpetas esperada

```text
episafe/
  episafeIA/          docker-compose.yml, docs, infra
  EpisafeIa_BD/       migraciones y seed
  EpisafeIa_back/     API
  episafeIA_IA/       servicio IA
  EpisafeIA_front/    web
```

```bash
mkdir episafe && cd episafe
for r in episafeIA EpisafeIa_BD EpisafeIa_back episafeIA_IA EpisafeIA_front; do
  git clone https://github.com/gabmn0704/$r.git
done
```

## Levantar todo

```bash
cd episafeIA
cp .env.example .env     # opcional: agrega ANTHROPIC_API_KEY
docker compose up --build
```

Orden: `postgres` (healthcheck) -> `migrate` (migraciones + seed) -> `ia` -> `back` -> `front`.

| Servicio | URL |
|---|---|
| Web | http://localhost:5173 |
| API | http://localhost:4000/api/v1 (salud: `/health`) |
| IA | http://localhost:5000 (salud: `/health`) |
| PostgreSQL | `localhost:5432`, db/usuario `episafe`, clave `episafe_dev` (solo desarrollo) |

Usuario demo: `demo@episafe.app` / `Demo1234!` (90 dias de datos sinteticos).

## Comandos utiles

```bash
docker compose logs -f back          # logs del back
docker compose run --rm migrate      # reaplicar migraciones
SEED=false docker compose up         # sin datos demo
docker compose down -v               # borra tambien el volumen de la base
psql postgres://episafe:episafe_dev@localhost:5432/episafe
```

## Solo la base de datos

Para correr back/IA/front con `npm run dev` fuera de Docker: `docker compose up postgres migrate` y usa `DATABASE_URL=postgres://episafe:episafe_dev@localhost:5432/episafe` en el `.env` del back.

## Problemas comunes

| Sintoma | Causa probable |
|---|---|
| `build context ... not found` | Los repos no estan como carpetas hermanas |
| El front no llega al back | `VITE_API_URL` debe usar `localhost`, no el nombre `back` (el navegador corre en tu maquina) |
| CORS bloqueado | `CORS_ORIGIN` debe ser exactamente `http://localhost:5173` |
| `/ai/*` con `degraded: true` | El contenedor `ia` aun no esta sano o fallo su build |
| Web Bluetooth no aparece | Usa Chrome/Edge; `localhost` cuenta como contexto seguro |
