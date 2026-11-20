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
    { rx: 150, ry: 282, rot: -7 },     // 세로로 긴 궤도
    { rx: 278, ry: 150, rot: -47 }     // 비스듬히 누운 궤도
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
    label('output', top.x - 4, top.y - 10);
    label('input', bot.x + 4, bot.y + 20);
    var g = at(b, 0), c = at(b, Math.PI);
    var ux = b.c, uy = b.s;                            // 누운 궤도의 긴 축 방향
    label('grow', g.x + ux * 10, g.y + uy * 10, 'start');
    label('care', c.x - ux * 10, c.y - uy * 10 + 9, 'end');
  })();

  // 별: 8갈래
  function starPath(R, r) {
    var d = '';
    for (var i = 0; i < 16; i++) {
      var a = i * TAU / 16 - Math.PI / 2, L = i % 2 ? r : R;
      d += (i ? 'L' : 'M') + f1(Math.cos(a) * L) + ' ' + f1(Math.sin(a) * L);
    }
    return d + 'Z';
  }
  var BIG = starPath(14, 5.2), SMALL = starPath(8.5, 3.4);

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
    var p = at(o, s.t), q = at(o, s.t + 0.42);         // 작은 별은 조금 뒤에서 따라온다
    var k = 0.78 + 0.32 * (p.depth + 1) / 2;            // 가까울수록 크게
    var kq = 0.78 + 0.32 * (q.depth + 1) / 2;
    s.big.setAttribute('transform', 'translate(' + f1(p.x) + ' ' + f1(p.y) + ') scale(' + k.toFixed(3) + ')');
    s.small.setAttribute('transform', 'translate(' + f1(q.x) + ' ' + f1(q.y) + ') scale(' + kq.toFixed(3) + ')');
    s.big.setAttribute('opacity', (0.72 + 0.28 * (p.depth + 1) / 2).toFixed(2));
    // 별이 지나가는 자리는 궤도 선을 비워 준다
    o.holes[0].setAttribute('cx', f1(p.x)); o.holes[0].setAttribute('cy', f1(p.y)); o.holes[0].setAttribute('r', f1(17 * k));
    o.holes[1].setAttribute('cx', f1(q.x)); o.holes[1].setAttribute('cy', f1(q.y)); o.holes[1].setAttribute('r', f1(11 * kq));
  }

  function speed(s, clock) {                            // 저마다의 속도, 천천히 변한다
    return s.base * (1 + s.amp * Math.sin(clock * TAU / s.per + s.ph));
  }

  if (reduce) { sats.forEach(place); return; }

  var last = null, clock = 0;
  function frame(now) {
    if (last === null) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now; clock += dt;
    sats.forEach(function (s) { s.t -= speed(s, clock) * dt; place(s); });   // 반시계
    requestAnimationFrame(frame);
  }
  sats.forEach(place);
  requestAnimationFrame(frame);
})();
