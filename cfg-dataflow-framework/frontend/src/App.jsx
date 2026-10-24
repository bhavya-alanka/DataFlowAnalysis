import React, { useState, useRef, useEffect } from 'react';
import {
  Workflow,
  Play,
  RotateCcw,
  Trash2,
  GitBranch,
  Layers,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle2,
  Info,
  Sun,
  Moon,
  HelpCircle,
  CornerDownRight,
  ChevronRight,
  Sparkles
} from 'lucide-react';

import CFGCanvas from './components/graph/CFGCanvas';
import { useAnalysis } from './hooks/useAnalysis';

export default function App() {
  const {
    code,
    setCode,
    samples,
    selectedSampleId,
    selectSample,
    isServerHealthy,
    isAnalyzing,
    error,
    toast,
    analysisData,
    selectedBlockId,
    setSelectedBlockId,
    selectedBlock,
    runAnalysis,
    resetCode,
    clearCode,
  } = useAnalysis();

  // Theme: 'dark' (default) or 'light'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('cfg_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cfg_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Language Subset Selection (both run through the same general compiler pipeline)
  const [selectedLanguageSubset, setSelectedLanguageSubset] = useState('c_subset');

  // Active Data-Flow Analysis Tab: 'rd' | 'lv' | 'ae'
  const [activeAnalysisTab, setActiveAnalysisTab] = useState('rd');

  // Step scrubber state
  const [showIterationSteps, setShowIterationSteps] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  const textareaRef = useRef(null);
  const lineGutterRef = useRef(null);

  const lines = code.split('\n');
  const lineCount = Math.max(1, lines.length);

  // Sync scroll between textarea and line gutter
  const handleEditorScroll = () => {
    if (textareaRef.current && lineGutterRef.current) {
      lineGutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Keyboard shortcut: Tab indents 4 spaces, Ctrl+Enter runs analysis
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
      runAnalysis(code);
    }
  };

  const handleSelectBlock = (blockOrId) => {
    if (!blockOrId) {
      setSelectedBlockId(null);
      return;
    }
    const bId = typeof blockOrId === 'string' ? blockOrId : blockOrId.id;
    setSelectedBlockId(bId);
  };

  // Active data-flow model data
  const currentAnalysis =
    activeAnalysisTab === 'rd'
      ? analysisData?.reaching_definitions
      : activeAnalysisTab === 'lv'
      ? analysisData?.live_variables
      : analysisData?.available_expressions;

  const steps = currentAnalysis?.steps || [];

  useEffect(() => {
    setCurrentStepIdx(0);
  }, [analysisData, activeAnalysisTab]);

  const blockGen = currentAnalysis?.block_gen || {};
  const blockKill = currentAnalysis?.block_kill || {};
  const finalIn = currentAnalysis?.final_in || {};
  const finalOut = currentAnalysis?.final_out || {};

  const sortedBlockIds = Object.keys(blockGen).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
    return numA - numB;
  });

  const renderSet = (items) => {
    if (!items || items.length === 0) {
      return <span className="empty-set-symbol">&#123;&#125;</span>;
    }
    const sorted = [...items].sort();
    return (
      <span>
        {sorted.map((item) => (
          <span key={item} className="set-chip-item">
            {item}
          </span>
        ))}
      </span>
    );
  };

  // Plain-English beginner explanations tailored to active tab
  let analysisExplanation = '';
  if (activeAnalysisTab === 'rd') {
    analysisExplanation =
      'Reaching Definitions finds which variable definitions may reach each basic block without being overwritten. GEN[B] contains definitions made inside B. KILL[B] contains older definitions of those same variables overwritten in B. Because execution can follow any path, IN[B] is the union (∪) of OUT sets from all predecessor blocks. The transfer equation is: OUT[B] = GEN[B] ∪ (IN[B] - KILL[B]).';
  } else if (activeAnalysisTab === 'lv') {
    analysisExplanation =
      'Live Variables finds which variables hold values that might be read later along some future execution path. USE[B] contains variables read before definition in B. DEF[B] contains variables defined in B. Because Live Variables is a backward analysis, OUT[B] is the union (∪) of IN sets of all successor blocks. The transfer equation is: IN[B] = USE[B] ∪ (OUT[B] - DEF[B]).';
  } else if (activeAnalysisTab === 'ae') {
    analysisExplanation =
      'Available Expressions finds expressions whose computed values are guaranteed to be available on all paths reaching a block without being invalidated by operand updates. Because this is a must-analysis, an expression must reach through EVERY incoming path (using intersection ∩) to be in IN[B]. The transfer equation is: OUT[B] = GEN[B] ∪ (IN[B] - KILL[B]).';
  }

  // Dynamic explanation for "Why is this block connected here?"
  const getWhyConnectedText = (block) => {
    if (!block || !analysisData?.cfg?.edges) return '';
    const bId = block.id;
    const inEdges = analysisData.cfg.edges.filter((e) => e.target === bId);
    const outEdges = analysisData.cfg.edges.filter((e) => e.source === bId);

    const inReasons = inEdges.map((e) => {
      if (e.type === 'conditional_true') return `from ${e.source} when the condition evaluates to True`;
      if (e.type === 'conditional_false') return `from ${e.source} when the condition evaluates to False`;
      if (e.type === 'back_edge') return `from loop body ${e.source} (loop repeat)`;
      return `sequentially from ${e.source}`;
    });

    const outReasons = outEdges.map((e) => {
      if (e.type === 'conditional_true') return `to ${e.target} on True branch`;
      if (e.type === 'conditional_false') return `to ${e.target} on False branch`;
      if (e.type === 'back_edge') return `loops back to ${e.target}`;
      return `to ${e.target}`;
    });

    let text = '';
    if (inReasons.length > 0) {
      text += `Control flows into this block ${inReasons.join(', and ')}. `;
    } else {
      text += 'This is the initial entry point of the program. ';
    }

    if (outReasons.length > 0) {
      text += `After executing this block, control transitions ${outReasons.join(', or ')}.`;
    } else {
      text += 'Execution completes here and exits the program.';
    }

    return text;
  };

  // Dynamic semantic role description for selected block
  const getSemanticRoleDescription = (block) => {
    if (!block) return '';
    if (block.is_entry) return 'Program Entry Capsule: Starting boundary node of execution.';
    if (block.is_exit) return 'Program Exit Capsule: Termination boundary node where control leaves the program.';
    const isDecision = block.successors && block.successors.length > 1;
    const isMerge = block.predecessors && block.predecessors.length > 1;

    if (isDecision && isMerge) {
      return `Decision & Merge Block (${block.id}): Reconverges multiple control paths and evaluates branch conditions to split execution.`;
    }
    if (isDecision) {
      return `Conditional Decision Block (${block.id}): Contains a branch condition that splits execution into True and False paths.`;
    }
    if (isMerge) {
      return `Join / Merge Block (${block.id}): Confluence point where multiple alternative control paths reunite.`;
    }
    return `Sequential Basic Block (${block.id}): Group of straight-line instructions executed sequentially without branching in the middle.`;
  };

  const userBlockCount = analysisData?.cfg?.blocks?.filter((b) => !b.is_entry && !b.is_exit).length || 0;
  const edgeCount = analysisData?.cfg?.edges?.length || 0;

  // Tracked count for results summary
  let trackedCount = 0;
  let trackedLabel = 'Definitions';
  if (activeAnalysisTab === 'rd') {
    trackedCount = currentAnalysis?.definitions_table?.length || 0;
    trackedLabel = 'Definitions';
  } else if (activeAnalysisTab === 'lv') {
    trackedCount = currentAnalysis?.variables?.length || 0;
    trackedLabel = 'Variables';
  } else if (activeAnalysisTab === 'ae') {
    trackedCount = currentAnalysis?.universal_set?.length || 0;
    trackedLabel = 'Expressions';
  }

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast && (
        <div className={`simple-toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`} role="alert">
          {toast.type === 'error' ? <AlertCircle size={15} color="var(--accent-coral)" /> : <CheckCircle2 size={15} color="var(--accent-emerald)" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. Header with Title & Theme Toggle */}
      <header className="simple-header">
        <div className="header-brand">
          <div className="header-logo-icon">
            <Workflow size={22} />
          </div>
          <div className="header-title-block">
            <h1>CFG and Data-Flow Analysis Framework</h1>
            <p>An interactive, beginner-friendly compiler analysis tool for Control Flow Graphs and data-flow algorithms.</p>
          </div>
        </div>

        <div className="header-right-tools">
          <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle Light / Dark Theme">
            {theme === 'dark' ? <Sun size={14} color="var(--accent-amber)" /> : <Moon size={14} color="var(--accent-blue)" />}
            <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
          </button>

          <div className={`header-status-badge ${isServerHealthy ? 'online' : 'offline'}`} title="FastAPI Compiler Backend Status">
            <span className="status-dot"></span>
            <span>{isServerHealthy ? 'Backend: Active (127.0.0.1:8000)' : 'Connecting to Backend...'}</span>
          </div>
        </div>
      </header>

      {/* 2. Step Indicator Workflow Bar */}
      <nav className="workflow-stepper" aria-label="Workflow Steps">
        <div className={`step-item ${!analysisData ? 'active' : ''}`}>
          <span className="step-num">1</span>
          <span>Write Program</span>
        </div>
        <ChevronRight size={13} className="step-arrow" />
        <div className={`step-item ${analysisData ? 'active' : ''}`}>
          <span className="step-num">2</span>
          <span>Build CFG</span>
        </div>
        <ChevronRight size={13} className="step-arrow" />
        <div className={`step-item ${analysisData ? 'active' : ''}`}>
          <span className="step-num">3</span>
          <span>Analyze</span>
        </div>
        <ChevronRight size={13} className="step-arrow" />
        <div className={`step-item ${selectedBlock ? 'active' : ''}`}>
          <span className="step-num">4</span>
          <span>Explore Results</span>
        </div>
      </nav>

      {/* 3. Beginner Glossary Strip */}
      <section className="glossary-strip" aria-label="Technical Terms Glossary">
        <div className="glossary-lead">
          <HelpCircle size={14} />
          <span>Key Terms:</span>
        </div>
        <div className="glossary-items">
          <div className="glossary-pill" title="Control Flow Graph">
            <span className="glossary-term">CFG</span>: Shows the possible execution paths of a program.
          </div>
          <div className="glossary-pill" title="Basic Block">
            <span className="glossary-term">Basic Block</span>: A group of statements executed sequentially.
          </div>
          <div className="glossary-pill" title="GEN Set">
            <span className="glossary-term">GEN</span>: Facts generated by a block.
          </div>
          <div className="glossary-pill" title="KILL Set">
            <span className="glossary-term">KILL</span>: Facts invalidated by a block.
          </div>
          <div className="glossary-pill" title="IN Set">
            <span className="glossary-term">IN</span>: Facts entering a block.
          </div>
          <div className="glossary-pill" title="OUT Set">
            <span className="glossary-term">OUT</span>: Facts leaving a block.
          </div>
          <div className="glossary-pill" title="Fixed Point">
            <span className="glossary-term">Fixed Point</span>: A stage where another iteration does not change the results.
          </div>
        </div>
      </section>

      {/* Results Summary Strip (shown when analysis is computed) */}
      {analysisData && (
        <div className="summary-strip-card">
          <div className="summary-metrics-group">
            <div className="summary-metric-item">
              <span className="summary-metric-label">Basic Blocks</span>
              <span className="summary-metric-val">{userBlockCount}</span>
            </div>
            <div className="summary-metric-item">
              <span className="summary-metric-label">CFG Edges</span>
              <span className="summary-metric-val">{edgeCount}</span>
            </div>
            <div className="summary-metric-item">
              <span className="summary-metric-label">Tracked {trackedLabel}</span>
              <span className="summary-metric-val">{trackedCount}</span>
            </div>
            <div className="summary-metric-item">
              <span className="summary-metric-label">Iterations to Fixpoint</span>
              <span className="summary-metric-val" style={{ color: 'var(--accent-purple)' }}>
                {currentAnalysis?.total_iterations || 0}
              </span>
            </div>
            <div className="summary-metric-item">
              <span className="summary-metric-label">Convergence Status</span>
              <span className="summary-metric-val" style={{ color: 'var(--accent-emerald)' }}>
                Fixed Point Reached ✓
              </span>
            </div>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              if (textareaRef.current) textareaRef.current.focus();
            }}
          >
            <span>Edit or Analyze Another Program</span>
          </button>
        </div>
      )}

      {/* 4. Main Two-Column Layout */}
      <main className="main-layout">
        {/* ================= LEFT COLUMN: SOURCE CODE EDITOR ================= */}
        <div className="editor-column">
          <div className="section-panel" id="write-program-section">
            <div className="panel-header">
              <div className="panel-title-group">
                <span className="panel-title">Write Program</span>
                <span className="panel-subtitle">• Enter or paste C source code</span>
              </div>
            </div>

            {/* Controls Bar: Load Example + Language Subset + Action Buttons */}
            <div className="editor-controls-bar">
              <div className="picker-row">
                <label htmlFor="sample-dropdown" className="picker-label">Load Example:</label>
                <select
                  id="sample-dropdown"
                  className="sample-select"
                  value={selectedSampleId}
                  onChange={(e) => selectSample(e.target.value)}
                >
                  {samples.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="picker-row">
                <label htmlFor="lang-subset-select" className="picker-label">Language:</label>
                <select
                  id="lang-subset-select"
                  className="sample-select"
                  value={selectedLanguageSubset}
                  onChange={(e) => setSelectedLanguageSubset(e.target.value)}
                >
                  <option value="c_subset">C Subset (Assignments, Conditionals, Loops)</option>
                  <option value="c_main">C Function (`int main() &#123; ... &#125;`)</option>
                </select>
              </div>

              <div className="editor-btn-row">
                <button
                  className="btn btn-primary"
                  onClick={() => runAnalysis(code)}
                  disabled={isAnalyzing}
                  title="Analyze program (Ctrl + Enter)"
                >
                  <Play size={14} fill="currentColor" />
                  <span>{isAnalyzing ? 'Analyzing…' : 'Analyze My Program'}</span>
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={resetCode}
                  title="Reset to selected example code"
                >
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={clearCode}
                  title="Clear editor code"
                >
                  <Trash2 size={13} />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Code Input Box with Line Numbers */}
            <div className="editor-box">
              <div className="editor-line-gutter" ref={lineGutterRef} aria-hidden="true">
                {Array.from({ length: lineCount }, (_, i) => {
                  const lineNum = i + 1;
                  const isErr = error && error.line === lineNum;
                  return (
                    <div key={lineNum} className={`gutter-num ${isErr ? 'error-line' : ''}`}>
                      {lineNum}
                    </div>
                  );
                })}
              </div>

              <textarea
                ref={textareaRef}
                className="editor-textarea-field"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onScroll={handleEditorScroll}
                onKeyDown={handleKeyDown}
                spellCheck="false"
                placeholder="Write or paste your C program here...
