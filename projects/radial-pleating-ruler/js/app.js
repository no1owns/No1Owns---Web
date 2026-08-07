const $ = id => document.getElementById(id);

function sync(a, b) {
  $(b).value = $(a).value;
}

function preset(r) {
  $('radius').value = r;
  $('radiusN').value = r;
  draw();
}

function draw() {
  let R = +$('radius').value, A = +$('angle').value * Math.PI / 180, slots = +$('slots').value;
  $('radiusN').value = R;
  $('angleN').value = Math.round(A * 180 / Math.PI);
  let scale = 180 / R, rr = R * scale, x = rr * Math.sin(A / 2), y = rr * Math.cos(A / 2);
  let d = `M 0 0 L ${-x} ${y} A ${rr} ${rr} 0 0 1 ${x} ${y} Z`;
  let s = `<path d="${d}" fill="#dedede" stroke="#fff" stroke-width="1"/>`;
  for (let i = 0; i < slots; i++) {
    let yy = 32 + i * (y - 55) / Math.max(1, slots - 1), half = (yy / y) * x * .68;
    s += `<line x1="${-half}" y1="${yy}" x2="${half}" y2="${yy}" stroke="#222" stroke-width="5" stroke-linecap="round"/>`;
  }
  for (let i = -6; i <= 6; i++) {
    let xx = i * (x * 1.55 / 12);
    let yy = Math.sqrt(Math.max(0, rr * rr - xx * xx));
    s += `<circle cx="${xx}" cy="${yy - 8}" r="3.5" fill="#222"/>`;
  }
  s += `<line x1="0" y1="14" x2="0" y2="${y - 20}" stroke="#aaa" stroke-width=".8" stroke-dasharray="2 3"/>`;
  $('svg').innerHTML = s;
}

function mesh() {
  let R = +$('radius').value, A = +$('angle').value * Math.PI / 180, T = +$('thick').value, n = 50, p = [[0, 0]];
  for (let i = 0; i <= n; i++) {
    let t = -A / 2 + A * i / n;
    p.push([R * Math.sin(t), R * Math.cos(t)]);
  }
  let v = [], f = [], N = p.length;
  for (let z of [0, T]) for (let q of p) v.push([q[0], q[1], z]);
  for (let i = 1; i < N - 1; i++) { f.push([0, i + 1, i], [N, N + i, N + i + 1]); }
  for (let i = 0; i < N; i++) {
    let j = (i + 1) % N;
    f.push([i, j, N + j], [i, N + j, N + i]);
  }
  return { v, f };
}

function exportSTL() {
  let m = mesh(), txt = 'solid ruler\n';
  for (let q of m.f) {
    let a = m.v[q[0]], b = m.v[q[1]], c = m.v[q[2]];
    txt += 'facet normal 0 0 0\nouter loop\n';
    for (let p of [a, b, c]) txt += `vertex ${p[0]} ${p[1]} ${p[2]}\n`;
    txt += 'endloop\nendfacet\n';
  }
  txt += 'endsolid ruler';
  let blob = new Blob([txt], { type: 'model/stl' }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'radial-pleating-ruler.stl';
  a.click();
}

function saveConfig() {
  let o = {
    radius: +$('radius').value,
    angle: +$('angle').value,
    thickness: +$('thick').value,
    slots: +$('slots').value,
    slotWidth: +$('slotw').value,
    tieHoleDiameter: +$('holed').value
  };
  let a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(o, null, 2)], { type: 'application/json' }));
  a.download = 'ruler-config.json';
  a.click();
}

draw();
