# PROMPTS.md --- Complete Visible Chat Log

This file contains the user-visible conversation in this ChatGPT thread
about planning the Car Dealership Inventory System. It excludes hidden
system/developer instructions and internal reasoning, which are not part
of the visible chat log.

------------------------------------------------------------------------

## Message 1 --- User

go through the requirements pdf of this car dealership Inventory system
in detail. acting as a senior developer and give me the full roadmap of
how to complete and implement this project in multiple phases to finish
this task in one day. Techstack to use - Next.js and MongoDB for backend
in each phase give me an overview of what task will be done, the files
and codes to complete each of the tasks and a corresponding git commit
and push message. Give me recomendations on which techstack or
architecture or technique is suitable to use when there is an option and
why the suitable choice was made along with all this also give me a
suitable README.md file, about project snippet line and a github push
timeline ask me any questions to clear any doubts before moving forward

Attachment referenced: `AI_Kata_Car_Dealership_Inventory_System_V2.pdf`

------------------------------------------------------------------------

## Message 2 --- Assistant

I've reviewed the full 3-page requirements PDF for the **TDD Kata: Car
Dealership Inventory System**. The project is not just a CRUD
application: the evaluator explicitly expects a REST API, JWT
authentication, role-based authorization, inventory operations,
test-driven development, a meaningful Git history, and transparent AI
usage. The PDF specifies the required API endpoints, protected inventory
operations, admin-only actions, test-first development, Git history,
AI-use disclosure, README, screenshots, test report, and raw AI logs in
`PROMPTS.md`.

### What the requirements make mandatory

-   **Authentication and authorization:** Register/login with JWT;
    protected vehicle and inventory endpoints; admin-only delete and
    restock operations.
-   **Vehicle and inventory management:** Vehicle CRUD,
    searching/filtering, purchasing, quantity updates and restocking.
-   **Test-driven development:** Write tests first, demonstrate
    Red--Green--Refactor in the commit history, and provide a test
    report.
-   **Submission and documentation:** Public GitHub repository, detailed
    README, screenshots, root-level `PROMPTS.md` containing raw AI chat
    logs or public chat links, and optional live deployment.

The PDF also explicitly requires a **"My AI Usage"** section and AI
co-author trailers on commits where AI was used. We'll build those into
the workflow rather than leave them until the end.

### Before I build the full roadmap, I need 4 quick decisions

**1. Which backend architecture do you want?**

-   Next.js frontend + Express/TypeScript backend --- recommended for
    strict compliance with the PDF's backend technology options.
-   Next.js full-stack + MongoDB --- one application, using Next.js
    Route Handlers for REST APIs; faster to build, but less directly
    aligned with the listed backend framework options.

**2. Authentication approach?**

-   JWT access tokens with bcrypt password hashing and role-based
    authorization --- recommended.
-   Auth.js with a JWT session strategy, plus custom authorization for
    the required REST endpoints.

**3. Testing tools?**

-   Vitest + Supertest + React Testing Library --- recommended for fast,
    focused testing.
-   Jest + Supertest + React Testing Library.

**4. What is the one-day completion target?**

-   Complete submission: working application, tests, polished responsive
    UI, README, PROMPTS.md, screenshots, and public GitHub repository.
-   Everything above, plus deployment and a live application URL if time
    permits.
-   Functional MVP first: prioritize all required backend endpoints,
    core UI and tests; polish and deployment only if time remains.

**Recommendation:** Prioritize correct backend behavior and meaningful
tests before visual polish. The purchase operation needs special
attention: it must prevent stock from going negative when multiple
requests try to purchase the same vehicle. Use an atomic MongoDB update
rather than a separate read-then-write operation.

Once you confirm the four choices above, I'll structure the roadmap into
timed phases, with the exact folder tree, file-by-file code, test cases,
Git commands, README, GitHub description, and a realistic push timeline.
I'll also distinguish mandatory requirements from optional enhancements
so the one-day deadline remains achievable.

------------------------------------------------------------------------

## Message 3 --- User

My Car Dealership Inventory System decisions: 1. Architecture: Next.js
frontend + Express/TypeScript backend 2. Authentication: JWT access
tokens, bcrypt, role-based authorization 3. Testing: Vitest +
Supertest + React Testing Library 4. Delivery target: Complete
submission plus deployment if time permits Now create the detailed
one-day phased implementation roadmap based on the uploaded requirements
PDF. Include exact files, implementation code, test-first workflow,
per-phase Git commit and push message with required AI co-author
trailers, README.md, GitHub description, and push timeline.

------------------------------------------------------------------------

## Message 4 --- Assistant

# Car Dealership Inventory System --- One-Day Implementation Roadmap

Architecture: Next.js + Express + TypeScript + MongoDB\
Testing: Vitest, Supertest, React Testing Library

The plan follows the uploaded TDD Kata requirements and your confirmed
choices. The PDF specifies the required API endpoints, protected
inventory operations, admin-only actions, test-first development, Git
history, AI-use disclosure, README, screenshots, test report, and raw AI
logs in `PROMPTS.md`.

The objective is to finish a credible, working submission in one focused
day, with deployment as the final priority if time remains.

## 1. Architecture and technical decisions

### Recommended architecture

-   **Next.js frontend:** React, TypeScript, Tailwind CSS, responsive
    dashboard.
-   **Express + TypeScript backend:** Routes, controllers, services,
    middleware, validation.
-   **MongoDB Atlas:** Users collection, vehicles collection, indexed
    queries.

