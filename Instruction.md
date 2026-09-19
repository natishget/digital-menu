# MASTER IMPLEMENTATION PROMPT

## Cloud-Based QR Digital Menu & Kitchen Order Ticketing (KOT) System

You are the primary senior software architect and implementation engineer for this project.

You are working inside an existing workspace containing:

```text
/workspace
├── frontend/     # Next.js application
└── backend/      # NestJS application
```

The project is currently in its **initial development stage**.

The NestJS backend has already been connected to the PostgreSQL database, but there are currently no major application libraries or business modules implemented.

The frontend is an initial Next.js application.

The ORM will be:

- Prisma
- PostgreSQL

The frontend state-management solution will be:

- Redux / Redux Toolkit

The backend will be:

- NestJS
- Prisma
- PostgreSQL

The frontend will be:

- Next.js
- React
- Redux Toolkit

The application is a **single-restaurant deployment**. There is NOT a SaaS multi-tenant architecture requirement. Each deployment represents one restaurant/venue.

---

# 1. PRIMARY OBJECTIVE

Implement the complete application described in the attached Functional Requirements Document:

**System Name: Cloud-Based QR Digital Menu & Kitchen Order Ticketing (KOT) System**

The FRD is the primary functional source of truth.

Do not silently remove, simplify, reinterpret, or replace functional requirements from the FRD.

You must implement the requirements while also producing:

- secure architecture
- maintainable code
- simple code
- clear module boundaries
- strong validation
- proper database integrity
- proper authentication and authorization
- production-oriented security
- testable business logic
- responsive UI
- bilingual support
- configurable restaurant settings
- configurable color theme

The application must feel like a professionally engineered production system, not a prototype.

---

# 2. VERY IMPORTANT — INSPECT BEFORE CODING

Before modifying or creating application code:

1. Inspect the complete workspace.
2. Inspect `/frontend`.
3. Inspect `/backend`.
4. Inspect existing `package.json` files.
5. Inspect the existing NestJS configuration.
6. Inspect the existing Next.js configuration.
7. Inspect the existing Prisma/database connection.
8. Inspect environment files.
9. Inspect TypeScript configuration.
10. Inspect existing folder structures.
11. Determine what is already configured.
12. Do NOT unnecessarily replace existing configuration.
13. Do NOT delete working code.
14. Do NOT introduce duplicate configuration.
15. Do NOT install libraries that are unnecessary.
16. Do NOT make architectural assumptions without inspecting the codebase.

First understand the current project.

Then create an implementation plan.

Only after that begin implementation.

---

# 3. DEVELOPMENT PRINCIPLES

Follow these principles throughout the entire implementation:

## Code quality

Write:

- simple code
- readable code
- strongly typed code
- maintainable code
- modular code
- reusable code
- testable code

Avoid:

- unnecessary abstraction
- over-engineering
- giant files
- giant components
- duplicated logic
- magic numbers
- unexplained constants
- deeply nested logic
- unnecessary design patterns
- unnecessary dependencies

Prefer straightforward solutions.

The code should be understandable by another senior developer who joins the project later.

---

# 4. SECURITY IS THE HIGHEST PRIORITY

Security is one of the most important requirements of this application.

Treat all client input as untrusted.

Never trust:

- frontend validation
- frontend permissions
- URL parameters
- QR parameters
- cookies
- local storage
- Redux state
- request bodies
- query parameters
- uploaded files
- payment references
- client-provided prices
- client-provided totals
- client-provided order status

The backend must independently validate and authorize every sensitive operation.

---

# 5. AUTHENTICATION

Use:

- username + password
- JWT access token
- JWT refresh token

Implement a secure authentication architecture.

Requirements:

- Passwords must NEVER be stored in plaintext.
- Use a strong password hashing algorithm.
- Access tokens must have a short expiration period.
- Refresh tokens must have a longer expiration period.
- Refresh tokens must be securely handled.
- Implement refresh-token rotation where appropriate.
- Support token revocation/logout.
- Never expose password hashes through APIs.
- Never return secrets from APIs.
- Never place sensitive secrets in frontend code.
- Secrets must come from environment variables.
- Never hard-code JWT secrets.
- Never hard-code database credentials.
- Never hard-code payment credentials.

