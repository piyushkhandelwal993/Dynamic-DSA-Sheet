export const PORTABLE_CPP_HEADERS = `#include <algorithm>
#include <array>
#include <cmath>
#include <deque>
#include <functional>
#include <iostream>
#include <limits>
#include <map>
#include <numeric>
#include <queue>
#include <set>
#include <sstream>
#include <stack>
#include <string>
#include <tuple>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>`;

export function normalizeCppSource(content: string): string {
  return content.replace(/#include\s*<bits\/stdc\+\+\.h>/g, PORTABLE_CPP_HEADERS);
}
