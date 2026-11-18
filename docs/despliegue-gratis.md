# Despliegue gratis (sin AWS)

Alternativa de costo cero para abrir EpiSafe IA desde cualquier lugar. La infraestructura AWS (CDK) queda como diseño de producción.

| Pieza | Servicio gratis | Notas |
|---|---|---|
| Web (React) | Vercel Hobby | HTTPS, CDN, siempre activo |
| API (Express) | Render Web Service (free) | Se duerme tras 15 min sin uso; la primera petición tarda ~50 s |
| IA (Node) | Vercel Function | No se duerme; protegida con `x-api-key` |
| Base de datos | Neon Postgres (free) | 0,5 GB, sin tarjeta |

## Orden de despliegue

1. **Neon**: crear proyecto, copiar la cadena `postgresql://...?sslmode=require`.
2. **Migraciones y seed** (desde `EpisafeIa_BD`):
   `DATABASE_URL=<cadena> DATABASE_SSL=true npm run migrate && npm run seed`
3. **Vercel – IA** (`episafeIA_IA`): proyecto con `vercel.json`; variable `INTERNAL_API_KEY`.
4. **Render – API** (`EpisafeIa_back`): New → Blueprint. Completar `DATABASE_URL`, `AI_SERVICE_URL` (URL de la IA), `AI_API_KEY` (= `INTERNAL_API_KEY`) y `CORS_ORIGINS` (URL de Vercel).
5. **Vercel – Web** (`EpisafeIA_front`): variable `VITE_API_URL=https://<api>.onrender.com/api/v1`. Luego añadir esa URL de Vercel a `CORS_ORIGINS` del back.
6. **Móvil**: en `eas.json` usar la URL HTTPS de la API en el perfil de producción y generar el APK.

## Evitar el arranque en frío en la demo

El workflow `.github/workflows/keepalive.yml` hace ping cada 5 min al back (solo corre desde la rama por defecto: requiere fusionar este PR). Con un solo servicio en Render entran las 750 h gratis del mes. Aun así, abre la app un minuto antes de presentar.

## Límites conocidos

- El plan gratis de Render puede reiniciar servicios; el estado vive en Neon, no en memoria.
- SMS/email de emergencia siguen simulados.

## Estado actual

- Web: https://episafe-ia-web.vercel.app
- API: https://episafe-api.onrender.com/api/v1
- IA: https://episafe-ia.vercel.app
