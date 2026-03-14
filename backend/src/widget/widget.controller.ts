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

    return `
(function() {
'use strict';

var HA = {
  cfg: {}, sessionId: null, color: '#6366f1',
  isThinking: false, recognition: null, isRecording: false,
  micEnabled: true, camEnabled: true, stream: null,
  heygenSessionId: null, peerConnection: null,
  simliWs: null, simliDataChannel: null, simliReady: false,

  init: function(cfg) {
    this.cfg = cfg;
    this.color = cfg.color || '#6366f1';
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', this._mount.bind(this));
    } else { this._mount(); }
  },

  _mount: function() {
    this._injectStyles();
    this._createLauncher();
    this._createCallUI();
    this._setupSpeech();
  },

  _injectStyles: function() {
    var c = this.color;
    var s = document.createElement('style');
    s.textContent = [
      '@keyframes ha-ring{0%,100%{box-shadow:0 0 0 0 '+c+'88}70%{box-shadow:0 0 0 14px transparent}}',
      '@keyframes ha-pulse-dot{0%,100%{opacity:1}50%{opacity:0.4}}',
      '@keyframes ha-fadein{from{opacity:0;transform:scale(0.97)}to{opacity:1;transform:scale(1)}}',
      '@keyframes ha-spin{to{transform:rotate(360deg)}}',
      '#ha-call-modal *{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif}',
      '#ha-call-modal button:active{transform:scale(0.93)}',
    ].join('');
    document.head.appendChild(s);
  },

  _createLauncher: function() {
    var self = this; var c = this.color;
    var btn = document.createElement('button');
    btn.id = 'ha-launcher';
    btn.title = 'Start AI video call';
    var posMap = {'bottom-right':'bottom:24px;right:24px','bottom-left':'bottom:24px;left:24px','top-right':'top:24px;right:24px','top-left':'top:24px;left:24px'};
    var pos = posMap[self.cfg.position || 'bottom-right'] || 'bottom:24px;right:24px';
    btn.style.cssText = 'position:fixed;'+pos+';width:60px;height:60px;border-radius:50%;background:'+c+';border:none;cursor:pointer;box-shadow:0 4px 24px rgba(0,0,0,0.3);z-index:99995;animation:ha-ring 2.5s infinite;transition:transform .2s';
    btn.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>';
    btn.onmouseenter = function() { btn.style.transform='scale(1.1)'; };
    btn.onmouseleave = function() { btn.style.transform=''; };
    btn.onclick = function() { self._openCall(); };
    document.body.appendChild(btn);
  },

  _createCallUI: function() {
    var c = this.color;
    var modal = document.createElement('div');
    modal.id = 'ha-call-modal';
    modal.style.cssText = 'display:none;position:fixed;inset:0;background:#000;z-index:99996;animation:ha-fadein .25s ease';

    modal.innerHTML =
      // AVATAR FULL BACKGROUND
      '<video id="ha-av-video" autoplay playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:none"></video>' +
      '<div id="ha-av-placeholder" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0f0c29,#302b63,#24243e)">' +
        '<div style="text-align:center">' +
          '<div style="width:120px;height:120px;border-radius:50%;background:'+c+';opacity:.25;margin:0 auto 20px;animation:ha-ring 2s infinite"></div>' +
          '<div style="color:#94a3b8;font-size:14px">Connecting...</div>' +
        '</div>' +
      '</div>' +
      // USER PIP CAMERA
      '<div id="ha-pip" style="position:absolute;top:20px;right:20px;width:160px;height:112px;border-radius:16px;overflow:hidden;border:2px solid rgba(255,255,255,.35);background:#111;box-shadow:0 4px 20px rgba(0,0,0,.5);z-index:10">' +
        '<video id="ha-user-cam" autoplay playsinline muted style="width:100%;height:100%;object-fit:cover;transform:scaleX(-1);display:none"></video>' +
        '<div id="ha-pip-off" style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#555;font-size:12px">Camera off</div>' +
      '</div>' +
      // HEADER
      '<div style="position:absolute;top:0;left:0;right:0;padding:18px 24px;background:linear-gradient(rgba(0,0,0,.7),transparent);display:flex;align-items:center;gap:12px;z-index:10">' +
        '<div style="width:10px;height:10px;border-radius:50%;background:#22c55e;animation:ha-pulse-dot 1.5s infinite"></div>' +
        '<span style="color:#fff;font-weight:600;font-size:15px" id="ha-call-title">AI Assistant</span>' +
        '<span id="ha-call-status" style="margin-left:8px;color:rgba(255,255,255,.6);font-size:12px">Connecting...</span>' +
      '</div>' +
      // AI SUBTITLE
      '<div id="ha-subtitle" style="display:none;position:absolute;bottom:110px;left:0;right:0;text-align:center;padding:0 40px;z-index:10">' +
        '<div style="display:inline-block;background:rgba(0,0,0,.7);color:#fff;font-size:15px;line-height:1.6;padding:10px 20px;border-radius:12px;max-width:540px;backdrop-filter:blur(4px)"></div>' +
      '</div>' +
      // THINKING INDICATOR
      '<div id="ha-thinking" style="display:none;position:absolute;bottom:115px;left:50%;transform:translateX(-50%);z-index:10">' +
        '<div style="background:rgba(0,0,0,.6);border-radius:20px;padding:8px 18px;display:flex;align-items:center;gap:8px">' +
          '<div style="width:16px;height:16px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:ha-spin .7s linear infinite"></div>' +
          '<span style="color:#fff;font-size:13px">Thinking...</span>' +
        '</div>' +
      '</div>' +
      // CONTROLS BAR
      '<div style="position:absolute;bottom:0;left:0;right:0;padding:20px 24px 28px;background:linear-gradient(transparent,rgba(0,0,0,.85));display:flex;align-items:center;justify-content:center;gap:14px;z-index:10">' +
        // Text input
        '<input id="ha-input" type="text" placeholder="Type a message..." autocomplete="off" style="flex:1;max-width:340px;padding:11px 18px;border-radius:28px;border:1.5px solid rgba(255,255,255,.25);background:rgba(255,255,255,.12);color:#fff;font-size:14px;outline:none;backdrop-filter:blur(6px)">' +
        // Mic toggle
        '<button id="ha-mic-btn" title="Toggle mic" style="width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,.15);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s">' +
          '<svg id="ha-mic-icon" width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93H2c0 4.97 3.58 9.09 8 9.92V21h4v-3.08c4.42-.82 8-4.94 8-9.92h-2c0 4.08-3.06 7.44-7 7.93V16h-2v-.07z"/></svg>' +
        '</button>' +
        // Voice record / Send
        '<button id="ha-voice-btn" title="Hold to speak / click to send" style="width:58px;height:58px;border-radius:50%;background:'+c+';border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,.3);transition:background .2s">' +
          '<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93H2c0 4.97 3.58 9.09 8 9.92V21h4v-3.08c4.42-.82 8-4.94 8-9.92h-2c0 4.08-3.06 7.44-7 7.93V16h-2v-.07z"/></svg>' +
        '</button>' +
        // Camera toggle
        '<button id="ha-cam-btn" title="Toggle camera" style="width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,.15);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s">' +
          '<svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>' +
        '</button>' +
        // End call
        '<button id="ha-end-btn" title="End call" style="width:52px;height:52px;border-radius:50%;background:#ef4444;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .2s">' +
          '<svg width="22" height="22" viewBox="0 0 24 24" fill="white" style="transform:rotate(135deg)"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>' +
        '</button>' +
      '</div>';

    document.body.appendChild(modal);
    this._bindCallEvents();
  },

  _bindCallEvents: function() {
    var self = this;
    document.getElementById('ha-end-btn').onclick = function() { self._closeCall(); };
    document.getElementById('ha-mic-btn').onclick = function() { self._toggleMic(); };
    document.getElementById('ha-cam-btn').onclick = function() { self._toggleCam(); };
    document.getElementById('ha-voice-btn').onclick = function() {
      if (self.isRecording) { self._stopRecording(); }
      else {
        var inp = document.getElementById('ha-input');
        if (inp.value.trim()) { self._sendMessage(); }
        else { self._startRecording(); }
      }
    };
    document.getElementById('ha-input').onkeypress = function(e) {
      if (e.key === 'Enter') self._sendMessage();
    };
  },

  _setupSpeech: function() {
    var Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Rec) return;
    var self = this;
    this.recognition = new Rec();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = this.cfg.lang || 'en-US';
    this.recognition.onresult = function(e) {
      document.getElementById('ha-input').value = e.results[0][0].transcript;
      self._stopRecording();
      self._sendMessage();
    };
    this.recognition.onerror = function() { self._stopRecording(); };
    this.recognition.onend = function() { self._stopRecording(); };
  },

  _openCall: function() {
    document.getElementById('ha-launcher').style.display = 'none';
    var modal = document.getElementById('ha-call-modal');
    modal.style.display = 'block';
    if (this.cfg.title) document.getElementById('ha-call-title').textContent = this.cfg.title;
    this._startSession();
    this._startUserCamera();
  },

  _closeCall: function() {
    this._stopUserCamera();
    // Close Simli WebRTC
    if (this.simliWs) { try { this.simliWs.close(); } catch(e) {} this.simliWs = null; }
    this.simliReady = false; this.simliDataChannel = null;
    if (this.heygenSessionId) {
      var hsid = this.heygenSessionId;
      fetch('${apiBase}/public/streaming/heygen/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heygenSessionId: hsid }),
      }).catch(function(){});
      this.heygenSessionId = null;
    }
    if (this.peerConnection) { this.peerConnection.close(); this.peerConnection = null; }
    if (this.sessionId) this._endSession();
    document.getElementById('ha-call-modal').style.display = 'none';
    document.getElementById('ha-launcher').style.display = 'flex';
  },

  _startUserCamera: function() {
    var self = this;
    navigator.mediaDevices && navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(function(stream) {
        self.stream = stream;
        var vid = document.getElementById('ha-user-cam');
        vid.srcObject = stream;
        vid.style.display = 'block';
        document.getElementById('ha-pip-off').style.display = 'none';
      })
      .catch(function() {});
  },

  _stopUserCamera: function() {
    if (this.stream) { this.stream.getTracks().forEach(function(t) { t.stop(); }); this.stream = null; }
  },

  _toggleMic: function() {
    this.micEnabled = !this.micEnabled;
    var btn = document.getElementById('ha-mic-btn');
    btn.style.background = this.micEnabled ? 'rgba(255,255,255,.15)' : '#ef4444';
    if (this.recognition && this.isRecording && !this.micEnabled) this._stopRecording();
  },

  _toggleCam: function() {
    this.camEnabled = !this.camEnabled;
    var btn = document.getElementById('ha-cam-btn');
    btn.style.background = this.camEnabled ? 'rgba(255,255,255,.15)' : '#ef4444';
    var vid = document.getElementById('ha-user-cam');
    var off = document.getElementById('ha-pip-off');
    if (this.camEnabled && this.stream) {
      vid.style.display = 'block'; off.style.display = 'none';
    } else {
      vid.style.display = 'none'; off.style.display = 'flex';
    }
  },

  _startRecording: function() {
    if (!this.recognition || !this.micEnabled) return;
    this.isRecording = true;
    var btn = document.getElementById('ha-voice-btn');
    btn.style.background = '#ef4444';
    try { this.recognition.start(); } catch(e) {}
  },

  _stopRecording: function() {
    this.isRecording = false;
    var btn = document.getElementById('ha-voice-btn');
    if (btn) btn.style.background = this.color;
    try { if (this.recognition) this.recognition.stop(); } catch(e) {}
  },

  _startSession: function() {
    var self = this;
    var vid = localStorage.getItem('ha_vid') || ('v_'+Math.random().toString(36).substr(2,9));
    localStorage.setItem('ha_vid', vid);
    this._setStatus('Connecting...');

    fetch('${apiBase}/public/streaming/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ widgetConfigId: self.cfg.widgetId, visitorId: vid }),
    })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      self.sessionId = d.sessionId;
      // Only show static thumbnail if NO live avatar will load
      if (d.idleVideoUrl && !d.simliSessionToken && !d.heygenAvatarId) {
        var v = document.getElementById('ha-av-video');
        v.src = d.idleVideoUrl;
        v.style.display = 'block';
        document.getElementById('ha-av-placeholder').style.display = 'none';
      }
      if (d.greeting) self._showSubtitle(d.greeting, true);
      // Start Simli WebRTC (preferred) or HeyGen streaming
      if (d.simliSessionToken) {
        self._setStatus('Connecting avatar...');
        self._initSimli(d.simliSessionToken);
      } else if (d.heygenAvatarId) {
        self._setStatus('Connecting avatar...');
        self._startHeygenStreaming(d.heygenAvatarId);
      } else {
        self._setStatus('Live');
      }
    })
    .catch(function() { self._setStatus('Failed to connect'); });
  },

  _initSimli: function(sessionToken) {
    var self = this;
    self._setStatus('Loading avatar...');
    var pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    self.peerConnection = pc;

    // Data channel for sending PCM audio to Simli
    var dc = pc.createDataChannel('audio');
    dc.binaryType = 'arraybuffer';
    self.simliDataChannel = dc;
    dc.onopen = function() { self.simliReady = true; };
    dc.onclose = function() { self.simliReady = false; };

    pc.ontrack = function(ev) {
      if (ev.track.kind === 'video') {
        var vid = document.getElementById('ha-av-video');
        // Clear any static src first — srcObject and src conflict in some browsers
        vid.pause(); vid.src = ''; vid.removeAttribute('src');
        if (!vid.srcObject || vid.srcObject.getVideoTracks().length === 0) {
          vid.srcObject = new MediaStream();
        }
        vid.srcObject.addTrack(ev.track);
        vid.style.display = 'block';
        document.getElementById('ha-av-placeholder').style.display = 'none';
        vid.play().catch(function(){});
        self._setStatus('Live ●');
      }
      if (ev.track.kind === 'audio') {
        // Route Simli audio through the video element itself if possible
        var vid2 = document.getElementById('ha-av-video');
        if (vid2.srcObject) {
          vid2.srcObject.addTrack(ev.track);
        } else {
          var a = document.getElementById('ha-simli-aud') || document.createElement('audio');
          a.id = 'ha-simli-aud'; a.autoplay = true;
          if (!a.parentNode) document.body.appendChild(a);
          a.srcObject = new MediaStream([ev.track]);
        }
      }
    };

    var ws = new WebSocket('wss://api.simli.ai/StartWebRTCSession');
    self.simliWs = ws;

    ws.onopen = function() {
      ws.send(JSON.stringify({ session_token: sessionToken }));
    };

    ws.onmessage = function(msg) {
      var data;
      try { data = JSON.parse(msg.data); } catch(e) { return; }
      if (data.sdp) {
        pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: data.sdp }))
          .then(function() { return pc.createAnswer(); })
          .then(function(ans) { return pc.setLocalDescription(ans).then(function() { return ans; }); })
          .then(function(ans) { ws.send(JSON.stringify({ type: 'answer', sdp: ans.sdp })); });
      } else if (data.candidate) {
        pc.addIceCandidate(new RTCIceCandidate(data)).catch(function(){});
      }
    };

    ws.onerror = function(e) {
      console.warn('Simli WS error', e);
      self._setStatus('Live');
    };
    ws.onclose = function() { self.simliReady = false; };

    // Fallback: if Simli doesn't deliver video in 12s, just show Live status
    setTimeout(function() {
      var vid = document.getElementById('ha-av-video');
      if (!vid || !vid.srcObject || vid.srcObject.getVideoTracks().length === 0) {
        self._setStatus('Live');
      }
    }, 12000);

    pc.onicecandidate = function(ev) {
      if (ev.candidate && ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'ice_candidate', candidate: ev.candidate.candidate, sdpMid: ev.candidate.sdpMid, sdpMLineIndex: ev.candidate.sdpMLineIndex }));
      }
    };
  },

  _sendAudioToSimli: function(audioBase64) {
    var self = this;
    if (!self.simliReady || !self.simliDataChannel) return false;
    try {
      var binary = atob(audioBase64);
      var bytes = new Uint8Array(binary.length);
      for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;
      var ctx = new AudioCtx({ sampleRate: 16000 });
      ctx.decodeAudioData(bytes.buffer.slice(0), function(buf) {
        var f32 = buf.getChannelData(0);
        var i16 = new Int16Array(f32.length);
        for (var j = 0; j < f32.length; j++) {
          i16[j] = Math.max(-32768, Math.min(32767, Math.round(f32[j] * 32768)));
        }
        var chunkSize = 6000;
        for (var k = 0; k < i16.length; k += chunkSize) {
          if (self.simliDataChannel && self.simliDataChannel.readyState === 'open') {
            self.simliDataChannel.send(i16.slice(k, k + chunkSize).buffer);
          }
        }
        ctx.close();
      }, function() { ctx.close(); });
      return true;
    } catch(e) { return false; }
  },

  _startHeygenStreaming: function(avatarId) {
    var self = this;
    self._setStatus('Loading avatar...');

    fetch('${apiBase}/public/streaming/heygen/new', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatarId: avatarId, quality: 'low' }),
    })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      if (!d.session_id) throw new Error('No session_id from HeyGen');
      self.heygenSessionId = d.session_id;

      var iceServers = d.ice_servers2 || d.ice_servers || [];
      var sdpOffer = d.sdp;

      var pc = new RTCPeerConnection({ iceServers: iceServers });
      self.peerConnection = pc;

      // Add receive-only transceivers so HeyGen sends video+audio
      pc.addTransceiver('video', { direction: 'recvonly' });
      pc.addTransceiver('audio', { direction: 'recvonly' });

      pc.ontrack = function(ev) {
        var vid = document.getElementById('ha-av-video');
        if (!vid.srcObject) vid.srcObject = new MediaStream();
        vid.srcObject.addTrack(ev.track);
        if (ev.track.kind === 'video') {
          vid.muted = false;
          vid.style.display = 'block';
          document.getElementById('ha-av-placeholder').style.display = 'none';
          self._setStatus('Live');
        }
      };

      pc.oniceconnectionstatechange = function() {
        if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
          self._setStatus('Live (reconnecting...)');
        }
      };

      return pc.setRemoteDescription(new RTCSessionDescription(sdpOffer))
        .then(function() { return pc.createAnswer(); })
        .then(function(answer) {
          return pc.setLocalDescription(answer).then(function() { return answer; });
        })
        .then(function(answer) {
          return fetch('${apiBase}/public/streaming/heygen/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ heygenSessionId: self.heygenSessionId, sdpAnswer: answer.sdp }),
          });
        });
    })
    .catch(function(err) {
      console.warn('HeyGen streaming unavailable, continuing with audio only.', err);
      self._setStatus('Live');
    });
  },

  _endSession: function() {
    if (!this.sessionId) return;
    navigator.sendBeacon
      ? navigator.sendBeacon('${apiBase}/public/streaming/'+this.sessionId+'/end')
      : fetch('${apiBase}/public/streaming/'+this.sessionId+'/end', { method: 'POST' });
    this.sessionId = null;
  },

  _sendMessage: function() {
    var inp = document.getElementById('ha-input');
    var text = (inp.value||'').trim();
    if (!text || !this.sessionId || this.isThinking) return;
    inp.value = '';
    this._setThinking(true);

    var self = this;
    fetch('${apiBase}/public/streaming/'+this.sessionId+'/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      self._setThinking(false);
      self._showSubtitle(d.text, false);
      // 1st choice: Simli WebRTC lip-sync (real-time video avatar)
      if (d.audioBase64 && self._sendAudioToSimli(d.audioBase64)) {
        // Simli is handling both video + audio — done
      // 2nd choice: HeyGen streaming talk
      } else if (self.heygenSessionId && d.text) {
        fetch('${apiBase}/public/streaming/heygen/talk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ heygenSessionId: self.heygenSessionId, text: d.text }),
        }).catch(function(){});
      // 3rd choice: play MP3 audio
      } else if (d.audioBase64) {
        self._playAudio(d.audioBase64, d.audioMime || 'audio/mpeg');
      // 4th choice: browser TTS
      } else if (d.text) {
        self._speakFallback(d.text);
      }
    })
    .catch(function() {
      self._setThinking(false);
      self._showSubtitle('Sorry, something went wrong.', false);
    });
  },

  _playAudio: function(b64, mime) {
    try { new Audio('data:'+mime+';base64,'+b64).play(); } catch(e) {}
  },

  _speakFallback: function(text) {
    if (!window.speechSynthesis) return;
    var u = new SpeechSynthesisUtterance(text);
    u.lang = this.cfg.lang || 'en-US';
    window.speechSynthesis.speak(u);
  },

  _showSubtitle: function(text, speak) {
    var box = document.getElementById('ha-subtitle');
    box.querySelector('div').textContent = text;
    box.style.display = 'block';
    clearTimeout(this._subTimer);
    this._subTimer = setTimeout(function() { box.style.display = 'none'; }, 7000);
    if (speak) this._speakFallback(text);
  },

  _setThinking: function(v) {
    this.isThinking = v;
    document.getElementById('ha-thinking').style.display = v ? 'flex' : 'none';
    document.getElementById('ha-voice-btn').style.opacity = v ? '.5' : '1';
  },

  _setStatus: function(t) {
    var el = document.getElementById('ha-call-status');
    if (el) el.textContent = t;
  },
};

var s = document.querySelectorAll('script[data-api-key]');
if (s.length > 0) {
  var sc = s[s.length - 1];
  HA.init({
    apiKey:   sc.getAttribute('data-api-key'),
    widgetId: sc.getAttribute('data-widget-id'),
    color:    sc.getAttribute('data-color') || '#6366f1',
    title:    sc.getAttribute('data-title') || 'AI Assistant',
    lang:     sc.getAttribute('data-lang') || 'en-US',
    position: sc.getAttribute('data-position') || 'bottom-right',
  });
}
window.HelloAvatar = HA;
})();
    `;
  }
}
