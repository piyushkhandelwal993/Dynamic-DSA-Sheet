# Problem I/O Contract

Java and C++ submissions use the same whitespace-delimited standard input and output contract.

## Input

- Scalars are read in the order listed by the problem.
- An array starts with its length `n`, followed by exactly `n` whitespace-separated values.
- Additional scalars appear after the array unless the problem explicitly states otherwise.
- Multiple arrays each have their own length before their values.
- Whitespace is interchangeable: users may place values on one line or several lines.

Example:

```text
3
1 2 3
5
```

This represents an array of length three followed by the scalar value five.

## Output

- Print scalar answers without labels or surrounding punctuation.
- Print booleans as lowercase `true` or `false`.
- Print sequences as whitespace-separated values without brackets or commas.
- When a mathematically unordered answer contains multiple values, the problem defines a canonical order such as ascending order.
- Avoid trailing explanatory text because output comparison is exact apart from surrounding whitespace.

Example:

```text
1 0 2 1
```

## Test Cases

Configured catalog cases and curated boundary cases are authoritative. Display examples are only a fallback for legacy problems that do not yet have a canonical execution contract.
