
# ── test harness (added by CaseLearn) ─────────────────────
import json as __cl_json

def test(name):
    """Decorator: runs the function immediately and reports it as one test."""
    def register(fn):
        try:
            fn()
            result = {"name": name, "pass": True}
        except AssertionError as e:
            result = {"name": name, "pass": False, "detail": str(e) or "assertion failed"}
        except Exception as e:
            result = {"name": name, "pass": False, "detail": f"{type(e).__name__}: {e}"}
        print("@@CL" + __cl_json.dumps(result), flush=True)
        return fn
    return register

def raises(exc_type, fn, *args, **kwargs):
    """Calls fn(*args, **kwargs); returns the exception if it raised exc_type, else fails the test."""
    try:
        fn(*args, **kwargs)
    except exc_type as e:
        return e
    except Exception as e:
        raise AssertionError(f"expected {exc_type.__name__}, got {type(e).__name__}: {e}") from None
    raise AssertionError(f"expected {exc_type.__name__}, but nothing was raised")
