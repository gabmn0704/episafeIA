# Arquitectura

## Vista de contexto

```mermaid
flowchart TB
  P[Persona con epilepsia] --> Web
  C[Cuidador / contacto] --> Web
  W[Reloj inteligente BLE] -->|Web Bluetooth| Web
  Web[Front React + TS - Vercel] -->|REST + SSE, JWT| API
  API[Back Express + TS] --> DB[(PostgreSQL)]
  API -->|HTTP interno| IA[Servicio IA Express + TS]
  IA -.->|opcional| LLM[Claude API]
  API -->|colas de notificacion| N[Email / SMS / log]
```

## Componentes y responsabilidades

| Repo | Responsabilidad | Puerto local |
|---|---|---|
| `EpisafeIA_front` | UI en espanol, estructuras locales (Stack undo, Queue toasts, Trie, CircularBuffer de pulso), Web Bluetooth | 5173 |
| `EpisafeIa_back` | Auth JWT, CRUD, emergencia, informes, ingesta de wearables, orquestacion hacia IA, SSE | 4000 |
| `episafeIA_IA` | Patrones, riesgo logistico, deteccion de anomalias del reloj, explicaciones | 5000 |
| `EpisafeIa_BD` | Esquema, migraciones TypeScript (`schema_migrations`), seed de 90 dias | 5432 |
| `episafeIA` | Documentacion, IaC (CDK), docker-compose, CI | - |

## Flujo de emergencia

```mermaid
sequenceDiagram
  participant U as Usuario
  participant F as Front
  participant B as Back
  participant H as MinHeap de notificaciones
  participant D as PostgreSQL
  U->>F: Pulsa boton de emergencia
  F->>B: POST /emergency {lat, lng}
  B->>D: INSERT seizure + emergency_event (fecha/hora)
  B->>H: encola contactos por prioridad
  loop hasta vaciar
    H-->>B: contacto de mayor prioridad
    B->>D: notification (factory de canal: sms/email/log)
  end
  B-->>F: 201 + evento
  B-->>F: SSE "emergency"
```

## Flujo del reloj inteligente

```mermaid
sequenceDiagram
  participant R as Reloj BLE
  participant F as Front
  participant B as Back
  participant I as IA
  R->>F: notificaciones de pulso/movimiento (GATT)
  F->>F: CircularBuffer local para la grafica
  F->>B: POST /wearables/samples (lotes <= 200)
  B->>B: ventana circular + reglas en streaming
  B->>I: POST /wearable/evaluate (MAD, EWMA, banda 3-8 Hz)
  I-->>B: anomalias + confianza
  B->>B: crea wearable_alert
  B-->>F: SSE "wearable_alert"
  F->>B: escalar a emergencia (confirmacion del usuario)
```

## Flujo de riesgo diario

El back reune el registro del dia (sueno, estres, cafeina, ejercicio, dosis omitidas) y pide a `POST /risk/score` un puntaje 0-100 con factores explicables. Si el servicio IA no responde, el back calcula un puntaje local simple y marca `degraded: true`, para que la UI avise que es una estimacion reducida.

## Despliegue

```mermaid
flowchart LR
  Dev[git push] --> CI[GitHub Actions]
  CI --> Img[(ECR)]
  Img --> AR[App Runner back / IA]
  AR --> RDS[(RDS privado)]
  Vercel[Vercel front] --> AR
```

Detalle en [infra/README.md](../infra/README.md) y [despliegue-vercel.md](despliegue-vercel.md).

## Modelo de datos (resumen)

```mermaid
erDiagram
  users ||--o{ emergency_contacts : tiene
  users ||--o{ medications : toma
  medications ||--o{ medication_logs : registra
  users ||--o{ daily_logs : escribe
  users ||--o{ seizures : sufre
  seizures ||--o| emergency_events : origina
  emergency_events ||--o{ notifications : dispara
  users ||--o{ risk_assessments : recibe
  users ||--o{ wearable_devices : vincula
  wearable_devices ||--o{ wearable_samples : emite
  wearable_devices ||--o{ wearable_alerts : genera
  users ||--o{ audit_log : auditado
```

Fuente de verdad del esquema: repo `EpisafeIa_BD`.
