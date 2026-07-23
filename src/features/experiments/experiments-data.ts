// Mock data + types for the Experiments A/B Test screen. Values are exact from
// Figma frame 747:86296 (no backend).

export type ABMetric = {
  key: string
  label: string
  value: string        // "5", "55,987", "41,312", "4.1"
  sub?: string         // secondary figure beside the value ("80%")
  accent?: 'green'     // render the value in green (CSAT)
}

export type ExperimentStatus = 'not-started' | 'running' | 'completed' | 'canceled'

export type Experiment = {
  id: string
  name: string
  status: ExperimentStatus
  intent: string
  description: string
  splits: number[]     // traffic split percentages, e.g. [50, 50] or [33, 33, 33]
}

export const METRICS: ABMetric[] = [
  { key: 'tests', label: 'Total Tests', value: '5' },
  { key: 'conversations', label: 'Total conversations', value: '55,987' },
  { key: 'resolutions', label: 'Resolutions', value: '41,312', sub: '80%' },
  { key: 'csat', label: 'CSAT', value: '4.1', accent: 'green' },
]

export const EXPERIMENTS: Experiment[] = [
  {
    id: 'e1',
    name: 'Test',
    status: 'not-started',
    intent: 'Log in troubleshooting',
    description: 'Explore which login experience leads to the highest conversion.',
    splits: [50, 50],
  },
  {
    id: 'e2',
    name: 'Abandoned Cart Recovery',
    status: 'running',
    intent: 'Call users with abandoned carts',
    description:
      'Explore which outbound calls experience leads to the highest user satisfaction.',
    splits: [33, 33, 33],
  },
  {
    id: 'e3',
    name: 'Conversation recap strategy',
    status: 'completed',
    intent: 'Update shipping address',
    description: 'Explore which login experience leads to the highest CSAT rating.',
    splits: [33, 33, 33],
  },
  {
    id: 'e4',
    name: 'Self Service Checkout',
    status: 'completed',
    intent: 'Update Billing address',
    description: 'Test emails for the highest user satisfaction.',
    splits: [50, 50],
  },
  {
    id: 'e5',
    name: 'Guided Troubleshoot Flow',
    status: 'canceled',
    intent: 'Replacement Card',
    description: 'Explore which login experience leads to the best customer retention.',
    splits: [50, 30, 20],
  },
]
