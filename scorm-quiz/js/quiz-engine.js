(function () {
  var currentIndex = 0;
  var selectedAnswer = null;
  var correctCount = 0;
  var timer = null;
  var timeLeft = TIME_PER_QUESTION;
  var answers = {}; // qIndex -> {chosen, correct, revealed}
  var currentLang = "en";
  var answeredCorrect = null; // null = unanswered; true/false once locked
  var randomOrder = false;
  var questionOrder = []; // array of indices into QUIZ_QUESTIONS
  var revealed = false;   // has the correct answer been shown for this question?

  /* Settings, all live in the overlay. autoReveal off means answering locks
     the options but does NOT mark/speak the correct one — the learner presses
     Show Answer when they want it. */
  var autoReveal = true;
  var showAnswerEnabled = true;
  var prevEnabled = true;

  var questionMeta = document.getElementById("questionMeta");
  var questionText = document.getElementById("questionText");
  var questionImage = document.getElementById("questionImage");
  var imageCaption = document.getElementById("imageCaption");
  var optionsGrid = document.getElementById("optionsGrid");
  var nextBtn = document.getElementById("nextBtn");
  var prevBtn = document.getElementById("prevBtn");
  var showAnswerBtn = document.getElementById("showAnswerBtn");
  var timerDisplay = document.getElementById("timerDisplay");
  var questionCard = document.getElementById("questionCard");
  var progressFill = document.getElementById("progressFill");
  var slideCount = document.getElementById("slideCount");
  var quizBody = document.getElementById("quizBody");
  var quizFooter = document.querySelector(".quiz-footer");
  var resultScreen = document.getElementById("resultScreen");
  var resultEmoji = document.getElementById("resultEmoji");
  var scoreCircle = document.getElementById("scoreCircle");
  var resultTitle = document.getElementById("resultTitle");
  var resultSummary = document.getElementById("resultSummary");
  var restartBtn = document.getElementById("restartBtn");
  var settingsBtn = document.getElementById("settingsBtn");
  var settingsOverlay = document.getElementById("settingsOverlay");
  var settingsClose = document.getElementById("settingsClose");
  var settingsDone = document.getElementById("settingsDone");
  var voToggle = document.getElementById("voToggle");
  var autoAnswerToggle = document.getElementById("autoAnswerToggle");
  var showAnswerBtnToggle = document.getElementById("showAnswerBtnToggle");
  var prevBtnToggle = document.getElementById("prevBtnToggle");
  var langButtons = document.querySelectorAll(".lang-btn");
  var randomToggle = document.getElementById("randomToggle");

  var PASS_PERCENT = 70;

  function buildOrder() {
    questionOrder = QUIZ_QUESTIONS.map(function (_, i) { return i; });
    if (randomOrder) {
      for (var i = questionOrder.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = questionOrder[i];
        questionOrder[i] = questionOrder[j];
        questionOrder[j] = tmp;
      }
    }
  }

  function text(field) {
    // field is either a plain string (legacy) or a {en, ta, hi} object
    if (typeof field === "string") return field;
    if (!field) return "";
    return field[currentLang] || field.en || "";
  }

  function init() {
    ScormAPI.init();
    buildOrder();
    loadQuestion(0);

    nextBtn.addEventListener("click", onNext);
    prevBtn.addEventListener("click", onPrev);
    showAnswerBtn.addEventListener("click", onShowAnswer);
    restartBtn.addEventListener("click", restartQuiz);

    /* ---------- Settings overlay ---------- */
    settingsBtn.addEventListener("click", openSettings);
    settingsClose.addEventListener("click", closeSettings);
    settingsDone.addEventListener("click", closeSettings);
    settingsOverlay.addEventListener("click", function (ev) {
      if (ev.target === settingsOverlay) closeSettings();   // click the backdrop
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && !settingsOverlay.classList.contains("hidden")) {
        closeSettings();
      }
    });

    voToggle.addEventListener("change", function () {
      var muted = !voToggle.checked;
      QuizAudio.setMuted(muted);
      // Turning it back on re-speaks whatever the learner is looking at.
      if (!muted) speakCurrentState();
    });

    autoAnswerToggle.addEventListener("change", function () {
      autoReveal = autoAnswerToggle.checked;
      // If they switch auto-reveal ON while sitting on an answered-but-hidden
      // question, honour it immediately rather than making them press Show.
      if (autoReveal && answeredCorrect !== null && !revealed) revealAnswer(true);
      updateFooter();
    });

    showAnswerBtnToggle.addEventListener("change", function () {
      showAnswerEnabled = showAnswerBtnToggle.checked;
      updateFooter();
    });

    prevBtnToggle.addEventListener("change", function () {
      prevEnabled = prevBtnToggle.checked;
      updateFooter();
    });

    langButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        currentLang = btn.dataset.lang;
        langButtons.forEach(function (b) { b.classList.toggle("active", b === btn); });
        renderQuestion(); // re-render current question in new language without resetting timer/progress
        speakCurrentState();
      });
    });

    randomToggle.addEventListener("change", function () {
      randomOrder = randomToggle.checked;
      buildOrder();
      currentIndex = 0;
      correctCount = 0;
      answers = {};
      loadQuestion(0);
    });

    window.addEventListener("beforeunload", function () {
      ScormAPI.commit();
    });
  }

  function openSettings() {
    settingsOverlay.classList.remove("hidden");
    settingsClose.focus();
  }

  function closeSettings() {
    settingsOverlay.classList.add("hidden");
    settingsBtn.focus();
  }

  /** Re-speak the current state in the current language. */
  function speakCurrentState() {
    var qno = currentQno();
    if (answeredCorrect === null) {
      QuizAudio.playQuestion(qno, currentLang);
    } else if (!revealed) {
      // Answered, but the answer is deliberately still hidden: react only.
      QuizAudio.playReaction(answeredCorrect, currentLang);
    } else if (answeredCorrect) {
      QuizAudio.playCorrect(qno, currentLang);
    } else {
      QuizAudio.playWrong(qno, currentLang);
    }
  }

  /**
   * Footer button visibility and enablement, derived from the settings plus
   * where the learner is. Called after every state change.
   */
  function updateFooter() {
    prevBtn.classList.toggle("hidden", !prevEnabled);
    prevBtn.disabled = currentIndex === 0;

    // Show Answer is only meaningful while the answer is still hidden.
    var canShow = showAnswerEnabled && !revealed;
    showAnswerBtn.classList.toggle("hidden", !canShow);
    showAnswerBtn.textContent = answeredCorrect === null ? "Show Answer" : "Reveal Answer";

    // With auto-reveal off, Next unlocks as soon as they answer; the reveal is
    // optional, never mandatory.
    nextBtn.disabled = answeredCorrect === null;
  }

  function currentQuestion() {
    return QUIZ_QUESTIONS[questionOrder[currentIndex]];
  }

  function currentQno() {
    var q = currentQuestion();
    return q.qno || questionOrder[currentIndex] + 1;
  }

  /* Small speaker affordance inside each option. Clicking it reads the option
     aloud; it is explicitly NOT an answer (see the click handler). */
  function speakerHTML(letter) {
    return '<span class="option-speak" role="button" tabindex="-1" ' +
           'aria-label="Read option ' + letter + ' aloud" title="Read aloud">' +
           "\uD83D\uDD0A</span>";
  }

  /**
   * Show an image progressively: the inline blur stand-in paints immediately,
   * the real file fades in once decoded. Intrinsic width/height are set up
   * front so the card never reflows when the image lands.
   */
  function showImage(imgEl, path) {
    var lqip = typeof QUIZ_LQIP !== "undefined" ? QUIZ_LQIP[path] : null;
    var dims = typeof QUIZ_IMG_DIMS !== "undefined" ? QUIZ_IMG_DIMS[path] : null;
    if (dims) {
      imgEl.width = dims[0];
      imgEl.height = dims[1];
    }
    imgEl.classList.remove("img-loaded");
    imgEl.style.backgroundImage = lqip ? "url(" + lqip + ")" : "";
    imgEl.setAttribute("decoding", "async");

    var real = new Image();
    real.onload = function () {
      // Only apply if this is still the image the card wants.
      if (imgEl.dataset.want !== path) return;
      imgEl.src = path;
      imgEl.classList.add("img-loaded");
    };
    real.onerror = function () {
      if (imgEl.dataset.want !== path) return;
      imgEl.src = path;              // let the browser show its own fallback
      imgEl.classList.add("img-loaded");
    };
    imgEl.dataset.want = path;
    // Paint the blur right away rather than holding the previous question's photo.
    imgEl.removeAttribute("src");
    real.src = path;
  }

  /** Fetch the next question's images during the current question's dwell time. */
  function preloadImages(qObj) {
    if (!qObj) return;
    var paths = [];
    if (qObj.image) paths.push(qObj.image);
    if (qObj.optionImages) {
      Object.keys(qObj.optionImages).forEach(function (k) {
        paths.push(qObj.optionImages[k]);
      });
    }
    paths.forEach(function (p) {
      var im = new Image();
      im.decoding = "async";
      im.src = p;
    });
  }

  function renderQuestion() {
    var q = currentQuestion();

    questionMeta.textContent = "Question " + (currentIndex + 1) + " of " + QUIZ_QUESTIONS.length;
    questionText.textContent = text(q.question);

    var imgWrap = questionImage.parentElement;
    if (q.image) {
      showImage(questionImage, q.image);
      imgWrap.style.display = "";
      quizBody.classList.remove("no-scene-image");
    } else {
      questionImage.removeAttribute("src");
      delete questionImage.dataset.want;
      imgWrap.style.display = "none";
      quizBody.classList.add("no-scene-image");
    }

    var captionText = text(q.imageCaption);
    imageCaption.textContent = captionText ? "Visual: " + captionText : "";
    imageCaption.style.display = captionText ? "block" : "none";

    var buttons = optionsGrid.querySelectorAll(".option-btn");
    ["A", "B", "C", "D"].forEach(function (letter, idx) {
      var btn = buttons[idx];
      if (!btn) return;
      var optText = q.options[letter] ? text(q.options[letter]) : "";
      var span = btn.querySelector(".option-label") || btn.querySelector("span:last-child");
      if (span) span.textContent = optText;
    });
  }

  function loadQuestion(index) {
    clearInterval(timer);
    var prior = answers[questionOrder[index]];
    selectedAnswer = prior ? prior.chosen : null;
    answeredCorrect = prior ? prior.correct : null;
    revealed = prior ? !!prior.revealed : false;
    var q = currentQuestion();

    optionsGrid.innerHTML = "";
    var hasImages = !!q.optionImages;
    optionsGrid.classList.toggle("options-grid-img", hasImages);
    ["A", "B", "C", "D"].forEach(function (letter) {
      if (!q.options[letter]) return;
      var btn = document.createElement("button");
      btn.className = "option-btn" + (hasImages ? " option-btn-img" : "");
      btn.dataset.letter = letter;
      if (hasImages && q.optionImages[letter]) {
        btn.innerHTML =
          '<span class="option-img-wrap"><img class="option-img" alt="Option ' + letter + '" loading="lazy" decoding="async" /><span class="option-letter option-letter-img">' + letter + '</span></span>' +
          '<span class="option-label">' + text(q.options[letter]) + "</span>" +
          speakerHTML(letter);
        showImage(btn.querySelector(".option-img"), q.optionImages[letter]);
      } else {
        btn.innerHTML =
          '<span class="option-letter">' + letter + '</span><span class="option-label">' + text(q.options[letter]) + "</span>" +
          speakerHTML(letter);
      }
      btn.addEventListener("click", function (ev) {
        // The speaker icon reads the option aloud; it must NOT count as an answer.
        var spk = ev.target.closest ? ev.target.closest(".option-speak") : null;
        if (spk) {
          ev.preventDefault();
          ev.stopPropagation();
          QuizAudio.playOption(currentQno(), letter, currentLang);
          return;
        }
        selectAnswer(letter, btn);
      });
      optionsGrid.appendChild(btn);
    });

    renderQuestion();

    // retrigger entrance animations
    [questionCard, questionText, questionImage.parentElement].forEach(function (el) {
      el.style.animation = "none";
      void el.offsetWidth; // force reflow
      el.style.animation = "";
    });

    nextBtn.textContent = index === QUIZ_QUESTIONS.length - 1 ? "Finish" : "Next";

    progressFill.style.width = (index / QUIZ_QUESTIONS.length) * 100 + "%";
    slideCount.textContent = (index + 1) + " / " + QUIZ_QUESTIONS.length;

    // Revisiting an answered question (Previous): restore its locked state
    // silently instead of re-running the clock and the voice-over.
    if (answeredCorrect !== null) {
      var buttons = optionsGrid.querySelectorAll(".option-btn");
      buttons.forEach(function (btn) {
        btn.disabled = true;
        if (btn.dataset.letter === selectedAnswer) btn.classList.add("selected");
      });
      if (revealed) revealAnswer(false);
      timerDisplay.textContent = "\u2713";
      timerDisplay.classList.remove("low");
      updateFooter();
      return;
    }

    timeLeft = TIME_PER_QUESTION;
    updateTimerUI();
    timer = setInterval(tick, 1000);
    updateFooter();

    // Voice-over: read the question aloud, and warm the next question's clips.
    QuizAudio.playQuestion(currentQno(), currentLang);
    var nextIdx = questionOrder[index + 1];
    if (nextIdx !== undefined) {
      var nq = QUIZ_QUESTIONS[nextIdx];
      QuizAudio.preload(nq.qno || nextIdx + 1, currentLang);
      preloadImages(nq);
    }
  }

  function updateTimerUI() {
    var low = timeLeft <= 10;
    timerDisplay.textContent = timeLeft;
    timerDisplay.classList.toggle("low", low);
  }

  function tick() {
    timeLeft--;
    updateTimerUI();
    if (timeLeft <= 0) {
      clearInterval(timer);
      if (selectedAnswer === null) {
        lockOptions(null);
      }
    }
  }

  function selectAnswer(letter, btnEl) {
    if (selectedAnswer !== null) return; // already answered
    selectedAnswer = letter;
    lockOptions(letter);
  }

  /**
   * Record the answer and lock the options. Marking and speaking the CORRECT
   * option is deliberately not done here — that is revealAnswer()'s job, so
   * that auto-reveal off can keep the answer hidden.
   */
  function lockOptions(chosenLetter) {
    clearInterval(timer);
    var q = currentQuestion();
    var buttons = optionsGrid.querySelectorAll(".option-btn");
    var isCorrect = chosenLetter === q.correct;

    buttons.forEach(function (btn) {
      btn.disabled = true;
      if (btn.dataset.letter === chosenLetter) {
        btn.classList.add("selected");
      }
    });

    answers[questionOrder[currentIndex]] = {
      chosen: chosenLetter, correct: isCorrect, revealed: false
    };
    answeredCorrect = isCorrect;

    if (autoReveal) {
      revealAnswer(true);
    } else {
      // Tell them right/wrong without giving the answer away.
      QuizAudio.playReaction(isCorrect, currentLang);
      updateFooter();
    }
  }

  /**
   * Mark the correct option (and the wrong pick, if any) and speak the answer.
   * Reached from an auto-reveal answer, from Show Answer, or from a timeout.
   * `speak` is false only when re-rendering an already-revealed question.
   */
  function revealAnswer(speak) {
    var q = currentQuestion();
    var buttons = optionsGrid.querySelectorAll(".option-btn");

    buttons.forEach(function (btn) {
      btn.disabled = true;
      var letter = btn.dataset.letter;
      if (letter === q.correct) {
        btn.classList.add("correct");
      } else if (btn.classList.contains("selected") && letter !== q.correct) {
        btn.classList.add("incorrect");
      }
    });

    revealed = true;
    var rec = answers[questionOrder[currentIndex]];
    if (rec) rec.revealed = true;
    if (speak) {
      // Not yet answered (pressed Show Answer outright) reads as a miss.
      if (answeredCorrect) {
        QuizAudio.playCorrect(currentQno(), currentLang);
      } else {
        QuizAudio.playWrong(currentQno(), currentLang);
      }
    }
    updateFooter();
  }

  /** Show Answer / Reveal Answer: reveal if hidden, otherwise replay the audio. */
  function onShowAnswer() {
    if (answeredCorrect === null) {
      // Revealing without answering counts the question as unanswered-wrong,
      // and stops the clock so the score cannot drift afterwards.
      clearInterval(timer);
      selectedAnswer = null;
      answeredCorrect = false;
      answers[questionOrder[currentIndex]] = { chosen: null, correct: false, revealed: false };
    }
    if (!revealed) {
      revealAnswer(true);
    } else {
      // Already visible: this is a replay request.
      if (answeredCorrect) {
        QuizAudio.playCorrect(currentQno(), currentLang);
      } else {
        QuizAudio.playWrong(currentQno(), currentLang);
      }
    }
  }

  function onNext() {
    if (currentIndex < QUIZ_QUESTIONS.length - 1) {
      currentIndex++;
      loadQuestion(currentIndex);
    } else {
      finishQuiz();
    }
  }

  function onPrev() {
    if (currentIndex > 0) {
      currentIndex--;
      loadQuestion(currentIndex);
    }
  }

  function finishQuiz() {
    QuizAudio.stop();
    clearInterval(timer);
    progressFill.style.width = "100%";
    var total = QUIZ_QUESTIONS.length;
    // Score from the answer records, so revisiting via Previous cannot
    // double-count a question.
    correctCount = Object.keys(answers).reduce(function (n, k) {
      return n + (answers[k].correct ? 1 : 0);
    }, 0);
    var percent = Math.round((correctCount / total) * 100);
    var passed = percent >= PASS_PERCENT;

    quizBody.classList.add("hidden");
    quizFooter.classList.add("hidden");
    resultScreen.classList.remove("hidden");

    scoreCircle.textContent = percent + "%";
    resultEmoji.textContent = percent >= 90 ? "🏆" : passed ? "🎉" : "💪";
    resultTitle.textContent =
      percent >= 90 ? "Legendary!" : passed ? "Passed! Nice work!" : "So close — try again!";
    resultSummary.textContent =
      "You answered " + correctCount + " of " + total + " correctly.";

    ScormAPI.finish(percent, passed);
  }

  function restartQuiz() {
    buildOrder();
    currentIndex = 0;
    correctCount = 0;
    answers = {};
    resultScreen.classList.add("hidden");
    quizBody.classList.remove("hidden");
    quizFooter.classList.remove("hidden");
    loadQuestion(0);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
