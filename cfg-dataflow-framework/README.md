# CFG and Data-Flow Analysis Framework

An interactive, beginner-friendly compiler analysis and educational platform designed for university Compiler Design coursework and viva demonstrations.

The platform accepts arbitrary user-written programs in a documented C-like language subset, parses them into Three-Address Code (TAC), partitions them into basic blocks using leader detection rules, constructs an interactive Control Flow Graph (CFG), and solves iterative fixed-point data-flow equations (**Reaching Definitions**, **Live Variables**, and **Available Expressions**).

---

## 🏛️ Architecture Overview

The framework follows a modular decoupled architecture:

```text
[ Source Code (C Subset) ]
           │
           ▼
[ Lexer (lexer.py) ] ──▶ Tokens (with line/column positions)
           │
           ▼
[ Recursive-Descent Parser (parser.py) ] ──▶ Abstract Syntax Tree (AST)
           │
           ▼
[ Intermediate Code Generator (basic_blocks.py) ] ──▶ Linear Three-Address Code (TAC)
           │
           ▼
[ BasicBlockBuilder (basic_blocks.py) ] ──▶ Leaders (Rules 1, 2, 3) & Basic Blocks
           │
           ▼
[ CFGBuilder (compiler/cfg.py) ] ──▶ Directed CFG (ENTRY, BasicBlocks, EXIT, Edges)
           │
           ├──▶ [ Reaching Definitions ] (Forward May, ∪)
           ├──▶ [ Live Variables ]       (Backward May, ∪)
           └──▶ [ Available Expressions ] (Forward Must, ∩)
           │
           ▼
[ FastAPI Server (main.py:8000) ]
           │ (REST JSON API)
           ▼
[ React + Vite Frontend (localhost:5173) ]
     ├── Code Editor & Sample Selector
     ├── Interactive React Flow CFG Canvas
     ├── Data-Flow Results & Canonical IN/OUT Table
     └── Beginner Glossary & Step Scrubber
```

---

## 🌐 Quickstart & Setup

### Prerequisites
- **Python**: 3.10+ (tested with Python 3.13)
- **Node.js**: v18+ or v20+

### 1. Start the Backend API (FastAPI)
```powershell
cd cfg-dataflow-framework/backend

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Run the FastAPI server
uvicorn main:app --host 127.0.0.1 --port 8000
```
- Backend runs at: `http://127.0.0.1:8000/`
- Interactive Swagger API docs: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/health`

### 2. Start the Frontend (React + Vite)
In a separate terminal:
```powershell
cd cfg-dataflow-framework/frontend

# Install dependencies if not already installed
npm install

# Start the Vite development server
npm run dev
```
- Open `http://localhost:5173/` in your browser.

---

## 📖 Key Concepts for Beginners

| Technical Term | Simple Explanation |
| :--- | :--- |
| **CFG** (Control Flow Graph) | Shows the possible execution paths of a program. |
| **Basic Block** | Sequential statements grouped together that execute from start to finish without branching in the middle. |
| **Leader** | The first instruction of a basic block, identified using standard 3AC partitioning rules. |
| **GEN** | Facts newly generated or created within a basic block. |
| **KILL** | Facts invalidated or overwritten by an assignment in a basic block. |
| **IN** | Facts entering at the boundary of a basic block. |
| **OUT** | Facts leaving from the boundary of a basic block. |
| **Fixed Point** | The stage where repeated iterations stop changing the results; the data-flow equations have stabilized. |

---

## 📜 Supported Language Syntax

The compiler processes arbitrary user-written programs within the following documented grammar:

### ✅ Supported Constructs
- **Variable Assignments**: Explicit declarations (`int x = 10;`) and direct assignments (`x = 10;`)
- **Arithmetic Expressions**: Binary operators `+`, `-`, `*`, `/`, `%` with operator precedence and grouping parentheses `(a + b) * 2`
- **Relational & Equality Operators**: `<`, `<=`, `>`, `>=`, `==`, `!=`
- **Logical Operators**: `&&`, `||`, `!`
- **Conditionals**: `if (cond) { ... } else { ... }` and single-statement branches without braces
- **Loops**: `while (cond) { ... }`, `for (init; cond; post) { ... }`, and `do { ... } while (cond);`
- **Nested Control Flow**: Nested `if` inside `if`, `while` inside `while`, and conditionals inside loops
- **Program Structures**: Formal C functions (`int main() { ... }`) or bare top-level statement sequences
- **Return Statements**: `return expr;` or `return;`

