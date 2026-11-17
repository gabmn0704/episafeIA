# Decisiones tecnicas

Formato breve tipo ADR: contexto, decision, consecuencias.

## 1. Solo TypeScript en los cinco repos
La rubrica exige TypeScript. Incluso migraciones, seed, servicio de IA e infraestructura (CDK) estan en TS. **Consecuencia:** el motor de IA (regresion logistica, MAD, EWMA) se implementa sin librerias de ML de Python; es mas liviano, testeable y suficiente para el volumen de un usuario.

## 2. Estructuras de datos implementadas a mano
La entrega pide estructuras vistas en clase e investigadas. Se implementan sin librerias y se usan en funciones reales (ver [estructuras-de-datos.md](estructuras-de-datos.md)). **Consecuencia:** mas codigo propio, pero cada estructura tiene tests y justificacion de complejidad.

## 3. Cinco repositorios
Separacion por responsabilidad: cada repo tiene su Dockerfile, CI y ciclo de vida. El repo `episafeIA` orquesta (compose, IaC, docs). **Consecuencia:** el compose referencia rutas hermanas (`../EpisafeIa_back`).

## 4. PostgreSQL con migraciones SQL numeradas
Datos relacionales con integridad (FK, CHECK). Runner propio en TS con tabla `schema_migrations`, sin ORM, para controlar el SQL y poder explicar los indices (`wearable_samples(user_id, sampled_at desc)`).

## 5. JWT access 15 min + refresh 7 dias rotativo
Access corto limita el dano de un robo; el refresh se guarda hasheado (`refresh_tokens.token_hash`) y es revocable. Un Bloom filter acelera el rechazo de tokens revocados antes de consultar la base.

## 6. IA como servicio separado, con degradacion
El back llama por HTTP a `episafeIA_IA`. Si cae, el back usa un fallback local y marca `degraded: true`. Una funcion de seguridad (alertas de emergencia) **nunca** depende de la IA: la emergencia manual y las reglas del reloj viven en el back.

## 7. IA propia + LLM solo para explicar
El puntaje de riesgo es un modelo logistico transparente (pesos visibles, factores explicados). El LLM (Claude) solo redacta explicaciones en lenguaje natural con prompt seguro; no calcula riesgos ni da recomendaciones medicas. Sin API key, hay plantillas.

## 8. SSE en lugar de WebSocket
Los eventos son unidireccionales servidor a cliente (emergencia, alerta del reloj, riesgo actualizado). SSE es mas simple, reconecta solo y atraviesa proxies. Autenticacion por `?token=` de vida corta (limitacion conocida: queda en logs de URL; mitigado con TTL corto).

## 9. Frontend en Vercel
Despliegue estatico con CDN, previews por PR y variables por entorno. El back queda en AWS por la base de datos privada. `VITE_API_URL` apunta al back publico; CORS en el back restringe al dominio de Vercel.

## 10. AWS CDK en lugar de consola manual
Reproducible, revisable en PR, con parametros dev/prod. **App Runner** en vez de ECS por menor carga operativa; el servicio IA es privado (VPC Ingress). RDS en subred aislada, cifrado y con backups.

## 11. Reloj: Web Bluetooth primero
Sin app nativa ni SDK propietario, funciona en Chrome/Edge/Android con perfiles GATT estandar (Heart Rate 0x180D). Limitaciones y alternativas en [reloj-inteligente.md](reloj-inteligente.md).

## 12. Un solo contrato compartido
Esquema y endpoints se acordaron antes de codificar (contrato versionado en los README), de modo que los cinco repos evolucionaran en paralelo sin romperse.
