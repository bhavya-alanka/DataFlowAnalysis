import React from 'react';
import { Sparkles, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function OptimizationsView({ optimizations = [] }) {
  if (!optimizations || optimizations.length === 0) {
    return (
      <div className="analysis-container">
        <div className="empty-state">
          <CheckCircle size={44} style={{ color: 'var(--accent-emerald)' }} />
          <h3>Clean Intermediate Code</h3>
          <p>
            No dead assignments, uninitialized variables, or redundant common subexpressions were detected!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-container">
      <div className="theory-card">
        <div className="theory-header">
          <h4>Compiler Optimization Opportunities & Diagnostics</h4>
          <span className="eq-tag">Static Code Analysis</span>
        </div>
        <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>
          The dataflow analyses have uncovered the following optimization opportunities and safety diagnostics:
        </p>
      </div>

      <div className="optimizations-grid">
        {optimizations.map((opt, idx) => {
          let Icon = Info;
          if (opt.severity === 'warning') Icon = AlertTriangle;
          else if (opt.severity === 'success') Icon = Sparkles;

          return (
            <div key={idx} className={`opt-card ${opt.severity}`}>
              <div className="opt-card-header">
                <span className="opt-type-tag">
                  {opt.type.replace('_', ' ')}
                </span>
                <span className="opt-source">{opt.source}</span>
              </div>
              <p className="opt-msg">{opt.message}</p>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Location: Block <strong>{opt.block}</strong>
                {opt.line && <>, C Source Line <strong>#{opt.line}</strong></>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
