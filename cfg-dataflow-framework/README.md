# CFG & Data-Flow Analysis Framework

An academic-grade **Control Flow Graph (CFG) and Data-Flow Analysis Studio** designed for compiling a supported subset of C source code, generating Three-Address Code (TAC), partitioning basic blocks, constructing Control Flow Graphs, and performing iterative fixed-point Data-Flow Analyses (**Reaching Definitions**, **Live Variables**, and **Available Expressions**).

---

## 🌐 Live Application URLs

- **Frontend Application (React + React Flow)**: [http://localhost:5173/](http://localhost:5173/)
- **Backend API (FastAPI)**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Interactive API Documentation (Swagger)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 🛠️ Architecture & Modules

```
backend/
    main.py                       # FastAPI application & REST endpoints
    requirements.txt              # Backend dependencies
    compiler/
        __init__.py
        lexer.py                  # Tokenizer with line/col tracking & keyword rejection
        parser.py                 # Recursive-descent C parser with operator precedence
        ast_nodes.py              # AST class hierarchy
        basic_blocks.py           # TAC IR generator & 3-rule leader detection
        cfg.py                    # Control Flow Graph builder & back-edge detection
        validation.py             # Semantic analysis & unsupported feature rejection
        dataflow/
            __init__.py
            framework.py          # Abstract DataFlowAnalysis & Step models
            reaching_definitions.py # Forward union analysis with uninit-use warnings
            live_variables.py     # Backward union analysis with dead assignment detector
            available_expressions.py # Forward intersection analysis with CSE detector
    tests/
        conftest.py
        test_lexer.py
        test_parser.py
        test_basic_blocks.py
        test_cfg.py
        test_reaching_definitions.py
        test_live_variables.py
        test_available_expressions.py
        test_api.py

frontend/
    index.html
    vite.config.js
    package.json
    src/
        main.jsx                  # React application entry
        App.jsx                   # Main layout & state orchestrator
        components/
            CFGGraph.jsx          # React Flow (@xyflow/react) interactive visualizer
            CodeEditor.jsx        # Monospace C editor with syntax errors & benchmarks
            BlockExplorer.jsx     # Basic blocks & leader identification table
            DataFlowPanel.jsx     # Dataflow equations, steps scrubber & matrix table
            BlockInspector.jsx    # Selected block drawer with IN/OUT/GEN/KILL sets
            OptimizationsView.jsx # Compiler diagnostics (dead code, CSE, uninit vars)
            AlgorithmExplanations.jsx # Theoretical foundations & C subset docs
        styles/
            index.css             # Cyber-dark IDE styling & React Flow themes
```

---

## 📜 Supported C Language Subset

| Category | Supported Constructs | Unsupported Constructs (Rejected with helpful errors) |
| :--- | :--- | :--- |
| **Data Types** | `int`, `void` | `float`, `double`, `char`, `struct`, `union`, `enum` |
| **Control Flow** | `if`, `else if`, `else`, `while`, `for`, `do-while`, `break`, `continue`, `return` | `switch`, `case`, `goto` |
| **Operators** | `+`, `-`, `*`, `/`, `%`, `==`, `!=`, `<`, `>`, `<=`, `>=`, `&&`, `||`, `!`, `++`, `--`, `+=`, `-=`, `*=`, `/=` | Pointers (`*p`, `&var`), bitwise shifts (`<<`, `>>`) |
| **Structure** | Full functions (`int main() { ... }`) or top-level statements | Preprocessor directives (`#include`, `#define`) |

---

## 🧠 Compiler Algorithms Implemented

### 1. Basic Block Leader Detection
- **Rule 1**: The first instruction of the intermediate code is a leader.
- **Rule 2**: Any instruction that is the target of a conditional or unconditional branch is a leader.
- **Rule 3**: Any instruction that immediately follows a conditional or unconditional branch is a leader.

### 2. Reaching Definitions Analysis
- **Direction**: Forward
- **Meet Operator**: $\bigcup$ (Union)
- **Transfer Equation**: $\text{OUT}[B] = \text{GEN}[B] \cup (\text{IN}[B] - \text{KILL}[B])$
- **Confluence Equation**: $\text{IN}[B] = \bigcup_{P \in \text{Pred}(B)} \text{OUT}[P]$
- **Boundary**: $\text{OUT}[\text{ENTRY}] = \emptyset$

### 3. Live Variable Analysis
- **Direction**: Backward
- **Meet Operator**: $\bigcup$ (Union)
- **Transfer Equation**: $\text{IN}[B] = \text{USE}[B] \cup (\text{OUT}[B] - \text{DEF}[B])$
- **Confluence Equation**: $\text{OUT}[B] = \bigcup_{S \in \text{Succ}(B)} \text{IN}[S]$
- **Boundary**: $\text{IN}[\text{EXIT}] = \emptyset$

### 4. Available Expressions Analysis
- **Direction**: Forward
- **Meet Operator**: $\bigcap$ (Intersection)
- **Transfer Equation**: $\text{OUT}[B] = e\_\text{GEN}[B] \cup (\text{IN}[B] - e\_\text{KILL}[B])$
- **Confluence Equation**: $\text{IN}[B] = \bigcap_{P \in \text{Pred}(B)} \text{OUT}[P]$
- **Boundary**: $\text{OUT}[\text{ENTRY}] = \emptyset$; initial $\text{OUT}[B] = U$ for all $B \ne \text{ENTRY}$.

---

## 🧪 Running Tests

To run the backend pytest suite:
```powershell
cd cfg-dataflow-framework/backend
.\venv\Scripts\Activate.ps1
pytest -v tests/
```
All 18 tests pass across lexer, parser, basic blocks, CFG, dataflow analyses, and API integration.
