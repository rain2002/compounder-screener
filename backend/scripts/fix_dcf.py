
import re

with open("frontend/src/pages/DCF.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add `const cur = market === "INDIA" ? "?" : "$";` after `const exceedsCap = terminalGrowth > cap;`
content = content.replace("const exceedsCap = terminalGrowth > cap;", "const exceedsCap = terminalGrowth > cap;\n  const cur = market === \"INDIA\" ? \"?\" : \"$\";")

# Replace suffix="$M" with suffix={`${cur}M`}
content = content.replace("suffix=\"$M\"", "suffix={`${cur}M`}")

# Replace >$</span> with >{cur}</span>
content = content.replace(">$</span>", ">{cur}</span>")

# Replace `$${var}` with `${cur}${var}`
content = re.sub(r"`\$(\$\{.*?\})`", r"`${cur}\1`", content)

# Replace remaining `$${var.toFixed}` strings
content = content.replace("`$$", "`${cur}$")
content = content.replace("($${", "(${cur}${")
content = content.replace(": $${", ": ${cur}${")

# Add shares calculation
# In useEffect for /quote/
quote_effect = """  useEffect(() => {
    if (!ticker) return;
    let cancelled = false;
    fetch(`${BASE_URL}/quote/${ticker}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && data.current_price) {
          setCurrentPrice(data.current_price);
          if (data.market_cap) {
            const computedShares = Math.round(data.market_cap / data.current_price / 1e6);
            if (computedShares > 0) setShares(computedShares);
          }
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [ticker]);"""

content = re.sub(r"  useEffect\(\(\) => \{\n    if \(!ticker\) return;\n    let cancelled = false;\n    fetch\(`\$\{BASE_URL\}/quote/\$\{ticker\}`\).*?\}, \[ticker\]\);", quote_effect, content, flags=re.DOTALL)


with open("frontend/src/pages/DCF.jsx", "w", encoding="utf-8") as f:
    f.write(content)