Keep Next.js and Express as two separate applications in one Git
repository. Do not implement the backend endpoints as Next.js Route
Handlers; the selected architecture is a standalone Express REST API,
which fits the PDF's listed Node.js/TypeScript backend options.

### Recommended stack

  -----------------------------------------------------------------------
  Concern                 Choice                  Why
  ----------------------- ----------------------- -----------------------
  Frontend                Next.js App Router +    React-based interface
                          TypeScript              with structured routing

  Styling                 Tailwind CSS            Fast, responsive UI
                                                  development

  Backend                 Express + TypeScript    Clear REST API,
                                                  middleware and route
                                                  separation

  Database                MongoDB Atlas +         Persistent storage,
                          Mongoose                schema validation and
                                                  indexing

  Authentication          JWT + bcrypt            Meets the token-based
                                                  authentication
                                                  requirement

  Authorization           `user` / `admin` roles  Restricts delete and
                                                  restock to
                                                  administrators

  Validation              Zod                     Validates incoming
                                                  request bodies and
                                                  query parameters

  Backend tests           Vitest + Supertest      Test Express endpoints
                                                  without manually
                                                  starting a server

  Frontend tests          Vitest + React Testing  Test UI behavior from
                          Library                 the user's perspective

  Deployment              Vercel + Render, or     Separate frontend and
                          another compatible pair backend deployments
  -----------------------------------------------------------------------

### Inventory correctness

The purchase endpoint must not simply read a vehicle's quantity and
decrement it later. That approach can oversell stock when requests
overlap. Use a single conditional MongoDB update that decrements
quantity only when it is greater than zero.

For a one-day implementation, purchasing one unit per request is a
sensible assumption. Restocking accepts a positive integer quantity.

## 2. Project folder structure

``` text
car-dealership-inventory/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── config/db.ts
│   │   │   ├── models/User.ts
│   │   │   ├── models/Vehicle.ts
│   │   │   ├── middleware/authenticate.ts
│   │   │   ├── middleware/authorizeAdmin.ts
│   │   │   ├── middleware/validate.ts
│   │   │   ├── middleware/errorHandler.ts
│   │   │   ├── schemas/auth.schema.ts
│   │   │   ├── schemas/vehicle.schema.ts
│   │   │   ├── services/auth.service.ts
│   │   │   ├── services/vehicle.service.ts
│   │   │   ├── controllers/auth.controller.ts
│   │   │   ├── controllers/vehicle.controller.ts
│   │   │   ├── routes/auth.routes.ts
│   │   │   ├── routes/vehicle.routes.ts
│   │   │   ├── app.ts
│   │   │   └── server.ts
│   │   ├── scripts/seedAdmin.ts
│   │   ├── tests/auth.test.ts
│   │   ├── tests/vehicles.test.ts
│   │   ├── tests/inventory.test.ts
│   │   ├── vitest.config.ts
│   │   └── package.json
│   └── web/
│       ├── src/app/page.tsx
│       ├── src/app/login/page.tsx
│       ├── src/app/register/page.tsx
│       ├── src/app/vehicles/page.tsx
│       ├── src/app/admin/page.tsx
│       ├── src/components/Navbar.tsx
│       ├── src/components/VehicleCard.tsx
│       ├── src/components/VehicleFilters.tsx
│       ├── src/components/VehicleForm.tsx
│       ├── src/components/ConfirmDialog.tsx
│       ├── src/lib/api.ts
│       ├── src/types/vehicle.ts
│       ├── src/test/
│       ├── vitest.config.ts
│       └── package.json
├── screenshots/
├── docs/test-report.md
├── .gitignore
├── .env.example
├── package.json
├── README.md
└── PROMPTS.md
```

The exact directory names can vary, but keep the separation between
routing, business logic, database models, authentication, and tests.

## 3. One-day execution schedule

  Target time    Phase     Work
  -------------- --------- ---------------------------------------
  08:00--08:30   Phase 0   Repository and project setup
  08:30--09:15   Phase 1   MongoDB models and configuration
  09:15--10:30   Phase 2   Authentication and authorization
  10:30--12:15   Phase 3   Vehicle CRUD and search API
  12:15--13:30   Phase 4   Purchase and restock operations
  13:30--15:30   Phase 5   Responsive Next.js frontend
  15:30--16:30   Phase 6   Frontend integration and UI tests
  16:30--17:30   Phase 7   Regression, security and test report
  17:30--18:30   Phase 8   README, AI disclosure and screenshots
  18:30--20:00   Phase 9   Deployment and final verification

These are targets, not guarantees. If testing reveals defects, cut
decorative UI or deployment polish rather than security or core
inventory behavior.

## Phase 0 --- Repository and project setup

**Target:** 30 minutes.

Create the monorepo and scaffold both applications.

``` bash
mkdir car-dealership-inventory
cd car-dealership-inventory
git init
npm init -y

mkdir apps
npx create-next-app@latest apps/web --typescript --tailwind --eslint --app --src-dir --use-npm

mkdir apps/api
cd apps/api
npm init -y
npm install express mongoose dotenv cors bcryptjs jsonwebtoken zod
npm install -D typescript tsx vitest supertest @types/express @types/cors @types/jsonwebtoken @types/bcryptjs @types/supertest @types/node
npx tsc --init
cd ../..
```

Set up root scripts using npm workspaces:

``` json
{
  "name": "car-dealership-inventory",
  "private": true,
  "workspaces": ["apps/api", "apps/web"],
  "scripts": {
    "dev": "concurrently \\"npm run dev -w apps/api\\" \\"npm run dev -w apps/web\\"",
    "test": "npm run test -w apps/api && npm run test -w apps/web",
    "build": "npm run build -w apps/api && npm run build -w apps/web"
  },
  "devDependencies": {
    "concurrently": "^9.0.0"
  }
}
```

