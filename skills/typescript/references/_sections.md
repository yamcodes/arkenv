# Sections

This file defines all sections, their ordering, impact levels, and descriptions.
The section ID (in parentheses) is the filename prefix used to group rules.

---

## 1. Type system performance (type)

**Impact:** CRITICAL
**Description:** Complex types, deep generics, and large unions cause quadratic compilation time. Simplifying type definitions yields the largest compile-time gains.

## 2. Compiler configuration (tscfg)

**Impact:** CRITICAL
**Description:** Misconfigured tsconfig causes full rebuilds and unnecessary file scanning. Proper configuration reduces compile time by 50-80%.

## 3. Async patterns (async)

**Impact:** HIGH
**Description:** Sequential awaits create runtime waterfalls. Parallelizing async operations yields 2-10× improvement in I/O-bound code.

## 4. Module organization (module)

**Impact:** HIGH
**Description:** Barrel files and circular dependencies force excessive module loading. Direct imports reduce bundle size and improve tree-shaking.

## 5. Type safety patterns (safety)

**Impact:** MEDIUM-HIGH
**Description:** Type guards, narrowing, and strict mode prevent runtime errors. Proper patterns eliminate defensive runtime checks.

## 6. Memory management (mem)

**Impact:** MEDIUM
**Description:** Object pooling, WeakMap usage, and closure hygiene reduce GC pressure and memory leaks in long-running applications.

## 7. Runtime optimization (runtime)

**Impact:** LOW-MEDIUM
**Description:** Loop optimization, property caching, and collection choice improve hot-path performance.

## 8. Advanced patterns (advanced)

**Impact:** LOW
**Description:** Branded types, variance annotations, and declaration merging for specialized use cases.
