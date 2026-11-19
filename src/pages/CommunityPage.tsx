import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { getAllCommunityContent, getCommunityContent, type CommunityContent } from '../lib/contentLoader'
import { tracking } from '../lib/googleAnalytics'
import {
  CommunityAttribution,
  CommunitySignedNote,
} from '../components/CommunityAttribution'
import { CommunityContributeHint } from '../components/CommunityContributeHint'
import { CommunityHelpfulButton } from '../components/CommunityHelpfulButton'
import { ContributorProfile } from '../components/ContributorProfile'
import { fetchHelpfulCounts } from '../services/communityHelpful'
import './CommunityPage.css'

interface CommunityPageProps {
  initialSlug?: string | null
}

export default function CommunityPage({ initialSlug = null }: CommunityPageProps) {
  const [selectedContent, setSelectedContent] = useState<CommunityContent | null>(null)
  const [filterTopic, setFilterTopic] = useState<string>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')
  const [profileGithub, setProfileGithub] = useState<string | null>(null)
  
  const allContent = getAllCommunityContent()

  useEffect(() => {
    void fetchHelpfulCounts()
  }, [])

  useEffect(() => {
    if (!initialSlug) return
    const hit = getCommunityContent(initialSlug)
    if (hit) setSelectedContent(hit)
  }, [initialSlug])
  
  const filteredContent = allContent.filter(content => {
    if (filterTopic !== 'all' && content.topic !== filterTopic) return false
    if (filterDifficulty !== 'all' && content.difficulty !== filterDifficulty) return false
    return true
  })
  
  const topics = [...new Set(allContent.map(c => c.topic))]

  if (profileGithub) {
    return (
      <div className="community-article-view">
        <button className="back-button" type="button" onClick={() => setProfileGithub(null)}>
          ← Back to Community
        </button>
        <ContributorProfile
          github={profileGithub}
          onOpenArticle={(c) => {
            setProfileGithub(null)
            setSelectedContent(c)
          }}
        />
      </div>
    )
  }
  
  if (selectedContent) {
    return (
      <div className="community-article-view">
        <button 
          className="back-button"
          onClick={() => setSelectedContent(null)}
        >
          ← Back to Community
        </button>
        
        <article className="community-article">
          <header className="article-header">
            <h1>{selectedContent.title}</h1>
            <div className="article-meta">
              <div className="article-meta__byline">
                <CommunityAttribution
                  author={selectedContent.author}
                  github={selectedContent.github}
                />
              </div>
              <div className="article-meta__facts">
                {selectedContent.github && (
                  <button
                    type="button"
                    className="article-meta__action"
                    onClick={() => setProfileGithub(selectedContent.github || null)}
                  >
                    View contributor
                  </button>
                )}
                <span className="difficulty">{selectedContent.difficulty}</span>
                <span className="date">{selectedContent.date}</span>
                {selectedContent.estimatedTime && (
                  <span className="time">{selectedContent.estimatedTime}</span>
                )}
              </div>
            </div>
            <div className="article-tags">
              {selectedContent.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
            <CommunitySignedNote github={selectedContent.github} />
            <div style={{ marginTop: 12 }}>
              <CommunityHelpfulButton slug={selectedContent.slug} />
            </div>
          </header>
          
          <div className="article-content">
            <ReactMarkdown>{selectedContent.content}</ReactMarkdown>
          </div>
        </article>
      </div>
    )
  }
  
  return (
    <div className="community-page">
      <header className="community-header">
        <h1>Community Learnings</h1>
        <p>Knowledge shared by the React community</p>
        <a
          href={import.meta.env.VITE_CONTENT_REPO_URL || 'https://github.com/Tlhogi007/react-mastery-content'}
          target="_blank"
          rel="noopener noreferrer"
          className="contribute-button"
        >
          Contribute an article
        </a>
        <CommunityContributeHint />
      </header>
      
      <div className="community-filters">
        <select 
          value={filterTopic} 
          onChange={(e) => setFilterTopic(e.target.value)}
        >
          <option value="all">All Topics</option>
          {topics.map(topic => (
            <option key={topic} value={topic}>{topic}</option>
          ))}
        </select>
        
        <select 
          value={filterDifficulty} 
          onChange={(e) => setFilterDifficulty(e.target.value)}
        >
          <option value="all">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>
      
      <div className="community-grid">
        {filteredContent.length === 0 ? (
          <div className="no-content">
            <p>No contributions yet. Be the first!</p>
            <a 
              href={import.meta.env.VITE_CONTENT_REPO_URL || 'https://github.com/Tlhogi007/react-mastery-content'}
              target="_blank"
              rel="noopener noreferrer"
              className="contribute-button"
            >
              Contribute Now
            </a>
          </div>
        ) : (
          filteredContent.map((content, i) => (
            <motion.div
              key={content.slug}
              className="community-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => {
                tracking.contributionClicked(content.slug)
                setSelectedContent(content)
              }}
            >
              <h3>{content.title}</h3>
              <div className="card-meta">
                <span className="author">
                  <CommunityAttribution
                    author={content.author}
                    github={content.github}
                    compact
                  />
                </span>
                <span className={`difficulty ${content.difficulty}`}>
                  {content.difficulty}
                </span>
              </div>
              <div className="card-tags">
                {content.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
              {content.estimatedTime && (
                <span className="time">{content.estimatedTime}</span>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
