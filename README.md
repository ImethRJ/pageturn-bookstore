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

## 🧪 Testing

### 1. Run Backend JUnit Tests
Execute backend integration tests verifying repository queries, transaction rollbacks, and controller mappings:

```bash
.\mvnw clean test
```

### 2. Run Playwright E2E Tests
To run E2E flows automating user sign-up, search, cart additions, and checkout:

1. Ensure both backend and frontend servers are running (`localhost:8080` and `localhost:5173`).
2. Run Playwright tests from the `/frontend` directory:
   ```bash
   cd frontend
   npx playwright install --with-deps
   npx playwright test
   ```

### 3. Bruno Automated API Tests
API test collections are available under the `/bruno` folder. Open Bruno and import the collection folder to manually invoke and check HTTP response codes for book creation, validation errors, and search operations.