Implement authentication as a dedicated NestJS module.

---

# 6. AUTHORIZATION / RBAC

The deployment represents one restaurant.

Do NOT assume a multi-tenant SaaS architecture.

Analyze the FRD and determine the minimum sensible set of system roles required by the actual workflows.

The system must support proper Role-Based Access Control.

At minimum, consider the responsibilities implied by:

- administration
- restaurant management
- cashier/payment operations
- waiter operations
- kitchen operations
- barista operations

However, YOU must determine the final role structure based on the FRD and avoid creating unnecessary roles.

Permissions must be enforced on the backend.

Frontend hiding of buttons is NOT security.

A user must not be able to call an unauthorized API directly.

Use NestJS guards/decorators or an equally clean authorization mechanism.

---

# 7. DATABASE ARCHITECTURE

Use PostgreSQL with Prisma.

Design the schema from the FRD.

Before implementation:

1. Identify all required entities.
2. Identify relationships.
3. Identify enums.
4. Identify indexes.
5. Identify unique constraints.
6. Identify foreign-key relationships.
7. Identify audit-sensitive records.
8. Identify fields that require timestamps.
9. Identify fields requiring soft deletion, if appropriate.
10. Identify fields requiring immutable historical values.

Do not create an unnecessarily complicated schema.

The database must preserve historical order/payment information correctly.

IMPORTANT:

Order history must NOT depend on the current menu price.

When an order is created, preserve the relevant historical values such as:

- item name
- item price
- modifier name
- modifier price
- quantity
- calculated subtotal
- applicable totals

Changing the menu later must not modify historical orders.

---

# 8. PRISMA

Use Prisma as the only ORM/data-access layer unless the existing project has a legitimate reason otherwise.

Keep database access inside appropriate NestJS services/repositories.

Do not place raw database queries throughout controllers.

If raw SQL is genuinely necessary:

- explain why
- parameterize it
- ensure it cannot introduce SQL injection

Use Prisma transactions for operations that must be atomic.

Especially consider transactions for:

- order creation
- payment confirmation
- KOT creation
- order status transitions
- table settlement
- session invalidation
- payment/order state changes

---

# 9. SERVICE MODEL

Implement the FRD service model:

```text
SELF_SERVED
WAITER_ASSISTED
```

The restaurant must be able to change this through configuration without changing code.

Also support the FRD's table-level override.

For example:

Restaurant:

```text
WAITER_ASSISTED
```

Table:

```text
SELF_SERVED
```

The effective service model must be determined safely by the backend.

Do not trust a service-model value supplied by the frontend.

---

# 10. MENU SYSTEM

Implement:

- categories
- menu items
- prices
- descriptions
- availability
- fasting-friendly flag
- fulfillment station
- variations/modifiers
- modifier groups
- single-selection modifiers
- multi-selection modifiers
- min/max selection limits
- price adjustments

Fulfillment stations:

```text
BARISTA
KITCHEN
```

Do not allow customers to manipulate the fulfillment station.

The backend determines it from the menu configuration.

---

# 11. BILINGUAL SUPPORT

The application supports:

```text
English
Amharic
```

Customer UI:

```text
EN | አማ
```

Support translation of:

- static UI
- menu categories
- menu names
- descriptions
- modifiers
- variations
- validation messages where appropriate

Admin menu creation must support English and Amharic values.

If Amharic content is missing:

```text
fallback → English
```

Use appropriate Ethiopic typography.

Do not create a separate duplicated application for each language.

Use a clean localization architecture.

---

# 12. FASTING SYSTEM

Implement:

```text
is_fasting_friendly
```

for menu items.

Provide:

```text
Fasting Only
የጾም
```

filtering.

The filter must be applied correctly by the backend/API where appropriate and reflected in the frontend.

Implement restaurant configuration for fasting mode scheduling.

The FRD specifies:

- Wednesday
- Friday
- major fasting seasons

Do not hard-code business logic throughout the frontend.

Create a clean fasting configuration/service.

---

# 13. MODIFIER SYSTEM

Create a flexible modifier architecture.

It must support:

### Single selection

Example:

```text
Sugar:
- Normal
- Koshir
- Alcho
- Taniya
```

### Multiple selection

Example:

