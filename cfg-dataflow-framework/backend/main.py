import sys
import os

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from compiler.lexer import Lexer, LexerError
from compiler.parser import Parser, ParserError
from compiler.validation import ASTValidator, ValidationError
from compiler.basic_blocks import TACGenerator, BasicBlockBuilder
from compiler.cfg import CFGBuilder, CFG
from compiler.dataflow.reaching_definitions import ReachingDefinitions
from compiler.dataflow.live_variables import LiveVariables
from compiler.dataflow.available_expressions import AvailableExpressions

app = FastAPI(
    title="CFG and Data-Flow Analysis Framework",
    description="A visual compiler analysis tool supporting C subset compilation, CFG construction, and iterative dataflow analysis.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CodeRequest(BaseModel):
    code: str
    language: Optional[str] = "c"  # 'c' or 'tac'

class SampleProgram(BaseModel):
    id: str
    title: str
    description: str
    code: str

C_SAMPLE_PROGRAMS: List[SampleProgram] = [
    SampleProgram(
        id="while_loop",
        title="While Loop (Sum 1 to 10)",
        description="Standard while loop accumulating sum from 1 to 10. Demonstrates natural loops, back edges, and loop-carried definitions.",
        code="""int main() {
    int i = 1;
    int sum = 0;
    while (i <= 10) {
        sum = sum + i;
        i = i + 1;
    }
    return sum;
}"""
    ),
    SampleProgram(
        id="if_else_diamond",
        title="If-Else Diamond Branching",
        description="Classic control-flow split and reconvergence. Demonstrates merge points, union/intersection dataflow confluence.",
        code="""int main() {
    int a = 5;
    int b = 10;
    int x = a + b;
    int y = 0;
    int z = 0;

    if (x > 10) {
        y = a + b;
        z = 100;
    } else {
        y = 20;
        z = a + b;
    }

    int res = y + z;
    return res;
}"""
    ),
    SampleProgram(
        id="for_loop_nested",
        title="Nested For Loops with Break",
        description="Two levels of loop nesting with conditional early break. Tests multi-level CFG hierarchy and back edges.",
        code="""int main() {
    int count = 0;
    for (int i = 0; i < 5; i++) {
        for (int j = 0; j < 3; j++) {
            count = count + 1;
            if (count == 8) {
                break;
            }
        }
    }
    return count;
}"""
    ),
    SampleProgram(
        id="euclid_gcd",
        title="Euclidean GCD Algorithm",
        description="Calculates greatest common divisor using modulo inside a while loop with variable updates.",
        code="""int main() {
    int a = 48;
    int b = 18;
    while (b != 0) {
        int t = b;
        b = a % b;
        a = t;
    }
    return a;
}"""
    ),
    SampleProgram(
        id="optimizations_demo",
        title="CSE & Dead Code Optimization Demo",
        description="Contains duplicate expressions (a * b) and dead assignments to test compiler diagnostics.",
        code="""int main() {
    int a = 5;
    int b = 10;
    int dead_val = 999;
    int x = a * b;
    int unused = a + b;
    int y = a * b;
    int result = x + y;
    return result;
}"""
    )
]

def compile_c_to_cfg(source_code: str) -> CFG:
    # 1. Lexical Analysis
    try:
        lexer = Lexer(source_code)
        tokens = lexer.tokenize()
    except LexerError as e:
        raise HTTPException(status_code=400, detail={
            "error_type": "LexerError",
            "message": e.message,
            "line": e.line,
            "col": e.col
        })

    # 2. Syntax Analysis & Parsing
    try:
        parser = Parser(tokens)
        ast = parser.parse_program()
    except ParserError as e:
        raise HTTPException(status_code=400, detail={
            "error_type": "ParserError",
            "message": e.message,
            "line": e.line,
            "col": e.col
        })

    # 3. Semantic Validation
    try:
        validator = ASTValidator(ast)
        validator.validate()
    except ValidationError as e:
        raise HTTPException(status_code=400, detail={
            "error_type": "ValidationError",
            "message": e.message,
            "line": e.line,
            "col": e.col
        })

    # 4. Intermediate Code (TAC) Generation
    tac_gen = TACGenerator()
    instructions = tac_gen.generate_program(ast)
    if not instructions:
        raise HTTPException(status_code=400, detail={
            "error_type": "CompilationError",
            "message": "No executable instructions generated from source code",
            "line": 1,
            "col": 1
        })

    # 5. Basic Block Partitioning (Leaders)
    bb_builder = BasicBlockBuilder(instructions)
    bb_builder.partition_blocks()

    # 6. CFG Construction
    cfg_builder = CFGBuilder(bb_builder)
    cfg = cfg_builder.build()
    return cfg

@app.get("/")
def home():
    return {
        "project": "CFG and Data-Flow Analysis Framework",
        "status": "running",
        "modules": [
            "Control Flow Graph",
            "Reaching Definitions",
            "Live Variable Analysis",
            "Available Expressions"
        ],
    }

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/api/samples", response_model=List[SampleProgram])
def get_samples():
    return C_SAMPLE_PROGRAMS

@app.post("/api/cfg/build")
def build_cfg_endpoint(req: CodeRequest):
    if not req.code.strip():
        raise HTTPException(status_code=400, detail={"message": "Source code cannot be empty"})
    cfg = compile_c_to_cfg(req.code)
    return cfg.to_dict()

@app.post("/api/analyze/reaching-definitions")
def analyze_rd_endpoint(req: CodeRequest):
    cfg = compile_c_to_cfg(req.code)
    rd = ReachingDefinitions(cfg)
    return rd.run()

@app.post("/api/analyze/live-variables")
def analyze_lv_endpoint(req: CodeRequest):
    cfg = compile_c_to_cfg(req.code)
    lv = LiveVariables(cfg)
    return lv.run()

@app.post("/api/analyze/available-expressions")
def analyze_ae_endpoint(req: CodeRequest):
    cfg = compile_c_to_cfg(req.code)
    ae = AvailableExpressions(cfg)
    return ae.run()

@app.post("/api/analyze/all")
def analyze_all_endpoint(req: CodeRequest):
    cfg = compile_c_to_cfg(req.code)
    rd = ReachingDefinitions(cfg).run()
    lv = LiveVariables(cfg).run()
    ae = AvailableExpressions(cfg).run()

    optimizations = []
    optimizations.extend(rd.get("diagnostics", []))
    optimizations.extend(lv.get("diagnostics", []))
    optimizations.extend(ae.get("diagnostics", []))

    return {
        "cfg": cfg.to_dict(),
        "reaching_definitions": rd,
        "live_variables": lv,
        "available_expressions": ae,
        "optimizations": optimizations
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
