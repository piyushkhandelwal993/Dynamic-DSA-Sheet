import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { invalidateCatalogCache } from "../services/catalog";
import { analyzeProgrammingMathJavaContent, detectProgrammingMathConcepts } from "../services/topics/programmingMathHooks";
import { getProblemById } from "../services/storage";

const originalBaseDir = process.env.DSA_SHEET_HOME;
process.env.DSA_SHEET_HOME = fs.mkdtempSync(path.join(os.tmpdir(), "dsa-programming-math-tests-"));
invalidateCatalogCache();

test.after(() => {
  if (originalBaseDir === undefined) delete process.env.DSA_SHEET_HOME;
  else process.env.DSA_SHEET_HOME = originalBaseDir;
  invalidateCatalogCache();
});

test("programming mathematics analyzer detects digit extraction and place-value rebuild", () => {
  const analysis = analyzeProgrammingMathJavaContent(`
    class Solution {
      public int reverseNumber(int n) {
        int reversed = 0;
        while (n > 0) {
          int digit = n % 10;
          reversed = reversed * 10 + digit;
          n /= 10;
        }
        return reversed;
      }
    }
  `);

  assert.equal(analysis.detected.includes("Used digit extraction"), true);
  assert.equal(analysis.detected.includes("Used place value rebuild"), true);
});

test("programming mathematics concept detector recognizes gcd euclid", () => {
  const problem = getProblemById("pm-004");
  assert.ok(problem);

  const analysis = analyzeProgrammingMathJavaContent(`
    class Solution {
      public int gcd(int a, int b) {
        while (b != 0) {
          int r = a % b;
          a = b;
          b = r;
        }
        return a;
      }
    }
  `);

  const detection = detectProgrammingMathConcepts(problem, analysis);
  assert.equal(detection.matchedConcepts.includes("divisibility-check"), true);
  assert.equal(detection.matchedConcepts.includes("gcd-euclid"), true);
});

test("programming mathematics analyzer detects primality and sieve patterns", () => {
  const analysis = analyzeProgrammingMathJavaContent(`
    import java.util.*;
    class Solution {
      public int countPrimesUpTo(int n) {
        if (n < 2) return 0;
        boolean[] isPrime = new boolean[n + 1];
        Arrays.fill(isPrime, true);
        isPrime[0] = false;
        isPrime[1] = false;
        for (int p = 2; p * p <= n; p++) {
          if (!isPrime[p]) continue;
          for (int multiple = p * p; multiple <= n; multiple += p) {
            isPrime[multiple] = false;
          }
        }
        int count = 0;
        for (int value = 2; value <= n; value++) if (isPrime[value]) count++;
        return count;
      }
    }
  `);

  assert.equal(analysis.detected.includes("Used sieve precomputation"), true);
});

test("programming mathematics analyzer detects modular arithmetic and fast exponentiation", () => {
  const analysis = analyzeProgrammingMathJavaContent(`
    class Solution {
      public long fastPowerModulo(long a, long b, long mod) {
        long answer = 1 % mod;
        long base = a % mod;
        while (b > 0) {
          if ((b & 1) == 1) {
            answer = (answer * base) % mod;
          }
          base = (base * base) % mod;
          b >>= 1;
        }
        return answer;
      }
    }
  `);

  assert.equal(analysis.detected.includes("Used modular arithmetic"), true);
  assert.equal(analysis.detected.includes("Used fast exponentiation"), true);
});

test("programming mathematics concept detector recognizes modular inverse", () => {
  const problem = getProblemById("pm-012");
  assert.ok(problem);

  const analysis = analyzeProgrammingMathJavaContent(`
    class Solution {
      public long modularInverse(long a, long mod) {
        long answer = 1 % mod;
        long base = a % mod;
        long power = mod - 2;
        while (power > 0) {
          if ((power & 1) == 1) {
            answer = (answer * base) % mod;
          }
          base = (base * base) % mod;
          power >>= 1;
        }
        return answer;
      }
    }
  `);

  const detection = detectProgrammingMathConcepts(problem, analysis);
  assert.equal(detection.matchedConcepts.includes("fast-exponentiation"), true);
  assert.equal(detection.matchedConcepts.includes("modular-inverse"), true);
});

test("programming mathematics concept detector recognizes nCr combinatorics", () => {
  const problem = getProblemById("pm-013");
  assert.ok(problem);

  const analysis = analyzeProgrammingMathJavaContent(`
    class Solution {
      public long nCrModuloPrime(int n, int r, long mod) {
        if (r < 0 || r > n) return 0;
        long[] fact = new long[n + 1];
        long[] inverseFact = new long[n + 1];
        fact[0] = 1 % mod;
        for (int i = 1; i <= n; i++) {
          fact[i] = (fact[i - 1] * i) % mod;
        }
        inverseFact[n] = power(fact[n], mod - 2, mod);
        for (int i = n; i >= 1; i--) {
          inverseFact[i - 1] = (inverseFact[i] * i) % mod;
        }
        return ((fact[n] * inverseFact[r]) % mod * inverseFact[n - r]) % mod;
      }

      private long power(long a, long b, long mod) {
        long answer = 1 % mod;
        long base = a % mod;
        while (b > 0) {
          if ((b & 1) == 1) {
            answer = (answer * base) % mod;
          }
          base = (base * base) % mod;
          b >>= 1;
        }
        return answer;
      }
    }
  `);

  const detection = detectProgrammingMathConcepts(problem, analysis);
  assert.equal(detection.matchedConcepts.includes("factorial-mod-precompute"), true);
  assert.equal(detection.matchedConcepts.includes("modular-inverse"), true);
  assert.equal(detection.matchedConcepts.includes("ncr-combinatorics"), true);
});
