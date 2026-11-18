# Modelo de IA y limites eticos

## Que hace la IA

| Capacidad | Tecnica | Salida |
|---|---|---|
| Patrones personales | Frecuencias condicionales, lift e intervalo de Wilson; solo reporta con n >= 3 | "El 80% de tus crisis ocurrieron tras dormir menos de 5 h" con evidencia (n, intervalo) |
| Riesgo diario | Regresion logistica con pesos aprendibles y prior clinico por defecto; entrenamiento propio (descenso de gradiente, L2) | Puntaje 0-100, nivel (low/moderate/high/critical), factores con direccion e impacto, `modelVersion`, confianza |
| Anomalias del reloj | z-score robusto (MAD), EWMA, energia 3-8 Hz | Tipo, confianza, ventana |
| Explicacion | Claude (`claude-sonnet-5-5`) si hay `ANTHROPIC_API_KEY`; plantillas si no | Texto en espanol, sencillo |

El modelo es **deliberadamente pequeno e interpretable**: con los datos de una sola persona (decenas o cientos de dias) un modelo complejo sobreajusta; uno lineal permite mostrar por que sube el riesgo.

## Datos y evaluacion

- El seed sintetico de 90 dias tiene una correlacion sembrada (crisis tras menos de 5 h de sueno) para verificar que el sistema la recupera. **No es evidencia clinica**: valida el pipeline, no la medicina.
- Metricas sugeridas: AUC y Brier en validacion temporal (entrenar con dias pasados, evaluar en los siguientes), calibracion del puntaje y tasa de falsos positivos del reloj por hora.
- Cada `risk_assessment` guarda `model_version` y `factors` para reproducir y auditar.

## Limites eticos (reglas del sistema)

1. **No diagnostica ni prescribe.** Nunca sugiere cambiar, omitir o ajustar dosis. Toda explicacion termina invitando a consultar al neurologo.
2. **Correlacion no es causalidad.** Los insights dicen "se asocia con", muestran n y confianza, y se silencian con pocos datos.
3. **Incertidumbre visible.** Se muestra el nivel de confianza y, si la IA no responde, la UI indica `degraded` en vez de aparentar precision.
4. **Seguridad primero.** La emergencia manual y las reglas del reloj no dependen del LLM ni de la IA remota.
5. **Humano en el circuito.** Una alerta automatica requiere ventana de confirmacion/cancelacion antes de avisar a contactos.
6. **Minimizacion hacia el LLM.** A la API de Claude solo se envian metricas agregadas y factores, **sin nombre, email, telefono ni ubicacion**. Sin API key no sale nada de la infraestructura.
7. **Prompt seguro.** Instrucciones de sistema fijas, salida acotada, sin ejecutar acciones, y las notas libres del usuario se tratan como datos, no como instrucciones.
8. **Sesgo y alcance.** Se calibra con la propia historia del usuario; no se compara con otras personas. No sustituye atencion medica ni un sistema de emergencias.
9. **Consentimiento y control.** El usuario puede borrar sus datos y desactivar el reloj; ver [privacidad-y-seguridad.md](privacidad-y-seguridad.md).

## Riesgos conocidos

- Falsos negativos (el reloj no detecta una crisis): el usuario no debe confiar solo en el sistema.
- Falsos positivos que generan fatiga de alertas: umbrales personalizados y cancelacion rapida.
- Datos de bajo volumen: intervalos amplios; el sistema prefiere callar a especular.
