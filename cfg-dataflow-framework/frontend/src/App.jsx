import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  ArrowRight,
  Play,
  RotateCcw,
  Sparkles,
  BookOpen,
  GitBranch,
  TrendingDown,
  TrendingUp,
  Workflow,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

import CFGGraph from './components/CFGGraph';
import CodeEditor from './components/CodeEditor';
import BlockExplorer from './components/BlockExplorer';
import DataFlowPanel from './components/DataFlowPanel';
import BlockInspector from './components/BlockInspector';
import OptimizationsView from './components/OptimizationsView';
import AlgorithmExplanations from './components/AlgorithmExplanations';
import { DEFAULT_SAMPLES } from './constants/samples';

export default function App() {
  const [samples, setSamples] = useState(DEFAULT_SAMPLES);
  const [selectedSampleId, setSelectedSampleId] = useState(DEFAULT_SAMPLES[0].id);
  const [code, setCode] = useState(DEFAULT_SAMPLES[0].code.trim());
  const [isServerHealthy, setIsServerHealthy] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const [activeTab, setActiveTab] = useState('cfg');
  const [analysisData, setAnalysisData] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);

  const toastTimerRef = useRef(null);

  const showToast = (message, type = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage({ message, type });
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Helper to fetch from proxy or fallback to absolute backend URL
  const fetchWithFallback = async (endpoint, options = {}) => {
    try {
      const res = await fetch(endpoint, options);
      if (res.ok) return res;
    } catch {
      // Fallback to absolute URL
    }
    return fetch(`http://127.0.0.1:8000${endpoint}`, options);
  };

  // Check backend health
  const checkHealth = async () => {
    try {
      const res = await fetchWithFallback('/health');
      if (res.ok) {
        setIsServerHealthy(true);
      } else {
        setIsServerHealthy(false);
      }
    } catch {
      setIsServerHealthy(false);
    }
  };

  // Run dataflow analysis
  const runAnalysis = async (codeToRun) => {
    const codeString = (typeof codeToRun === 'string' ? codeToRun : code) || '';

    if (!codeString.trim()) {
      setError({
        error_type: 'Input Error',
        message: 'Please enter C source code to analyze.'
      });
      showToast('Please enter C source code', 'error');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await fetchWithFallback('/api/analyze/all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeString, language: 'c' }),
      });

      const data = await res.json();
      if (!res.ok) {
        let msg = 'Compilation failed';
        let line = null;
        let col = null;
        let type = 'Compilation Error';

        if (typeof data.detail === 'string') {
          msg = data.detail;
        } else if (Array.isArray(data.detail)) {
          msg = data.detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
        } else if (typeof data.detail === 'object' && data.detail !== null) {
          msg = data.detail.message || data.detail.msg || JSON.stringify(data.detail);
          line = data.detail.line || null;
          col = data.detail.col || null;
          type = data.detail.error_type || 'Compilation Error';
        }
        setError({ error_type: type, message: String(msg), line, col });
        setAnalysisData(null);
        showToast(String(msg), 'error');
        return;
      }

      setAnalysisData(data);
      const userBlocks = data.cfg?.blocks?.filter((b) => !b.is_entry && !b.is_exit);
      if (userBlocks && userBlocks.length > 0) {
        setSelectedBlock(userBlocks[0]);
      }
      showToast(`Analysis complete: ${data.cfg?.blocks?.length || 0} blocks, 3 data-flow models solved!`, 'success');
    } catch (err) {
      const errStr = err?.message || 'Failed to connect to backend compiler server';
      setError({
        error_type: 'Network Error',
        message: errStr
      });
      setAnalysisData(null);
      showToast(errStr, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Fetch benchmark samples & run initial analysis on mount
  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 5000);

    fetchWithFallback('/api/samples')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSamples(data);
        }
      })
      .catch((err) => console.log('Using embedded default benchmarks:', err));

    // Run initial analysis with default sample
    runAnalysis(DEFAULT_SAMPLES[0].code.trim());

    return () => {
      clearInterval(interval);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const handleSelectSample = (sampleId) => {
    const found = samples.find((s) => s.id === sampleId) || DEFAULT_SAMPLES.find((s) => s.id === sampleId);
    if (found) {
      setSelectedSampleId(sampleId);
      const trimmed = found.code.trim();
      setCode(trimmed);
      setError(null);
      runAnalysis(trimmed);
      showToast(`Loaded benchmark: ${found.title}`, 'success');
    }
  };

  const handleReset = () => {
    const currentSample =
      samples.find((s) => s.id === selectedSampleId) ||
      DEFAULT_SAMPLES.find((s) => s.id === selectedSampleId) ||
      DEFAULT_SAMPLES[0];

    const cleanCode = currentSample.code.trim();
    setCode(cleanCode);
    setError(null);
    runAnalysis(cleanCode);
    showToast(`Reset code to: ${currentSample.title}`, 'success');
  };

  const handleClear = () => {
    setCode('');
    setAnalysisData(null);
    setSelectedBlock(null);
    setError(null);
    showToast('Editor cleared. Enter your C program.', 'info');
  };

  const handleHighlightBlockFromStep = (bId) => {
    if (analysisData?.cfg?.blocks) {
      const b = analysisData.cfg.blocks.find((blk) => blk.id === bId);
      if (b) setSelectedBlock(b);
    }
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: 70,
            right: 24,
            zIndex: 1000,
            background:
              toastMessage.type === 'error'
                ? 'rgba(239, 68, 68, 0.95)'
                : toastMessage.type === 'info'
                ? 'rgba(56, 189, 248, 0.95)'
                : 'rgba(16, 185, 129, 0.95)',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            fontSize: '0.82rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle size={16} />
          ) : (
            <CheckCircle2 size={16} />
          )}
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <div className="brand-logo">
            <Workflow className="logo-icon" />
            <div className="brand-text">
              <h1>DataFlowCD</h1>
              <span className="sub-brand">CFG & Data-Flow Analysis Framework</span>
            </div>
          </div>
          <div className={`server-status ${isServerHealthy ? '' : 'error'}`}>
            <span className="status-dot"></span>
            <span>
              {isServerHealthy
                ? 'Backend: 127.0.0.1:8000 (Active)'
                : 'Connecting to Backend...'}
            </span>
          </div>
        </div>

        <div className="header-center">
          <div className="sample-picker">
            <label htmlFor="sample-select">Load Benchmark:</label>
            <select
              id="sample-select"
              value={selectedSampleId}
              onChange={(e) => handleSelectSample(e.target.value)}
            >
              {samples.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="header-right">
          <button
            className="btn btn-secondary"
            onClick={handleReset}
            title="Reset to benchmark code"
          >
            <RotateCcw size={14} /> Reset
          </button>
          <button
            className="btn btn-primary"
            onClick={() => runAnalysis(code)}
            disabled={isAnalyzing}
            title="Analyze C code (Ctrl+Enter)"
          >
            <Play size={14} />
            {isAnalyzing ? 'Analyzing...' : 'Analyze Program'}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="app-workspace">
        {/* Left Pane: Code Editor */}
        <CodeEditor
          code={code}
          setCode={setCode}
          error={error}
          onAnalyze={() => runAnalysis(code)}
          onReset={handleReset}
          onClear={handleClear}
          onSelectSample={handleSelectSample}
          samples={samples}
          isAnalyzing={isAnalyzing}
        />

        {/* Right Pane: Visualizer & Analysis Workspace */}
        <section className="visualizer-pane">
          {/* Navigation Tabs */}
          <nav className="nav-tabs" role="tablist">
            <button
              className={`tab-btn ${activeTab === 'cfg' ? 'active' : ''}`}
              onClick={() => setActiveTab('cfg')}
            >
              <GitBranch size={15} />
              CFG Visual Graph
            </button>
            <button
              className={`tab-btn ${activeTab === 'blocks' ? 'active' : ''}`}
              onClick={() => setActiveTab('blocks')}
            >
              <Layers size={15} />
              Basic Blocks
            </button>
            <button
              className={`tab-btn ${activeTab === 'rd' ? 'active' : ''}`}
              onClick={() => setActiveTab('rd')}
            >
              <ArrowRight size={15} />
              Reaching Definitions
              <span className="tab-badge">Forward</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'lv' ? 'active' : ''}`}
              onClick={() => setActiveTab('lv')}
            >
              <TrendingDown size={15} />
              Live Variables
              <span className="tab-badge badge-backward">Backward</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'ae' ? 'active' : ''}`}
              onClick={() => setActiveTab('ae')}
            >
              <TrendingUp size={15} />
              Available Expressions
              <span className="tab-badge badge-intersect">∩ Meet</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'opt' ? 'active' : ''}`}
              onClick={() => setActiveTab('opt')}
            >
              <Sparkles size={15} />
              Optimizations
              <span className="tab-counter">
                {analysisData?.optimizations?.length || 0}
              </span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'theory' ? 'active' : ''}`}
              onClick={() => setActiveTab('theory')}
            >
              <BookOpen size={15} />
              Algorithm Theory
            </button>
          </nav>

          {/* Tab Content Area */}
          <div className="tab-content-area">
            {activeTab === 'cfg' && (
              <CFGGraph
                cfgData={analysisData?.cfg}
                selectedBlockId={selectedBlock?.id}
                onSelectBlock={(b) => setSelectedBlock(b)}
              />
            )}

            {activeTab === 'blocks' && (
              <BlockExplorer
                cfgData={analysisData?.cfg}
                onSelectBlock={(b) => {
                  setSelectedBlock(b);
                  setActiveTab('cfg');
                }}
              />
            )}

            {activeTab === 'rd' && (
              <DataFlowPanel
                analysisData={analysisData}
                activeType="rd"
                onHighlightBlock={handleHighlightBlockFromStep}
              />
            )}

            {activeTab === 'lv' && (
              <DataFlowPanel
                analysisData={analysisData}
                activeType="lv"
                onHighlightBlock={handleHighlightBlockFromStep}
              />
            )}

            {activeTab === 'ae' && (
              <DataFlowPanel
                analysisData={analysisData}
                activeType="ae"
                onHighlightBlock={handleHighlightBlockFromStep}
              />
            )}

            {activeTab === 'opt' && (
              <OptimizationsView
                optimizations={analysisData?.optimizations}
              />
            )}

            {activeTab === 'theory' && <AlgorithmExplanations />}
          </div>

          {/* Block Inspector Drawer */}
          <BlockInspector
            block={selectedBlock}
            analysisData={analysisData}
            onClose={() => setSelectedBlock(null)}
          />
        </section>
      </main>
    </div>
  );
}
