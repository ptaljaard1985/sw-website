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
      monthlyIncome: capitalToday * rate / 100 / 12,
      // the same two figures before inflation is taken off (rands of the retirement year)
      capitalFuture: balances[years],
      monthlyIncomeFuture: balances[years] * rate / 100 / 12
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

  /* ---------- Retirement income (drawdown) ---------- */

  // input: { age, savings, monthlyIncome, otherIncome, extraReturn }
  // The income wanted, less other income, is taken at the start of each year and
  // rises with inflation. What remains grows for the year. Runs to age 100.
  function projectDrawdown(input) {
    var growth = INFLATION + (input.extraReturn || 0);
    var need0 = Math.max(0, (input.monthlyIncome || 0) - (input.otherIncome || 0)) * 12;
    var balance = input.savings || 0;
    var runOutAge = null;
    var points = [];
    var income = [];   // monthly income paid at each age, in today's money
    var wanted = input.monthlyIncome || 0;
    var fromOther = Math.min(input.otherIncome || 0, wanted);
    for (var age = input.age; age <= 99; age++) {
      var y = age - input.age;
      var need = need0 * Math.pow(1 + INFLATION, y);
      points.push({ age: age, value: balance / Math.pow(1 + INFLATION, y), actual: balance });
      if (balance < need && runOutAge === null) runOutAge = age;
      var draw = Math.min(balance, need);
      income.push({
        age: age,
        wanted: wanted,
        fromSavings: draw / Math.pow(1 + INFLATION, y) / 12,
        fromOther: fromOther,
        // the same three amounts in the rands of that year (everything rises with inflation)
        wantedActual: wanted * Math.pow(1 + INFLATION, y),
        fromSavingsActual: draw / 12,
        fromOtherActual: fromOther * Math.pow(1 + INFLATION, y)
      });
      balance = (balance - draw) * (1 + growth);
    }
    var leftAt100Today = balance / Math.pow(1 + INFLATION, 100 - input.age);
    points.push({ age: 100, value: leftAt100Today, actual: balance });
    return {
      points: points,
      income: income,
      runOutAge: runOutAge,                       // first age the savings cannot pay the full year
      leftAt100Today: leftAt100Today,
      leftAt100Actual: balance,                  // in the rands of that year
      firstYearRate: input.savings > 0 ? need0 / input.savings * 100 : 0,   // percent
      guideRate: withdrawalRate(input.age),       // percent
      covered: need0 === 0                        // other income already pays the income wanted
    };
  }

  // The highest monthly income (including other income) with no run-out age before 100.
  function incomeThatLasts(input) {
    var other = input.otherIncome || 0;
    var lo = other;
    var hi = other + (input.savings || 0) / 12;
    for (var i = 0; i < 60; i++) {
      var mid = (lo + hi) / 2;
      var r = projectDrawdown({
        age: input.age, savings: input.savings, monthlyIncome: mid,
        otherIncome: other, extraReturn: input.extraReturn
      });
      if (r.runOutAge === null) lo = mid; else hi = mid;
    }
    return lo;
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

  // The sentence in "How this is worked out" that explains the slider setting.
  function returnSentence(percent) {
    var inflation = Math.round(INFLATION * 1000) / 10;
    var total = Math.round((inflation + (percent || 0)) * 10) / 10;
    if (!percent) return 'Inflation is assumed to be ' + inflation + '% a year, so inflation only means ' + total + '% a year.';
    return 'Inflation is assumed to be ' + inflation + '% a year, so inflation plus ' + percent + '% means ' + total + '% a year.';
  }

  // "Your expected return": a plain comment on the slider setting, as paragraphs.
  // General description only. It names no product and makes no promise.
  function returnComment(percent) {
    var p = percent || 0;
    var first = p === 0
      ? 'Your expected return is inflation only.'
      : 'Your expected return is inflation plus ' + p + '% a year.';
    var rest;
    if (p === 0) {
      rest = [
        'This assumes your savings keep up with rising prices and grow no faster. It is roughly what a portfolio held mostly in cash and other low-risk investments aims for.',
        'At this setting almost all of the growth in your savings has to come from what you put in.'
      ];
    } else if (p <= 1) {
      rest = [
        'This is a cautious assumption. It suits a portfolio held mostly in cash and bonds, with only a small share in growth assets (shares and listed property).',
        'The ups and downs should be small, but so is the growth above inflation, so most of the result depends on how much you save.'
      ];
    } else if (p <= 2) {
      rest = [
        'This is a conservative assumption. It suits a portfolio with a meaningful share in growth assets (shares and listed property), balanced by a large share in cash and bonds.',
        'You should expect modest (temporary) declines when markets fall.'
      ];
    } else if (p <= 3) {
      rest = [
        'This is a moderate assumption. It needs a substantial share of your savings in growth assets (shares and listed property), with the rest in cash and bonds.',
        'Your savings will fall in value from time to time, sometimes noticeably, and these (temporary) declines are part of earning this return.'
      ];
    } else if (p <= 4) {
      rest = [
        'This is achievable, but it needs most of your savings to be invested in growth assets (shares and listed property), across all your investment accounts.',
        'The price of this return is larger (temporary) declines when markets fall, and the discipline to stay invested through them.'
      ];
    } else {
      rest = [
        'This is possible, but it asks a lot. All your investment accounts would need to be invested in strategies that are likely to deliver this return over time, which means the great majority of your savings in growth assets (shares and listed property).',
        'The unavoidable result is bigger (temporary) declines when markets are volatile.'
      ];
    }
    return [first].concat(rest);
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
    projectDrawdown: projectDrawdown,
    incomeThatLasts: incomeThatLasts,
    roundTo: roundTo,
    floorTo: function (n, step) { return Math.floor(n / step) * step; },
    formatRand: formatRand,
    formatRandShort: formatRandShort,
    parseRand: parseRand,
    returnInWords: returnInWords,
    returnSentence: returnSentence,
    returnComment: returnComment,
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

    // Whole-number field (an age): strips anything that is not a digit. Empty -> null.
    api.readWholeNumber = function (input) {
      var text = input.value.replace(/\D/g, '');
      if (text !== input.value) input.value = text;
      return text === '' ? null : parseInt(text, 10);
    };

    // Shows or clears the error message tied to a field.
    api.setFieldError = function (input, errorNode, message) {
      errorNode.textContent = message;
      if (message) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    };

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
    api.bindReturnSlider = function (slider, label, onChange, sentence) {
      function sync() {
        var words = returnInWords(parseFloat(slider.value));
        slider.setAttribute('aria-valuetext', words);
        if (label) label.textContent = words;
        if (sentence) sentence.textContent = returnSentence(parseFloat(slider.value));
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
         marker: { age, label, side }      (optional, the highlighted point; side 'right' for a falling line)
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
          // On a falling line, above and to the right is the clear side.
          if (config.marker.side === 'right') {
            var roomRight = width - pad.right - mx > config.marker.label.length * 9.5;
            anchor = roomRight ? 'start' : 'end';
            lx = roomRight ? mx + 8 : mx - 8;
            ly = my - 14;
          }
          // Lift the label clear of the line wherever the line passes under its text.
          var labelW = config.marker.label.length * 9.5;
          var fromX = anchor === 'end' ? lx - labelW : lx;
          var toX = anchor === 'end' ? lx : lx + labelW;
          if (ly < my) {
            var highest = my;
            pts.forEach(function (p, i) {
              var px = x(p.age);
              if (px >= fromX - 4 && px <= toX + 4) highest = Math.min(highest, y(p.value));
              if (i > 0) {   // where the line crosses the label's left and right edges
                var qx = x(pts[i - 1].age);
                [fromX, toX].forEach(function (edge) {
                  if (edge > qx && edge < px) {
                    var t = (edge - qx) / (px - qx);
                    highest = Math.min(highest, y(pts[i - 1].value) + t * (y(p.value) - y(pts[i - 1].value)));
                  }
                });
              }
            });
            ly = Math.min(ly, highest - 12);
          }
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

    /* Stacked bars of the income paid at each age against the income wanted,
       in the same style as the line chart.
       config: {
         rows: [{ age, wanted, fromSavings, fromOther }],
         valueLabel(value) -> text,
         marker: { age, label }   (optional, a label above that age's bar)
         title:  text for the SVG's accessible name
       } */
    api.drawIncomeChart = function (container, config) {
      var width = Math.max(280, container.clientWidth || 600);
      var height = Math.round(Math.min(380, Math.max(260, width * 0.56)));
      var pad = { top: 34, right: 18, bottom: 34, left: 52 };
      var rows = config.rows;
      var w = width - pad.left - pad.right;
      var h = height - pad.top - pad.bottom;

      var maxValue = 1;
      rows.forEach(function (r) { maxValue = Math.max(maxValue, r.wanted, r.fromSavings + r.fromOther); });
      var step = niceStep(maxValue * 1.12, 4);
      var top = Math.ceil(maxValue * 1.12 / step) * step;
      var slot = w / rows.length;
      var barW = Math.max(2, slot * 0.8);
      function x(i) { return pad.left + i * slot; }
      function y(value) { return pad.top + h - value / top * h; }

      var svg = el('svg', {
        viewBox: '0 0 ' + width + ' ' + height, width: width, height: height,
        role: 'img', 'aria-label': config.title || 'Chart', 'class': 'calc-chart__svg'
      });

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

      var minAge = rows[0].age, maxAge = rows[rows.length - 1].age;
      var span = maxAge - minAge;
      var every = span <= 6 ? 1 : span <= 12 ? 2 : span <= 30 ? 5 : 10;
      rows.forEach(function (r, i) {
        var isEnd = i === 0 || i === rows.length - 1;
        var crowdsEnd = !isEnd && (r.age - minAge < every / 2 || maxAge - r.age < every / 2);
        if ((r.age % every === 0 || isEnd) && !crowdsEnd) {
          svg.appendChild(el('text', {
            x: x(i) + slot / 2, y: height - pad.bottom + 20, 'text-anchor': 'middle', 'class': 'calc-chart__axis'
          }, String(r.age)));
        }
      });

      // Shortfall shading, then the bars: other income at the bottom, savings on top
      rows.forEach(function (r, i) {
        var bx = x(i) + (slot - barW) / 2;
        var paid = r.fromSavings + r.fromOther;
        if (r.wanted - paid > 0.5) {
          svg.appendChild(el('rect', { x: x(i), y: y(r.wanted), width: slot, height: y(paid) - y(r.wanted), 'class': 'calc-chart__short' }));
        }
        if (r.fromOther > 0.5) {
          svg.appendChild(el('rect', { x: bx, y: y(r.fromOther), width: barW, height: y(0) - y(r.fromOther), 'class': 'calc-chart__bar-other' }));
        }
        if (r.fromSavings > 0.5) {
          svg.appendChild(el('rect', { x: bx, y: y(paid), width: barW, height: y(r.fromOther) - y(paid), 'class': 'calc-chart__bar-savings' }));
        }
      });

      // The income wanted, stepping up at each age
      var steps = rows.map(function (r, i) {
        return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(r.wanted).toFixed(1) + ' L' + (x(i) + slot).toFixed(1) + ' ' + y(r.wanted).toFixed(1);
      }).join(' ');
      svg.appendChild(el('path', { d: steps, 'class': 'calc-chart__want' }));

      if (config.marker) {
        var mi = -1;
        rows.forEach(function (r, i) { if (r.age === config.marker.age) mi = i; });
        if (mi >= 0) {
          var labelW = config.marker.label.length * 9.5;
          var cx = x(mi) + slot / 2;
          var roomRight = width - pad.right - cx > labelW;
          // to the left of the run-out age, above the rising line, where there is open space
          var roomLeft = cx - pad.left > labelW + 12;
          svg.appendChild(el('text', {
            x: roomLeft ? cx - 10 : (roomRight ? cx : width - pad.right), y: y(rows[mi].wanted) - 14,
            'text-anchor': roomLeft ? 'end' : (roomRight ? 'start' : 'end'), 'class': 'calc-chart__marker-label'
          }, config.marker.label));
        }
      }

      // Hover and tap
      var note = el('g', { 'class': 'calc-chart__note', visibility: 'hidden' });
      var noteBox = el('rect', { rx: 3, ry: 3, height: 26, 'class': 'calc-chart__note-box' });
      var noteText = el('text', { 'class': 'calc-chart__note-text', 'text-anchor': 'middle' });
      note.appendChild(noteBox); note.appendChild(noteText);
      rows.forEach(function (r, i) {
        var hit = el('rect', { x: x(i), y: pad.top, width: slot, height: h, 'class': 'calc-chart__hit' });
        function show() {
          var text = 'Age ' + r.age + ': ' + config.valueLabel(r.fromSavings + r.fromOther);
          noteText.textContent = text;
          var boxW = text.length * 6.9 + 18;
          var bx = Math.min(width - pad.right - boxW, Math.max(pad.left, x(i) + slot / 2 - boxW / 2));
          var by = pad.top + 4;
          noteBox.setAttribute('x', bx); noteBox.setAttribute('y', by); noteBox.setAttribute('width', boxW);
          noteText.setAttribute('x', bx + boxW / 2); noteText.setAttribute('y', by + 17.5);
          note.setAttribute('visibility', 'visible');
        }
        hit.addEventListener('pointerenter', show);
        hit.addEventListener('pointerdown', show);
        svg.appendChild(hit);
      });
      svg.addEventListener('pointerleave', function () { note.setAttribute('visibility', 'hidden'); });
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
