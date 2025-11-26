# Capstone Project — React Native Events & Tickets App

## 1) Project Overview

A cross-platform React Native application for discovering events, saving favorites, purchasing and managing tickets, organizing events, and administering platform activity. It provides:
- Event discovery with search, category filters, and infinite scroll
- Event details with availability, purchase flow, and sharing
- User tickets (upcoming/past), QR codes, and details
- Favorites management
- Organizer tools (create/update events, manage capacity, close/open)
- Notifications center (mark read/all read, deep links to actions)
- Admin dashboard and logs (stats, moderation actions)

Focused on responsive UX, offline-aware behavior, efficient server-state synchronization, and modular architecture.

## 2) Tech Stack

- Framework
  - React Native (iOS/Android)
- Navigation
  - React Navigation (stack, bottom tabs, composite navigation)
- Data fetching and caching
  - @tanstack/react-query (QueryClientProvider, queries, mutations, invalidations)
- State management
  - Zustand stores (auth-store, event-store, my-event-store, favorites-store, network-store)
- Storage/Cache
  - @react-native-async-storage/async-storage (local persistence)
- UI/UX
  - react-native-linear-gradient, react-native-safe-area-context
  - react-native-vector-icons (Ionicons, FontAwesome)
  - react-native-paper (Provider)
  - Custom components (ScreenHeader, TabSelector, Cards, EmptyState, Loaders, Snackbar)
