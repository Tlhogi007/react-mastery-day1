/**
 * Quiz AI controls: quota badge + opt-in checkbox
 */

import { useEffect, useState, type JSX } from 'react'
import { BYO_KEYS_CHANGED_EVENT, byoAiKeys } from '../../services/byoAiKeys'
import { AiQuotaBadge } from '../AiQuotaBadge'
import '../../exercises/exerciseLayout.css'

interface QuizAiControlsProps {
    enableAI?: boolean
    day?: number
    aiEnabled: boolean
    loadingAI: boolean
    onToggleAI: () => void
}

export default function QuizAiControls({
    enableAI = false,
    day,
    aiEnabled,
    loadingAI,
    onToggleAI,
}: QuizAiControlsProps): JSX.Element {
    const [usingByo, setUsingByo] = useState(() => byoAiKeys.hasAny())

    useEffect(() => {
        const sync = () => setUsingByo(byoAiKeys.hasAny())
        sync()
        window.addEventListener(BYO_KEYS_CHANGED_EVENT, sync)
        window.addEventListener('storage', sync)
        return () => {
            window.removeEventListener(BYO_KEYS_CHANGED_EVENT, sync)
            window.removeEventListener('storage', sync)
        }
    }, [])

    const showToggle = Boolean(enableAI && day)

    return (
        <div className="quiz-header__meta">
            {usingByo ? (
                <span
                    className="quiz-header__badge"
                    title="Your API key stays in this browser and is never sent to React Mastery servers"
                >
                    Using your key · not shared quota
                </span>
            ) : (
                <AiQuotaBadge />
            )}
            {showToggle && (
                <label
                    className="quiz-header__ai-toggle"
                    title={
                        usingByo
                            ? 'Add AI questions using your own API key'
                            : 'Add AI questions (opt-in · shared free quota)'
                    }
                    style={{
                        cursor: loadingAI ? 'not-allowed' : 'pointer',
                        opacity: loadingAI ? 0.6 : 1,
                    }}
                >
                    <input
                        type="checkbox"
                        checked={aiEnabled}
                        onChange={onToggleAI}
                        disabled={loadingAI}
                        style={{ cursor: loadingAI ? 'not-allowed' : 'pointer' }}
                    />
                    <span>
                        {loadingAI
                            ? 'Loading AI…'
                            : usingByo
                              ? 'Add AI (your key)'
                              : 'Add AI questions'}
                    </span>
                </label>
            )}
        </div>
    )
}