Install `concurrently` at the root with `npm install -D concurrently`.

Create `.gitignore` covering `node_modules/`, `.next/`, `dist/`, `.env`,
`.env.local`, coverage output and test artifacts.

**Initial commit**

``` bash
git add .
git commit -m "chore: scaffold Next.js and Express TypeScript monorepo

Set up the frontend, REST API workspace, and development scripts.

Co-authored-by: ChatGPT <AI@users.noreply.github.com>"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/car-dealership-inventory.git
git push -u origin main
```

Replace the repository URL with your own public GitHub repository. The
AI co-author identity above follows the PDF's example format; confirm
the appropriate identity for your actual AI tool and GitHub workflow.

## Phase 1 --- MongoDB models and configuration

**Target:** 45 minutes.

Files: - `apps/api/src/config/db.ts` - `apps/api/src/models/User.ts` -
`apps/api/src/models/Vehicle.ts` - `apps/api/src/app.ts` -
`apps/api/src/server.ts` - `.env.example`

### Vehicle model

`apps/api/src/models/Vehicle.ts`

``` ts
import { Schema, model } from "mongoose";

const vehicleSchema = new Schema(
  {
    make: {
      type: String,
      required: true,
      trim: true
    },
    model: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be an integer"
      }
    }
  },
  { timestamps: true }
);

vehicleSchema.index({ make: 1, model: 1 });
vehicleSchema.index({ category: 1, price: 1 });

export const Vehicle = model("Vehicle", vehicleSchema);
```

Mongoose creates a unique MongoDB `_id` for every document, satisfying
the unique-ID requirement. You can expose it to clients as `id`.

### User model

`apps/api/src/models/User.ts`

``` ts
import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    }
  },
  { timestamps: true }
);

userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    return ret;
  }
});

export const User = model("User", userSchema);
```

Never allow the public registration endpoint to accept `role: "admin"`.
Assign the role on the server, and use a separate trusted seed script
for your administrator account.

### Database connection

`apps/api/src/config/db.ts`

``` ts
import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }

  await mongoose.connect(uri);
  console.log("MongoDB connected");
}
```

`apps/api/src/server.ts` should load environment variables, connect to
MongoDB, and only then listen on the configured port. Keep `app.ts`
exportable without opening a network port so Supertest can exercise it
directly.

### Environment variables

`.env.example`

``` dotenv
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/car_dealership
JWT_SECRET=replace_with_a_long_random_secret
FRONTEND_URL=http://localhost:3000
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace_with_a_strong_password
```

Use MongoDB Atlas if local MongoDB is unavailable. Put real secrets in
local environment files and hosting-provider secret settings, never in
Git.

### Test-first checkpoint

Write model/configuration tests before implementation where practical.
At minimum, verify that missing database configuration fails explicitly,
invalid vehicle data is rejected, and a valid vehicle can be persisted
in a dedicated test database.

**Commit and push**

``` bash
git add apps/api .env.example
git commit -m "feat: add MongoDB configuration and core models

Define persistent user and vehicle schemas with validation and indexes.

Co-authored-by: ChatGPT <AI@users.noreply.github.com>"
git push
```

## Phase 2 --- Authentication and authorization

**Target:** 75 minutes.

Files: - `apps/api/src/schemas/auth.schema.ts` -
`apps/api/src/services/auth.service.ts` -
`apps/api/src/controllers/auth.controller.ts` -
`apps/api/src/routes/auth.routes.ts` -
`apps/api/src/middleware/authenticate.ts` -
`apps/api/src/middleware/authorizeAdmin.ts` -
`apps/api/scripts/seedAdmin.ts` - `apps/api/tests/auth.test.ts`

Required API: - `POST /api/auth/register` - `POST /api/auth/login`

Use Zod to validate the name, email, and password. Hash passwords using
bcrypt before saving. On login, compare the submitted password against
`passwordHash` and return a generic `401 Unauthorized` response for
invalid credentials.

### Authentication middleware

`apps/api/src/middleware/authenticate.ts`

``` ts
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: { id: string; role: "user" | "admin" };
}

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : undefined;

  if (!token || !process.env.JWT_SECRET) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      (payload.role !== "user" && payload.role !== "admin")
    ) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = {
      id: payload.sub,
      role: payload.role
    };

    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
```

Use a JWT with a subject identifying the user and a short, explicit
expiration, such as 30 minutes. Use `jwt.verify`, never `jwt.decode`, to
authorize requests.

### Admin authorization

`apps/api/src/middleware/authorizeAdmin.ts`

``` ts
import type { Response, NextFunction } from "express";
import type { AuthRequest } from "./authenticate";

export function authorizeAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
}
```

### Test-first checklist

-   Valid registration creates a user and hashes the password.
-   Duplicate email returns `409 Conflict`.
-   Invalid registration data returns `400 Bad Request`.
-   Valid login issues a usable JWT.
-   Incorrect credentials return `401 Unauthorized`.
-   Missing, invalid and expired tokens are rejected.
-   A regular user cannot access admin-only operations.
-   Public registration cannot grant administrator privileges.

**Security recommendation:** For this separate frontend/backend
architecture, bearer tokens are straightforward to integrate. For
production, avoid persistent `localStorage` token storage where
possible; an HttpOnly, Secure, SameSite cookie design is preferable when
its CORS, CSRF and deployment configuration is handled correctly. Do not
accidentally mix the two authentication approaches.

**Commit**

