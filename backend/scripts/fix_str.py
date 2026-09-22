import re
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
TARGET_FILE = ROOT_DIR / "frontend" / "src" / "components" / "MonteCarloDCF.jsx"

if TARGET_FILE.exists():
    with open(TARGET_FILE, "r", encoding="utf-8") as f:
        c = f.read()

    c = c.replace(
        "`$${sim.p10.toFixed(2)} \u2014 $${sim.p90.toFixed(2)} / share`",
        "`${cur}${sim.p10.toFixed(2)} \u2014 ${cur}${sim.p90.toFixed(2)} / share`",
    )

    with open(TARGET_FILE, "w", encoding="utf-8") as f:
        f.write(c)

