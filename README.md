# Car Dealership Inventory System

A full-stack car dealership inventory management platform built with a TypeScript monorepo consisting of Express, MongoDB (Mongoose), React (Vite), and Vitest.

---

## Architecture & Technology Stack

- **Backend API**: Node.js, Express 5, TypeScript (ESM)
- **Database & ODM**: MongoDB with Mongoose
- **Validation**: Zod
- **Authentication**: JWT (JSON Web Tokens) with bcrypt password hashing
- **Testing**: Vitest, Supertest, MongoDB Memory Server

---

## Authorization Policies

All vehicle endpoints are protected by authentication (`authenticate` middleware) requiring a valid JWT Bearer token.

| Method | Endpoint | Access Level | Policy Details |
|---|---|---|---|
| `GET` | `/api/vehicles` | Authenticated (User & Admin) | View all active vehicles in dealership inventory |
| `GET` | `/api/vehicles/search` | Authenticated (User & Admin) | Filter vehicles by make, model, category, and price range |
| `GET` | `/api/vehicles/:id` | Authenticated (User & Admin) | Fetch specific vehicle details by MongoDB ObjectId |
| `POST` | `/api/vehicles` | Authenticated; **Admin Only** | Add new vehicle to dealership inventory |
| `PUT` | `/api/vehicles/:id` | Authenticated; **Admin Only** | Update existing vehicle inventory details |
| `DELETE` | `/api/vehicles/:id` | **Admin Only** | Remove vehicle from dealership inventory |

| `POST` | `/api/vehicles/:id/purchase` | Authenticated (User & Admin) | Purchase a single vehicle document atomically |
| `POST` | `/api/vehicles/:id/restock` | Authenticated; **Admin Only** | Restock vehicle inventory with a positive integer quantity |

> **Design Decision Note**: While the specification explicitly requires authentication for vehicle access and admin authorization for deletion, this system enforces **admin authorization for both creation (`POST`), editing (`PUT`), and restocking (`POST /:id/restock`)** as well. This prevents ordinary authenticated customers/users from modifying vehicle inventory, prices, or quantities, reserving inventory management exclusively to dealership administrators.

---

## Vehicle API Specification

### 1. Listing Vehicles
- **Endpoint**: `GET /api/vehicles`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` with JSON array of vehicles.

### 2. Searching Vehicles
- **Endpoint**: `GET /api/vehicles/search`
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `make` (string, case-insensitive substring match)
  - `model` (string, case-insensitive substring match)
  - `category` (string, case-insensitive substring match)
  - `minPrice` (number, inclusive lower bound, $\ge 0$)
  - `maxPrice` (number, inclusive upper bound, $\ge 0$, must be $\ge minPrice$)
- **Regex Safety**: All text inputs are escaped to prevent regex injection.
- **Example Queries**:
  - `GET /api/vehicles/search?make=Toyota`
  - `GET /api/vehicles/search?model=Corolla`
  - `GET /api/vehicles/search?category=SUV`
  - `GET /api/vehicles/search?minPrice=20000&maxPrice=35000`
  - `GET /api/vehicles/search?make=Toyota&category=Sedan`

### 3. Creating a Vehicle
- **Endpoint**: `POST /api/vehicles`
- **Headers**: `Authorization: Bearer <admin-token>`
- **Body**:
  ```json
  {
    "make": "Toyota",
    "model": "RAV4",
    "category": "SUV",
    "price": 32000,
    "quantity": 3,
    "year": 2024,
    "vin": "JTMDFRFV6RD000002",
    "status": "available"
  }
  ```
- **Validation Rules**:
  - `make`, `model`, `category` are required non-empty trimmed strings.
  - `price` must be a non-negative number ($\ge 0$).
  - `quantity` must be a non-negative integer ($\ge 0$).
  - `year` must be an integer $\ge 1900$ (defaults to current year).
  - `vin` is optional; if omitted, a unique valid 17-character VIN is auto-generated.
  - If a duplicate VIN is provided, returns `409 Conflict`.

### 4. Updating a Vehicle
- **Endpoint**: `PUT /api/vehicles/:id`
- **Headers**: `Authorization: Bearer <admin-token>`
- **Validation**:
  - `:id` must be a valid 24-hex MongoDB ObjectId (returns `400 Bad Request` if invalid).
  - Returns `404 Not Found` if the vehicle does not exist.
  - Rejects negative prices and fractional/negative quantities with `400 Bad Request`.

### 5. Deleting a Vehicle
- **Endpoint**: `DELETE /api/vehicles/:id`
- **Headers**: `Authorization: Bearer <admin-token>`
- **Behavior**:
  - Returns `403 Forbidden` if attempted by a regular user.
  - Returns `400 Bad Request` for malformed MongoDB IDs.
  - Returns `404 Not Found` if the vehicle does not exist.
  - Returns `200 OK` on successful removal.

### 6. Purchasing a Vehicle
- **Endpoint**: `POST /api/vehicles/:id/purchase`
- **Headers**: `Authorization: Bearer <token>` (User or Admin)
- **Behavior**:
  - Conditionally and atomically decrements `quantity` by 1 if `quantity > 0`.
  - Returns `200 OK` with updated vehicle.
  - Returns `409 Conflict` ("Vehicle out of stock") if stock is 0.
  - Returns `404 Not Found` if vehicle does not exist.
  - Returns `400 Bad Request` for invalid vehicle ID format.
  - Concurrency guarantees stock never drops below 0.

### 7. Restocking a Vehicle
- **Endpoint**: `POST /api/vehicles/:id/restock`
- **Headers**: `Authorization: Bearer <admin-token>`
- **Body**:
  ```json
  {
    "quantity": 5
  }
  ```
- **Behavior**:
  - Rejects regular user with `403 Forbidden` ("Admin access required").
  - Accepts `quantity` or `quantityToAdd` as positive integers.
  - Rejects zero, negative, and fractional restock amounts with `400 Bad Request`.
  - Atomically increments vehicle quantity.
  - Returns `404 Not Found` if vehicle does not exist.
  - Returns `400 Bad Request` for invalid vehicle ID.

---

## Running Tests

From `apps/api`:
```bash
npm test
```
Runs the full Vitest integration suite:
- `app.test.ts`: Core database connectivity and model validation
- `auth.test.ts`: Registration, login, password hashing, JWT verification, and admin seeding
- `vehicles.test.ts`: Vehicle CRUD, search filters, role guards, and edge cases
- `purchase-restock.test.ts`: Purchase and restock operations, atomic decrements, concurrency guards, and role protection
