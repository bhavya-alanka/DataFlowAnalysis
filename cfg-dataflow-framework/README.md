# CFG and Data-Flow Analysis Framework

An interactive, beginner-friendly compiler analysis and educational platform designed for university Compiler Design coursework and viva demonstrations.

The platform accepts arbitrary user-written programs in a documented C-like language subset, parses them into Three-Address Code (TAC), partitions them into basic blocks using leader detection, constructs an interactive Control Flow Graph (CFG), and solves iterative fixed-point data-flow equations (**Reaching Definitions**, **Live Variables**, and **Available Expressions**).

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
| **CFG** (Control Flow Graph) | A directed diagram showing all possible execution paths through a program. |
| **Basic Block** | A group of consecutive statements executed sequentially from start to end without branching in the middle. |
| **Leader** | The first instruction of a basic block, identified using standard compiler partitioning rules. |
| **GEN** | Facts newly generated or created within a basic block. |
| **KILL** | Previously available facts invalidated or overwritten by an assignment in a basic block. |
| **IN** | Facts entering at the top boundary of a basic block. |
| **OUT** | Facts leaving from the bottom boundary of a basic block. |
| **Fixed Point** | The stage where repeated iterations stop changing the IN/OUT sets; the solution has stabilized. |

---

## 📜 Supported Language Subset & Limitations

The tool accepts arbitrary programs within the following documented grammar:

### ✅ Supported Constructs
- **Variable Assignments**: Both explicit declarations (`int x = 10;`) and implicit assignments (`x = 10;`)
- **Arithmetic Expressions**: `+`, `-`, `*`, `/`, `%` with operator precedence and parentheses `(a + b) * 2`
- **Relational & Equality**: `<`, `<=`, `>`, `>=`, `==`, `!=`
- **Logical Operators**: `&&`, `||`, `!`
- **Conditionals**: `if (cond) { ... } else { ... }` and single-statement branches without braces
- **Loops**: `while (cond) { ... }` and `for (init; cond; post) { ... }` with loop back-edges
- **Nested Control Flow**: Nested `if` inside `if`, and `if` inside `while` loops
- **Program Structures**: Formal C functions (`int main() { ... }`) or bare top-level statement sequences

### ⚠️ Unsupported Constructs (Rejected with Clear Error Messages)
- Floating-point types (`float`, `double`)
- Pointer arithmetic and dereferencing (`*ptr`, `&var`)
- Aggregate data types (`struct`, `union`, `enum`, arrays)
- Unstructured jumps (`goto`, `switch`, `case`)
- Preprocessor macros (`#include`, `#define`)

When unsupported syntax is entered, the tool identifies the exact line and column number, explains what is unsupported, and preserves the user's code.

---

## 🧪 Benchmark Test Programs

The following programs are pre-loaded in the example dropdown and can also be typed manually:

### Program A — Sequential Assignments
```c
a = 10;
b = 20;
c = a + b;
d = c * 2;
```

### Program B — Conditional Flow
```c
x = 10;

if (x > 5) {
    y = x + 1;
} else {
    y = x - 1;
}

z = y * 2;
```

### Program C — Loop Flow
```c
i = 0;
sum = 0;

while (i < 5) {
    sum = sum + i;
    i = i + 1;
}

result = sum;
```

### Program D — Nested Control Flow
```c
x = 10;
y = 0;

if (x > 0) {
    if (x > 5) {
        y = x * 2;
    } else {
        y = x + 2;
    }
} else {
    y = 0;
}

result = y;
```

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

## 🧪 Running Automated Tests

Run backend unit and integration tests:
```powershell
cd cfg-dataflow-framework/backend
.\venv\Scripts\Activate.ps1
pytest -v tests/
```
All 18 unit tests pass across lexer, parser, basic blocks, CFG construction, and all three data-flow analysis models.

To run the frontend production build:
```powershell
cd cfg-dataflow-framework/frontend
npm run build
```
Vite compiles the React application cleanly with zero errors.
