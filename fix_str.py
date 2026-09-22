
import re
with open('frontend/src/components/MonteCarloDCF.jsx', 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace('\$ — {sim.p90.toFixed(2)} / share\', '\${cur} —  / share\')
with open('frontend/src/components/MonteCarloDCF.jsx', 'w', encoding='utf-8') as f:
    f.write(c)