```text
Extras:
- Extra Injera
- Soya Milk
- etc.
```

Support:

- minimum selection
- maximum selection
- price adjustments

The backend must validate modifier selections.

Never trust the total price calculated by the frontend.

The backend must calculate the authoritative order total.

---

# 14. ORDER ARCHITECTURE

Implement a robust order lifecycle.

Do not allow arbitrary status changes from the frontend.

Create explicit allowed state transitions.

Example conceptual lifecycle:

```text
PENDING
→ PAYMENT_PENDING
→ PAID
→ CONFIRMED
→ PREPARING
→ READY
→ COMPLETED
```

Also support the relevant statuses from the FRD such as:

```text
PENDING_CASH_CONFIRMATION
DISPUTED
CANCELLED
```

Only introduce statuses that are actually necessary.

The backend owns the state machine.

Validate every transition.

---

# 15. SELF-SERVED ORDER FLOW

Implement:

```text
Customer scans QR
        ↓
Menu
        ↓
Customize item
        ↓
Cart
        ↓
Customer information
        ↓
Checkout
        ↓
Payment
        ↓
Verification
        ↓
Confirmed
        ↓
KOT
        ↓
Kitchen / Barista
```

The customer must never be able to directly mark an order as:

```text
PAID
CONFIRMED
READY
COMPLETED
```

Those transitions must happen through authorized backend logic.

---

# 16. WAITER-ASSISTED ORDER FLOW

Implement:

```text
Customer scans QR
        ↓
Read-only menu
        ↓
Waiter logs in
        ↓
Selects table
        ↓
Creates order
        ↓
Order sent to KDS
        ↓
Kitchen / Barista
        ↓
Bill remains open
        ↓
Cashier/authorized user settles payment
```

Implement the FRD's waiter PIN requirement securely.

Do not store waiter PINs in plaintext.

If PIN authentication is implemented:

- hash the PIN
- rate-limit attempts
- lock/throttle repeated failures
- never expose the PIN
- do not log the PIN
- validate authorization server-side

---

# 17. PAYMENT ARCHITECTURE

The FRD requires:

```text
Cash
Telebirr
CBE / CBE Birr
```

However:

IMPORTANT:

There are currently NO official Telebirr or CBE API credentials/specifications available.

DO NOT invent a fake external API and present it as a real Telebirr/CBE API.

Instead implement a clean provider architecture such as:

```text
PaymentProvider
    ├── CashPaymentProvider
    ├── TelebirrPaymentProvider
    └── CbePaymentProvider
```

Create interfaces/contracts that allow the real providers to be integrated later.

For development/staging, implement safe mock providers.

The mock provider must be explicitly identified as:

```text
MOCK
```

Never allow a development mock to accidentally operate in production.

Production must fail safely if the real payment integration has not been configured.

---

# 18. PAYMENT SECURITY

Never trust:

- payment amount from frontend
- transaction status from frontend
- payment verification from frontend

The backend calculates the amount.

Payment verification must be performed server-side.

Payment records should include appropriate information such as:

- payment method
- amount
- currency
- status
- transaction reference
- provider
- timestamps
- order relationship
- verification information

Prevent:

- duplicate payment processing
- replay attacks
- double confirmation
- amount mismatch
- payment reference reuse

Use idempotency where appropriate.

---

# 19. ENVIRONMENT MODES

Support:

```text
development
staging
production
```

Use an environment configuration service.

Do not scatter environment checks throughout the application.

Payment behavior must be environment-aware.

Production must have strict enforcement.

Never accidentally enable mocked payment confirmation in production.

---

# 20. KOT ENGINE

Implement Kitchen Order Ticket routing.

Each menu item has:

```text
fulfillment_station
```

When an order contains:

```text
Burger
Coffee
```

the backend must create/route:

```text
Kitchen ticket → Burger
Barista ticket → Coffee
```

The master order must track the station tickets.

The overall order should become ready only when the required station work is complete.

This logic belongs to the backend.

Do not implement critical KOT splitting only in Redux or frontend code.

---

# 21. KDS

Create a responsive KDS interface.

Stations:

```text
Kitchen
Barista
```

Order cards must show timing according to the FRD:

```text
< 5 minutes
5–12 minutes
> 12 minutes
```

Support:

