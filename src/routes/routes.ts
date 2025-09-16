/**
 * Route configuration
 */

import { RosterSetupRoute } from '@/routes/index';
import { MainDashboardRoute } from '@/routes/index';
import { ClosingOutRoute } from '@/routes/index';
import { TodosPageRoute } from '@/routes/index';
import { TotalStatsRoute } from '@/routes/index';
import { AdminDashboardRoute } from '@/routes/index';

export const routes = {
  'roster-setup': RosterSetupRoute,
  'daily-operations': MainDashboardRoute,
  'closing-out': ClosingOutRoute,
  'todos': TodosPageRoute,
  'total-stats': TotalStatsRoute,
  'admin-dashboard': AdminDashboardRoute,
} as const;

export type RouteKey = keyof typeof routes;
