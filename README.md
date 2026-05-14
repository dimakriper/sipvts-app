# Technology Stack Decision Support System

A fullstack web application for analyzing GitHub repositories, evaluating software technologies, and supporting technology stack selection using multi-criteria decision-making methods (AHP+).

Built with Nuxt 4, Vue 3, TypeScript, Nuxt UI, Pinia, and MongoDB.

---

# Features

- GitHub repository analysis
- Dependency and package inspection
- Technology stack comparison
- Multi-criteria evaluation using AHP+
- Interactive charts and analytics
- Repository metrics aggregation
- Reactive UI with real-time updates
- REST API backend
- MongoDB persistence layer

---

# Tech Stack

## Frontend

- Nuxt 4
- Vue 3
- TypeScript
- Nuxt UI
- Pinia
- Chart.js

## Backend

- Nuxt Server API (Nitro)
- REST API
- MongoDB
- Mongoose

## External Services

- GitHub REST API

---

# Project Architecture

The project follows a modern fullstack Nuxt architecture using:

- MVVM pattern
- Backend-for-Frontend (BFF)
- Service Layer architecture
- Component-based UI architecture
- Centralized state management

---

# High-Level Architecture

```text
Client UI (Nuxt UI Components)
            │
            ▼
Vue Pages / Components
            │
            ▼
Pinia Store + Composables
            │
            ▼
Nuxt Server API (BFF)
            │
    ┌───────┴────────┐
    ▼                ▼
GitHub API       MongoDB