``` bash
git add apps/api
git commit -m "feat: implement JWT authentication and role authorization

Add registration, login, password hashing, token verification, and admin guards.

Co-authored-by: ChatGPT <AI@users.noreply.github.com>"
git push
```

## Phase 3 --- Vehicle CRUD and search API

**Target:** 75 minutes.

Endpoints:

  ------------------------------------------------------------------------
  Method                  Endpoint                 Access
  ----------------------- ------------------------ -----------------------
  GET                     `/api/vehicles`          Authenticated

  GET                     `/api/vehicles/search`   Authenticated

  POST                    `/api/vehicles`          Authenticated;
                                                   admin-only creation is
                                                   a recommended policy

  PUT                     `/api/vehicles/:id`      Authenticated;
                                                   admin-only editing is a
                                                   recommended policy

  DELETE                  `/api/vehicles/:id`      Admin only
  ------------------------------------------------------------------------

The PDF explicitly labels the vehicle routes protected and deletion
admin-only. It does not explicitly require add/edit to be admin-only. I
recommend enforcing admin authorization for both to prevent ordinary
users from changing dealership inventory, while making that additional
policy clear in the README.

Files: - `apps/api/src/schemas/vehicle.schema.ts` -
`apps/api/src/services/vehicle.service.ts` -
`apps/api/src/controllers/vehicle.controller.ts` -
`apps/api/src/routes/vehicle.routes.ts` -
`apps/api/tests/vehicles.test.ts`

Support search parameters:

``` text
GET /api/vehicles/search?make=Toyota
GET /api/vehicles/search?model=Corolla
GET /api/vehicles/search?category=SUV
GET /api/vehicles/search?minPrice=500000&maxPrice=1500000
GET /api/vehicles/search?make=Toyota&category=Sedan
```

Build a MongoDB filter from validated parameters. For text fields, use
escaped case-insensitive matching or normalized fields rather than
passing user-provided strings directly into regular expressions.

A representative service implementation:

``` ts
import { Vehicle } from "../models/Vehicle";

type SearchFilters = {
  make?: string;
  model?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
};

export async function searchVehicles(filters: SearchFilters) {
  const query: Record<string, unknown> = {};

  for (const key of ["make", "model", "category"] as const) {
    const value = filters[key];
    if (value) {
      query[key] = {
        $regex: value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        $options: "i"
      };
    }
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const price: Record<string, number> = {};

    if (filters.minPrice !== undefined) price.$gte = filters.minPrice;
    if (filters.maxPrice !== undefined) price.$lte = filters.maxPrice;

    query.price = price;
  }

  return Vehicle.find(query).sort({ make: 1, model: 1 }).limit(100);
}
```

Validate that prices are nonnegative and `minPrice` does not exceed
`maxPrice`. For a one-day submission, a limit of 100 is a reasonable
safeguard; production systems should support pagination.

### Test-first checklist

-   Unauthenticated requests to protected endpoints fail.
-   An admin can create a valid vehicle.
-   Missing make/model/category is rejected.
-   Negative price and negative/fractional quantity are rejected.
-   Listing returns stored vehicles.
-   Search works by make, model and category.
-   Search supports inclusive minimum/maximum price.
-   Updating a valid vehicle changes its fields.
-   Invalid MongoDB IDs return `400`, not an unhandled error.
-   Deleting as a regular user returns `403`.
-   Deleting as an admin removes the correct vehicle.
-   Updating or deleting a nonexistent vehicle returns `404`.

**Commit**

``` bash
git add apps/api
git commit -m "feat: implement protected vehicle CRUD and search

Add validated vehicle management endpoints and multi-criteria filtering.

Co-authored-by: ChatGPT <AI@users.noreply.github.com>"
git push
```

## Phase 4 --- Purchase and restock operations

**Goal:** Complete the inventory lifecycle without allowing negative
stock or unauthorized restocking.

Endpoints: - `POST /api/vehicles/:id/purchase` -
`POST /api/vehicles/:id/restock`

The purchase endpoint requires authentication. The restock endpoint
requires authentication and admin authorization.

### Purchase implementation

In `apps/api/src/services/vehicle.service.ts`:

``` ts
import { Types } from "mongoose";
import { Vehicle } from "../models/Vehicle";

export async function purchaseVehicle(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw Object.assign(new Error("Invalid vehicle ID"), {
      statusCode: 400
    });
  }

  const vehicle = await Vehicle.findOneAndUpdate(
    {
      _id: id,
      quantity: { $gt: 0 }
    },
    {
      $inc: { quantity: -1 }
    },
    {
      new: true,
      runValidators: true
    }
  );

  if (vehicle) return vehicle;

  const exists = await Vehicle.exists({ _id: id });

  if (!exists) {
    throw Object.assign(new Error("Vehicle not found"), {
      statusCode: 404
    });
  }

  throw Object.assign(new Error("Vehicle out of stock"), {
    statusCode: 409
  });
}
```

The conditional update is atomic for the vehicle document. It only
decrements stock if stock is available. The follow-up existence check
distinguishes a nonexistent vehicle from an out-of-stock vehicle; a
concurrent change may affect which error is returned, but it cannot make
this operation decrement quantity below zero.

### Restock implementation

``` ts
export async function restockVehicle(
  id: string,
  quantityToAdd: number
) {
  if (!Types.ObjectId.isValid(id)) {
    throw Object.assign(new Error("Invalid vehicle ID"), {
      statusCode: 400
    });
  }

  if (!Number.isInteger(quantityToAdd) || quantityToAdd <= 0) {
    throw Object.assign(new Error("Restock quantity must be a positive integer"), {
      statusCode: 400
    });
  }

  const vehicle = await Vehicle.findByIdAndUpdate(
    id,
    { $inc: { quantity: quantityToAdd } },
    { new: true, runValidators: true }
  );

  if (!vehicle) {
    throw Object.assign(new Error("Vehicle not found"), {
      statusCode: 404
    });
  }

  return vehicle;
}
```

