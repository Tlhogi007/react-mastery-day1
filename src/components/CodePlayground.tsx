/**
 * Enhanced Code Playground Component
 * Single Responsibility: Provide interactive code editing with syntax highlighting
 */

import { useState, useRef, useEffect, type JSX } from 'react'
import '../exercises/exerciseLayout.css'

interface CodePlaygroundProps {
    initialCode: string
    onCodeChange?: (code: string) => void
    title?: string
    height?: number
    readOnly?: boolean
    language?: 'javascript' | 'typescript' | 'jsx' | 'tsx'
}

// Simple syntax highlighter — placeholders keep later passes from matching
// inside already-emitted HTML (e.g. keyword "class" inside class="tok-keyword").
function highlightCode(code: string, _language: string): string {
    let highlighted = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

    const placeholders: string[] = []
    const protect = (match: string, className: string): string => {
        const token = `\u0000${placeholders.length}\u0000`
        placeholders.push(`<span class="${className}">${match}</span>`)
        return token
    }

    // Protect comments & strings first so keywords/numbers inside them stay intact
    highlighted = highlighted.replace(/\/\*[\s\S]*?\*\//g, (m) => protect(m, 'tok-comment'))
    highlighted = highlighted.replace(/\/\/.*$/gm, (m) => protect(m, 'tok-comment'))
    highlighted = highlighted.replace(/(["'`])(?:\\.|(?!\1)[\s\S])*\1/g, (m) => protect(m, 'tok-string'))

    const keywords = [
        'function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while',
        'class', 'import', 'export', 'from', 'default', 'async', 'await',
    ]
    keywords.forEach((keyword) => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g')
        highlighted = highlighted.replace(regex, () => protect(keyword, 'tok-keyword'))
    })

    highlighted = highlighted.replace(/\u0000\d+\u0000|\b\d+\.?\d*\b/g, (m) => {
        if (m.startsWith('\u0000')) return m
        return protect(m, 'tok-number')
    })

    // Restore last→first so nested indices stay stable
    for (let i = placeholders.length - 1; i >= 0; i--) {
        highlighted = highlighted.replace(`\u0000${i}\u0000`, placeholders[i])
    }

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
    const [softWrap, setSoftWrap] = useState<boolean>(false)
    const rootRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const previewRef = useRef<HTMLDivElement>(null)
    const lineNumbersRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setCode(initialCode)
    }, [initialCode])

    // Soft-wrap based on the playground column width (not the viewport),
    // so nested lab/preview panels wrap correctly on desktop too.
    useEffect(() => {
        const el = rootRef.current
        if (!el || typeof ResizeObserver === 'undefined') return

        const update = (width: number): void => {
            const coarse =
                typeof window !== 'undefined' &&
                window.matchMedia('(pointer: coarse)').matches
            setSoftWrap(width < 640 || coarse)
        }

        update(el.getBoundingClientRect().width)
        const ro = new ResizeObserver((entries) => {
            const width = entries[0]?.contentRect.width ?? el.getBoundingClientRect().width
            update(width)
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // One scroll surface (textarea); mirror into gutter + syntax preview
    useEffect(() => {
        const textarea = textareaRef.current
        if (!textarea) return

        const handleScroll = (): void => {
            const top = textarea.scrollTop
            const left = textarea.scrollLeft
            if (lineNumbersRef.current) {
                lineNumbersRef.current.scrollTop = top
            }
            if (previewRef.current) {
                previewRef.current.scrollTop = top
                previewRef.current.scrollLeft = left
            }
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
        boxShadow: 'var(--shadow-md)',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
    }

    const headerStyle: React.CSSProperties = {
        padding: '12px 16px',
        background: 'var(--bg-section)',
        borderBottom: '1px solid var(--border-light)',
        fontWeight: '600',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        fontSize: '14px'
    }

    const editorContainerStyle: React.CSSProperties = {
        position: 'relative',
        background: 'var(--code-bg, var(--bg-secondary))',
        height: `${height}px`,
        maxHeight: `${height}px`,
        display: 'flex',
        overflow: 'hidden',
        borderTop: '1px solid var(--border-light)',
        maxWidth: '100%',
        minHeight: 0,
    }

    const lineNumbersStyle: React.CSSProperties = {
        padding: softWrap ? '12px 6px' : '15px 8px',
        fontFamily: '"Fira Code", "Consolas", "Monaco", "Courier New", monospace',
        fontSize: softWrap ? '12px' : '14px',
        lineHeight: '1.6',
        color: 'var(--text-muted)',
        background: 'var(--bg-tertiary)',
        borderRight: '1px solid var(--border-light)',
        userSelect: 'none',
        textAlign: 'right',
        minWidth: softWrap ? '36px' : '50px',
        overflow: 'hidden',
        whiteSpace: 'pre',
        flexShrink: 0,
        height: '100%',
        minHeight: 0,
        boxSizing: 'border-box',
    }

    const codeEditorWrapperStyle: React.CSSProperties = {
        position: 'relative',
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        height: '100%',
        overflow: 'hidden',
    }

    const textareaStyle: React.CSSProperties = {
        // Fill the fixed editor pane — avoid intrinsic height expanding a flex ancestor
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        padding: softWrap ? '12px' : '15px',
        fontFamily: '"Fira Code", "Consolas", "Monaco", "Courier New", monospace',
        fontSize: softWrap ? '12px' : '13px',
        lineHeight: '1.6',
        border: 'none',
        resize: 'none' as const,
        outline: 'none',
        tabSize: 2,
        whiteSpace: softWrap ? 'pre-wrap' : 'pre',
        overflowWrap: softWrap ? 'break-word' : 'normal',
        wordBreak: 'normal',
        overflowX: softWrap ? 'hidden' : 'auto',
        overflowY: 'auto',
        zIndex: showPreview ? 0 : 1,
        margin: 0,
        boxSizing: 'border-box',
        background: 'transparent',
        color: 'var(--text-primary)',
    }

    const previewStyle: React.CSSProperties = {
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        padding: softWrap ? '12px' : '15px',
        fontFamily: '"Fira Code", "Consolas", "Monaco", "Courier New", monospace',
        fontSize: softWrap ? '12px' : '14px',
        lineHeight: '1.6',
        pointerEvents: 'none',
        whiteSpace: softWrap ? 'pre-wrap' : 'pre',
        overflowWrap: softWrap ? 'break-word' : 'normal',
        wordBreak: 'normal',
        overflow: 'hidden',
        zIndex: 1,
        background: 'var(--code-bg, var(--bg-secondary))',
        margin: 0,
        border: 'none',
        boxSizing: 'border-box',
        color: 'var(--text-primary)',
    }

    // Calculate line numbers
    const lineCount = code.split('\n').length
    const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1)

    return (
        <div ref={rootRef} className="code-playground-root" style={containerStyle}>
            <div style={headerStyle}>
                <span>{title}</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                {!softWrap && (
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
                )}
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
                <div
                    className="code-playground-footer"
                    style={{
                        padding: '10px 12px',
                        background: 'var(--bg-section)',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                    }}
                >
                    <span>Edit above to experiment.</span>
                    <span style={{ fontFamily: 'monospace', flexShrink: 0 }}>
                        {code.split('\n').length} lines
                    </span>
                </div>
            )}
        </div>
    )
}

export default CodePlayground
