# Feature Flags Usage Guide

## How to Use

### 1. Check if Feature is Enabled

```typescript
import { isFeatureEnabled } from './lib/featureFlags'

if (isFeatureEnabled('WEEK_2_ENABLED')) {
  // Show Week 2 content
}
```

### 2. Conditional Rendering

```typescript
import { FeatureFlag } from './lib/featureFlags'

<FeatureFlag flag="VIDEO_EXPLANATIONS">
  <VideoPlayer src={videoUrl} />
</FeatureFlag>
```

### 3. In Components

```typescript
import { featureFlags } from './lib/featureFlags'

function Sidebar() {
  return (
    <div>
      <Week1 />
      {featureFlags.WEEK_2_ENABLED && <Week2 />}
      {featureFlags.WEEK_3_ENABLED && <Week3 />}
      {featureFlags.WEEK_4_ENABLED && <Week4 />}
    </div>
  )
}
```

## Examples

### Hide Incomplete Content

```typescript
// In Sidebar
{featureFlags.WEEK_2_ENABLED ? (
  <WeekLink week={2} />
) : (
  <ComingSoonBadge>Week 2 - Coming Soon</ComingSoonBadge>
)}
```

### Premium Features

```typescript
// In Exercise
{featureFlags.VIDEO_EXPLANATIONS && (
  <VideoSection>
    <h3>Video Explanation</h3>
    <VideoPlayer />
  </VideoSection>
)}
```

### A/B Testing

```typescript
// Test new landing page
{featureFlags.NEW_LANDING_PAGE ? (
  <NewLandingPage />
) : (
  <CurrentLandingPage />
)}
```

### Gradual Rollout

```typescript
// Enable for 10% of users
const userPercentage = getUserId() % 100
const showNewFeature = userPercentage < 10 && featureFlags.EXPERIMENTAL_FEATURE

{showNewFeature && <NewFeature />}
```

## Enabling Features

### Development

Features are auto-enabled in dev mode (see `devFlags` in featureFlags.ts)

### Production

Update `defaultFlags` in `src/lib/featureFlags.ts`:

```typescript
const defaultFlags: FeatureFlags = {
  WEEK_2_ENABLED: true,  // ← Change to true
  // ...
}
```

### Remote Config (Future)

Later, you can fetch flags from a backend:

```typescript
async function getFlags(): Promise<FeatureFlags> {
  const remote = await fetch('/api/feature-flags')
  const remoteFlags = await remote.json()
  return { ...defaultFlags, ...remoteFlags }
}
```

## Common Patterns

### Coming Soon Badge

```typescript
function WeekCard({ week }: { week: number }) {
  const enabled = featureFlags[`WEEK_${week}_ENABLED`]
  
  return (
    <div className={enabled ? 'available' : 'locked'}>
      <h3>Week {week}</h3>
      {!enabled && <Badge>Coming Soon</Badge>}
    </div>
  )
}
```

### Premium Upsell

```typescript
{!featureFlags.VIDEO_CONTENT && (
  <UpgradePrompt>
    Video explanations coming soon!
    <button>Join Waitlist</button>
  </UpgradePrompt>
)}
```

### Beta Features

```typescript
{featureFlags.AI_TUTOR && (
  <BetaBadge>
    <AITutor />
    <span>Beta Feature</span>
  </BetaBadge>
)}
```

## Benefits

✅ **Launch incomplete features** - Show "Coming Soon"
✅ **A/B test** - Try different designs
✅ **Gradual rollout** - Enable for subset of users
✅ **Kill switch** - Disable broken features instantly
✅ **Premium tiers** - Gate features behind paywall
✅ **Development** - Test features before launch

## Best Practices

1. **Default to false** - New features start disabled
2. **Document why** - Comment why flag exists
3. **Clean up** - Remove flags when feature is stable
4. **Don't overuse** - Too many flags = complexity
5. **Test both states** - Ensure app works with flag on/off

## When to Use

✅ **Use flags for:**
- Incomplete features
- Experimental features
- Premium features
- A/B tests
- Gradual rollouts

❌ **Don't use flags for:**
- Bug fixes
- Small UI tweaks
- Refactoring
- Performance improvements

## Cleanup

When a feature is stable and enabled for everyone:

1. Remove the flag from `FeatureFlags` interface
2. Remove conditional checks
3. Make feature always visible
4. Deploy

Example:
```typescript
// Before
{featureFlags.WEEK_2_ENABLED && <Week2 />}

// After (flag removed)
<Week2 />
```
