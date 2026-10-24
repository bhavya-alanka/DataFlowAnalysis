import React, { useRef } from 'react';
import { Play, RotateCcw, Trash2, AlertCircle, FileCode } from 'lucide-react';

export default function CodeEditor({
  code,
  setCode,
  error,
  onAnalyze,
  onReset,
  onClear,
  onSelectSample,
  samples,
  isAnalyzing
}) {
  const lineNumbersRef = useRef(null);
  const textareaRef = useRef(null);

  const lines = code.split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(1, lines) }, (_, i) => i + 1).join('\n');

  const handleScroll = () => {
    if (lineNumbersRef.current && textareaRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onAnalyze();
    }
  };

  return (
    <section className="editor-pane" aria-label="C Source Code Editor">
      <div className="pane-header">
        <div className="pane-title">
          <FileCode size={16} />
          <span>C Source Code</span>
        </div>
        <div className="editor-actions">
          <span className="stat-badge">{lines} lines</span>
          <button onClick={onReset} className="btn-icon" title="Reset Code">
            <RotateCcw size={14} />
          </button>
          <button onClick={onClear} className="btn-icon" title="Clear Code">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong>{error.error_type || 'Compilation Error'}:</strong>{' '}
            {error.message || error}
            {error.line && (
              <span style={{ display: 'block', fontSize: '0.72rem', opacity: 0.85 }}>
                at line {error.line}, col {error.col}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="editor-body">
        <div className="line-numbers" ref={lineNumbersRef}>
          {lineNumbers}
        </div>
        <textarea
          ref={textareaRef}
          className="code-textarea"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          placeholder="Enter supported C source code...
int main() {
    int i = 1;
    int sum = 0;
    while (i <= 10) {
        sum = sum + i;
        i = i + 1;
    }
    return sum;
}"
        />
      </div>

      <div className="editor-footer">
        <div className="quick-chips">
          <span className="chip-label">Quick Samples:</span>
          {samples.slice(0, 4).map((s) => (
            <button
              key={s.id}
              className="chip"
              onClick={() => onSelectSample(s.id)}
            >
              {s.title.split('(')[0].trim()}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
