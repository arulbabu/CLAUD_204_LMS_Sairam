(function () {
  var currentIndex = 0;
  var selectedAnswer = null;
  var correctCount = 0;
  var timer = null;
  var timeLeft = TIME_PER_QUESTION;
  var answers = []; // track per-question result
  var currentLang = "en";
  var randomOrder = false;
  var questionOrder = []; // array of indices into QUIZ_QUESTIONS

  var questionMeta = document.getElementById("questionMeta");
  var questionText = document.getElementById("questionText");
  var questionImage = document.getElementById("questionImage");
  var imageCaption = document.getElementById("imageCaption");
  var optionsGrid = document.getElementById("optionsGrid");
  var nextBtn = document.getElementById("nextBtn");
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
    restartBtn.addEventListener("click", restartQuiz);
    settingsBtn.addEventListener("click", function () {
      alert("Settings: (placeholder) — add mute/exit/review options here.");
    });

    langButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        currentLang = btn.dataset.lang;
        langButtons.forEach(function (b) { b.classList.toggle("active", b === btn); });
        renderQuestion(); // re-render current question in new language without resetting timer/progress
      });
    });

    randomToggle.addEventListener("change", function () {
      randomOrder = randomToggle.checked;
      buildOrder();
      currentIndex = 0;
      correctCount = 0;
      answers = [];
      loadQuestion(0);
    });

    window.addEventListener("beforeunload", function () {
      ScormAPI.commit();
    });
  }

  function currentQuestion() {
    return QUIZ_QUESTIONS[questionOrder[currentIndex]];
  }

  function renderQuestion() {
    var q = currentQuestion();

    questionMeta.textContent = "Question " + (currentIndex + 1) + " of " + QUIZ_QUESTIONS.length;
    questionText.textContent = text(q.question);

    var imgWrap = questionImage.parentElement;
    if (q.image) {
      questionImage.src = q.image;
      imgWrap.style.display = "";
      quizBody.classList.remove("no-scene-image");
    } else {
      questionImage.removeAttribute("src");
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
    selectedAnswer = null;
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
          '<span class="option-img-wrap"><img class="option-img" src="' + q.optionImages[letter] + '" alt="Option ' + letter + '" /><span class="option-letter option-letter-img">' + letter + '</span></span>' +
          '<span class="option-label">' + text(q.options[letter]) + "</span>";
      } else {
        btn.innerHTML =
          '<span class="option-letter">' + letter + '</span><span class="option-label">' + text(q.options[letter]) + "</span>";
      }
      btn.addEventListener("click", function () {
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

    nextBtn.disabled = true;
    nextBtn.textContent = index === QUIZ_QUESTIONS.length - 1 ? "Finish" : "Next";

    progressFill.style.width = (index / QUIZ_QUESTIONS.length) * 100 + "%";
    slideCount.textContent = (index + 1) + " / " + QUIZ_QUESTIONS.length;

    timeLeft = TIME_PER_QUESTION;
    updateTimerUI();
    timer = setInterval(tick, 1000);
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

  function lockOptions(chosenLetter) {
    clearInterval(timer);
    var q = currentQuestion();
    var buttons = optionsGrid.querySelectorAll(".option-btn");
    var isCorrect = chosenLetter === q.correct;

    buttons.forEach(function (btn) {
      btn.disabled = true;
      var letter = btn.dataset.letter;
      if (letter === q.correct) {
        btn.classList.add("correct");
      } else if (letter === chosenLetter && !isCorrect) {
        btn.classList.add("incorrect");
      }
      if (letter === chosenLetter) {
        btn.classList.add("selected");
      }
    });

    answers.push({ question: questionOrder[currentIndex], chosen: chosenLetter, correct: isCorrect });
    if (isCorrect) correctCount++;

    nextBtn.disabled = false;
  }

  function onNext() {
    if (currentIndex < QUIZ_QUESTIONS.length - 1) {
      currentIndex++;
      loadQuestion(currentIndex);
    } else {
      finishQuiz();
    }
  }

  function finishQuiz() {
    progressFill.style.width = "100%";
    var total = QUIZ_QUESTIONS.length;
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
    answers = [];
    resultScreen.classList.add("hidden");
    quizBody.classList.remove("hidden");
    quizFooter.classList.remove("hidden");
    loadQuestion(0);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