Validate the request body with Zod before calling the service. Wire both
operations into the vehicle controller and routes, using the common
error handler to translate known status codes into HTTP responses.

### Test-first checklist

-   Purchase reduces quantity from 3 to 2.
-   Purchase of a vehicle with quantity 1 results in quantity 0.
-   Purchase when quantity is zero returns `409 Conflict`.
-   A missing vehicle returns `404 Not Found`.
-   Concurrent purchases never reduce quantity below zero.
-   Restock increases stock by the supplied quantity.
-   A regular user cannot restock.
-   Zero, negative and fractional restock amounts are rejected.
-   Invalid vehicle IDs are handled safely.

For the concurrency test, issue multiple purchases in parallel against a
vehicle with a small initial quantity and assert that only the available
number succeed.

**Commit**

``` bash
git add apps/api
git commit -m "feat: add atomic vehicle purchase and admin restock

Prevent overselling and validate inventory quantity adjustments.

Co-authored-by: ChatGPT <AI@users.noreply.github.com>"
git push
```

## Phase 5 --- Build the Next.js frontend

**Target:** 2 hours.

Build a clean dealership UI: dark navy navigation, white or light-gray
backgrounds, vehicle cards with prominent prices, green stock
indicators, and clear primary buttons. Use CSS/Tailwind for the layout
rather than adding an animation or component library unless time
permits.

Files:

  ----------------------------------------------------------------------------------
  File                                           Responsibility
  ---------------------------------------------- -----------------------------------
  `apps/web/src/app/page.tsx`                    Homepage/dashboard

  `apps/web/src/app/login/page.tsx`              Login form

  `apps/web/src/app/register/page.tsx`           Registration form

  `apps/web/src/app/vehicles/page.tsx`           Vehicle inventory and filters

  `apps/web/src/app/admin/page.tsx`              Admin inventory management

  `apps/web/src/components/Navbar.tsx`           Navigation and logout

  `apps/web/src/components/VehicleCard.tsx`      Vehicle details and purchase action

  `apps/web/src/components/VehicleFilters.tsx`   Search and price/category filters

  `apps/web/src/components/VehicleForm.tsx`      Add/edit vehicle form

  `apps/web/src/components/ConfirmDialog.tsx`    Delete confirmation

  `apps/web/src/lib/api.ts`                      Shared HTTP client

  `apps/web/src/types/vehicle.ts`                Frontend vehicle types
  ----------------------------------------------------------------------------------

### Frontend API client

For a straightforward first version, use bearer tokens held in
application memory and send them through a shared client. If the page
reloads, the user may need to log in again. For a more polished
experience, implement a carefully configured HttpOnly cookie-based
session instead.

`apps/web/src/lib/api.ts`:

``` ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    },
    cache: "no-store"
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.message ?? `Request failed: ${response.status}`);
  }

  return body as T;
}
```

Adapt the client to the actual API response envelope, and avoid putting
the token in React Server Component props, URLs or logs. In production,
prefer a same-site HttpOnly cookie/BFF arrangement where feasible; if
using bearer tokens, keep persistent storage risks in mind.

### Vehicle card behavior

`VehicleCard.tsx` should display: - Make, model and category. - Price
formatted in INR. - Quantity in stock. - An `Out of stock` label when
quantity is zero. - A Purchase button disabled when quantity is zero. -
Loading feedback while purchasing. - An error message if the server
rejects the purchase. - Updated quantity after successful purchase.

The client-side disabled state is a user-experience feature, not a
security control. The backend must still reject purchases when stock is
unavailable.

### Implementation order

1.  Build the inventory page using mocked data so the visual layout can
    be completed independently.
2.  Add the shared API client and connect registration/login.
3.  Replace mock data with the authenticated vehicle listing endpoint.
4.  Connect search and filters.
5.  Add purchase behavior and update inventory after success.
6.  Add admin forms for creation and editing.
7.  Add delete confirmation and restocking.
8.  Add loading, empty and error states.

**Commit**

``` bash
git add apps/web
git commit -m "feat: build responsive vehicle inventory interface

Add authentication pages, searchable vehicle cards, purchase actions, and admin UI.

Co-authored-by: ChatGPT <AI@users.noreply.github.com>"
git push
```

## Phase 6 --- Frontend integration and UI tests

**Target:** 1 hour.

Files: - `apps/web/src/test/VehicleCard.test.tsx` -
`apps/web/src/test/VehicleFilters.test.tsx` -
`apps/web/src/test/Login.test.tsx` - `apps/web/vitest.config.ts`

Install test dependencies:

``` bash
npm install -D -w apps/web vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Configure Vitest with the `jsdom` environment and a setup file importing
`@testing-library/jest-dom/vitest`.

### Example frontend test

``` tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { VehicleCard } from "../components/VehicleCard";

