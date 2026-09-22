
import re
with open("frontend/src/components/MonteCarloDCF.jsx", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("export default function MonteCarloDCF({", "export default function MonteCarloDCF({\n  market = \"US\",")
c = c.replace("const [isSimulating", "const cur = market === \"INDIA\" ? \"?\" : \"$\";\n  const [isSimulating")
c = re.sub(r"`\$(\$\{.*?\})`", r"`${cur}\1`", c)
c = c.replace(">${sim.p10", ">{cur}{sim.p10")
c = c.replace(">${sim.p50", ">{cur}{sim.p50")
c = c.replace(">${sim.p90", ">{cur}{sim.p90")
c = c.replace(">${currentPrice", ">{cur}{currentPrice")

with open("frontend/src/components/MonteCarloDCF.jsx", "w", encoding="utf-8") as f:
    f.write(c)

