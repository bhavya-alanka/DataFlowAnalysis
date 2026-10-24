import React from 'react';
import { X } from 'lucide-react';

export default function BlockInspector({ block, analysisData, onClose }) {
  if (!block) return null;

  const bId = block.id;
  const rd = analysisData?.reaching_definitions;
  const lv = analysisData?.live_variables;
  const ae = analysisData?.available_expressions;

  const rdIn = rd?.final_in?.[bId] || [];
  const rdOut = rd?.final_out?.[bId] || [];
  const rdGen = rd?.block_gen?.[bId] || [];
  const rdKill = rd?.block_kill?.[bId] || [];

  const lvIn = lv?.final_in?.[bId] || [];
  const lvOut = lv?.final_out?.[bId] || [];
  const lvUse = lv?.block_gen?.[bId] || [];
  const lvDef = lv?.block_kill?.[bId] || [];

  const aeIn = ae?.final_in?.[bId] || [];
  const aeOut = ae?.final_out?.[bId] || [];
  const aeGen = ae?.block_gen?.[bId] || [];
  const aeKill = ae?.block_kill?.[bId] || [];

  return (
    <aside className={`inspector-drawer ${block ? 'open' : ''}`}>
      <div className="drawer-header">
        <h4>{bId} Block Details</h4>
        <button className="btn-icon" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <div className="drawer-body">
        {/* Predecessors & Successors */}
        <div className="drawer-group">
          <h5>Predecessors</h5>
          <div className="drawer-pills">
            {block.predecessors?.length > 0 ? (
              block.predecessors.map((p) => (
                <span key={p} className="drawer-pill">
                  {p}
                </span>
              ))
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>None (Entry point)</span>
            )}
          </div>
        </div>

        <div className="drawer-group">
          <h5>Successors</h5>
          <div className="drawer-pills">
            {block.successors?.length > 0 ? (
              block.successors.map((s) => (
                <span key={s} className="drawer-pill">
                  {s}
                </span>
              ))
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>None (Terminal)</span>
            )}
          </div>
        </div>

        {/* Statements */}
        <div className="drawer-group">
          <h5>Intermediate Statements (3AC)</h5>
          {block.instructions && block.instructions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {block.instructions.map((instr) => (
                <div
                  key={instr.id}
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.74rem',
                    color: instr.is_leader ? '#fde047' : '#cbd5e1',
                  }}
                >
                  {instr.is_leader && '★ '}
                  {instr.raw}
                  {instr.c_stmt && (
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                      C: {instr.c_stmt}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>
              {block.is_entry ? 'Program Entry Point' : 'Program Termination'}
            </span>
          )}
        </div>

        {/* Reaching Definitions Sets */}
        {rd && (
          <div className="drawer-group">
            <h5>Reaching Definitions</h5>
            <div className="drawer-set-box">
              <div>
                <strong>GEN:</strong> {`{ ${rdGen.join(', ') || '∅'} }`}
              </div>
              <div>
                <strong>KILL:</strong> {`{ ${rdKill.join(', ') || '∅'} }`}
              </div>
              <div style={{ marginTop: 4, color: 'var(--accent-cyan)' }}>
                <strong>IN:</strong> {`{ ${rdIn.join(', ') || '∅'} }`}
              </div>
              <div style={{ color: 'var(--accent-cyan)' }}>
                <strong>OUT:</strong> {`{ ${rdOut.join(', ') || '∅'} }`}
              </div>
            </div>
          </div>
        )}

        {/* Live Variables Sets */}
        {lv && (
          <div className="drawer-group">
            <h5>Live Variables</h5>
            <div className="drawer-set-box">
              <div>
                <strong>USE:</strong> {`{ ${lvUse.join(', ') || '∅'} }`}
              </div>
              <div>
                <strong>DEF:</strong> {`{ ${lvDef.join(', ') || '∅'} }`}
              </div>
              <div style={{ marginTop: 4, color: 'var(--accent-purple)' }}>
                <strong>IN:</strong> {`{ ${lvIn.join(', ') || '∅'} }`}
              </div>
              <div style={{ color: 'var(--accent-purple)' }}>
                <strong>OUT:</strong> {`{ ${lvOut.join(', ') || '∅'} }`}
              </div>
            </div>
          </div>
        )}

        {/* Available Expressions Sets */}
        {ae && (
          <div className="drawer-group">
            <h5>Available Expressions</h5>
            <div className="drawer-set-box">
              <div>
                <strong>GEN:</strong> {`{ ${aeGen.join(', ') || '∅'} }`}
              </div>
              <div>
                <strong>KILL:</strong> {`{ ${aeKill.join(', ') || '∅'} }`}
              </div>
              <div style={{ marginTop: 4, color: 'var(--accent-amber)' }}>
                <strong>IN:</strong> {`{ ${aeIn.join(', ') || '∅'} }`}
              </div>
              <div style={{ color: 'var(--accent-amber)' }}>
                <strong>OUT:</strong> {`{ ${aeOut.join(', ') || '∅'} }`}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
