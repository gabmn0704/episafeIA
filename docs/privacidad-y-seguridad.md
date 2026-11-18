# Plan de privacidad y seguridad (datos de salud)

Los datos de crisis, medicacion y pulso son **datos sensibles de salud** (en Colombia, Ley 1581 de 2012 y Decreto 1377 de 2013; como referencia comparativa, HIPAA y GDPR art. 9). El diseno aplica minimizacion y defensa en profundidad.

## Principios

1. **Minimizacion:** solo los campos necesarios; ubicacion solo durante una emergencia.
2. **Consentimiento explicito** al registrarse (tratamiento de datos de salud) y por cada contacto de emergencia.
3. **Control del titular:** exportar y borrar la cuenta; el borrado elimina en cascada.
4. **Trazabilidad:** `audit_log` registra accesos y cambios relevantes.

## Controles por capa

| Capa | Control |
|---|---|
| Autenticacion | bcrypt (coste >= 10), JWT access 15 min, refresh 7 dias hasheado y revocable, rate-limit en login |
| API | helmet, CORS restringido al dominio de Vercel, validacion `zod`, errores uniformes sin stack traces, rate-limit global |
| Autorizacion | Cada consulta filtra por `user_id` del token; el rol `caregiver` queda limitado a lectura de lo compartido |
| Transporte | HTTPS en Vercel y App Runner; `rds.force_ssl=1`; `DATABASE_SSL=true` |
| Datos en reposo | RDS cifrado con KMS (rotacion anual), snapshots cifrados, ECR cifrado |
| Red | RDS en subred aislada sin acceso publico; security group solo desde la capa de app; servicio IA privado por VPC Ingress |
| Secretos | AWS Secrets Manager (JWT, DB, Anthropic); nunca en el repo ni en imagenes; `.env` en `.gitignore` |
| Logs | Estructurados, sin contrasenas ni valores clinicos; retencion 14 dias en dev y 90 en prod |
| LLM | Solo metricas agregadas y anonimas; sin PII; desactivable sin API key |
| Cadena de suministro | `npm ci` con lockfile, escaneo de imagenes en ECR, `npm audit` y Dependabot recomendados |
| Respaldo | Backups automaticos RDS (3 dias dev, 14 prod), Multi-AZ en prod |

## Amenazas y mitigaciones (STRIDE resumido)

| Amenaza | Mitigacion |
|---|---|
| Robo de token | TTL corto, refresh rotativo, revocacion con Bloom filter + tabla |
| SQL injection | Consultas parametrizadas y validacion zod |
| Fuerza bruta | Rate-limit por IP y usuario (HashTable), bcrypt |
| Fuga por logs | Redaccion de campos sensibles |
| Acceso a la BD desde internet | Subred aislada, sin IP publica |
| Abuso del endpoint de emergencia | Rate-limit y estado `false_alarm` para cancelar |
| Token SSE en la URL | TTL corto; evitar registrar URLs completas |

## Reglas de repositorio

- Ningun secreto ni ID de cuenta real en git (el seed y el compose usan credenciales de desarrollo documentadas).
- Revisar `git diff` antes de cada commit; `.gitignore` bloquea `.env*` salvo `.env.example`.

## Pendientes antes de produccion real

- Politica de privacidad y aviso legal revisados por un abogado.
- Pentest o revision externa; WAF delante del back.
- Cifrado a nivel de campo para notas libres.
- Procedimiento de respuesta a incidentes y notificacion de brechas.