```text
Incoming
→ Preparing
→ Ready
```

Implement audio notification for new orders using browser-supported Web Audio APIs where possible.

Handle browser autoplay restrictions gracefully.

Do not make audio a security or business-critical dependency.

---

# 22. REAL-TIME ARCHITECTURE

Evaluate whether WebSockets are appropriate for:

- KDS order updates
- order status updates
- payment status updates
- kitchen/barista updates

If using WebSockets:

- authenticate connections
- authorize subscriptions/actions
- validate messages
- do not trust client events
- prevent unauthorized room access
- keep the implementation simple

If WebSockets are unnecessary for a specific feature, do not add them just for complexity.

---

# 23. TABLE AND QR SYSTEM

Each table must have:

- internal database ID
- human-readable table number/name
- secure cryptographic token
- active/inactive state

QR URLs should follow the FRD concept:

```text
/menu?table_id=12&token=...
```

IMPORTANT:

Do not assume that merely hiding a table ID makes a QR secure.

The backend must validate the token.

Generate cryptographically secure unpredictable tokens.

Do not use:

```text
Math.random()
```

for security-sensitive tokens.

Use a cryptographically secure random generator.

QR tokens must be revocable/rotatable.

When the table bill is settled:

- invalidate relevant customer sessions
- prevent accidental continuation of the previous table session

---

# 24. QR GENERATION

Admin must be able to generate/download QR codes.

Support appropriate high-resolution output.

Prefer:

- SVG
- high-resolution PNG

Allow restaurant branding/logo placement if practical.

Do not expose internal secrets through generated QR codes.

---

# 25. CUSTOMER SESSION SECURITY

Customer QR sessions must be designed carefully.

Do not assume:

```text
table_id = authorization
```

Validate:

- table
- QR token
- session
- order ownership/context
- table status

Prevent customers from manipulating another table's order by changing URL parameters.

Never trust:

```text
?table_id=999
```

by itself.

---

# 26. ADMIN SETTINGS

Create a clean Settings section.

The administrator must be able to configure appropriate restaurant settings including:

- restaurant information
- service model
- table configuration
- payment configuration
- language settings
- fasting configuration
- theme configuration
- other settings required by the FRD

---

# 27. DYNAMIC COLOR THEME

This is an explicit requirement.

The administrator must be able to change the application's color theme from Settings.

Do NOT hard-code the application's primary color throughout components.

Create a centralized theme system.

For example, conceptually:

```text
primaryColor
secondaryColor
accentColor
backgroundColor
```

The exact structure should be determined based on the UI architecture.

Theme values must be stored in PostgreSQL.

The frontend retrieves the active theme configuration.

Apply the theme consistently.

Prefer CSS variables/design tokens rather than duplicating color values across components.

Example conceptual architecture:

```text
Database
    ↓
Restaurant Settings API
    ↓
Redux
    ↓
Theme Provider / CSS Variables
    ↓
Application UI
```

Validate color values server-side.

Prevent malformed values from being stored.

The system should have a safe default theme.

Do not allow an invalid theme configuration to break the application.

---

# 28. FRONTEND ARCHITECTURE

Use Next.js.

Keep components reasonably small.

Separate:

- UI components
- feature components
- API communication
- state management
- validation
- utilities
- types

Use Redux Toolkit for global application state where appropriate.

Do NOT put everything into Redux.

Server data should be handled appropriately rather than turning Redux into a database.

Avoid unnecessary global state.

---

# 29. API ARCHITECTURE

Create clean REST APIs unless there is a compelling reason to use another approach.

NestJS modules should be organized by business domain.

Potential modules may include:

```text
auth
users
roles
restaurant
settings
tables
qr
categories
menu-items
modifiers
orders
payments
kot
kitchen
barista
```

Do not blindly create these modules if some can be logically combined.

Keep controllers thin.

Business logic belongs in services/domain logic.

Validation belongs at API boundaries.

---

# 30. VALIDATION

Use strong DTO validation on the backend.

Every external request must be validated.

Validate:

- strings
- numbers
- enums
- IDs
- UUIDs where used
- pagination
- colors
- prices
- quantities
- modifier selections
- payment references
- table tokens
- order status transitions

Reject unexpected properties where appropriate.

