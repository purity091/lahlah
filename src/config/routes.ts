/**
 * Route configuration for the application.
 * Centralized place for all route definitions.
 */

export const ROUTES = {
    HOME: '/',
    PROJECT: '/project/:id',
    PROJECT_CALENDAR: '/project/:id/calendar',
    PROJECT_DOCS: '/project/:id/docs',
    PROJECT_DISCOVERY: '/project/:id/discovery',
    PROJECT_TEAM: '/project/:id/team',
    PROJECT_EXPORT: '/project/:id/export',
    SETTINGS: '/settings',
} as const;

// Helper to generate dynamic routes
export const getProjectRoute = (projectId: string) => `/project/${projectId}`;
export const getProjectCalendarRoute = (projectId: string) => `/project/${projectId}/calendar`;
export const getProjectDocsRoute = (projectId: string) => `/project/${projectId}/docs`;
export const getProjectDiscoveryRoute = (projectId: string) => `/project/${projectId}/discovery`;
export const getProjectTeamRoute = (projectId: string) => `/project/${projectId}/team`;
export const getProjectExportRoute = (projectId: string) => `/project/${projectId}/export`;

// View types for internal state management (when not using full routing)
export type ViewType = 'tasks' | 'calendar' | 'docs' | 'discovery' | 'export' | 'sheets' | 'team';

export const VIEW_LABELS: Record<ViewType, string> = {
    tasks: 'المهمات',
    calendar: 'الجدول',
    docs: 'الوثائق',
    discovery: 'الاستكشاف',
    export: 'تصدير Jira',
    sheets: 'Google Sheets',
    team: 'الفريق',
};
