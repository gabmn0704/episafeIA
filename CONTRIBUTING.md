# Contribuir

## Flujo de trabajo

1. Nunca se trabaja en `main`: crea una rama `<tipo>-<descripcion-corta>` (`feat-...`, `fix-...`, `docs-...`).
2. Un commit por cambio logico, con Conventional Commits en ingles (`feat(infra): add alarm for RDS storage`).
3. Antes de cada commit: `cd infra && npm run build && npm test && npx cdk synth --quiet`.
4. Abre un PR hacia `main` con descripcion en espanol (que cambia, por que, como se probo). El merge lo hace el responsable del repo.

## Reglas

- Sin secretos, `.env` reales ni IDs de cuenta AWS en el repositorio.
- No usar `--no-verify` ni reescribir historia compartida.
- Todo en TypeScript.
