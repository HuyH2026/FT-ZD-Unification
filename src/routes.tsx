import type { RouteObject } from 'react-router'
import { AppLayout } from '@/app/layout/AppLayout'
import { HomeScreen } from '@/features/home/HomeScreen'
import { InsightsScreen } from '@/features/insights/InsightsScreen'
import { AiPerformancesView } from '@/features/insights/AiPerformancesView'
import { CxJourneyView } from '@/features/insights/CxJourneyView'
import { OrganizationScreen } from '@/features/organization/OrganizationScreen'
import { CreateOrgFlow } from '@/features/organization/CreateOrgFlow'
import { PlaceholderScreen } from '@/features/_placeholder/PlaceholderScreen'
import { NAV_ITEMS } from '@/app/nav-config'

const BUILT = new Set(['/', '/insights', '/organization'])

const placeholderRoutes: RouteObject[] = NAV_ITEMS
  .filter((i) => !BUILT.has(i.path))
  .map((i) => ({ path: i.path, element: <PlaceholderScreen title={i.label} /> }))

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomeScreen /> },
      {
        path: 'insights',
        element: <InsightsScreen />,
        children: [
          { index: true, element: <AiPerformancesView /> },
          { path: 'cx-journey', element: <CxJourneyView /> },
          { path: 'ai-performances', element: <AiPerformancesView /> },
        ],
      },
      { path: 'organization', element: <OrganizationScreen /> },
      { path: 'organization/new', element: <CreateOrgFlow /> },
      ...placeholderRoutes.map((r) => ({ ...r, path: r.path!.replace(/^\//, '') })),
    ],
  },
]
