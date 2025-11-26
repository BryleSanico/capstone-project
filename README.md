# 🎫 Capstone Project: Event Discovery & Ticketing

![React Native](https://img.shields.io/badge/React_Native-v0.79-blue?logo=react&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green?logo=supabase&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-Offline_Persistence-003B57?logo=sqlite&logoColor=white)
![React Query](https://img.shields.io/badge/React_Query-Server_State-ff4154?logo=react-query&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-Client_State-ff4154?logo=react-query&logoColor=white)

> **Offline-first cross-platform application for discovering events, managing tickets, and platform administration.**

---

## 📖 Project Overview

This Capstone project is a mobile application built to handle the complete event lifecycle. It bridges the gap between attendees, organizers, and administrators through a unified interface. 

**Key Engineering Highlights:**
* **Offline-First Architecture:** Uses `react-native-sqlite-storage` to cache data locally, ensuring the app works without an internet connection.
* **Smart Synchronization:** Leverages `@tanstack/react-query` with custom hydration hooks to seamlessly sync local SQLite data with the Supabase backend when online.
* **Role-Based Access Control:** Distinct flows for Users, Organizers, and Admins secured via Supabase Auth.

---

## 📱 App Screenshots

| Discover Feed | Event Details | Digital Ticket | Admin Dashboard |
|:---:|:---:|:---:|:---:|
| <img src="docs/discover.png" alt="Discover Feed" width="200"/> | <img src="docs/details.png" alt="Event Details" width="200"/> | <img src="docs/ticket.png" alt="Digital Ticket" width="200"/> | <img src="docs/admin.png" alt="Admin Dashboard" width="200"/> |

---

## 🚀 Features

### 👤 For Attendees
* **Discovery:** Search events with category filters, debounced search, and infinite scrolling.
* **Ticketing:** Seamless purchase flow, booking management, and QR code generation for entry.
* **Offline Access:** View purchased tickets and browsed events even when offline.
* **Social:** Save favorites and share events via deep links.
* **Notifications:** Push notifications for event updates and reminders.

### 📅 For Organizers
* **Event Management:** Create, edit, and manage events.
* **Media Handling:** Upload cover images directly to Supabase Storage.
* **Capacity Control:** Monitor ticket sales and close/open event availability.

### 🛡️ For Administrators
* **Dashboard:** Real-time statistics (Revenue, User count, Event count).
* **Moderation:** Approve/Reject pending events and ban/unban users.
* **Audit Logs:** Full visibility into platform activity via admin logs.

---

## 🛠 Tech Stack

### Client-Side
* **Framework:** React Native (0.79.x)
* **Language:** TypeScript
* **Navigation:** React Navigation (Stack, Bottom Tabs, Composite)
* **Server State:** `@tanstack/react-query` (Caching, Invalidation, Optimistic Updates)
* **Local State:** `Zustand` (Network connectivity & Auth session)
* **Persistence:** `react-native-sqlite-storage`
* **UI/UX:** React Native Paper, Linear Gradient, Vector Icons
* **Secured Storage:** `react-native-encrypted-storage` (Secure and Encrypted storaged for Auth token)

### Backend (Supabase)
* **Database:** PostgreSQL
* **Auth:** Supabase Auth (JWT)
* **Logic:** RPC Functions (Database) & Edge Functions (Serverless)
* **Storage:** Supabase Buckets (Assets/Images)
* **Push:** Firebase Cloud Messaging (FCM) triggered via Edge Functions

---

## 📂 Project Structure

<details>
<summary><b>Click to expand file tree</b></summary>
<br>

The project follows a flat, modular structure designed for scalability.
```
/src
 ├── /components      # Reusable UI primitives (Cards, Loaders, EmptyState)
 ├── /hooks           # React Query hooks & Logic (useTickets, useAdmin, useSync)
 ├── /navigation      # AppNavigator, TabNavigator, AdminNavigator
 ├── /screens         # Feature screens
 │    ├── /admin      # Admin-specific screens (Dashboard, Logs)
 │    └── ...         # User screens (Discover, Ticket, Profile)
 ├── /services
 │    ├── /api        # Supabase RPC & Edge Function calls
 │    └── sqliteService.ts # Local caching logic
 ├── /stores          # Zustand stores (network-store, auth-store)
 ├── /types           # TypeScript interfaces
 └── /utils           # Helpers (Formatters, Mappers, Validations)
```
</details>

## ⚡ Installation & Setup

### Prerequisites

  * Node.js ≥ 18
  * Java JDK 17
  * Android Studio (SDK Platform 34)
  * Xcode (latest) & CocoaPods

### Steps

1.  **Clone the repository**

    ```bash
    git clone [https://github.com/your-username/capstone-project.git](https://github.com/your-username/capstone-project.git)
    cd capstone-project
    ```

2.  **Install Dependencies**

    ```bash
    npm install
    cd ios && pod install && cd ..
    ```

3.  **Environment Configuration**
    Create a `.env` file in the root directory:

    ```env
    SUPABASE_URL=[https://your-project.supabase.co](https://your-project.supabase.co)
    SUPABASE_ANON_KEY=your-anon-key
    ```

4.  **Run the App**

    ```bash
    # Start Metro Bundler
    npm run start

    # Run on Android
    npm run android

    # Run on iOS
    npm run ios
    ```

### 🔧 Troubleshooting

<details>
<summary><b>Click to expand troubleshooting guide</b></summary>
<br>

#### **SQLite Issues**
> Ensure the app has finished `useEventCacheHydration` before interacting.  
> Confirm the database opens successfully and tables exist.  
> Make sure `useEventCacheHydration` runs before `SplashScreen.hide()`.

#### **Notifications**
> Verify `index.js` background handler registration and Firebase configuration.

#### **iOS Pods Issues**
> Run `pod repo update`; clean Derived Data if issues persist.

#### **Android Build Errors**
> Ensure Java 17 and Android SDK Platform 34 are installed.  
> Run `./gradlew clean`.

#### **Metro Bundler Stuck**
> Kill all Node/Metro processes and run:  
> `npm run reset`

#### **Network Monitor Not Triggering**
> Verify `network-store.subscribe()` is called inside `useNetworkMonitor`.  
> Ensure `registerReconnectCallback` is set and invoked after reconnecting.

#### **FCM Not Receiving Notifications**
> Confirm Firebase config on device, permissions, and necessary Edge Function triggers.  
> Ensure the `index.js` background handler is properly registered.

</details>

-----

## 📡 API Documentation

The app interacts with Supabase primarily through RPC calls for performance and security.

### Key Services

| Service | Description |
| :--- | :--- |
| **adminService** | Handles `approveEvent`, `banUser`, and fetches `adminStats`. |
| **eventService** | Fetches discovery lists with pagination; handles `create/update` with image upload. |
| **ticketService** | Manages `purchaseTickets` (transactional) and fetches user QR codes. |
| **sqliteService** | Handles local CRUD operations to mirror the remote DB. |

-----

## 🤝 Contributing

1.  **Branching:** Use `feature/name` or `fix/issue`.
2.  **Commits:** Follow Conventional Commits (e.g., `feat: add filter logic`).
3.  **PRs:** Include screenshots for UI changes.

### Running Tests

```bash
npm run test          # Run Jest
npm run test:coverage # Generate coverage report
npm run type-check    # TypeScript validation
```

-----
