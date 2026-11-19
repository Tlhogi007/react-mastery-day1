import { type JSX } from 'react'
import { getAllCommunityContent, type CommunityContent } from '../lib/contentLoader'
import { CommunityAttribution } from './CommunityAttribution'

function pickFeatured(all: CommunityContent[], limit = 3): CommunityContent[] {
  const tagged = all.filter((c) => c.tags.some((t) => t.toLowerCase() === 'featured'))
  const pool = tagged.length > 0 ? tagged : [...all]
  return pool
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
}

interface FeaturedContributionsProps {
  onOpenCommunity?: (slug?: string) => void
}

/** Landing strip of recent / featured community articles. */
export function FeaturedContributions({ onOpenCommunity }: FeaturedContributionsProps): JSX.Element {
  const featured = pickFeatured(getAllCommunityContent())
  if (featured.length === 0) return <></>

  return (
    <section className="featured-section" aria-labelledby="featured-heading">
      <h2 id="featured-heading" className="section-title-unique">
        From the community
      </h2>
      <p className="how-lead">Short write-ups from engineers studying the same internals.</p>
      <ul className="featured-list">
        {featured.map((item) => (
          <li key={item.slug} className="featured-item">
            <button
              type="button"
              className="featured-item-btn"
              onClick={() => onOpenCommunity?.(item.slug)}
            >
              <span className="featured-item-title">{item.title}</span>
              <span className="featured-item-meta">
                <CommunityAttribution author={item.author} github={item.github} compact />
                <span className="featured-item-topic">{item.topic}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {onOpenCommunity && (
        <button type="button" className="how-inline-cta" onClick={() => onOpenCommunity()}>
          Browse all contributions →
        </button>
      )}
    </section>
  )
}
