const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function harness() {
  const keys = new Map();
  const events = [];
  let focused = null;
  function element() {
    return {
      hidden: true, textContent: '',
      focus() { focused = this; },
      click() { this.onclick?.(); },
    };
  }
  const modal = element(), title = element(), message = element();
  const acceptButton = element(), cancelButton = element();
  const source = element();
  const doc = {
    get activeElement() { return focused; },
    addEventListener(type, fn) { keys.set(type, fn); },
  };
  const context = vm.createContext({});
  const module = new vm.SourceTextModule(
    fs.readFileSync(path.join(__dirname, '../src/confirmation.js'), 'utf8'),
    { context }
  );
  await module.link(() => { throw Error('Unexpected import'); });
  await module.evaluate();
  const dialog = module.namespace.createConfirmationController({
    modal, title, message, acceptButton, cancelButton, documentRef: doc,
    onVisibilityChange: value => events.push(value),
  });
  return {
    dialog, modal, title, message, acceptButton, cancelButton, source,
    events, keys, get focused() { return focused; },
  };
}

test('confirmation is canceled by Android Back path and by Escape without action', async () => {
  const h = await harness();
  let calls = 0;
  assert.equal(h.dialog.open({
    heading: 'Restart?', detail: 'Lose current moves?', confirmLabel: 'Restart',
    onConfirm: () => calls++, focusReturn: h.source,
  }), true);
  assert.equal(h.modal.hidden, false);
  assert.equal(h.title.textContent, 'Restart?');
  assert.equal(h.message.textContent, 'Lose current moves?');
  assert.equal(h.focused, h.cancelButton);
  assert.equal(h.dialog.close(), true);
  assert.equal(calls, 0);
  assert.equal(h.focused, h.source);
  h.dialog.open({ heading: 'Again?', detail: 'Test', onConfirm: () => calls++ });
  let prevented = false;
  h.keys.get('keydown')({ key: 'Escape', preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(h.modal.hidden, true);
  assert.equal(calls, 0);
  assert.equal(JSON.stringify(h.events), JSON.stringify([true, false, true, false]));
});

test('accept executes exactly once; duplicate opens and extra clicks cannot repeat it', async () => {
  const h = await harness();
  let calls = 0;
  const config = { heading: 'Start?', detail: 'Replace?', onConfirm: () => calls++ };
  assert.equal(h.dialog.open(config), true);
  assert.equal(h.dialog.open(config), false);
  h.acceptButton.click();
  h.acceptButton.click();
  assert.equal(calls, 1);
  assert.equal(h.dialog.isOpen(), false);
});

test('confirmation assigns user-controlled strings as text and wraps keyboard focus', async () => {
  const h = await harness();
  h.dialog.open({ heading: '<b>Confirm</b>', detail: '<script>bad</script>',
    onConfirm: () => {} });
  assert.equal(h.title.textContent, '<b>Confirm</b>');
  assert.equal(h.message.textContent, '<script>bad</script>');
  let prevented = 0;
  h.keys.get('keydown')({ key: 'Tab', shiftKey: true, preventDefault() { prevented++; } });
  assert.equal(h.focused, h.acceptButton);
  h.keys.get('keydown')({ key: 'Tab', shiftKey: false, preventDefault() { prevented++; } });
  assert.equal(h.focused, h.cancelButton);
  assert.equal(prevented, 2);
});