describe("VehicleCard", () => {
  const vehicle = {
    id: "vehicle-1",
    make: "Toyota",
    model: "Corolla",
    category: "Sedan",
    price: 1200000,
    quantity: 0
  };

  it("disables purchase when stock is zero", () => {
    render(
      <VehicleCard
        vehicle={vehicle}
        onPurchase={vi.fn()}
      />
    );

    expect(
      screen.getByRole("button", { name: /purchase/i })
    ).toBeDisabled();
  });

  it("calls purchase when the vehicle is in stock", async () => {
    const user = userEvent.setup();
    const onPurchase = vi.fn();

    render(
      <VehicleCard
        vehicle={{ ...vehicle, quantity: 2 }}
        onPurchase={onPurchase}
      />
    );

    await user.click(
      screen.getByRole("button", { name: /purchase/i })
    );

    expect(onPurchase).toHaveBeenCalledWith("vehicle-1");
  });
});
```

Adapt the props to the final component implementation.

### Manual integration checklist

-   Register a new account.
-   Log in and view the inventory.
-   Search by make and category.
-   Purchase a vehicle and verify the stock count changes.
-   Verify that out-of-stock vehicles cannot be purchased.
-   Log in as an administrator and add, edit, delete and restock a
    vehicle.
-   Verify that a regular account cannot perform admin actions.
-   Check responsive layout on desktop and mobile widths.

**Commit**

``` bash
git add apps/web
git commit -m "test: cover inventory interactions and authentication UI

Verify purchase button states, user actions, and frontend behavior.

Co-authored-by: ChatGPT <AI@users.noreply.github.com>"
git push
```

## Phase 7 --- Regression, security and test report

The PDF asks for a test report showing the results of the test suite.

### Backend test configuration

`apps/api/vitest.config.ts` should configure Vitest to run the API tests
in a Node environment. Use Supertest against the exported Express app
and a dedicated test MongoDB database. Never run tests against
production data.

For a quick, isolated test suite:

``` bash
npm install -D -w apps/api mongodb-memory-server
```

For the application itself, use MongoDB Atlas or another real MongoDB
instance outside tests; an in-memory database is not sufficient for the
application requirement.

### Run checks

``` bash
npm test
npm run build
```

Also run the API and frontend test commands separately if the root
script fails, so you can identify which workspace needs fixing.

### Final API test matrix

  Requirement          Expected result
  -------------------- ---------------------------------------------------
  Register/login       Valid data accepted; invalid credentials rejected
  Protected routes     Missing/invalid JWT returns 401
  Admin-only actions   Regular user receives 403
  Vehicle CRUD         Valid create/read/update/delete works
  Search               All required search filters work
  Purchase             Stock decrements atomically
  Out of stock         Purchase fails with 409
  Restock              Admin can increase quantity
  Validation           Invalid values return 400
  Persistence          Data remains after API restart

### Create the test report

Create `docs/test-report.md` with date/environment, commands executed,
number of tests passed/failed/skipped, coverage if generated, and known
issues.

``` markdown
# Test Report

## Environment
- Node.js: [actual version]
- Database: MongoDB [test configuration]
- Test runner: Vitest

## Commands
- `npm test`
- `npm run build`

## Results
- Backend tests: [actual result]
- Frontend tests: [actual result]
- Build: [actual result]

## Known Limitations
- [List any outstanding issues]
```

Record actual test output. Do not claim a coverage percentage or passing
result before running the tests.

**Commit**

``` bash
git add apps/api apps/web docs/test-report.md
git commit -m "test: verify authentication inventory and build regression suite

Document actual test results and address defects found during verification.

Co-authored-by: ChatGPT <AI@users.noreply.github.com>"
git push
```

## Phase 8 --- Documentation, AI disclosure and submission evidence

**Target:** 1 hour.

Required artifacts: - `README.md` - `PROMPTS.md` -
`docs/test-report.md` - `screenshots/`

### Screenshot checklist

Capture genuine screenshots of the running application: 1. Inventory
dashboard with multiple vehicles. 2. Search/filter results. 3. Login or
registration page. 4. Admin vehicle management. 5. Out-of-stock
behavior. 6. A successful purchase or restock interaction.

Reference them in the README using relative paths, for example:

``` markdown
![Inventory dashboard](screenshots/inventory-dashboard.png)
```

### PROMPTS.md

The PDF requires raw, unedited AI chat logs or public chat links, not
AI-generated summaries.

Create a root-level `PROMPTS.md` and add your actual conversation
exports or public chat links. If the chat contains secrets, remove those
secrets from your development environment and ensure none appear in the
published logs; do not fabricate a conversation or label a summary as
raw logs.

### AI co-author trailers

For every commit where AI assisted with boilerplate, tests, debugging,
or implementation, include the required co-author trailer. The PDF also
asks you to describe the tools used, what they helped with and your
reflection on the workflow.

Use truthful attribution: if you used ChatGPT for the implementation
plan and tests, describe that. If you manually reviewed and modified the
code, say so. Do not claim you wrote or verified code manually unless
you actually did.

**Documentation commit**

``` bash
git add README.md PROMPTS.md docs/test-report.md screenshots/
git commit -m "docs: complete project documentation and AI usage disclosure

Add setup instructions, screenshots, test evidence, and required prompt records.

Co-authored-by: ChatGPT <AI@users.noreply.github.com>"
git push
```

## Phase 9 --- Deployment and final verification

**Goal:** Publish the frontend and API, configure production environment
variables, and verify the deployed system.

Recommended deployment: - Frontend: Vercel. - Express API: Render or
another Node.js-compatible hosting platform. - Database: MongoDB Atlas.

Keep the API and frontend independently deployable. Configure
`NEXT_PUBLIC_API_URL` to point to the deployed API URL, and configure
the API's `FRONTEND_URL` to match the deployed frontend origin.

### Production checklist

-   Set the production `MONGODB_URI`.
-   Generate a strong, unique `JWT_SECRET`.
-   Configure CORS to allow only the frontend origin.
-   Use HTTPS.
-   Set the production administrator credentials securely.
-   Create the administrator through a trusted seed script or controlled
    administrative process.
-   Test login, listing, search, purchase, and admin actions on the live
    site.
-   Confirm that no secrets or `.env` files are in the public
    repository.
-   Add the live application and repository links to the README.

Do not expose the admin seeding endpoint publicly. The administrator
should be created through a protected operational process, not public
registration.

### Final commit

``` bash
git add .
git commit -m "chore: finalize deployment configuration and submission

