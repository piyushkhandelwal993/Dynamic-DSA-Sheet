import test from "node:test";
import assert from "node:assert/strict";
import { analyzeJavaContent } from "../services/analyzer";

test("analyzer detects intended check-bit operators without hardcoding false positive", () => {
  const analysis = analyzeJavaContent(`
    public class CheckIthBit {
      public static int checkBit(int n, int i) {
        if (i < 0) return 0;
        int mask = 1 << i;
        return (n & mask) != 0 ? 1 : 0;
      }
    }
  `);

  assert.equal(analysis.signals.usesAnd, true);
  assert.equal(analysis.signals.usesLeftShift, true);
  assert.equal(analysis.signals.hasHardcoding, false);
});

test("analyzer flags string conversion and loops for workaround solutions", () => {
  const analysis = analyzeJavaContent(`
    public class Demo {
      public static String solve(int n) {
        StringBuilder sb = new StringBuilder(Integer.toBinaryString(n));
        for (int i = 0; i < sb.length(); i++) {}
        return sb.toString();
      }
    }
  `);

  assert.equal(analysis.signals.usesStringConversion, true);
  assert.equal(analysis.signals.hasUnnecessaryLoop, true);
});
