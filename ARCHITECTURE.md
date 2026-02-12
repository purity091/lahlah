# 📁 Lahlah OS - Application Architecture Blueprint

## 🎯 Overview
This document outlines the recommended folder structure and architectural patterns for Lahlah OS as a professional SaaS product.

---

## 📂 Recommended Folder Structure

```
src/
├── assets/                    # Static assets (images, fonts, icons)
│   ├── icons/
│   └── images/
│
├── components/                # Reusable UI Components (Atomic Design)
│   ├── common/               # Shared low-level components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.types.ts
│   │   │   └── index.ts
│   │   ├── Modal/
│   │   ├── Input/
│   │   ├── Badge/
│   │   └── Card/
│   │
│   ├── layout/               # Layout components
│   │   ├── Sidebar/
│   │   ├── Header/
│   │   ├── MainLayout/
│   │   └── PageContainer/
│   │
│   └── features/             # Feature-specific components (not pages)
│       ├── tasks/
│       │   ├── TaskCard.tsx
│       │   ├── TaskList.tsx
│       │   └── TaskRow.tsx
│       ├── projects/
│       │   ├── ProjectCard.tsx
│       │   └── ProjectTree.tsx
│       ├── chat/
│       │   ├── ChatDrawer.tsx
│       │   └── ChatMessage.tsx
│       └── freelancers/
│           ├── FreelancerCard.tsx
│           └── FreelancerModal.tsx
│
├── pages/                     # Page-Level Components (Route Targets)
│   ├── HomePage/
│   │   ├── HomePage.tsx
│   │   ├── components/       # Page-specific sub-components
│   │   │   ├── HeroSection.tsx
│   │   │   ├── AnalyticsGrid.tsx
│   │   │   └── ConflictsSection.tsx
│   │   └── index.ts
│   │
│   ├── ProjectPage/
│   │   ├── ProjectPage.tsx
│   │   ├── components/
│   │   │   ├── ProjectHeader.tsx
│   │   │   ├── QuickAddSection.tsx
│   │   │   └── TaskSections.tsx
│   │   └── index.ts
│   │
│   ├── CalendarPage/
│   │   └── CalendarPage.tsx
│   │
│   ├── DocsPage/
│   │   ├── DocsPage.tsx
│   │   └── components/
│   │       └── PRDCard.tsx
│   │
│   ├── DiscoveryPage/
│   │   └── DiscoveryPage.tsx
│   │
│   ├── TeamPage/
│   │   └── TeamPage.tsx
│   │
│   ├── ExportPage/
│   │   ├── JiraExport.tsx
│   │   └── SheetsExport.tsx
│   │
│   └── SettingsPage/
│       └── SettingsPage.tsx
│
├── hooks/                     # Custom React Hooks
│   ├── useAuth.ts
│   ├── useProjects.ts
│   ├── useTasks.ts
│   ├── useChat.ts
│   ├── useLocalStorage.ts
│   └── useMediaRecorder.ts
│
├── services/                  # API & External Services
│   ├── api/
│   │   ├── apiClient.ts      # Base axios/fetch instance
│   │   ├── projectsApi.ts
│   │   ├── tasksApi.ts
│   │   ├── freelancersApi.ts
│   │   └── documentsApi.ts
│   ├── openaiService.ts
│   └── icsService.ts
│
├── store/                     # State Management (Context or Zustand)
│   ├── AppContext.tsx        # Global App Provider
│   ├── slices/
│   │   ├── projectsSlice.ts
│   │   ├── tasksSlice.ts
│   │   └── uiSlice.ts
│   └── index.ts
│
├── types/                     # TypeScript Type Definitions
│   ├── index.ts              # Re-export all types
│   ├── project.types.ts
│   ├── task.types.ts
│   ├── freelancer.types.ts
│   └── api.types.ts
│
├── utils/                     # Pure Utility Functions
│   ├── dateUtils.ts
│   ├── formatters.ts
│   ├── validators.ts
│   └── constants.ts
│
├── config/                    # App Configuration
│   ├── routes.ts             # Route definitions
│   ├── theme.ts              # Theme tokens
│   └── env.ts                # Environment variables
│
├── App.tsx                    # Root App Component (Router Setup)
├── index.tsx                  # Entry Point
└── index.css                  # Global Styles
```

---

## 🗺️ Page Map

| Route Path | Page Component | Description |
|------------|----------------|-------------|
| `/` | `HomePage` | Dashboard with global analytics |
| `/project/:id` | `ProjectPage` | Single project view with tasks |
| `/project/:id/calendar` | `CalendarPage` | Project calendar view |
| `/project/:id/docs` | `DocsPage` | PRD documents list |
| `/project/:id/discovery` | `DiscoveryPage` | Discovery artifacts |
| `/project/:id/team` | `TeamPage` | Freelancers management |
| `/project/:id/export` | `ExportPage` | Jira/Sheets export |
| `/settings` | `SettingsPage` | User preferences |

---

## 📝 Naming Conventions

### Files & Folders
- **Components**: `PascalCase` (e.g., `TaskCard.tsx`)
- **Hooks**: `camelCase` with `use` prefix (e.g., `useTasks.ts`)
- **Utils**: `camelCase` with descriptive suffix (e.g., `dateUtils.ts`)
- **Types**: `PascalCase` with `.types.ts` suffix

### Code
- **Interfaces**: Prefix with `I` only for service interfaces (e.g., `IApiService`)
- **Types**: Descriptive names (e.g., `TaskStatus`, `ProjectSector`)
- **Enums**: `UPPER_SNAKE_CASE` for values
- **Constants**: `UPPER_SNAKE_CASE`

---

## ✅ Best Practices Applied

1. **Single Responsibility**: Each file/component does ONE thing well
2. **Colocation**: Related code lives together (page + its components)
3. **Barrel Exports**: Use `index.ts` for clean imports
4. **Separation of Concerns**: UI ↔ Logic ↔ Data clearly separated
5. **Testability**: Pure functions in utils, hooks for logic
6. **Type Safety**: Strict TypeScript with explicit types

---

## ⚠️ Common Mistakes to Avoid

| ❌ Mistake | ✅ Solution |
|-----------|------------|
| God Components (1000+ lines) | Split into smaller focused components |
| Business logic in components | Extract to hooks or services |
| Inline styles everywhere | Use CSS modules or design tokens |
| Prop drilling > 3 levels | Use Context or state management |
| Importing from `../../../` | Use path aliases (`@/components`) |
| Mixing API calls in components | Use dedicated service layer |

---

## 🚀 Migration Strategy

### Phase 1: Foundation (Current)
- [x] Create folder structure
- [x] Set up path aliases
- [ ] Create base layout components

### Phase 2: Extract Pages
- [ ] Move HomePage logic to `pages/HomePage`
- [ ] Move ProjectPage logic to `pages/ProjectPage`
- [ ] Extract feature components

### Phase 3: State Management
- [ ] Create AppContext provider
- [ ] Migrate useState to context
- [ ] Add persistence layer

### Phase 4: Optimization
- [ ] Code splitting with lazy loading
- [ ] Performance optimization
- [ ] Add error boundaries