- Networking/Monitoring
  - Custom services under src/services/api/*
  - Network monitor hook and snackbar
- Utilities
  - Date/time/relative formatters, validations, cache utils, UI config
- QR/Media
  - react-native-qrcode-svg (ticket QR)
- Backend (Supabase-first)
  - @supabase/supabase-js for:
    - Authentication (email/password, token handling via auth-store)
    - Postgres (SQL tables, views)
    - Storage Buckets (event images, uploads via useImagePicker)
    - RPC Functions (Postgres functions used via supabase-js)
    - Edge Functions (serverless logic for notifications/workflows)
    - Supabase CLI (manage functions, migrations)
- Push Notifications
  - Firebase Cloud Messaging (FCM) via @react-native-firebase/messaging
  - Edge Functions to trigger push notifications, integrated with Supabase/FCM
- Build/Dev
  - Metro bundler, Android SDK/Gradle, Xcode/CocoaPods
- Testing (coverage artifacts present)
  - Jest + Testing Library + Istanbul (coverage/lcov-report)

## 3) Project Structure

High-level (not exhaustive):

```
/App.tsx
/src
  /components
    /LazyLoaders
      loader.tsx
      loaderSearch.tsx
    /navigation
      TabSelector.tsx
    /ui
      /Cards
        EventCard.tsx
        MyEventCard.tsx
        StatCard.tsx
        RecentLogsCard.tsx
      /Errors
        EmptyState.tsx
        offlineState.tsx
      /ScreenHeader.tsx
      /SnackBars
        NetworkSnackbar.tsx
  /hooks
    useTickets.ts
    useFavorites.ts
    useNotifications.ts
    useAdmin.tsx
    useEventSubscription.ts
    useEventCacheHydration.ts
    useNetworkMonitor.ts
    useUserDataSync.ts
    useDateTimePicker.ts
    useImagePicker.ts
    useDebounce.ts
  /navigation
    AppNavigator.tsx
    TabNavigator.tsx
    AdminNavigator.tsx
  /screens
    DiscoverScreen.tsx
    EventDetailsScreen.tsx
    EventFormScreen.tsx
    FavoritesScreen.tsx
    LoginScreen.tsx
    MyEventsScreen.tsx
    NotificationScreen.tsx
    ProfileScreen.tsx
    RegisterScreen.tsx
    TicketDetailsScreen.tsx
    TicketScreen.tsx
    /admin
      AdminDashboardScreen.tsx
      AdminLogsScreen.tsx
  /services
    /api
      adminService.ts
      eventService.ts
      notificationService.ts
      ticketService.ts
  /stores
    auth-store.ts
    event-store.ts
    favorites-store.ts
    my-event-store.ts
    network-store.ts
  /types
    event.ts
    menu.ts
    TabSegment.ts
    user.ts
    admin.ts
    navigation.ts
  /utils
    /formatters
      dateFormatter.ts
      relativeTimeFormatter.ts
    /domain
      filterUtils.ts
    /validations
      eventValidation.ts
    /cache
      searchCache.ts
    /ui
      iconLoader.ts
      adminLogConfig.ts
```

Folder responsibilities:
- src/components: Reusable UI primitives (cards, headers, empty states, loaders, snackbar) and shared navigation components (TabSelector).
- src/hooks: Custom hooks:
  - Data hooks: useTicketsQuery, useFavoritesQuery, useNotificationsQuery/useMarkReadMutation/useMarkAllReadMutation, useAdmin* (stats, logs, users).
  - Cross-cutting: network monitor, user sync, cache hydration, subscriptions, pickers, debounce.
- src/navigation: AppNavigator (main), TabNavigator, AdminNavigator (admin-only flow).
- src/screens: Feature screens. Admin screens in src/screens/admin.
- src/services/api: Thin API clients encapsulating calls (Supabase/Postgres/RPC/Edge/REST abstractions).
- src/stores: Zustand stores for app-local state (auth, events cache/pagination, favorites, organizer workflow, network).
- src/types: TS models and route param lists.
- src/utils: Formatting, filtering, validations, caching helpers, and UI configs.

How modules interact:
- Screens -> hooks (React Query or stores) -> services/api (Supabase/Postgres/RPC/Edge) and/or stores (local state).
- React Query manages server-state; Zustand holds app-local/UI state.
- Cache hydration and network monitor run in App bootstrap (App.tsx) to keep data fresh and UX resilient.

### Phase 1: Flat Structure (Recommended Start)
Perfect for: New projects, MVPs, small teams, learning

Flat Structure Benefits:
- Simple to understand and navigate
- Fast development for small teams
- Easy refactoring when starting out
- Minimal cognitive overhead
- Perfect for Expo Router file-based routing

## 4) Installation & Setup

Prerequisites (for React Native 0.79.x):
- Node.js ≥ 18
- npm ≥ 9
- Java JDK 17 (required by Gradle/Android builds)
- Android SDK
  - minSdkVersion: 24
  - targetSdkVersion: 34
  - Build tools: 34.x
- Android Studio (latest) with SDK Platform 34
- Xcode (latest) + CocoaPods
- Watchman (macOS recommended)

Clone and install:
```bash
git clone <your-repo-url>.git
cd capstone-project
npm install
```

iOS pods:
```bash
cd ios && pod install && cd ..
```

Environment variables (dotenv with react-native-dotenv):
- Place secrets and endpoints in a `.env` file at the project root.
- Access them via `react-native-dotenv` in the app code.

Example `.env`:
```
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
FIREBASE_MESSAGING_SENDER_ID=xxxxxxxxxxxx
FIREBASE_PROJECT_ID=your-firebase-project
FIREBASE_APP_ID=1:xxxxxxxxxxxx:android:xxxxxxxxxxxxxxxx
API_BASE_URL=https://your.api.base
```

Running (Metro + device):
```bash
# Start Metro
npm run start

# In another terminal:
npm run android
npm run ios
```

Useful scripts:
```bash
npm run reset         # metro reset-cache
npm run format        # prettier write
npm run format:check  # prettier check
npm run type-check    # TS noEmit
npm run test          # jest
npm run test:watch
npm run test:coverage
```

Build for production:
- Android: Configure signing, then assemble release via Gradle (Android Studio or CLI).
- iOS: Archive via Xcode with proper signing.

## 5) Usage

- Launch the app on a simulator or device.
- Navigate via bottom tabs:
  - Discover: Browse/search events by category; infinite scroll; pull-to-refresh.
  - Favorites: Your saved events.
  - My Events: Organizer tools (create, edit, delete, review status).
  - My Tickets: Purchased tickets with Upcoming/Past tabs; pull-to-refresh.
  - Notifications: System updates; mark read / mark all read.
  - Profile: Account actions and stats.
- Admin users (admin/super_admin) are routed to the AdminNavigator (dashboard, logs).

Common workflows:
- Discover -> Event Details -> Buy Tickets -> My Tickets
- Organizer: Profile -> My Events -> Create/Edit -> Submit -> Pending/Approved
- Admin: Dashboard -> Review stats -> View recent logs -> Navigate to Admin Logs

## 6) Features Breakdown

Key Screens/Flows:
- DiscoverScreen
  - Uses event-store for cache/pagination and searchCache for local search.
  - Debounced query; falls back to network search when local empty and online.
  - Infinite scroll, pull-to-refresh, offline state handling.
- EventDetailsScreen
  - useEventByIdQuery (React Query) + useEventSubscription for real-time invalidation.
  - Favorite toggle via useFavoritesQuery/useAddFavorite/useRemoveFavorite.
  - Ticket purchase guarded by availability, limit per user, and event status flags.
  - Share via native Share API.
- EventFormScreen (Organizer)
  - Create/Edit with validations (eventValidation), date/time and image pickers.
  - Uses my-event-store methods; supports status toggling (close/open).
  - Uploads cover images to Supabase Storage buckets via picker flow.
- MyEventsScreen
  - Organizer event management with TabSelector for upcoming/past (filterUtils).
  - Edit/Delete with confirmation flows.
- TicketScreen
  - useTicketsQuery; TabSelector for upcoming/past; pull-to-refresh via refetch.
  - TicketCard list; EmptyState variants.
- TicketDetailsScreen
  - useTicketsQuery; QRCode rendering; formatted date/time; Loader during fetch.
- NotificationScreen
  - useNotificationsQuery; mark read/mark all read mutations; deep-links (e.g., navigate to EventForm on rejection).
- ProfileScreen
  - Uses useAuth and pulls user data; integrates favorites/tickets queries for counters.
- AdminDashboardScreen
  - useAdminStats and useAdminLogs; StatCard + RecentLogsCard; pull-to-refresh.
- AdminLogsScreen
  - useAdminLogs; parse details and reason; EmptyState when no logs.

Core Hooks/Utilities:
- useAdmin.tsx
  - Queries: stats, pending events, logs, users (infinite)
  - Mutations: approve/reject event, update role, ban/unban user
  - Invalidates related query keys on success; shows Alerts on outcomes
- useNotifications.ts
  - Fetch notifications; mark single/all read
- useTickets.ts, useFavorites.ts
  - Ticket and favorite event queries
- useEventCacheHydration, useNetworkMonitor, useUserDataSync
  - App bootstrap, offline awareness, background sync
- filterUtils.ts
  - Split collections into upcoming/past by timestamp
- dateFormatter, relativeTimeFormatter
  - Consistent human-readable dates/times
- searchCache.ts
  - Local cache search for instant results
- adminLogConfig.ts, iconLoader.ts
  - UI helpers

Push Notifications:
- @react-native-firebase/messaging for device registration and receiving notifications.
- Supabase Edge Functions used to trigger FCM notifications for specific events (e.g., moderation decisions, ticket updates).

Supabase:
- Authentication handled in auth-store using supabase-js.
- Postgres database for events, tickets, favorites, notifications, users.
- RPC functions to encapsulate complex server-side operations (called via supabase-js).
- Storage Buckets for event images (upload via useImagePicker and service layer).
- Edge Functions for async workflows (e.g., push notifications), and integrated with admin actions.

UI Components:
- ScreenHeader: Gradient title/subtitle with right-content slot
- TabSelector: Segmented control with counts
- EmptyState: Icon + messaging; optional action
- Cards: EventCard, MyEventCard, StatCard, RecentLogsCard
- Loaders: Fullscreen and list footer loaders
- NetworkSnackbar: Online/offline feedback

## 7) Architecture Overview

- App Bootstrap (App.tsx)
  - QueryClientProvider provides React Query context
  - PaperProvider and GestureHandlerRootView wrap the app
  - useEventCacheHydration prepares local caches before splash hides
  - useNetworkMonitor + NetworkSnackbar for live connectivity feedback
  - useUserDataSync performs background syncs after hydration
  - Auth store determines role; routes admin to AdminNavigator

- Navigation
  - AppNavigator (main app) and TabNavigator
  - AdminNavigator for admin/super_admin roles (AdminTabs, AdminLogs, EventDetails)

- State Layers
  - Server state: React Query hooks (tickets, favorites, notifications, admin)
  - Client state: Zustand (auth, events cache, favorites cache, organizer state)
  - Local persistence: AsyncStorage (hydration and resilience offline)

- Data Flow (example)
  - UI (TicketScreen) -> useTicketsQuery (React Query) -> ticketService (Supabase/Postgres/RPC) -> caches in QueryClient
  - UI (DiscoverScreen) -> event-store (Zustand) for cached pagination + searchCache -> synchronization via services
  - UI (AdminLogsScreen) -> useAdminLogs -> adminService -> list with EmptyState fallback
  - Edge Functions -> FCM -> device receives notifications via Firebase messaging

- Patterns
  - Hooks-first composition (side effects, queries, mutations)
  - Thin service layer encapsulating Supabase interactions (auth, Postgres, RPC, Storage) and Edge workflows
  - Presentational components decoupled from data hooks for reuse

## 8) API Documentation (High-level)

Backed by Supabase:
- Postgres tables and RPC functions exposed via @supabase/supabase-js
- Edge Functions for serverless logic (notifications, moderation flows)

adminService (via Supabase RPC/queries)
- Stats: total_users, total_revenue, pending_events, total_events
- Logs: AdminLog[]
- Pending events: Event[]
- Users (paginated): pageParam, limit, query
- Actions:
  - approveEvent(id)
  - rejectEvent(id, reason, hardDelete)
  - updateUserRole(email, role)
  - banUser(email, banUntil)

notificationService
- Notifications list
- markRead(id)
- markAllRead()

ticketService
- Tickets list
- Ticket details
- purchaseTickets({ eventId, quantity, ... })

eventService
- Events list (query/category, pagination)
- Event by ID
- create/update/delete event
- Upload image to Supabase Storage bucket during create/update flows

Authentication
- Supabase auth (tokens managed in auth-store)
- Protected operations: admin actions, organizer create/update/delete, purchase

Error Handling
- React Query: isError/error
- Mutations: Alert on error in useAdmin mutations
- UI: EmptyState and OfflineState fallbacks

## 9) Best Practices & Design Decisions

- React Query for server-state:
  - Normalizes fetching, caching, invalidation, background refetches
- Zustand for client/UI state:
  - Lightweight, explicit local caches and flows (events pagination, auth)
- Supabase-centric backend:
  - Postgres + RPC for reliable, typed data access
  - Storage buckets for assets
  - Edge Functions for triggers and notifications
- Offline resilience:
  - AsyncStorage hydration and network monitoring
- UX polish:
  - Gradients, loaders, empty states, pull-to-refresh and infinite list patterns

## 10) Contributing

Branching
- main: stable
- feature/*: new features
- fix/*: bugfixes
- chore/*: maintenance

Code Style
- TypeScript strictness where possible
- Prefer hooks and small components
- Keep services thin and typed

Commits
- Conventional style (feat:, fix:, chore:, refactor:, docs:)

PRs
- Include screenshots/gifs for UI changes
- Describe scope and testing steps

## 11) License

MIT (update as needed).

---
Troubleshooting:
- iOS pods issues: `pod repo update`; clean derived data
- Android build: ensure Java 17 and Android SDK Platform 34; run `./gradlew clean`
- Metro stuck: kill node/metro; `npm run reset`
- Env not loaded: ensure `.env` exists and `react-native-dotenv` is configured
- FCM not receiving: confirm Firebase config on device, notification permissions, and Edge Function triggers
