# Despliegue del frontend en Vercel

El frontend (`EpisafeIA_front`, Vite + React + TypeScript) se publica en **Vercel**. El back y la IA viven en AWS (ver [infra/README.md](../infra/README.md)).

## Variables de entorno

| Variable | Entorno | Valor |
|---|---|---|
| `VITE_API_URL` | Preview / Production | URL publica del back, p. ej. `https://<id>.<region>.awsapprunner.com/api/v1` |

Solo las variables con prefijo `VITE_` llegan al navegador: **nunca** pongas secretos ahi. En Vercel no hay claves de Anthropic ni de base de datos.

## Pasos

1. En Vercel: **Add New > Project** e importar `gabmn0704/EpisafeIA_front`.
2. Framework: Vite (autodetectado). Build `npm run build`, salida `dist`.
3. Agregar `VITE_API_URL` para Production (apuntando al stack `prod`) y Preview (apuntando a `dev`).
4. Copiar `docs/reference/vercel.json` a la raiz del repo del front. Aporta el rewrite SPA (rutas del router a `index.html`), cabeceras de seguridad y cache inmutable de `/assets`.
5. Desplegar y anotar el dominio (`https://episafe.vercel.app` o el propio).
6. En el back, fijar `CORS_ORIGIN` a ese dominio (en CDK: `corsOrigin` en `infra/lib/config.ts`, luego `cdk deploy episafe-<stage>-services`).

## Con la CLI

```bash
npm i -g vercel
cd ../EpisafeIA_front
vercel link
vercel env add VITE_API_URL production
vercel --prod
```

## Notas

- **Web Bluetooth** exige HTTPS: Vercel lo da por defecto. La cabecera `Permissions-Policy` del `vercel.json` permite `bluetooth` y `geolocation` solo para el propio origen.
- El SSE (`/stream`) se consume directo contra el back; Vercel no hace de proxy.
- Si se desea ocultar el dominio del back, se puede usar un `rewrites` de Vercel hacia la API, aunque el SSE de larga duracion conviene mantenerlo directo.
- Previews por rama: cada PR del front crea una URL; agregarla a la lista permitida de CORS solo en `dev`.
