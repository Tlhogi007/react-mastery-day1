/**
 * Quiz Header — title only; progress/AI live in the status toolbar
 */

import type { JSX } from 'react'
import '../../exercises/exerciseLayout.css'

interface QuizHeaderProps {
    title: string
}

function QuizHeader({ title }: QuizHeaderProps): JSX.Element {
    return (
        <div className="quiz-header">
            <h3 className="quiz-header__title">{title}</h3>
        </div>
    )
}

export default QuizHeader
