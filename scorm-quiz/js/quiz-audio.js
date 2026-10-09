/* Voice-over playback for the quiz.
 *
 * Clips live at assets/audio/<lang>/:
 *   q<N>-q.mp3    question text
 *   q<N>-ans.mp3  the correct option text
 *   lead-<lang>.mp3  "The right answer is" (prefixed on a wrong answer)
 *
 * Only one voice-over is ever audible: every play() cancels whatever is
 * running, so rapid Next clicks or language switches never overlap.
 */
var QuizAudio = (function () {
  var BASE = "assets/audio/";
  var muted = false;
  var audio = null;      // the <audio> element currently playing
  var queue = [];        // remaining srcs in the active chain
  var token = 0;         // invalidates callbacks from superseded chains

  function src(lang, name) {
    return BASE + lang + "/" + name + ".mp3";
  }

  function stop() {
    token++;
    queue = [];
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      try { audio.pause(); } catch (e) {}
      audio = null;
    }
  }

  /* Play a list of clip srcs back to back. */
  function playChain(srcs) {
    stop();
    if (muted) return;
    var myToken = token;
    queue = srcs.slice();

    function step() {
      if (myToken !== token) return;        // superseded
      if (!queue.length) { audio = null; return; }
      var url = queue.shift();
      var a = new Audio(url);
      a.preload = "auto";
      audio = a;
      a.onended = step;
      a.onerror = step;                      // missing clip: skip to next
      var p = a.play();
      if (p && p.catch) {
        // Autoplay blocked until the first user gesture — not an error worth
        // surfacing; the next clip (post-click) will play.
        p.catch(function () {});
      }
    }
    step();
  }

  return {
    /** Question voice-over (on load / Next). */
    playQuestion: function (qno, lang) {
      playChain([src(lang, "q" + qno + "-q")]);
    },

    /** Correct pick: just the answer text. */
    playCorrect: function (qno, lang) {
      playChain([src(lang, "q" + qno + "-ans")]);
    },

    /** Wrong pick: "The right answer is" + the answer text. */
    playWrong: function (qno, lang) {
      playChain([src(lang, "lead-" + lang), src(lang, "q" + qno + "-ans")]);
    },

    stop: stop,

    isMuted: function () { return muted; },

    setMuted: function (m) {
      muted = !!m;
      if (muted) stop();
      return muted;
    },

    toggleMute: function () {
      return this.setMuted(!muted);
    },

    /** Warm the browser cache for the clips a question will need. */
    preload: function (qno, lang) {
      ["q" + qno + "-q", "q" + qno + "-ans"].forEach(function (n) {
        var a = new Audio(src(lang, n));
        a.preload = "auto";
      });
    }
  };
})();
