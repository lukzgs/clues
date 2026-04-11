# Best Practices in Software Development

> A comprehensive guide that goes far beyond the basics. Each practice is explained with its reasoning, benefits, and practical guidance.

---

## Table of Contents

1. [Foundational Principles](#1-foundational-principles)
2. [Architecture & Design](#2-architecture--design)
3. [Code Quality & Craftsmanship](#3-code-quality--craftsmanship)
4. [Testing Strategies](#4-testing-strategies)
5. [DevOps & Delivery](#5-devops--delivery)
6. [Observability & Reliability](#6-observability--reliability)
7. [Security](#7-security)
8. [Data Management](#8-data-management)
9. [Team & Process](#9-team--process)
10. [Performance & Scalability](#10-performance--scalability)
11. [API Design](#11-api-design)
12. [Frontend-Specific Practices](#12-frontend-specific-practices)
13. [Cognitive & Human Factors](#13-cognitive--human-factors)

---

## 1. Foundational Principles

### 1.1 SOLID Principles (Revisited)

The classic five, but with nuance often missed:

- **Single Responsibility Principle (SRP)**: A module should have one, and only one, *reason to change*. Note: this is about *actors* (stakeholders), not about "doing one thing." A `UserService` that handles authentication AND profile rendering violates SRP because the security team and the UX team are different actors demanding changes.

- **Open/Closed Principle (OCP)**: Software entities should be open for extension, closed for modification. In practice, this means using polymorphism, strategy patterns, or plugin architectures so new behavior doesn't require rewriting existing code. Beware of over-engineering this — apply it where change is *likely*, not everywhere.

- **Liskov Substitution Principle (LSP)**: Subtypes must be substitutable for their base types without altering program correctness. This goes beyond "can I pass it?" — it means behavioral contracts (preconditions, postconditions, invariants) must be respected. A `Square` that extends `Rectangle` but breaks `setWidth()/setHeight()` independence violates LSP.

- **Interface Segregation Principle (ISP)**: No client should be forced to depend on methods it doesn't use. Prefer many small, focused interfaces over fat ones. In TypeScript, use `Pick<T, K>` or split interfaces rather than making consumers deal with irrelevant fields.

- **Dependency Inversion Principle (DIP)**: High-level modules should not depend on low-level modules — both should depend on abstractions. In practice: inject dependencies, use interfaces/protocols, and ensure your business logic never imports infrastructure code directly.

### 1.2 DRY — Don't Repeat Yourself (With Caveats)

Eliminate *knowledge* duplication, not just code duplication. Two pieces of code that look identical but represent different concepts should NOT be merged. The litmus test: if one changes, must the other change too? If no, they are not duplicates — they are coincidences.

**Anti-pattern**: Premature DRY (sometimes called "WET" — Write Everything Twice). It's often better to tolerate duplication until the abstraction becomes clear. Wrong abstractions are far more expensive than duplicated code.

### 1.3 KISS — Keep It Simple, Stupid

Simplicity is the ultimate sophistication. Every line of code is a liability. Prefer boring technology over clever solutions. A `for` loop that anyone can read is better than a chain of functional transformations that requires 5 minutes to parse.

**Practical rule**: If a junior developer can't understand your code within 30 seconds, it's probably too complex.

### 1.4 YAGNI — You Aren't Gonna Need It

Don't build features, abstractions, or infrastructure for hypothetical future requirements. Build for today's needs with enough flexibility to adapt. Over-engineering is one of the most common and expensive mistakes in software.

**Exception**: Security, accessibility, and data integrity are never YAGNI. You always need those.

### 1.5 Principle of Least Astonishment (POLA)

Software should behave as users and developers expect. A function called `getUser()` should not have side effects. A button labeled "Save" should not delete data. API responses should follow conventions. Naming should be predictable.

This extends to APIs, CLIs, configuration, error messages — everything a human or system interacts with.

### 1.6 Separation of Concerns (SoC)

Each module, layer, or component should address a distinct concern. This is broader than SRP — it applies at every level: functions, classes, modules, services, and systems. A React component should not contain business logic, HTTP calls, AND styling decisions simultaneously.

### 1.7 Composition Over Inheritance

Favor composing objects from smaller pieces rather than building deep inheritance hierarchies. Inheritance creates tight coupling and rigid structures. Composition (via mixins, higher-order functions, hooks, or delegation) is more flexible and easier to test.

**In React**: This is why hooks and composition patterns replaced HOCs and render props. Prefer `useAuth()` + `usePermissions()` over an `AuthenticatedPermissionedComponent` hierarchy.

### 1.8 Law of Demeter (Principle of Least Knowledge)

A module should only talk to its immediate friends, not to strangers. `user.getAddress().getCity().getName()` violates this — it chains through multiple objects, creating fragile coupling to internal structures. Instead, expose what's needed: `user.getCityName()`.

### 1.9 Encapsulation Beyond OOP

Encapsulation isn't just about `private` fields. It's about hiding complexity behind well-defined boundaries. A module's internals should be invisible to its consumers. This applies to:
- API contracts (don't leak database schemas)
- Component props (don't pass entire state objects)
- Service boundaries (don't expose internal event structures)

### 1.10 Fail Fast

Detect and report errors as early as possible. Validate inputs at boundaries. Use type systems, assertions, and compile-time checks aggressively. A runtime error at the entry point is infinitely better than silent data corruption discovered weeks later.

---

## 2. Architecture & Design

### 2.1 Domain-Driven Design (DDD)

Model software around the business domain, not technical concerns. Key concepts:

- **Ubiquitous Language**: Use the same terms the business uses. If stakeholders say "order," don't call it `PurchaseTransaction` in code.
- **Bounded Contexts**: Different parts of the system may have different meanings for the same term. An "account" in billing is different from an "account" in authentication. Don't force a single model.
- **Aggregates**: Cluster related entities that must be consistent together. An `Order` and its `OrderItems` form an aggregate — you don't modify items without going through the order.
- **Domain Events**: Capture meaningful things that happened (`OrderPlaced`, `PaymentReceived`). These decouple systems and create audit trails naturally.
- **Value Objects**: Immutable objects defined by their attributes, not identity. An `Email("foo@bar.com")` is a value object — two emails with the same address are equal. Use them to encode domain rules (validation, formatting).

### 2.2 Hexagonal Architecture (Ports & Adapters)

Separate your application into three zones:
1. **Core domain**: Pure business logic, no framework dependencies
2. **Ports**: Interfaces that define how the core interacts with the outside world
3. **Adapters**: Implementations that connect ports to real infrastructure (databases, APIs, UI)

**Benefit**: Your business logic becomes framework-agnostic and trivially testable. Swapping a database from PostgreSQL to DynamoDB only changes an adapter.

### 2.3 Event-Driven Architecture (EDA)

Design systems that communicate through events rather than direct calls. Benefits:
- **Temporal decoupling**: Producer and consumer don't need to be available simultaneously
- **Loose coupling**: Producers don't know who consumes their events
- **Scalability**: Consumers can scale independently
- **Audit trail**: Events naturally create a history of what happened

**Patterns**: Event Sourcing (store events as source of truth), CQRS (separate read/write models), Saga (orchestrate distributed transactions).

**Caution**: Event-driven systems are harder to debug, reason about, and test. Use them where the benefits outweigh the complexity.

### 2.4 Architecture Decision Records (ADRs)

Document every significant architectural decision with:
- **Context**: What situation or problem prompted the decision?
- **Decision**: What was decided?
- **Consequences**: What are the trade-offs? What becomes easier? Harder?
- **Status**: Proposed, accepted, deprecated, superseded

Store ADRs in the repository (e.g., `docs/adr/`). They serve as institutional memory — critical when team members change. Without them, teams repeatedly revisit solved problems or can't understand why something was built a certain way.

### 2.5 Strangler Fig Pattern

When modernizing legacy systems, don't rewrite from scratch. Instead:
1. Build new functionality alongside the old system
2. Gradually redirect traffic from old to new
3. Decommission old components as they become unused

This reduces risk dramatically compared to "big bang" migrations. Each step is small, testable, and reversible.

### 2.6 Bulkhead Pattern

Isolate components so that failure in one doesn't cascade to others. Like watertight compartments in a ship. Examples:
- Separate thread pools for different operations
- Independent microservices with their own databases
- Circuit breakers between service calls

### 2.7 Sidecar and Ambassador Patterns

- **Sidecar**: Deploy helper functionality alongside your main service (e.g., logging agents, service mesh proxies). The sidecar shares the lifecycle of the main service but is independently deployable.
- **Ambassador**: A proxy that handles cross-cutting concerns (retries, circuit breaking, monitoring) so your service code stays clean.

### 2.8 Backend for Frontend (BFF)

Create dedicated backend services for each frontend type (web, mobile, IoT). Instead of a generic API that serves all clients poorly, BFFs are tailored to each client's needs — optimizing payload size, data shape, and API granularity.

### 2.9 Evolutionary Architecture

Design systems that support guided, incremental change across multiple dimensions. Use **fitness functions** — automated checks that verify architecture characteristics (performance budgets, dependency rules, security policies). Architecture isn't defined once upfront; it evolves with the system.

### 2.10 Cell-Based Architecture

Partition a system into isolated, self-contained "cells" — each with its own compute, storage, and networking. Failures in one cell don't affect others. Used by AWS, Azure, and other hyperscalers to achieve extreme fault isolation. A step beyond microservices — it isolates at the infrastructure level.

---

## 3. Code Quality & Craftsmanship

### 3.1 Clean Code (Beyond the Basics)

- **Meaningful names**: `elapsedTimeInDays` not `d`. Names should reveal *intent*, not implementation.
- **Small functions**: If a function needs a comment explaining what it does, it's too big. Extract and name.
- **No boolean parameters**: `render(true, false)` is unreadable. Use enums, objects, or separate functions.
- **Guard clauses over nested ifs**: Return early to avoid deep nesting. Flat code is readable code.
- **Avoid primitive obsession**: Use domain types instead of raw strings/numbers. `type Email = string & { __brand: "Email" }` prevents passing a name where an email is expected.

### 3.2 Immutability by Default

Prefer immutable data structures and operations. Mutation is the primary source of bugs in concurrent and asynchronous code. In JavaScript/TypeScript:
- Use `const` over `let`
- Use `Object.freeze()`, `as const`, or libraries like Immer
- Prefer `map/filter/reduce` over `forEach` with mutation
- Use `readonly` in TypeScript interfaces

**Immutability makes code predictable**: if data can't change, you eliminate an entire class of bugs.

### 3.3 Functional Core, Imperative Shell

Structure your code so that pure business logic (functional core) is separate from side effects (imperative shell). The core is:
- Easy to test (no mocks needed)
- Easy to reason about (no hidden state)
- Easy to reuse

The shell handles I/O, database calls, HTTP requests, and connects them to the core. This gives you the benefits of functional programming without going fully functional.

### 3.4 Code Reviews as Knowledge Transfer

Code reviews aren't just for catching bugs. They:
- Spread knowledge across the team
- Establish shared coding standards
- Mentor junior developers
- Document *why* decisions were made (in comments)

**Best practices**:
- Review for correctness, readability, maintainability — in that order
- Keep PRs small (< 400 lines of meaningful changes)
- Automate what can be automated (formatting, linting, type-checking)
- Focus human review on logic, design, and naming
- Use conventional comments (e.g., `nit:`, `question:`, `suggestion:`, `blocker:`)

### 3.5 Technical Debt Management

All code is debt — but some is intentional and some is accidental. Manage it:
- **Document** debt explicitly (TODOs with ticket numbers, ADRs for known trade-offs)
- **Quantify** it — estimate the cost of keeping it vs. fixing it
- **Budget** time for it — dedicate a percentage of each sprint to paying down debt
- **Track** it — use tools like SonarQube or CodeClimate to measure trends

**Debt quadrant** (Martin Fowler):
- Reckless & deliberate: "We don't have time for design"
- Prudent & deliberate: "We know this is a compromise, but we'll fix it in Q2"
- Reckless & inadvertent: "What's layering?"
- Prudent & inadvertent: "Now we know how we should have done it"

### 3.6 Refactoring as a Discipline

Refactoring is not rewriting. It's *behavior-preserving transformation* of code structure. Rules:
- **Never refactor without tests**: Tests are your safety net
- **Small steps**: Each refactoring should be atomic and independently correct
- **Never mix refactoring with feature work**: Separate commits, separate PRs
- **Common refactorings**: Extract Method, Inline Function, Move Field, Replace Conditional with Polymorphism, Introduce Parameter Object

### 3.7 Dead Code Elimination

Remove unused code aggressively. Dead code:
- Confuses developers ("is this used somewhere?")
- Increases cognitive load
- May have security vulnerabilities
- Adds maintenance burden

Trust your version control — you can always retrieve deleted code from history. Comment-out code is even worse than dead code because it implies intent to restore.

### 3.8 Consistent Error Handling Strategy

Choose a strategy and apply it uniformly:
- **Exceptions vs. Result types**: Pick one per language/project. In TypeScript, consider `Result<T, E>` pattern or `neverthrow` library over throwing everywhere.
- **Error boundaries**: Define clear boundaries where errors are caught, logged, and translated.
- **Error categories**: Distinguish between recoverable errors (retry), business errors (show to user), and system errors (alert on-call).
- **Error messages**: Include context (what was being done), cause (why it failed), and guidance (what to do about it).

### 3.9 Configuration as Code

- Externalize all environment-specific values
- Use environment variables for secrets, config files for everything else
- Validate configuration at startup (fail fast)
- Use typed configuration objects, not raw `process.env` access scattered everywhere
- Support sensible defaults with explicit overrides

### 3.10 Monorepo vs. Polyrepo (Informed Choice)

- **Monorepo**: Single repository for all projects. Benefits include atomic changes across packages, shared tooling, and easier dependency management. Requires investment in build tools (Nx, Turborepo, Bazel).
- **Polyrepo**: Separate repositories per project. Benefits include clear ownership, independent deployability, and simpler CI per repo. Suffers from dependency hell and cross-repo changes.

Choose based on team size, coupling between projects, and tooling maturity — not hype.

---

## 4. Testing Strategies

### 4.1 The Testing Trophy (Kent C. Dodds)

Beyond the traditional testing pyramid:
- **Static analysis** (base): TypeScript, ESLint, type checking
- **Unit tests**: Small, focused, test pure functions
- **Integration tests** (largest layer): Test how modules work together. This is where most bugs are caught.
- **End-to-end tests** (smallest layer): Test critical user flows in a real browser

**Key insight**: Integration tests give the best ROI. A test that verifies "user can complete checkout" catches more real bugs than 50 unit tests of individual functions.

### 4.2 Shift-Left Testing

Move testing earlier in the development lifecycle:
- **Design time**: Threat modeling, test case design
- **Code time**: TDD, static analysis, type systems
- **PR time**: Automated test suites, mutation testing
- **Pre-deploy**: Smoke tests, contract tests

The earlier you find a bug, the cheaper it is to fix. A bug found in design costs 1x; in production, 100x.

### 4.3 Contract Testing

Verify that service interfaces (APIs, messages) conform to agreed-upon contracts. Tools like Pact or SchemaRegistry ensure that:
- Provider changes don't break consumers
- Consumer expectations are documented and verified
- Teams can deploy independently with confidence

Essential in microservices architectures where integration testing is impractical.

### 4.4 Mutation Testing

Automatically inject bugs (mutations) into your code and verify that tests catch them. If a mutant survives (tests pass despite the bug), your tests are insufficient. Tools: Stryker (JavaScript), PIT (Java), mutmut (Python).

**Mutation testing measures test quality**, not just coverage. 100% code coverage with 50% mutation score means your tests barely assert anything.

### 4.5 Property-Based Testing

Instead of hand-writing test cases, define properties that should hold for *all* valid inputs, and let the framework generate cases. Examples:
- "Sorting a list and sorting it again should produce the same result"
- "Serializing then deserializing any object should return the original"
- "For any valid email, the validation function returns true"

Tools: fast-check (TypeScript), Hypothesis (Python), QuickCheck (Haskell).

**Benefit**: Discovers edge cases you'd never think of. Finds bugs in boundaries, empty inputs, special characters, large numbers.

### 4.6 Snapshot Testing (With Caution)

Captures the output of a component or function and compares it against a stored snapshot. Useful for detecting unintended changes, but:
- **Bad**: Blind approval of snapshot updates
- **Bad**: Large, unreadable snapshots
- **Good**: Small, focused snapshots of specific outputs
- **Good**: Inline snapshots for critical outputs

### 4.7 Chaos Engineering

Deliberately inject failures into production systems to verify resilience:
- Kill random service instances
- Introduce network latency
- Fill disk space
- Corrupt messages

**Principles**: Start small, build hypotheses, measure blast radius, run in production (with safeguards). Tools: Chaos Monkey, Gremlin, LitmusChaos.

### 4.8 Load Testing & Stress Testing

- **Load testing**: Verify the system handles expected traffic (e.g., 1000 concurrent users)
- **Stress testing**: Find the breaking point (e.g., increase load until failures occur)
- **Soak testing**: Run at sustained load for hours/days to find memory leaks, connection exhaustion

Tools: k6, Artillery, Gatling, Locust. Run these in CI, not just before launches.

### 4.9 Test Data Management

- Use factories or builders (e.g., `createUser({ name: "Alice" })`) instead of hardcoded fixtures
- Generate realistic data with libraries like Faker
- Isolate test data — each test should create its own data and clean up
- Never share mutable state between tests
- Use database transactions that roll back after each test

### 4.10 Flaky Test Zero Tolerance

Flaky tests (tests that sometimes pass, sometimes fail) erode trust in the entire test suite. When a test becomes flaky:
1. Quarantine it immediately (move to a separate suite)
2. Fix it within a sprint — don't let it linger
3. Root-cause it — usually: shared state, timing issues, or external dependencies

A flaky test suite that everyone ignores is worse than no tests at all.

---

## 5. DevOps & Delivery

### 5.1 Continuous Integration (CI) — Done Right

CI is not just "having a CI server." It means:
- Developers merge to trunk **at least once per day**
- Every merge triggers an automated build and test
- Broken builds are fixed within **minutes**, not hours
- The build is fast (< 10 minutes ideally)

If your CI takes 45 minutes and you merge weekly, you don't have CI — you have a slow batch process.

### 5.2 Continuous Delivery vs. Continuous Deployment

- **Continuous Delivery**: Every commit *could* be deployed to production. Deployment is a business decision.
- **Continuous Deployment**: Every commit *is* deployed to production automatically.

Both require: comprehensive automated testing, feature flags, monitoring, and fast rollback capability.

### 5.3 Trunk-Based Development

All developers work on a single branch (trunk/main). Short-lived feature branches (< 1 day) are acceptable. Benefits:
- Eliminates merge hell
- Forces small, incremental changes
- Enables true CI
- Reduces "works on my branch" syndrome

**Requires**: Feature flags, comprehensive tests, and team discipline. Not compatible with long-lived feature branches or GitFlow (except for very specific release-heavy scenarios).

### 5.4 Feature Flags (Feature Toggles)

Decouple deployment from release. Deploy code to production behind a flag, then enable it gradually:
- **Release toggles**: Enable features for specific users or percentages
- **Experiment toggles**: A/B testing
- **Ops toggles**: Kill switches for problematic features
- **Permission toggles**: Features for specific user tiers

**Critical rule**: Feature flags are temporary. Remove them after the feature is fully released. Stale flags become dangerous technical debt.

### 5.5 Infrastructure as Code (IaC)

Define ALL infrastructure in version-controlled code:
- Servers, networks, databases: Terraform, Pulumi, AWS CDK
- Configuration: Ansible, Chef
- Containers: Dockerfiles, docker-compose
- Orchestration: Kubernetes manifests, Helm charts

**Benefits**: Reproducible environments, peer-reviewed infrastructure changes, disaster recovery, and drift detection.

### 5.6 GitOps

Use Git as the single source of truth for infrastructure and application state. Changes are made via pull requests, and an operator (like ArgoCD or Flux) synchronizes the desired state from Git to the actual infrastructure.

**Benefits**: Audit trail, easy rollbacks (git revert), declarative infrastructure, and familiar workflow for developers.

### 5.7 Canary Deployments & Blue-Green Deployments

- **Canary**: Route a small percentage of traffic to the new version. Monitor for errors. Gradually increase traffic if healthy.
- **Blue-Green**: Run two identical environments. Deploy to the idle one, then switch traffic. Instant rollback by switching back.

Both reduce deployment risk dramatically compared to "deploy and pray."

### 5.8 Immutable Infrastructure

Never modify running servers. Instead:
1. Build a new image/container with the changes
2. Deploy the new image
3. Destroy the old one

**Benefits**: No configuration drift, reproducible deployments, and simpler debugging ("it works in the image" is more reliable than "it works on that one server").

### 5.9 Pipeline as Code

Define your CI/CD pipeline in code (Jenkinsfile, GitHub Actions YAML, etc.), stored in the repository alongside the application code. The pipeline is:
- Version-controlled
- Code-reviewed
- Tested (yes, test your pipelines)
- Reproducible

### 5.10 Dependency Management

- **Pin versions**: Use lockfiles (`package-lock.json`, `poetry.lock`)
- **Update regularly**: Automated tools (Dependabot, Renovate) create PRs for updates
- **Audit dependencies**: Check for known vulnerabilities (`npm audit`, Snyk)
- **Minimize dependencies**: Each dependency is a liability — evaluate the cost/benefit
- **Vendor critical dependencies**: If a library is critical and unmaintained, fork it

---

## 6. Observability & Reliability

### 6.1 The Three Pillars of Observability

- **Logs**: Structured, contextual records of events. Use structured logging (JSON) with correlation IDs. Log at appropriate levels (DEBUG, INFO, WARN, ERROR).
- **Metrics**: Numerical measurements over time. Request rate, error rate, duration (RED). Saturation, utilization, errors (USE). Custom business metrics (orders/minute, signups/day).
- **Traces**: End-to-end request paths through distributed systems. Show which services were called, how long each took, and where failures occurred. Use OpenTelemetry for instrumentation.

**Key insight**: Logs tell you *what* happened. Metrics tell you *how much*. Traces tell you *where*.

### 6.2 SLOs, SLIs, and Error Budgets

- **SLI (Service Level Indicator)**: A metric that measures service quality (e.g., 99.5% of requests complete in < 200ms)
- **SLO (Service Level Objective)**: A target value for an SLI (e.g., "we aim for 99.9% availability per month")
- **Error Budget**: The amount of unreliability you're allowed (e.g., 0.1% = ~43 minutes of downtime/month)

When the error budget is exhausted, freeze feature work and focus on reliability. This creates a data-driven conversation between business velocity and operational stability.

### 6.3 Alerting Philosophy

- **Alert on symptoms, not causes**: Alert on "users are seeing errors," not "CPU is high"
- **Every alert must be actionable**: If the on-call engineer can't do anything about it, it's not an alert — it's noise
- **Avoid alert fatigue**: Too many alerts = all alerts get ignored
- **Use severity levels**: Page for critical issues, ticket for non-urgent ones
- **Runbooks**: Every alert should link to a runbook describing diagnosis and remediation steps

### 6.4 Graceful Degradation

Design systems to provide reduced but functional service when components fail:
- Show cached data when the API is down
- Disable non-critical features under load
- Serve static content when dynamic generation fails
- Queue requests instead of rejecting them

**The user should never see a blank page or a cryptic error.**

### 6.5 Circuit Breaker Pattern

When a downstream service is failing, stop sending requests to it:
1. **Closed**: Requests flow normally
2. **Open**: Requests immediately fail (fast failure)
3. **Half-open**: Periodically test if the service has recovered

This prevents cascading failures and gives the failing service time to recover.

### 6.6 Retry with Exponential Backoff and Jitter

When retrying failed operations:
- Increase wait time exponentially (1s, 2s, 4s, 8s...)
- Add random jitter to avoid thundering herd
- Set a maximum number of retries
- Make operations idempotent (safe to retry)

**Never retry without backoff** — you'll DDoS your own service.

### 6.7 Health Checks & Readiness Probes

Expose endpoints that report service health:
- **Liveness**: "Am I running?" (if no, restart me)
- **Readiness**: "Can I handle traffic?" (if no, remove me from load balancer)
- **Startup**: "Am I initialized?" (give me time before checking liveness)

Include dependency checks (database, cache, downstream services) in readiness, not liveness.

### 6.8 Post-Incident Reviews (Blameless Postmortems)

After every significant incident:
1. **Timeline**: What happened, when, and what was done
2. **Root cause**: Use "5 Whys" or fault tree analysis
3. **Contributing factors**: What made the incident worse
4. **Action items**: Concrete, assigned, time-bound improvements
5. **Blameless**: Focus on systems and processes, not individuals

**Share postmortems broadly** — they're learning opportunities for the entire organization.

### 6.9 Capacity Planning

- Monitor growth trends (users, requests, data volume)
- Load test regularly to know current limits
- Plan for 3-6 months ahead
- Automate scaling where possible (auto-scaling groups, serverless)
- Account for traffic spikes (Black Friday, viral events)

### 6.10 Disaster Recovery (DR)

- **RTO (Recovery Time Objective)**: How quickly must you recover?
- **RPO (Recovery Point Objective)**: How much data can you afford to lose?
- **Test your DR plan regularly**: An untested plan is not a plan
- **Backup validation**: Restore from backups periodically to verify they work
- **Multi-region**: For critical systems, deploy across regions

---

## 7. Security

### 7.1 Shift-Left Security (DevSecOps)

Integrate security into every phase of development:
- **Design**: Threat modeling (STRIDE, DREAD)
- **Code**: Static analysis (SAST), dependency scanning
- **Build**: Container image scanning, SBOM generation
- **Test**: Dynamic analysis (DAST), penetration testing
- **Deploy**: Runtime protection, secrets management
- **Operate**: Monitoring, incident response

### 7.2 Principle of Least Privilege

Every user, service, and process should have the minimum permissions needed to do its job. No more.
- Use role-based access control (RBAC)
- Use short-lived credentials (tokens with expiration)
- Audit permissions regularly
- Separate read and write permissions

### 7.3 Defense in Depth

Never rely on a single security control. Layer defenses:
- Network: Firewalls, VPNs, network segmentation
- Application: Input validation, authentication, authorization
- Data: Encryption at rest and in transit
- Monitoring: Intrusion detection, anomaly detection

### 7.4 Secrets Management

- **Never commit secrets** to version control (use `.gitignore`, pre-commit hooks)
- Use a secrets manager (HashiCorp Vault, AWS Secrets Manager, 1Password)
- Rotate secrets regularly
- Use environment-specific secrets (not shared across dev/staging/prod)
- Audit secret access

### 7.5 Input Validation & Output Encoding

- **Validate all input** at system boundaries (not just forms — APIs, file uploads, headers, query params)
- **Use allowlists**, not blocklists ("these characters are allowed" vs. "these are blocked")
- **Encode output** for the context (HTML encoding, SQL parameterization, JSON encoding)
- **Use schema validation** (Zod, Joi, JSON Schema) for structured input
- **Never trust the client** — validate on the server, always

### 7.6 Zero Trust Architecture

Don't trust anything inside or outside the network perimeter:
- Verify every request (authenticate and authorize)
- Encrypt all traffic (even internal)
- Assume breach and minimize blast radius
- Continuously validate trust (not just at login)

### 7.7 Supply Chain Security

Your software is only as secure as its weakest dependency:
- Use lockfiles and pin dependencies
- Verify package integrity (checksums, signatures)
- Monitor for compromised packages
- Generate and publish SBOMs (Software Bill of Materials)
- Use private registries for internal packages
- Review new dependencies before adding them

---

## 8. Data Management

### 8.1 Database Migrations as Code

- Version-control all schema changes
- Use migration tools (Prisma Migrate, Flyway, Liquibase, Alembic)
- Migrations must be idempotent and reversible
- Test migrations against production-like data volumes
- Never modify a deployed migration — create a new one

### 8.2 Data Integrity at Every Layer

- **Database**: Constraints, foreign keys, unique indexes, check constraints
- **Application**: Validation before writes, idempotent operations
- **API**: Schema validation, request/response contracts
- **UI**: Client-side validation (for UX, not security)

If the database allows invalid data, someone will eventually insert it.

### 8.3 Event Sourcing (When Appropriate)

Store state changes as a sequence of events, not just the current state:
- Complete audit trail for free
- Temporal queries ("what was the state on Tuesday?")
- Replay and rebuild state
- Natural fit for event-driven architectures

**Caution**: Adds significant complexity. Only use when audit trails, temporal queries, or event replay are genuine requirements.

### 8.4 CQRS — Command Query Responsibility Segregation

Separate read and write models:
- **Commands**: Modify state (write-optimized)
- **Queries**: Read state (read-optimized)

Benefits: Independent scaling, optimized data models for each use case, simplified logic. Essential when read and write patterns differ dramatically (e.g., 100:1 read/write ratio).

### 8.5 Data Privacy by Design

- Collect only necessary data (data minimization)
- Anonymize/pseudonymize where possible
- Implement data retention policies (auto-delete after N days)
- Support data export and deletion (GDPR, CCPA compliance)
- Encrypt PII at rest with field-level encryption
- Log access to sensitive data

### 8.6 Idempotency

Design operations so that performing them multiple times has the same effect as performing them once. Critical for:
- Payment processing: Don't charge twice
- API endpoints: Use idempotency keys
- Message consumers: Handle duplicate delivery
- Database writes: Use upserts or conditional writes

**Implementation**: Idempotency keys, database constraints, conditional updates, deduplication.

---

## 9. Team & Process

### 9.1 Psychological Safety

Teams perform best when members feel safe to take risks, ask questions, and admit mistakes without fear of punishment. This is the #1 predictor of team effectiveness (Google's Project Aristotle).

- Treat mistakes as learning opportunities
- Encourage dissent and alternative viewpoints
- Celebrate "I don't know" as an honest answer
- Lead by example — leaders admit their own mistakes

### 9.2 Documentation as a Product

Treat documentation with the same rigor as code:
- **Keep it near the code**: READMEs, inline docs, ADRs in the repo
- **Automate what you can**: Generate API docs from code, sync diagrams from models
- **Review and update**: Documentation that's wrong is worse than no documentation
- **Write for your audience**: README for newcomers, API docs for integrators, runbooks for operators
- **Use templates**: Consistent structure reduces cognitive load

### 9.3 Onboarding as a First-Class Concern

A new developer should be productive within days, not weeks:
- Automated local setup (one command to get running)
- Onboarding guide with "first task" walkthrough
- Pair programming in the first week
- Architecture overview document
- Video or recorded demos of key systems

**Measure onboarding**: Time from "first day" to "first PR merged" is a useful metric.

### 9.4 Inner Source

Apply open-source practices inside the organization:
- Anyone can contribute to any repository
- Contributions via pull requests with code review
- Discoverable documentation and contribution guides
- Shared tooling and libraries
- Community of practice around key technologies

### 9.5 Mob Programming & Ensemble Programming

The entire team works on the same thing at the same time:
- **Driver**: Types the code
- **Navigator(s)**: Direct the driver
- **Rotate**: Every 10-15 minutes

**Benefits**: Instant code review, knowledge transfer, better design decisions, no "bus factor" issues. Counter-intuitive insight: it's often *faster* than individual work because handoffs and context switches are eliminated.

### 9.6 Blameless Culture

When something goes wrong:
- Ask "what went wrong?" not "who messed up?"
- Fix the system, not the person
- Publish postmortems that focus on process improvements
- Encourage reporting near-misses

### 9.7 Technical Radar

Maintain a team/organization "tech radar" that classifies technologies:
- **Adopt**: Use freely, proven in production
- **Trial**: Worth trying on non-critical projects
- **Assess**: Worth exploring, research phase
- **Hold**: Don't start new projects with these

Inspired by ThoughtWorks Tech Radar. Helps teams make informed technology choices.

### 9.8 Engineering Metrics That Matter (DORA)

The four DORA metrics predict software delivery performance:
1. **Deployment Frequency**: How often do you deploy to production?
2. **Lead Time for Changes**: Time from commit to production
3. **Mean Time to Recovery (MTTR)**: How quickly do you recover from failures?
4. **Change Failure Rate**: What percentage of deployments cause issues?

Elite teams: deploy on-demand, lead time < 1 hour, MTTR < 1 hour, change failure rate < 5%.

### 9.9 Work in Progress (WIP) Limits

Limit the number of tasks any person or team works on simultaneously. Context switching is expensive — each additional concurrent task reduces productive time by ~20%.

**Rules**:
- WIP limit per person: 1-2 tasks
- WIP limit per team: # of developers - 1
- "Stop starting, start finishing"
- Blocked items count toward WIP

### 9.10 Retrospectives That Actually Improve Things

- Hold them regularly (every sprint/iteration)
- Focus on 1-2 actionable improvements, not a laundry list
- Track action items and follow up
- Vary the format to keep engagement
- Include successes, not just problems
- Make improvements measurable

---

## 10. Performance & Scalability

### 10.1 Premature Optimization is the Root of All Evil (But...)

Don't optimize until you have evidence of a problem. **But** — don't write obviously slow code either. Two rules:
1. Write clear, correct code first
2. Measure before optimizing (with profilers, benchmarks, production metrics)

**Know the difference between micro-optimization and algorithmic optimization**. Choosing an O(n²) algorithm over O(n log n) is a design error, not premature optimization.

### 10.2 Caching Strategy

Layered caching for maximum effect:
- **Browser cache**: Static assets with long cache headers
- **CDN**: Geographically distributed caching for global users
- **Application cache**: In-memory caches (Redis, Memcached) for frequently read data
- **Database cache**: Query result caching, materialized views

**Key challenges**:
- Cache invalidation (one of the two hard problems in CS)
- Cache stampede (lock or pre-compute before expiry)
- Stale data (acceptable staleness depends on use case)

### 10.3 Database Performance

- **Index strategically**: Indexes speed reads but slow writes. Create them based on query patterns.
- **N+1 query problem**: Fetch all related data in one query, not one per parent
- **Connection pooling**: Reuse database connections instead of creating new ones per request
- **Read replicas**: Scale reads independently from writes
- **Denormalization**: Deliberately duplicate data to avoid expensive joins (trade storage for speed)
- **Query analysis**: Use EXPLAIN/ANALYZE to understand query plans

### 10.4 Lazy Loading & Code Splitting

- **Lazy loading**: Load resources only when needed (images, components, data)
- **Code splitting**: Break JavaScript bundles into smaller chunks loaded on demand
- **Route-based splitting**: Each page loads only its own code
- **Dynamic imports**: `const Module = lazy(() => import("./Module"))`

**Impact**: Faster initial page load, reduced bandwidth, lower memory usage.

### 10.5 Asynchronous Processing

Don't make users wait for operations that can happen in the background:
- Send emails asynchronously (queue the email, respond immediately)
- Process images/videos in background workers
- Generate reports offline and notify when ready
- Use optimistic updates in the UI (show success immediately, reconcile later)

### 10.6 Horizontal vs. Vertical Scaling

- **Vertical scaling**: Bigger machines (more CPU, RAM). Simple but has limits.
- **Horizontal scaling**: More machines. Requires stateless services and distributed data management.

**Design for horizontal scaling from the start**: stateless services, externalized sessions, distributed caches, load balancers. It's much harder to retrofit later.

### 10.7 Rate Limiting & Throttling

Protect your system from abuse and overload:
- **Rate limiting**: Maximum requests per time window per user/IP
- **Throttling**: Slow down requests instead of rejecting them
- **Quotas**: Usage limits per billing period
- **Backpressure**: Communicate overload to callers so they slow down

Use algorithms like token bucket, sliding window, or leaky bucket.

### 10.8 Edge Computing

Move computation closer to the user:
- CDN edge functions (Cloudflare Workers, Vercel Edge Functions)
- Edge databases (Turso, Neon)
- Edge caching strategies

**Benefits**: Lower latency, reduced origin load, better UX for global users.

### 10.9 Resource Budget

Set explicit budgets for:
- **JavaScript bundle size**: e.g., < 200KB gzipped
- **Page load time**: e.g., < 2s LCP on 3G
- **API response time**: e.g., p99 < 500ms
- **Memory usage**: e.g., < 256MB per container
- **Docker image size**: e.g., < 100MB

**Enforce budgets in CI** — fail the build if a budget is exceeded. Budgets prevent gradual degradation.

### 10.10 Performance Testing as a Habit

- Include performance tests in CI (lightweight benchmarks)
- Track metrics over time (detect regressions before users do)
- Test with realistic data volumes (not 10 records — 10 million)
- Test under concurrent load (not just single-user scenarios)
- Use Real User Monitoring (RUM) for production performance data

---

## 11. API Design

### 11.1 API-First Design

Design the API before implementing it:
1. Define the contract (OpenAPI, GraphQL schema, protobuf)
2. Review the contract with consumers
3. Mock the API for parallel frontend/backend development
4. Implement the API to match the contract
5. Validate the implementation against the contract (contract testing)

### 11.2 RESTful API Best Practices

- Use nouns for resources (`/users`, not `/getUsers`)
- Use HTTP methods semantically (GET reads, POST creates, PUT replaces, PATCH updates, DELETE deletes)
- Use proper status codes (201 Created, 404 Not Found, 409 Conflict, 422 Unprocessable Entity)
- Version your API (`/v1/users` or `Accept: application/vnd.api.v1+json`)
- Support pagination, filtering, sorting via query parameters
- Use HATEOAS for discoverability (links in responses)
- Return consistent error formats

### 11.3 GraphQL Considerations

- **Good for**: Complex, nested data with varied client needs
- **Challenges**: N+1 query problem (use DataLoader), authorization per field, caching complexity
- **Best practice**: Use persisted queries in production, set query depth limits, implement field-level authorization

### 11.4 API Versioning Strategy

- **URL versioning** (`/v1/`): Simple, visible, but clutters URLs
- **Header versioning** (`Accept: application/vnd.app.v2+json`): Cleaner URLs, more complex clients
- **Query param** (`?version=2`): Simple but easily ignored

**Best approach**: Avoid breaking changes. Use additive changes (add fields, don't remove them). When breaking changes are unavoidable, support old versions for a deprecation period.

### 11.5 Idempotency in APIs

Every non-GET endpoint should support idempotency:
- Use `Idempotency-Key` headers for POST requests
- PUT and DELETE are naturally idempotent
- Return the same response for repeated requests with the same key
- Store idempotency keys for ~24h

### 11.6 Rate Limiting Communication

Communicate rate limits clearly:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: When the window resets
- Return `429 Too Many Requests` with `Retry-After` header

### 11.7 API Documentation

- Auto-generate from code/schemas where possible
- Include working examples for every endpoint
- Show error responses, not just success cases
- Provide SDKs or client libraries for popular languages
- Use interactive documentation (Swagger UI, GraphQL Playground)
- Keep a changelog of API changes

---

## 12. Frontend-Specific Practices

### 12.1 Component Design Principles

- **Single responsibility**: One component, one job
- **Composition**: Build complex UIs from simple, reusable pieces
- **Props as API**: Design props as you would a public API — minimal, well-named, well-typed
- **Controlled vs. Uncontrolled**: Be explicit about who owns state
- **Render props / Hooks / Slots**: Use composition patterns appropriate to your framework

### 12.2 State Management Strategy

Choose the right tool for each type of state:
- **Local state** (useState): UI state that doesn't leave the component
- **Shared state** (Context, Zustand, Jotai): State shared across components
- **Server state** (React Query, SWR): Data from the server with caching, revalidation
- **URL state** (query params, route params): State that should be shareable via URL
- **Form state** (React Hook Form, Formik): Complex form interactions

**Anti-pattern**: Putting everything in global state. Most state is local.

### 12.3 Accessibility (a11y) as a Requirement

Accessibility is not optional — it's a legal requirement in many jurisdictions and a moral obligation:
- Semantic HTML first (`<button>`, not `<div onClick>`)
- Keyboard navigation (focus management, tab order)
- Screen reader support (ARIA labels, live regions)
- Color contrast (WCAG AA minimum: 4.5:1)
- Reduced motion support (`prefers-reduced-motion`)
- Test with real assistive technologies

### 12.4 Responsive Design (Mobile-First)

- Design for the smallest screen first, then enhance
- Use relative units (rem, em, %, viewport units)
- Use CSS Grid and Flexbox for layouts
- Use `<picture>` and `srcset` for responsive images
- Test on real devices, not just browser DevTools
- Consider touch targets (minimum 44x44px)

### 12.5 Web Vitals & Core Web Vitals

Google's metrics for user experience:
- **LCP (Largest Contentful Paint)**: < 2.5s — how fast does the main content load?
- **INP (Interaction to Next Paint)**: < 200ms — how responsive is the page?
- **CLS (Cumulative Layout Shift)**: < 0.1 — does the layout jump around?

Monitor these in production (Google Analytics, web-vitals library) and set budgets.

### 12.6 Error Boundaries & Graceful UI Failures

- Wrap component trees in error boundaries
- Show fallback UI instead of white screens
- Log errors to a monitoring service
- Allow users to retry or navigate away
- Handle loading, error, and empty states explicitly

### 12.7 Internationalization (i18n) from Day One

Adding i18n later is 10x more expensive than building it in from the start:
- Extract all strings from the first commit
- Handle pluralization rules (they differ wildly across languages)
- Support RTL languages (even if you don't need it yet — the layout changes are expensive to retrofit)
- Use ICU MessageFormat for complex formatting
- Handle dates, numbers, and currencies with `Intl` APIs

### 12.8 Design System & Component Library

For any project beyond a few screens:
- Build a shared design system (tokens, components, patterns)
- Document with Storybook or similar
- Test components in isolation
- Version and distribute as a package
- Enforce consistency through linting rules

---

## 13. Cognitive & Human Factors

### 13.1 Cognitive Load Theory in Code

Developers have limited working memory (~4 chunks). Minimize cognitive load:
- **Intrinsic load**: The inherent complexity of the problem. Can't reduce this.
- **Extraneous load**: Unnecessary complexity from bad code structure. Eliminate this.
- **Germane load**: Effort spent learning and creating mental models. Support this.

**Practical implications**: Short functions, consistent patterns, clear naming, logical file organization, and minimal indirection.

### 13.2 Conway's Law (and the Reverse Conway Maneuver)

"Organizations produce systems that mirror their communication structures." If you have 4 teams, you'll get 4 services. This is inevitable — so use it intentionally:

**Reverse Conway Maneuver**: Design your teams to match the architecture you want, not the other way around. If you want microservices, organize team boundaries around service boundaries.

### 13.3 The Bus Factor

"How many people need to be hit by a bus for the project to fail?" If the answer is 1, you have a critical risk. Mitigate with:
- Pair and mob programming
- Code reviews across the team
- Rotation of responsibilities
- Documentation of tribal knowledge
- Cross-training and shadowing

### 13.4 Decision Fatigue

Reduce unnecessary decisions:
- Use opinionated tools with sensible defaults (Prettier, ESLint presets)
- Adopt conventions over configuration
- Make decisions once and document them (ADRs)
- Automate repetitive choices (auto-formatting, auto-imports)

Every decision a developer makes consumes mental energy. Reserve it for the decisions that matter.

### 13.5 Second-Order Thinking

Don't just consider the immediate effect of a decision — consider the downstream effects:
- "If we add this feature, what will users do next?"
- "If we choose this technology, what will hiring look like in 2 years?"
- "If we skip this test, what happens when someone refactors this code?"
- "If we hard-code this value, what happens when the business rules change?"

### 13.6 Chesterton's Fence

Before removing something that seems unnecessary, understand why it was put there:
- "This validation seems redundant" → Maybe it catches a bug you haven't seen yet
- "Why do we have this timeout?" → Maybe it prevents a cascade failure under load
- "This code is overcomplicated" → Maybe it handles an edge case you don't know about

**Don't remove things you don't understand.** First understand, then decide.

### 13.7 Goodhart's Law

"When a measure becomes a target, it ceases to be a good measure." Examples:
- Targeting code coverage → developers write tests that increase coverage without verifying behavior
- Targeting story points → teams inflate estimates
- Targeting lines of code → verbose, low-quality code

**Use metrics as signals, not targets.** Combine multiple metrics and interpret them holistically.

### 13.8 The Lindy Effect

Technologies that have survived for a long time will likely continue to survive. PostgreSQL (35+ years), SQL, HTTP, UNIX tools — these are safer bets than the latest framework. When choosing technology:
- Established technologies have proven track records, extensive documentation, and large communities
- New technologies are exciting but may not last
- Balance innovation with stability

### 13.9 Reversibility of Decisions

Classify decisions as:
- **Type 1 (irreversible)**: Database schema choices, public API contracts, data deletion. Take your time.
- **Type 2 (reversible)**: UI frameworks, internal tools, naming conventions. Decide quickly, adjust later.

Amazon calls these "one-way doors" and "two-way doors." Most decisions are Type 2, but teams treat them as Type 1, causing analysis paralysis.

### 13.10 Hammock-Driven Development (Rich Hickey)

Before diving into code, spend time *thinking*:
1. State the problem clearly
2. Understand the problem deeply (edge cases, constraints)
3. Think about multiple solutions
4. Sleep on it (literally — let your subconscious process)
5. Then code

The most productive thing you can do is sometimes stepping away from the keyboard. Complex problems need deep thought, not more code.

---

## Summary

These practices are not rules to follow blindly — they are tools in your toolbox. Apply them judiciously based on:
- **Context**: Team size, project phase, domain complexity
- **Trade-offs**: Every practice has costs. Evaluate cost vs. benefit.
- **Evolution**: Revisit decisions as circumstances change

The best practice is always: **think critically, measure outcomes, and adapt continuously.**

---

*This document is a living reference. Update it as new practices emerge and existing ones evolve.*
