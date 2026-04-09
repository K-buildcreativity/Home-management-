(() => {
  const K = 'homepulse_state_v2';
  const rooms = ['Living Room', 'Kitchen', 'Bedroom', 'Office', 'Entry', 'Garage'];
  const roomIcons = { 'Living Room': 'fa-couch', Kitchen: 'fa-utensils', Bedroom: 'fa-bed', Office: 'fa-briefcase', Entry: 'fa-door-open', Garage: 'fa-warehouse' };
  const devIcons = { light: 'fa-lightbulb', climate: 'fa-temperature-half', appliance: 'fa-plug', entertainment: 'fa-tv', security: 'fa-shield-halved' };
  const sceneIcons = { Morning: 'fa-sun', Focus: 'fa-laptop', Movie: 'fa-film', Eco: 'fa-leaf', Away: 'fa-shield-halved', Sleep: 'fa-moon' };
  const base = {
    home: { name: 'Aurora House', owner: 'Maya Patel', mode: 'Home', security: false, temp: 22 },
    selectedRoom: 'Living Room',
    devices: [
      { id: 'living-lights', room: 'Living Room', name: 'Ceiling Lights', type: 'light', on: true, level: 78, power: 14 },
      { id: 'living-tv', room: 'Living Room', name: 'Media Hub', type: 'entertainment', on: false, power: 110 },
      { id: 'kitchen-lights', room: 'Kitchen', name: 'Counter Lights', type: 'light', on: true, level: 88, power: 12 },
      { id: 'kitchen-coffee', room: 'Kitchen', name: 'Coffee Brewer', type: 'appliance', on: false, power: 980 },
      { id: 'bedroom-climate', room: 'Bedroom', name: 'Climate Control', type: 'climate', on: true, temp: 22, power: 620 },
      { id: 'bedroom-lights', room: 'Bedroom', name: 'Bedside Lights', type: 'light', on: false, level: 0, power: 8 },
      { id: 'office-light', room: 'Office', name: 'Desk Lamp', type: 'light', on: true, level: 64, power: 7 },
      { id: 'office-workstation', room: 'Office', name: 'Workstation', type: 'appliance', on: true, power: 135 },
      { id: 'entry-lock', room: 'Entry', name: 'Front Lock', type: 'security', locked: false, power: 4 },
      { id: 'garage-lock', room: 'Garage', name: 'Garage Lock', type: 'security', locked: false, power: 4 }
    ],
    automations: [
      { id: 'a1', name: 'Morning warm-up', room: 'Bedroom', trigger: '6:45 AM', action: 'Turn on lights, warm the bedroom, and prep the kitchen.', enabled: true },
      { id: 'a2', name: 'Night shield', room: 'Entry', trigger: '11:00 PM', action: 'Lock entry points, switch off shared lights, and arm security.', enabled: true },
      { id: 'a3', name: 'Focus session', room: 'Office', trigger: 'When work mode starts', action: 'Switch on the desk lamp and calm the rest of the house.', enabled: false }
    ],
    alerts: [
      { id: 'al1', level: 'warn', title: 'Back door unlocked', detail: 'Garage access stayed open for 3 minutes.', createdAt: new Date(Date.now() - 6e5).toISOString(), ack: false },
      { id: 'al2', level: 'info', title: 'Air quality stable', detail: 'Bedroom purifier restored the room to a comfortable range.', createdAt: new Date(Date.now() - 28e5).toISOString(), ack: true }
    ],
    activity: [
      { id: 'ac1', icon: 'fa-shield-halved', title: 'Security status checked', detail: 'All door and lock sensors were refreshed.', createdAt: new Date(Date.now() - 14e5).toISOString(), tone: 'sky' },
      { id: 'ac2', icon: 'fa-temperature-half', title: 'Bedroom climate set to 22 C', detail: 'Comfort mode is ready for the evening.', createdAt: new Date(Date.now() - 42e5).toISOString(), tone: 'teal' },
      { id: 'ac3', icon: 'fa-lightbulb', title: 'Kitchen lights restored', detail: 'The room is ready for cooking and cleanup.', createdAt: new Date(Date.now() - 74e5).toISOString(), tone: 'amber' }
    ]
  };

  let s = load();
  let page = 'dashboard';
  let map = null;
  let c1 = null;
  let c2 = null;

  function j(v) { return JSON.parse(JSON.stringify(v)); }
  function load() {
    try {
      const x = JSON.parse(localStorage.getItem(K) || 'null');
      if (!x) return j(base);
      return { ...j(base), ...x, home: { ...j(base.home), ...(x.home || {}) }, devices: x.devices?.length ? x.devices : j(base.devices), automations: x.automations?.length ? x.automations : j(base.automations), alerts: x.alerts?.length ? x.alerts : j(base.alerts), activity: x.activity?.length ? x.activity : j(base.activity) };
    } catch { return j(base); }
  }
  const save = () => { try { localStorage.setItem(K, JSON.stringify(s)); } catch {} };
  const esc = v => String(v ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  const ago = ts => { const d = Date.now() - new Date(ts).getTime(); return d < 6e4 ? 'Just now' : d < 36e5 ? `${Math.max(1, Math.floor(d / 6e4))}m ago` : d < 864e5 ? `${Math.max(1, Math.floor(d / 36e5))}h ago` : new Date(ts).toLocaleDateString(); };
  const dev = id => s.devices.find(d => d.id === id);
  const on = d => d.type === 'security' ? !!d.locked : !!d.on;
  const watts = d => d.type === 'security' ? (d.locked ? d.power || 4 : 1) : !d.on ? 0.25 : d.type === 'light' ? 2 + (Number(d.level) || 0) * 0.12 : d.type === 'climate' ? Math.max(300, 540 + Math.max(0, 23 - (Number(d.temp) || s.home.temp)) * 28) : d.power || 40;
  const status = d => d.type === 'security' ? (d.locked ? 'Locked' : 'Unlocked') : d.type === 'climate' ? (d.on ? `${d.temp} C` : 'Off') : d.type === 'light' ? (d.on ? `${d.level || 0}%` : 'Off') : d.on ? 'On' : 'Off';
  const totalWatts = () => s.devices.reduce((a, d) => a + watts(d), 0);
  const todayKwh = () => +(totalWatts() * 4.8 / 1000).toFixed(1);
  const cost = () => +(todayKwh() * 0.18).toFixed(2);
  const comfort = () => { const b = dev('bedroom-climate'); return Math.max(52, Math.min(100, 92 - (Math.abs((b?.temp || s.home.temp) - 22) * 5) + (s.home.security ? 5 : 0) - Math.max(0, (totalWatts() - 1150) / 80))); };
  function roomM(room) {
    const ds = s.devices.filter(d => d.room === room);
    const ac = ds.filter(on);
    const temp = room === 'Bedroom' ? (dev('bedroom-climate')?.temp || s.home.temp) : room === 'Kitchen' ? 23 : room === 'Office' ? 21 : 22;
    return { room, total: ds.length, active: ac.length, temp, hum: room === 'Kitchen' ? 54 : room === 'Bedroom' ? 47 : 45, load: +(ac.reduce((a, d) => a + watts(d), 0) / 1000).toFixed(2), comfort: Math.max(64, Math.min(100, 91 - Math.abs(temp - 22) * 4 + ac.length * 2)) };
  }
  function addAct(title, detail, tone = 'sky', icon = 'fa-bolt') { s.activity.unshift({ id: `ac-${Date.now()}`, icon, title, detail, createdAt: new Date().toISOString(), tone }); s.activity = s.activity.slice(0, 8); }
  function setLocks(v) { s.devices.filter(d => d.type === 'security').forEach(d => d.locked = v); s.home.security = v; }

  function scene(name) {
    const m = {
      Morning() { s.devices.forEach(d => { if (d.type === 'light') { d.on = true; d.level = Math.max(35, d.level || 65); } if (d.id === 'living-tv') d.on = false; if (d.id === 'bedroom-climate') { d.on = true; d.temp = 22; s.home.temp = 22; } if (d.id === 'office-workstation') d.on = true; }); setLocks(false); s.home.mode = 'Home'; addAct('Morning scene activated', 'Lights and climate were prepared for the day.', 'teal', 'fa-sun'); },
      Focus() { s.devices.forEach(d => { if (['living-lights', 'kitchen-lights', 'living-tv', 'bedroom-lights'].includes(d.id)) { d.on = false; d.level = 0; } if (d.id === 'office-light') { d.on = true; d.level = 92; } if (d.id === 'office-workstation') d.on = true; if (d.id === 'bedroom-climate') { d.on = true; d.temp = 21; s.home.temp = 21; } }); setLocks(false); s.home.mode = 'Focus'; addAct('Focus scene activated', 'The office is now prioritized for work.', 'sky', 'fa-laptop'); },
      Movie() { s.devices.forEach(d => { if (d.id === 'living-lights') { d.on = true; d.level = 22; } if (d.id === 'living-tv') d.on = true; if (['kitchen-lights', 'bedroom-lights', 'office-light'].includes(d.id)) { d.on = false; d.level = 0; } }); setLocks(false); s.home.mode = 'Movie'; addAct('Movie scene activated', 'Living room lighting shifted to low ambient mode.', 'amber', 'fa-film'); },
      Eco() { s.devices.forEach(d => { if (d.type === 'light' && d.room !== 'Bedroom') { d.on = true; d.level = d.room === 'Office' ? 48 : 40; } if (['living-tv', 'office-workstation', 'kitchen-coffee'].includes(d.id)) d.on = false; if (d.id === 'bedroom-climate') { d.on = true; d.temp = 23; s.home.temp = 23; } }); setLocks(false); s.home.mode = 'Eco'; addAct('Eco mode activated', 'The house is now trimmed for lower usage.', 'teal', 'fa-leaf'); },
      Away() { s.devices.forEach(d => { if (['light', 'appliance', 'entertainment'].includes(d.type)) { d.on = false; d.level = 0; } if (d.id === 'bedroom-climate') { d.on = true; d.temp = 21; s.home.temp = 21; } }); setLocks(true); s.home.mode = 'Away'; addAct('Away mode activated', 'All critical locks were armed before leaving.', 'rose', 'fa-shield-halved'); },
      Sleep() { s.devices.forEach(d => { if (d.type === 'light' || ['living-tv', 'office-workstation', 'kitchen-coffee'].includes(d.id)) { d.on = false; d.level = 0; } if (d.id === 'bedroom-climate') { d.on = true; d.temp = 21; s.home.temp = 21; } }); setLocks(true); s.home.mode = 'Sleep'; addAct('Sleep scene activated', 'The house moved into night protection.', 'rose', 'fa-moon'); }
    }[name];
    if (m) m();
    save(); render();
  }

  function toggleDevice(id) {
    const d = dev(id); if (!d) return;
    if (d.type === 'security') { d.locked = !d.locked; s.home.security = s.devices.filter(x => x.type === 'security').every(x => x.locked); }
    else {
      d.on = !d.on;
      if (d.type === 'light') d.level = d.on ? Math.max(35, Number(d.level) || 65) : 0;
      if (d.type === 'climate' && d.on) { d.temp = Number(d.temp) || s.home.temp; s.home.temp = d.temp; }
    }
    addAct(`${d.name} ${d.type === 'security' ? (d.locked ? 'locked' : 'unlocked') : d.on ? 'turned on' : 'turned off'}`, `${d.room} device update from HomePulse.`, d.type === 'security' ? 'rose' : d.on ? 'teal' : 'amber', devIcons[d.type] || 'fa-circle');
    save(); render();
  }
  function setLevel(id, v) { const d = dev(id); if (!d || d.type !== 'light') return; d.level = Number(v); d.on = d.level > 0; addAct(`${d.name} brightness adjusted`, `${d.room} lights are now ${d.level}%.`, 'teal', 'fa-lightbulb'); save(); render(); }
  function setTemp(id, v) { const d = dev(id); if (!d || d.type !== 'climate') return; d.temp = Number(v); d.on = true; s.home.temp = d.temp; addAct(`${d.room} climate set to ${d.temp} C`, 'Temperature preference saved and applied.', 'sky', 'fa-temperature-half'); save(); render(); }
  function toggleAuto(id) { const r = s.automations.find(x => x.id === id); if (!r) return; r.enabled = !r.enabled; addAct(`${r.name} ${r.enabled ? 'enabled' : 'disabled'}`, `${r.room} routine was ${r.enabled ? 'turned on' : 'paused'}.`, r.enabled ? 'teal' : 'amber', 'fa-robot'); save(); render(); }
  function delAuto(id) { const r = s.automations.find(x => x.id === id); if (!r || !confirm(`Delete automation "${r.name}"?`)) return; s.automations = s.automations.filter(x => x.id !== id); addAct('Automation deleted', `"${r.name}" was removed from routines.`, 'rose', 'fa-trash'); save(); render(); }
  function ack(id) { const a = s.alerts.find(x => x.id === id); if (!a) return; a.ack = true; addAct('Alert acknowledged', `${a.title} was cleared from the active list.`, 'sky', 'fa-bell'); save(); render(); }
  function addDevice(form) {
    const name = form.deviceName.value.trim(), room = form.deviceRoom.value, type = form.deviceType.value, p = Number(form.devicePower.value || 0);
    if (!name) return;
    s.devices.unshift({ id: `dev-${Date.now()}`, room, name, type, on: type === 'climate', level: type === 'light' ? 60 : 0, temp: type === 'climate' ? s.home.temp : undefined, power: p || (type === 'light' ? 12 : type === 'climate' ? 620 : 40), locked: false });
    addAct(`Device added: ${name}`, `${room} now has one more connected device.`, 'teal', 'fa-plug');
    save(); render();
  }
  function addRoutine(form) {
    const name = form.routineName.value.trim(), room = form.routineRoom.value, trigger = form.routineTrigger.value.trim(), action = form.routineAction.value.trim();
    if (!name || !trigger || !action) return;
    s.automations.unshift({ id: `a-${Date.now()}`, name, room, trigger, action, enabled: true });
    addAct(`Routine created: ${name}`, `It will watch ${room} and react to ${trigger}.`, 'teal', 'fa-robot');
    save(); render();
  }
  function prefill(name) {
    const p = { Sunrise: { routineName: 'Sunrise wake-up', routineRoom: 'Bedroom', routineTrigger: '6:40 AM', routineAction: 'Turn on lights, warm the bedroom, and prep the kitchen.' }, Night: { routineName: 'Night shield', routineRoom: 'Entry', routineTrigger: '11:00 PM', routineAction: 'Lock entry points, switch off shared lights, and arm security.' }, Vacation: { routineName: 'Vacation guard', routineRoom: 'Garage', routineTrigger: 'When away mode turns on', routineAction: 'Arm security, keep temperatures low, and simulate normal lighting.' } }[name];
    if (!p) return;
    ['routineName', 'routineRoom', 'routineTrigger', 'routineAction'].forEach(k => { const el = document.getElementById(k); if (el) el.value = p[k]; });
  }

  const roomCard = (room, compact = false) => {
    const m = roomM(room), active = s.selectedRoom === room;
    return `<button class="complaint-item" style="width:100%;text-align:left;border:none;cursor:pointer;background:${active ? 'rgba(59,130,246,.12)' : 'white'}" data-action="select-room" data-room="${room}">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
        <div style="display:flex;gap:12px;align-items:center;">
          <div class="logo-icon" style="width:36px;height:36px;border-radius:12px;font-size:.9rem;"><i class="fas ${roomIcons[room]}"></i></div>
          <div><strong>${room}</strong><div style="font-size:.85rem;color:#64748b">${m.active}/${m.total} active</div></div>
        </div>
        <span class="glass-tag">${m.load} kW</span>
      </div>
      <p style="margin-top:.7rem">${m.temp} C, ${m.hum}% humidity, ${m.comfort}% comfort</p>
      <div style="margin-top:.6rem;font-size:.8rem;color:#64748b">${compact ? 'Tap to open room controls.' : 'Open this room to manage devices.'}</div>
    </button>`;
  };

  const deviceCard = d => {
    const tone = d.type === 'security' ? (d.locked ? 'resolved' : 'pending') : on(d) ? 'resolved' : 'pending';
    const head = `<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;"><div style="display:flex;gap:12px;align-items:flex-start;"><div class="logo-icon" style="width:36px;height:36px;border-radius:12px;font-size:.9rem;"><i class="fas ${devIcons[d.type]}"></i></div><div><strong>${esc(d.name)}</strong><div style="font-size:.85rem;color:#64748b">${esc(d.room)} - ${esc(d.type)}</div></div></div><span class="status-badge ${tone}">${esc(status(d))}</span></div>`;
    if (d.type === 'light') return `<div class="complaint-item">${head}<div style="margin-top:.9rem"><div class="subtle">Brightness</div><input type="range" min="0" max="100" value="${d.level || 0}" data-action="set-level" data-id="${d.id}"></div><button class="btn ${on(d) ? 'btn-primary' : 'btn-outline'}" data-action="toggle-device" data-id="${d.id}" style="margin-top:.8rem">${on(d) ? 'Turn off' : 'Turn on'}</button></div>`;
    if (d.type === 'climate') return `<div class="complaint-item">${head}<div style="margin-top:.9rem"><div class="subtle">Target temperature</div><input type="range" min="18" max="28" step="1" value="${d.temp || s.home.temp}" data-action="set-temp" data-id="${d.id}"></div><button class="btn ${on(d) ? 'btn-primary' : 'btn-outline'}" data-action="toggle-device" data-id="${d.id}" style="margin-top:.8rem">${on(d) ? 'Turn off' : 'Turn on'}</button></div>`;
    if (d.type === 'security') return `<div class="complaint-item">${head}<div style="margin-top:.9rem"><div class="subtle">Lock state</div><span class="glass-tag">${on(d) ? 'Locked' : 'Unlocked'}</span></div><button class="btn ${on(d) ? 'btn-primary' : 'btn-outline'}" data-action="toggle-device" data-id="${d.id}" style="margin-top:.8rem">${on(d) ? 'Unlock' : 'Lock'}</button></div>`;
    return `<div class="complaint-item">${head}<div style="margin-top:.9rem"><div class="subtle">Power draw</div><span class="glass-tag">${on(d) ? 'On' : 'Off'}</span></div><button class="btn ${on(d) ? 'btn-primary' : 'btn-outline'}" data-action="toggle-device" data-id="${d.id}" style="margin-top:.8rem">${on(d) ? 'Turn off' : 'Turn on'}</button></div>`;
  };
  const autoCard = r => `<div class="complaint-item"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;"><div><strong>${esc(r.name)}</strong> <span class="status-badge ${r.enabled ? 'resolved' : 'pending'}">${r.enabled ? 'Enabled' : 'Paused'}</span><br><small>${esc(r.room)} - ${esc(r.trigger)}</small><p style="margin-top:.45rem">${esc(r.action)}</p></div><div style="display:flex;gap:.5rem;flex-wrap:wrap;justify-content:flex-end;"><button class="btn btn-outline" data-action="toggle-auto" data-id="${r.id}">${r.enabled ? 'Disable' : 'Enable'}</button><button class="btn btn-outline" data-action="delete-auto" data-id="${r.id}">Delete</button></div></div></div>`;
  const sceneRail = () => ['Morning', 'Focus', 'Movie', 'Eco', 'Away', 'Sleep'].map(n => `<div class="complaint-item"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;"><div style="display:flex;gap:12px;align-items:center;"><div class="logo-icon" style="width:36px;height:36px;border-radius:12px;font-size:.9rem;"><i class="fas ${sceneIcons[n]}"></i></div><div><strong>${n} Scene</strong><div style="font-size:.85rem;color:#64748b">${n === 'Away' ? 'Power down and arm locks.' : 'Tap to run this preset.'}</div></div></div><button class="btn btn-primary" data-action="scene" data-scene="${n}">Run</button></div></div>`).join('');
  const suggestionRail = () => {
    const out = [];
    if (!s.home.security) out.push(['Arm the house before leaving', 'Away', 'Arm now', 'rose']);
    if (totalWatts() > 1200 || s.devices.filter(d => d.type === 'light' && d.on && d.level > 45).length >= 3) out.push(['Trim the energy curve', 'Eco', 'Apply Eco', 'teal']);
    const bed = dev('bedroom-climate'); if (bed && bed.temp > 22) out.push([`Lower bedroom climate from ${bed.temp} C`, 'Sleep', 'Set Sleep', 'amber']);
    if (out.length < 3) out.push(['Create one more automation', 'complaints', 'Open devices', 'sky']);
    return out.slice(0, 3).map(([title, target, label, tone]) => `<div class="complaint-item"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;"><div><strong>${esc(title)}</strong><p style="margin-top:.35rem">Small moves that improve comfort or save energy.</p></div><button class="btn ${tone === 'teal' ? 'btn-primary' : 'btn-outline'}" data-action="${target === 'complaints' ? 'page' : 'scene'}" ${target === 'complaints' ? 'data-page="complaints"' : `data-scene="${target}"`}>${label}</button></div></div>`).join('');
  };
  const activityRail = () => s.activity.map(a => `<div class="complaint-item"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;"><div style="display:flex;gap:12px;align-items:flex-start;"><div class="logo-icon" style="width:36px;height:36px;border-radius:12px;font-size:.9rem;"><i class="fas ${a.icon}"></i></div><div><strong>${esc(a.title)}</strong><p style="margin-top:.35rem">${esc(a.detail)}</p></div></div><span class="glass-tag">${ago(a.createdAt)}</span></div></div>`).join('');
  const sensors = () => [
    { icon: 'fa-door-open', title: 'Front door', detail: 'Primary entrance lock', value: dev('entry-lock')?.locked ? 'Locked' : 'Unlocked', tone: dev('entry-lock')?.locked ? 'resolved' : 'pending' },
    { icon: 'fa-warehouse', title: 'Garage door', detail: 'Vehicle access point', value: dev('garage-lock')?.locked ? 'Locked' : 'Unlocked', tone: dev('garage-lock')?.locked ? 'resolved' : 'pending' },
    { icon: 'fa-person-walking', title: 'Hall motion', detail: 'Passive motion sensor', value: s.home.security ? 'Armed' : 'Standby', tone: s.home.security ? 'resolved' : 'pending' },
    { icon: 'fa-wind', title: 'Kitchen air', detail: 'Smoke and air quality', value: 'Clear', tone: 'resolved' }
  ].map(x => `<div class="complaint-item"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;"><div style="display:flex;gap:12px;align-items:flex-start;"><div class="logo-icon" style="width:36px;height:36px;border-radius:12px;font-size:.9rem;"><i class="fas ${x.icon}"></i></div><div><strong>${x.title}</strong><p>${x.detail}</p></div></div><span class="status-badge ${x.tone}">${x.value}</span></div></div>`).join('');

  function updateHeader() {
    const set = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
    set('modeBadge', `<i class="fas fa-wand-magic-sparkles"></i> ${esc(s.home.mode)}`);
    set('securityBadge', `<i class="fas fa-shield-halved"></i> ${s.home.security ? 'Armed' : 'Secure'}`);
    set('energyBadge', `<i class="fas fa-bolt"></i> ${todayKwh()} kWh today`);
    document.querySelectorAll('.nav-link, .nav-link-mobile').forEach(link => link.classList.toggle('active', link.getAttribute('data-page') === page));
    document.title = `HomePulse | ${page.charAt(0).toUpperCase() + page.slice(1)}`;
  }
  function destroyCharts() { [c1, c2].forEach(c => c && c.destroy && c.destroy()); c1 = c2 = null; }
  function drawDashboard() {
    if (!window.Chart) return;
    const a = document.getElementById('weeklyChartCanvas')?.getContext('2d');
    const b = document.getElementById('categoryChartCanvas')?.getContext('2d');
    if (a) {
      const data = Array.from({ length: 24 }, (_, h) => +(totalWatts() / 1000 * ((h >= 0 && h <= 5 ? .58 : 1) + Math.max(0, 1 - Math.abs(h - 7) / 4) * .62 + Math.max(0, 1 - Math.abs(h - 20) / 5) * .78) + .14).toFixed(2));
      c1 = new Chart(a, { type: 'line', data: { labels: Array.from({ length: 24 }, (_, i) => `${i}:00`), datasets: [{ label: 'kWh', data, borderColor: '#58e0c3', backgroundColor: 'rgba(88,224,195,.18)', fill: true, tension: .32, pointRadius: 0, borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#99aec4' }, grid: { color: 'rgba(255,255,255,.08)' } }, y: { ticks: { color: '#99aec4' }, grid: { color: 'rgba(255,255,255,.08)' } } } } });
    }
    if (b) {
      const ar = rooms.filter(r => s.devices.some(d => d.room === r && on(d)));
      const data = ar.length ? ar.map(r => +(s.devices.filter(d => d.room === r && on(d)).reduce((a, d) => a + watts(d), 0) / 1000).toFixed(2)) : [0.12];
      c2 = new Chart(b, { type: 'doughnut', data: { labels: ar.length ? ar : ['Idle'], datasets: [{ data, backgroundColor: ['#58e0c3', '#61c6ff', '#f4b864', '#ff7676', '#b2f16d', '#86b7ff'], borderWidth: 0, hoverOffset: 4 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { color: '#99aec4', padding: 16 } } } } });
    }
  }
  function drawAnalytics() {
    if (!window.Chart) return;
    const a = document.getElementById('monthlyTrendChart')?.getContext('2d');
    const b = document.getElementById('efficiencyChart')?.getContext('2d');
    if (a) {
      const data = [0, 1, 2, 3, 4, 5, 6].map(i => +(todayKwh() * (.78 + i * .05) + .18 * Math.sin(i)).toFixed(2));
      c1 = new Chart(a, { type: 'line', data: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], datasets: [{ label: 'kWh', data, borderColor: '#61c6ff', backgroundColor: 'rgba(97,198,255,.12)', fill: true, tension: .3, pointRadius: 0, borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#99aec4' }, grid: { color: 'rgba(255,255,255,.08)' } }, y: { ticks: { color: '#99aec4' }, grid: { color: 'rgba(255,255,255,.08)' } } } } });
    }
    if (b) {
      const ar = rooms.filter(r => s.devices.some(d => d.room === r && on(d)));
      const data = ar.length ? ar.map(r => +(s.devices.filter(d => d.room === r && on(d)).reduce((a, d) => a + watts(d), 0) / 1000).toFixed(2)) : [0.12];
      c2 = new Chart(b, { type: 'bar', data: { labels: ar.length ? ar : ['Idle'], datasets: [{ label: 'kWh', data, backgroundColor: '#f4b864', borderRadius: 8 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#99aec4' }, grid: { color: 'rgba(255,255,255,.08)' } }, y: { ticks: { color: '#99aec4' }, grid: { color: 'rgba(255,255,255,.08)' } } } } });
    }
  }

  function renderDashboard() {
    const active = s.devices.filter(on).length;
    const roomsActive = new Set(s.devices.filter(on).map(d => d.room)).size;
    const enabled = s.automations.filter(a => a.enabled).length;
    document.getElementById('pageContainer').innerHTML = `
      <div class="page-header"><h1><i class="fas fa-house"></i> Smart Home Dashboard</h1><p>Live comfort, security, and energy at a glance.</p></div>
      <div class="city-status">
        <span class="glass-tag"><i class="fas fa-bolt"></i> ${todayKwh()} kWh today</span>
        <span class="glass-tag"><i class="fas fa-shield-halved"></i> ${s.home.security ? 'Armed' : 'Disarmed'}</span>
        <span class="glass-tag"><i class="fas fa-circle-nodes"></i> ${enabled} automations</span>
        <span class="glass-tag"><i class="fas fa-temperature-half"></i> ${s.home.temp} C target</span>
      </div>
      <div class="stats-grid">
        <div class="stat-big"><i class="fas fa-bolt"></i><div><h3>${active}</h3><span>Active devices</span></div></div>
        <div class="stat-big"><i class="fas fa-house"></i><div><h3>${roomsActive}</h3><span>Rooms active</span></div></div>
        <div class="stat-big"><i class="fas fa-leaf"></i><div><h3>${todayKwh()} kWh</h3><span>Energy today</span></div></div>
        <div class="stat-big"><i class="fas fa-shield-halved"></i><div><h3>${s.home.security ? 'Armed' : 'Open'}</h3><span>Security</span></div></div>
        <div class="stat-big"><i class="fas fa-sparkles"></i><div><h3>${comfort()}%</h3><span>Comfort score</span></div></div>
      </div>
      <div class="dashboard-charts">
        <div class="chart-card"><h3>24h Energy Trend</h3><canvas id="weeklyChartCanvas" width="400" height="250"></canvas></div>
        <div class="chart-card"><h3>Room Load Mix</h3><canvas id="categoryChartCanvas" width="400" height="250"></canvas></div>
      </div>
      <div class="complaints-layout">
        <div class="complaint-form-card">
          <h3><i class="fas fa-wand-magic-sparkles"></i> Quick Scenes</h3>
          <div class="quick-actions">${['Morning', 'Eco', 'Away', 'Sleep'].map(n => `<button class="btn btn-primary" data-action="scene" data-scene="${n}"><i class="fas ${sceneIcons[n]}"></i> ${n}</button>`).join('')}</div>
          <h3 style="margin-top:1rem"><i class="fas fa-lightbulb"></i> Smart Suggestions</h3>
          <div class="complaints-list">${suggestionRail()}</div>
        </div>
        <div class="complaints-list-container">
          <h3><i class="fas fa-house"></i> Rooms at a glance</h3>
          <div class="complaints-list">${rooms.map(r => roomCard(r, true)).join('')}</div>
          <h3 style="margin-top:1rem"><i class="fas fa-clock"></i> Recent Activity</h3>
          <div class="complaints-list">${activityRail()}</div>
        </div>
      </div>`;
  }

  function renderMap() {
    document.getElementById('pageContainer').innerHTML = `
      <div class="page-header"><h1><i class="fas fa-map-marked-alt"></i> Home Layout</h1><p>Room markers and device status across the house.</p></div>
      <div class="city-status">
        <span class="glass-tag"><i class="fas fa-house"></i> ${s.home.name}</span>
        <span class="glass-tag"><i class="fas fa-bolt"></i> ${s.devices.filter(on).length} active devices</span>
        <span class="glass-tag"><i class="fas fa-shield-halved"></i> ${s.home.security ? 'Armed' : 'Disarmed'}</span>
      </div>
      <div id="mapContainer" style="height:520px;width:100%;border-radius:28px;overflow:hidden;box-shadow:0 12px 28px -8px rgba(0,0,0,.2);margin-bottom:1rem;"></div>
      <div class="map-legend">
        <span><i class="fas fa-circle" style="color:#22c55e;"></i> Active room</span>
        <span><i class="fas fa-circle" style="color:#ef4444;"></i> Idle room</span>
        <span><i class="fas fa-map-pin"></i> Room marker</span>
      </div>`;
  }

  function initMap() {
    if (map) { map.remove(); map = null; }
    const el = document.getElementById('mapContainer'); if (!el) return;
    map = L.map('mapContainer').setView([28.6139, 77.209], 14);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    const coords = { 'Living Room': [28.617, 77.204], Kitchen: [28.615, 77.212], Bedroom: [28.611, 77.208], Office: [28.614, 77.215], Entry: [28.618, 77.21], Garage: [28.612, 77.203] };
    rooms.forEach(room => { const m = roomM(room); const color = m.active ? '#22c55e' : '#ef4444'; L.circleMarker(coords[room], { radius: 10, color, fillColor: color, fillOpacity: .8, weight: 2 }).addTo(map).bindPopup(`<b>${esc(room)}</b><br>${m.active}/${m.total} active devices<br>${m.load} kW load`); });
    L.polygon([[28.62, 77.2], [28.62, 77.22], [28.606, 77.22], [28.606, 77.2]], { color: '#61c6ff', weight: 1, fillOpacity: 0.04 }).addTo(map);
  }

  function renderDevices() {
    const opts = rooms.map(r => `<option value="${r}">${r}</option>`).join('');
    const types = ['light', 'climate', 'appliance', 'entertainment', 'security'].map(t => `<option value="${t}">${t}</option>`).join('');
    document.getElementById('pageContainer').innerHTML = `
      <div class="page-header"><h1><i class="fas fa-plug"></i> Devices and Routines</h1><p>Add devices, manage room controls, and keep automations close at hand.</p></div>
      <div class="complaints-layout">
        <div class="complaint-form-card">
          <h3><i class="fas fa-plus-circle"></i> Add Device</h3>
          <form id="deviceForm">
            <input type="text" id="deviceName" placeholder="Device name" required>
            <select id="deviceRoom">${opts}</select>
            <select id="deviceType">${types}</select>
            <input type="number" id="devicePower" placeholder="Power draw (watts)">
            <button type="submit" class="btn btn-primary"><i class="fas fa-plus"></i> Save Device</button>
          </form>
          <h3 style="margin-top:1rem"><i class="fas fa-wand-magic-sparkles"></i> Routine Templates</h3>
          <div class="quick-actions">
            <button class="btn btn-outline" data-action="prefill" data-template="Sunrise">Sunrise</button>
            <button class="btn btn-outline" data-action="prefill" data-template="Night">Night</button>
            <button class="btn btn-outline" data-action="prefill" data-template="Vacation">Vacation</button>
          </div>
          <form id="routineForm" style="margin-top:1rem">
            <input type="text" id="routineName" placeholder="Routine name" required>
            <select id="routineRoom">${opts}</select>
            <input type="text" id="routineTrigger" placeholder="Trigger (11:00 PM, motion, sunrise)" required>
            <textarea id="routineAction" rows="3" placeholder="What should happen?" required></textarea>
            <button type="submit" class="btn btn-primary"><i class="fas fa-robot"></i> Save Routine</button>
          </form>
        </div>
        <div class="complaints-list-container">
          <h3><i class="fas fa-house"></i> Connected Devices</h3>
          <div id="devicesList" class="complaints-list"></div>
          <h3 style="margin-top:1rem"><i class="fas fa-robot"></i> Automation Routines</h3>
          <div id="routinesList" class="complaints-list"></div>
        </div>
      </div>`;
    renderDevicesList();
    renderRoutinesList();
  }

  function renderDevicesList() {
    const el = document.getElementById('devicesList'); if (!el) return;
    const ordered = [...s.devices.filter(d => d.room === s.selectedRoom), ...s.devices.filter(d => d.room !== s.selectedRoom)];
    el.innerHTML = ordered.map(deviceCard).join('');
  }

  function renderRoutinesList() {
    const el = document.getElementById('routinesList'); if (!el) return;
    el.innerHTML = s.automations.map(autoCard).join('');
  }

  function renderAnalytics() {
    const r = rooms.map(roomM);
    document.getElementById('pageContainer').innerHTML = `
      <div class="page-header"><h1><i class="fas fa-chart-line"></i> Energy Analytics</h1><p>Track usage, room load, and the biggest opportunities to save power.</p></div>
      <div class="dashboard-charts">
        <div class="chart-card"><h3>Weekly Consumption</h3><canvas id="monthlyTrendChart" height="200"></canvas></div>
        <div class="chart-card"><h3>Room Load</h3><canvas id="efficiencyChart" height="200"></canvas></div>
      </div>
      <div class="stats-grid">
        <div class="stat-big"><i class="fas fa-bolt"></i><div><h3>${todayKwh()} kWh</h3><span>Today</span></div></div>
        <div class="stat-big"><i class="fas fa-dollar-sign"></i><div><h3>$${cost()}</h3><span>Estimated cost</span></div></div>
        <div class="stat-big"><i class="fas fa-sparkles"></i><div><h3>${comfort()}%</h3><span>Comfort score</span></div></div>
        <div class="stat-big"><i class="fas fa-leaf"></i><div><h3>${Math.max(62, 96 - Math.round(totalWatts() / 40))}%</h3><span>Green score</span></div></div>
        <div class="stat-big"><i class="fas fa-signal"></i><div><h3>${(s.devices.filter(d => !on(d)).length * 0.25).toFixed(1)} W</h3><span>Standby load</span></div></div>
      </div>
      <div class="complaints-layout">
        <div class="complaint-form-card">
          <h3><i class="fas fa-lightbulb"></i> Energy Tips</h3>
          <div class="complaints-list">
            <div class="complaint-item"><strong>Dim shared lights</strong><p>Lower living room and kitchen lights to shave off noticeable load.</p></div>
            <div class="complaint-item"><strong>Use Eco mode overnight</strong><p>Eco mode keeps comfort steady while reducing entertainment and workstation power.</p></div>
            <div class="complaint-item"><strong>Keep the climate steady</strong><p>Settling the bedroom climate at 21 to 22 C usually keeps the system efficient.</p></div>
          </div>
        </div>
        <div class="complaints-list-container">
          <h3><i class="fas fa-house"></i> Room breakdown</h3>
          <div class="complaints-list">${r.map(m => `<div class="complaint-item"><strong>${esc(m.room)}</strong><p>${m.active}/${m.total} active devices</p><span class="glass-tag">${m.load} kW</span></div>`).join('')}</div>
        </div>
      </div>`;
  }

  function renderProfile() {
    document.getElementById('pageContainer').innerHTML = `
      <div class="page-header"><h1><i class="fas fa-shield-halved"></i> Security Center</h1><p>Review home status, sensors, alerts, and recent activity.</p></div>
      <div class="profile-grid">
        <div class="profile-card" style="text-align:center; padding:2rem;">
          <div class="avatar-large"><i class="fas fa-house-lock"></i></div>
          <h2>${esc(s.home.name)}</h2>
          <p>${esc(s.home.owner)}</p>
          <p><i class="fas fa-circle-check" style="color:#3b82f6;"></i> ${s.home.mode} Mode</p>
          <p style="margin-top:.5rem"><span class="glass-tag">${s.home.security ? 'Armed' : 'Disarmed'}</span> <span class="glass-tag">${s.home.temp} C target</span></p>
          <button id="editHomeBtn" class="btn btn-outline" style="margin-top:1rem;"><i class="fas fa-edit"></i> Edit Home</button>
          <button class="btn btn-primary" style="margin-top:.7rem;" data-action="toggle-security"><i class="fas fa-shield-halved"></i> ${s.home.security ? 'Disarm' : 'Arm'} security</button>
        </div>
        <div class="profile-card" style="padding:1.5rem;">
          <h3><i class="fas fa-sensor"></i> Sensors</h3>
          <div class="complaints-list">${sensors()}</div>
          <h3 style="margin-top:1rem"><i class="fas fa-bell"></i> Recent Alerts</h3>
          <div class="complaints-list">${s.alerts.map(a => `<div class="complaint-item"><div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;"><div><strong>${esc(a.title)}</strong><p>${esc(a.detail)}</p><div style="margin-top:.35rem"><span class="glass-tag">${ago(a.createdAt)}</span> <span class="glass-tag">${a.ack ? 'Acknowledged' : 'Active'}</span></div></div>${a.ack ? '<span class="glass-tag"><i class="fas fa-check"></i> Clear</span>' : `<button class="btn btn-outline" data-action="ack" data-id="${a.id}">Acknowledge</button>`}</div></div>`).join('')}</div>
          <h3 style="margin-top:1rem"><i class="fas fa-history"></i> Recent Activity</h3>
          <div class="complaints-list">${activities()}</div>
        </div>
      </div>`;
    document.getElementById('editHomeBtn')?.addEventListener('click', () => {
      const name = prompt('Update home name', s.home.name); if (name && name.trim()) s.home.name = name.trim();
      const owner = prompt('Update owner', s.home.owner); if (owner && owner.trim()) s.home.owner = owner.trim();
      save(); render();
    });
  }

  function render() {
    updateHeader();
    destroyCharts();
    if (map && page !== 'map') { map.remove(); map = null; }
    if (page === 'dashboard') renderDashboard();
    else if (page === 'map') renderMap();
    else if (page === 'complaints') renderDevices();
    else if (page === 'analytics') renderAnalytics();
    else renderProfile();
    if (page === 'dashboard') drawDashboard();
    if (page === 'analytics') drawAnalytics();
    if (page === 'map') setTimeout(initMap, 60);
  }

  function selectRoom(room) { s.selectedRoom = room; save(); page = 'complaints'; render(); }
  function handleClick(e) {
    const nav = e.target.closest('[data-page]');
    if (nav && nav.matches('a, button')) {
      e.preventDefault();
      page = nav.getAttribute('data-page');
      if (page === 'complaints' && !rooms.includes(s.selectedRoom)) s.selectedRoom = rooms[0];
      render();
      closeDrawer();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const act = e.target.closest('[data-action]'); if (!act) return;
    const a = act.getAttribute('data-action');
    if (a === 'scene') scene(act.getAttribute('data-scene'));
    else if (a === 'toggle-security') { setLocks(!s.home.security); s.home.mode = s.home.security ? 'Away' : 'Home'; addAct(s.home.security ? 'Security armed' : 'Security disarmed', s.home.security ? 'All security devices were locked.' : 'The home returned to open access.', s.home.security ? 'rose' : 'sky', s.home.security ? 'fa-lock' : 'fa-unlock'); save(); render(); }
    else if (a === 'toggle-device') toggleDevice(act.getAttribute('data-id'));
    else if (a === 'toggle-auto') toggleAuto(act.getAttribute('data-id'));
    else if (a === 'delete-auto') delAuto(act.getAttribute('data-id'));
    else if (a === 'ack-alert' || a === 'ack') ack(act.getAttribute('data-id'));
    else if (a === 'select-room') selectRoom(act.getAttribute('data-room'));
    else if (a === 'prefill') prefill(act.getAttribute('data-template'));
  }
  function handleChange(e) {
    const t = e.target;
    if (t.matches('input[type="range"][data-action="set-level"]')) setLevel(t.getAttribute('data-id'), t.value);
    if (t.matches('input[type="range"][data-action="set-temp"]')) setTemp(t.getAttribute('data-id'), t.value);
  }
  function handleSubmit(e) {
    if (e.target?.id === 'deviceForm') { e.preventDefault(); addDevice(e.target); }
    if (e.target?.id === 'routineForm') { e.preventDefault(); addRoutine(e.target); }
  }
  function openDrawer() { const d = document.getElementById('mobileDrawer'); const b = document.getElementById('backdrop'); d?.classList.add('open'); d?.setAttribute('aria-hidden', 'false'); b?.classList.add('open'); }
  function closeDrawer() { const d = document.getElementById('mobileDrawer'); const b = document.getElementById('backdrop'); d?.classList.remove('open'); d?.setAttribute('aria-hidden', 'true'); b?.classList.remove('open'); }
  function bind() {
    document.addEventListener('click', handleClick);
    document.addEventListener('change', handleChange);
    document.addEventListener('submit', handleSubmit);
    document.getElementById('mobileMenuBtn')?.addEventListener('click', openDrawer);
    document.getElementById('closeDrawer')?.addEventListener('click', closeDrawer);
    document.getElementById('backdrop')?.addEventListener('click', closeDrawer);
    window.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { bind(); render(); });
  else { bind(); render(); }
})();
