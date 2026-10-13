
// ── test harness (added by CaseLearn) ─────────────────────
#include <cstdio>
#include <exception>
#include <functional>
#include <iostream>
#include <sstream>
#include <string>
#include <string_view>
#include <type_traits>
#include <utility>
#include <vector>

namespace cl {
struct Failure {
  std::string message;
};

inline std::vector<std::pair<std::string, std::function<void()>>>& registry() {
  static std::vector<std::pair<std::string, std::function<void()>>> tests;
  return tests;
}

struct Register {
  Register(const char* name, std::function<void()> fn) { registry().emplace_back(name, std::move(fn)); }
};

inline std::string json_escape(const std::string& s) {
  std::string out;
  for (unsigned char c : s) {
    switch (c) {
      case '"': out += "\\\""; break;
      case '\\': out += "\\\\"; break;
      case '\n': out += "\\n"; break;
      case '\t': out += "\\t"; break;
      case '\r': out += "\\r"; break;
      default:
        if (c < 0x20) {
          char buf[8];
          std::snprintf(buf, sizeof buf, "\\u%04x", c);
          out += buf;
        } else {
          out += static_cast<char>(c);
        }
    }
  }
  return out;
}

template <typename T>
std::string show(const T& v) {
  if constexpr (std::is_convertible_v<const T&, std::string_view>) {
    return "\"" + std::string(std::string_view(v)) + "\"";
  } else if constexpr (requires(std::ostream& o) { o << v; }) {
    std::ostringstream o;
    o << std::boolalpha << v;
    return o.str();
  } else {
    return "<value>";
  }
}
}  // namespace cl

#define CL_CAT2(a, b) a##b
#define CL_CAT(a, b) CL_CAT2(a, b)

// TEST("name") { ...body... }
#define TEST(name)                                                                      \
  static void CL_CAT(cl_test_, __LINE__)();                                             \
  static cl::Register CL_CAT(cl_register_, __LINE__)(name, CL_CAT(cl_test_, __LINE__)); \
  static void CL_CAT(cl_test_, __LINE__)()

#define CHECK(cond)                                            \
  do {                                                         \
    if (!(cond)) throw cl::Failure{"CHECK(" #cond ") failed"}; \
  } while (0)

#define CHECK_EQ(actual, expected)                                                         \
  do {                                                                                     \
    const auto& cl_a = (actual);                                                           \
    const auto& cl_e = (expected);                                                         \
    if (!(cl_a == cl_e))                                                                   \
      throw cl::Failure{#actual ": got " + cl::show(cl_a) + ", expected " + cl::show(cl_e)}; \
  } while (0)

#define CHECK_THROWS(expr, ExceptionType)                                     \
  do {                                                                        \
    bool cl_threw = false;                                                    \
    try {                                                                     \
      (void)(expr);                                                           \
    } catch (const ExceptionType&) {                                          \
      cl_threw = true;                                                        \
    }                                                                         \
    if (!cl_threw) throw cl::Failure{#expr " should throw " #ExceptionType};  \
  } while (0)
