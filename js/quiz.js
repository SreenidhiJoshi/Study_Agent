/**
 * Quiz Manager (quiz.js)
 * Coordinates quiz sessions, question loading (curated or dynamic),
 * interactive evaluations, and learning progress recording.
 */

class QuizManager {
  constructor() {
    this.currentTopic = null;
    this.currentQuestions = [];
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.selectedOption = null;
    this.isAnswered = false;
  }

  /**
   * Initialize a new quiz session for a specific topic
   * @param {string} topicId - The syllabus topic ID
   */
  startQuiz(topicId) {
    const state = window.memoryManager.state;
    const topic = state.syllabus.topics.find(t => t.id === topicId);
    
    if (!topic) {
      console.error("Topic not found in syllabus for quiz initialization.");
      return;
    }

    this.currentTopic = topic;
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.isAnswered = false;
    this.selectedOption = null;

    window.memoryManager.addLog("Evaluation", `Starting quiz assessment for topic: "${topic.name}"`);

    // Determine subject name of syllabus
    const subjectName = state.syllabus.subject.toLowerCase();
    
    // Look up questions from QUESTION_BANK
    let matchFound = false;
    let questions = [];

    // Check if the topic title or subject matches key values in static database
    for (const key in window.QUESTION_BANK) {
      if (subjectName.includes(key) || topic.name.toLowerCase().includes(key)) {
        questions = window.QUESTION_BANK[key];
        matchFound = true;
        window.memoryManager.addLog("Evaluation", `Loaded curated questions from local bank for "${key}".`);
        break;
      }
    }

    // Fallback: If no direct database match, generate dynamic questions using template rules
    if (!matchFound || questions.length === 0) {
      window.memoryManager.addLog("Reasoning", `No pre-defined questions match "${topic.name}". Generating custom template questions...`);
      questions = window.generateDynamicQuestions(topic.name, state.syllabus.subject);
    }

    // Shuffle questions or take first 3-5
    this.currentQuestions = questions.slice(0, 3); // Capped at 3 questions per session for quick study loops

    // Swap tab to Quiz View
    window.app.switchTab("quiz-tab");
    this.renderQuestion();
  }

