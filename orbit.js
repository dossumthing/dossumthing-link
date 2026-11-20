/* 두썸띵 My recording Orbit — 엇갈린 두 궤도와 별 위성
   두 궤도는 살짝 기울어진 고리. 아래쪽(가까운 쪽)은 진하게, 위쪽(먼 쪽)은 옅게.
   다홍 별 두 개가 각자의 궤도를 반시계로 돈다. 속도는 저마다 천천히 변해서,
   가끔은 같은 속도로 나란히 돌기도 한다. */
(function () {
  var svg = document.getElementById('orbit');
  if (!svg) return;

  var NS = 'http://www.w3.org/2000/svg';
  var DEG = Math.PI / 180, TAU = Math.PI * 2;
  var CX = 230, CY = 300;

  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  // 궤도: 반지름(rx, ry), 기울기(rot)
  var orbits = [
    { rx: 150, ry: 282, rot: -33 },     // 세로로 긴 궤도
    { rx: 278, ry: 150, rot: -51 }     // 비스듬히 누운 궤도
  ];
  orbits.forEach(function (o) {
    o.c = Math.cos(o.rot * DEG); o.s = Math.sin(o.rot * DEG);
  });
  function at(o, t) {                  // t: 라디안. sin t > 0 쪽이 화면 아래 = 가까운 쪽
    var x = o.rx * Math.cos(t), y = o.ry * Math.sin(t);
    return { x: CX + x * o.c - y * o.s, y: CY + x * o.s + y * o.c, depth: Math.sin(t) };
  }
  function f1(n) { return n.toFixed(1); }

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  var defs = el('defs', {}, svg);
  var gLines = el('g', {}, svg);
  var gLabels = el('g', {}, svg);
  var gDeco = el('g', { 'class': 'deco' }, svg);
  var gStars = el('g', {}, svg);

  // 두 궤도가 엇갈리는 자리: 먼 쪽 궤도 선을 살짝 끊어 앞뒤를 보여 준다
  function crossings() {
    var a = orbits[0], b = orbits[1], out = [];
    function inside(o, p) {             // 궤도 o 안쪽이면 < 1
      var dx = p.x - CX, dy = p.y - CY;
      var x = dx * o.c + dy * o.s, y = -dx * o.s + dy * o.c;
      return (x * x) / (o.rx * o.rx) + (y * y) / (o.ry * o.ry) - 1;
    }
    var N = 1440, prev = inside(b, at(a, 0));
    for (var i = 1; i <= N; i++) {
      var t = i / N * TAU, v = inside(b, at(a, t));
      if ((prev < 0) !== (v < 0)) {
        var p = at(a, t);
        // b 위에서 같은 점의 각도 찾기
        var best = 0, bd = 1e9;
        for (var j = 0; j < N; j++) {
          var q = at(b, j / N * TAU), d = Math.hypot(q.x - p.x, q.y - p.y);
          if (d < bd) { bd = d; best = j / N * TAU; }
        }
        out.push({ p: p, da: p.depth, db: at(b, best).depth });
      }
      prev = v;
    }
    return out;
  }
  var X = crossings();

  // 궤도마다 마스크: 엇갈림 틈 + 별이 지나가는 자리 틈
  orbits.forEach(function (o, i) {
    var m = el('mask', { id: 'm' + i, maskUnits: 'userSpaceOnUse', x: -200, y: -200, width: 860, height: 1000 }, defs);
    el('rect', { x: -200, y: -200, width: 860, height: 1000, fill: '#fff' }, m);
    X.forEach(function (c) {
      var mine = i === 0 ? c.da : c.db, other = i === 0 ? c.db : c.da;
      if (mine < other) el('circle', { cx: f1(c.p.x), cy: f1(c.p.y), r: 6, fill: '#000' }, m);
    });
    o.holes = [el('circle', { r: 0, fill: '#000' }, m), el('circle', { r: 0, fill: '#000' }, m)];
    o.mask = m;
  });

  // 궤도 선: 띠로 나눠 가까운 쪽은 진하게, 먼 쪽은 옅게
  orbits.forEach(function (o, i) {
    var g = el('g', { mask: 'url(#m' + i + ')', 'class': 'orbit-line' }, gLines);
    var BANDS = 36, STEP = 6;
    for (var k = 0; k < BANDS; k++) {
      var t0 = k / BANDS * TAU, d = '';
      for (var s = 0; s <= STEP; s++) {
        var p = at(o, t0 + TAU / BANDS * s / STEP);
        d += (s ? 'L' : 'M') + f1(p.x) + ' ' + f1(p.y);
      }
      var mid = Math.sin(t0 + TAU / BANDS / 2);
      el('path', { d: d, opacity: (0.4 + 0.6 * (mid + 1) / 2).toFixed(2) }, g);
    }
  });

  // 원래 맵의 네 방향을 궤도 끝에 작게
  function label(text, x, y, anchor) {
    var n = el('text', { 'class': 'lab-en', x: f1(x), y: f1(y), 'text-anchor': anchor || 'middle' }, gLabels);
    n.textContent = text;
  }
  (function () {
    var a = orbits[0], b = orbits[1];
    var top = at(a, -Math.PI / 2), bot = at(a, Math.PI / 2);
    var vx = -a.s, vy = a.c;                           // 세로 궤도의 긴 축 방향(아래쪽)
    label('output', top.x - vx * 12, top.y - vy * 12, 'end');
    label('input', bot.x + vx * 12, bot.y + vy * 12 + 9, 'start');
    var g = at(b, 0), c = at(b, Math.PI);
    var ux = b.c, uy = b.s;                            // 누운 궤도의 긴 축 방향
    label('grow', g.x + ux * 10, g.y + uy * 10, 'start');
    label('care', c.x - ux * 10, c.y - uy * 10 + 9, 'end');
  })();

  // 별: 8갈래
  function starPath(R, r, n) {                         // n갈래 별
    var d = '';
    for (var i = 0; i < n * 2; i++) {
      var a = i * Math.PI / n - Math.PI / 2, L = i % 2 ? r : R;
      d += (i ? 'L' : 'M') + f1(Math.cos(a) * L) + ' ' + f1(Math.sin(a) * L);
    }
    return d + 'Z';
  }
  var BIG = starPath(14, 5.2, 8), SMALL = starPath(9, 2.4, 4);

  var sats = [
    { o: 0, t: -2.2, base: TAU / 26, amp: 0.45, per: 37, ph: 0 },
    { o: 1, t: 1.1, base: TAU / 31, amp: 0.4, per: 23, ph: 2.1 }
  ].map(function (s) {
    s.big = el('path', { d: BIG, 'class': 'star' }, gStars);
    s.small = el('path', { d: SMALL, 'class': 'star-small' }, gStars);
    return s;
  });

  function place(s) {
    var o = orbits[s.o];
    var p = at(o, s.t), q = at(o, s.t + 0.95);         // 작은 별은 멀찍이 뒤에서 따라온다
    var k = 0.78 + 0.32 * (p.depth + 1) / 2;            // 가까울수록 크게
    var kq = 0.78 + 0.32 * (q.depth + 1) / 2;
    s.big.setAttribute('transform', 'translate(' + f1(p.x) + ' ' + f1(p.y) + ') scale(' + k.toFixed(3) + ')');
    s.small.setAttribute('transform', 'translate(' + f1(q.x) + ' ' + f1(q.y) + ') scale(' + kq.toFixed(3) + ')');
    s.big.setAttribute('opacity', (0.72 + 0.28 * (p.depth + 1) / 2).toFixed(2));
    // 별이 지나가는 자리는 궤도 선을 비워 준다
    o.holes[0].setAttribute('cx', f1(p.x)); o.holes[0].setAttribute('cy', f1(p.y)); o.holes[0].setAttribute('r', f1(17 * k));
    o.holes[1].setAttribute('cx', f1(q.x)); o.holes[1].setAttribute('cy', f1(q.y)); o.holes[1].setAttribute('r', f1(12 * kq));
  }

  function speed(s, clock) {                            // 저마다의 속도, 천천히 변한다
    return s.base * (1 + s.amp * Math.sin(clock * TAU / s.per + s.ph));
  }

  // 사분면 네 자리: 글 대신 작은 행성·별 (마우스를 올리면 원래 문구)
  // 각자 작은 원을 그리며 떠다니고, 모양마다 따로 움직인다.
  var decos = [
    { x: 268, y: 24, q: '실행 / 변화 / 성장', kind: 'ring' },              // Output–Grow
    { x: 434, y: 392, q: '목표 / 설계', kind: 'spark' },                   // Grow–Input
    { x: 196, y: 588, q: '기억 / 배움', kind: 'moon' },                    // Input–Care
    { x: 24, y: 214, q: '생각 정리 · 셀프 리뷰 / 피드백', kind: 'phase' }  // Care–Output
  ].map(function (d, i) {
    var g = el('g', {}, gDeco);
    el('title', {}, g).textContent = d.q;
    el('circle', { r: 16, fill: 'transparent' }, g);                     // 마우스 올리기 쉽게
    var inner = el('g', {}, g);
    if (d.kind === 'ring') {
      el('path', { d: 'M-13 1.5 A13 4 -14 0 0 13 -1.5', 'class': 'deco-line' }, inner);   // 뒤쪽 고리
      el('circle', { r: 6.5, 'class': 'deco-fill' }, inner);
      el('path', { d: 'M-13 1.5 A13 4 -14 0 1 13 -1.5', 'class': 'deco-line' }, inner);   // 앞쪽 고리
    } else if (d.kind === 'spark') {
      el('path', { d: starPath(8, 1.8, 4), 'class': 'deco-line' }, inner);
    } else if (d.kind === 'moon') {
      el('circle', { r: 11.6, 'class': 'deco-line', 'stroke-dasharray': '1.5 3' }, inner);
      el('circle', { r: 5.5, 'class': 'deco-fill' }, inner);
      d.moon = el('circle', { r: 1.9, 'class': 'deco-fill' }, inner);
    } else {
      el('circle', { r: 6.5, 'class': 'deco-line' }, inner);
      d.shade = el('path', { 'class': 'deco-fill' }, inner);
    }
    d.g = g; d.inner = inner; d.ph = i * 1.7;
    return d;
  });
  function phasePath(f) {                    // f: 0→1→0 차오름. 오른쪽부터 차는 달 모양
    var r = 6.5, k = Math.cos(f * Math.PI) * r;   // 경계선 타원의 가로 반지름(부호 = 방향)
    return 'M0 ' + (-r) + ' A' + r + ' ' + r + ' 0 0 1 0 ' + r +
      ' A' + f1(Math.abs(k)) + ' ' + r + ' 0 0 ' + (k > 0 ? 0 : 1) + ' 0 ' + (-r) + 'Z';
  }
  function float(clock) {
    decos.forEach(function (d) {
      var w = clock * TAU / 9 + d.ph;                                   // 작은 원을 그리며 떠다님
      var x = d.x + Math.cos(w) * 4, y = d.y + Math.sin(w * 1.3) * 5;
      d.g.setAttribute('transform', 'translate(' + f1(x) + ' ' + f1(y) + ')');
      if (d.kind === 'ring') {                                          // 고리 행성: 천천히 기울었다 돌아옴
        d.inner.setAttribute('transform', 'rotate(' + f1(Math.sin(clock * TAU / 6 + d.ph) * 16) + ')');
      } else if (d.kind === 'spark') {                                  // 별: 천천히 돌며 반짝
        var sc = 0.85 + 0.25 * (0.5 + 0.5 * Math.sin(clock * TAU / 2.6));
        d.inner.setAttribute('transform', 'rotate(' + f1(clock * 24 % 360) + ') scale(' + sc.toFixed(3) + ')');
      } else if (d.kind === 'moon') {                                   // 작은 달이 점선 궤도를 돈다
        var m = -clock * TAU / 5;
        d.moon.setAttribute('cx', f1(Math.cos(m) * 11.6));
        d.moon.setAttribute('cy', f1(Math.sin(m) * 11.6));
      } else {                                                          // 반쯤 찬 행성: 차고 기운다
        var f = 0.5 + 0.42 * Math.sin(clock * TAU / 10);
        d.shade.setAttribute('d', phasePath(f));
      }
    });
  }
  float(0);

  if (reduce) { sats.forEach(place); return; }

  var last = null, clock = 0;
  function frame(now) {
    if (last === null) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now; clock += dt;
    sats.forEach(function (s) { s.t -= speed(s, clock) * dt; place(s); });   // 반시계
    float(clock);
    requestAnimationFrame(frame);
  }
  sats.forEach(place);
  requestAnimationFrame(frame);
})();
