
// ── test runner (added by CaseLearn) ──────────────────────
int main() {
  for (auto& [name, fn] : cl::registry()) {
    std::string detail;
    bool pass = false;
    try {
      fn();
      pass = true;
    } catch (const cl::Failure& f) {
      detail = f.message;
    } catch (const std::exception& e) {
      detail = std::string("uncaught exception: ") + e.what();
    } catch (...) {
      detail = "uncaught non-standard exception";
    }
    std::cout << "@@CL{\"name\":\"" << cl::json_escape(name) << "\",\"pass\":" << (pass ? "true" : "false");
    if (!pass) std::cout << ",\"detail\":\"" << cl::json_escape(detail) << "\"";
    std::cout << "}" << std::endl;
  }
}
