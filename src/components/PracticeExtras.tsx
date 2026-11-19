import { type JSX, type ReactNode } from 'react'
import Challenge from './Challenge'
import type { Challenge as ChallengeData } from '../types/challenges'
import CodePlaygroundPresets, { type CodePreset } from './CodePlaygroundPresets'
import ReactDevToolsGuide from './ReactDevToolsGuide'
import PerformanceMonitor from './PerformanceMonitor'
import { Accordion, CollapsibleSection } from './ui/CollapsibleSection'

interface PracticeExtrasProps {
  challenges?: ChallengeData[]
  presets?: CodePreset[]
  day: number
  focusAreas: string[]
  /** Optional viz / demo block shown above challenges */
  lead?: ReactNode
  performanceMonitorName?: string
}

/** Shared Practice footer: challenges + collapsible code/DevTools (Day 4 look). */
export function PracticeExtras({
  challenges = [],
  presets = [],
  day,
  focusAreas,
  lead,
  performanceMonitorName,
}: PracticeExtrasProps): JSX.Element {
  return (
    <div>
      {challenges.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ margin: '0 0 12px', fontSize: '1.15rem' }}>Challenges</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
              gap: 16,
            }}
          >
            {challenges.map((challenge) => (
              <Challenge key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </div>
      )}
      {performanceMonitorName && (
        <div style={{ marginBottom: 12 }}>
          <PerformanceMonitor componentName={performanceMonitorName} />
        </div>
      )}
      <Accordion>
        {lead}
        {presets.length > 0 && (
          <CollapsibleSection title="Code examples">
            <CodePlaygroundPresets presets={presets} />
          </CollapsibleSection>
        )}
        <CollapsibleSection title="React DevTools tips">
          <ReactDevToolsGuide day={day} focusAreas={focusAreas} />
        </CollapsibleSection>
      </Accordion>
    </div>
  )
}
