// Nopa supporter page. No build step, no account: everything goes through the SQL functions
// the anon key may call, plus one upload into the notes bucket.
(function () {
  'use strict';

  var CONFIG = window.NOPA_CONFIG || {};
  var SAMPLE_RATE = 22050;      // stored messages are mono 16-bit WAV at this rate
  var MAX_SECONDS = 60;
  var WEEKS = 5;
  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var TITLES = { easy: 'an easy one', hard: 'a hard one', long: 'a long one' };

  var $ = function (id) { return document.getElementById(id); };
  var token = new URLSearchParams(location.search).get('c');

  var corner = null;            // { name, athlete_name, finish_date, streak_weeks, this_week_kept }
  var plan = [];                // [{ id, day, kind, minutes, messages }]
  var picked = null;            // a day (YYYY-MM-DD) tapped on the calendar
  var target = null;            // the session the message is for; null is "any time"
  var recording = null;
  var note = null;              // { wav, durationMs, url }
  var sentNoteId = null;

  // ---------- backend ----------
  function headers(extra) {
    var h = { apikey: CONFIG.supabaseAnonKey, Authorization: 'Bearer ' + CONFIG.supabaseAnonKey };
    for (var k in extra) h[k] = extra[k];
    return h;
  }
  function rpc(name, args) {
    return fetch(CONFIG.supabaseUrl + '/rest/v1/rpc/' + name, {
      method: 'POST', headers: headers({ 'Content-Type': 'application/json' }), body: JSON.stringify(args),
    }).then(function (res) {
      return res.text().then(function (text) {
        var body = text ? JSON.parse(text) : null;
        if (!res.ok) throw new Error((body && body.message) || 'Request failed');
        return body;
      });
    });
  }
  function uploadWav(path, blob) {
    return fetch(CONFIG.supabaseUrl + '/storage/v1/object/notes/' + path, {
      method: 'POST', headers: headers({ 'Content-Type': 'audio/wav' }), body: blob,
    }).then(function (res) { if (!res.ok) throw new Error('Upload failed'); });
  }
  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    var b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
    var h = Array.prototype.map.call(b, function (x) { return (x < 16 ? '0' : '') + x.toString(16); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }

  // ---------- days and words ----------
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parse(s) { var p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function addDays(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return iso(d); }
  function daysBetween(a, b) { var x = parse(a), y = parse(b); return Math.round((Date.UTC(y.getFullYear(), y.getMonth(), y.getDate()) - Date.UTC(x.getFullYear(), x.getMonth(), x.getDate())) / 864e5); }
  function fmtDate(s) { var d = parse(s); return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }
  function dayLabel(s) {
    var today = iso(new Date()), n = daysBetween(today, s), d = parse(s);
    if (n === 0) return 'Today'; if (n === 1) return 'Tomorrow';
    return n < 7 ? DAYS[d.getDay()] : DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()];
  }
  function howLong(min) { if (min < 60) return min + ' minutes'; var h = Math.floor(min / 60), m = min % 60; return (h === 1 ? '1 hour' : h + ' hours') + (m ? ' ' + m : ''); }
  function phrase(s) { var l = dayLabel(s.day); return (l === 'Today' || l === 'Tomorrow' ? l.toLowerCase() : l) + "'s " + TITLES[s.kind].replace(/^an? /, ''); }
  function mmss(ms) { var s = Math.floor(ms / 1000); return Math.floor(s / 60) + ':' + pad(s % 60); }
  function who() { return corner.athlete_name || 'them'; }
  function sessionOn(day) { for (var i = 0; i < plan.length; i++) if (plan[i].day === day) return plan[i]; return null; }
  function show(view) {
    ['loading', 'notfound', 'offline', 'pick', 'note', 'sent'].forEach(function (v) { $('v-' + v).hidden = v !== view; });
    window.scrollTo(0, 0);
  }

  // ---------- weeks side by side ----------
  function drawTogether() {
    var box = $('p-together'), weeks = corner.streak_weeks || 0, kept = !!corner.this_week_kept, name = who();
    box.textContent = '';
    var row = el('div', 'weeks'); row.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < Math.min(weeks, 12) - (kept ? 1 : 0); i++) row.appendChild(el('i', 'on'));
    row.appendChild(el('i', kept ? 'on' : ''));               // this week: filled once someone has been there
    box.appendChild(row);
    var head, sub;
    if (weeks === 0) {
      head = 'Be the first one there';
      sub = 'One message from you and ' + name + ' is not doing this alone.';
    } else {
      head = weeks === 1 ? 'One week side by side' : weeks + ' weeks side by side';
      var every = weeks === 1 ? 'this week' : 'every week for ' + weeks + ' weeks';
      sub = kept ? 'Someone has been there for ' + name + ' ' + every + (weeks === 1 ? '' : ', this week too') + '.'
        : 'Someone has been there for ' + name + ' ' + every + '. This week is still open. Will it be you?';
    }
    var b = el('b', null, head); b.id = 'together-head'; box.appendChild(b);
    var s = el('span', 'soft', sub); s.id = 'together-sub'; box.appendChild(s);
  }

  // ---------- the calendar ----------
  function drawCalendar() {
    var box = $('p-cal'), today = iso(new Date());
    var start = addDays(today, -((parse(today).getDay() + 6) % 7)), end = addDays(start, WEEKS * 7 - 1);
    box.textContent = '';
    var a = parse(start).getMonth(), z = parse(end).getMonth();
    box.appendChild(el('div', 'mo', a === z ? MONTHS[a] : MONTHS[a] + ' – ' + MONTHS[z]));
    ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach(function (w) { box.appendChild(el('div', 'wd', w)); });
    for (var i = 0; i < WEEKS * 7; i++) (function (day) {
      var s = sessionOn(day), past = day < today, can = s && !past, d = parse(day);
      var cell = el(can ? 'button' : 'div', 'd' + (s ? ' has' : '') + (day === today ? ' today' : '') + (day === picked ? ' sel' : '') + (past ? ' past' : ''));
      cell.appendChild(el('span', 'n', String(d.getDate())));
      var m = el('span', 'm');
      if (can) {
        if (s.messages === 0) m.appendChild(el('i', 'none'));
        for (var k = 0; k < Math.min(s.messages, 3); k++) m.appendChild(el('i'));
        if (s.messages > 3) m.appendChild(el('span', null, '+'));
      }
      cell.appendChild(m);
      cell.setAttribute('data-day', day);
      cell.setAttribute('aria-label', DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] +
        (can ? ', ' + TITLES[s.kind] + ', ' + (s.messages === 0 ? 'no one yet' : s.messages === 1 ? '1 message' : s.messages + ' messages') : ''));
      if (can) cell.onclick = function () { picked = day; drawPick(); };
      box.appendChild(cell);
    })(addDays(start, i));
  }
  function drawPick() {
    $('p-who').textContent = (corner.athlete_name || 'Someone close to you') + ' is working towards';
    $('p-name').textContent = corner.name;
    $('p-date').textContent = fmtDate(corner.finish_date);
    document.title = corner.name + ' – Nopa';
    drawTogether();
    var today = iso(new Date()), open = plan.filter(function (s) { return s.day >= today; });
    $('p-ask').textContent = open.length ? 'Pick a day to be there for ' + who() + '.' : 'Leave a message for ' + who() + "'s next training day.";
    $('p-any').textContent = open.length ? 'Or any time' : 'Leave a message';
    drawCalendar();
    var box = $('p-day'), s = picked ? sessionOn(picked) : null;
    box.textContent = ''; box.hidden = !s;
    if (s) {
      box.appendChild(el('b', null, dayLabel(s.day) + ', ' + TITLES[s.kind]));
      box.appendChild(el('p', 'soft', howLong(s.minutes) + '. ' + (s.messages === 0 ? 'No one is there yet.' : s.messages === 1 ? 'One person is already there.' : s.messages + ' people are already there.')));
      var go = el('button', 'btn main', s.messages === 0 ? 'Be the first' : 'Be there too'); go.id = 'p-go';
      go.onclick = function () { openNote(s); };
      box.appendChild(go);
    }
  }
  function load() {
    return Promise.all([rpc('get_corner_by_token', { p_token: token }), rpc('get_plan_by_token', { p_token: token })]).then(function (r) {
      if (!r[0] || !r[0].length) { var e = new Error('not found'); e.notFound = true; throw e; }
      corner = r[0][0]; plan = r[1] || [];
    });
  }

  // ---------- audio: whatever the browser recorded -> mono 16-bit WAV ----------
  // An OfflineAudioContext decodes (and resamples) without touching the device's audio output.
  function decodeToMono(blob) {
    return blob.arrayBuffer().then(function (ab) {
      var OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      var ctx = new OAC(1, SAMPLE_RATE, SAMPLE_RATE);
      return new Promise(function (res, rej) {
        var p = ctx.decodeAudioData(ab, res, rej);
        if (p && p.catch) p.catch(rej);
      });
    }).then(function (buf) {
      var n = buf.length, mono = new Float32Array(n), ch = buf.numberOfChannels;
      for (var c = 0; c < ch; c++) {
        var d = buf.getChannelData(c);
        for (var i = 0; i < n; i++) mono[i] += d[i] / ch;
      }
      if (buf.sampleRate !== SAMPLE_RATE) {   // the browser did not resample: do it linearly
        var ratio = buf.sampleRate / SAMPLE_RATE, m = Math.floor(n / ratio), out = new Float32Array(m);
        for (var j = 0; j < m; j++) {
          var x = j * ratio, x0 = Math.floor(x), x1 = Math.min(x0 + 1, n - 1);
          out[j] = mono[x0] + (mono[x1] - mono[x0]) * (x - x0);
        }
        mono = out;
      }
      if (mono.length > MAX_SECONDS * SAMPLE_RATE) mono = mono.subarray(0, MAX_SECONDS * SAMPLE_RATE);
      return mono;
    });
  }
  function wavFromMono(f32) {
    var n = f32.length, pcm = new Int16Array(n);
    for (var i = 0; i < n; i++) pcm[i] = Math.round(Math.max(-1, Math.min(1, f32[i])) * 32767);
    var bytes = n * 2, hd = new DataView(new ArrayBuffer(44));
    var str = function (o, s) { for (var k = 0; k < s.length; k++) hd.setUint8(o + k, s.charCodeAt(k)); };
    str(0, 'RIFF'); hd.setUint32(4, 36 + bytes, true); str(8, 'WAVE'); str(12, 'fmt ');
    hd.setUint32(16, 16, true); hd.setUint16(20, 1, true); hd.setUint16(22, 1, true);
    hd.setUint32(24, SAMPLE_RATE, true); hd.setUint32(28, SAMPLE_RATE * 2, true); hd.setUint16(32, 2, true);
    hd.setUint16(34, 16, true); str(36, 'data'); hd.setUint32(40, bytes, true);
    return new Blob([hd.buffer, pcm.buffer], { type: 'audio/wav' });
  }

  // ---------- recording ----------
  function step(which) { $('n-record').hidden = which !== 'record'; $('n-review').hidden = which !== 'review'; }
  function resetRecord() {
    $('n-timer').hidden = true; $('n-rec').textContent = 'Record'; $('n-rec').className = 'btn main'; $('n-rec').disabled = false;
  }
  function recordError(msg) { $('n-rec-oops').textContent = msg; $('n-rec-oops').hidden = false; }
  function openNote(session) {
    target = session;
    $('n-for').textContent = session ? 'For ' + phrase(session) : 'Any time';
    $('n-rec-oops').hidden = true; $('n-send-oops').hidden = true;
    resetRecord(); step('record'); show('note');
  }
  function startRecording() {
    $('n-rec-oops').hidden = true;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
      recordError("This browser can't record sound. Try opening the link in Safari or Chrome.");
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      var recorder = new MediaRecorder(stream), chunks = [];
      recorder.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      recorder.onstop = function () {
        stream.getTracks().forEach(function (t) { t.stop(); });   // let go of the microphone
        clearInterval(recording.tick); clearTimeout(recording.stopTimer);
        recording = null;
        finishRecording(new Blob(chunks, { type: recorder.mimeType || (chunks[0] && chunks[0].type) || '' }));
      };
      recording = { recorder: recorder, startedAt: Date.now() };
      recording.tick = setInterval(function () { $('n-timer').textContent = mmss(Date.now() - recording.startedAt); }, 250);
      recording.stopTimer = setTimeout(stopRecording, MAX_SECONDS * 1000);
      recorder.start();
      $('n-timer').textContent = '0:00'; $('n-timer').hidden = false;
      $('n-rec').textContent = 'Stop'; $('n-rec').className = 'btn main red';
    }).catch(function () {
      recordError("We couldn't reach your microphone. Allow microphone access for this page in your browser, then try again.");
    });
  }
  function stopRecording() {
    if (recording && recording.recorder.state !== 'inactive') recording.recorder.stop();
  }
  function finishRecording(blob) {
    $('n-rec').disabled = true; $('n-rec').textContent = 'One moment…';
    decodeToMono(blob).then(function (mono) {
      if (mono.length < SAMPLE_RATE * 0.5) throw new Error('too short');
      if (note) URL.revokeObjectURL(note.url);
      var wav = wavFromMono(mono);
      note = { wav: wav, durationMs: Math.round((mono.length / SAMPLE_RATE) * 1000), url: URL.createObjectURL(wav) };
      $('n-preview').src = note.url;
      resetRecord(); step('review');
    }).catch(function () {
      resetRecord();
      recordError("That recording didn't come through. Please try once more.");
    });
  }

  // ---------- sending ----------
  function sendNote() {
    var name = $('n-first').value.trim(), oops = $('n-send-oops');
    oops.hidden = true;
    if (!name) {
      oops.textContent = 'Add your first name, so ' + who() + ' knows it is you.'; oops.hidden = false;
      $('n-first').focus();
      return;
    }
    $('n-send').disabled = true; $('n-redo').disabled = true; $('n-send').textContent = 'Sending…';
    var path = 'inbox/' + uuid() + '.wav';
    uploadWav(path, note.wav).then(function () {
      return rpc('submit_note', { p_token: token, p_sender_name: name, p_audio_path: path, p_duration_ms: note.durationMs, p_session_id: target ? target.id : null });
    }).then(function (noteId) {
      sentNoteId = noteId;
      $('n-preview').pause();
      $('t-line').textContent = target ? who() + ' will hear you somewhere along ' + phrase(target) + '.' : who() + ' will hear you the next time they train.';
      $('t-contact-label').textContent = 'Want to know when ' + who() + ' has heard it?';
      $('t-contact').value = ''; $('t-oops').hidden = true;
      $('t-ask').hidden = false; $('t-done').hidden = true; $('t-another').hidden = true;
      show('sent');
      load().catch(function () {});   // so the calendar and the weeks side by side are fresh
    }).catch(function () {
      oops.textContent = "Your message didn't go through. Check your connection and try again."; oops.hidden = false;
    }).then(function () {
      $('n-send').disabled = false; $('n-redo').disabled = false; $('n-send').textContent = 'Send';
    });
  }

  // ---------- optional contact ----------
  function contactDone(message) {
    $('t-ask').hidden = true; $('t-done').textContent = message; $('t-done').hidden = false; $('t-another').hidden = false;
  }
  function saveContact() {
    var contact = $('t-contact').value.trim(), oops = $('t-oops');
    oops.hidden = true;
    if (contact.length < 3) { oops.textContent = 'Add an email or phone number, or choose "no thanks".'; oops.hidden = false; return; }
    $('t-save').disabled = true;
    rpc('add_note_contact', { p_note_id: sentNoteId, p_contact: contact }).then(function () {
      contactDone("We'll let you know when " + who() + ' has listened.');
    }).catch(function () {
      oops.textContent = "That didn't save. Please try again."; oops.hidden = false;
    }).then(function () { $('t-save').disabled = false; });
  }

  function init() {
    $('p-any').onclick = function () { openNote(null); };
    $('n-back').onclick = function () { stopRecording(); $('n-preview').pause(); show('pick'); };
    $('n-rec').onclick = function () { recording ? stopRecording() : startRecording(); };
    $('n-redo').onclick = function () { $('n-preview').pause(); step('record'); };
    $('n-send').onclick = sendNote;
    $('t-save').onclick = saveContact;
    $('t-skip').onclick = function () { contactDone('All done. Thank you for being there.'); };
    $('t-another').onclick = function () { picked = null; drawPick(); show('pick'); };

    if (!token) { show('notfound'); return; }
    load().then(function () { drawPick(); show('pick'); }).catch(function (e) { show(e && e.notFound ? 'notfound' : 'offline'); });
  }

  init();
})();
