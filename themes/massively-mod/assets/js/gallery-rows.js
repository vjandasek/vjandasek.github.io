// Gallery pages: balanced justified rows.
// The CSS alone fills rows greedily (each row takes photos until the next one
// won't fit), which can strand a portrait on a row of its own, blown up to
// the full width. This picks all the row breaks at once instead: of every
// way to split the photos (in order) into rows, it takes the one whose rows
// come closest to the target height, then sets each photo's width.
(function () {
  'use strict';

  var MAX_PER_ROW = 12;
  var SHORT_PENALTY = 4;
  // On wide screens the target grows with the gallery: width / WIDTH_PER_ROW,
  // so photos get bigger rather than more of them squeezing into each row.
  // --row (CSS) is the minimum, which is what applies on phones and tablets.
  var WIDTH_PER_ROW = 4.5;

  function layout(ul) {
    var items = Array.prototype.slice.call(ul.children);
    if (!items.length) return;
    var cs = getComputedStyle(ul);
    // Exact (fractional) content width: clientWidth rounds to whole pixels, and
    // rounding up makes every row a fraction too wide, so its last photo wraps
    var width = ul.getBoundingClientRect().width
      - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
      - parseFloat(cs.borderLeftWidth) - parseFloat(cs.borderRightWidth);
    if (width === ul._rowsWidth) return;
    ul._rowsWidth = width;
    var gap = parseFloat(cs.columnGap) || 0;
    var target = Math.max(parseFloat(cs.getPropertyValue('--row')) || 200, width / WIDTH_PER_ROW);
    var r = items.map(function (li) { return parseFloat(li.style.getPropertyValue('--r')) || 1; });
    var n = r.length;

    // best[j]: lowest cost of laying out the first j photos; from[j]: where its last row starts.
    // A row's cost is how far its height is from the target, on a log scale;
    // rows below the target cost SHORT_PENALTY times more, because small
    // photos are worse than a little extra scrolling.
    var best = [0], from = [0];
    for (var j = 1; j <= n; j++) {
      best[j] = Infinity;
      var sum = 0;
      for (var i = j - 1; i >= 0 && j - i <= MAX_PER_ROW; i--) {
        sum += r[i];
        var h = (width - gap * (j - i - 1)) / sum;
        if (h <= 0) break;
        var d = Math.log(h / target);
        var c = best[i] + d * d * (d < 0 ? SHORT_PENALTY : 1);
        if (c < best[j]) { best[j] = c; from[j] = i; }
      }
    }

    for (var end = n; end > 0; end = from[end]) {
      var start = from[end], s = 0;
      for (var k = start; k < end; k++) s += r[k];
      var rowH = (width - gap * (end - start - 1)) / s;
      // Round down to 1/100 px so rounding never pushes a photo onto the next row
      for (k = start; k < end; k++) items[k].style.flex = '0 0 ' + Math.floor(rowH * r[k] * 100) / 100 + 'px';
    }
    ul.classList.add('is-balanced');
  }

  var galleries = document.querySelectorAll('.image-gallery-rows');
  if (!galleries.length) return;
  galleries.forEach(layout);
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(function (entries) {
      entries.forEach(function (e) { layout(e.target); });
    });
    galleries.forEach(function (ul) { ro.observe(ul); });
  }
})();
