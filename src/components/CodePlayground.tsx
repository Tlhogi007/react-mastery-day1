/**
 * Enhanced Code Playground Component
 * Single Responsibility: Provide interactive code editing with syntax highlighting
 */

import { useState, useRef, useEffect, type JSX } from 'react'

interface CodePlaygroundProps {
    initialCode: string
    onCodeChange?: (code: string) => void
    title?: string
    height?: number
    readOnly?: boolean
    language?: 'javascript' | 'typescript' | 'jsx' | 'tsx'
}

// Simple syntax highlighter - clean and readable with theme support
function highlightCode(code: string, _language: string): string {
    // Escape HTML first to prevent XSS and ensure proper rendering
    let highlighted = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

    // Detect if light theme is active
    const isLightTheme = document.documentElement.classList.contains('light-theme')

    // Theme-aware syntax highlighting colors
    const keywordColor = isLightTheme ? '#d73a49' : '#c586c0'
    const stringColor = isLightTheme ? '#032f62' : '#ce9178'
    const commentColor = isLightTheme ? '#6a737d' : '#6a9955'
    const numberColor = isLightTheme ? '#005cc5' : '#b5cea8'

    // Simple keyword highlighting (only common ones to avoid conflicts)
    const keywords = ['function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'default', 'async', 'await']

    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g')
        highlighted = highlighted.replace(regex, `<span style="color: ${keywordColor}; font-weight: 500;">${keyword}</span>`)
    })

    // Highlight strings
    highlighted = highlighted.replace(/(&quot;|'|`)((?:(?=(\\?))\3.)*?)\1/g, `<span style="color: ${stringColor};">$&</span>`)

    // Highlight comments
    highlighted = highlighted.replace(/\/\/.*$/gm, `<span style="color: ${commentColor}; font-style: italic;">$&</span>`)
    highlighted = highlighted.replace(/\/\*[\s\S]*?\*\//g, `<span style="color: ${commentColor}; font-style: italic;">$&</span>`)

    // Highlight numbers
    highlighted = highlighted.replace(/\b\d+\.?\d*\b/g, `<span style="color: ${numberColor};">$&</span>`)

    return highlighted
}

function CodePlayground({
    initialCode,
    onCodeChange,
    title = 'Code Playground',
    height = 300,
    readOnly = false,
    language = 'javascript'
}: CodePlaygroundProps): JSX.Element {
    const [code, setCode] = useState<string>(initialCode)
    const [error, setError] = useState<string | null>(null)
    const [showPreview, setShowPreview] = useState<boolean>(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const previewRef = useRef<HTMLDivElement>(null)
    const lineNumbersRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setCode(initialCode)
    }, [initialCode])

    // Sync line numbers scroll with textarea
    useEffect(() => {
        const textarea = textareaRef.current
        const lineNumbers = lineNumbersRef.current

        if (!textarea || !lineNumbers) return

        const handleScroll = (): void => {
            lineNumbers.scrollTop = textarea.scrollTop
        }

        textarea.addEventListener('scroll', handleScroll)
        return () => textarea.removeEventListener('scroll', handleScroll)
    }, [])

    const handleCodeChange = (newCode: string): void => {
        setCode(newCode)
        setError(null)
        onCodeChange?.(newCode)

        // Update preview
        if (previewRef.current) {
            previewRef.current.innerHTML = highlightCode(newCode, language)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
        // Auto-indent on Enter
        if (e.key === 'Enter' && !readOnly) {
            const textarea = e.currentTarget
            const start = textarea.selectionStart
            const end = textarea.selectionEnd
            const value = textarea.value

            // Get current line
            const lineStart = value.lastIndexOf('\n', start - 1) + 1
            const currentLine = value.substring(lineStart, start)
            const indentMatch = currentLine.match(/^(\s*)/)
            const indent = indentMatch ? indentMatch[1] : ''

            // Check if we should add extra indent (after {, [, etc.)
            const shouldIndent = /[{\[\(]$/.test(currentLine.trim())
            const newIndent = shouldIndent ? indent + '  ' : indent

            // Insert newline with indent
            const newValue = value.substring(0, start) + '\n' + newIndent + value.substring(end)
            const newCursorPos = start + 1 + newIndent.length

            setCode(newValue)
            onCodeChange?.(newValue)

            // Set cursor position
            setTimeout(() => {
                textarea.selectionStart = newCursorPos
                textarea.selectionEnd = newCursorPos
            }, 0)

            e.preventDefault()
        }

        // Tab handling
        if (e.key === 'Tab' && !readOnly) {
            e.preventDefault()
            const textarea = e.currentTarget
            const start = textarea.selectionStart
            const end = textarea.selectionEnd
            const value = textarea.value

            if (e.shiftKey) {
                // Shift+Tab: Remove indent
                const lineStart = value.lastIndexOf('\n', start - 1) + 1
                const lineEnd = value.indexOf('\n', end)
                const line = value.substring(lineStart, lineEnd === -1 ? value.length : lineEnd)

                if (line.startsWith('  ')) {
                    const newValue = value.substring(0, lineStart) + line.substring(2) + value.substring(lineEnd === -1 ? value.length : lineEnd)
                    setCode(newValue)
                    onCodeChange?.(newValue)
                    setTimeout(() => {
                        textarea.selectionStart = Math.max(lineStart, start - 2)
                        textarea.selectionEnd = Math.max(lineStart, end - 2)
                    }, 0)
                }
            } else {
                // Tab: Add indent
                const newValue = value.substring(0, start) + '  ' + value.substring(end)
                setCode(newValue)
                onCodeChange?.(newValue)
                setTimeout(() => {
                    textarea.selectionStart = start + 2
                    textarea.selectionEnd = start + 2
                }, 0)
            }
        }
    }

    const containerStyle: React.CSSProperties = {
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'var(--bg-card)',
        marginTop: '20px',
        boxShadow: 'var(--shadow-md)'
    }

    const headerStyle: React.CSSProperties = {
        padding: '12px 16px',
        background: 'var(--bg-section)',
        borderBottom: '1px solid var(--border-light)',
        fontWeight: '600',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '14px'
    }

    const editorContainerStyle: React.CSSProperties = {
        position: 'relative',
        background: 'var(--code-bg, var(--bg-secondary))',
        height: `${height}px`,
        display: 'flex',
        overflow: 'hidden',
        borderTop: '1px solid var(--border-light)'
    }

    const lineNumbersStyle: React.CSSProperties = {
        padding: '15px 8px',
        fontFamily: '"Fira Code", "Consolas", "Monaco", "Courier New", monospace',
        fontSize: '14px',
        lineHeight: '1.6',
        color: 'var(--text-muted)',
        background: 'var(--bg-tertiary)',
        borderRight: '1px solid var(--border-light)',
        userSelect: 'none',
        textAlign: 'right',
        minWidth: '50px',
        overflowY: 'auto',
        overflowX: 'hidden',
        whiteSpace: 'pre',
        flexShrink: 0,
        height: '100%',
        boxSizing: 'border-box'
    }

    const codeEditorWrapperStyle: React.CSSProperties = {
        position: 'relative',
        flex: 1,
        overflow: 'hidden'
    }

    const textareaStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        padding: '15px',
        fontFamily: '"Fira Code", "Consolas", "Monaco", "Courier New", monospace',
        fontSize: '14px',
        lineHeight: '1.6',
        border: 'none',
        resize: 'none' as const,
        outline: 'none',
        tabSize: 2,
        whiteSpace: 'pre',
        overflowWrap: 'normal',
        overflowX: 'auto',
        overflowY: 'auto',
        position: 'relative',
        zIndex: showPreview ? 0 : 1,
        margin: 0,
        boxSizing: 'border-box'
    }

    const previewStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        padding: '15px',
        fontFamily: '"Fira Code", "Consolas", "Monaco", "Courier New", monospace',
        fontSize: '14px',
        lineHeight: '1.6',
        pointerEvents: 'none',
        whiteSpace: 'pre-wrap',
        overflow: 'hidden',
        zIndex: 1,
        background: 'var(--code-bg, var(--bg-secondary))',
        margin: 0,
        border: 'none',
        boxSizing: 'border-box',
        color: 'var(--text-primary)'
    }

    // Calculate line numbers
    const lineCount = code.split('\n').length
    const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1)

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <span>{title}</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {!readOnly && (
                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            style={{
                                padding: '4px 8px',
                                background: 'var(--bg-tertiary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                color: 'var(--text-primary)'
                            }}
                        >
                            {showPreview ? 'Hide' : 'Show'} Preview
                        </button>
                    )}
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {language.toUpperCase()}
                    </span>
                </div>
            </div>
            <div style={editorContainerStyle}>
                <div
                    ref={lineNumbersRef}
                    style={lineNumbersStyle}
                >
                    {lineNumbers.map((num) => (
                        <div key={num} style={{ minHeight: '1.6em' }}>
                            {num}
                        </div>
                    ))}
                </div>
                <div style={codeEditorWrapperStyle}>
                    {showPreview && (
                        <div
                            ref={previewRef}
                            style={previewStyle}
                            dangerouslySetInnerHTML={{ __html: highlightCode(code, language) }}
                        />
                    )}
                    <textarea
                        ref={textareaRef}
                        value={code}
                        onChange={(e) => handleCodeChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={{
                            ...textareaStyle,
                            background: showPreview ? 'transparent' : 'var(--bg-secondary)',
                            color: showPreview ? 'transparent' : 'var(--text-primary)',
                            caretColor: showPreview ? 'transparent' : 'var(--text-primary)'
                        }}
                        spellCheck={false}
                        readOnly={readOnly}
                        placeholder={readOnly ? 'Read-only code' : 'Start typing your code...'}
                    />
                </div>
            </div>
            {error && (
                <div style={{
                    padding: '10px 15px',
                    background: 'var(--bg-warning)',
                    color: 'var(--text-on-warning)',
                    fontSize: '12px'
                }}>
                    ⚠️ {error}
                </div>
            )}
            {!readOnly && (
                <div style={{
                    padding: '10px 15px',
                    background: 'var(--bg-section)',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span>💡 Edit the code above to experiment. Tab for indent, Enter for auto-indent.</span>
                    <span style={{ fontFamily: 'monospace' }}>
                        {code.split('\n').length} lines
                    </span>
                </div>
            )}
        </div>
    )
}

export default CodePlayground