Verify production settings, documentation, and final project deliverables.

Co-authored-by: ChatGPT <AI@users.noreply.github.com>"
git push
```

If deployment configuration requires no code changes, there is no need
to create an artificial commit. Record the deployment URL in the README
once it has been verified.

## 4. Make the TDD history visible in GitHub

The PDF emphasizes a clear Red--Green--Refactor pattern in the commit
history, especially for backend logic.

For authentication, use this sequence:

``` bash
# 1. Write tests first; confirm they fail for the expected reason.
git add apps/api/tests/auth.test.ts
git commit -m "test: add failing authentication endpoint tests

Define expected registration, login, and authorization behavior.

Co-authored-by: ChatGPT <AI@users.noreply.github.com>"
git push

# 2. Implement the minimum code needed to pass the tests.
git add apps/api
git commit -m "feat: implement authentication to pass endpoint tests

Add password hashing, JWT issuance, and protected route middleware.

Co-authored-by: ChatGPT <AI@users.noreply.github.com>"
git push

# 3. Refactor without changing behavior; rerun the tests.
git add apps/api
git commit -m "refactor: simplify authentication and validation logic

Improve maintainability while preserving tested behavior.

Co-authored-by: ChatGPT <AI@users.noreply.github.com>"
git push
```

Repeat the same pattern for vehicle CRUD and inventory operations. Only
use the Red commit after confirming tests fail for the intended missing
functionality, and the Green commit after they pass. A Refactor commit
should preserve behavior. Do not invent failing test results or create
misleading history.

## 5. Complete API reference

  Method   Endpoint                       Authorization                    Success
  -------- ------------------------------ -------------------------------- ----------------
  POST     `/api/auth/register`           Public                           `201`
  POST     `/api/auth/login`              Public                           `200`
  GET      `/api/vehicles`                JWT required                     `200`
  GET      `/api/vehicles/search`         JWT required                     `200`
  POST     `/api/vehicles`                JWT + recommended admin policy   `201`
  PUT      `/api/vehicles/:id`            JWT + recommended admin policy   `200`
  DELETE   `/api/vehicles/:id`            JWT + admin                      `200` or `204`
  POST     `/api/vehicles/:id/purchase`   JWT required                     `200`
  POST     `/api/vehicles/:id/restock`    JWT + admin                      `200`

Standardize error responses:

``` json
{
  "message": "Vehicle out of stock"
}
```

Use appropriate HTTP status codes: `400` for validation errors, `401`
for unauthenticated requests, `403` for insufficient permissions, `404`
for missing resources, `409` for conflicts, and `500` for unexpected
server errors.

## 6. Ready-to-adapt README.md

Use this as the repository's starting README. Replace placeholders with
real links, screenshots, commands and test results before submitting.

``` markdown
# Car Dealership Inventory System

A full-stack car dealership inventory management application built with Next.js, React, TypeScript, Express.js, and MongoDB. The application provides authenticated vehicle browsing, search and filtering, inventory updates, purchasing, and administrator-only inventory management.

## Features

- User registration and login with bcrypt password hashing and JWT authentication.
- Role-based authorization for administrator operations.
- Vehicle creation, listing, updating, deletion, and search.
- Search by make, model, category, and price range.
- Vehicle purchasing with atomic stock decrement to prevent overselling.
- Administrator-only inventory restocking.
- Responsive frontend built with Next.js and Tailwind CSS.
- Backend API tests with Vitest and Supertest.
- Frontend component tests with Vitest and React Testing Library.

## Tech Stack

**Frontend:** Next.js, React, TypeScript, Tailwind CSS

**Backend:** Node.js, Express.js, TypeScript

**Database:** MongoDB, Mongoose

**Authentication:** JWT, bcrypt

**Validation:** Zod

**Testing:** Vitest, Supertest, React Testing Library

## Architecture

The project uses a monorepo with separate frontend and backend applications.

- `apps/web` — Next.js user interface.
- `apps/api` — Express REST API, authentication, business logic, and MongoDB integration.
- `docs` — Test reports and project documentation.
- `screenshots` — Screenshots of the working application.
- `PROMPTS.md` — Raw AI conversation logs or public chat links, as required by the project specification.

## Getting Started

### Prerequisites

- Node.js and npm
- MongoDB Atlas account or a local MongoDB installation
- Git

### Installation

Clone the repository:

