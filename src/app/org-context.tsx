import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Org } from '@/types'

type OrgContextValue = {
  orgs: Org[]
  currentOrg: string
  setCurrentOrg: (name: string) => void
  addOrg: (name: string, channels: string[]) => Org
}

const OrgContext = createContext<OrgContextValue | null>(null)

const INITIAL_ORGS: Org[] = [
  { id: 'spacex', name: 'SpaceX', channels: ['Web Widget', 'Inbound Voice', 'Web Call', 'Slack'] },
  { id: 'tesla', name: 'Tesla', channels: ['Web Widget', 'Email'] },
]

let seq = 0

export function OrgProvider({ children }: { children: ReactNode }) {
  const [orgs, setOrgs] = useState<Org[]>(INITIAL_ORGS)
  const [currentOrg, setCurrentOrg] = useState('SpaceX')

  const value = useMemo<OrgContextValue>(
    () => ({
      orgs,
      currentOrg,
      setCurrentOrg,
      addOrg: (name, channels) => {
        const org: Org = { id: `${name.toLowerCase().replace(/\s+/g, '-')}-${++seq}`, name, channels }
        setOrgs((prev) => [...prev, org])
        setCurrentOrg(name)
        return org
      },
    }),
    [orgs, currentOrg],
  )

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>
}

export function useOrgs() {
  const ctx = useContext(OrgContext)
  if (!ctx) throw new Error('useOrgs must be used within OrgProvider')
  return ctx
}