Never trust TypeScript types as runtime validation.

---

# 31. SECURITY CONTROLS

Implement appropriate security controls including:

- secure password hashing
- JWT security
- refresh token security
- RBAC
- rate limiting
- brute-force protection
- request validation
- secure HTTP headers
- CORS configuration
- secure cookies where cookies are used
- protection against XSS
- protection against SQL injection
- protection against mass assignment
- authorization on every sensitive endpoint
- safe error responses
- no secret leakage
- no password/token logging
- audit logging for security-sensitive operations

Do not blindly add security libraries without understanding their configuration.

Configure security middleware correctly.

---

# 32. ERROR HANDLING

Never expose internal stack traces or sensitive implementation details to clients in production.

Use structured API errors.

Errors should be:

- predictable
- useful to the frontend
- safe
- properly logged server-side

Do not return:

```text
database password
JWT secret
stack trace
SQL query
internal filesystem paths
```

to the client.

---

# 33. LOGGING

Implement structured logging appropriate for production.

Never log:

- passwords
- JWT tokens
- refresh tokens
- payment secrets
- PINs
- sensitive authentication credentials

Logs should contain enough information to diagnose failures without exposing secrets.

---

# 34. AUDITABILITY

Consider audit logging for sensitive administrative actions such as:

- user creation
- role changes
- menu price changes
- payment configuration changes
- restaurant setting changes
- service model changes
- table changes
- order cancellation
- payment status changes

Keep audit logging simple and useful.

Do not create unnecessary audit noise.

---

# 35. API RESPONSE DESIGN

Use consistent API response structures.

Do not make every endpoint return a completely different format.

Errors should also follow a consistent structure.

Frontend API handling should be centralized rather than duplicated in every component.

---

# 36. PAGINATION AND QUERY SAFETY

For admin lists:

- use pagination
- validate page/limit
- enforce reasonable maximum limits
- avoid loading thousands of records unnecessarily

For search/filter functionality:

- validate input
- avoid expensive unrestricted queries
- use appropriate database indexes

---

# 37. DATABASE INDEXING

Identify frequently queried fields and create appropriate indexes.

Examples may include:

- usernames
- table identifiers
- QR tokens
- order status
- payment reference
- station
- timestamps
- category relationships

Do not blindly index every column.

---

# 38. FRONTEND SECURITY

Remember:

The frontend is untrusted.

Never put:

- database credentials
- JWT signing secrets
- payment secrets
- private API keys

into client-side environment variables.

Never use frontend role checks as the only authorization mechanism.

Never calculate authoritative order/payment values only on the frontend.

---

# 39. UI/UX

The UI should be:

- modern
- clean
- minimalist
- professional
- responsive
- touch-friendly
- mobile-first where appropriate

Customer interface should be optimized for:

- phones
- QR scanning
- quick menu browsing
- quick ordering

Waiter/KDS interfaces should be optimized for:

- tablets
- touch interaction
- fast operation
- high visibility

Admin interface should prioritize:

- clarity
- easy navigation
- configuration
- operational visibility

Do not over-design the interface.

---

# 40. MOBILE CUSTOMER PERFORMANCE

The FRD specifies a target of approximately:

```text
< 150 KB customer PWA page load bundle
```

Treat this as a performance target.

Optimize where realistically possible.

Avoid unnecessary frontend libraries.

Use:

- lazy loading where useful
- optimized images
- efficient components
- minimal JavaScript
- appropriate caching

Do not sacrifice correctness/security just to hit an arbitrary bundle number.

Measure before making claims that the requirement has been met.

---

# 41. NO OFFLINE MODE FOR THIS IMPLEMENTATION

The original FRD mentions offline-first operation.

For THIS implementation, do NOT implement offline order processing.

Do not introduce:

- local SQLite
- offline order queues
- cloud synchronization
- offline conflict resolution

unless explicitly requested later.

The application should operate online.

Keep the architecture clean so offline functionality could theoretically be introduced later without unnecessarily complicating the current implementation.

---

# 42. PRINTER SUPPORT

The FRD mentions:

- 58mm ESC/POS
- 80mm ESC/POS
- USB
- Bluetooth

Because this is a web application, do not pretend browser JavaScript can universally control arbitrary USB/Bluetooth thermal printers without an appropriate local bridge/native mechanism.

