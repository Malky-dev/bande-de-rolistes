import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src", "client");

function walk(dir, exts) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p, exts));
    else if (exts.includes(path.extname(ent.name))) out.push(p);
  }
  return out;
}

// Très simple : récupère className="..." et className={'...'} et className={`...`}
function extractUsedClasses(tsxText) {
  const classes = new Set();

  // className="a b c"
  for (const m of tsxText.matchAll(/className\s*=\s*"([^"]+)"/g)) {
    m[1].split(/\s+/).filter(Boolean).forEach(c => classes.add(c));
  }

  // className={'a b'}
  for (const m of tsxText.matchAll(/className\s*=\s*\{\s*'([^']+)'\s*\}/g)) {
    m[1].split(/\s+/).filter(Boolean).forEach(c => classes.add(c));
  }

  // className={"a b"}
  for (const m of tsxText.matchAll(/className\s*=\s*\{\s*"([^"]+)"\s*\}/g)) {
    m[1].split(/\s+/).filter(Boolean).forEach(c => classes.add(c));
  }

  // className={`a ${x} b`} -> on prend les tokens statiques
  for (const m of tsxText.matchAll(/className\s*=\s*\{\s*`([^`]+)`\s*\}/g)) {
    m[1].split(/\s+/).forEach(tok => {
      const clean = tok.replace(/\$\{[^}]+\}/g, "").trim();
      if (clean) classes.add(clean);
    });
  }

  return classes;
}

// Récupère les sélecteurs ".machin" dans tes CSS
function extractDefinedClasses(cssText) {
  const classes = new Set();
  // .className {  / .className:hover / .className::before / .a.b -> on prend a et b
  for (const m of cssText.matchAll(/\.([a-zA-Z0-9_-]+)/g)) {
    classes.add(m[1]);
  }
  return classes;
}

const tsxFiles = walk(SRC, [".tsx"]);
const cssFiles = walk(SRC, [".css"]); // si tu as src/client/styles, ça le prendra aussi

const used = new Set();
for (const f of tsxFiles) {
  const txt = fs.readFileSync(f, "utf8");
  for (const c of extractUsedClasses(txt)) used.add(c);
}

const defined = new Set();
for (const f of cssFiles) {
  const txt = fs.readFileSync(f, "utf8");
  for (const c of extractDefinedClasses(txt)) defined.add(c);
}

// ignore "ReactDatePicker" etc éventuels, ou classes dynamiques (tu peux ajouter)
const ignore = new Set(["active", "open", "hidden"]);
const missing = [...used].filter(c => !defined.has(c) && !ignore.has(c));

missing.sort((a,b)=>a.localeCompare(b));
console.log("Classes utilisées MAIS non définies (suspectes) :");
console.log(missing.length ? missing.join("\n") : "Aucune 🎉");