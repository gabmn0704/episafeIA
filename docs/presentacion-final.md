# Guia de presentacion final

La entrega exige presentacion. Duracion sugerida: **15 minutos + 5 de preguntas**, repartidos entre los integrantes (maximo 3). Incluir **demo en vivo** con plan B (capturas o video corto).

## Esquema de diapositivas

| # | Diapositiva | Contenido clave | Min |
|---|---|---|---|
| 1 | Portada | Nombre, integrantes, curso, logo | 0:30 |
| 2 | El problema real | Epilepsia: cifras de prevalencia, incertidumbre de la crisis, riesgo de estar solo, olvido de medicacion | 1:30 |
| 3 | Usuarios | Persona con epilepsia, cuidador, neurologo; un escenario concreto | 1:00 |
| 4 | Solucion | 5 funciones: registro y adherencia, emergencia, IA de riesgo/patrones, reloj, informe medico | 1:00 |
| 5 | Demo en vivo | Ver guion abajo | 4:00 |
| 6 | Arquitectura | Diagrama de [arquitectura.md](arquitectura.md): front (Vercel), back, IA, PostgreSQL, AWS | 1:30 |
| 7 | Estructuras de datos | Tabla de [estructuras-de-datos.md](estructuras-de-datos.md): cual, donde, Big-O. Destacar heap de emergencias, AVL, Trie, buffer circular | 2:00 |
| 8 | Patrones de diseno | Factory, Builder, Singleton, Proxy, Prototype con un ejemplo de codigo | 1:00 |
| 9 | Inteligencia artificial | Modelo logistico, patrones con Wilson, anomalias del reloj, explicacion con Claude; resultados sobre el seed | 1:30 |
| 10 | Etica y privacidad | Limites de la IA, datos de salud, controles | 1:00 |
| 11 | Reloj inteligente | Estado real: implementado, pendiente de prueba con dispositivo; alternativas | 0:45 |
| 12 | Infraestructura | CDK, RDS privado, App Runner, Vercel; costo aproximado | 0:45 |
| 13 | Calidad | Tests, CI, TypeScript estricto, cobertura | 0:30 |
| 14 | Limitaciones y trabajo futuro | Prueba con hardware real, app movil, validacion clinica | 0:30 |
| 15 | Cierre y preguntas | Repos y QR | 0:30 |

## Guion de la demo (4 minutos)

1. **Login** con `demo@episafe.app`; el dashboard muestra riesgo del dia, adherencia y racha.
2. **Registro diario:** cargar "sueno 4 h, estres 8"; usar *deshacer* (Stack) para mostrar la estructura en accion.
3. **Medicamentos:** escribir "lev" y mostrar el autocompletado (Trie).
4. **IA:** actualizar insights; mostrar "el 80% de tus crisis ocurrieron tras dormir menos de 5 h" con su evidencia y el aviso de consultar al neurologo.
5. **Reloj:** iniciar el simulador de muestras; aparece la grafica en vivo (buffer circular); disparar una taquicardia y ver la alerta con cuenta regresiva.
6. **Emergencia:** pulsar el boton; mostrar la fecha/hora registrada y las notificaciones en orden de prioridad (heap).
7. **Informe medico:** abrir `GET /reports/medical` en HTML (patron Builder).

Plan B: video grabado de 2 minutos y capturas en las diapositivas.

## Reparto sugerido (3 personas)

- **A:** problema, usuarios, demo del front, cierre.
- **B:** arquitectura, estructuras de datos, patrones, calidad.
- **C:** IA, etica, reloj, infraestructura.

Cada integrante debe poder responder sobre cualquier parte del codigo.

## Preguntas probables

| Pregunta | Idea de respuesta |
|---|---|
| Por que un AVL y no un BST? | Fechas casi ordenadas degeneran el BST a O(n); el AVL garantiza O(log n) |
| Por que no una libreria de ML? | Pocos datos por usuario, interpretabilidad y requisito de solo TypeScript |
| Que pasa si la IA cae? | Fallback local y `degraded: true`; la emergencia no depende de la IA |
| Detecta crisis de verdad el reloj? | Es apoyo de alerta temprana; falta validar con dispositivo real; ver limites |
| Como protegen los datos? | Cifrado, subred aislada, secretos, JWT corto, minimizacion hacia el LLM |
| Que es lo investigado? | Bloom filter, Fenwick/Segment, LRU, PageRank, MAD/EWMA, Wilson |

## Lista de verificacion previa

- [ ] `docker compose up` funciona en el equipo de la presentacion (probado el dia anterior).
- [ ] Datos demo cargados; internet de respaldo (hotspot) y Bluetooth probados.
- [ ] Diapositivas exportadas a PDF, video de respaldo guardado.
- [ ] Cada integrante ensayo su parte con cronometro.
