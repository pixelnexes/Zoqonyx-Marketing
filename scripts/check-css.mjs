async function checkCss() {
  const res = await fetch("http://localhost:3000/");
  const html = await res.text();
  console.log("HTML length:", html.length);
  const headMatch = html.match(/<head>([\s\S]*?)<\/head>/i);
  if (headMatch) {
    console.log("Head contents:\n", headMatch[1]);
  }
  const cssMatches = html.match(/href="([^"]+\.css[^"]*)"/g);
  console.log("CSS file links:", cssMatches);
  if (cssMatches) {
    for (const link of cssMatches) {
      const url = "http://localhost:3000" + link.replace('href="', "").replace('"', "");
      console.log("Fetching CSS url:", url);
      const cssRes = await fetch(url);
      const cssText = await cssRes.text();
      console.log("CSS status:", cssRes.status, "Length:", cssText.length, "Preview:", cssText.slice(0, 100));
    }
  }
}
checkCss();
