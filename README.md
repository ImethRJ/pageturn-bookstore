# PageTurn Bookstore 📚

PageTurn Bookstore is a premium, full-stack web application for browsing books, managing shopping carts, placing orders, and controlling inventory. It is built using **Spring Boot 4.1.0 (Java 25)** on the backend and **React + Vite + Tailwind CSS v4** on the frontend, featuring stateful session authentication and complete Role-Based Access Control (RBAC).

---

## 🌟 Key Features

### 🔐 Security & Role-Based Access Control (RBAC)
* **Session Authentication**: Stateful session security managed via Spring Boot's built-in `HttpSession`.
* **User Portal**:
  * Browse the catalog with instant, debounced search (by title, author, or category).
  * Manage a responsive shopping cart with automatic stock availability validation.
  * Submit checkout orders with auto-bound user accounts.
  * View personal purchase history and real-time order processing status under "My Orders".
* **Admin Control Center**:
  * **Manage Books**: Search, add new books, delete books, or adjust inventory stock quantities directly from the table.
  * **Manage Orders**: Track all customer orders placed in the system with controls to complete or cancel pending orders.
  * **Manage Users**: Monitor registered reader accounts with account deletion privileges.

### 🛡️ Transactional Integrity & Resilience
* **Atomic Transactions**: The checkout service is guarded by Spring's `@Transactional` boundary. If stock checks fail mid-purchase, all DB state and book stock level deductions roll back automatically.
* **Persistent H2 Storage**: Configured with local file database persistence using H2's `AUTO_SERVER=TRUE` mode, enabling concurrent connections from both Spring Boot and external clients like IntelliJ.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Backend** | Spring Boot 4.1.0 / Java 25 | REST APIs, Transactional Service Boundaries, Stateful Sessions |
| **Database** | H2 File-based SQL DB | Database engine configured at `./data/bookstore` |
| **JPA Engine** | Spring Data JPA / Hibernate | Object-Relational Mappings (ORM) |
| **Frontend** | React / Vite | Client interface |
| **Styling** | Tailwind CSS v4 | Curated slate-dark modern theme |
| **Icons** | Lucide React | Clean, responsive vector icons |
| **E2E Testing** | Playwright | Full E2E checkout and authentication testing |
| **Unit Testing** | JUnit 5 / Spring Boot Test | Repository, Service, and Controller integration tests |

---

## 🚀 Getting Started

### Prerequisites
* **Java**: JDK 25 installed and configured (`JAVA_HOME`).
* **Node.js**: Node.js LTS (v24+) installed.

---

### Step 1: Run the Backend Server
From the project root directory, run the Spring Boot application using the Maven wrapper:

```bash
# Windows PowerShell
$env:JAVA_HOME="C:\Users\imeth\.jdks\ms-25.0.3"
.\mvnw spring-boot:run
```

The backend server will start and bind to **`http://localhost:8080`**.

#### 🗄️ Inspecting the Database
The Spring Boot web H2 console is enabled and accessible.
1. Navigate to: **`http://localhost:8080/h2-console`**
2. Enter these connection properties:
   * **JDBC URL**: `jdbc:h2:file:./data/bookstore;AUTO_SERVER=TRUE`
   * **User Name**: `sa`
   * **Password**: *(leave blank)*
3. Click **Connect** to query tables.

---

### Step 2: Run the Frontend Application
Navigate into the `frontend` folder, install dependencies, and start the Vite dev server:

```bash
cd frontend
npm install
npm run dev
```

The frontend development server will launch on **`http://localhost:5173`**. It includes a reverse proxy to transparently route all `/api/*` traffic to the backend server.

---

## 🔑 Seeding & Default Credentials

On startup, [DataLoader.java](file:///c:/productmanagement/src/main/java/com/example/productmanagement/DataLoader.java) automatically initializes database tables with categories, books, and the default Admin account:

* **Admin Username**: `admin`
* **Admin Password**: `adminpassword`

*Note: Normal users can register their own accounts directly from the login/signup interface.*

---

## 🧪 QA & Test Automation Strategy

This project follows a strict multi-tier testing strategy to ensure security boundary enforcement, data integrity, and atomic transaction behaviors.

### 🔍 QA Scenarios Covered

#### 1. Security & RBAC Guards
* **Admin Privilege Restriction**: Checks that unauthenticated sessions or normal `USER` accounts receive `403 Forbidden` errors when attempting to create/delete books, modify inventory levels, access the general order list, or manage user accounts.
* **Authentication States**: Validates that checkouts and personal order histories require active HTTP sessions, returning `401 Unauthorized` when accessed anonymously.

#### 2. Validation Boundaries
* **Empty Payload Failures**: Sends request maps missing mandatory properties (e.g. title, author, price) and asserts response returns `400 Bad Request` with structured field validation errors.
* **Category Auto-Resolution**: Verifies that when a book is created, the system checks case-insensitively for an existing category name and references it, creating a new category *only* if it is unique. This checks H2 DB unique index constraint boundaries.

#### 3. Checkout Concurrency & Transactional Rollbacks
* **Atomic Deductions**: Verifies that successful checkouts deduct stock correctly (e.g. requesting 3 Hobbit copies on a stock of 10 decreases inventory to 7).
* **Rollback Safety**: Tests checkouts containing multiple books where one book has insufficient stock. It asserts that:
  1. The checkout throws `InsufficientStockException`.
  2. The database transaction rolls back *completely* (no order records are saved, and the stock of the available book remains unmodified).

---

## 💻 Running QA Automation Suites

### 1. Integration & API Unit Tests (JUnit 5)
Run the backend test suite verifying Spring Boot controller interceptors, database integrity, and rollback transactional boundaries:

```bash
# Windows PowerShell
$env:JAVA_HOME="C:\Users\imeth\.jdks\ms-25.0.3"
.\mvnw clean test
```

### 2. End-to-End E2E Tests (Playwright)
The Playwright E2E suite simulates real reader interaction:
1. Starts the headless browser.
2. Triggers the sign-up flow to register a fresh, uniquely-named reader account.
3. Tests catalog loading, performs catalog queries, adds items to the shopping cart, and clicks checkout.
4. Asserts order confirmation cards are displayed with generated order IDs.

```bash
# Navigate to frontend folder
cd frontend

# Install Playwright dependencies (first-time only)
npx playwright install --with-deps

# Run E2E tests
npx playwright test
```

*To view the E2E HTML visual report after runs, execute: `npx playwright show-report`*

### 3. Automated API Collection (Bruno)
API testing endpoints are saved under the [/bruno](file:///c:/productmanagement/bruno) directory:
* **`Create Book - Invalid Payload.bru`**: Validates `400 Bad Request` validation outputs.
* **`Get Book - Not Found.bru`**: Validates `404 Not Found` responses.
* **`Search Books - Successful.bru`**: Validates query response formats.

**To run via Bruno CLI:**
```bash
npm install -g @usebruno/cli
bru run bruno/
```