Design the printer integration behind an abstraction.

If direct browser hardware integration is not realistically available in the current environment:

- implement the printer service interface
- implement printable ticket formats
- document the required local/native bridge
- do not fake successful hardware communication

Do not claim hardware support works unless it has actually been tested.

---

# 43. TESTING

Implement meaningful tests.

At minimum test critical backend business logic.

Prioritize tests for:

- authentication
- authorization
- password handling
- token refresh
- table token validation
- order creation
- order total calculation
- modifier validation
- payment validation
- duplicate payment prevention
- service model logic
- KOT splitting
- order state transitions
- table settlement
- theme settings authorization

Do not create meaningless tests just to increase test count.

---

# 44. TRANSACTIONAL INTEGRITY

Use database transactions for multi-step operations that must either fully succeed or fully fail.

Example:

Order confirmation may require:

```text
validate payment
+
update payment
+
update order
+
create KOT tickets
```

These operations must be designed carefully to prevent partial state.

Analyze each workflow individually and use transactions where appropriate.

---

# 45. IDEMPOTENCY

Critical operations must be protected against accidental repeated requests.

Especially:

- payment confirmation
- order submission
- order confirmation
- KOT creation
- settlement

If the client retries a request, the backend should not accidentally:

```text
charge twice
create duplicate KOTs
create duplicate orders
```

---

# 46. DO NOT TRUST FRONTEND CALCULATIONS

The frontend may calculate values for display.

But the backend must be authoritative for:

- prices
- modifier prices
- quantities
- discounts if implemented
- subtotal
- total
- payment amount
- order state
- table association
- fulfillment station
- user permissions

---

# 47. GRILL-ME SKILL

You will have access to the Grill-Me skill.

Use it actively during development.

After implementing meaningful sections:

1. Ask Grill-Me to challenge the implementation.
2. Look for security vulnerabilities.
3. Look for missing requirements.
4. Look for incorrect assumptions.
5. Look for edge cases.
6. Look for authorization bypasses.
7. Look for race conditions.
8. Look for payment vulnerabilities.
9. Look for data-integrity problems.
10. Look for unnecessarily complicated code.

Do not merely run Grill-Me at the end.

Use it throughout the implementation.

When Grill-Me identifies an issue:

- understand it
- fix the root cause
- retest
- verify that the fix does not introduce another issue

---

# 48. IMPLEMENTATION WORKFLOW

Do NOT attempt to blindly generate the entire application in one enormous code generation step.

Work in controlled phases.

## Phase 1 — Analyze

Inspect the repository.

Produce:

- architecture assessment
- current-state assessment
- proposed folder structure
- required dependencies
- database entities
- API modules
- authentication architecture
- authorization architecture
- frontend architecture
- state architecture
- security architecture

Do not modify application code unnecessarily during this phase.

---

## Phase 2 — Database and Domain Design

Design the Prisma schema.

Check:

- relationships
- constraints
- enums
- indexes
- historical order data
- payment records
- users/roles
- settings
- theme configuration
- tables
- QR tokens
- menu
- modifiers
- orders
- KOT

Then implement migrations safely.

---

## Phase 3 — Backend Foundation

Implement:

- configuration
- validation
- authentication
- JWT
- refresh tokens
- RBAC
- users
- settings
- restaurant configuration

Secure the API before implementing business workflows.

---

## Phase 4 — Menu and Tables

Implement:

- categories
- menu items
- modifiers
- fasting
- stations
- tables
- QR tokens
- customer menu API

---

## Phase 5 — Orders

Implement:

- customer ordering
- waiter ordering
- cart/order validation
- order totals
- state machine
- service model
- table-level override

---

## Phase 6 — Payments

Implement:

- payment abstraction
- cash
- mock Telebirr
- mock CBE
- payment records
- idempotency
- verification architecture

Do NOT pretend mock providers are real production integrations.

---

## Phase 7 — KOT/KDS

Implement:

- ticket splitting
- kitchen queue
- barista queue
- ticket state transitions
- real-time updates if justified

---

## Phase 8 — Frontend

Implement:

- authentication
- admin dashboard
- settings
- theme system
- menu management
- table management
- QR management
- customer menu
- cart
- checkout
- waiter interface
- KDS

