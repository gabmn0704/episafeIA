# Catalogo de estructuras de datos

Todas se implementan a mano en TypeScript, con tests (Vitest), y se usan en funcionalidades reales. `n` = elementos almacenados. Las columnas marcan si la estructura se **vio en clase** o es **investigada** (para la rubrica); ajustar segun el temario del curso.

## Back (`EpisafeIa_back/src/structures/`)

| Estructura | Donde se usa | Operaciones y Big-O | Por que esta y no otra |
|---|---|---|---|
| `LinkedList` / `DoublyLinkedList` | Historial navegable de crisis (anterior/siguiente) | insertar al inicio/fin O(1), recorrer O(n), borrar nodo conocido O(1) (doble) | Navegar hacia ambos lados sin desplazar elementos como un arreglo |
| `Stack` | Deshacer las ultimas acciones del registro diario | push/pop/peek O(1) | LIFO natural del "deshacer" |
| `Queue` | Cola FIFO de trabajos simples (reintentos de notificacion) | enqueue/dequeue O(1) (con indices, sin `shift`) | Orden de llegada |
| `PriorityQueue` (MinHeap) | Orden de notificacion de emergencia por prioridad del contacto | insert/extract O(log n), peek O(1) | Siempre notificar primero al contacto 1; ordenar todo seria O(n log n) cada vez |
| `CircularBuffer` | Ventana en vivo de muestras del reloj (`/wearables/live`) | push O(1), lectura de ventana O(k) | Memoria acotada: solo importan los ultimos minutos; sobreescribe lo viejo |
| `HashTable` propia | Cache de sesiones y rate-limit por IP/usuario | get/set/delete O(1) promedio, O(n) peor caso | Acceso por clave en cada request; encadenamiento + redimension |
| `BinarySearchTree` / `AVLTree` | Indice de crisis por fecha y consulta por rango (`/seizures?from&to`) | AVL: insertar/buscar O(log n), rango O(log n + m) | BST sin balance degenera a O(n) con fechas casi ordenadas (insercion cronologica); el AVL garantiza altura O(log n) |
| `Trie` | Autocompletado de medicamentos (`/medications/search?q=`) | insertar O(L), prefijo O(L + m), L = largo | Busqueda por prefijo independiente de cuantos medicamentos hay |
| `Graph` (lista de adyacencia) | Co-ocurrencia de desencadenantes; BFS/DFS y PageRank simple | BFS/DFS O(V + E); PageRank O(k(V + E)) | Las relaciones "sueno corto + estres + cafeina" son aristas ponderadas, no una tabla |
| `LRUCache` | Cache de respuestas de `/ai/*` y reportes | get/put O(1) (hash + lista doble) | Evitar recalcular y llamar a IA con los mismos datos |
| `BloomFilter` | Emails ya registrados y tokens revocados | add/contains O(k); falsos positivos posibles, nunca negativos | Descarte rapido sin ir a la BD; si dice "tal vez", se confirma en PostgreSQL |
| `FenwickTree` / `SegmentTree` | Sumas por rango de horas de sueno (promedios de ventana) | update O(log n), consulta de rango O(log n) | Recalcular promedios de 7/30 dias sobre actualizaciones frecuentes sin reescanear |

## Frontend (`EpisafeIA_front/src/lib/structures/`)

| Estructura | Donde se usa | Big-O | Motivo |
|---|---|---|---|
| `Stack` | Deshacer en el registro diario | O(1) | LIFO |
| `Queue` | Cola de toasts/avisos | O(1) | FIFO, uno a la vez |
| `Trie` | Busqueda local de medicamentos/sintomas sin red | O(L) | Respuesta inmediata al teclear |
| `CircularBuffer` | Grafica de pulso en vivo | O(1) push | Ultimos N puntos sin crecer memoria |

## Servicio IA (`episafeIA_IA/src/`)

| Estructura | Donde se usa | Big-O | Motivo |
|---|---|---|---|
| `MinHeap` | Top-k insights por relevancia | O(n log k) | Mantener los k mejores sin ordenar todo |
| `Graph` | Correlaciones entre factores | O(V + E) | Relaciones ponderadas |
| `CircularBuffer` / EWMA | Ventana del reloj y suavizado | O(1) por muestra | Streaming con memoria constante |

## Algoritmos asociados (investigados)

- **Intervalo de Wilson** para proporciones pequenas (insights con n bajo).
- **MAD / z-score robusto** y **EWMA** para anomalias de pulso: resisten outliers mejor que la media.
- **Energia en banda 3-8 Hz** (aproximada por ventana) para movimiento convulsivo.
- **Descenso de gradiente con regularizacion L2** para el modelo logistico.
- **PageRank simple (potencias)** sobre el grafo de desencadenantes.

## Criterios de calidad aplicados

1. Ninguna estructura es decorativa: cada fila tiene un endpoint o flujo concreto.
2. Tests de invariantes (heap property, balance AVL, orden LRU, sin falsos negativos del Bloom).
3. Complejidad documentada y verificada con casos de borde (vacio, un elemento, desbordes).
