#!/usr/bin/env node
'use strict';
// Builds the Qollab "JS / Qiskit project" in qollab/ from index.html + bell/ + qollab-src/.
// Qollab loads index.html's body, main.css as the only stylesheet, and main.js as an ES module;
// <script> tags in index.html do not run, so the game script becomes game.js.
const fs = require('node:fs'), path = require('node:path');
const root = __dirname, out = path.join(root, 'qollab'), read = f => fs.readFileSync(path.join(root, f), 'utf8');
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(path.join(out, 'bell'), { recursive: true });
const write = (f, text) => fs.writeFileSync(path.join(out, f), text);
const html = read('index.html');
const between = (a, b, from = 0) => { const i = html.indexOf(a, from) + a.length; return html.slice(i, html.indexOf(b, i)); };
const fonts = html.match(/<link rel="stylesheet" href="(https:\/\/fonts\.googleapis\.com[^"]+)">/);
write('main.css', (fonts ? `@import url("${fonts[1]}");\n` : '') + between('<style>', '</style>'));
const body = between('<body>', '<script>');
write('index.html', body.trim() + '\n');
write('game.js', between('<script>', '</script>', html.indexOf('<body>')));
for (const f of ['main.js', 'host.js']) write(f, read(path.join('qollab-src', f)));
write('README.md', read(path.join('qollab-src', 'README.md')));
write('LICENSE', read('LICENSE'));
for (const f of ['__init__.py', 'chsh.py', 'bridge.py']) write(path.join('bell', f), read(path.join('bell', f)));
const files = []; (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? walk(p) : files.push(p); } })(out);
const big = files.filter(f => fs.statSync(f).size > 2 * 1024 * 1024);
if (files.length > 100 || big.length) throw Error('Qollab limits exceeded');
console.log('Built qollab/ (' + files.length + ' files).');
