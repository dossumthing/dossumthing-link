/* 두썸띵 My recording Orbit — 나선형 궤도
   바닥 평면: My planet을 중심으로 4축 (x: Grow + / Care -, y: Output + / Input -)
   기록은 Input → Grow → Output → Care 반시계로 돌며, 한 바퀴마다 조금씩 위로 올라간다(꾸준함). */
(function () {
  var svg = document.getElementById('orbit');
  var fig = document.getElementById('orbit-fig');
  if (!svg || !fig) return;

  var NS = 'http://www.w3.org/2000/svg';
  var DEG = Math.PI / 180;

  // 장면 설정
  var CX = 230, CY = 452, D = 1400;        // 바닥 중심의 화면 위치, 원근 거리
  var R = 114;                             // 나선 반지름
  var A0 = -90, A1 = -90 + 360 * 2;        // Input 앞에서 시작해 2바퀴
  var H = 318;                             // 나선 전체 높이
  var AXIS_UP = 372;                       // 세로축 길이
  var GROUND = 158;                        // 바닥 축 길이(반)
  var TILT = 73 * DEG;                     // 바닥 평면 기울기 (클수록 옆에서 봄)
  var YAW0 = -14 * DEG;                    // 기본 회전
  var CLIMB = 16;                          // 다홍 점이 끝까지 오르는 시간(초)

  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  var yaw = YAW0, drag = 0;

  function P(x, y, h) {
    var c = Math.cos(yaw), s = Math.sin(yaw);
    var xr = x * c - y * s, yr = x * s + y * c;
    var ct = Math.cos(TILT), st = Math.sin(TILT);
    var up = yr * ct + h * st;
    var z = yr * st - h * ct;               // + 먼 쪽
    var k = D / (D + z);
    return { x: CX + xr * k, y: CY - up * k, z: z, k: k };
  }
  function helix(a) {                       // a: 각도(도)
    var t = (a - A0) / (A1 - A0);
    return P(R * Math.cos(a * DEG), R * Math.sin(a * DEG), 18 + H * t);
  }
  function f1(n) { return n.toFixed(1); }
  function pt(cmd, p) { return cmd + f1(p.x) + ' ' + f1(p.y); }

  var layers = {};
  ['back', 'axis', 'front', 'top'].forEach(function (k) {
    layers[k] = document.createElementNS(NS, 'g');
    svg.appendChild(layers[k]);
  });
  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    parent.appendChild(n);
    return n;
  }

  // 바닥
  var ground = el('path', { 'class': 'g-line' }, layers.back);
  var groundLabels = [
    { t: 'grow', v: [1, 0] }, { t: 'output', v: [0, 1] },
    { t: 'care', v: [-1, 0] }, { t: 'input', v: [0, -1] }
  ].map(function (g) { g.node = el('text', { 'class': 'lab-en' }, layers.back); g.node.textContent = g.t; return g; });
  var shadow = el('path', { 'class': 'shadow' }, layers.back);

  // 나선: 먼 쪽 / 가까운 쪽을 따로 그려 세로축을 사이에 끼운다
  var helixBack = el('path', { 'class': 'helix back' }, layers.back);
  var helixFront = el('path', { 'class': 'helix' }, layers.front);
  var chevBack = el('path', { 'class': 'chev back' }, layers.back);
  var chevFront = el('path', { 'class': 'chev' }, layers.front);

  // 세로축
  var vAxis = el('path', { 'class': 'v-axis' }, layers.axis);
  var ticks = el('path', { 'class': 'tick' }, layers.axis);
  var vLabel = el('text', { 'class': 'lab-en', 'text-anchor': 'middle' }, layers.axis);
  vLabel.textContent = 'keep orbiting';

  // 행성
  var planet = el('g', {}, layers.axis);
  el('ellipse', { 'class': 'planet', rx: 40, ry: 22 }, planet);
  el('text', { 'class': 'planet-t', y: 0.5 }, planet).textContent = 'My planet';

  // 궤도 위 기록 지점 (첫 바퀴의 사분면 + 끝점)
  var nodes = [
    // 궤도의 양 옆 가장자리(앞뒤 깊이 0)에 번갈아 놓아 겹치지 않게
    { a: 14, lines: ['목표 / 설계'] },
    { a: 194, lines: ['실행 / 변화 / 성장'] },
    { a: 374, lines: ['생각 정리', '셀프 리뷰 / 피드백'] },
    { a: 554, lines: ['기억 / 배움'] },
    { a: A1, lines: [] }
  ].map(function (n) {
    n.dot = el('circle', { 'class': 'node', r: 2.6 }, layers.top);
    n.text = el('text', { 'class': 'lab-ko' }, layers.top);
    n.lines.forEach(function (l, i) {
      el('tspan', { x: 0, dy: i ? 15 : 0 }, n.text).textContent = l;
    });
    return n;
  });

  var trail = el('path', { 'class': 'sat-trail' }, layers.top);
  var sat = el('circle', { 'class': 'sat', r: 5 }, layers.top);

  var CHEVS = [100, 280, 460];      // 화살표 자리(각도)

  function chevron(a) {
    var p = helix(a), q = helix(a + 2), b = helix(a - 2);
    var dx = q.x - b.x, dy = q.y - b.y, L = Math.hypot(dx, dy) || 1;
    dx /= L; dy /= L;
    var s = 6.5, w = 4.2;
    var bx = p.x - dx * s, by = p.y - dy * s;
    return { z: p.z, d: 'M' + f1(bx - dy * w) + ' ' + f1(by + dx * w) + pt('L', p) + 'L' + f1(bx + dy * w) + ' ' + f1(by - dx * w) };
  }

  var satT = reduce ? 0.12 : 0;

  function draw() {
    // 바닥 십자
    var gd = '';
    [[1, 0], [0, 1]].forEach(function (v) {
      gd += pt('M', P(-v[0] * GROUND, -v[1] * GROUND, 0)) + pt('L', P(v[0] * GROUND, v[1] * GROUND, 0));
    });
    ground.setAttribute('d', gd);
    groundLabels.forEach(function (g) {
      var p = P(g.v[0] * (GROUND + 12), g.v[1] * (GROUND + 12), 0);
      var mid = Math.abs(p.x - CX) < 40;       // 세로축 근처면 축 옆으로 비켜 쓴다
      g.node.setAttribute('x', f1(mid ? p.x + 7 : p.x));
      g.node.setAttribute('y', f1(mid && p.z > 0 ? p.y - 4 : p.y + 4));
      g.node.setAttribute('text-anchor', mid || p.x > CX ? 'start' : 'end');
    });

    // 행성 그림자(바닥에 비친 원)
    var sd = '';
    for (var i = 0; i <= 36; i++) {
      var aa = i * 10 * DEG;
      sd += pt(i ? 'L' : 'M', P(46 * Math.cos(aa), 46 * Math.sin(aa), 0));
    }
    shadow.setAttribute('d', sd + 'Z');

    // 나선
    var back = '', front = '', prev = null, prevFront = null;
    for (var a = A0; a <= A1 + 0.01; a += 3) {
      var p = helix(a);
      if (prev) {
        var isFront = (prev.z + p.z) / 2 < 0;
        if (isFront !== prevFront) {
          if (isFront) front += pt('M', prev); else back += pt('M', prev);
        }
        if (isFront) front += pt('L', p); else back += pt('L', p);
        prevFront = isFront;
      }
      prev = p;
    }
    helixBack.setAttribute('d', back);
    helixFront.setAttribute('d', front);

    var cb = '', cf = '';
    CHEVS.forEach(function (ca) { var c = chevron(ca); if (c.z < 0) cf += c.d; else cb += c.d; });
    chevBack.setAttribute('d', cb);
    chevFront.setAttribute('d', cf);

    // 세로축 + 눈금
    var base = P(0, 0, 0), top = P(0, 0, AXIS_UP);
    vAxis.setAttribute('d', pt('M', base) + pt('L', top)
      + 'M' + f1(top.x - 4) + ' ' + f1(top.y + 7) + pt('L', top) + 'L' + f1(top.x + 4) + ' ' + f1(top.y + 7));
    var td = '';
    for (var h = 50; h < AXIS_UP - 10; h += 25) {
      var tp = P(0, 0, h);
      td += pt('M', tp) + 'L' + f1(tp.x + 4) + ' ' + f1(tp.y);
    }
    ticks.setAttribute('d', td);
    vLabel.setAttribute('x', f1(top.x));
    vLabel.setAttribute('y', f1(top.y - 10));

    var pc = P(0, 0, 22);
    planet.setAttribute('transform', 'translate(' + f1(pc.x) + ' ' + f1(pc.y) + ')');

    // 기록 지점
    nodes.forEach(function (n) {
      var q = helix(n.a);
      n.dot.setAttribute('cx', f1(q.x));
      n.dot.setAttribute('cy', f1(q.y));
      var right = q.x >= CX;
      n.text.setAttribute('text-anchor', right ? 'start' : 'end');
      var tx = q.x + (right ? 9 : -9), ty = q.y + 4 - (n.lines.length - 1) * 7.5;
      n.text.setAttribute('transform', 'translate(' + f1(tx) + ' ' + f1(ty) + ')');
      var o = q.z > 0 ? 0.55 : 1;
      n.text.setAttribute('opacity', o);
      n.dot.setAttribute('opacity', o);
    });

    // 다홍 점: 나선을 따라 아래에서 위로
    var sa = A0 + (A1 - A0) * Math.min(1, satT);
    var s = helix(sa);
    sat.setAttribute('cx', f1(s.x));
    sat.setAttribute('cy', f1(s.y));
    sat.setAttribute('opacity', s.z > 0 ? 0.75 : 1);
    var tr = '', from = Math.max(A0, sa - 40);
    for (var b = from; b <= sa; b += 2) tr += pt(b === from ? 'M' : 'L', helix(b));
    trail.setAttribute('d', tr);
  }

  // 손가락·마우스로 옆으로 끌면 나선이 돈다
  var dragging = false, lastX = 0;
  fig.addEventListener('pointerdown', function (e) {
    dragging = true; lastX = e.clientX;
    fig.classList.add('dragging');
    try { fig.setPointerCapture(e.pointerId); } catch (err) {}
  });
  fig.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    drag += (e.clientX - lastX) * 0.5 * DEG;
    lastX = e.clientX;
    if (reduce) { yaw = YAW0 + drag; draw(); }
  });
  function release() {
    if (!dragging) return;
    dragging = false;
    fig.classList.remove('dragging');
  }
  fig.addEventListener('pointerup', release);
  fig.addEventListener('pointercancel', release);

  if (reduce) { draw(); return; }

  var last = null, clock = 0;
  function frame(now) {
    if (last === null) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    clock += dt;

    if (!dragging) drag *= Math.exp(-dt * 1.2);                        // 손을 떼면 천천히 제자리로
    var tYaw = YAW0 + Math.sin(clock * 2 * Math.PI / 24) * 7 * DEG + drag;  // 아주 느리게 흔들림
    yaw += (tYaw - yaw) * (1 - Math.exp(-dt * (dragging ? 20 : 4)));

    satT += dt / CLIMB;
    if (satT > 1.1) satT = 0;                                          // 끝에서 잠깐 머문 뒤 다시 처음부터
    draw();
    requestAnimationFrame(frame);
  }
  draw();
  requestAnimationFrame(frame);
})();
