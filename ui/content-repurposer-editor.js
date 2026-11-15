// Edit only fields the existing tool accepts. Every result comes from a host tool call.
function createResultEditor(panel, config, bridge) {
  const form = panel.querySelector('form');
  const fields = panel.querySelector('[data-fields]');
  const status = panel.querySelector('[role=status]');
  const run = panel.querySelector('[data-run]');
  let owned = false;
  let revision = 0;
  let requestNumber = 0;
  let original = {};
  let busy = false;
  let confirmEditLoss = false;
  const controls = new Map();
  const element = (tag, text) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    return node;
  };
  function markEdit() {
    owned = true;
    confirmEditLoss = false;
    revision++;
    busy = false;
    run.disabled = !bridge.available();
    status.textContent = 'Inputs changed. Run the tool to update the result.';
  }
  function field(key, spec, required) {
    const label = element('label', spec.label);
    let input;
    if (spec.choices) {
      input = element('select');
      input.append(element('option', ''));
      for (const choice of spec.choices) {
        const option = element('option', choice.replaceAll('_', ' '));
        option.value = choice;
        input.append(option);
      }
    } else if (spec.type === 'number') {
      input = element('input');
      input.type = 'number';
      input.step = 'any';
      if (spec.min !== undefined) input.min = String(spec.min);
      if (spec.max !== undefined) input.max = String(spec.max);
    } else {
      input = element('textarea');
      input.rows = spec.long ? 4 : 2;
    }
    input.required = required;
    label.append(input);
    return {
      node: label,
      set(value) { input.value = value == null ? '' : spec.list ? value.join('\n') : String(value); },
      get() {
        if (!input.value.trim()) return undefined;
        if (spec.type === 'number') return Number(input.value);
        return spec.list ? input.value.split('\n').map(v => v.trim()).filter(Boolean) : input.value;
      }
    };
  }
  for (const [key, spec] of Object.entries(config.fields)) {
    const input = field(key, spec, config.required.includes(key));
    controls.set(key, input);
    fields.append(input.node);
  }
  function populate(args) {
    for (const [key, input] of controls) input.set(args?.[key]);
  }
  form.addEventListener('input', markEdit);
  async function runTool(event) {
    event.preventDefault();
    if (busy || !bridge.available() || (form.reportValidity && !form.reportValidity())) return;
    if (panel.dataset.editedCopy === 'yes' && !confirmEditLoss) {
      confirmEditLoss = true;
      status.textContent = 'Running the tool replaces edits to the selected copy. Submit again to confirm.';
      return;
    }
    const args = {};
    for (const [key, control] of controls) {
      const value = control.get();
      if (value !== undefined) args[key] = value;
    }
    const current = ++requestNumber;
    const atRevision = revision;
    owned = true;
    busy = true;
    run.disabled = true;
    status.textContent = 'Waiting for the server result.';
    try {
      const result = await bridge.call(config.tool, args);
      if (current !== requestNumber || atRevision !== revision) return;
      delete panel.dataset.editedCopy;
      confirmEditLoss = false;
      bridge.render(result);
      if (result?.isError) {
        status.textContent = 'The server asked for corrected inputs. Read the response before trying again.';
      } else {
        original = args;
        status.textContent = 'Result updated from the server.';
      }
    } catch {
      if (current === requestNumber && atRevision === revision) status.textContent = 'The host could not complete the call. Your inputs are still here.';
    } finally {
      if (current === requestNumber && atRevision === revision) {
        busy = false;
        run.disabled = !bridge.available();
      }
    }
  }
  // A sandboxed component can run scripts even when its host disables native form submissions.
  run.addEventListener('click', runTool);
  form.addEventListener('submit', runTool);

  panel.querySelector('[data-reset]').addEventListener('click', () => {
    revision++;
    requestNumber++;
    owned = false;
    busy = false;
    populate(original);
    run.disabled = !bridge.available();
    status.textContent = 'Inputs restored to the last accepted values.';
  });
  function sync() {
    run.disabled = busy || !bridge.available();
    if (!owned) status.textContent = run.disabled ? 'This host can show the result. Use the conversation to run the tool.' : '';
  }
  sync();
  return {
    sync,
    protect() { owned = true; revision++; busy = false; run.disabled = !bridge.available(); confirmEditLoss = false; panel.dataset.editedCopy = 'yes'; },
    acceptInput(args) { if (owned) return false; original = args ?? {}; populate(original); return true; },
    acceptResult() {
      if (owned) status.textContent = 'A host update arrived. Your local edits were kept.';
      return !owned;
    },
    close() { revision++; requestNumber++; busy = false; owned = false; run.disabled = true; }
  };
}

function addCopyEditor(container, formats, pick, editor) {
  const label = make('label', 'Edit selected format');
  const copy = make('textarea');
  copy.rows = 8;
  label.append(copy);
  const restore = make('button', 'Restore this format');
  const sendToClipboard = make('button', 'Copy selected format');
  const notice = make('p');
  notice.setAttribute('role', 'status');
  const changes = new Map();
  let confirmCopy = false;
  function show() {
    const source = formats[Number(pick.value)];
    copy.value = changes.get(pick.value) ?? source?.text ?? '';
    copy.disabled = restore.disabled = sendToClipboard.disabled = !source;
    notice.textContent = '';
    confirmCopy = false;
  }
  copy.addEventListener('input', () => {
    changes.set(pick.value, copy.value);
    editor.protect();
    confirmCopy = false;
    notice.textContent = 'Local edit. The original server response is available below.';
  });
  restore.addEventListener('click', () => { changes.delete(pick.value); show(); });
  pick.addEventListener('change', show);
  sendToClipboard.addEventListener('click', async () => {
    const original = formats[Number(pick.value)]?.text ?? '';
    if (copy.value !== original && !confirmCopy) {
      confirmCopy = true;
      notice.textContent = 'Check the edited copy against the original proof, qualifications and publication permission. Select Copy selected format again to confirm.';
      return;
    }
    try { await navigator.clipboard.writeText(copy.value); notice.textContent = 'Selected copy copied.'; }
    catch { copy.focus(); copy.select(); notice.textContent = 'Select and copy the text in the editor.'; }
    confirmCopy = false;
  });
  container.append(label, restore, sendToClipboard, notice);
  show();
}
