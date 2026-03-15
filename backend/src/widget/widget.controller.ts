import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('Widget')
@Controller('widget')
export class WidgetController {
  @Get('widget.js')
  serveWidget(@Query('v') version: string, @Res() res: Response) {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const script = this.generateWidgetScript();
    res.send(script);
  }

  private generateWidgetScript(): string {
    const apiBase = process.env.BACKEND_URL || 'http://localhost:4000/api';
    // cache-bust on each deploy
    const _v = Date.now();

    return `
(function() {
'use strict';

/* ───────── STATE ───────── */
var HA = {
  cfg: {}, color: '#6366f1',
  sessionId: null,
  isThinking: false,
  isRecording: false,
  camStream: null,
  camEnabled: true,
  /* Simli WebRTC */
  pc: null, simliWs: null, simliOpen: false,
  audioQueue: [],       // PCM chunks waiting until Simli WS is open
  audioCtx: null,       // AudioContext created on user gesture
  simliE2E: false,      // true = E2E session (send text, Simli does TTS)
  heygenSessionId: null,
  /* speech */
  recognition: null,

/* ───────── BOOT ───────── */
  init: function(cfg) {
    this.cfg = cfg;
    this.color = cfg.color || '#6366f1';
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', this._mount.bind(this));
    } else {
      this._mount();
    }
  },

  _mount: function() {
    this._injectCSS();
    this._buildLauncher();
    this._buildModal();
    this._setupSpeech();
  },

/* ───────── CSS ───────── */
  _injectCSS: function() {
    var c = this.color;
    var s = document.createElement('style');
    s.textContent =
      '@keyframes ha-ring{0%,100%{box-shadow:0 0 0 0 '+c+'99}70%{box-shadow:0 0 0 16px transparent}}' +
      '@keyframes ha-dot{0%,100%{opacity:1}50%{opacity:.3}}' +
      '@keyframes ha-fade{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}' +
      '@keyframes ha-spin{to{transform:rotate(360deg)}}' +
      '@keyframes ha-bg{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}' +
      '@keyframes ha-p1{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(1.18);opacity:.15}}' +
      '@keyframes ha-p2{0%,100%{transform:scale(1);opacity:.35}50%{transform:scale(1.28);opacity:.08}}' +
      '@keyframes ha-p3{0%,100%{transform:scale(1);opacity:.2}50%{transform:scale(1.4);opacity:.04}}' +
      '@keyframes ha-ava{0%,100%{transform:scale(1) translateY(0)}50%{transform:scale(1.02) translateY(-4px)}}' +
      '@keyframes ha-dots{0%,20%{content:"."}40%,60%{content:".."}80%,100%{content:"..."}}' +
      '@keyframes ha-vfade{from{opacity:0}to{opacity:1}}' +
      '#ha-modal *{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}' +
      '#ha-modal button:active{transform:scale(.92)}' +
      '#ha-av{animation:ha-vfade .6s ease}' +
      '#ha-ldots::after{content:".";animation:ha-dots 1.2s infinite}';
    document.head.appendChild(s);
  },

/* ───────── LAUNCHER ───────── */
  _buildLauncher: function() {
    var self = this; var c = this.color;
    var posMap = {'bottom-right':'bottom:24px;right:24px','bottom-left':'bottom:24px;left:24px','top-right':'top:24px;right:24px','top-left':'top:24px;left:24px'};
    var pos = posMap[this.cfg.position || 'bottom-right'] || 'bottom:24px;right:24px';
    var btn = document.createElement('button');
    btn.id = 'ha-launcher';
    btn.style.cssText = 'position:fixed;'+pos+';width:62px;height:62px;border-radius:50%;background:'+c+';border:none;cursor:pointer;box-shadow:0 4px 24px rgba(0,0,0,.35);z-index:99995;animation:ha-ring 2.5s infinite;transition:transform .15s';
    btn.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/></svg>';
    btn.onmouseenter = function() { btn.style.transform = 'scale(1.1)'; };
    btn.onmouseleave = function() { btn.style.transform = ''; };
    btn.onclick     = function() { self._openCall(); };
    document.body.appendChild(btn);
  },

/* ───────── MODAL ───────── */
  _buildModal: function() {
    var c = this.color;
    var modal = document.createElement('div');
    modal.id = 'ha-modal';
    modal.style.cssText = 'display:none;position:fixed;inset:0;background:#000;z-index:99996;animation:ha-fade .2s ease';

    modal.innerHTML =
      /* avatar video (fills whole screen) */
      '<video id="ha-av" autoplay playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:none"></video>' +
      /* ── BEAUTIFUL LOADING PLACEHOLDER ── */
      '<div id="ha-placeholder" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;background:linear-gradient(135deg,#0d0b1e,#1a1040,#0d0b1e);background-size:400% 400%;animation:ha-bg 8s ease infinite">' +
        /* pulsing rings */
        '<div style="position:relative;width:200px;height:200px;display:flex;align-items:center;justify-content:center">' +
          '<div style="position:absolute;width:200px;height:200px;border-radius:50%;background:'+c+';opacity:.2;animation:ha-p3 3s ease-in-out infinite"></div>' +
          '<div style="position:absolute;width:160px;height:160px;border-radius:50%;background:'+c+';opacity:.3;animation:ha-p2 3s ease-in-out infinite .4s"></div>' +
          '<div style="position:absolute;width:120px;height:120px;border-radius:50%;background:'+c+';opacity:.45;animation:ha-p1 3s ease-in-out infinite .8s"></div>' +
          /* avatar face silhouette */
          '<div style="position:relative;width:90px;height:90px;border-radius:50%;background:linear-gradient(145deg,'+c+',#818cf8);display:flex;align-items:center;justify-content:center;animation:ha-ava 4s ease-in-out infinite;box-shadow:0 0 40px '+c+'66">' +
            '<svg width="44" height="44" viewBox="0 0 24 24" fill="rgba(255,255,255,.9)"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>' +
          '</div>' +
        '</div>' +
        /* loading text with animated dots */
        '<div style="margin-top:28px;display:flex;flex-direction:column;align-items:center;gap:10px">' +
          '<div style="color:#e2e8f0;font-size:17px;font-weight:600;letter-spacing:.3px" id="ha-load-txt">Skambinama<span id="ha-ldots"></span></div>' +
          '<div style="display:flex;gap:6px">' +
            '<div style="width:7px;height:7px;border-radius:50%;background:'+c+';animation:ha-dot 1s infinite"></div>' +
            '<div style="width:7px;height:7px;border-radius:50%;background:'+c+';animation:ha-dot 1s infinite .2s"></div>' +
            '<div style="width:7px;height:7px;border-radius:50%;background:'+c+';animation:ha-dot 1s infinite .4s"></div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      /* user PiP camera – top right */
      '<div id="ha-pip" style="position:absolute;top:20px;right:20px;width:156px;height:110px;border-radius:14px;overflow:hidden;border:2px solid rgba(255,255,255,.3);background:#111;z-index:10">' +
        '<video id="ha-cam" autoplay playsinline muted style="width:100%;height:100%;object-fit:cover;transform:scaleX(-1)"></video>' +
        '<div id="ha-cam-off" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#555;font-size:11px">Kamera išjungta</div>' +
      '</div>' +

      /* header */
      '<div style="position:absolute;top:0;left:0;right:0;padding:16px 20px;background:linear-gradient(rgba(0,0,0,.65),transparent);display:flex;align-items:center;gap:10px;z-index:10">' +
        '<div style="width:9px;height:9px;border-radius:50%;background:#22c55e;animation:ha-dot 1.5s infinite"></div>' +
        '<span id="ha-title" style="color:#fff;font-weight:600;font-size:15px"></span>' +
        '<span id="ha-status" style="margin-left:6px;color:rgba(255,255,255,.55);font-size:12px">Jungiamasi...</span>' +
      '</div>' +

      /* subtitle */
      '<div id="ha-sub" style="display:none;position:absolute;bottom:100px;left:0;right:0;text-align:center;padding:0 32px;z-index:10">' +
        '<div style="display:inline-block;background:rgba(0,0,0,.72);color:#fff;font-size:15px;line-height:1.6;padding:10px 18px;border-radius:12px;max-width:520px;backdrop-filter:blur(4px)"></div>' +
      '</div>' +

      /* thinking spinner */
      '<div id="ha-thinking" style="display:none;position:absolute;bottom:105px;left:50%;transform:translateX(-50%);z-index:10">' +
        '<div style="background:rgba(0,0,0,.6);border-radius:20px;padding:7px 16px;display:flex;align-items:center;gap:8px">' +
          '<div style="width:15px;height:15px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:ha-spin .7s linear infinite"></div>' +
          '<span style="color:#fff;font-size:13px">Galvoju...</span>' +
        '</div>' +
      '</div>' +

      /* controls bar: [input] [mic/send] [cam] [end] */
      '<div style="position:absolute;bottom:0;left:0;right:0;padding:16px 20px 26px;background:linear-gradient(transparent,rgba(0,0,0,.88));display:flex;align-items:center;gap:12px;z-index:10">' +
        '<input id="ha-input" type="text" placeholder="Rašyk žinutę..." autocomplete="off" style="flex:1;max-width:360px;padding:11px 18px;border-radius:28px;border:1.5px solid rgba(255,255,255,.22);background:rgba(255,255,255,.1);color:#fff;font-size:14px;outline:none;backdrop-filter:blur(6px)">' +
        /* ONE mic/send button */
        '<button id="ha-voice-btn" title="Kalbėti / siųsti" style="width:56px;height:56px;flex-shrink:0;border-radius:50%;background:'+c+';border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,.35);transition:background .2s">' +
          '<svg id="ha-voice-ico" width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>' +
        '</button>' +
        /* camera toggle */
        '<button id="ha-cam-btn" title="Kamera" style="width:48px;height:48px;flex-shrink:0;border-radius:50%;background:rgba(255,255,255,.14);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/></svg>' +
        '</button>' +
        /* end call */
        '<button id="ha-end-btn" title="Baigti skambutį" style="width:48px;height:48px;flex-shrink:0;border-radius:50%;background:#ef4444;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="white" style="transform:rotate(135deg)"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>' +
        '</button>' +
      '</div>';

    document.body.appendChild(modal);
    this._bindEvents();
  },

/* ───────── EVENT BINDING ───────── */
  _bindEvents: function() {
    var self = this;
    document.getElementById('ha-end-btn').onclick   = function() { self._closeCall(); };
    document.getElementById('ha-cam-btn').onclick   = function() { self._toggleCam(); };
    document.getElementById('ha-voice-btn').onclick = function() {
      var inp = document.getElementById('ha-input');
      if (inp.value.trim()) {
        self._send(inp.value.trim());
        inp.value = '';
      } else {
        self._toggleMic();
      }
    };
    document.getElementById('ha-input').onkeydown = function(e) {
      if (e.key === 'Enter') {
        var val = e.target.value.trim();
        if (val) { self._send(val); e.target.value = ''; }
      }
    };
  },

/* ───────── SPEECH ───────── */
  _setupSpeech: function() {
    var Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Rec) return;
    var self = this;
    this.recognition = new Rec();
    this.recognition.continuous    = false;
    this.recognition.interimResults = false;
    this.recognition.lang = this.cfg.lang || 'en-US';
    this.recognition.onresult = function(e) {
      var text = e.results[0][0].transcript.trim();
      if (text) self._send(text);
      self._stopMic();
    };
    this.recognition.onerror = function() { self._stopMic(); };
    this.recognition.onend   = function() { self._stopMic(); };
  },

  _toggleMic: function() {
    if (this.isRecording) { this._stopMic(); }
    else { this._startMic(); }
  },

  _startMic: function() {
    if (!this.recognition) { return; }
    this.isRecording = true;
    var btn = document.getElementById('ha-voice-btn');
    if (btn) btn.style.background = '#ef4444';
    try { this.recognition.start(); } catch(e) {}
  },

  _stopMic: function() {
    this.isRecording = false;
    var btn = document.getElementById('ha-voice-btn');
    if (btn) btn.style.background = this.color;
    try { if (this.recognition) this.recognition.stop(); } catch(e) {}
  },

/* ───────── CAMERA ───────── */
  _startCam: function() {
    var self = this;
    var pip = document.getElementById('ha-pip');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (pip) pip.style.display = 'none';
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then(function(stream) {
        self.camStream = stream;
        var vid = document.getElementById('ha-cam');
        var off = document.getElementById('ha-cam-off');
        if (pip) pip.style.display = 'block';
        if (vid) { vid.srcObject = stream; vid.style.display = 'block'; }
        if (off) off.style.display = 'none';
      })
      .catch(function(err) {
        var off = document.getElementById('ha-cam-off');
        if (pip) pip.style.display = 'block';
        if (off) {
          off.style.display = 'flex';
          off.style.flexDirection = 'column';
          off.style.alignItems = 'center';
          off.style.justifyContent = 'center';
          off.style.padding = '6px';
          off.style.gap = '6px';
          var msg = document.createElement('div');
          msg.style.cssText = 'color:#f87171;font-size:9px;text-align:center';
          msg.textContent = err.name === 'NotAllowedError' ? 'Kamera uždrausta' : 'Kamera nepasiekiama';
          var btn2 = document.createElement('button');
          btn2.textContent = 'Leisti';
          btn2.style.cssText = 'background:#6366f1;color:#fff;border:none;border-radius:6px;padding:4px 10px;font-size:10px;cursor:pointer';
          btn2.onclick = function() { self._startCam(); };
          off.innerHTML = '';
          off.appendChild(msg);
          off.appendChild(btn2);
        }
      });
  },

  _stopCam: function() {
    if (this.camStream) {
      this.camStream.getTracks().forEach(function(t) { t.stop(); });
      this.camStream = null;
    }
  },

  _toggleCam: function() {
    this.camEnabled = !this.camEnabled;
    var btn = document.getElementById('ha-cam-btn');
    var vid = document.getElementById('ha-cam');
    var off = document.getElementById('ha-cam-off');
    if (this.camEnabled) {
      btn.style.background = 'rgba(255,255,255,.14)';
      this._startCam();
    } else {
      btn.style.background = '#ef4444';
      this._stopCam();
      if (vid) vid.style.display = 'none';
      if (off) { off.textContent = 'Kamera išjungta'; off.style.display = 'flex'; }
    }
  },

/* ───────── OPEN / CLOSE ───────── */
  _openCall: function() {
    var launcher = document.getElementById('ha-launcher');
    var modal    = document.getElementById('ha-modal');
    if (launcher) launcher.style.display = 'none';
    modal.style.display = 'block';
    if (this.cfg.title) document.getElementById('ha-title').textContent = this.cfg.title;
    /* create AudioContext NOW during user gesture so it's never suspended */
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx && !this.audioCtx) {
      try { this.audioCtx = new Ctx({ sampleRate: 16000 }); } catch(e) {}
    }
    this._startCam();
    this._startSession();
  },

  _closeCall: function() {
    this._stopCam();
    this._stopMic();
    /* close Simli */
    if (this.pc)      { try { this.pc.close(); } catch(e) {} this.pc = null; }
    if (this.simliWs) { try { this.simliWs.close(); } catch(e) {} this.simliWs = null; }
    this.simliOpen = false; this.audioQueue = [];
    /* close HeyGen */
    if (this.heygenSessionId) {
      var hid = this.heygenSessionId;
      fetch('${apiBase}/public/streaming/heygen/stop', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ heygenSessionId: hid }),
      }).catch(function(){});
      this.heygenSessionId = null;
    }
    if (this.sessionId) this._endSession();
    var modal    = document.getElementById('ha-modal');
    var launcher = document.getElementById('ha-launcher');
    if (modal)    modal.style.display = 'none';
    if (launcher) launcher.style.display = '';
  },

/* ───────── SESSION ───────── */
  _startSession: function() {
    var self = this;
    var vid = localStorage.getItem('ha_vid') || ('v_'+Math.random().toString(36).substr(2,9));
    localStorage.setItem('ha_vid', vid);
    self._status('Jungiamasi...');

    fetch('${apiBase}/public/streaming/start', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ widgetConfigId: self.cfg.widgetId, visitorId: vid }),
    })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      self.sessionId = d.sessionId;
      self.pendingGreeting = d.greeting || '';
      self.simliE2E = !!(d.simliE2E);
      if (d.simliSessionToken) {
        self._initSimli(d.simliSessionToken, d.simliApiKey || null);
      } else if (d.heygenAvatarId) {
        self._status('Jungiamas avataras...');
        self._initHeygen(d.heygenAvatarId);
      } else {
        self._showAvPlaceholderFallback();
        self._status('Gyvas');
      }
    })
    .catch(function(e) {
      console.error('HA session error', e);
      self._status('Ryšio klaida');
    });
  },

  _endSession: function() {
    if (!this.sessionId) return;
    navigator.sendBeacon
      ? navigator.sendBeacon('${apiBase}/public/streaming/'+this.sessionId+'/end')
      : fetch('${apiBase}/public/streaming/'+this.sessionId+'/end', { method: 'POST' });
    this.sessionId = null;
  },

/* ───────── SIMLI WebRTC ───────── */
  _initSimli: async function(token, apiKey) {
    var self = this;
    self._status('Skambinama...');

    /* 1 ── ICE servers (Simli TURN if we have key, else Google STUN) */
    var iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ];
    if (apiKey) {
      try {
        var ir = await fetch('https://api.simli.ai/compose/ice', {
          headers: { 'x-simli-api-key': apiKey },
        });
        if (ir.ok) { var id = await ir.json(); if (id && id.length) iceServers = id; }
      } catch(e) { /* use STUN fallback */ }
    }

    /* 2 ── PeerConnection */
    var pc = new RTCPeerConnection({ iceServers: iceServers, sdpSemantics: 'unified-plan' });
    self.pc = pc;
    pc.addTransceiver('audio', { direction: 'recvonly' });
    pc.addTransceiver('video', { direction: 'recvonly' });

    /* 3 ── Receive tracks from Simli */
    pc.addEventListener('track', function(evt) {
      var av = document.getElementById('ha-av');
      if (!av) return;
      if (evt.track.kind === 'video') {
        av.srcObject = evt.streams[0];
        av.style.display = 'block';
        document.getElementById('ha-placeholder').style.display = 'none';
        av.play().catch(function(){});
        av.requestVideoFrameCallback
          ? av.requestVideoFrameCallback(function() { self._status('Gyvas ●'); self._speakGreeting(); })
          : (self._status('Gyvas ●'), self._speakGreeting());
      } else if (evt.track.kind === 'audio') {
        if (av.srcObject) { av.srcObject.addTrack(evt.track); }
        else {
          var a = document.getElementById('ha-s-aud') || document.createElement('audio');
          a.id = 'ha-s-aud'; a.autoplay = true;
          if (!a.parentNode) document.body.appendChild(a);
          a.srcObject = evt.streams[0];
        }
      }
    });

    /* 4 ── Create offer + set local desc */
    try {
      var offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
    } catch(e) { console.error('HA Simli offer error', e); self._status('Klaida'); return; }

    /* 5 ── Open signaling WS immediately (parallel with ICE gather) */
    var wsUrl = 'wss://api.simli.ai/compose/webrtc/p2p?session_token='
                 + encodeURIComponent(token) + '&enableSFU=true';
    var ws = new WebSocket(wsUrl);
    self.simliWs = ws;

    ws.onerror = function(e) { console.warn('HA Simli WS error', e); };
    ws.onclose = function()  { self.simliOpen = false; };

    ws.onmessage = function(msg) {
      if (typeof msg.data !== 'string') return;
      var raw = msg.data;
      /* first token uppercase — SDK pattern */
      var tok = raw.toUpperCase().split(' ')[0];
      if (tok.includes('SDP') || tok.includes('ANSWER')) {
        /* msg.data is compact JSON like {"type":"answer","sdp":"..."} */
        var jsonStart = raw.indexOf('{');
        if (jsonStart < 0) { try { var p = JSON.parse(raw); if (p && p.sdp && p.type) { pc.setRemoteDescription(new RTCSessionDescription(p)).catch(function(){}); } } catch(e) {} return; }
        try {
          var info = JSON.parse(raw.substring(jsonStart));
          if (info.sdp && info.type) {
            pc.setRemoteDescription(new RTCSessionDescription(info))
              .then(function() {
                self.simliOpen = true;
                self._status('Avataras paruoštas...');
                if (self.simliE2E) {
                  /* E2E: flush greeting as text, then flush any queued binary */
                  if (self.pendingGreeting) {
                    ws.send(JSON.stringify({ text: self.pendingGreeting, interrupt: false }));
                  }
                }
                /* flush queued PCM audio (non-E2E path) */
                while (self.audioQueue.length) {
                  var chunk = self.audioQueue.shift();
                  if (ws.readyState === 1) ws.send(chunk);
                }
              })
              .catch(function(e) { console.warn('HA setRemote error', e); });
          }
        } catch(e) { console.warn('HA SDP parse error', e); }
      } else if (tok === 'ACK') {
        self.simliOpen = true;
      } else if (tok === 'ERROR' || tok === 'ERROR:') {
        console.warn('Simli error:', raw);
        self._status('Avataro klaida');
      }
    };

    ws.onopen = async function() {
      /* wait for ICE gathering to settle (max 4 s) */
      await new Promise(function(resolve) {
        if (pc.iceGatheringState === 'complete') { resolve(); return; }
        var resolved = false;
        var prev = 0; var cnt = 0;
        var t = setTimeout(function() { if (!resolved) { resolved = true; resolve(); } }, 4000);
        pc.onicegatheringstatechange = function() {
          if (pc.iceGatheringState === 'complete' && !resolved) { resolved = true; clearTimeout(t); resolve(); }
        };
        pc.onicecandidate = function(ev) {
          if (ev.candidate) { cnt++; }
          else if (!resolved) { resolved = true; clearTimeout(t); resolve(); }
        };
        /* also resolve 300 ms after candidates stop arriving */
        function checkIdle() {
          if (resolved) return;
          if (cnt === prev && cnt > 0) { resolved = true; clearTimeout(t); resolve(); return; }
          prev = cnt; setTimeout(checkIdle, 300);
        }
        setTimeout(checkIdle, 300);
      });
      /* send complete offer (with all ICE candidates embedded in SDP) */
      if (pc.localDescription) {
        ws.send(JSON.stringify(pc.localDescription));
      }
    };

    /* 6 ── Fallback: 18 s → show "Live (audio only)" */
    setTimeout(function() {
      var av = document.getElementById('ha-av');
      if (!av || av.style.display === 'none') {
        self._showAvPlaceholderFallback();
        self._status('Gyvas (tik garsas)');
      }
    }, 18000);
  },

  _showAvPlaceholderFallback: function() {
    /* no video — just hide spinner, keep background */
    var lt = document.getElementById('ha-load-txt');
    if (lt) lt.textContent = '';
  },

/* ───────── SEND AUDIO TO SIMLI ───────── */
  _pcmToSimli: function(audioBase64, mime) {
    var self = this;
    try {
      var binaryStr = atob(audioBase64);
      var bytes = new Uint8Array(binaryStr.length);
      for (var i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

      /* RAW PCM 16kHz 16-bit — send directly, no decoding needed */
      if (mime && mime.indexOf('pcm') !== -1) {
        var CHUNK = 6000;
        for (var k = 0; k < bytes.length; k += CHUNK) {
          var chunk = bytes.slice(k, k + CHUNK);
          if (self.simliWs && self.simliWs.readyState === 1) {
            self.simliWs.send(chunk);
          } else {
            self.audioQueue.push(chunk);
          }
        }
        /* If WS already open, flush queue now */
        if (self.simliOpen && self.simliWs && self.simliWs.readyState === 1) {
          while (self.audioQueue.length) { self.simliWs.send(self.audioQueue.shift()); }
        }
        return true;
      }

      /* MP3 or other — decode + resample via AudioContext */
      var ctx = self.audioCtx;
      if (!ctx) {
        var Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return false;
        ctx = new Ctx(); self.audioCtx = ctx;
      }
      var doSend = function() {
        ctx.decodeAudioData(bytes.buffer.slice(0), function(buf) {
          var outLen = Math.ceil(buf.duration * 16000);
          var offline = new OfflineAudioContext(1, outLen, 16000);
          var src = offline.createBufferSource();
          src.buffer = buf; src.connect(offline.destination); src.start(0);
          offline.startRendering().then(function(rendered) {
            var f32 = rendered.getChannelData(0);
            var i16 = new Int16Array(f32.length);
            for (var j = 0; j < f32.length; j++) {
              i16[j] = Math.max(-32768, Math.min(32767, Math.round(f32[j] * 32768)));
            }
            /* 3000 samples = 6000 bytes per chunk (matches Simli's default audioBufferSize) */
            var CHUNK2 = 3000; /* samples */
            for (var k2 = 0; k2 < i16.length; k2 += CHUNK2) {
              var chunk2 = new Uint8Array(i16.slice(k2, k2 + CHUNK2).buffer);
              if (self.simliWs && self.simliWs.readyState === 1) { self.simliWs.send(chunk2); }
              else { self.audioQueue.push(chunk2); }
            }
            if (self.simliOpen && self.simliWs && self.simliWs.readyState === 1) {
              while (self.audioQueue.length) { self.simliWs.send(self.audioQueue.shift()); }
            }
          }).catch(function(e) { console.warn('HA offline render', e); });
        }, function(e) { console.warn('HA decode error', e); });
      };
      if (ctx.state === 'suspended') { ctx.resume().then(doSend).catch(doSend); } else { doSend(); }
      return true;
    } catch(e) { console.warn('HA pcmToSimli', e); return false; }
  },

/* ───────── HEYGEN FALLBACK ───────── */
  _initHeygen: function(avatarId) {
    var self = this;
    fetch('${apiBase}/public/streaming/heygen/new', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ avatarId: avatarId, quality: 'low' }),
    })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (!d.session_id) throw new Error('no session_id');
      self.heygenSessionId = d.session_id;
      var pc = new RTCPeerConnection({ iceServers: d.ice_servers2 || d.ice_servers || [] });
      pc.addTransceiver('video', { direction: 'recvonly' });
      pc.addTransceiver('audio', { direction: 'recvonly' });
      pc.ontrack = function(ev) {
        var av = document.getElementById('ha-av');
        if (!av.srcObject) av.srcObject = new MediaStream();
        av.srcObject.addTrack(ev.track);
        if (ev.track.kind === 'video') {
          av.style.display = 'block';
          document.getElementById('ha-placeholder').style.display = 'none';
          self._status('Gyvas');
          self._speakGreeting();
        }
      };
      return pc.setRemoteDescription(new RTCSessionDescription(d.sdp))
        .then(function() { return pc.createAnswer(); })
        .then(function(ans) { return pc.setLocalDescription(ans).then(function() { return ans; }); })
        .then(function(ans) {
          return fetch('${apiBase}/public/streaming/heygen/start', {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ heygenSessionId: self.heygenSessionId, sdpAnswer: ans.sdp }),
          });
        });
    })
    .catch(function(e) {
      console.warn('HeyGen unavailable', e);
      self._showAvPlaceholderFallback();
      self._status('Gyvas');
    });
  },

/* ───────── CHAT ───────── */
  _send: function(text) {
    if (!this.sessionId || this.isThinking) return;
    var self = this;
    this._thinking(true);
    this._stopMic();

    fetch('${apiBase}/public/streaming/' + this.sessionId + '/chat', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ message: text }),
    })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      self._thinking(false);
      if (d.text) self._subtitle(d.text, false);

      /* E2E mode: send text to Simli, it handles TTS+voice internally */
      if (self.simliE2E && self.simliWs && self.simliWs.readyState === 1 && d.text) {
        self.simliWs.send(JSON.stringify({ text: d.text, interrupt: true }));
        return;
      }

      /* priority: Simli PCM → HeyGen → MP3 → browser TTS */
      if (d.audioBase64 && self._pcmToSimli(d.audioBase64, d.audioMime)) {
        return; /* Simli handles everything */
      }
      if (self.heygenSessionId && d.text) {
        fetch('${apiBase}/public/streaming/heygen/talk', {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ heygenSessionId: self.heygenSessionId, text: d.text }),
        }).catch(function(){});
        return;
      }
      if (d.audioBase64) {
        try { new Audio('data:' + (d.audioMime||'audio/mpeg') + ';base64,' + d.audioBase64).play(); } catch(e) {}
        return;
      }
      if (d.text) self._tts(d.text);
    })
    .catch(function(e) {
      self._thinking(false);
      console.error('HA chat error', e);
    });
  },

/* ───────── SPEAK GREETING (via backend Edge TTS → Simli lip-sync) ───────── */
  _speakGreeting: function() {
    var self = this;
    if (!self.pendingGreeting) return;
    var text = self.pendingGreeting;
    self.pendingGreeting = '';
    self._subtitle(text, false);
    /* E2E: text already sent to Simli WS in _initSimli SDP handler.
       Non-E2E: send PCM via speak endpoint */
    if (!self.simliE2E && self.sessionId) {
      fetch('${apiBase}/public/streaming/' + self.sessionId + '/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text }),
      })
      .then(function(r) { return r.json(); })
      .then(function(d) { if (d.audioBase64) self._pcmToSimli(d.audioBase64, d.audioMime); })
      .catch(function(e) { console.warn('HA speak error', e); });
    }
  },

/* ───────── HELPERS ───────── */
  _subtitle: function(text, speak) {
    var box  = document.getElementById('ha-sub');
    var inner = box && box.querySelector('div');
    if (inner) inner.textContent = text;
    if (box) box.style.display = 'block';
    clearTimeout(this._subT);
    this._subT = setTimeout(function() { if (box) box.style.display = 'none'; }, 7000);
    if (speak) this._tts(text);
  },

  _thinking: function(v) {
    this.isThinking = v;
    var el = document.getElementById('ha-thinking');
    var vb = document.getElementById('ha-voice-btn');
    if (el) el.style.display = v ? 'flex' : 'none';
    if (vb) vb.style.opacity = v ? '.45' : '1';
  },

  _status: function(t) {
    var el = document.getElementById('ha-status');
    var lt = document.getElementById('ha-load-txt');
    if (el) el.textContent = t;
    if (lt) {
      lt.innerHTML = t + (t.includes('Gyvas') ? '' : '<span id="ha-ldots"></span>');
    }
  },

  _tts: function(text) {
    if (!window.speechSynthesis) return;
    var u = new SpeechSynthesisUtterance(text);
    u.lang = this.cfg.lang || 'en-US';
    window.speechSynthesis.speak(u);
  },
};

/* ── auto-init from <script> tag ── */
var tags = document.querySelectorAll('script[data-widget-id]');
if (tags.length > 0) {
  var sc = tags[tags.length - 1];
  HA.init({
    widgetId: sc.getAttribute('data-widget-id'),
    apiKey:   sc.getAttribute('data-api-key'),
    color:    sc.getAttribute('data-color')    || '#6366f1',
    title:    sc.getAttribute('data-title')    || 'AI Asistentas',
    lang:     sc.getAttribute('data-lang')     || 'lt-LT',
    position: sc.getAttribute('data-position') || 'bottom-right',
  });
}
window.HelloAvatar = HA;
})();
    `;
  }
}
