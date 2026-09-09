# P09 — Real Estate Property Listing \& Enquiry Portal

CIA-3 backend project — Advanced JavaScript Backend Frameworks (Node.js \& Express JS), 5th Semester, Christ University.

## Team Details

| S.No | Student Name | Roll No. | Department | Section |
|------|--------------|----------|------------|---------|
| 1 | S. Manikanta Reddy | 2462140 | ADSE | 5BTCSAIML-B |
| 2 | Sandra Shaju | 2462143 | ADSE | 5BTCSAIML-B |
| 3 | Sharon Cheriyan | 2462146 | ADSE | 5BTCSAIML-B |
| 4 | Shrayana K S | 2462149 | ADSE | 5BTCSAIML-B |

**Project Code \& Title:** P09 — Real Estate Property Listing \& Enquiry Portal
**Course:** Advanced JavaScript Backend Frameworks (Node.js \& Express JS)
**Batch:** 9
**Semester:** 5th Semester

**GitHub Repository:** [Real Estate Backend](https://github.com/saligarimanikanta-max/real-estate-backend)

## Problem Statement

A real estate agency needs a backend that lets agents list properties for sale or rent, lets buyers/tenants search those listings and raise enquiries, and lets admins keep the platform trustworthy by verifying agents and listings before they go public. This project implements that as a role-based REST API on Node.js, Express, and MongoDB.

## Tech Stack

* **Runtime/Framework:** Node.js, Express.js
* **Database:** MongoDB with Mongoose ODM
* **Auth:** JWT (jsonwebtoken) + bcrypt (bcryptjs) password hashing
* **Validation:** express-validator, enforced as Express middleware (never trusts the frontend alone)
* **Other:** cors, morgan (dev request logging), dotenv

## Folder Structure

```
config/        -> db.js (MongoDB connection)
models/        -> Mongoose schemas: User, Property, Enquiry, Favourite, Rating
routes/        -> Express route definitions, grouped by resource
controllers/   -> business logic for each route
middleware/    -> auth.js (JWT verify + role check), validate.js, errorHandler.js, asyncHandler.js
validators/    -> express-validator rule chains per resource
utils/         -> AppError, generateToken, apiResponse helpers
scripts/       -> createAdmin.js (one-off admin bootstrap CLI)
server.js      -> app entry point
postman\_collection.json -> full endpoint coverage, importable into Postman
```

## Setup Instructions

1. **Install dependencies**

```bash
   npm install
   ```

2. **Configure environment variables** — copy `.env.example` to `.env` and fill in real values (never commit `.env`):

```bash
   cp .env.example .env
   ```

   * `MONGO\_URI` — your MongoDB connection string (local `mongodb://127.0.0.1:27017/realestate\_portal` or a MongoDB Atlas URI)
   * `JWT\_SECRET` — any long random string
   * `PORT` — defaults to 5000
3. **Run the server**

```bash
   npm run dev     # with nodemon, auto-restarts on file changes
   # or
   npm start
   ```

   The API is now available at `http://localhost:5000/api`. `GET /api/health` should return `{ "success": true, "message": "API is up and running" }`.

4. **Create the first admin account.** Admins cannot self-register through the API (see [Business Rules](#business-rules--workflow-logic) below) — bootstrap one directly:

```bash
   node scripts/createAdmin.js "Admin Name" admin@example.com StrongPass123
   ```

5. **Import `postman\_collection.json`** into Postman, set the collection variable `baseUrl` (defaults to `http://localhost:5000/api`), and run the **Auth → Register Buyer / Register Agent** requests first — their Tests scripts automatically save `buyerToken` / `agentToken` / `agentId` as collection variables for every later request. Log in as the admin you created above and manually paste that token into the `adminToken` variable.

## Suggested Demo Walkthrough (matches the grading rubric's "walk it end-to-end" note)

1. Register a buyer and an agent (Auth folder).
2. Log in as the bootstrapped admin, verify the agent (`PUT /admin/agents/:id/verify`).
3. As the agent, create a property (`POST /properties`) — fails with 403 until step 2 is done.
4. As the admin, approve the listing (`PUT /properties/:id/verify`).
5. As the buyer, search for it (`GET /properties/search`), favourite it (`POST /favourites`), and submit an enquiry (`POST /enquiries`).
6. As the agent, view the lead (`GET /enquiries/agent`) and move it through its status pipeline (`PUT /enquiries/:id/status`).
7. As the agent, move the property through its status pipeline (`PUT /properties/:id/status`: Available → Under Negotiation → Sold/Rented).
8. As the buyer, rate the agent (`POST /agents/:id/rate` — requires the enquiry from step 5 to exist).
9. As the admin, pull the two reports (`GET /admin/reports/top-properties`, `GET /admin/reports/agent-performance`).

## Functional Modules Implemented (13/13 required)

|#|Module|Where it lives|
|-|-|-|
|1|User Registration \& Authentication|`controllers/authController.js`, `routes/authRoutes.js`|
|2|Property Listing Management|`controllers/propertyController.js` (create/update/delete)|
|3|Property Verification Workflow|`propertyController.verifyProperty` — `PUT /properties/:id/verify`|
|4|Advanced Search \& Filtering|`propertyController.searchProperties` — `GET /properties/search`|
|5|Favourites/Saved Properties|`controllers/favouriteController.js`|
|6|Enquiry Submission Module|`enquiryController.createEnquiry`|
|7|Lead Management for Agents|`enquiryController.getAgentEnquiries` / `updateEnquiryStatus`|
|8|Property Status Tracking|`propertyController.updatePropertyStatus` (Available → Under Negotiation → Sold/Rented)|
|9|Agent Profile \& Ratings|`controllers/agentController.js`|
|10|Location-Based Listing Grouping|`propertyController.getPropertiesByLocation` / `getPropertiesGroupedByCity`|
|11|Admin Moderation Dashboard|`adminController.getPendingAgents` / `getPendingProperties` / `setPropertyFlag`|
|12|Reports \& Analytics|`adminController.getTopProperties` / `getAgentPerformance` (aggregation pipelines)|
|13|Role-Based Access Control|`middleware/auth.js` (`protect` + `authorize`), applied across every route file, plus ownership checks inside controllers|

## API Endpoint Reference

All responses share the shape `{ success, message, data? }` on success or `{ success: false, message, errorCode }` on error.

### Auth (`/api/auth`)

|Method|Endpoint|Access|Description|
|-|-|-|-|
|POST|`/auth/register`|Public|Register a buyer or agent|
|POST|`/auth/login`|Public|Log in, returns a JWT|
|GET|`/auth/me`|Any logged-in user|Current user's own profile|

### Properties (`/api/properties`)

|Method|Endpoint|Access|Description|
|-|-|-|-|
|GET|`/properties/search`|Public|Filter by city, price range, propertyType, type, bedrooms; paginated|
|GET|`/properties/grouped-by-city`|Public|Aggregated listing count \& avg price per city|
|GET|`/properties/location/:city`|Public|Approved listings in one city|
|POST|`/properties`|Agent (verified)|Create a listing|
|GET|`/properties/:id`|Public|Property detail|
|PUT|`/properties/:id`|Owning agent / Admin|Edit core details (re-queues for verification)|
|DELETE|`/properties/:id`|Owning agent / Admin|Delete a listing|
|PUT|`/properties/:id/verify`|Admin|Approve/reject a pending listing|
|PUT|`/properties/:id/status`|Owning agent / Admin|Move through Available → Under Negotiation → Sold/Rented|

### Enquiries (`/api/enquiries`)

|Method|Endpoint|Access|Description|
|-|-|-|-|
|POST|`/enquiries`|Buyer|Submit an enquiry on an approved, available property|
|GET|`/enquiries/my`|Buyer|This buyer's own enquiries|
|GET|`/enquiries/agent`|Agent|Leads across all of this agent's properties|
|PUT|`/enquiries/:id/status`|Owning agent / Admin|New → Contacted → In Progress → Closed|

### Favourites (`/api/favourites`)

|Method|Endpoint|Access|Description|
|-|-|-|-|
|POST|`/favourites`|Buyer|Save a property (duplicate save → 409)|
|GET|`/favourites`|Buyer|List saved properties|
|DELETE|`/favourites/:propertyId`|Buyer|Remove a saved property|

### Agents (`/api/agents`)

|Method|Endpoint|Access|Description|
|-|-|-|-|
|GET|`/agents/:id`|Public|Public profile: listings count, average rating|
|POST|`/agents/:id/rate`|Buyer (must have enquired with this agent)|Rate/update rating 1–5|

### Admin (`/api/admin`)

|Method|Endpoint|Access|Description|
|-|-|-|-|
|GET|`/admin/agents/pending`|Admin|Agents awaiting verification|
|PUT|`/admin/agents/:id/verify`|Admin|Approve an agent|
|GET|`/admin/properties/pending`|Admin|Pending or flagged listings|
|PUT|`/admin/properties/:id/flag`|Admin|Flag/unflag a live listing for review|
|GET|`/admin/reports/top-properties`|Admin|Most-enquired-about properties|
|GET|`/admin/reports/agent-performance`|Admin|Per-agent listings/sold/rating rollup|

Full request/response examples for every endpoint are in `postman\_collection.json`.

## Database Schema Summary

|Collection|Key Fields|Notes|
|-|-|-|
|`users`|name, email, passwordHash, role, phone, isVerified|`role` ∈ {buyer, agent, admin}; `isVerified` gates whether an agent may create listings|
|`properties`|agentId (ref), title, type, propertyType, price, city, bedrooms, images\[], status, verificationStatus, isVerified, isFlagged|References `users` — a property is large, updated independently, and one agent owns many|
|`enquiries`|propertyId (ref), buyerId (ref), message, status|References both sides — queried from the buyer's side and the agent's side independently|
|`favourites`|userId (ref), propertyId (ref)|Small join document; compound unique index on (userId, propertyId) prevents duplicate saves|
|`ratings`|agentId (ref), buyerId (ref), rating, comment|Compound unique index on (agentId, buyerId); kept separate from `users` since it's written by a different actor and aggregated for the public profile|

**Indexes:** `users.email` (unique), `properties.agentId`, `properties.{city, price, propertyType}`, `enquiries.propertyId`, `enquiries.buyerId`, `favourites.{userId, propertyId}` (unique), `ratings.{agentId, buyerId}` (unique).

**Relationships (ER notes):** one user (agent) → many properties; one user (buyer) → many enquiries and many favourites; one property → many enquiries; one agent (user) → many ratings from many buyers. All are modelled as references (ObjectId), not embedding, because each side is queried and updated independently of the other.

```
 User (agent) 1───\* Property 1───\* Enquiry \*───1 User (buyer)
 User (buyer) 1───\* Favourite \*───1 Property
 User (agent) 1───\* Rating \*───1 User (buyer)
```

## Business Rules \& Workflow Logic

These are the non-CRUD rules the grading rubric specifically calls out ("correct handling of status transitions/workflow logic, not just plain CRUD"):

* **Admin can't be self-registered.** `POST /auth/register` rejects `role: "admin"` outright — admins are created once via `scripts/createAdmin.js`.
* **Agent verification gates listing creation.** A newly registered agent has `isVerified: false` and gets a 403 (`AGENT\_NOT\_VERIFIED`) from `POST /properties` until an admin approves them.
* **Listing verification is separate from listing status.** `verificationStatus`/`isVerified` (Module 3) controls whether a listing is public at all; `status` (Module 8) controls where it is in its own lifecycle once public. Editing an already-approved listing quietly re-queues it as `Pending` so a change can't sneak past review.
* **Property status transitions are restricted:** `Available → Under Negotiation → {Sold, Rented}`, with `Under Negotiation → Available` allowed as a fallback if a deal falls through. Anything else (e.g. `Sold → Available`) is rejected with 409 `INVALID\_TRANSITION`.
* **Enquiries can't be raised on unapproved or already Sold/Rented properties** — rejected with 409, not silently accepted.
* **Enquiry status also follows a fixed pipeline:** `New → Contacted → In Progress → Closed`, with `Closed` reachable from any state (an agent can always close a lead) but no skipping backwards.
* **A buyer can only rate an agent they've actually enquired with** — enforced by checking enquiry history before accepting `POST /agents/:id/rate`, and a repeat rating updates in place instead of creating a duplicate.
* **Ownership is checked everywhere it matters:** an agent can only update/delete/change the status of their own properties (or their own leads); anyone else — even another authenticated agent — gets 403, not just "logged in = allowed".

## Known Limitations / Scope

* No payment gateway, SMS/email, or maps integration — out of scope per the assignment (mocking/stubbing was explicitly allowed).
* Auth is a self-built JWT flow; no social login.
* Single currency/locale, single time zone assumed.
* No pagination on a few smaller admin list endpoints (pending agents/properties) since those lists are expected to stay small; `properties/search` is paginated.
* A frontend was optional for this CIA component and is not included — the Postman collection is the primary way to demonstrate every endpoint.

## Postman Collection

`postman\_collection.json` in the repo root covers every endpoint above, including a few intentionally-failing requests (missing fields, invalid transitions, invalid ObjectId) that demonstrate the validation and error-handling requirements. Import it, set `baseUrl`, and follow the demo walkthrough above.

