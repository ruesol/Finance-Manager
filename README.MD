# 📁 Personal Finance Manager - Project Plan

## 1. 🧠 Core Domain 

* **Domain Components**:
    * `Transaction`
    * `Category`
    * `User`
    * `Account`
    * `Budget`
    * `Interfaces` (CLI, Web UI)
    * Database Schema
    * Mock Data
    * Logging
    * Authentication & Authorization
    * Testing Framework
    * Notifications
    * Integration with Banking APIs
    * Security
    * Analytics
    * Data Import/Export
    * Extensions

* **Business Rules **:
    * `AccountTemplate` : For a quicker account setup (e.g. "Savings", "Debit Card").: 
    * `CategorizeTransaction`: Logic to assign a category (e.g. regex or basic ML).
    * `ReconcileBankData`: Algorithm to avoid duplicates when downloading data from the bank.
    * `CalculateNetWorth`: Aggregate sum of all assets minus liabilities.

## 2. 🔌 Ports (Le Interfacce / Contratti)
*Qui definisco COSA serve al Core per funzionare, ma non COME lo fa. In TypeScript/Go queste sono `interfaces`.*

* **Repository Ports (Output)**:
    * `TransactionRepository`: Metodi `save()`, `findByDate()`, `getSummary()`.
    * `AccountRepository`: Metodi `updateBalance()`.
* **Service Ports (Output)**:
    * `BankingProvider`: Interfaccia generica per scaricare dati (metodo `fetchTransactions()`).
    * `NotificationService`: Interfaccia per inviare alert (Email, Telegram, etc.).
    * `Logger`: Interfaccia per i log.

## 3. 🧩 Adapters (Le Implementazioni "Pluggable")
*Qui decido le tecnologie reali. Posso averne più di una per la stessa porta.*

* **Infrastructure Adapters (Driven)**:
    * `PostgresAdapter` (implementa `TransactionRepository`).
    * `GoCardlessAdapter` (implementa `BankingProvider` usando API vere).
    * `MockBankAdapter` (implementa `BankingProvider` con dati finti per testare senza internet).
    * `ZapierAdapter` (implementa `Logger` o `Notification` per estendibilità).
* **Primary Adapters (Driving - Chi guida l'app)**:
    * `REST API` (Controller che ricevono JSON e chiamano i Use Cases).
    * `CLI` (Comandi da terminale per importare dati manualmente).
    * `ExtensionRuntime` (Il sistema che permetterà agli utenti di eseguire script).

## 4. 💻 Frontend (React - "Headless" approach)
*Poiché vuoi la UI pluggable, separiamo la logica visuale dallo stato.*

* **State & Logic Layer (Hooks/Context)**:
    * `useTransactions()`: Hook che chiama le API.
    * `AuthProvider`: Gestione sessione.
* **UI Component Layer (Design System)**:
    * *Core Components*: Bottoni, Input, Tabelle (usando shadcn/ui).
    * *Pluggable Views*:
        * `StandardDashboard`: Vista classica a tabelle.
        * `GraphDashboard`: Vista visuale con grafici a torta.
        * `MobileView`: Vista semplificata.

## 5. 🛠 DevOps & Tooling
* **Container**: Dockerfile multistage.
* **CI/CD**: GitHub Actions (Linting, Testing, Build).
* **Docs**: Swagger/OpenAPI (generato dal codice).