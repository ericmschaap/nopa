// Nopa supporter page. No build step, no account: everything goes through the three SQL
// functions the anon key may call, plus one upload into the notes bucket.
(function () {
  'use strict';

  var CONFIG = window.NOPA_CONFIG || {};
  var SAMPLE_RATE = 22050;      // stored notes are mono 16-bit WAV at this rate
  var MAX_SECONDS = 60;

  var $ = function (id) { return document.getElementById(id); };
  var show = function (el, on) { el.hidden = !on; };
  var token = new URLSearchParams(location.search).get('c');

  var corner = null;            // { name, finish_date, ... }
  var recording = null;         // { recorder, stream, startedAt, tick, stopTimer }
  var note = null;              // { wav: Blob, durationMs, url }
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
  function mmss(ms) {
    var s = Math.floor(ms / 1000);
    return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60);
  }
  function recordError(msg) {
    $('record-error').textContent = msg;
    show($('record-error'), true);
  }
  function startRecording() {
    show($('record-error'), false);
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
      recording.tick = setInterval(function () { $('timer').textContent = mmss(Date.now() - recording.startedAt); }, 250);
      recording.stopTimer = setTimeout(stopRecording, MAX_SECONDS * 1000);
      recorder.start();
      $('timer').textContent = '0:00';
      show($('timer'), true);
      $('btn-record').textContent = 'Stop';
      $('btn-record').className = 'recording';
    }).catch(function () {
      recordError("We couldn't reach your microphone. Allow microphone access for this page in your browser, then try again.");
    });
  }
  function stopRecording() {
    if (recording && recording.recorder.state !== 'inactive') recording.recorder.stop();
  }
  function resetRecordStep() {
    show($('timer'), false);
    $('btn-record').textContent = 'Record a note';
    $('btn-record').className = 'primary';
    $('btn-record').disabled = false;
  }
  function finishRecording(blob) {
    $('btn-record').disabled = true;
    $('btn-record').textContent = 'One moment…';
    decodeToMono(blob).then(function (mono) {
      if (mono.length < SAMPLE_RATE * 0.5) throw new Error('too short');
      if (note) URL.revokeObjectURL(note.url);
      var wav = wavFromMono(mono);
      note = { wav: wav, durationMs: Math.round((mono.length / SAMPLE_RATE) * 1000), url: URL.createObjectURL(wav) };
      $('preview').src = note.url;
      resetRecordStep();
      show($('step-record'), false);
      show($('step-review'), true);
    }).catch(function () {
      resetRecordStep();
      recordError("That recording didn't come through. Please try once more.");
    });
  }

  // ---------- sending ----------
  function sendNote() {
    var name = $('first-name').value.trim();
    show($('send-error'), false);
    if (!name) {
      $('send-error').textContent = 'Please add your first name so they know who it is from.';
      show($('send-error'), true);
      $('first-name').focus();
      return;
    }
    $('btn-send').disabled = true; $('btn-redo').disabled = true;
    $('btn-send').textContent = 'Sending…';
    var path = 'inbox/' + uuid() + '.wav';
    uploadWav(path, note.wav).then(function () {
      return rpc('submit_note', { p_token: token, p_sender_name: name, p_audio_path: path, p_duration_ms: note.durationMs });
    }).then(function (noteId) {
      sentNoteId = noteId;
      $('preview').pause();
      $('sent-line').textContent = 'Your note will be waiting for a training session on the way to ' + corner.name + '.';
      show($('step-review'), false);
      show($('contact-form'), true); show($('contact-done'), false); show($('btn-another'), false);
      $('contact').value = '';
      show($('step-sent'), true);
      loadCorner().catch(function () {});   // refresh what the page shows about the corner
    }).catch(function () {
      $('send-error').textContent = "Your note didn't go through. Check your connection and try again.";
      show($('send-error'), true);
    }).then(function () {
      $('btn-send').disabled = false; $('btn-redo').disabled = false;
      $('btn-send').textContent = 'Send note';
    });
  }

  // ---------- optional contact ----------
  function contactDone(message) {
    show($('contact-form'), false);
    $('contact-done').textContent = message;
    show($('contact-done'), true);
    show($('btn-another'), true);
  }
  function saveContact() {
    var contact = $('contact').value.trim();
    show($('contact-error'), false);
    if (contact.length < 3) {
      $('contact-error').textContent = 'Add an email or phone number, or choose "No thanks".';
      show($('contact-error'), true);
      return;
    }
    $('btn-contact').disabled = true;
    rpc('add_note_contact', { p_note_id: sentNoteId, p_contact: contact }).then(function () {
      contactDone("Lovely. We'll let you know when they've listened.");
    }).catch(function () {
      $('contact-error').textContent = "That didn't save. Please try again.";
      show($('contact-error'), true);
    }).then(function () { $('btn-contact').disabled = false; });
  }

  // ---------- corner ----------
  function formatDate(iso) {
    var p = iso.split('-');
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]))
      .toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
  }
  function renderCorner() {
    $('corner-name').textContent = corner.name;
    $('corner-date').textContent = 'Finish day: ' + formatDate(corner.finish_date);
    document.title = corner.name + ' – Nopa';
    renderStreak();
  }
  function renderStreak() { show($('corner-streak'), false); }

  function loadCorner() {
    return rpc('get_corner_by_token', { p_token: token }).then(function (rows) {
      if (!rows || !rows.length) { var e = new Error('not found'); e.notFound = true; throw e; }
      corner = rows[0];
      renderCorner();
    });
  }

  function init() {
    $('btn-record').onclick = function () { recording ? stopRecording() : startRecording(); };
    $('btn-redo').onclick = function () {
      $('preview').pause();
      show($('step-review'), false); show($('step-record'), true);
    };
    $('btn-send').onclick = sendNote;
    $('btn-contact').onclick = saveContact;
    $('btn-skip').onclick = function () { contactDone('All done. Thank you for being in their corner.'); };
    $('btn-another').onclick = function () {
      show($('step-sent'), false); show($('step-record'), true);
    };

    if (!token) { show($('view-loading'), false); show($('view-notfound'), true); return; }
    loadCorner().then(function () {
      show($('view-corner'), true);
    }).catch(function (e) {
      show($(e && e.notFound ? 'view-notfound' : 'view-offline'), true);
    }).then(function () { show($('view-loading'), false); });
  }

  init();
})();
