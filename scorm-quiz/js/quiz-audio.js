/* Voice-over playback for the quiz.
 *
 * Clips live at assets/audio/<lang>/:
 *   q<N>-q.mp3          question text
 *   q<N>-opt<L>.mp3     option L's text (read aloud via the option's speaker icon)
 *   q<N>-ans.mp3        the correct option text
 *   lead-<lang>.mp3     "The right answer is" (prefixed on a wrong answer)
 *   react-right-<lang>.mp3 / react-wrong-<lang>.mp3  spoken pick reaction
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
  var priority = false;  // a question/outcome chain is playing

  function src(lang, name) {
    return BASE + lang + "/" + name + ".mp3";
  }

  function stop() {
    token++;
    queue = [];
    priority = false;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      try { audio.pause(); } catch (e) {}
      audio = null;
    }
  }

  /* Play a list of clip srcs back to back. */
  function playChain(srcs, isPriority) {
    stop();
    if (muted) return;
    var myToken = token;
    priority = !!isPriority;
    queue = srcs.slice();

    function step() {
      if (myToken !== token) return;        // superseded
      if (!queue.length) { audio = null; priority = false; return; }
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
      playChain([src(lang, "q" + qno + "-q")], true);
    },

    /** Correct pick: "Correct! Well done." + the answer text. */
    playCorrect: function (qno, lang) {
      playChain([src(lang, "react-right-" + lang), src(lang, "q" + qno + "-ans")], true);
    },

    /** Wrong pick: "That's not right." + "The right answer is" + the answer. */
    playWrong: function (qno, lang) {
      playChain(
        [src(lang, "react-wrong-" + lang), src(lang, "lead-" + lang), src(lang, "q" + qno + "-ans")],
        true
      );
    },

    /**
     * Read one option aloud — fired only by the option's speaker button, never
     * by hover, so it can never be confused with answering.
     */
    playOption: function (qno, letter, lang) {
      playChain([src(lang, "q" + qno + "-opt" + letter)], false);
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
      ["q" + qno + "-q", "q" + qno + "-ans",
       "q" + qno + "-optA", "q" + qno + "-optB",
       "q" + qno + "-optC", "q" + qno + "-optD"].forEach(function (n) {
        var a = new Audio(src(lang, n));
        a.preload = "auto";
      });
    }
  };
})();