### ⚠️ Unsupported Constructs (Rejected with Informative Errors)
- Pointer arithmetic and dereferencing (`*ptr`, `&var`)
- Aggregate data types (`struct`, `union`, `enum`, multi-dimensional arrays)
- Unstructured jumps (`goto`, `switch`, `case`)
- Preprocessor directives (`#include`, `#define`)

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Request Body | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | None | Returns `{"status": "healthy"}` |
| `GET` | `/api/samples` | None | Returns list of benchmark C sample programs |
| `POST` | `/api/cfg/build` | `{"code": str}` | Compiles source code into CFG JSON structure |
| `POST` | `/api/analyze/reaching-definitions` | `{"code": str}` | Runs Reaching Definitions fixed-point analysis |
| `POST` | `/api/analyze/live-variables` | `{"code": str}` | Runs Live Variable analysis |
| `POST` | `/api/analyze/available-expressions` | `{"code": str}` | Runs Available Expressions analysis |
| `POST` | `/api/analyze/all` | `{"code": str}` | Runs full compiler pipeline and all 3 analyses |

---

## 🧠 Data-Flow Analysis Equations

### 1. Reaching Definitions (Forward, Union)
- **Goal**: Determines which variable assignments ($d_i$) may reach each program point without being killed by another assignment to the same variable.
- **Transfer Equation**: $\text{OUT}[B] = \text{GEN}[B] \cup (\text{IN}[B] - \text{KILL}[B])$
- **Confluence Equation**: $\text{IN}[B] = \bigcup_{P \in \text{Pred}(B)} \text{OUT}[P]$
- **Boundary Condition**: $\text{OUT}[\text{ENTRY}] = \emptyset$

### 2. Live Variables (Backward, Union)
- **Goal**: Identifies which variables may be read along some future execution path before being redefined.
- **Transfer Equation**: $\text{IN}[B] = \text{USE}[B] \cup (\text{OUT}[B] - \text{DEF}[B])$
- **Confluence Equation**: $\text{OUT}[B] = \bigcup_{S \in \text{Succ}(B)} \text{IN}[S]$
- **Boundary Condition**: $\text{IN}[\text{EXIT}] = \emptyset$

### 3. Available Expressions (Forward, Intersection)
- **Goal**: Identifies expressions whose computed values are guaranteed to be available along every path entering a block without operand reassignment.
- **Transfer Equation**: $\text{OUT}[B] = \text{GEN}[B] \cup (\text{IN}[B] - \text{KILL}[B])$
- **Confluence Equation**: $\text{IN}[B] = \bigcap_{P \in \text{Pred}(B)} \text{OUT}[P]$
- **Boundary Condition**: $\text{OUT}[\text{ENTRY}] = \emptyset$; initially $\text{OUT}[B] = U$ for all $B \ne \text{ENTRY}$.

---

## 🧪 Testing Commands

### Backend Automated Tests
```powershell
cd cfg-dataflow-framework/backend
.\venv\Scripts\Activate.ps1
pytest -v
```
- Total test count: **34 passing tests** across lexer, parser, basic blocks, CFG construction, and all 3 data-flow analyses.
- Includes comprehensive integration tests for:
  1. Sequential assignments
  2. Multiple definitions of the same variable (KILL verification)
  3. If-else statements with merge points
  4. While loops with back edges
  5. Nested conditional statements
  6. Combined branching and loops
  7. Expression invalidation in Available Expressions
  8. Empty input validation
  9. Malformed source code error handling
  10. Unsupported construct error messages
  11. Arbitrary user-written programs

### Frontend Production Build
```powershell
cd cfg-dataflow-framework/frontend
npm run build
```
Vite builds the production bundle cleanly with 0 errors.

---

## ⚠️ Known Limitations
- The supported language subset targets procedural straight-line code, conditionals, and loops. Multi-file compilation and external libraries are not supported.
- Arrays and pointer indirection are not modeled; variables are treated as scalar identifiers.
