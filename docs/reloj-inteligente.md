# Modulo del reloj inteligente

## Estado

| Parte | Estado |
|---|---|
| Front: conexion por **Web Bluetooth** (perfil Heart Rate), grafica en vivo con `CircularBuffer` | Implementado |
| Back: ingesta `POST /wearables/samples`, ventana circular, reglas en streaming, alertas, escalado a emergencia | Implementado |
| IA: `POST /wearable/evaluate` (MAD, EWMA, energia 3-8 Hz) | Implementado |
| **Prueba con un dispositivo real** | **Pendiente** (validado con muestras simuladas y tests) |

> Honestidad tecnica: ningun reloj comercial garantiza detectar crisis. Esto es un apoyo de alerta temprana, no un dispositivo medico.

## Flujo

1. El usuario pulsa "Vincular reloj"; el navegador muestra el selector Bluetooth (requiere gesto del usuario y HTTPS).
2. El front se suscribe a la caracteristica `heart_rate_measurement` (servicio `0x180D`) y, si el dispositivo lo expone, a un servicio de movimiento.
3. Cada muestra entra a un `CircularBuffer` (grafica) y se envia por lotes (hasta 200) al back.
4. El back evalua reglas en streaming y pide a la IA una segunda opinion estadistica.
5. Si hay alerta, el usuario recibe una **cuenta regresiva de confirmacion**; si no la cancela, se escala a emergencia (`POST /wearables/alerts/:id/escalate`).

## Reglas de deteccion

| Tipo | Regla | Parametros |
|---|---|---|
| `tachycardia` | FC por encima de un umbral personal durante N minutos sin movimiento | umbral = mediana + k*MAD del propio usuario |
| `hr_anomaly` | z-score robusto con MAD y EWMA sobre la ventana | k configurable |
| `motion_convulsive` | Energia alta en banda 3-8 Hz sostenida varios segundos | requiere acelerometro |
| `fall` | Pico de aceleracion seguido de inmovilidad | requiere acelerometro |

Se prefiere un falso positivo con cancelacion facil a un falso negativo; por eso la confirmacion es corta y visible.

## Limitaciones de Web Bluetooth

- Solo Chrome/Edge (escritorio y Android); **no** funciona en Safari/iOS.
- Requiere pantalla activa y pestana abierta: no es monitoreo continuo en segundo plano.
- Muchos relojes (Apple Watch, Galaxy Watch, Garmin) **no** exponen el pulso por GATT estandar a terceros; funcionan bandas de pecho y algunas pulseras con modo de difusion de FC.
- El acelerometro no es estandar: requiere un servicio especifico del fabricante.

## Alternativas cloud (siguiente fase)

| Alternativa | Como encaja | Observaciones |
|---|---|---|
| Fitbit Web API | OAuth2; sincronizar FC intradia | Latencia de minutos; sin alertas en tiempo real |
| Google Health Connect / Health Services | App Android que empuja a `POST /wearables/samples` | Requiere app nativa |
| Apple HealthKit | App iOS con HealthKit y envio al back | Requiere app nativa y revision de App Store |
| Garmin Health API | Webhooks de datos | Acceso por programa de partners |

`wearable_devices.provider` ya admite `fitbit`, `google_health`, `apple_health`, `garmin` y `manual`, de modo que el esquema y la ingesta no cambian: solo se agrega un conector que traduzca al formato de muestras.

## Plan de prueba con dispositivo real

1. Banda o reloj con Heart Rate GATT; Chrome en HTTPS (o `localhost`).
2. Registrar 30 minutos en reposo y 10 de actividad: verificar frecuencia de muestreo y perdida de paquetes.
3. Ajustar umbrales con esos datos y registrar falsos positivos.
4. Probar desconexion/reconexion y el comportamiento con pantalla bloqueada.
