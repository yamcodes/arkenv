---
"@arkenv/cli": patch
---

#### Decouple scaffolding logic with a Planner pattern

Refactored the `init` command architecture to follow a declarative "Planner" pattern:
- **Collector**: Gathers environment state and user input.
- **Planner**: A pure function that produces a `ScaffoldingPlan` based on collected data.
- **Executor**: Applies the plan using `Workspace` and `Reporter` abstractions.

This separation of concerns makes the initialization logic pure, easily testable, and isolates side effects.