  /**
   * Render the current question card
   */
  renderQuestion() {
    const container = document.getElementById("quiz-card-container");
    if (!container) return;

    if (this.currentQuestions.length === 0) {
      container.innerHTML = `
        <div class="card glass text-center p-5">
          <h3 class="gradient-text mb-3">Quiz Not Available</h3>
          <p class="text-secondary">Could not fetch questions for this topic.</p>
        </div>
      `;
      return;
    }

    const question = this.currentQuestions[this.currentQuestionIndex];
    this.isAnswered = false;
    this.selectedOption = null;

    container.innerHTML = `
      <div class="quiz-progress-bar mb-4">
        <div class="quiz-progress-fill" style="width: ${((this.currentQuestionIndex) / this.currentQuestions.length) * 100}%"></div>
      </div>
      
      <div class="d-flex justify-content-between align-items-center mb-3">
        <span class="badge badge-accent">${this.currentTopic.name}</span>
        <span class="text-secondary small">Question ${this.currentQuestionIndex + 1} of ${this.currentQuestions.length}</span>
      </div>

      <h3 class="mb-4 text-light">${question.question}</h3>

      <div class="options-list d-grid gap-3">
        ${question.options.map((option, idx) => `
          <button class="btn btn-outline-glass text-start p-3 option-btn" data-index="${idx}">
            <span class="option-letter me-2">${String.fromCharCode(65 + idx)}.</span> ${option}
          </button>
        `).join("")}
      </div>

      <div id="explanation-box" class="explanation-box mt-4 d-none">
        <h5 id="result-status" class="fw-bold mb-2"></h5>
        <p id="explanation-text" class="text-secondary m-0"></p>
        <button id="next-question-btn" class="btn btn-gradient mt-4 float-end">
          ${this.currentQuestionIndex === this.currentQuestions.length - 1 ? "Finish Quiz" : "Next Question"}
        </button>
      </div>
    `;

    // Bind event listeners to option buttons
    const optionBtns = container.querySelectorAll(".option-btn");
    optionBtns.forEach(btn => {
      btn.addEventListener("click", (e) => this.selectAnswer(e));
    });

    const nextBtn = container.querySelector("#next-question-btn");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => this.handleNext());
    }
  }

  /**
   * Handle option button selection
   */
  selectAnswer(event) {
    if (this.isAnswered) return; // Prevent double answer selection
    
    this.isAnswered = true;
    const button = event.currentTarget;
    const selectedIdx = parseInt(button.getAttribute("data-index"));
    this.selectedOption = selectedIdx;

    const question = this.currentQuestions[this.currentQuestionIndex];
    const isCorrect = selectedIdx === question.answer;

    if (isCorrect) {
      this.score++;
      button.classList.add("option-correct");
    } else {
      button.classList.add("option-incorrect");
      // Highlight correct answer in green
      const correctButton = document.querySelector(`.option-btn[data-index="${question.answer}"]`);
      if (correctButton) {
        correctButton.classList.add("option-correct-highlight");
      }
    }

    // Disable all options
    document.querySelectorAll(".option-btn").forEach(btn => {
      btn.disabled = true;
      if (btn !== button && parseInt(btn.getAttribute("data-index")) !== question.answer) {
        btn.classList.add("option-disabled");
      }
    });

    // Render explanation overlay
    const explanationBox = document.getElementById("explanation-box");
    const resultStatus = document.getElementById("result-status");
    const explanationText = document.getElementById("explanation-text");

    if (explanationBox && resultStatus && explanationText) {
      if (isCorrect) {
        resultStatus.innerHTML = `Correct! 🎉`;
        resultStatus.className = "fw-bold mb-2 text-success";
      } else {
        resultStatus.innerHTML = `Incorrect ❌`;
        resultStatus.className = "fw-bold mb-2 text-danger";
      }
      explanationText.textContent = question.explanation;
      explanationBox.classList.remove("d-none");
    }
  }

  /**
   * Navigate to next question or complete quiz
   */
  handleNext() {
    if (this.currentQuestionIndex < this.currentQuestions.length - 1) {
      this.currentQuestionIndex++;
      this.renderQuestion();
    } else {
      this.finishQuiz();
    }
  }

  /**
   * Save score, adjust memory state, update dashboard metrics
   */
  finishQuiz() {
    const finalScorePercent = Math.round((this.score / this.currentQuestions.length) * 100);
    window.memoryManager.addLog("Evaluation", `Quiz complete. Score achieved: ${this.score}/${this.currentQuestions.length} (${finalScorePercent}%).`);

    // 1. Update topic quiz status in state.syllabus
    const state = window.memoryManager.state;
    const topic = state.syllabus.topics.find(t => t.id === this.currentTopic.id);
    if (topic) {
      topic.quizScore = finalScorePercent;
      
      // Auto-complete topic if quiz was passed successfully (e.g. >= 60%)
      if (finalScorePercent >= 60 && !topic.completed) {
        topic.completed = true;
        window.memoryManager.addLog("Memory Adaptation", `Topic "${topic.name}" automatically marked as COMPLETED due to passing score.`);
      }
    }

    // 2. Record quiz attempt in history
    if (!state.quizzes) state.quizzes = [];
    state.quizzes.push({
      topicId: this.currentTopic.id,
      topicName: this.currentTopic.name,
      score: this.score,
      total: this.currentQuestions.length,
      percentage: finalScorePercent,
      date: new Date().toISOString().split("T")[0]
    });

    // 3. Register activity streak increase
    window.memoryManager.updateStreak();

    // Save final changes
    window.memoryManager.saveState();

    // 4. Update UI screen
    const container = document.getElementById("quiz-card-container");
    if (container) {
      let resultsEmoji = "🏆";
      let summaryText = "Excellent work! You have mastered this topic.";
      if (finalScorePercent < 60) {
        resultsEmoji = "📚";
        summaryText = "Good effort, but review the topic contents and try again to improve your score.";
      }

      container.innerHTML = `
        <div class="text-center py-4">
          <span style="font-size: 4.5rem; display: block;" class="mb-3">${resultsEmoji}</span>
          <h2 class="gradient-text fw-bold mb-2">Quiz Completed!</h2>
          <p class="text-secondary mb-4">${summaryText}</p>
          
          <div class="row g-3 justify-content-center mb-5">
            <div class="col-6 col-md-4">
              <div class="card glass p-3">
                <span class="text-secondary small d-block">Correct Answers</span>
                <span class="h3 fw-bold text-light">${this.score} / ${this.currentQuestions.length}</span>
              </div>
            </div>
            <div class="col-6 col-md-4">
              <div class="card glass p-3">
                <span class="text-secondary small d-block">Percentage Score</span>
                <span class="h3 fw-bold text-accent">${finalScorePercent}%</span>
              </div>
            </div>
          </div>

          <button id="quiz-back-planner-btn" class="btn btn-outline-glass me-2">Back to Study Plan</button>
          <button id="quiz-retry-btn" class="btn btn-gradient">Retake Quiz</button>
        </div>
      `;

      container.querySelector("#quiz-back-planner-btn").addEventListener("click", () => {
        // Switch tab to planner
        window.app.switchTab("planner-tab");
      });

      container.querySelector("#quiz-retry-btn").addEventListener("click", () => {
        this.startQuiz(this.currentTopic.id);
      });
    }

    // Refresh dashboard visuals to reflect scores/completion
    if (window.dashboardRenderer) {
      window.dashboardRenderer.renderAll();
    }
  }
}

// Export quiz manager
window.quizManager = new QuizManager();