\`\`\`bash
git clone https://github.com/YOUR_USERNAME/car-dealership-inventory.git
cd car-dealership-inventory
npm install
\`\`\`

Configure the backend environment variables in `apps/api/.env`:

\`\`\`dotenv
PORT=4000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_random_secret
FRONTEND_URL=http://localhost:3000
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_secure_admin_password
\`\`\`

Configure `apps/web/.env.local`:

\`\`\`dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000
\`\`\`

Never commit real environment files, passwords, JWT secrets, or database credentials.

### Run the application

\`\`\`bash
npm run dev
\`\`\`

Frontend: http://localhost:3000

Backend: http://localhost:4000

If the root script is not configured, start each workspace separately using its development script.

### Administrator setup

Use the trusted administrator seed script or the documented administrative setup process. Public registration must not grant administrator privileges.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in |
| GET | `/api/vehicles` | List vehicles |
| GET | `/api/vehicles/search` | Search and filter vehicles |
| POST | `/api/vehicles` | Add a vehicle |
| PUT | `/api/vehicles/:id` | Update vehicle details |
| DELETE | `/api/vehicles/:id` | Delete a vehicle (admin) |
| POST | `/api/vehicles/:id/purchase` | Purchase a vehicle |
| POST | `/api/vehicles/:id/restock` | Restock inventory (admin) |

Protected endpoints require valid authentication. The final implementation and its authorization rules are documented in the API source.

## Testing

Run the test suite:

\`\`\`bash
npm test
\`\`\`

Run the production build:

\`\`\`bash
npm run build
\`\`\`

See [`docs/test-report.md`](docs/test-report.md) for the actual test results, build status, and known limitations.

## Screenshots

### Inventory Dashboard

![Inventory dashboard](screenshots/inventory-dashboard.png)

### Vehicle Search

![Vehicle search](screenshots/vehicle-search.png)

### Admin Inventory Management

![Admin inventory management](screenshots/admin-inventory.png)

Replace these example paths with actual screenshots captured from the completed application.

## My AI Usage

I used ChatGPT to assist with project planning, architecture decisions, implementation guidance, test design, debugging, and documentation.

AI assistance helped me break the requirements into manageable phases, identify authentication and inventory edge cases, and develop a test-first workflow. I reviewed the proposed implementation, integrated the components, ran tests, and addressed issues discovered during development.

AI was used as a development assistant rather than a substitute for verification. The final code, test results, and behavior should be reviewed and understood by the project author.

The raw AI conversation records or public chat links are maintained in [`PROMPTS.md`](PROMPTS.md).

## Development Methodology

The project follows Test-Driven Development:

1. **Red:** Write a test that describes the expected behavior and verify that it fails for the intended reason.
2. **Green:** Implement the minimum code required to pass the test.
3. **Refactor:** Improve the implementation while keeping the tests passing.

Git commits document the progression of tests, implementation, refactoring, and final verification. AI-assisted commits include the required co-author trailer.

## Deployment

Frontend: [Add deployed frontend URL]

Backend API: [Add deployed API URL]

Deployment uses environment variables for credentials and service configuration. Do not publish secrets in the repository.

## Known Limitations

Document any incomplete features, untested scenarios, or deployment limitations here.

## License

[Add the chosen license if applicable.]
```

Before publishing, update the AI Usage section to reflect exactly how AI
was used, ensure the test report contains real results, and remove or
replace screenshot placeholders if the files do not exist.

## 7. GitHub repository description and About section

Suggested repository description:

> Full-stack Car Dealership Inventory System built with Next.js,
> Express, TypeScript, and MongoDB, featuring JWT authentication,
> role-based access control, vehicle search, atomic inventory
> purchasing, admin restocking, and test-driven development.

Recommended repository topics:

`nextjs` · `express` · `typescript` · `mongodb` · `mongoose` ·
`jwt-authentication` · `vitest` · `supertest` ·
`test-driven-development`

## 8. GitHub push timeline

  Target time   Push milestone
  ------------- ----------------------------------------------------
  08:30         Project scaffolding and initial README
  09:15         MongoDB models and configuration
  10:30         Authentication tests and implementation
  12:15         Vehicle CRUD and search
  13:30         Purchase/restock tests and implementation
  15:30         Main frontend interface
  16:30         Frontend integration and component tests
  17:30         Regression fixes and test report
  18:30         README, AI disclosure, prompt logs and screenshots
  20:00         Deployment verification and final push

These are target checkpoints, not a requirement to push incomplete or
broken code. If a phase runs over, move the later checkpoints
accordingly.

For a one-day solo project, use `main` with frequent, small commits to
minimize overhead. If you prefer feature branches, use `feature/auth`,
`feature/vehicle-api`, `feature/inventory-operations`, and
`feature/frontend`, merging only after tests pass.

## 9. Final submission checklist

### Core functionality

-   Registration and login work.
-   JWT-protected endpoints reject unauthenticated requests.
-   Admin-only actions enforce roles.
-   Vehicle CRUD and all required filters work.
-   Purchasing cannot oversell stock.
-   Restocking validates positive integer quantities.

### Testing and code quality

-   Tests written before implementations for core API features.
-   Red--Green--Refactor history is genuine and visible.
-   Backend and frontend test suites run.
-   Production build succeeds.
-   Input validation and consistent error handling implemented.

### Submission

-   Public GitHub repository is accessible.
-   README includes setup instructions and screenshots.
-   My AI Usage section is truthful and complete.
-   PROMPTS.md contains raw logs or public chat links.
-   Test report records actual results.
-   No secrets or credentials are committed.
-   Live frontend and API are verified if deployed.

## Senior-developer recommendation

The strongest submission is not necessarily the one with the most
features. It is the one where every required endpoint works,
authorization is enforced on the server, stock updates are safe, tests
demonstrate the behavior, and the Git history proves how the application
was developed.

If you fall behind schedule, prioritize: 1. Authentication and
authorization. 2. Vehicle CRUD, search, purchase and restock. 3. Backend
tests and a reliable database connection. 4. Functional frontend
integration. 5. README, AI disclosure, `PROMPTS.md`, and test evidence.
6. Visual polish and deployment.

This roadmap includes important implementation patterns and key files,
but it is not a complete copy-paste implementation of every controller,
route, schema, and page. Build and verify each phase incrementally
rather than pasting the entire project at once. That will make debugging
faster and help you explain the code confidently during an evaluation.