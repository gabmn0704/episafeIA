# Checklist de requisitos de la entrega

Estado de cada requisito y donde verificarlo. Marcar `[x]` solo tras comprobarlo en el repo correspondiente.

| # | Requisito | Estado | Evidencia / donde verificar |
|---|---|---|---|
| 1 | **Grupo de maximo 3 personas** | [ ] confirmar | Lista de integrantes en la portada de la presentacion y en el README |
| 2 | **Caso de estudio real** (epilepsia: crisis impredecibles, adherencia, emergencias) | [x] | [README](../README.md#el-problema-real), [arquitectura.md](arquitectura.md) |
| 3 | **Inteligencia artificial implementada** | [ ] verificar al integrar | Repo `episafeIA_IA`; [modelo-ia-y-etica.md](modelo-ia-y-etica.md) |
| 4 | **Estructuras de datos vistas en clase** (listas, pilas, colas, arboles, tablas hash, grafos) | [ ] verificar al integrar | `EpisafeIa_back/src/structures/`; [catalogo](estructuras-de-datos.md) |
| 5 | **Estructuras investigadas** (AVL, Trie, Bloom, Fenwick/Segment, LRU, heap, buffer circular) | [ ] verificar al integrar | Mismo catalogo, columna de justificacion |
| 6 | **Usadas de verdad, con complejidad** | [ ] verificar al integrar | Catalogo con endpoint/flujo y Big-O por estructura |
| 7 | **Frontend** | [ ] verificar al integrar | Repo `EpisafeIA_front`, desplegado en Vercel ([guia](despliegue-vercel.md)) |
| 8 | **Solo TypeScript** (back, front, IA, migraciones, IaC) | [ ] verificar al integrar | `tsconfig.json` estricto en los 5 repos; sin `.js`/`.py` de logica |
| 9 | **Presentacion final** | [ ] preparar | [presentacion-final.md](presentacion-final.md) |
| 10 | Patrones de diseno | [x] | [patrones-de-diseno.md](patrones-de-diseno.md) |
| 11 | Pruebas automatizadas | [ ] verificar al integrar | Vitest en back, front e IA; assertions de infra |
| 12 | Documentacion y como ejecutar | [x] | [README](../README.md), [desarrollo-local.md](desarrollo-local.md) |
| 13 | Seguridad y privacidad de datos de salud | [x] | [privacidad-y-seguridad.md](privacidad-y-seguridad.md) |
| 14 | Despliegue reproducible | [x] (synth) | `infra/`; `cdk deploy` pendiente de cuenta AWS |
| 15 | Modulo del reloj | parcial | Implementado; **pendiente de prueba con dispositivo real** ([detalle](reloj-inteligente.md)) |

## Verificacion rapida de "solo TypeScript"

```bash
# En cada repo: no debe haber logica en JS ni Python
git ls-files | grep -E '\.(js|jsx|py)$' | grep -vE '(config|eslint)\.' || echo "OK"
```

(Los archivos de configuracion como `eslint.config.js` son tolerados; la logica va en `.ts`/`.tsx`.)

## Pendientes antes de entregar

- Confirmar integrantes (<= 3) y el reparto de la presentacion.
- Preparar diapositivas y video de respaldo.
- Probar el reloj con hardware real o declarar explicitamente que es simulacion.
- Desplegar a AWS si el curso lo exige (hoy solo `cdk synth`).
