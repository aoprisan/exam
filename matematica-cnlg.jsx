import React, { useState, useEffect, useRef, useCallback } from "react";

/* ------------------------------------------------------------------ */
/* Utilitare                                                           */
/* ------------------------------------------------------------------ */

const ri = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[ri(0, arr.length - 1)];
const fmt = (n) => n.toLocaleString("ro-RO");

const toRoman = (n) => {
  const pairs = [
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let out = "";
  for (const [v, s] of pairs) {
    while (n >= v) { out += s; n -= v; }
  }
  return out;
};

const normalize = (s) =>
  String(s ?? "")
    .trim()
    .toUpperCase()
    .replace(/[.\s]/g, "")
    .replace(/,/g, "");

const checkAnswer = (user, correct) => normalize(user) === normalize(correct);

/* ------------------------------------------------------------------ */
/* Generatoare de antrenament — fiecare primește nivelul (1, 2, 3)     */
/* Nivel 1: încălzire · Nivel 2: clasa a IV-a · Nivel 3: ca la examen  */
/* ------------------------------------------------------------------ */

const genAdunareScadere = (l) => {
  if (l === 3) {
    const a = ri(1234, 80000), b = ri(1234, 80000), cMax = a + b - 100;
    const c = ri(500, cMax);
    return {
      q: `${fmt(a)} + ${fmt(b)} − ${fmt(c)} =`,
      a: String(a + b - c),
      expl: `Întâi adunarea: ${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}. Apoi scăderea: ${fmt(a + b)} − ${fmt(c)} = ${fmt(a + b - c)}.`,
    };
  }
  const lo = l === 1 ? 120 : 1234;
  const hi = l === 1 ? 9800 : 487650;
  if (Math.random() < 0.5) {
    const a = ri(lo, hi), b = ri(lo, hi);
    return {
      q: `${fmt(a)} + ${fmt(b)} =`,
      a: String(a + b),
      expl: `Adunăm cifră cu cifră, cu trecere peste ordin: ${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}.`,
    };
  }
  const x = ri(lo, hi), y = ri(lo, hi);
  const a = Math.max(x, y), b = Math.min(x, y);
  return {
    q: `${fmt(a)} − ${fmt(b)} =`,
    a: String(a - b),
    expl: `Scădem cifră cu cifră, cu împrumut unde e nevoie: ${fmt(a)} − ${fmt(b)} = ${fmt(a - b)}.`,
  };
};

const genInmultireImpartire = (l) => {
  if (l === 1) {
    if (Math.random() < 0.5) {
      const a = ri(2, 9), b = ri(2, 9);
      return { q: `${a} × ${b} =`, a: String(a * b), expl: `Din tabla înmulțirii: ${a} × ${b} = ${a * b}.` };
    }
    const cat = ri(2, 9), d = ri(2, 9);
    return { q: `${cat * d} : ${d} =`, a: String(cat), expl: `Din tabla împărțirii: ${cat} × ${d} = ${cat * d}, deci câtul este ${cat}.` };
  }
  if (l === 3) {
    if (Math.random() < 0.5) {
      const a = ri(123, 987), b = ri(12, 99);
      return {
        q: `${fmt(a)} × ${b} =`,
        a: String(a * b),
        expl: `Înmulțim cu unitățile, apoi cu zecile (deplasat un rând) și adunăm: ${fmt(a)} × ${b} = ${fmt(a * b)}.`,
      };
    }
    const cat = ri(102, 989), d = ri(3, 9);
    return {
      q: `${fmt(cat * d)} : ${d} =`,
      a: String(cat),
      expl: `Verificare: ${cat} × ${d} = ${fmt(cat * d)}. Câtul este ${cat}.`,
    };
  }
  const r = Math.random();
  if (r < 0.4) {
    const a = ri(123, 987), b = ri(3, 9);
    return {
      q: `${fmt(a)} × ${b} =`,
      a: String(a * b),
      expl: `Înmulțim fiecare cifră, cu trecere peste ordin: ${fmt(a)} × ${b} = ${fmt(a * b)}.`,
    };
  }
  if (r < 0.7) {
    const cat = ri(12, 98), d = ri(3, 9);
    return {
      q: `${fmt(cat * d)} : ${d} =`,
      a: String(cat),
      expl: `Verificare: ${cat} × ${d} = ${fmt(cat * d)}. Deci câtul este ${cat}.`,
    };
  }
  const cat = ri(10, 90), d = ri(4, 9), rest = ri(1, d - 1);
  const a = cat * d + rest;
  return {
    q: `Care este restul împărțirii ${fmt(a)} : ${d}?`,
    a: String(rest),
    expl: `${fmt(a)} = ${d} × ${cat} + ${rest}, deci câtul este ${cat} și restul ${rest}. Restul e mereu mai mic decât împărțitorul.`,
  };
};

/* Expresie cu paranteze pătrate, ca subiectul 1b) de la examen */
const makeNested = () => {
  const r = ri(2, 9);
  const inner2 = ri(2, 12);
  const P = inner2 * r;
  const p = ri(1, P - 1), q2 = P - p;
  let m = ri(3, 9), n = ri(3, 9);
  while (m * n <= inner2) { m = ri(3, 9); n = ri(3, 9); }
  const s = ri(2, 5);
  const val = (m * n - inner2) * s;
  const T = val + ri(100, 3000);
  return {
    q: `${fmt(T)} − [${m} × ${n} − (${p} + ${q2}) : ${r}] × ${s} =`,
    a: String(T - val),
    expl: `Paranteza rotundă: ${p} + ${q2} = ${P}. Apoi ${P} : ${r} = ${inner2}. Paranteza pătrată: ${m} × ${n} − ${inner2} = ${m * n - inner2}. Înmulțim: ${m * n - inner2} × ${s} = ${val}. La final: ${fmt(T)} − ${val} = ${fmt(T - val)}.`,
  };
};

/* Expresie cu împărțiri exacte, ca subiectul 1a) de la examen */
const makeDivExpr = () => {
  const b = ri(3, 9), q1 = ri(80, 140), A = q1 * b;
  const d = ri(3, 9), q2 = ri(10, q1 - 10), C = q2 * d;
  const E = ri(500, 2500);
  return {
    q: `${fmt(A)} : ${b} − ${fmt(C)} : ${d} + ${fmt(E)} =`,
    a: String(q1 - q2 + E),
    expl: `Întâi împărțirile: ${fmt(A)} : ${b} = ${q1} și ${fmt(C)} : ${d} = ${q2}. Apoi, în ordine: ${q1} − ${q2} + ${fmt(E)} = ${fmt(q1 - q2 + E)}.`,
  };
};

const genOrdinea = (l) => {
  if (l === 1) {
    const a = ri(5, 30), b = ri(2, 5), c = ri(2, 5);
    return {
      q: `${a} + ${b} × ${c} =`,
      a: String(a + b * c),
      expl: `Întâi înmulțirea: ${b} × ${c} = ${b * c}. Apoi adunarea: ${a} + ${b * c} = ${a + b * c}.`,
    };
  }
  if (l === 3) return Math.random() < 0.5 ? makeNested() : makeDivExpr();
  const v = ri(1, 4);
  if (v === 1) {
    const a = ri(10, 90), b = ri(2, 9), c = ri(2, 9);
    return {
      q: `${a} + ${b} × ${c} =`,
      a: String(a + b * c),
      expl: `Întâi înmulțirea: ${b} × ${c} = ${b * c}. Apoi adunarea: ${a} + ${b * c} = ${a + b * c}.`,
    };
  }
  if (v === 2) {
    const c = ri(2, 9), q2 = ri(2, 9), b = c * q2;
    const a = ri(b + 5, b + 80);
    return {
      q: `${a} − ${b} : ${c} =`,
      a: String(a - q2),
      expl: `Întâi împărțirea: ${b} : ${c} = ${q2}. Apoi scăderea: ${a} − ${q2} = ${a - q2}.`,
    };
  }
  if (v === 3) {
    const a = ri(3, 20), b = ri(3, 20), c = ri(2, 6);
    return {
      q: `(${a} + ${b}) × ${c} =`,
      a: String((a + b) * c),
      expl: `Întâi paranteza: ${a} + ${b} = ${a + b}. Apoi înmulțirea: ${a + b} × ${c} = ${(a + b) * c}.`,
    };
  }
  const a = ri(3, 9), b = ri(3, 9), c = ri(2, 9), d = ri(2, 9);
  const p1 = a * b, p2 = c * d;
  const big = Math.max(p1, p2), small = Math.min(p1, p2);
  const swap = p1 < p2;
  const [x1, y1, x2, y2] = swap ? [c, d, a, b] : [a, b, c, d];
  return {
    q: `${x1} × ${y1} − ${x2} × ${y2} =`,
    a: String(big - small),
    expl: `Întâi înmulțirile: ${x1} × ${y1} = ${big} și ${x2} × ${y2} = ${small}. Apoi: ${big} − ${small} = ${big - small}.`,
  };
};

/* Ecuație în doi pași, ca subiectul 2 de la examen */
const makeEq2Step = () => {
  const v = ri(1, 3);
  if (v === 1) {
    // (x : a − b) : c + d = e  → mersul invers
    const d = ri(2, 9), e = d + ri(2, 9), c = ri(2, 10);
    const t = (e - d) * c;
    const b = ri(10, 200);
    const a = ri(2, 9);
    const x = (t + b) * a;
    return {
      q: `(x : ${a} − ${b}) : ${c} + ${d} = ${e}.  Cât este x?`,
      a: String(x),
      expl: `Mersul invers: paranteza : ${c} = ${e} − ${d} = ${e - d}, deci paranteza = ${e - d} × ${c} = ${t}. Apoi x : ${a} = ${t} + ${b} = ${t + b}, deci x = ${t + b} × ${a} = ${fmt(x)}.`,
    };
  }
  if (v === 2) {
    // (x + a) × b = c
    const x = ri(8, 200), a = ri(5, 90), b = ri(2, 9);
    const c = (x + a) * b;
    return {
      q: `(x + ${a}) × ${b} = ${fmt(c)}.  Cât este x?`,
      a: String(x),
      expl: `Mersul invers: x + ${a} = ${fmt(c)} : ${b} = ${x + a}, deci x = ${x + a} − ${a} = ${x}.`,
    };
  }
  // truc clasic: m − (m − x) = b  →  x = b
  const m = ri(300, 950), x = ri(10, 250);
  return {
    q: `${m} − (${m} − x) = ${x}.  Cât este x?`,
    a: String(x),
    expl: `Truc de examen: ${m} − (${m} − x) este chiar x, oricare ar fi x! Deci x = ${x}, direct din egalitate.`,
  };
};

const genNecunoscut = (l) => {
  if (l === 3) return makeEq2Step();
  const maxA = l === 1 ? 90 : 480;
  const v = l === 1 ? ri(1, 2) : ri(1, 5);
  if (v === 1) {
    const x = ri(15, maxA), a = ri(12, maxA);
    return {
      q: `x + ${a} = ${x + a}.  Cât este x?`,
      a: String(x),
      expl: `Termenul necunoscut = suma − termenul cunoscut: x = ${x + a} − ${a} = ${x}.`,
    };
  }
  if (v === 2) {
    const x = ri(50, maxA + 120), a = ri(10, x - 10);
    return {
      q: `x − ${a} = ${x - a}.  Cât este x?`,
      a: String(x),
      expl: `Descăzutul = diferența + scăzătorul: x = ${x - a} + ${a} = ${x}.`,
    };
  }
  if (v === 3) {
    const a = ri(60, 700), x = ri(10, a - 10);
    return {
      q: `${a} − x = ${a - x}.  Cât este x?`,
      a: String(x),
      expl: `Scăzătorul = descăzutul − diferența: x = ${a} − ${a - x} = ${x}.`,
    };
  }
  if (v === 4) {
    const x = ri(6, 90), a = ri(3, 9);
    return {
      q: `x × ${a} = ${x * a}.  Cât este x?`,
      a: String(x),
      expl: `Factorul necunoscut = produsul : factorul cunoscut: x = ${x * a} : ${a} = ${x}.`,
    };
  }
  const a = ri(3, 9), q2 = ri(4, 60), x = a * q2;
  return {
    q: `x : ${a} = ${q2}.  Cât este x?`,
    a: String(x),
    expl: `Deîmpărțitul = câtul × împărțitorul: x = ${q2} × ${a} = ${x}.`,
  };
};

/* Numere consecutive, ca subiectul 3 de la examen */
const makeConsecutive = () => {
  const n = ri(20, 400);
  const sum3 = 3 * n + 3; // n + (n+1) + (n+2)
  if (Math.random() < 0.5) {
    return {
      q: `Suma a trei numere naturale consecutive este ${fmt(sum3)}. Care este cel mai mic dintre ele?`,
      a: String(n),
      expl: `Numărul din mijloc = ${fmt(sum3)} : 3 = ${n + 1}. Cel mai mic = ${n + 1} − 1 = ${n}. (Cele trei numere: ${n}, ${n + 1}, ${n + 2}.)`,
    };
  }
  const D = 2 * sum3;
  return {
    q: `Dublul sumei a trei numere naturale consecutive este ${fmt(D)}. Care este cel mai mic dintre ele?`,
    a: String(n),
    expl: `Suma celor trei numere = ${fmt(D)} : 2 = ${fmt(sum3)}. Numărul din mijloc = ${fmt(sum3)} : 3 = ${n + 1}, deci cel mai mic este ${n}. (Numerele: ${n}, ${n + 1}, ${n + 2}.)`,
  };
};

const genFigurativa = (l) => {
  if (l === 3) return makeConsecutive();
  if (l === 1 || Math.random() < 0.5) {
    const maxS = l === 1 ? 40 : 70;
    if (l !== 1 && Math.random() < 0.5) {
      const small = ri(12, 70), d = ri(4, 40);
      const large = small + d, S = small + large;
      const askSmall = Math.random() < 0.5;
      return {
        q: `Suma a două numere este ${S}, iar diferența lor este ${d}. Care este numărul mai ${askSmall ? "mic" : "mare"}?`,
        a: String(askSmall ? small : large),
        expl: `Numărul mic = (sumă − diferență) : 2 = (${S} − ${d}) : 2 = ${small}. Numărul mare = ${small} + ${d} = ${large}. (Metoda figurativă: două segmente egale plus diferența.)`,
      };
    }
    const small = ri(4, maxS), k = ri(2, l === 1 ? 3 : 5);
    const large = small * k, S = small + large;
    const askSmall = Math.random() < 0.5;
    return {
      q: `Suma a două numere este ${S}. Unul dintre ele este de ${k} ori mai mare decât celălalt. Care este numărul mai ${askSmall ? "mic" : "mare"}?`,
      a: String(askSmall ? small : large),
      expl: `Desenăm segmente: numărul mic = 1 segment, cel mare = ${k} segmente, în total ${k + 1} segmente. Un segment = ${S} : ${k + 1} = ${small}. Numărul mare = ${small} × ${k} = ${large}.`,
    };
  }
  const small = ri(12, 70), d = ri(4, 40);
  const large = small + d, S = small + large;
  const askSmall = Math.random() < 0.5;
  return {
    q: `Suma a două numere este ${S}, iar diferența lor este ${d}. Care este numărul mai ${askSmall ? "mic" : "mare"}?`,
    a: String(askSmall ? small : large),
    expl: `Numărul mic = (sumă − diferență) : 2 = (${S} − ${d}) : 2 = ${small}. Numărul mare = ${small} + ${d} = ${large}.`,
  };
};

const genFractii = (l) => {
  if (l === 1) {
    const b = pick([2, 4]), N = b * ri(3, 12);
    return {
      q: `Cât este ${b === 2 ? "jumătate" : "un sfert"} din ${N}?`,
      a: String(N / b),
      expl: `Împărțim la ${b}: ${N} : ${b} = ${N / b}.`,
    };
  }
  if (l === 3) {
    if (Math.random() < 0.5) {
      const N = 6 * ri(4, 30);
      return {
        q: `Cât este o jumătate dintr-o treime din ${N}?`,
        a: String(N / 6),
        expl: `O treime din ${N} = ${N} : 3 = ${N / 3}. Jumătate din ${N / 3} = ${N / 3} : 2 = ${N / 6}.`,
      };
    }
    const N = 12 * ri(3, 20);
    const spent = N / 3 + N / 4;
    return {
      q: `Dintr-o sumă de ${N} lei, Ana cheltuiește o treime pe cărți și un sfert pe rechizite. Câți lei îi rămân?`,
      a: String(N - spent),
      expl: `Pe cărți: ${N} : 3 = ${N / 3} lei. Pe rechizite: ${N} : 4 = ${N / 4} lei. Rămân: ${N} − ${N / 3} − ${N / 4} = ${N - spent} lei.`,
    };
  }
  const v = ri(1, 3);
  if (v === 1) {
    const b = pick([2, 3, 4, 5, 8, 10]);
    const a = ri(1, b - 1);
    const N = b * ri(3, 12);
    return {
      q: `Cât este ${a}/${b} din ${N}?`,
      a: String((N / b) * a),
      expl: `Împărțim întregul la numitor: ${N} : ${b} = ${N / b}. Apoi înmulțim cu numărătorul: ${N / b} × ${a} = ${(N / b) * a}.`,
    };
  }
  if (v === 2) {
    const d = pick([5, 7, 8, 9, 10, 12]);
    let a = ri(1, d - 1), b = ri(1, d - 1);
    if (a === b) b = (b % (d - 1)) + 1;
    const big = Math.max(a, b), sm = Math.min(a, b);
    return {
      q: `Care fracție este mai mare?`,
      choices: [`${sm}/${d}`, `${big}/${d}`],
      a: `${big}/${d}`,
      expl: `Au același numitor (${d}), deci e mai mare fracția cu numărătorul mai mare: ${big}/${d}.`,
    };
  }
  const d = pick([5, 7, 8, 9, 10, 11]);
  const a = ri(1, d - 3), b = ri(1, d - a - 1);
  return {
    q: `${a}/${d} + ${b}/${d} =  (scrie rezultatul ca fracție, de ex. 3/4)`,
    a: `${a + b}/${d}`,
    expl: `Au același numitor, deci adunăm doar numărătorii: ${a} + ${b} = ${a + b}. Rezultatul este ${a + b}/${d}.`,
  };
};

const CONVS = [
  { from: "km", to: "m", k: 1000, range: [2, 45] },
  { from: "m", to: "cm", k: 100, range: [3, 80] },
  { from: "m", to: "mm", k: 1000, range: [2, 15] },
  { from: "kg", to: "g", k: 1000, range: [2, 40] },
  { from: "t", to: "kg", k: 1000, range: [2, 25] },
  { from: "l", to: "ml", k: 1000, range: [2, 20] },
  { from: "ore", to: "minute", k: 60, range: [2, 12] },
  { from: "minute", to: "secunde", k: 60, range: [2, 15] },
  { from: "zile", to: "ore", k: 24, range: [2, 14] },
];

const genUnitati = (l) => {
  if (l === 3) {
    const c = pick([
      { big: "m", small: "cm", k: 100 },
      { big: "km", small: "m", k: 1000 },
      { big: "kg", small: "g", k: 1000 },
      { big: "ore", small: "minute", k: 60 },
    ]);
    const a = ri(2, 9), b = ri(1, c.k - 1);
    return {
      q: `${a} ${c.big} și ${b} ${c.small} = ? ${c.small}`,
      a: String(a * c.k + b),
      expl: `${a} ${c.big} = ${a} × ${fmt(c.k)} = ${fmt(a * c.k)} ${c.small}. Adunăm: ${fmt(a * c.k)} + ${b} = ${fmt(a * c.k + b)} ${c.small}.`,
    };
  }
  const conv = l === 1 ? pick(CONVS.slice(0, 2).concat(CONVS.slice(6, 7))) : pick(CONVS);
  if (l !== 1 && Math.random() < 0.3) {
    const n = ri(...conv.range);
    return {
      q: `${fmt(n * conv.k)} ${conv.to} = ? ${conv.from}`,
      a: String(n),
      expl: `Știm că 1 ${conv.from} = ${fmt(conv.k)} ${conv.to}, deci împărțim: ${fmt(n * conv.k)} : ${fmt(conv.k)} = ${n}.`,
    };
  }
  const n = ri(conv.range[0], l === 1 ? Math.min(9, conv.range[1]) : conv.range[1]);
  return {
    q: `${n} ${conv.from} = ? ${conv.to}`,
    a: String(n * conv.k),
    expl: `Înmulțim cu ${fmt(conv.k)}: ${n} × ${fmt(conv.k)} = ${fmt(n * conv.k)} ${conv.to}.`,
  };
};

const genGeometrie = (l) => {
  if (l === 1) {
    const s = ri(3, 20);
    return {
      q: `Un pătrat are latura de ${s} cm. Care este perimetrul lui, în cm?`,
      a: String(4 * s),
      expl: `P = 4 × latura = 4 × ${s} = ${4 * s} cm.`,
    };
  }
  if (l === 3) {
    if (Math.random() < 0.5) {
      const lat = ri(4, 25), k = ri(2, 4), L = lat * k;
      return {
        q: `Un dreptunghi are lățimea de ${lat} cm, iar lungimea de ${k} ori mai mare decât lățimea. Care este perimetrul lui, în cm?`,
        a: String(2 * (L + lat)),
        expl: `Lungimea = ${lat} × ${k} = ${L} cm. P = 2 × (${L} + ${lat}) = 2 × ${L + lat} = ${2 * (L + lat)} cm.`,
      };
    }
    const lat = ri(5, 30), d = ri(3, 25), L = lat + d;
    const P = 2 * (L + lat);
    return {
      q: `Un dreptunghi are perimetrul de ${P} cm, iar lungimea este cu ${d} cm mai mare decât lățimea. Cât măsoară lățimea, în cm?`,
      a: String(lat),
      expl: `Semiperimetrul: L + l = ${P} : 2 = ${L + lat}. Cum L = l + ${d}, avem l + l + ${d} = ${L + lat}, deci 2 × l = ${2 * lat}, adică l = ${lat} cm. (Metoda figurativă, cu sumă și diferență!)`,
    };
  }
  const v = ri(1, 4);
  if (v === 1) {
    const L = ri(8, 40), lat = ri(3, L - 1);
    return {
      q: `Un dreptunghi are lungimea de ${L} cm și lățimea de ${lat} cm. Care este perimetrul lui, în cm?`,
      a: String(2 * (L + lat)),
      expl: `P = 2 × (L + l) = 2 × (${L} + ${lat}) = 2 × ${L + lat} = ${2 * (L + lat)} cm.`,
    };
  }
  if (v === 2) {
    const s = ri(4, 50);
    return {
      q: `Un pătrat are latura de ${s} cm. Care este perimetrul lui, în cm?`,
      a: String(4 * s),
      expl: `P = 4 × latura = 4 × ${s} = ${4 * s} cm.`,
    };
  }
  if (v === 3) {
    const s = ri(5, 45);
    return {
      q: `Perimetrul unui pătrat este ${4 * s} cm. Cât măsoară latura lui, în cm?`,
      a: String(s),
      expl: `Latura = P : 4 = ${4 * s} : 4 = ${s} cm.`,
    };
  }
  const L = ri(10, 45), lat = ri(4, L - 2);
  const P = 2 * (L + lat);
  return {
    q: `Un dreptunghi are perimetrul ${P} cm și lungimea ${L} cm. Cât măsoară lățimea, în cm?`,
    a: String(lat),
    expl: `L + l = P : 2 = ${P} : 2 = ${L + lat}. Deci l = ${L + lat} − ${L} = ${lat} cm.`,
  };
};

const TRICKY_ROMAN = [];
for (let i = 1; i <= 100; i++) {
  const u = i % 10;
  if (u === 4 || u === 9 || (i >= 40 && i <= 49) || (i >= 90 && i <= 99)) TRICKY_ROMAN.push(i);
}

const genRomane = (l) => {
  const n = l === 1 ? ri(1, 20) : l === 3 ? pick(TRICKY_ROMAN) : ri(1, 100);
  if (Math.random() < 0.5) {
    return {
      q: `Scrie cu cifre arabe numărul roman ${toRoman(n)}.`,
      a: String(n),
      expl: `${toRoman(n)} = ${n}.${l === 3 ? " Atenție la scăderi: I înainte de V/X și X înainte de L/C înseamnă „minus”." : ""}`,
    };
  }
  return {
    q: `Scrie cu cifre romane numărul ${n}.`,
    a: toRoman(n),
    expl: `${n} = ${toRoman(n)}.${l === 3 ? " 4 și 9 se scriu prin scădere: IV, IX, XL, XC." : ""}`,
  };
};

const genRotunjire = (l) => {
  if (l === 3) {
    const a = ri(100, 9000), b = a + ri(15, 400);
    return {
      q: `Câte numere naturale sunt cuprinse strict între ${fmt(a)} și ${fmt(b)}?`,
      a: String(b - a - 1),
      expl: `Numerele dintre ele sunt ${fmt(a + 1)}, ${fmt(a + 2)}, …, ${fmt(b - 1)}. Sunt ${fmt(b)} − ${fmt(a)} − 1 = ${fmt(b - a - 1)} numere (capetele nu se numără).`,
    };
  }
  const v = ri(1, 3);
  if (v === 1) {
    const ord = l === 1
      ? { name: "zecilor", k: 10 }
      : pick([
          { name: "zecilor", k: 10 },
          { name: "sutelor", k: 100 },
          { name: "miilor", k: 1000 },
        ]);
    let n = l === 1 ? ri(23, 980) : ri(1234, 98765);
    if (n % ord.k === 0) n += ri(1, ord.k - 1);
    const rounded = Math.round(n / ord.k) * ord.k;
    return {
      q: `Rotunjește numărul ${fmt(n)} la ordinul ${ord.name}.`,
      a: String(rounded),
      expl: `Ne uităm la cifra din dreapta ordinului ${ord.name}: dacă e 5 sau mai mare, rotunjim în sus. ${fmt(n)} ≈ ${fmt(rounded)}.`,
    };
  }
  const hi = l === 1 ? 998 : 99998;
  if (v === 2) {
    const n = ri(99, hi);
    return {
      q: `Care este succesorul numărului ${fmt(n)}?`,
      a: String(n + 1),
      expl: `Succesorul = numărul + 1 = ${fmt(n + 1)}.`,
    };
  }
  const n = ri(100, hi + 1);
  return {
    q: `Care este predecesorul numărului ${fmt(n)}?`,
    a: String(n - 1),
    expl: `Predecesorul = numărul − 1 = ${fmt(n - 1)}.`,
  };
};

/* Mersul invers cu fracții, ca subiectul 5 de la examen */
const makeMersInvers = () => {
  const R = ri(8, 40);
  const k = 2 * ri(1, 6);
  const N = 3 * (R + k / 2);
  const scena = pick([
    { loc: "o cofetărie", obiecte: "prăjituri", verb1: "s-au vândut", verb2: "s-a vândut" },
    { loc: "o bibliotecă", obiecte: "cărți pe un raft", verb1: "s-au împrumutat", verb2: "s-a împrumutat" },
    { loc: "un depozit", obiecte: "lăzi cu mere", verb1: "s-au livrat", verb2: "s-a livrat" },
  ]);
  return {
    q: `La ${scena.loc} erau mai multe ${scena.obiecte}. Dimineața ${scena.verb1} o treime din ele și încă ${k}. După-amiaza ${scena.verb2} jumătate din rest. La final au rămas ${R}. Câte erau la început?`,
    a: String(N),
    expl: `Mersul invers: înainte de după-amiază erau ${R} × 2 = ${2 * R} (jumătatea rămasă). Acestea sunt două treimi din total, minus ${k}: două treimi = ${2 * R} + ${k} = ${2 * R + k}, deci o treime = ${(2 * R + k) / 2}, iar totalul = ${(2 * R + k) / 2} × 3 = ${N}. Verificare: ${N} − ${N / 3} − ${k} = ${2 * R}, iar jumătate din ${2 * R} = ${R}. ✓`,
  };
};

const genProbleme = (l) => {
  if (l === 1) {
    if (Math.random() < 0.5) {
      const a = ri(12, 80), b = ri(10, 70);
      return {
        q: `Într-o curte sunt ${a} găini și ${b} rațe. Câte păsări sunt în total?`,
        a: String(a + b),
        expl: `${a} + ${b} = ${a + b} păsări.`,
      };
    }
    const a = ri(30, 90), b = ri(5, a - 5);
    return {
      q: `Mihai avea ${a} lei și a cheltuit ${b} lei. Câți lei i-au rămas?`,
      a: String(a - b),
      expl: `${a} − ${b} = ${a - b} lei.`,
    };
  }
  if (l === 3) return makeMersInvers();
  const v = ri(1, 4);
  if (v === 1) {
    const a = ri(12, 60), k = ri(2, 5);
    return {
      q: `Într-o livadă sunt ${a} meri și de ${k} ori mai mulți pruni. Câți pomi sunt în total în livadă?`,
      a: String(a + a * k),
      expl: `Pruni: ${a} × ${k} = ${a * k}. Total: ${a} + ${a * k} = ${a + a * k} pomi.`,
    };
  }
  if (v === 2) {
    const n = ri(3, 8), p = ri(4, 12);
    const a = n * p + ri(5, 60);
    return {
      q: `Maria are ${a} lei. Cumpără ${n} caiete, fiecare costând ${p} lei. Câți lei îi rămân?`,
      a: String(a - n * p),
      expl: `Caietele costă ${n} × ${p} = ${n * p} lei. Îi rămân ${a} − ${n * p} = ${a - n * p} lei.`,
    };
  }
  if (v === 3) {
    const b = ri(40, 250), d = ri(8, 35);
    return {
      q: `La o școală sunt ${b} băieți și cu ${d} mai puține fete. Câți elevi sunt în total?`,
      a: String(b + (b - d)),
      expl: `Fete: ${b} − ${d} = ${b - d}. Total: ${b} + ${b - d} = ${b + (b - d)} elevi.`,
    };
  }
  const v1 = ri(40, 90), t = ri(2, 6);
  return {
    q: `O mașină parcurge ${v1} km într-o oră. Câți km parcurge în ${t} ore, mergând la fel de repede?`,
    a: String(v1 * t),
    expl: `${v1} km × ${t} = ${v1 * t} km.`,
  };
};

/* ------------------------------------------------------------------ */
/* Capitole                                                            */
/* ------------------------------------------------------------------ */

const TOPICS = [
  { id: "adun", icon: "➕", name: "Adunare și scădere", sub: "numere până la 1.000.000", gen: genAdunareScadere },
  { id: "inmul", icon: "✖️", name: "Înmulțire și împărțire", sub: "cu rest și fără rest", gen: genInmultireImpartire },
  { id: "ordine", icon: "🧮", name: "Ordinea operațiilor", sub: "paranteze rotunde și pătrate", gen: genOrdinea },
  { id: "necun", icon: "❓", name: "Numărul necunoscut", sub: "află-l pe x", gen: genNecunoscut },
  { id: "figur", icon: "📊", name: "Metoda figurativă", sub: "sumă, diferență, raport, consecutive", gen: genFigurativa },
  { id: "fractii", icon: "🍕", name: "Fracții", sub: "compară, adună, află partea", gen: genFractii },
  { id: "unitati", icon: "📏", name: "Unități de măsură", sub: "lungime, masă, timp", gen: genUnitati },
  { id: "geo", icon: "📐", name: "Geometrie", sub: "perimetre", gen: genGeometrie },
  { id: "romane", icon: "🏛️", name: "Numere romane", sub: "de la I la C", gen: genRomane },
  { id: "rotun", icon: "🎯", name: "Rotunjiri și vecini", sub: "succesor, predecesor", gen: genRotunjire },
  { id: "probl", icon: "📖", name: "Probleme", sub: "cu mai multe operații", gen: genProbleme },
];

const LEVELS = [
  { v: 1, name: "Încălzire", hint: "pentru început" },
  { v: 2, name: "Clasa a IV-a", hint: "nivelul programei" },
  { v: 3, name: "Ca la examen", hint: "subiecte grele" },
];

/* ------------------------------------------------------------------ */
/* Varianta tip examen — structura reală a testului CNGL din 2025       */
/* 6 subiecte, 60 de minute, 100 p (10 din oficiu)                      */
/* ------------------------------------------------------------------ */

const makeComparatie = () => {
  let pm = ri(2, 9), ps = ri(3, 12);
  while (ps === pm) ps = ri(3, 12);
  const a = ri(10, 30), b = ri(5, 25);
  const a2 = ri(2, 2 * a - 2);
  const C1 = a * pm + b * ps;
  const C2 = a2 * pm + 2 * b * ps;
  return {
    text: `${a} kg de mere și ${b} kg de struguri costă împreună ${C1} de lei, iar ${a2} kg de mere și ${2 * b} kg de struguri costă împreună ${C2} de lei. Cât costă 1 kg de mere și cât costă 1 kg de struguri?`,
    inputs: [
      { key: "mere", label: "1 kg de mere (lei)", a: String(pm) },
      { key: "strug", label: "1 kg de struguri (lei)", a: String(ps) },
    ],
    expl: `Metoda comparației: dublăm prima cumpărătură → ${2 * a} kg mere și ${2 * b} kg struguri costă ${2 * C1} lei. Scădem a doua cumpărătură (are tot ${2 * b} kg struguri): ${2 * a} − ${a2} = ${2 * a - a2} kg de mere costă ${2 * C1} − ${C2} = ${2 * C1 - C2} lei, deci 1 kg de mere = ${2 * C1 - C2} : ${2 * a - a2} = ${pm} lei. Apoi strugurii: (${C1} − ${a} × ${pm}) : ${b} = ${C1 - a * pm} : ${b} = ${ps} lei.`,
  };
};

const makePerspicacitate = () => {
  if (Math.random() < 0.5) {
    const x = 2 * ri(5, 60) + 1;
    const S = 2 * x + 2;
    return {
      text: `Suma a două numere impare consecutive este ${S}. Care este cel mai mic dintre ele?`,
      inputs: [{ key: "r", label: "numărul mai mic", a: String(x) }],
      expl: `Numerele impare consecutive diferă cu 2. Dacă cel mic este x, atunci x + (x + 2) = ${S}, deci 2 × x = ${S - 2} și x = ${x}. (Numerele: ${x} și ${x + 2}.)`,
    };
  }
  const base = pick([2, 3, 4, 7, 8, 9]);
  const cycles = { 2: [2, 4, 8, 6], 3: [3, 9, 7, 1], 4: [4, 6], 7: [7, 9, 3, 1], 8: [8, 4, 2, 6], 9: [9, 1] };
  const cyc = cycles[base];
  const n = ri(5, 30);
  const ans = cyc[(n - 1) % cyc.length];
  return {
    text: `Care este ultima cifră a numărului ${base} × ${base} × … × ${base} (în care factorul ${base} apare de ${n} ori)?`,
    inputs: [{ key: "r", label: "ultima cifră", a: String(ans) }],
    expl: `Ultimele cifre se repetă în cerc: ${cyc.join(", ")}, … (din ${cyc.length} în ${cyc.length}). Pentru ${n} factori, suntem pe poziția ${((n - 1) % cyc.length) + 1} din cerc, deci ultima cifră este ${ans}.`,
  };
};

const makeVarianta = () => {
  const s1a = makeDivExpr();
  const s1b = makeNested();
  const s2a = makeEq2Step();
  const s2b = makeEq2Step();
  const s3 = makeConsecutive();
  const s4 = makeComparatie();
  const s5 = makeMersInvers();
  const s6 = makePerspicacitate();
  return [
    {
      nr: 1, puncte: 15, titlu: "Calculați:",
      parts: [
        { key: "1a", label: "a)", text: s1a.q, points: 8, a: s1a.a, expl: s1a.expl },
        { key: "1b", label: "b)", text: s1b.q, points: 7, a: s1b.a, expl: s1b.expl },
      ],
    },
    {
      nr: 2, puncte: 15, titlu: "Aflați termenul necunoscut:",
      parts: [
        { key: "2a", label: "a)", text: s2a.q.replace("  Cât este x?", ""), points: 8, a: s2a.a, expl: s2a.expl, inputLabel: "x =" },
        { key: "2b", label: "b)", text: s2b.q.replace("  Cât este x?", ""), points: 7, a: s2b.a, expl: s2b.expl, inputLabel: "x =" },
      ],
    },
    {
      nr: 3, puncte: 20, titlu: "",
      parts: [{ key: "3", label: "", text: s3.q, points: 20, a: s3.a, expl: s3.expl }],
    },
    {
      nr: 4, puncte: 20, titlu: "",
      parts: s4.inputs.map((inp, i) => ({
        key: `4${i}`, label: i === 0 ? "" : null, text: i === 0 ? s4.text : null,
        points: 10, a: inp.a, expl: i === 0 ? s4.expl : null, inputLabel: inp.label,
      })),
    },
    {
      nr: 5, puncte: 15, titlu: "",
      parts: [{ key: "5", label: "", text: s5.q, points: 15, a: s5.a, expl: s5.expl }],
    },
    {
      nr: 6, puncte: 5, titlu: "",
      parts: [{ key: "6", label: "", text: s6.text, points: 5, a: s6.inputs[0].a, expl: s6.expl, inputLabel: s6.inputs[0].label }],
    },
  ];
};

/* ------------------------------------------------------------------ */
/* Stocare                                                             */
/* ------------------------------------------------------------------ */

const emptyProgress = () => ({ perTopic: {}, stars: 0, examHistory: [], level: 2 });

const loadProgress = async () => {
  try {
    if (typeof window !== "undefined" && window.storage) {
      const res = await window.storage.get("mate-progres-v1");
      if (res && res.value) {
        const p = JSON.parse(res.value);
        if (!p.level) p.level = 2;
        return p;
      }
    }
  } catch (e) { /* prima utilizare */ }
  return emptyProgress();
};

const saveProgress = async (p) => {
  try {
    if (typeof window !== "undefined" && window.storage) {
      await window.storage.set("mate-progres-v1", JSON.stringify(p));
    }
  } catch (e) { /* ignoră */ }
};

/* ------------------------------------------------------------------ */
/* Stiluri                                                             */
/* ------------------------------------------------------------------ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700;800&family=Patrick+Hand&display=swap');

:root {
  --paper: #FBF8F0;
  --grid: #DCE6F2;
  --ink: #21385C;
  --ink-soft: #5A6E8C;
  --red-pen: #D6402B;
  --green-pen: #2E8B57;
  --highlight: #FFD23F;
  --card: #FFFFFF;
}

* { box-sizing: border-box; }

.caiet {
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-variant-numeric: tabular-nums;
  color: var(--ink);
  background-color: var(--paper);
  background-image:
    linear-gradient(var(--grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid) 1px, transparent 1px);
  background-size: 26px 26px;
  position: relative;
}
.caiet::before {
  content: "";
  position: fixed;
  top: 0; bottom: 0; left: 34px;
  width: 2px;
  background: rgba(214, 64, 43, 0.45);
  pointer-events: none;
  z-index: 0;
}
.wrap { max-width: 680px; margin: 0 auto; padding: 20px 16px 64px 52px; position: relative; z-index: 1; }

h1, h2, .display { font-family: "Baloo 2", system-ui, sans-serif; }
.hand { font-family: "Patrick Hand", cursive; }

.card {
  background: var(--card);
  border: 2px solid var(--ink);
  border-radius: 14px;
  box-shadow: 4px 4px 0 rgba(33, 56, 92, 0.18);
  padding: 18px;
}

button { font-family: inherit; }
.btn {
  border: 2px solid var(--ink);
  border-radius: 12px;
  background: var(--highlight);
  color: var(--ink);
  font-family: "Baloo 2", system-ui, sans-serif;
  font-weight: 700;
  font-size: 17px;
  padding: 10px 22px;
  cursor: pointer;
  box-shadow: 3px 3px 0 rgba(33, 56, 92, 0.25);
  transition: transform .08s ease, box-shadow .08s ease;
}
.btn:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 rgba(33,56,92,.25); }
.btn:focus-visible, .topic-card:focus-visible, .choice:focus-visible, .pill:focus-visible, input:focus-visible {
  outline: 3px solid var(--red-pen); outline-offset: 2px;
}
.btn.ghost { background: #fff; }
.btn:disabled { opacity: .45; cursor: default; }

.pill {
  border: 2px solid var(--ink);
  border-radius: 999px;
  background: #fff;
  font-family: "Baloo 2", system-ui, sans-serif;
  font-weight: 700;
  font-size: 14px;
  padding: 7px 14px;
  cursor: pointer;
}
.pill.active { background: var(--ink); color: #fff; }

.topic-card {
  display: flex; align-items: center; gap: 12px;
  width: 100%;
  text-align: left;
  background: var(--card);
  border: 2px solid var(--ink);
  border-radius: 14px;
  padding: 12px 14px;
  cursor: pointer;
  box-shadow: 3px 3px 0 rgba(33,56,92,.15);
  transition: transform .08s ease;
}
.topic-card:active { transform: translate(2px,2px); box-shadow: 1px 1px 0 rgba(33,56,92,.15); }

.answer-input {
  font-family: "Baloo 2", system-ui, sans-serif;
  font-size: 26px;
  font-weight: 700;
  color: var(--ink);
  border: none;
  border-bottom: 3px solid var(--ink);
  background: transparent;
  width: 100%;
  max-width: 260px;
  padding: 4px 8px;
  text-align: center;
}
.answer-input:focus { outline: none; border-bottom-color: var(--red-pen); }
.answer-input.small { font-size: 20px; max-width: 180px; text-align: left; }

.choice {
  font-family: "Baloo 2", system-ui, sans-serif;
  font-size: 22px; font-weight: 700;
  border: 2px solid var(--ink);
  border-radius: 12px;
  background: #fff;
  padding: 12px 28px;
  cursor: pointer;
  box-shadow: 3px 3px 0 rgba(33,56,92,.2);
}

.verdict { animation: pop .25s ease; }
@keyframes pop { from { transform: scale(.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .verdict { animation: none; }
  .btn, .topic-card { transition: none; }
}

.bar { height: 8px; border-radius: 6px; background: #E8E3D6; overflow: hidden; }
.bar > div { height: 100%; background: var(--green-pen); border-radius: 6px; }

.timer-strip {
  position: sticky; top: 0; z-index: 5;
  background: var(--paper);
  border-bottom: 2px solid var(--ink);
  margin: -20px -16px 16px -52px;
  padding: 10px 16px 10px 52px;
  display: flex; justify-content: space-between; align-items: center;
}

.expl-box {
  margin-top: 10px;
  background: #FFF8DE;
  border: 1.5px dashed var(--ink-soft);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 15px;
  line-height: 1.5;
}
`;

/* ------------------------------------------------------------------ */
/* Componente mici                                                     */
/* ------------------------------------------------------------------ */

const Verdict = ({ ok, correct }) => (
  <div className="verdict" style={{ marginTop: 14 }}>
    <div
      className="hand"
      style={{
        fontSize: 30,
        color: ok ? "var(--green-pen)" : "var(--red-pen)",
        transform: "rotate(-2deg)",
      }}
    >
      {ok ? "✓ Corect! Bravo!" : `✗ Răspunsul corect: ${correct}`}
    </div>
  </div>
);

const Stars = ({ n }) => (
  <span className="display" style={{ fontWeight: 800, fontSize: 18 }}>⭐ {n}</span>
);

const mmss = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/* ------------------------------------------------------------------ */
/* Cardul de exercițiu (antrenament și simulare rapidă)                 */
/* ------------------------------------------------------------------ */

const QuestionCard = ({ topic, question, onAnswer, feedback, hideExpl }) => {
  const [input, setInput] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    setInput("");
    if (inputRef.current) inputRef.current.focus();
  }, [question]);

  const submit = () => {
    if (feedback) return;
    if (!question.choices && input.trim() === "") return;
    onAnswer(input);
  };

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 20 }}>{topic.icon}</span>
        <span className="display" style={{ fontWeight: 700, fontSize: 15, color: "var(--ink-soft)" }}>
          {topic.name}
        </span>
      </div>

      <div style={{ fontSize: 21, lineHeight: 1.45, fontWeight: 600 }}>{question.q}</div>

      {question.choices ? (
        <div style={{ display: "flex", gap: 14, marginTop: 18, flexWrap: "wrap" }}>
          {question.choices.map((c) => (
            <button
              key={c}
              className="choice"
              disabled={!!feedback}
              onClick={() => !feedback && onAnswer(c)}
              style={
                feedback && c === question.a
                  ? { borderColor: "var(--green-pen)", background: "#EAF6EF" }
                  : undefined
              }
            >
              {c}
            </button>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", gap: 12, marginTop: 18, alignItems: "flex-end", flexWrap: "wrap" }}>
          <input
            ref={inputRef}
            className="answer-input"
            value={input}
            inputMode={topic.id === "romane" || topic.id === "fractii" ? "text" : "numeric"}
            placeholder="răspunsul tău"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            disabled={!!feedback}
            aria-label="Răspunsul tău"
          />
          {!feedback && (
            <button className="btn" onClick={submit}>Verifică</button>
          )}
        </div>
      )}

      {feedback && (
        <>
          <Verdict ok={feedback.ok} correct={question.a} />
          {!hideExpl && <div className="expl-box">💡 {question.expl}</div>}
        </>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Aplicația                                                           */
/* ------------------------------------------------------------------ */

const QUICK_QUESTIONS = 9;
const QUICK_SECONDS = 20 * 60;
const VARIANTA_SECONDS = 60 * 60;

export default function MatePentruLazar() {
  const [screen, setScreen] = useState("home");
  const [progress, setProgress] = useState(emptyProgress());
  const [loaded, setLoaded] = useState(false);

  // antrenament
  const [topic, setTopic] = useState(null);
  const [question, setQuestion] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [streak, setStreak] = useState(0);
  const [session, setSession] = useState({ ok: 0, total: 0 });

  // simulare rapidă
  const [quickQs, setQuickQs] = useState([]);
  const [quickIdx, setQuickIdx] = useState(0);
  const [quickOk, setQuickOk] = useState(0);
  const [quickLeft, setQuickLeft] = useState(QUICK_SECONDS);
  const [lastNota, setLastNota] = useState(null);
  const quickOkRef = useRef(0);
  const timerRef = useRef(null);

  // varianta tip examen
  const [varianta, setVarianta] = useState(null);
  const [varAnswers, setVarAnswers] = useState({});
  const [varLeft, setVarLeft] = useState(VARIANTA_SECONDS);
  const [varResult, setVarResult] = useState(null);
  const varTimerRef = useRef(null);
  const varAnswersRef = useRef({});

  useEffect(() => {
    loadProgress().then((p) => { setProgress(p); setLoaded(true); });
  }, []);

  useEffect(() => { varAnswersRef.current = varAnswers; }, [varAnswers]);
  useEffect(() => { quickOkRef.current = quickOk; }, [quickOk]);

  const updateProgress = useCallback((fn) => {
    setProgress((prev) => {
      const next = fn(structuredClone(prev));
      saveProgress(next);
      return next;
    });
  }, []);

  const level = progress.level || 2;
  const setLevel = (v) => updateProgress((p) => { p.level = v; return p; });

  const recordAnswer = (topicId, ok) => {
    updateProgress((p) => {
      const t = p.perTopic[topicId] || { ok: 0, total: 0 };
      t.total += 1;
      if (ok) { t.ok += 1; p.stars += 1; }
      p.perTopic[topicId] = t;
      return p;
    });
  };

  /* ---------------- antrenament ---------------- */

  const startPractice = (t) => {
    setTopic(t);
    setQuestion(t.gen(level));
    setFeedback(null);
    setStreak(0);
    setSession({ ok: 0, total: 0 });
    setScreen("practice");
  };

  const answerPractice = (input) => {
    const ok = checkAnswer(input, question.a);
    setFeedback({ ok });
    setStreak((s) => (ok ? s + 1 : 0));
    setSession((s) => ({ ok: s.ok + (ok ? 1 : 0), total: s.total + 1 }));
    recordAnswer(topic.id, ok);
  };

  const nextPractice = () => {
    setQuestion(topic.gen(level));
    setFeedback(null);
  };

  /* ---------------- simulare rapidă ---------------- */

  const startQuick = () => {
    const shuffled = [...TOPICS].sort(() => Math.random() - 0.5).slice(0, QUICK_QUESTIONS);
    setQuickQs(shuffled.map((t) => ({ topic: t, q: t.gen(level) })));
    setQuickIdx(0);
    setQuickOk(0);
    setQuickLeft(QUICK_SECONDS);
    setFeedback(null);
    setScreen("quick");
  };

  useEffect(() => {
    if (screen !== "quick") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setQuickLeft((s) => {
        if (s <= 1) { clearInterval(timerRef.current); finishQuick(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  const finishQuick = (finalOk) => {
    const ok = typeof finalOk === "number" ? finalOk : quickOkRef.current;
    const punctaj = ok * 10 + 10;
    const nota = punctaj / 10;
    setLastNota({ nota, ok, punctaj });
    updateProgress((p) => {
      p.examHistory.push({ date: new Date().toISOString().slice(0, 10), nota, tip: "rapid" });
      if (p.examHistory.length > 40) p.examHistory = p.examHistory.slice(-40);
      return p;
    });
    setScreen("quickResult");
  };

  const answerQuick = (input) => {
    const current = quickQs[quickIdx];
    const ok = checkAnswer(input, current.q.a);
    setFeedback({ ok });
    recordAnswer(current.topic.id, ok);
    if (ok) setQuickOk((n) => n + 1);
  };

  const nextQuick = () => {
    if (quickIdx + 1 >= quickQs.length) {
      finishQuick();
    } else {
      setQuickIdx((i) => i + 1);
      setFeedback(null);
    }
  };

  /* ---------------- varianta tip examen ---------------- */

  const startVarianta = () => {
    setVarianta(makeVarianta());
    setVarAnswers({});
    setVarLeft(VARIANTA_SECONDS);
    setVarResult(null);
    setScreen("varianta");
  };

  const gradeVarianta = useCallback((subiecte, answers) => {
    let total = 10; // din oficiu
    const detalii = subiecte.map((s) => {
      const parts = s.parts.map((part) => {
        const ok = checkAnswer(answers[part.key], part.a);
        if (ok) total += part.points;
        return { ...part, ok, dat: answers[part.key] ?? "" };
      });
      return { ...s, parts };
    });
    return { detalii, punctaj: total, nota: total / 10 };
  }, []);

  const finishVarianta = useCallback(() => {
    setVarianta((v) => {
      if (!v) return v;
      const res = gradeVarianta(v, varAnswersRef.current);
      setVarResult(res);
      updateProgress((p) => {
        p.examHistory.push({ date: new Date().toISOString().slice(0, 10), nota: res.nota, tip: "varianta" });
        if (p.examHistory.length > 40) p.examHistory = p.examHistory.slice(-40);
        return p;
      });
      setScreen("variantaResult");
      return v;
    });
  }, [gradeVarianta, updateProgress]);

  useEffect(() => {
    if (screen !== "varianta") {
      if (varTimerRef.current) clearInterval(varTimerRef.current);
      return;
    }
    varTimerRef.current = setInterval(() => {
      setVarLeft((s) => {
        if (s <= 1) { clearInterval(varTimerRef.current); finishVarianta(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(varTimerRef.current);
  }, [screen, finishVarianta]);

  /* ---------------- date derivate ---------------- */

  const bestVarianta = progress.examHistory.filter((e) => e.tip === "varianta");
  const bestNotaVar = bestVarianta.length ? Math.max(...bestVarianta.map((e) => e.nota)) : null;
  const completate = varianta
    ? varianta.reduce((n, s) => n + s.parts.filter((p) => (varAnswers[p.key] ?? "").trim() !== "").length, 0)
    : 0;
  const totalParts = varianta ? varianta.reduce((n, s) => n + s.parts.length, 0) : 0;

  /* ---------------- randare ---------------- */

  return (
    <div className="caiet">
      <style>{CSS}</style>
      <div className="wrap">
        {/* ----------------------------- ACASĂ ----------------------------- */}
        {screen === "home" && (
          <>
            <header style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <h1 style={{ fontSize: 30, margin: 0, fontWeight: 800 }}>Spre clasa a V‑a</h1>
                <Stars n={progress.stars} />
              </div>
              <p className="hand" style={{ fontSize: 21, color: "var(--ink-soft)", margin: "4px 0 0", transform: "rotate(-1deg)" }}>
                caietul meu de pregătire pentru Lazăr ✏️
              </p>
            </header>

            <div className="card" style={{ padding: 14, marginBottom: 14, background: "#FFFDF6" }}>
              <div className="display" style={{ fontWeight: 800, fontSize: 15, marginBottom: 8 }}>Nivel de dificultate</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {LEVELS.map((lv) => (
                  <button
                    key={lv.v}
                    className={`pill${level === lv.v ? " active" : ""}`}
                    onClick={() => setLevel(lv.v)}
                  >
                    {lv.name}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "8px 0 0" }}>
                {LEVELS.find((lv) => lv.v === level)?.hint} — se aplică la antrenament și la simularea rapidă.
              </p>
            </div>

            <button
              className="btn"
              style={{ width: "100%", fontSize: 18, padding: "14px 22px", marginBottom: 8 }}
              onClick={startVarianta}
            >
              📜 Variantă tip examen — 6 subiecte, 60 de minute
            </button>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 14px", textAlign: "center" }}>
              Construită după structura testului real de la Lazăr Sibiu (2025): calcule cu paranteze,
              termen necunoscut, numere consecutive, metoda comparației, mersul invers, perspicacitate.
              {bestNotaVar != null && <> Cea mai bună notă: <b>{bestNotaVar.toFixed(1)}</b> 🎉</>}
            </p>

            <button
              className="btn ghost"
              style={{ width: "100%", fontSize: 16, padding: "12px 22px", marginBottom: 18 }}
              onClick={startQuick}
            >
              ⚡ Simulare rapidă — {QUICK_QUESTIONS} întrebări, 20 de minute
            </button>

            <h2 style={{ fontSize: 20, margin: "0 0 10px", fontWeight: 800 }}>Capitole de antrenament</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {TOPICS.map((t) => {
                const st = progress.perTopic[t.id];
                const pct = st && st.total > 0 ? Math.round((st.ok / st.total) * 100) : null;
                return (
                  <button key={t.id} className="topic-card" onClick={() => startPractice(t)}>
                    <span style={{ fontSize: 26 }}>{t.icon}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span className="display" style={{ display: "block", fontWeight: 700, fontSize: 16.5 }}>
                        {t.name}
                      </span>
                      <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>{t.sub}</span>
                      {st && st.total > 0 && (
                        <span style={{ display: "block", marginTop: 6 }}>
                          <span className="bar"><div style={{ width: `${pct}%` }} /></span>
                        </span>
                      )}
                    </span>
                    <span className="hand" style={{ fontSize: 17, color: "var(--green-pen)", whiteSpace: "nowrap" }}>
                      {st && st.total > 0 ? `${st.ok}/${st.total}` : "nou"}
                    </span>
                  </button>
                );
              })}
            </div>
            {!loaded && (
              <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 14 }}>Se încarcă progresul…</p>
            )}
          </>
        )}

        {/* -------------------------- ANTRENAMENT -------------------------- */}
        {screen === "practice" && topic && question && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <button className="btn ghost" style={{ fontSize: 14, padding: "6px 14px" }} onClick={() => setScreen("home")}>
                ← Înapoi
              </button>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                {streak >= 3 && (
                  <span className="hand" style={{ fontSize: 19, color: "var(--red-pen)" }}>🔥 {streak} la rând!</span>
                )}
                <span className="display" style={{ fontWeight: 700, fontSize: 15 }}>
                  {session.ok}/{session.total} corecte
                </span>
              </div>
            </div>

            <QuestionCard topic={topic} question={question} onAnswer={answerPractice} feedback={feedback} />

            {feedback && (
              <div style={{ marginTop: 16, textAlign: "center" }}>
                <button className="btn" onClick={nextPractice}>Următorul exercițiu →</button>
              </div>
            )}
          </>
        )}

        {/* ------------------------ SIMULARE RAPIDĂ ------------------------ */}
        {screen === "quick" && quickQs.length > 0 && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span className="display" style={{ fontWeight: 800, fontSize: 17 }}>
                Întrebarea {quickIdx + 1} din {quickQs.length}
              </span>
              <span
                className="display"
                style={{ fontWeight: 800, fontSize: 18, color: quickLeft < 120 ? "var(--red-pen)" : "var(--ink)" }}
                aria-live="polite"
              >
                ⏱ {mmss(quickLeft)}
              </span>
            </div>

            <QuestionCard
              topic={quickQs[quickIdx].topic}
              question={quickQs[quickIdx].q}
              onAnswer={answerQuick}
              feedback={feedback}
              hideExpl
            />

            {feedback && (
              <div style={{ marginTop: 16, textAlign: "center" }}>
                <button className="btn" onClick={nextQuick}>
                  {quickIdx + 1 >= quickQs.length ? "Vezi nota →" : "Întrebarea următoare →"}
                </button>
              </div>
            )}
          </>
        )}

        {/* ----------------------- REZULTAT RAPID ----------------------- */}
        {screen === "quickResult" && lastNota && (
          <div className="card" style={{ textAlign: "center", padding: 28 }}>
            <p className="hand" style={{ fontSize: 22, color: "var(--ink-soft)", margin: 0 }}>lucrare corectată ✍️</p>
            <div className="hand" style={{ fontSize: 84, color: "var(--red-pen)", lineHeight: 1.1, transform: "rotate(-3deg)" }}>
              {lastNota.nota.toFixed(0)}
            </div>
            <p style={{ fontSize: 17, margin: "6px 0 2px" }}>
              {lastNota.ok} din {QUICK_QUESTIONS} întrebări corecte → {lastNota.punctaj} de puncte
            </p>
            <p style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: "0 0 18px" }}>
              ({lastNota.ok} × 10 puncte + 10 din oficiu)
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn" onClick={startQuick}>Încă o simulare</button>
              <button className="btn ghost" onClick={() => setScreen("home")}>Înapoi la capitole</button>
            </div>
          </div>
        )}

        {/* ----------------------- VARIANTA TIP EXAMEN ----------------------- */}
        {screen === "varianta" && varianta && (
          <>
            <div className="timer-strip">
              <span className="display" style={{ fontWeight: 800, fontSize: 15 }}>
                Test de departajare · completat {completate}/{totalParts}
              </span>
              <span
                className="display"
                style={{ fontWeight: 800, fontSize: 18, color: varLeft < 300 ? "var(--red-pen)" : "var(--ink)" }}
                aria-live="polite"
              >
                ⏱ {mmss(varLeft)}
              </span>
            </div>

            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div className="display" style={{ fontWeight: 800, fontSize: 20 }}>TEST DE DEPARTAJARE — Matematică</div>
              <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                Toate subiectele sunt obligatorii · Se acordă 10 puncte din oficiu · Timp de lucru: 60 de minute
              </div>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              {varianta.map((s) => (
                <div className="card" key={s.nr}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span className="display" style={{ fontWeight: 800, fontSize: 16 }}>
                      Subiectul {s.nr}.{s.titlu ? ` ${s.titlu}` : ""}
                    </span>
                    <span className="hand" style={{ fontSize: 17, color: "var(--ink-soft)" }}>({s.puncte} p)</span>
                  </div>
                  {s.parts.map((part) => (
                    <div key={part.key} style={{ marginBottom: 12 }}>
                      {part.text && (
                        <div style={{ fontSize: 17.5, lineHeight: 1.5, fontWeight: 600, marginBottom: 8 }}>
                          {part.label ? <b>{part.label} </b> : null}
                          {part.text}
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                        {part.inputLabel && (
                          <span style={{ fontSize: 15, color: "var(--ink-soft)", whiteSpace: "nowrap" }}>{part.inputLabel}</span>
                        )}
                        <input
                          className="answer-input small"
                          value={varAnswers[part.key] ?? ""}
                          inputMode="numeric"
                          placeholder="…"
                          onChange={(e) => setVarAnswers((a) => ({ ...a, [part.key]: e.target.value }))}
                          aria-label={`Răspuns subiectul ${s.nr} ${part.label || part.inputLabel || ""}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 18, textAlign: "center" }}>
              <button className="btn" style={{ fontSize: 18, padding: "12px 30px" }} onClick={finishVarianta}>
                ✍️ Predă lucrarea
              </button>
              <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 8 }}>
                Lucrarea se predă automat când expiră timpul.
              </p>
            </div>
          </>
        )}

        {/* ----------------------- REZULTAT VARIANTĂ ----------------------- */}
        {screen === "variantaResult" && varResult && (
          <>
            <div className="card" style={{ textAlign: "center", padding: 24, marginBottom: 16 }}>
              <p className="hand" style={{ fontSize: 22, color: "var(--ink-soft)", margin: 0 }}>lucrare corectată ✍️</p>
              <div className="hand" style={{ fontSize: 84, color: "var(--red-pen)", lineHeight: 1.1, transform: "rotate(-3deg)" }}>
                {varResult.nota.toFixed(varResult.nota % 1 === 0 ? 0 : 1)}
              </div>
              <p style={{ fontSize: 16, margin: "4px 0 0" }}>{varResult.punctaj} de puncte din 100 (cu 10 din oficiu)</p>
              <p className="hand" style={{ fontSize: 22, margin: "10px 0 0", color: varResult.nota >= 9 ? "var(--green-pen)" : "var(--ink)" }}>
                {varResult.nota >= 9
                  ? "Notă de admitere la Lazăr! 🏆"
                  : varResult.nota >= 7
                  ? "Foarte aproape! Uită-te la barem mai jos. 💪"
                  : varResult.nota >= 5
                  ? "Ai promovat testul! Mai exersăm subiectele grele. 📚"
                  : "Nu-i nimic — baremul de mai jos îți arată exact pașii. 🌱"}
              </p>
            </div>

            <h2 style={{ fontSize: 19, margin: "0 0 10px", fontWeight: 800 }}>Barem de corectare</h2>
            <div style={{ display: "grid", gap: 12 }}>
              {varResult.detalii.map((s) => (
                <div className="card" key={s.nr} style={{ padding: 14 }}>
                  <div className="display" style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>
                    Subiectul {s.nr} — {s.parts.reduce((n, p) => n + (p.ok ? p.points : 0), 0)}/{s.puncte} p
                  </div>
                  {s.parts.map((part) => (
                    <div key={part.key} style={{ marginBottom: 8 }}>
                      {part.text && <div style={{ fontSize: 14.5, color: "var(--ink-soft)", marginBottom: 4 }}>{part.label} {part.text}</div>}
                      <div className="hand" style={{ fontSize: 19, color: part.ok ? "var(--green-pen)" : "var(--red-pen)" }}>
                        {part.ok
                          ? `✓ ${part.dat} — corect (+${part.points} p)`
                          : `✗ ${part.dat ? `ai scris ${part.dat}` : "fără răspuns"} · corect: ${part.a}`}
                      </div>
                      {!part.ok && part.expl && <div className="expl-box">💡 {part.expl}</div>}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 18, flexWrap: "wrap" }}>
              <button className="btn" onClick={startVarianta}>Altă variantă</button>
              <button className="btn ghost" onClick={() => setScreen("home")}>Înapoi la capitole</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
