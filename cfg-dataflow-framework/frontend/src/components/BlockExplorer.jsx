import React from 'react';
import { Layers, ArrowRight } from 'lucide-react';

export default function BlockExplorer({ cfgData, onSelectBlock }) {
  if (!cfgData || !cfgData.blocks || cfgData.blocks.length === 0) {
    return (
      <div className="empty-state">
        <Layers size={40} />
        <h3>No Basic Blocks Generated</h3>
        <p>Run analysis on a C program to inspect the partitioned basic blocks and leaders.</p>
      </div>
    );
  }

  const userBlocks = cfgData.blocks.filter((b) => !b.is_entry && !b.is_exit);

  return (
    <div className="analysis-container">
      <div className="theory-card">
        <div className="theory-header">
          <h4>Basic Blocks & Leader Identification</h4>
          <span className="eq-tag">Partitioning Rules</span>
        </div>
        <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>
          A <strong>basic block</strong> is a sequence of consecutive instructions with single entry and single exit. Leaders are determined by:
          <br />• <strong>Rule 1:</strong> The first instruction of the intermediate code.
          <br />• <strong>Rule 2:</strong> Any instruction that is the target of a conditional or unconditional jump.
          <br />• <strong>Rule 3:</strong> Any instruction immediately following a conditional or unconditional jump.
        </p>
      </div>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Block ID</th>
              <th>Predecessors</th>
              <th>Successors</th>
              <th>Leader Instruction & Reason</th>
              <th>Statements Count</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {userBlocks.map((block) => {
              const leader = block.instructions?.[0];
              return (
                <tr key={block.id}>
                  <td>
                    <strong style={{ color: 'var(--accent-cyan)' }}>{block.id}</strong>
                  </td>
                  <td>
                    {block.predecessors?.length > 0
                      ? block.predecessors.map((p) => (
                          <span key={p} className="drawer-pill" style={{ marginRight: 4 }}>
                            {p}
                          </span>
                        ))
                      : '—'}
                  </td>
                  <td>
                    {block.successors?.length > 0
                      ? block.successors.map((s) => (
                          <span key={s} className="drawer-pill" style={{ marginRight: 4 }}>
                            {s}
                          </span>
                        ))
                      : '—'}
                  </td>
                  <td>
                    {leader ? (
                      <div>
                        <code style={{ color: '#fde047' }}>★ {leader.raw}</code>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {leader.leader_reason}
                        </div>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{block.instructions?.length || 0}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => onSelectBlock(block)}
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
