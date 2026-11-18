# Patrones de diseno aplicados

| Patron | Donde | Problema que resuelve |
|---|---|---|
| **Singleton** | Pool de PostgreSQL y config validada (`zod`) en el back | Una sola conexion compartida y una sola fuente de configuracion; evita agotar conexiones |
| **Factory** | `NotificationChannelFactory` (email, sms, push, log) | Crear el canal segun `notifications.channel` sin `if` repartidos; agregar un canal no toca al servicio de emergencia |
| **Builder** | `MedicalReportBuilder` (`/reports/medical`, salida json o html) | El informe tiene secciones opcionales (crisis, adherencia, riesgo, reloj) y varios formatos; el Builder arma paso a paso y separa estructura de renderizado |
| **Prototype** | Plantillas de registro diario | Clonar el registro de ayer/plantilla y modificar solo lo distinto |
| **Proxy** | Cache (LRU) delante de los repositorios | Mismo contrato que el repositorio, pero consulta primero la cache; transparente para los servicios |
| **Repository** | Acceso a datos por entidad | Aislar SQL; permite tests con repositorios en memoria |
| **Strategy** | Reglas del reloj (taquicardia, movimiento, caida) y canales de explicacion (Claude vs plantilla) | Intercambiar el algoritmo sin tocar al orquestador |
| **Observer** | SSE `/stream` (`emergency`, `wearable_alert`, `risk_updated`) | Los clientes se suscriben a eventos; el emisor no los conoce |
| **Adapter** | Cliente HTTP al servicio IA y fallback local | Una interfaz `RiskProvider` con dos implementaciones (remota y local) |
| **Middleware / Chain of Responsibility** | Express: helmet, cors, rate-limit, auth, validacion zod, errores | Cada paso decide continuar o cortar la cadena |

## Ejemplo: Factory de notificaciones

```ts
interface NotificationChannel { send(to: Contact, payload: Payload): Promise<void> }

function createChannel(kind: 'email' | 'sms' | 'push' | 'log'): NotificationChannel {
  switch (kind) {
    case 'email': return new EmailChannel();
    case 'sms':   return new SmsChannel();
    case 'push':  return new PushChannel();
    default:      return new LogChannel(); // desarrollo: solo registra
  }
}
```

El `MinHeap` entrega contactos por prioridad; para cada uno el Factory devuelve el canal y se persiste en `notifications` con estado `queued`, `sent` o `failed`.

> Los nombres de clase pueden diferir ligeramente en el codigo; esta tabla describe el rol de cada patron.