---

## Phase 9 — Security Review

Use Grill-Me.

Perform a serious security review.

Check:

```text
Authentication
Authorization
JWT
Refresh tokens
RBAC
Input validation
SQL injection
XSS
CSRF
CORS
Rate limiting
Brute force
IDOR
Mass assignment
Payment manipulation
Replay attacks
Race conditions
QR token attacks
Session invalidation
Secret exposure
Information disclosure
```

---

## Phase 10 — Testing and Cleanup

Run:

- TypeScript checks
- linting
- unit tests
- integration tests where appropriate
- build
- Prisma validation
- frontend build
- backend build

Fix all meaningful errors.

Remove unused dependencies.

Remove dead code.

Remove unnecessary abstractions.

Review naming.

Review folder structure.

Review security.

---

# 49. IMPORTANT — DO NOT MAKE THESE MISTAKES

Never:

- invent undocumented external payment APIs
- claim mock payment is real payment
- trust frontend totals
- trust frontend roles
- trust frontend order status
- expose secrets
- store plaintext passwords
- store plaintext PINs
- put secrets in Redux
- put secrets in localStorage
- create unnecessary microservices
- create unnecessary libraries
- over-engineer simple functionality
- duplicate business logic between frontend and backend
- put business logic inside React components
- put business logic inside controllers
- make Prisma calls directly from controllers
- create giant services
- ignore transaction boundaries
- ignore authorization
- implement fake printer functionality
- implement fake offline functionality
- silently remove FRD requirements

---

# 50. CHANGE MANAGEMENT

Before making a significant architectural change:

Explain:

```text
What is changing?
Why is it necessary?
What existing functionality could be affected?
What is the security impact?
```

Do not make destructive changes without understanding the existing implementation.

Never delete files merely because they are currently empty unless there is a clear reason.

---

# 51. DOCUMENTATION

Create concise developer documentation for:

- project architecture
- environment variables
- database setup
- Prisma migrations
- authentication
- roles/permissions
- payment provider architecture
- local development
- testing
- production configuration

Do not write huge documentation that nobody will maintain.

---

# 52. ENVIRONMENT VARIABLES

Create a clear `.env.example`.

Never commit real secrets.

Document required variables such as:

```text
DATABASE_URL
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
APP_ENV
```

and other variables actually required by the implementation.

Do not invent credentials.

---

# 53. SOURCE OF TRUTH

The following priority order must be followed:

1. Security requirements
2. Functional Requirements Document
3. Existing project structure
4. Backend business rules
5. Database integrity
6. Frontend behavior

When frontend behavior conflicts with backend security/business rules, the backend wins.

When a requirement is ambiguous, do not silently invent complex behavior.

Choose the simplest secure implementation and document the assumption.

---

# 54. FINAL ACCEPTANCE CHECK

Before considering the implementation complete, verify every FRD requirement.

Create an internal checklist:

```text
FR-MOD
FR-LOC
FR-CUL
FR-PAY
FR-KOT
FR-TBL
```

Map each requirement to its implementation.

Identify:

- implemented
- partially implemented
- intentionally deferred
- blocked by external integration

Do not claim an external integration is complete if its real API was never provided.

---

# 55. FINAL INSTRUCTION

You are not simply generating code.

You are engineering a secure production-oriented restaurant ordering system.

Think before coding.

Inspect before changing.

Design before implementing.

Validate on the backend.

Keep the architecture simple.

Prioritize security.

Use the FRD as the functional source of truth.

Use Grill-Me continuously to challenge the implementation.

Do not invent external integrations as if they were real.

Do not implement offline mode in this version.

Do not over-engineer.

Do not create unnecessary dependencies.

Do not sacrifice security for convenience.

Do not sacrifice maintainability for speed.

At every stage ask:

> "Can a malicious client bypass this?"

> "Can this operation happen twice accidentally?"

> "Can this data be manipulated from the browser?"

> "Can this operation be performed by the wrong role?"

> "Can this fail halfway and leave inconsistent database state?"

> "Is this implementation simpler without sacrificing security?"

If the answer exposes a weakness, fix it before proceeding.

Begin by inspecting the existing workspace and producing the Phase 1 architecture assessment.