Example:
a = 10;
b = 20;
if (a < b) {
    c = a + b;
} else {
    c = a - b;
}"
              />
            </div>

            {/* Syntax Error Message Display */}
            {error && (
              <div className="syntax-error-card" role="alert">
                <div className="syntax-error-header">
                  <AlertCircle size={14} />
                  <span>
                    {error.error_type || 'Syntax Error'}
                    {error.line ? ` (Line ${error.line}${error.col ? `, Col ${error.col}` : ''})` : ''}
                  </span>
                </div>
                <div className="syntax-error-body">{error.message}</div>
              </div>
            )}

            {/* Status Footer */}
            <div className="editor-footer-status">
              <span>{lineCount} lines • {code.length} characters</span>
              <span>Shortcuts: <kbd>Ctrl+Enter</kbd> to analyze • <kbd>Tab</kbd> to indent</span>
            </div>
          </div>

          {/* Help & Examples: Supported Language Features Guide */}
          <div className="syntax-guide-card" id="help-examples-section">
            <span className="syntax-guide-title">
              <Info size={14} color="var(--accent-blue)" />
              Help &amp; Supported Language Syntax:
            </span>
            <div className="syntax-guide-list">
              <div>• <strong>Assignments:</strong> <code>a = 10; b = 20; c = a + b;</code></div>
              <div>• <strong>Variables:</strong> Explicit (<code>int x;</code>) or implicit (<code>x = 5;</code>)</div>
              <div>• <strong>Conditionals:</strong> <code>if (x &gt; 5) &#123; ... &#125; else &#123; ... &#125;</code></div>
              <div>• <strong>Loops:</strong> <code>while (i &lt; 5) &#123; ... &#125;</code> and <code>for</code> loops</div>
              <div>• <strong>Operators:</strong> Arithmetic <code>+ - * / %</code>, Relational <code>== != &lt; &lt;= &gt; &gt;=</code></div>
              <div>• <strong>Blocks:</strong> Braced blocks <code>&#123; ... &#125;</code> or single unbraced statements</div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: GRAPH & DATA-FLOW RESULTS ================= */}
        <div className="results-column">
          {/* Section A: Control Flow Graph (CFG) */}
          <div className="section-panel" id="cfg-section">
            <div className="panel-header">
              <div className="panel-title-group">
                <GitBranch size={16} color="var(--accent-blue)" />
                <span className="panel-title">Control Flow Graph (CFG)</span>
                <span className="panel-subtitle">• Understand the program's execution paths</span>
              </div>
              {analysisData && (
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Blocks: <strong style={{ color: 'var(--accent-blue)' }}>{userBlockCount}</strong> | Edges: <strong>{edgeCount}</strong>
                </div>
              )}
            </div>

            <div className="cfg-panel-body">
              <CFGCanvas
                cfgData={analysisData?.cfg}
                selectedBlockId={selectedBlockId}
                onSelectBlock={handleSelectBlock}
                onAnalyze={() => runAnalysis(code)}
              />
            </div>

            {/* Beginner-Friendly Contextual Block Inspector */}
            {selectedBlock ? (
              <div className="selected-block-banner">
                <div className="selected-block-header">
                  <div className="selected-block-title">
                    <span>Block {selectedBlock.id}</span>
                    <span style={{ fontSize: '0.68rem', background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', padding: '1px 6px', borderRadius: 4, color: 'var(--text-muted)' }}>
                      {selectedBlock.is_entry ? 'ENTRY' : selectedBlock.is_exit ? 'EXIT' : 'Basic Block'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    Click other blocks in the graph or table to inspect
                  </span>
                </div>

                {/* Plain-English Semantic Role */}
                <div className="block-semantic-role">
                  {getSemanticRoleDescription(selectedBlock)}
                </div>

                {/* Predecessors & Successors */}
                <div className="selected-conn-row">
                  <div>
                    <span>Predecessor Blocks: </span>
                    <span className="conn-tags">
                      {selectedBlock.predecessors?.length > 0 ? (
                        selectedBlock.predecessors.map((p) => (
                          <button key={p} className="conn-tag" onClick={() => handleSelectBlock(p)}>
                            {p}
                          </button>
                        ))
                      ) : (
                        <span>None (Program Entry)</span>
                      )}
                    </span>
                  </div>

                  <div>
                    <span>Successor Blocks: </span>
                    <span className="conn-tags">
                      {selectedBlock.successors?.length > 0 ? (
                        selectedBlock.successors.map((s) => (
                          <button key={s} className="conn-tag" onClick={() => handleSelectBlock(s)}>
                            {s}
                          </button>
                        ))
                      ) : (
                        <span>None (Program Exit)</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* "Why is this block connected here?" */}
                <div className="why-connected-box">
                  <span className="why-title">Why is this block connected here?</span>
                  <p className="why-text">{getWhyConnectedText(selectedBlock)}</p>
                </div>

                {/* Block Instructions with Leader Notation */}
                {selectedBlock.instructions && selectedBlock.instructions.length > 0 && (
                  <div className="selected-instr-list">
                    {selectedBlock.instructions.map((instr) => (
                      <div key={instr.id} className="selected-instr-item">
                        {instr.is_leader ? (
                          <span className="leader-tag" title="Leader instruction (entry point of basic block)">★</span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', width: 14 }}>{instr.id}</span>
                        )}
                        <code>{instr.raw}</code>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '10px 16px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-subtle)', fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                Click any basic block node above or row in the table below to inspect its statements, predecessors, successors, and role.
              </div>
            )}
          </div>

          {/* Section B: Data-Flow Analysis Results */}
          <div className="section-panel" id="dataflow-section">
            <div className="panel-header" style={{ padding: 0 }}>
              <div className="analysis-tabs-bar" style={{ width: '100%' }}>
                <button
                  className={`analysis-tab-btn ${activeAnalysisTab === 'rd' ? 'active' : ''}`}
                  onClick={() => setActiveAnalysisTab('rd')}
                >
                  <ArrowRight size={14} />
                  <span>Reaching Definitions</span>
                  <span className="tab-badge-dir">Forward ∪</span>
                </button>

                <button
                  className={`analysis-tab-btn ${activeAnalysisTab === 'lv' ? 'active' : ''}`}
                  onClick={() => setActiveAnalysisTab('lv')}
                >
                  <TrendingDown size={14} />
                  <span>Live Variables</span>
                  <span className="tab-badge-dir backward">Backward ∪</span>
                </button>

                <button
                  className={`analysis-tab-btn ${activeAnalysisTab === 'ae' ? 'active' : ''}`}
                  onClick={() => setActiveAnalysisTab('ae')}
                >
                  <TrendingUp size={14} />
                  <span>Available Expressions</span>
                  <span className="tab-badge-dir">Forward ∩</span>
                </button>
              </div>
            </div>

            {/* Mathematical Model Info Header */}
            {currentAnalysis && (
              <div className="model-info-bar">
                <div className="model-info-row">
                  <span className="model-title-text">{currentAnalysis.analysis_type}</span>
                  <div className="model-meta-pills">
                    <span className="model-pill">Direction: <strong>{currentAnalysis.direction}</strong></span>
                    <span className="model-pill">Meet: <strong>{currentAnalysis.meet_operator}</strong></span>
                    <span className="model-pill converged">
                      Converged in <strong>{currentAnalysis.total_iterations}</strong> iterations
                    </span>
                  </div>
                </div>

                <div className="model-equations-row">
                  <span>Transfer Rule: <code>{currentAnalysis.transfer_equation}</code></span>
                  <span>Boundary Confluence: <code>{currentAnalysis.confluence_equation}</code></span>
                </div>
              </div>
            )}

            {/* Results Table & Short Explanations */}
            <div className="dataflow-table-container">
              {/* Short explanation card for beginners */}
              <div className="calc-explanation-card">
                <div className="calc-header">
                  <div className="calc-title">
                    <Info size={14} color="var(--accent-emerald)" />
                    <span>How This Analysis Works:</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {analysisExplanation}
                </p>
              </div>

              {/* Section 8: "How Was This Result Calculated?" for the selected block */}
              {selectedBlock && currentAnalysis && (
                <div className="calc-explanation-card" style={{ borderLeftColor: 'var(--accent-blue)' }}>
                  <div className="calc-header">
                    <div className="calc-title">
                      <Sparkles size={14} color="var(--accent-blue)" />
                      <span>How Was Result Calculated for Block {selectedBlock.id}?</span>
                    </div>
                  </div>

                  <div className="calc-steps-grid">
                    <div className="calc-step-item">
                      <span className="calc-step-label">
                        {activeAnalysisTab === 'lv' ? '1. USE[B] (Used Before Defined):' : '1. GEN[B] (Generated in Block):'}
                      </span>
                      <div>{renderSet(blockGen[selectedBlock.id] || [])}</div>
                    </div>

                    <div className="calc-step-item">
                      <span className="calc-step-label">
                        {activeAnalysisTab === 'lv' ? '2. DEF[B] (Assigned in Block):' : '2. KILL[B] (Invalidated Definitions):'}
                      </span>
                      <div>{renderSet(blockKill[selectedBlock.id] || [])}</div>
                    </div>

                    <div className="calc-step-item">
                      <span className="calc-step-label">3. Confluence Facts ({activeAnalysisTab === 'lv' ? 'Successors' : 'Predecessors'}):</span>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {activeAnalysisTab === 'lv'
                          ? `Successors: ${(selectedBlock.successors || []).join(', ') || 'None (Exit)'}`
                          : `Predecessors: ${(selectedBlock.predecessors || []).join(', ') || 'None (Entry)'}`}
                      </div>
                    </div>

                    <div className="calc-step-item">
                      <span className="calc-step-label">4. Transfer Function Formula:</span>
                      <code>{currentAnalysis.transfer_equation}</code>
                    </div>

                    <div className="calc-step-item">
                      <span className="calc-step-label">5. Resulting IN[B] Set:</span>
                      <div>{renderSet(finalIn[selectedBlock.id] || [])}</div>
                    </div>

                    <div className="calc-step-item">
                      <span className="calc-step-label">6. Resulting OUT[B] Set:</span>
                      <div>{renderSet(finalOut[selectedBlock.id] || [])}</div>
                    </div>
                  </div>

                  <div className="calc-narrative">
                    {activeAnalysisTab === 'rd' && (
                      <span>
                        Block {selectedBlock.id} receives OUT facts entering from predecessor(s): {selectedBlock.predecessors?.join(', ') || 'Entry'}. Their sets are merged using union (∪) to form IN[{selectedBlock.id}]. The block's KILL set is removed, and its GEN set is added to yield OUT[{selectedBlock.id}].
                      </span>
                    )}
                    {activeAnalysisTab === 'lv' && (
                      <span>
                        Block {selectedBlock.id} receives IN facts flowing backward from successor(s): {selectedBlock.successors?.join(', ') || 'Exit'}. Their sets are merged using union (∪) to form OUT[{selectedBlock.id}]. Variables defined in this block (DEF) are removed, and variables read before definition (USE) are added to yield IN[{selectedBlock.id}].
                      </span>
                    )}
                    {activeAnalysisTab === 'ae' && (
                      <span>
                        Block {selectedBlock.id} computes expressions available on all entry paths using intersection (∩). Expressions with operands reassigned in the block are killed, and freshly evaluated expressions in GEN are added to yield OUT[{selectedBlock.id}].
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Definitions mapping table (for Reaching Definitions) */}
              {activeAnalysisTab === 'rd' && currentAnalysis?.definitions_table && currentAnalysis.definitions_table.length > 0 && (
                <div className="aux-subtable-box">
                  <span className="aux-subtable-title">Definitions Mapping (d<sub>i</sub>):</span>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="results-table" style={{ fontSize: '0.74rem' }}>
                      <thead>
                        <tr>
                          <th>Def ID</th>
                          <th>Variable</th>
                          <th>Intermediate Code (3AC)</th>
                          <th>Original Statement</th>
                          <th>Block</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentAnalysis.definitions_table.map((d) => (
                          <tr key={d.id}>
                            <td><strong style={{ color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>{d.id}</strong></td>
                            <td><code>{d.var}</code></td>
                            <td><code>{d.code}</code></td>
                            <td>{d.c_stmt ? `Line ${d.c_line}: ${d.c_stmt}` : '—'}</td>
                            <td>
                              <button
                                style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', color: 'var(--accent-blue)', padding: '1px 6px', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}
                                onClick={() => handleSelectBlock(d.block)}
                              >
                                {d.block}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Universal expressions (for Available Expressions) */}
              {activeAnalysisTab === 'ae' && currentAnalysis?.universal_set && (
                <div className="aux-subtable-box">
                  <span className="aux-subtable-title">Universal Set of Binary Expressions (U):</span>
                  <div>
                    {currentAnalysis.universal_set.length > 0 ? (
                      currentAnalysis.universal_set.map((e) => (
                        <span key={e} className="set-chip-item" style={{ color: 'var(--accent-emerald)', borderColor: 'rgba(63, 185, 80, 0.4)' }}>
                          {e}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.74rem' }}>No binary expressions in program.</span>
                    )}
                  </div>
                </div>
              )}

              {/* Canonical IN/OUT Table */}
              <div style={{ overflowX: 'auto' }}>
                <table className="results-table">
                  <thead>
                    <tr>
                      <th style={{ width: '90px' }}>Block</th>
                      <th>{activeAnalysisTab === 'lv' ? 'USE[B]' : 'GEN[B]'}</th>
                      <th>{activeAnalysisTab === 'lv' ? 'DEF[B]' : 'KILL[B]'}</th>
                      <th>IN[B]</th>
                      <th>OUT[B]</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedBlockIds.length > 0 ? (
                      sortedBlockIds.map((bId) => {
                        const isSelected = selectedBlockId === bId;
                        const gen = blockGen[bId] || [];
                        const kill = blockKill[bId] || [];
                        const inSet = finalIn[bId] || [];
                        const outSet = finalOut[bId] || [];

                        return (
                          <tr
                            key={bId}
                            className={`results-row ${isSelected ? 'selected-row' : ''}`}
                            onClick={() => handleSelectBlock(bId)}
                            title="Click to select block in graph and view calculation breakdown"
                          >
                            <td>
                              <strong style={{ color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
                                {bId}
                              </strong>
                            </td>
                            <td>{renderSet(gen)}</td>
                            <td>{renderSet(kill)}</td>
                            <td>{renderSet(inSet)}</td>
                            <td>{renderSet(outSet)}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '24px' }}>
                          Run analysis to view the data-flow equations and results table.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Section 9: Iteration Visualizer & Scrubber */}
              {steps.length > 0 && (
                <div className="iteration-scrubber-box">
                  <div className="scrubber-controls-row">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowIterationSteps(!showIterationSteps)}
                    >
                      <Activity size={12} />
                      <span>{showIterationSteps ? 'Hide Iteration History' : `Explore Iteration History (${steps.length} steps to Fixed Point)`}</span>
                    </button>

                    {showIterationSteps && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setCurrentStepIdx((p) => Math.max(0, p - 1))}
                          disabled={currentStepIdx === 0}
                        >
                          Prev Step
                        </button>
                        <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          Step {currentStepIdx + 1} / {steps.length}
                        </span>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setCurrentStepIdx((p) => Math.min(steps.length - 1, p + 1))}
                          disabled={currentStepIdx >= steps.length - 1}
                        >
                          Next Step
                        </button>
                      </div>
                    )}
                  </div>

                  {showIterationSteps && steps[currentStepIdx] && (
                    <div className="step-details-callout">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ background: 'var(--bg-card)', padding: '1px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--accent-blue)' }}>
                          Iteration {steps[currentStepIdx].iteration} ({steps[currentStepIdx].block_id})
                        </span>
                        <span style={{ fontSize: '0.7rem', color: steps[currentStepIdx].has_changed ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
                          {steps[currentStepIdx].has_changed ? '▲ State Changed' : '✓ Unchanged'}
                        </span>
                      </div>
                      <div>{steps[currentStepIdx].explanation}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
