(function () {
  var currentIndex = 0;
  var selectedAnswer = null;
  var correctCount = 0;
  var timer = null;
  var timeLeft = TIME_PER_QUESTION;
  var answers = []; // track per-question result

  var questionMeta = document.getElementById("questionMeta");
  var questionText = document.getElementById("questionText");
  var questionImage = document.getElementById("questionImage");
  var imageCaption = document.getElementById("imageCaption");
  var optionsGrid = document.getElementById("optionsGrid");
  var nextBtn = document.getElementById("nextBtn");
  var timerDisplay = document.getElementById("timerDisplay");
  var questionCard = document.getElementById("questionCard");
  var timeBarFill = document.getElementById("timeBarFill");
  var progressFill = document.getElementById("progressFill");
  var quizBody = document.getElementById("quizBody");
  var quizFooter = document.querySelector(".quiz-footer");
  var resultScreen = document.getElementById("resultScreen");
  var resultEmoji = document.getElementById("resultEmoji");
  var scoreCircle = document.getElementById("scoreCircle");
  var resultTitle = document.getElementById("resultTitle");
  var resultSummary = document.getElementById("resultSummary");
  var restartBtn = document.getElementById("restartBtn");
  var settingsBtn = document.getElementById("settingsBtn");

  var PASS_PERCENT = 70;

  function init() {
    ScormAPI.init();
    loadQuestion(0);

    nextBtn.addEventListener("click", onNext);
    restartBtn.addEventListener("click", restartQuiz);
    settingsBtn.addEventListener("click", function () {
      alert("Settings: (placeholder) — add mute/exit/review options here.");
    });

    window.addEventListener("beforeunload", function () {
      ScormAPI.commit();
    });
  }

  function loadQuestion(index) {
    clearInterval(timer);
    selectedAnswer = null;
    var q = QUIZ_QUESTIONS[index];

    questionMeta.textContent = "Question " + (index + 1) + " of " + QUIZ_QUESTIONS.length;
    questionText.textContent = q.question;
    questionImage.src = q.image;

    // retrigger entrance animations
    [questionCard, questionText, questionImage.parentElement].forEach(function (el) {
      el.style.animation = "none";
      void el.offsetWidth; // force reflow
      el.style.animation = "";
    });
    imageCaption.textContent = q.imageCaption ? "Visual: " + q.imageCaption : "";
    imageCaption.style.display = q.imageCaption ? "block" : "none";

    optionsGrid.innerHTML = "";
    ["A", "B", "C", "D"].forEach(function (letter) {
      if (!q.options[letter]) return;
      var btn = document.createElement("button");
      btn.className = "option-btn";
      btn.dataset.letter = letter;
      btn.innerHTML =
        '<span class="option-letter">' + letter + "</span><span>" + q.options[letter] + "</span>";
      btn.addEventListener("click", function () {
        selectAnswer(letter, btn);
      });
      optionsGrid.appendChild(btn);
    });

    nextBtn.disabled = true;
    nextBtn.textContent = index === QUIZ_QUESTIONS.length - 1 ? "Finish" : "Next";

    progressFill.style.width = (index / QUIZ_QUESTIONS.length) * 100 + "%";

    timeLeft = TIME_PER_QUESTION;
    updateTimerUI();
    timer = setInterval(tick, 1000);
  }

  function updateTimerUI() {
    var low = timeLeft <= 10;
    timerDisplay.textContent = timeLeft;
    timerDisplay.classList.toggle("low", low);
    timeBarFill.style.width = (timeLeft / TIME_PER_QUESTION) * 100 + "%";
    timeBarFill.classList.toggle("low", low);
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
    var q = QUIZ_QUESTIONS[currentIndex];
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

    answers.push({ question: currentIndex, chosen: chosenLetter, correct: isCorrect });
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
