export const DEFAULT_SAMPLES = [
  {
    id: "while_loop",
    title: "While Loop (Sum 1 to 10)",
    description: "Standard while loop accumulating sum from 1 to 10. Demonstrates natural loops, back edges, and loop-carried definitions.",
    code: `int main() {
    int i = 1;
    int sum = 0;
    while (i <= 10) {
        sum = sum + i;
        i = i + 1;
    }
    return sum;
}`
  },
  {
    id: "if_else_diamond",
    title: "If-Else Diamond Branching",
    description: "Classic control-flow split and reconvergence. Demonstrates merge points, union/intersection dataflow confluence.",
    code: `int main() {
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
}`
  },
  {
    id: "for_loop_nested",
    title: "Nested For Loops with Break",
    description: "Two levels of loop nesting with conditional early break. Tests multi-level CFG hierarchy and back edges.",
    code: `int main() {
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
}`
  },
  {
    id: "euclid_gcd",
    title: "Euclidean GCD Algorithm",
    description: "Calculates greatest common divisor using modulo inside a while loop with variable updates.",
    code: `int main() {
    int a = 48;
    int b = 18;
    while (b != 0) {
        int t = b;
        b = a % b;
        a = t;
    }
    return a;
}`
  },
  {
    id: "optimizations_demo",
    title: "CSE & Dead Code Optimization Demo",
    description: "Contains duplicate expressions (a * b) and dead assignments to test compiler diagnostics.",
    code: `int main() {
    int a = 5;
    int b = 10;
    int dead_val = 999;
    int x = a * b;
    int unused = a + b;
    int y = a * b;
    int result = x + y;
    return result;
}`
  }
];
