# Coercion Refactor Specification

## Purpose
Transition the coercion mechanism from experimental internal schema transformation to a stable data-processing pipeline using public ArkType introspection APIs.

## ADDED Requirements

### Requirement: Stable Introspection
The coercion system MUST identify target fields using only public ArkType APIs (`schema.in.json`).

#### Scenario: Identify nested numeric paths
Given a schema `{ API: { PORT: "number", TIMEOUT: "number?" } }`
When building the coercion map
Then it MUST identify `API.PORT` and `API.TIMEOUT` as numeric coercion targets via the `in.json` structure.

## MODIFIED Requirements

### Requirement: Pipeline-based Coercion
The coercion mechanism MUST be implemented as a data pre-processing morph using `type.pipe` instead of internal schema mutation.

#### Scenario: Coercion in pipeline
Given a coerced schema `const Coerced = arkenv(type({ PORT: "number" }))`
When validated with `{ PORT: "3000" }`
Then it MUST apply the coercion within the ArkType pipeline and return `{ PORT: 3000 }`.
And it MUST NOT rely on `.internal` or `.transform` methods during the process.
