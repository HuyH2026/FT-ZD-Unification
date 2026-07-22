import type { RouteObject } from 'react-router'
import { Navigate } from 'react-router'
import { RootLayout } from '@/app/layout/RootLayout'
import { AppLayout } from '@/app/layout/AppLayout'
import { HomeScreen } from '@/features/home/HomeScreen'
import { InsightsScreen } from '@/features/insights/InsightsScreen'
import { AiPerformancesView } from '@/features/insights/AiPerformancesView'
import { CxJourneyView } from '@/features/insights/cx-journey/CxJourneyView'
import { AiAgentsScreen } from '@/features/ai-agents/AiAgentsScreen'
import { AgentBuilderScreen } from '@/features/ai-agents/AgentBuilderScreen'
import { ConfigurationView } from '@/features/ai-agents/configuration/ConfigurationView'
import { OrganizationScreen } from '@/features/organization/OrganizationScreen'
import { CreateOrgFlow } from '@/features/organization/CreateOrgFlow'
import { OrchestratorScreen } from '@/features/orchestrator/OrchestratorScreen'
import { PlaceholderScreen } from '@/features/_placeholder/PlaceholderScreen'
import { NAV_ITEMS } from '@/app/nav-config'

const BUILT = new Set(['/', '/insights', '/organization', '/ai-agents', '/orchestrator'])

const placeholderRoutes: RouteObject[] = NAV_ITEMS
  .filter((i) => !BUILT.has(i.path))
  .map((i) => ({ path: i.path.replace(/^\//, ''), element: <PlaceholderScreen title={i.label} /> }))

export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    children: [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          { index: true, element: <HomeScreen /> },
          {
            path: 'insights',
            element: <InsightsScreen />,
            children: [
              { index: true, element: <Navigate to="cx-journey" replace /> },
              { path: 'cx-journey', element: <CxJourneyView /> },
              { path: 'ai-performances', element: <AiPerformancesView /> },
            ],
          },
          {
            path: 'ai-agents',
            element: <AiAgentsScreen />,
            children: [
              { index: true, element: <AgentBuilderScreen /> },
              { path: 'configuration', element: <ConfigurationView /> },
              { path: 'agent-builder', element: <AgentBuilderScreen /> },
              { path: 'qa', element: <PlaceholderScreen title="QA" /> },
            ],
          },
          { path: 'organization', element: <OrganizationScreen /> },
          { path: 'orchestrator', element: <OrchestratorScreen /> },
          ...placeholderRoutes,
        ],
      },
      { path: '/organization/new', element: <CreateOrgFlow /> },
    ],
  },
]
