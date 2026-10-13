# ── test harness helpers (added by CaseLearn) ─────────────
__cl_esc() {
  local s=$1
  s=${s//\\/\\\\}
  s=${s//\"/\\\"}
  s=${s//$'\n'/\\n}
  s=${s//$'\t'/\\t}
  s=${s//$'\r'/\\r}
  printf '%s' "$s"
}
pass() { printf '@@CL{"name":"%s","pass":true}\n' "$(__cl_esc "$1")"; }
fail() { printf '@@CL{"name":"%s","pass":false,"detail":"%s"}\n' "$(__cl_esc "$1")" "$(__cl_esc "$2")"; }
# expect_eq NAME EXPECTED ACTUAL
expect_eq() {
  if [[ "$3" == "$2" ]]; then
    pass "$1"
  else
    fail "$1" "expected:"$'\n'"$2"$'\n'"got:"$'\n'"$3"
  fi
}
CL_WORK=$(mktemp -d "${TMPDIR:-/tmp}/cl.XXXXXX")
trap 'rm -rf "$CL_WORK"' EXIT
# Each test should run in its own scratch directory:  cd "$(fresh_dir)"
fresh_dir() { mktemp -d "$CL_WORK/t.XXXXXX"; }
# The user's script, as an absolute path: bash "$SOLUTION" args...  or  source "$SOLUTION"
SOLUTION="$PWD/solution.sh"
# run_solution ARGS...: runs the user's script (stdin is passed through) and sets
# $out (stdout, trailing newlines removed), $err (stderr) and $status (exit code).
run_solution() {
  out=$(bash "$SOLUTION" "$@" 2>"$CL_WORK/.stderr")
  status=$?
  err=$(<"$CL_WORK/.stderr")
}
# ── tests ─────────────────────────────────────────────────
