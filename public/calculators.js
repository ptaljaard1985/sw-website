/* ============================================================
   Simple Wealth public calculators
   - The maths is pure (no DOM access) and is tested from Node
     in tests/calculators.test.mjs.
   - Nothing a visitor types leaves the browser: no network
     calls, no storage, no cookies.
   - The withdrawal table is shared with the meeting tools in
     the CRM repo and must match them.
   ============================================================ */
(function (root) {
  'use strict';

  /* ---------- Constants ---------- */

  // Assumed inflation, shared by every calculator. Not a visitor input.
  var INFLATION = 0.05;

  // Withdrawal rate (percent a year) by age at retirement.
  var WITHDRAWAL_RATES = {
    55: 4.2, 56: 4.3, 57: 4.3, 58: 4.4, 59: 4.4, 60: 4.5, 61: 4.6, 62: 4.6,
    63: 4.7, 64: 4.7, 65: 4.8, 66: 4.9, 67: 5.0, 68: 5.1, 69: 5.2, 70: 5.3,
    71: 5.5, 72: 5.7, 73: 5.8, 74: 6.0, 75: 6.2, 76: 6.5, 77: 6.7, 78: 7.0,
    79: 7.2, 80: 7.5, 81: 8.0, 82: 8.5, 83: 9.0, 84: 9.5, 85: 10.0, 86: 10.7,
    87: 11.4, 88: 12.1, 89: 12.8, 90: 13.5, 91: 14.4, 92: 15.3, 93: 16.2,
    94: 17.1, 95: 18.0, 96: 19.4, 97: 20.8, 98: 22.2, 99: 23.6, 100: 25.0
  };

  /* ---------- Pure maths ---------- */

  // Percent a year for a given retirement age.
  function withdrawalRate(age) {
    var a = Math.round(age);
    if (a < 55) return Math.max(3.5, 4.2 - 0.1 * (55 - a));
    if (a > 100) return 25.0;
    return WITHDRAWAL_RATES[a];
  }

  // Savings grow monthly; the monthly saving rises with inflation once a year.
  // Returns the nominal balance after each whole year (index 0 = today).
  function balancesByYear(savings, monthlySaving, growth, years) {
    var rMonth = Math.pow(1 + growth, 1 / 12) - 1;
    var balance = savings;
    var contrib = monthlySaving;
    var out = [balance];
    for (var y = 1; y <= years; y++) {
      for (var m = 0; m < 12; m++) balance = balance * (1 + rMonth) + contrib;
      contrib = contrib * (1 + INFLATION);
      out.push(balance);
    }
    return out;
  }

  // input: { age, retirementAge, savings, monthlySaving, extraReturn }
  // extraReturn is the slider value as a fraction (0 to 0.05).
  function projectSavings(input) {
    var years = Math.max(1, input.retirementAge - input.age);
    var growth = INFLATION + (input.extraReturn || 0);
    var balances = balancesByYear(input.savings || 0, input.monthlySaving || 0, growth, years);
    var capitalToday = balances[years] / Math.pow(1 + INFLATION, years);
    var rate = withdrawalRate(input.retirementAge);
    return {
      years: years,
      rate: rate,
      capitalToday: capitalToday,
      monthlyIncome: capitalToday * rate / 100 / 12
    };
  }

  // Monthly income for every retirement age from 55 (or age + 1 if higher) to 75.
  function incomeByRetirementAge(input) {
    var from = Math.max(55, input.age + 1);
    var out = [];
    for (var a = from; a <= 75; a++) {
      var r = projectSavings({
        age: input.age, retirementAge: a, savings: input.savings,
        monthlySaving: input.monthlySaving, extraReturn: input.extraReturn
      });
      out.push({ age: a, value: r.monthlyIncome });
    }
    return out;
  }

  // Savings in today's money at each age from now to the planned retirement age.
  function savingsOverTime(input) {
    var years = Math.max(1, input.retirementAge - input.age);
    var growth = INFLATION + (input.extraReturn || 0);
    var balances = balancesByYear(input.savings || 0, input.monthlySaving || 0, growth, years);
    return balances.map(function (b, y) {
      return { age: input.age + y, value: b / Math.pow(1 + INFLATION, y) };
    });
  }

  // How to reach a monthly income goal: more saving, or a later retirement age.
  function closeGap(input, goal) {
    function incomeAt(saving, retirementAge) {
      return projectSavings({
        age: input.age, retirementAge: retirementAge, savings: input.savings,
        monthlySaving: saving, extraReturn: input.extraReturn
      }).monthlyIncome;
    }
    var current = input.monthlySaving || 0;
    var base = incomeAt(0, input.retirementAge);
    var perThousand = incomeAt(1000, input.retirementAge) - base;
    var now = incomeAt(current, input.retirementAge);
    var savingNeeded = perThousand > 0 ? Math.max(0, (goal - base) / perThousand * 1000) : null;
    var extra = savingNeeded === null ? null : Math.max(0, savingNeeded - current);

    // First retirement age (from the planned age up to 75) that reaches the goal on the current saving.
    var firstAge = null;
    for (var a = input.retirementAge; a <= 75; a++) {
      if (incomeAt(current, a) >= goal) { firstAge = a; break; }
    }
    return {
      income: now,
      met: now >= goal,
      perThousand: perThousand,
      savingNeeded: savingNeeded,
      extra: extra,
      extraDisplay: extra === null ? null : Math.ceil(extra / 100) * 100,
      firstAge: firstAge
    };
  }

  /* ---------- Formatting and parsing (pure) ---------- */

  function roundTo(n, step) {
    return Math.round(n / step) * step;
  }

  // 1500000 -> "1 500 000" (non-breaking spaces so a figure never wraps)
  function groupThousands(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  function formatRand(n) {
    return (n < 0 ? '-R' : 'R') + groupThousands(Math.abs(n));
  }

  // Short axis labels: R20k, R1.2m
  function formatRandShort(n) {
    if (n >= 1e6) return 'R' + (Math.round(n / 1e5) / 10).toString() + 'm';
    if (n >= 1e3) return 'R' + Math.round(n / 1e3) + 'k';
    return 'R' + Math.round(n);
  }

  // "R1 500 000", "1,500,000", "1500000.75" -> 1500000. Empty or no digits -> null.
  function parseRand(text) {
    if (text === null || text === undefined) return null;
    var whole = String(text).replace(/[\s ,Rr]/g, '').split('.')[0].replace(/\D/g, '');
    if (whole === '') return null;
    return parseInt(whole, 10);
  }

  // Slider value in percent (0 to 5) -> words
  function returnInWords(percent) {
    if (!percent) return 'Inflation only';
    return 'Inflation plus ' + percent + '% a year';
  }

  // A tidy step for axis gridlines.
  function niceStep(max, targetLines) {
    if (max <= 0) return 1;
    var raw = max / targetLines;
    var pow = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
    var n = raw / pow;
    var nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
    return nice * pow;
  }

  var api = {
    INFLATION: INFLATION,
    WITHDRAWAL_RATES: WITHDRAWAL_RATES,
    withdrawalRate: withdrawalRate,
    projectSavings: projectSavings,
    incomeByRetirementAge: incomeByRetirementAge,
    savingsOverTime: savingsOverTime,
    closeGap: closeGap,
    roundTo: roundTo,
    formatRand: formatRand,
    formatRandShort: formatRandShort,
    parseRand: parseRand,
    returnInWords: returnInWords,
    niceStep: niceStep
  };

  /* ---------- Browser helpers (DOM) ---------- */

  if (typeof document !== 'undefined') {
    var SVG_NS = 'http://www.w3.org/2000/svg';

    function el(name, attrs, text) {
      var node = document.createElementNS(SVG_NS, name);
      for (var k in attrs) node.setAttribute(k, attrs[k]);
      if (text !== undefined) node.textContent = text;
      return node;
    }

    // Rand text input: formats with spaces while typing, keeps the caret in place.
    api.bindRandInput = function (input, onChange) {
      function reformat() {
        var before = input.value;
        var caret = input.selectionStart === null ? before.length : input.selectionStart;
        var digitsBeforeCaret = before.slice(0, caret).replace(/\D/g, '').length;
        var value = parseRand(before);
        var formatted = value === null ? '' : groupThousands(value).replace(/ /g, ' ');
        if (formatted !== before) {
          input.value = formatted;
          var pos = 0, seen = 0;
          while (pos < formatted.length && seen < digitsBeforeCaret) {
            if (/\d/.test(formatted.charAt(pos))) seen++;
            pos++;
          }
          try { input.setSelectionRange(pos, pos); } catch (e) { /* not focusable yet */ }
        }
        if (onChange) onChange();
      }
      input.addEventListener('input', reformat);
    };

    // Expected return slider: keeps its label and aria-valuetext in step.
    api.bindReturnSlider = function (slider, label, onChange) {
      function sync() {
        var words = returnInWords(parseFloat(slider.value));
        slider.setAttribute('aria-valuetext', words);
        if (label) label.textContent = words;
        if (onChange) onChange();
      }
      slider.addEventListener('input', sync);
      sync();
    };

    // Eases a figure to its new value over about 200ms (off under reduced motion).
    api.easeNumber = function (node, to, format) {
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var from = typeof node._swValue === 'number' ? node._swValue : to;
      node._swValue = to;
      if (node._swFrame) cancelAnimationFrame(node._swFrame);
      if (reduce || from === to) { node.textContent = format(to); return; }
      var start = null;
      function step(t) {
        if (start === null) start = t;
        var p = Math.min(1, (t - start) / 200);
        var eased = 1 - Math.pow(1 - p, 3);
        node.textContent = format(from + (to - from) * eased);
        if (p < 1) node._swFrame = requestAnimationFrame(step);
      }
      node._swFrame = requestAnimationFrame(step);
    };

    /* Line chart with a soft area fill, drawn as inline SVG at the container's own
       width so the text stays a readable size on a phone.
       config: {
         points: [{ age, value }],
         valueLabel(value) -> text for the hover note,
         marker: { age, label }            (optional, the highlighted point)
         goal:   { value, label }          (optional, dashed horizontal line)
         title:  text for the SVG's accessible name
       } */
    api.drawChart = function (container, config) {
      var width = Math.max(280, container.clientWidth || 600);
      var height = Math.round(Math.min(380, Math.max(260, width * 0.56)));
      var pad = { top: 34, right: 18, bottom: 34, left: 52 };
      var pts = config.points;
      var w = width - pad.left - pad.right;
      var h = height - pad.top - pad.bottom;

      var maxValue = 0;
      pts.forEach(function (p) { if (p.value > maxValue) maxValue = p.value; });
      if (config.goal && config.goal.value > maxValue) maxValue = config.goal.value;
      if (maxValue <= 0) maxValue = 1;
      var step = niceStep(maxValue * 1.08, 4);
      var top = Math.ceil(maxValue * 1.08 / step) * step;

      var minAge = pts[0].age;
      var maxAge = pts[pts.length - 1].age;
      var span = Math.max(1, maxAge - minAge);
      function x(age) { return pad.left + (age - minAge) / span * w; }
      function y(value) { return pad.top + h - value / top * h; }

      var svg = el('svg', {
        viewBox: '0 0 ' + width + ' ' + height, width: width, height: height,
        role: 'img', 'aria-label': config.title || 'Chart', 'class': 'calc-chart__svg'
      });

      // Gridlines and rand labels
      for (var v = 0; v <= top + step / 2; v += step) {
        var gy = y(v);
        svg.appendChild(el('line', {
          x1: pad.left, x2: width - pad.right, y1: gy, y2: gy,
          'class': v === 0 ? 'calc-chart__baseline' : 'calc-chart__grid'
        }));
        svg.appendChild(el('text', {
          x: pad.left - 8, y: gy + 4, 'text-anchor': 'end', 'class': 'calc-chart__axis'
        }, formatRandShort(v)));
      }

      // Age labels: aim for about six along the bottom
      var every = span <= 6 ? 1 : span <= 12 ? 2 : span <= 30 ? 5 : 10;
      pts.forEach(function (p) {
        var isEnd = p.age === minAge || p.age === maxAge;
        var onStep = p.age % every === 0;
        var crowdsEnd = !isEnd && (p.age - minAge < every / 2 || maxAge - p.age < every / 2);
        if ((onStep || isEnd) && !crowdsEnd) {
          svg.appendChild(el('text', {
            x: x(p.age), y: height - pad.bottom + 20, 'text-anchor': 'middle', 'class': 'calc-chart__axis'
          }, String(p.age)));
        }
      });

      // Area and line
      var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + x(p.age).toFixed(1) + ' ' + y(p.value).toFixed(1); }).join(' ');
      var area = line + ' L' + x(maxAge).toFixed(1) + ' ' + y(0).toFixed(1) + ' L' + x(minAge).toFixed(1) + ' ' + y(0).toFixed(1) + ' Z';
      svg.appendChild(el('path', { d: area, 'class': 'calc-chart__area' }));
      svg.appendChild(el('path', { d: line, 'class': 'calc-chart__line' }));

      // Goal line
      if (config.goal) {
        var goalY = y(config.goal.value);
        svg.appendChild(el('line', {
          x1: pad.left, x2: width - pad.right, y1: goalY, y2: goalY, 'class': 'calc-chart__goal'
        }));
        // label at the left end, where a rising line is furthest below the goal
        svg.appendChild(el('text', {
          x: pad.left + 6, y: goalY - 7, 'text-anchor': 'start', 'class': 'calc-chart__goal-label'
        }, config.goal.label));
      }

      // Highlighted point
      if (config.marker) {
        var mp = null;
        pts.forEach(function (p) { if (p.age === config.marker.age) mp = p; });
        if (mp) {
          var mx = x(mp.age), my = y(mp.value);
          svg.appendChild(el('circle', { cx: mx, cy: my, r: 6.5, 'class': 'calc-chart__marker' }));
          // Above and to the left of the point keeps the label clear of a rising line.
          // Near the left edge there is no room, so it goes below and to the right, over the area fill.
          var nearLeft = mx < pad.left + w * 0.34;
          var anchor = nearLeft ? 'start' : 'end';
          var lx = nearLeft ? mx + 10 : mx - 8;
          var ly = nearLeft ? my + 28 : my - 14;
          if (config.marker.below) { anchor = 'end'; lx = mx - 8; ly = my + 28; }
          if (ly < 16) ly = my + 28;
          if (ly > pad.top + h - 6) ly = my - 14;
          svg.appendChild(el('text', {
            x: lx, y: ly, 'text-anchor': anchor, 'class': 'calc-chart__marker-label'
          }, config.marker.label));
        }
      }

      // Hover and tap: one band per point, a dot and a note
      var note = el('g', { 'class': 'calc-chart__note', visibility: 'hidden' });
      var noteDot = el('circle', { r: 4.5, 'class': 'calc-chart__note-dot' });
      var noteBox = el('rect', { rx: 3, ry: 3, height: 26, 'class': 'calc-chart__note-box' });
      var noteText = el('text', { 'class': 'calc-chart__note-text', 'text-anchor': 'middle' });
      note.appendChild(noteDot); note.appendChild(noteBox); note.appendChild(noteText);

      function show(p) {
        var px = x(p.age), py = y(p.value);
        var text = 'Age ' + p.age + ': ' + config.valueLabel(p.value);
        noteText.textContent = text;
        var boxW = text.length * 6.9 + 18;
        var bx = Math.min(width - pad.right - boxW, Math.max(pad.left, px - boxW / 2));
        var by = py - 40 < 2 ? py + 14 : py - 40;
        noteDot.setAttribute('cx', px); noteDot.setAttribute('cy', py);
        noteBox.setAttribute('x', bx); noteBox.setAttribute('y', by); noteBox.setAttribute('width', boxW);
        noteText.setAttribute('x', bx + boxW / 2); noteText.setAttribute('y', by + 17.5);
        note.setAttribute('visibility', 'visible');
      }
      function hide() { note.setAttribute('visibility', 'hidden'); }

      var band = w / Math.max(1, pts.length - 1);
      pts.forEach(function (p) {
        var hit = el('rect', {
          x: x(p.age) - band / 2, y: pad.top, width: band, height: h, 'class': 'calc-chart__hit'
        });
        hit.addEventListener('pointerenter', function () { show(p); });
        hit.addEventListener('pointerdown', function () { show(p); });
        svg.appendChild(hit);
      });
      svg.addEventListener('pointerleave', hide);
      svg.appendChild(note);

      container.innerHTML = '';
      container.appendChild(svg);
    };

    // The same figures as a table for screen readers.
    api.fillTable = function (table, caption, headers, rows) {
      var html = '<caption>' + caption + '</caption><thead><tr>' +
        headers.map(function (hd) { return '<th scope="col">' + hd + '</th>'; }).join('') + '</tr></thead><tbody>' +
        rows.map(function (r) {
          return '<tr>' + r.map(function (c, i) { return i ? '<td>' + c + '</td>' : '<th scope="row">' + c + '</th>'; }).join('') + '</tr>';
        }).join('') + '</tbody>';
      table.innerHTML = html;
    };

    // One Plausible event per visit, carrying only the calculator's name. Never a figure.
    api.trackUse = function (calculatorName) {
      if (api._tracked) return;
      api._tracked = true;
      try {
        if (typeof window.plausible === 'function') {
          window.plausible('Calculator used', { props: { calculator: calculatorName } });
        }
      } catch (e) { /* analytics must never break the calculator */ }
    };
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof root !== 'undefined' && root) root.SWCalc = api;
})(typeof window !== 'undefined' ? window : null);
