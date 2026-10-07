/* VQ Run 1.0 — browser-only execution. See README for compatibility and resource limits. */
(function (global) {
  'use strict';
  const LIMITS = Object.freeze({ codeBytes: 131072, outputBytes: 262144, domNodes: 2000,
    operations: 10000, messages: 3000, imageBytes: 4194304, charts: 8, rows: 1000,
    series: 8, executionMs: 10000, initializationMs: 60000, runtimeBytes: 83886080 });
  const PY_BASE = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
  let cachedPython = null;
  const encoder = new TextEncoder();
  const bytes = s => encoder.encode(s).length;
  const errorText = e => String(e && e.message || e).slice(0, 2000);
  function capabilities() {
    return { version: '1.0', languages: ['html', 'css', 'javascript', 'python', 'json', 'csv'],
      execution: 'opaque-origin sandbox iframe with dedicated workers', limits: { ...LIMITS },
      web: { nativeDOM: false, dom: ['getElementById', 'querySelector (simple selectors)',
        'querySelectorAll (simple selectors)', 'createElement', 'textContent', 'innerHTML (sanitized)',
        'appendChild', 'remove', 'setAttribute (safe subset)', 'style', 'classList',
        'addEventListener (click/input/change/submit/keydown)'], externalResources: false,
        modules: false, timers: true, canvas: false },
      python: { runtime: 'Pyodide 0.27.7', lazy: true, packages: ['matplotlib', 'numpy and bundled dependencies'],
        networkDuringExecution: false, freshFilesystemPerRun: true },
      hardMemoryLimit: false, note: 'Browser heap cannot be strictly capped. Bounded input/output/DOM; worker termination is best effort under extreme memory pressure.',
      chartFormat: { labels: ['string'], datasets: [{ label: 'string', values: ['number'] }], type: 'bar | line' } };
  }
  // These two functions are serialized into an opaque frame and its worker. No user code
  // is evaluated by the parent window or the frame UI thread.
  function workerMain() {
    'use strict';
    const sendNative = self.postMessage.bind(self), nativeFetch = self.fetch.bind(self), nativeImport = self.importScripts.bind(self);
    const send = (kind, data) => sendNative({ kind, data });
    let entries = new Map(), idCounter = 100000, operations = 0, maxOperations = 10000;
    let scripts = [], pendingEvents = [], ready = false, budget = 262144, printed = 0;
    const text = value => {
      try { if (typeof value === 'string') return value.slice(0, 4000);
        if (value && typeof value.message === 'string') return (String(value.name || 'Error') + ': ' + value.message).slice(0, 4000);
        return JSON.stringify(value, (k, v) => typeof v === 'bigint' ? String(v) : v)?.slice(0, 4000) ?? String(value).slice(0, 4000);
      } catch (_) { return '[unprintable value]'; }
    };
    function output(level, values) { const line = values.map(text).join(' '); printed += new TextEncoder().encode(line).length;
      if (printed > budget) throw new Error('Console output exceeded 256 KiB.'); send('console', { level, text: line }); }
    self.console = Object.freeze(Object.fromEntries(['log','info','warn','error','debug'].map(level => [level, (...v) => output(level, v)])));
    function operation(op, args) { if (++operations > maxOperations) throw new Error('DOM operation limit exceeded.'); send('dom', { op, args }); }
    // Browser origin/CSP enforce isolation. Removing globals additionally prevents unnecessary APIs.
    for (const key of ['Worker','SharedWorker','WebSocket','EventSource','XMLHttpRequest','indexedDB','caches','BroadcastChannel','navigator']) {
      try { Object.defineProperty(self, key, { value: undefined, configurable: false }); } catch (_) {}
    }
    self.fetch = () => Promise.reject(new Error('Network access is disabled.'));
    self.importScripts = () => { throw new Error('External scripts are disabled.'); };
    const handlers = new Map();
    class Element {
      constructor(record) { this._record = record; this.style = new Proxy({}, { set: (obj, k, v) => {
        obj[k] = String(v); operation('style', [this._record.key, String(k), String(v)]); return true; } });
        this.classList = { add: (...names) => this.setAttribute('class', [...new Set((this.className + ' ' + names.join(' ')).trim().split(/\s+/))].join(' ')),
          remove: (...names) => this.setAttribute('class', this.className.split(/\s+/).filter(x => !names.includes(x)).join(' ')),
          toggle: name => { const exists = this.className.split(/\s+/).includes(name); exists ? this.classList.remove(name) : this.classList.add(name); return !exists; },
          contains: name => this.className.split(/\s+/).includes(name) }; }
      get tagName() { return this._record.tag.toUpperCase(); }
      get id() { return this._record.attrs.id || ''; } set id(v) { this.setAttribute('id', v); }
      get className() { return this._record.attrs.class || ''; } set className(v) { this.setAttribute('class', v); }
      get value() { return this._record.value ?? this._record.attrs.value ?? ''; } set value(v) { this._record.value = String(v); operation('value', [this._record.key, String(v)]); }
      get textContent() { return this._record.content; } set textContent(v) { this._record.content = String(v); this._record.children = []; operation('text', [this._record.key, String(v)]); }
      get innerHTML() { throw new Error('Reading innerHTML is unsupported; use textContent.'); }
      set innerHTML(v) { this._record.content = ''; this._record.children = []; operation('html', [this._record.key, String(v)]); }
      get children() { return this._record.children.map(k => entries.get(k)).filter(Boolean); }
      setAttribute(k, v) { k = String(k).toLowerCase(); this._record.attrs[k] = String(v); operation('attribute', [this._record.key, k, String(v)]); }
      getAttribute(k) { return this._record.attrs[String(k).toLowerCase()] ?? null; }
      appendChild(child) { if (!(child instanceof Element)) throw new Error('appendChild requires a preview element.');
        for (const e of entries.values()) e._record.children = e._record.children.filter(k => k !== child._record.key);
        this._record.children.push(child._record.key); operation('append', [this._record.key, child._record.key]); return child; }
      append(...children) { children.forEach(child => { if (child instanceof Element) this.appendChild(child); else { const e = doc.createElement('span'); e.textContent = child; this.appendChild(e); } }); }
      remove() { for (const e of entries.values()) e._record.children = e._record.children.filter(k => k !== this._record.key); operation('remove', [this._record.key]); }
      addEventListener(type, fn) { if (typeof fn !== 'function') throw new Error('Event handler must be a function.');
        if (!['click','input','change','submit','keydown'].includes(type)) throw new Error('Unsupported event: ' + type);
        const key = this._record.key + ':' + type; if (!handlers.has(key)) handlers.set(key, []); handlers.get(key).push(fn); operation('listen', [this._record.key, type]); }
      querySelector(selector) { return query(selector, this)[0] || null; }
      querySelectorAll(selector) { return query(selector, this); }
    }
    function query(selector, root) { if (typeof selector !== 'string' || !/^(?:#[\w-]+|\.[\w-]+|[a-z][\w-]*)$/i.test(selector)) throw new Error('Only simple #id, .class or tag selectors are supported.');
      let candidates = [...entries.values()]; if (root) { const keys = new Set(); function walk(e, depth) { if (depth > 100) return; for (const child of e.children) if (!keys.has(child._record.key)) { keys.add(child._record.key); walk(child, depth + 1); } } walk(root, 0); candidates = candidates.filter(e => keys.has(e._record.key)); }
      return candidates.filter(e => selector[0] === '#' ? e.id === selector.slice(1) : selector[0] === '.' ? e.classList.contains(selector.slice(1)) : e._record.tag === selector.toLowerCase()); }
    const doc = { getElementById: id => query('#' + id)[0] || null, querySelector: s => query(s)[0] || null, querySelectorAll: s => query(s),
      createElement: tag => { const record = { key: idCounter++, tag: String(tag).toLowerCase(), attrs: {}, content: '', children: [] };
        if (entries.size >= 2000) throw new Error('DOM node limit exceeded.'); const e = new Element(record); entries.set(record.key, e); operation('create', [record.key, record.tag]); return e; },
      addEventListener: (type, fn) => { if (type === 'DOMContentLoaded') pendingEvents.push(fn); else throw new Error('Only DOMContentLoaded is supported on document.'); } };
    // Install the DOM facade only for web scripts; Python must retain worker environment detection.
    function fail(e) { send('error', text(e)); }
    self.addEventListener('error', e => { e.preventDefault(); fail(e.error || e.message); });
    self.addEventListener('unhandledrejection', e => { e.preventDefault(); fail(e.reason); });
    async function python(data) {
      const map = new Map(), urls = [];
      for (const [name, buffer] of data.assets) { const url = URL.createObjectURL(new Blob([buffer], { type: name.endsWith('.js') ? 'text/javascript' : name.endsWith('.wasm') ? 'application/wasm' : 'application/octet-stream' })); map.set(name, url); urls.push(url); }
      function localURL(url) { url = String(url); if (urls.includes(url)) return url;
        if (url.startsWith(data.base)) { const name = url.slice(data.base.length); if (map.has(name)) return map.get(name); }
        throw new Error('Network access is disabled; this runtime resource is not bundled.'); }
      self.fetch = (url, options) => { try { return nativeFetch(localURL(url), options); } catch (e) { return Promise.reject(e); } };
      self.importScripts = (...paths) => nativeImport(...paths.map(localURL));
      nativeImport(map.get('pyodide.js'));
      const py = await self.loadPyodide({ indexURL: data.base, lockFileURL: map.get('pyodide-lock.json'),
        stdLibURL: map.get('python_stdlib.zip'), stdin: () => { throw new Error('Interactive input() is unsupported.'); },
        stdout: s => output('log', [s]), stderr: s => output('error', [s]) });
      await py.loadPackage(['matplotlib']);
      await py.runPythonAsync('import matplotlib\nmatplotlib.use("agg")\nimport matplotlib.pyplot as plt\nimport io, base64\nplt.show = lambda *args, **kwargs: None\n');
      send('started', null);
      await py.runPythonAsync(data.code);
      const charts = py.runPython(`\n_vq_images = []\nfor _vq_num in plt.get_fignums()[:8]:\n    _vq_buf = io.BytesIO()\n    plt.figure(_vq_num).savefig(_vq_buf, format='png', dpi=100)\n    if _vq_buf.tell() > 4194304: raise RuntimeError('Chart exceeds 4 MiB limit')\n    _vq_images.append(base64.b64encode(_vq_buf.getvalue()).decode('ascii'))\n_vq_images\n`);
      const images = charts.toJs(); charts.destroy(); for (const image of images) send('image', image);
      send('done', null);
    }
    self.onmessage = async event => { const data = event.data;
      try {
        if (data.kind === 'init') {
          if (ready) return; ready = true;
          if (data.language === 'python') { await python(data); return; }
          Object.defineProperty(self, 'document', { value: doc }); Object.defineProperty(self, 'window', { value: self });
          for (const record of data.nodes) entries.set(record.key, new Element(record)); doc.body = entries.get(data.body);
          scripts = data.scripts; send('started', null);
          for (const script of scripts) { const result = (0, eval)(script + '\n//# sourceURL=vq-preview.js'); if (result && typeof result.then === 'function') await result; }
          for (const fn of pendingEvents) fn(); send('done', null);
        } else if (data.kind === 'event' && ready) {
          const target = entries.get(data.key); if (!target) return; if ('value' in data) target._record.value = data.value;
          const ev = { type: data.type, target, currentTarget: target, key: data.keyName || '', preventDefault() {}, stopPropagation() {} };
          for (const fn of handlers.get(data.key + ':' + data.type) || []) fn.call(target, ev);
        }
      } catch (e) { fail(e); }
    };
  }
  function frameMain(workerSource, token, limits) {
    'use strict';
    const send = (kind, data) => parent.postMessage({ vqRun: token, kind, data }, '*');
    let worker, nodes = new Map(), nextId = 1, ops = 0, messages = 0, outputBytes = 0, port;
    const stage = document.getElementById('stage');
    const tags = new Set('a abbr article aside b blockquote br button caption code col colgroup dd details div dl dt em fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hr i img input label legend li main mark nav ol option p pre progress section select small span strong sub summary sup table tbody td textarea th thead time tr u ul style'.split(' '));
    const attrs = new Set('id class title role type value placeholder disabled checked selected min max step name rows cols colspan rowspan aria-label aria-live aria-hidden alt width height'.split(' '));
    const invalidCSS = /(?:url\s*\(|@import|@font-face|expression\s*\(|behavior\s*:|-moz-binding|\\|<)/i;
    function css(value) { if (typeof value !== 'string' || value.length > limits.codeBytes) throw new Error('CSS is too large.'); if (invalidCSS.test(value)) throw new Error('CSS URLs, imports and escaped resource references are disabled.'); return value; }
    function attribute(node, name, value) { name = String(name).toLowerCase(); value = String(value);
      if (value.length > 8192) throw new Error('Attribute is too long.');
      if (name === 'style') { node.setAttribute('style', css(value)); return; }
      if (name === 'src' && node.tagName === 'IMG') { if (!/^data:image\/(png|jpeg|gif|webp);base64,[a-z\d+/=]+$/i.test(value) || value.length > limits.imageBytes * 1.4) throw new Error('Images must be bounded inline PNG/JPEG/GIF/WebP data.'); node.setAttribute(name, value); return; }
      if (!attrs.has(name) && !/^data-[a-z\d-]+$/.test(name)) throw new Error('Attribute disabled: ' + name);
      if (name === 'type' && node.tagName === 'INPUT' && !/^(text|number|range|checkbox|radio|color|date|email|password|search|tel|url|button|submit)$/i.test(value)) throw new Error('Input type disabled.');
      node.setAttribute(name, value);
    }
    function addNode(node) { if (nodes.size >= limits.domNodes) throw new Error('Preview exceeds 2,000 nodes.'); const key = nextId++; nodes.set(key, node); return key; }
    function sanitize(source, collectScripts) {
      const parsed = new DOMParser().parseFromString(source, 'text/html'), fragment = document.createDocumentFragment(), scripts = [];
      function clone(original, parentNode, depth) {
        if (depth > 40) throw new Error('HTML nesting exceeds 40 levels.');
        if (original.nodeType === 3) { const node = document.createTextNode(original.textContent); addNode(node); parentNode.appendChild(node); return; }
        if (original.nodeType !== 1) return;
        const tag = original.tagName.toLowerCase();
        if (tag === 'script') { if (!collectScripts) return; if (original.hasAttribute('src') || original.type && !/^(text\/javascript|application\/javascript)$/.test(original.type)) throw new Error('Only inline classic scripts are supported.'); scripts.push(original.textContent); return; }
        if (!tags.has(tag)) throw new Error('Element disabled: <' + tag + '>. External resources, SVG, canvas and embedded documents are unsupported.');
        const node = document.createElement(tag); addNode(node);
        for (const a of original.attributes) attribute(node, a.name, a.value);
        if (tag === 'style') node.textContent = css(original.textContent);
        else for (const child of original.childNodes) clone(child, node, depth + 1);
        parentNode.appendChild(node);
      }
      for (const node of [...parsed.head.childNodes, ...parsed.body.childNodes]) { if (node.nodeType === 1 && ['title','meta'].includes(node.tagName.toLowerCase())) continue; clone(node, fragment, 0); }
      return { fragment, scripts };
    }
    function snapshot() { const keys = new Map([...nodes].map(([k, n]) => [n, k])); return [...nodes].filter(([, n]) => n.nodeType === 1).map(([key, n]) => ({ key, tag: n.tagName.toLowerCase(), attrs: Object.fromEntries([...n.attributes].map(a => [a.name, a.value])),
      content: n.textContent, value: n.value, children: [...n.children].map(c => keys.get(c)).filter(Boolean) })); }
    const listening = new Set();
    function apply(data) { if (++ops > limits.operations) throw new Error('DOM operation limit exceeded.');
      if (!data || !Array.isArray(data.args)) throw new Error('Invalid DOM operation.');
      const [key, a, b] = data.args, node = nodes.get(key);
      if (data.op === 'create') { if (!Number.isInteger(key) || key < 100000 || nodes.has(key) || !tags.has(a) || a === 'style') throw new Error('Invalid element creation.'); if (nodes.size >= limits.domNodes) throw new Error('DOM node limit exceeded.'); nodes.set(key, document.createElement(a)); return; }
      if (!node || node.nodeType !== 1) throw new Error('Unknown preview element.');
      switch (data.op) {
        case 'text': if (typeof a !== 'string' || a.length > limits.codeBytes) throw new Error('Text is too large.'); if (node.tagName === 'STYLE') css(a); node.textContent = a; break;
        case 'html': { if (typeof a !== 'string' || a.length > limits.codeBytes) throw new Error('HTML is too large.'); if (node.tagName === 'STYLE') throw new Error('Use textContent for styles.'); const { fragment } = sanitize(a, false); node.replaceChildren(fragment); break; }
        case 'value': if (typeof a !== 'string' || a.length > 8192) throw new Error('Value is too large.'); node.value = a; break;
        case 'attribute': attribute(node, a, b); break;
        case 'style': { if (!/^[a-zA-Z-]{1,80}$/.test(a) || typeof b !== 'string' || b.length > 8192) throw new Error('Invalid style.'); css(b); const prop = a.replace(/[A-Z]/g, x => '-' + x.toLowerCase()); node.style.setProperty(prop, b); break; }
        case 'append': { const child = nodes.get(a); if (!child || child === stage || child.contains(node)) throw new Error('Invalid child or cyclic DOM.'); node.appendChild(child); break; }
        case 'remove': if (node === stage) throw new Error('Cannot remove preview root.'); node.remove(); break;
        case 'listen': { if (!['click','input','change','submit','keydown'].includes(a)) throw new Error('Event disabled.'); const id = key + ':' + a; if (listening.has(id)) break; listening.add(id); node.addEventListener(a, event => {
          if (a === 'submit') event.preventDefault(); worker?.postMessage({ kind: 'event', key, type: a, value: String(node.value ?? '').slice(0,8192), keyName: String(event.key || '').slice(0,80) }); }); break; }
        default: throw new Error('DOM operation disabled.');
      }
    }
    function fail(error) { worker?.terminate(); worker = null; send('error', String(error.message || error).slice(0,2000)); }
    document.addEventListener('submit', e => e.preventDefault()); document.addEventListener('click', e => { if (e.target.closest('a')) e.preventDefault(); });
    window.addEventListener('securitypolicyviolation', e => send('console', { level:'warn', text:'Blocked resource by sandbox policy: ' + e.violatedDirective }));
    window.addEventListener('message', event => {
      if (event.source !== parent || event.data?.token !== token || port) return;
      port = event.ports[0]; if (!port) return;
      port.onmessage = event => {
        const data = event.data;
        if (data.kind === 'stop') { worker?.terminate(); worker = null; const freeze=document.createElement('style');freeze.textContent='*,*::before,*::after{animation-play-state:paused!important;transition:none!important}';document.head.append(freeze);send('stopped',null);return; }
        if (data.kind !== 'run' || worker) return;
        try {
          if (typeof data.code !== 'string' || data.code.length > limits.codeBytes) throw new Error('Invalid code.');
          let scripts = [];
          const body = addNode(stage);
          if (data.language === 'html') { const clean = sanitize(data.code, true); stage.replaceChildren(clean.fragment); scripts = clean.scripts; }
          if (data.language === 'css') { const style = document.createElement('style'); style.textContent = css(data.code); stage.append(style); stage.append(document.createTextNode('CSS preview — add HTML for your own content.')); }
          if (data.language === 'javascript') scripts = [data.code];
          const url = URL.createObjectURL(new Blob([workerSource], { type:'text/javascript' })); worker = new Worker(url); URL.revokeObjectURL(url);
          worker.onmessage = event => { const { kind, data } = event.data || {};
            try { if (++messages > limits.messages) throw new Error('Message limit exceeded.');
              if (kind === 'dom') apply(data);
              else if (kind === 'console') { if (!data || typeof data.text !== 'string') throw new Error('Invalid console message.'); outputBytes += new TextEncoder().encode(data.text).length; if (outputBytes > limits.outputBytes) throw new Error('Console output exceeded 256 KiB.'); send(kind, { level: ['log','info','warn','error','debug'].includes(data.level) ? data.level : 'log', text: data.text.slice(0,4000) }); }
              else if (kind === 'image') { if (typeof data !== 'string' || !/^[a-z\d+/=]+$/i.test(data) || data.length > limits.imageBytes * 1.4) throw new Error('Invalid or oversized chart image.'); send(kind, data); }
              else if (['started','done'].includes(kind)) send(kind, null);
              else if (kind === 'error') fail(new Error(String(data).slice(0,2000)));
            } catch (e) { fail(e); }
          };
          worker.onerror = e => { e.preventDefault(); fail(new Error(e.message)); };
          worker.postMessage({ kind:'init', language:data.language, code:data.code, scripts, nodes:snapshot(), body, assets:data.assets, base:data.base });
        } catch (e) { fail(e); }
      }; port.start(); send('ready', null);
    }); send('boot', null);
  }
  async function fetchBytes(url, signal, max, total) {
    const response = await fetch(url, { signal, credentials:'omit', referrerPolicy:'no-referrer' });
    if (!response.ok) throw new Error('Python runtime download failed: HTTP ' + response.status);
    const parts = []; let size = 0; const reader = response.body?.getReader();
    if (!reader) throw new Error('Streaming downloads are required for bounded runtime loading.');
    while (true) { const { value, done } = await reader.read(); if (done) break; size += value.length; total.bytes += value.length;
      if (size > max || total.bytes > LIMITS.runtimeBytes) { await reader.cancel(); throw new Error('Python runtime download exceeds its file or total size limit.'); } parts.push(value); }
    const data = new Uint8Array(size); let offset=0; for (const p of parts) { data.set(p,offset); offset+=p.length; } return data.buffer;
  }
  async function pythonAssets(signal, progress) {
    if (cachedPython) return cachedPython;
    const total = { bytes:0 }, assets = [], get = async name => { if (!/^[a-zA-Z\d_.+-]+$/.test(name)) throw new Error('Invalid runtime filename.');
      progress('Loading Python runtime: ' + name); const data = await fetchBytes(PY_BASE + name, signal, name==='pyodide-lock.json'?1048576:33554432, total); assets.push([name,data]); return data; };
    const lockData = await get('pyodide-lock.json'); const lock = JSON.parse(new TextDecoder().decode(lockData)); const selected = new Set();
    function collect(name) { if (selected.has(name)) return; const info = lock.packages?.[name]; if (!info) throw new Error('Python runtime package missing: ' + name); selected.add(name); if (selected.size > 60) throw new Error('Runtime has too many dependencies.'); for (const dep of info.depends || []) collect(dep); }
    collect('matplotlib');
    const jobs = ['pyodide.js','pyodide.asm.js','pyodide.asm.wasm','python_stdlib.zip'].map(name=>({name}));
    for (const name of selected) jobs.push({name:lock.packages[name].file_name,sha256:lock.packages[name].sha256});
    for (let i=0;i<jobs.length;i+=4) await Promise.all(jobs.slice(i,i+4).map(async job=>{
      const data=await get(job.name);
      if (job.sha256 && global.crypto?.subtle) { const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(x=>x.toString(16).padStart(2,'0')).join('');if(hash!==job.sha256)throw new Error('Runtime package integrity check failed: '+job.name); }
    }));
    cachedPython = assets; return assets;
  }
  function parseCSV(source) {
    const rows = []; let row=[], field='', quoted=false, closed=false;
    for (let i=0;i<source.length;i++) { const c=source[i]; if (quoted) { if(c==='"' && source[i+1]==='"'){ field+='"'; i++; } else if(c==='"'){quoted=false;closed=true;} else field+=c; }
      else if(c==='"') { if(field || closed) throw new Error('Invalid quote in CSV.'); quoted=true; }
      else if(c===',' || c==='\n' || c==='\r') { row.push(field);field='';closed=false;if(c!==','){ if(c==='\r'&&source[i+1]==='\n')i++;rows.push(row);row=[];if(rows.length>LIMITS.rows+1)throw new Error('CSV exceeds 1,000 data rows.'); } }
      else { if(closed && !/\s/.test(c)) throw new Error('Unexpected character after CSV quote.'); if(!closed)field+=c; }
    }
    if(quoted)throw new Error('CSV has an unclosed quoted field.'); if(field || row.length || closed){ row.push(field);rows.push(row); }
    if(rows.length<2 || rows[0].length<2)throw new Error('CSV needs a header, labels in its first column, and a numeric data column.');
    const head=rows.shift(); if(head.length>LIMITS.series+1)throw new Error('CSV supports at most 8 numeric columns.'); if(rows.some(r=>r.length!==head.length))throw new Error('CSV rows must have the same number of columns.');
    return normalizeChart({labels:rows.map(r=>r[0]),datasets:head.slice(1).map((label,i)=>({label,values:rows.map(r=>{const v=r[i+1].trim();if(!v)throw new Error('CSV numeric cells cannot be empty.');return Number(v);})}))});
  }
  function normalizeChart(data) {
    if (Array.isArray(data)) { if (data.length>LIMITS.rows)throw new Error('JSON exceeds 1,000 rows.'); if (!data.length || !data.every(r=>r && typeof r==='object' && !Array.isArray(r))) throw new Error('JSON rows must be objects.');
      const keys=Object.keys(data[0]); if(keys.length>LIMITS.series+1)throw new Error('JSON rows support at most 8 numeric fields.'); if(keys.length<2)throw new Error('JSON rows need a label field and numeric fields.'); const labelKey=keys[0]; data={labels:data.map(r=>String(r[labelKey])),datasets:keys.slice(1).map(k=>({label:k,values:data.map(r=>r[k])}))}; }
    if (!data || !Array.isArray(data.labels) || !data.labels.length || data.labels.length>LIMITS.rows)throw new Error('Chart needs 1–1,000 labels.');
    if (!Array.isArray(data.datasets) || !data.datasets.length || data.datasets.length>LIMITS.series)throw new Error('Chart needs 1–8 datasets.');
    if (data.type!==undefined && !['bar','line'].includes(data.type))throw new Error('Chart type must be bar or line.');
    const labels=data.labels.map(v=>{if(typeof v!=='string'||v.length>100)throw new Error('Labels must be strings of at most 100 characters.');return v;});
    const datasets=data.datasets.map(d=>{if(!d||typeof d.label!=='string'||d.label.length>100||!Array.isArray(d.values)||d.values.length!==labels.length||d.values.some(v=>typeof v!=='number'||!Number.isFinite(v)||Math.abs(v)>1e12))throw new Error('Each dataset needs a label and finite numeric values matching the labels (maximum magnitude 1e12).');return {label:d.label,values:d.values};});
    return {labels,datasets,type:data.type||'bar'};
  }
  function drawChart(root, data) {
    const ns='http://www.w3.org/2000/svg', svg=document.createElementNS(ns,'svg'); svg.setAttribute('viewBox','0 0 720 400');svg.setAttribute('role','img');svg.setAttribute('aria-label','Chart: '+data.datasets.map(d=>d.label).join(', '));svg.style.cssText='width:100%;max-height:420px;display:block';
    const colors=['var(--vq-chart-1, var(--vq-accent, var(--accent, #24bed6)))','var(--vq-chart-2, #bf75ef)','var(--vq-chart-3, #e6b454)','var(--vq-chart-4, #74be91)','var(--vq-chart-5, #e68c91)','var(--vq-chart-6, #7c9fec)','var(--vq-chart-7, #baab82)','var(--vq-chart-8, #aab9bf)'];
    const add=(tag,attrs,text)=>{const el=document.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))el.setAttribute(k,v);if(text!==undefined)el.textContent=text;svg.append(el);return el;};
    let min=0,max=0;for(const d of data.datasets)for(const v of d.values){min=Math.min(min,v);max=Math.max(max,v);}if(min===max)max=min+1;
    const x=i=>64+(i+.5)*630/data.labels.length,y=v=>320-(v-min)/(max-min)*270;
    for(let i=0;i<=5;i++){const val=min+(max-min)*i/5, yy=y(val);add('line',{x1:64,x2:694,y1:yy,y2:yy,stroke:'currentColor',opacity:'.13'});add('text',{x:55,y:yy+4,'text-anchor':'end','font-size':11,fill:'currentColor'},Number(val.toPrecision(3)).toString());}
    data.datasets.forEach((d,j)=>{if(data.type==='line')add('polyline',{points:d.values.map((v,i)=>x(i)+','+y(v)).join(' '),fill:'none',stroke:colors[j],'stroke-width':2.5});else d.values.forEach((v,i)=>{const width=Math.min(42,630/data.labels.length/data.datasets.length*.8),xx=x(i)+(j-(data.datasets.length-1)/2)*width;const rect=add('rect',{x:xx-width/2,y:Math.min(y(v),y(0)),width:Math.max(.1,width*.9),height:Math.max(.5,Math.abs(y(v)-y(0))),fill:colors[j],rx:2});const title=document.createElementNS(ns,'title');title.textContent=data.labels[i]+': '+d.label+' '+v;rect.append(title);});add('rect',{x:64+j*78,y:378,width:8,height:8,fill:colors[j]});add('text',{x:76+j*78,y:386,'font-size':10,fill:'currentColor'},d.label.slice(0,10));});
    const stride=Math.max(1,Math.ceil(data.labels.length/12));data.labels.forEach((label,i)=>{if(i%stride===0)add('text',{x:x(i),y:343,'text-anchor':'middle','font-size':10,fill:'currentColor'},label.slice(0,14));});root.replaceChildren(svg);
  }
  function create({root} = {}) {
    if (!root || typeof root.appendChild!=='function' || root.ownerDocument!==document)throw new TypeError('VQRun.create needs a root element in this document.');
    let disposed=false, session=null, generation=0;
    const shell=document.createElement('section');shell.className='vq-run';shell.style.cssText='display:flex;flex-direction:column;min-width:0;gap:8px;height:100%;color:inherit;font:inherit';
    const bar=document.createElement('div'),status=document.createElement('span'),stopButton=document.createElement('button');bar.style.cssText='display:flex;gap:12px;align-items:center';status.setAttribute('role','status');status.style.flex='1';status.textContent='Ready';stopButton.textContent='Stop';stopButton.type='button';stopButton.disabled=true;bar.append(status,stopButton);
    const preview=document.createElement('div');preview.style.cssText='min-height:260px;flex:1;overflow:auto';const consoleBox=document.createElement('pre');consoleBox.setAttribute('aria-label','Preview console');consoleBox.style.cssText='margin:0;max-height:180px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.6 monospace';shell.append(bar,preview,consoleBox);root.append(shell);
    function stop() { if(!session)return {ok:true}; const s=session;session=null;clearTimeout(s.timer);clearTimeout(s.initTimer);clearTimeout(s.bootTimer);s.abort.abort();if(s.frame && s.started){const frame=s.frame;let fallback;const ack=event=>{if(event.source===frame.contentWindow&&event.data?.kind==='stopped'&&event.data?.vqRun===s.token){clearTimeout(fallback);window.removeEventListener('message',ack);}};window.addEventListener('message',ack);fallback=setTimeout(()=>{window.removeEventListener('message',ack);frame.remove();},200);s.port?.postMessage({kind:'stop'});}else s.frame?.remove();s.port?.close();window.removeEventListener('message',s.listener);stopButton.disabled=true;status.textContent='Stopped';s.finish({ok:false,output:s.output,error:'Stopped.'});return {ok:true}; }
    stopButton.addEventListener('click',stop);
    const hidden=()=>{if(document.hidden)stop();};const leaving=()=>stop();document.addEventListener?.('visibilitychange',hidden);window.addEventListener('pagehide',leaving);
    async function run(spec) {
      if(disposed)return {ok:false,output:[],error:'Runner has been disposed.'};
      stop(); const id=++generation;
      try {if(document.hidden)throw new Error('Open this tab before running code.');if(!spec || typeof spec!=='object' || Array.isArray(spec))throw new Error('Run needs { language, code }.');
        if(typeof spec.language!=='string'||typeof spec.code!=='string')throw new Error('language and code must be strings.');
        let language=spec.language.toLowerCase();language=({js:'javascript',py:'python',htm:'html'})[language]||language;
        if(!capabilities().languages.includes(language))throw new Error('Unsupported language: '+language);
        if(bytes(spec.code)>LIMITS.codeBytes)throw new Error('Code exceeds 128 KiB limit.');
        preview.replaceChildren();consoleBox.textContent='';
        if(language==='json'||language==='csv'){const chart=language==='json'?normalizeChart(JSON.parse(spec.code)):parseCSV(spec.code);drawChart(preview,chart);status.textContent='Chart ready';return {ok:true,output:[{type:'chart',data:chart}]};}
        let resolveResult;const result=new Promise(resolve=>{resolveResult=resolve;});const s={id,abort:new AbortController(),output:[],settled:false,timer:null,initTimer:null,frame:null,port:null,listener:null,started:false,images:0,outputBytes:0};
        s.finish=value=>{if(s.settled)return;s.settled=true;resolveResult(value);};session=s;stopButton.disabled=false;status.textContent=language==='python'?'Loading Python…':'Starting…';
        const fail=message=>{if(session!==s)return;stop();status.textContent='Error: '+message;s.finish({ok:false,output:s.output,error:message});};
        // stop() settles with Stopped; failures settle first to preserve their explanation.
        const failure=message=>{s.finish({ok:false,output:s.output,error:message});fail(message);};
        s.initTimer=setTimeout(()=>failure('Initialization exceeded 60 seconds. Try again with a faster connection.'),LIMITS.initializationMs);
        let assets;
        if(language==='python') {try{assets=await pythonAssets(s.abort.signal,msg=>{if(session===s)status.textContent=msg;});}catch(e){if(session===s)failure(errorText(e));return result;}}
        if(session!==s||id!==generation)return result;
        const token=Array.from(crypto.getRandomValues(new Uint32Array(4))).map(x=>x.toString(16)).join('');const nonce=token;s.token=token;
        const hostColor=global.getComputedStyle?.(root)?.color||'#203942';const safeColor=/^[a-z0-9#,.% ()/+-]+$/i.test(hostColor)?hostColor:'#203942';
        const workerSource='('+workerMain.toString()+')();';const bootstrap='('+frameMain.toString()+')('+JSON.stringify(workerSource)+','+JSON.stringify(token)+','+JSON.stringify(LIMITS)+');';
        const frame=document.createElement('iframe');s.frame=frame;frame.title='VQ code preview';frame.setAttribute('sandbox','allow-scripts');frame.setAttribute('referrerpolicy','no-referrer');frame.setAttribute('allow',"camera 'none'; microphone 'none'; geolocation 'none'; clipboard-read 'none'; clipboard-write 'none'; usb 'none'; serial 'none'; payment 'none'");frame.style.cssText='display:block;width:100%;height:100%;min-height:300px;border:0;background:transparent';
        const csp="default-src 'none'; script-src 'nonce-"+nonce+"' blob: 'unsafe-eval' 'wasm-unsafe-eval'; worker-src blob:; connect-src blob:; style-src 'unsafe-inline'; img-src data: blob:; font-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";
        frame.srcdoc='<!doctype html><meta http-equiv="Content-Security-Policy" content="'+csp+'"><meta name="referrer" content="no-referrer"><style>html,body{margin:0;background:transparent;color:'+safeColor+';font-family:system-ui,sans-serif}#stage{min-height:100vh;overflow-wrap:anywhere}*{box-sizing:border-box}</style><div id="stage"></div><script nonce="'+nonce+'">'+bootstrap.replace(/<\/script/gi,'<\\/script')+'</script>';
        const channel=new MessageChannel();s.port=channel.port1;
        s.listener=event=>{if(session!==s||event.source!==frame.contentWindow||event.data?.vqRun!==token)return;const {kind,data}=event.data;
          if(kind==='boot'){frame.contentWindow.postMessage({token},'*',[channel.port2]);}
          else if(kind==='ready'){clearTimeout(s.bootTimer);s.port.postMessage({kind:'run',language,code:spec.code,assets,base:PY_BASE});}
          else if(kind==='started'){if(s.started)return;s.started=true;clearTimeout(s.initTimer);status.textContent='Running (10-second limit)…';s.timer=setTimeout(()=>{s.finish({ok:false,output:s.output,error:'Execution stopped after 10 seconds.'});stop();status.textContent='Execution stopped after 10 seconds.';},LIMITS.executionMs);}
          else if(kind==='console'){if(!data||typeof data.text!=='string')return;s.outputBytes+=bytes(data.text);if(s.outputBytes>LIMITS.outputBytes)return failure('Console output exceeded 256 KiB.');s.output.push({type:'console',level:data.level,text:data.text});consoleBox.append(document.createTextNode('['+data.level+'] '+data.text+'\n'));consoleBox.scrollTop=consoleBox.scrollHeight;}
          else if(kind==='image'){if(++s.images>LIMITS.charts||typeof data!=='string'||data.length>LIMITS.imageBytes*1.4)return failure('Chart image limit exceeded.');const image=document.createElement('img');image.alt='Python chart '+s.images;image.src='data:image/png;base64,'+data;image.style.cssText='display:block;max-width:100%;height:auto';preview.append(image);s.output.push({type:'image',mime:'image/png',data});}
          else if(kind==='done'){status.textContent=language==='python'?'Python complete':'Preview ready (active until timeout or Stop)';s.finish({ok:true,output:s.output});if(language==='python'){clearTimeout(s.timer);s.port.postMessage({kind:'stop'});stopButton.disabled=true;}}
          else if(kind==='error')failure(String(data));
        };window.addEventListener('message',s.listener);s.bootTimer=setTimeout(()=>failure('Preview could not start. This browser or the page Content Security Policy may be blocking the sandbox bootstrap or workers.'),3000);if(language==='python')frame.style.display='none';preview.append(frame);return result;
      }catch(e){status.textContent='Error: '+errorText(e);return {ok:false,output:[],error:errorText(e)};}
    }
    return Object.freeze({run,stop,dispose(){if(disposed)return;stop();disposed=true;document.removeEventListener?.('visibilitychange',hidden);window.removeEventListener('pagehide',leaving);shell.remove();},capabilities});
  }
  global.VQRun=Object.freeze({create,capabilities});
  if(typeof module!=='undefined'&&module.exports)module.exports=global.VQRun;
})(typeof window!=='undefined'?window:globalThis);
