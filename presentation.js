// Non-destructive presentation hook: refresh move count beside the history title.
(function () {
  var history = document.getElementById('moves');
  var badge = document.getElementById('move-count');
  if (!history || !badge) return;
  function update() { badge.textContent = String(history.querySelectorAll('li').length); }
  new MutationObserver(update).observe(history, { childList: true, subtree: true });
  update();
})();
