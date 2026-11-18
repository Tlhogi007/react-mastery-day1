import { useState, type JSX, type ReactNode } from 'react'

interface Tab {
    id: string
    label: string
    icon?: string
    content: ReactNode
}

interface TabsProps {
    tabs: Tab[]
    defaultTab?: string
}

function Tabs({ tabs, defaultTab }: TabsProps): JSX.Element {
    const [activeTab, setActiveTab] = useState<string>(defaultTab || tabs[0]?.id || '')

    const containerStyle: React.CSSProperties = {
        background: 'var(--bg-card)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
    }

    const tabListStyle: React.CSSProperties = {
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-section)',
        overflowX: 'auto'
    }

    const tabButtonStyle = (isActive: boolean): React.CSSProperties => ({
        padding: '16px 24px',
        background: isActive ? 'var(--bg-card)' : 'transparent',
        border: 'none',
        borderBottom: isActive ? '3px solid var(--border-primary)' : '3px solid transparent',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: isActive ? '600' : '500',
        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        whiteSpace: 'nowrap',
        flex: 1,
        minWidth: '120px',
        justifyContent: 'center'
    })

    const tabContentStyle: React.CSSProperties = {
        padding: '24px'
    }

    return (
        <div style={containerStyle}>
            <div style={tabListStyle} role="tablist" aria-label="Exercise sections">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        aria-controls={`tabpanel-${tab.id}`}
                        id={`tab-${tab.id}`}
                        onClick={() => setActiveTab(tab.id)}
                        style={tabButtonStyle(activeTab === tab.id)}
                        onKeyDown={(e) => {
                            // Arrow key navigation
                            const currentIndex = tabs.findIndex(t => t.id === tab.id)
                            if (e.key === 'ArrowRight' && currentIndex < tabs.length - 1) {
                                e.preventDefault()
                                setActiveTab(tabs[currentIndex + 1].id)
                            } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
                                e.preventDefault()
                                setActiveTab(tabs[currentIndex - 1].id)
                            }
                        }}
                    >
                        {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>
            <div
                style={tabContentStyle}
                role="tabpanel"
                id={`tabpanel-${activeTab}`}
                aria-labelledby={`tab-${activeTab}`}
            >
                {tabs.find(tab => tab.id === activeTab)?.content}
            </div>
        </div>
    )
}

export default Tabs
