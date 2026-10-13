import type { Preludes } from "./challenge";
import python from "./preludes/prelude.py?raw";
import cppPrelude from "./preludes/prelude.hpp?raw";
import cppEpilogue from "./preludes/epilogue.cpp?raw";
import bash from "./preludes/prelude.sh?raw";

export const PRELUDES: Preludes = { python, cppPrelude, cppEpilogue, bash };
