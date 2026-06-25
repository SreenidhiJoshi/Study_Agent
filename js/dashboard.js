/**
 * Dashboard Component (dashboard.js)
 * Calculations and rendering for stats blocks, progress charts,
 * next study recommendations, and revision list overlays.
 */

class DashboardRenderer {
  constructor() {
    this.state = window.memoryManager.state;
  }

  /**
   * Run all dashboard rendering sub-tasks
   */
  renderAll() {
    this.state = window.memoryManager.state; // Refresh state reference
    
    this.renderStatsGrid();
    this.renderProgressCharts();
    this.renderNextStudySession();
    this.renderWeakTopicsSummary();
    this.renderScheduleCalendar();
    this.renderQuizHistory();
  }

  /**
   * Renders the quiz performance records and active streaks under Progress tab
   */
  renderQuizHistory() {
    const tableBody = document.getElementById("quiz-history-table-body");
    const streakValue = document.getElementById("progress-streak-value");

    if (streakValue) {
      streakValue.textContent = this.state.streak ? this.state.streak.count : 0;
    }

    if (!tableBody) return;

    if (!this.state.quizzes || this.state.quizzes.length === 0) {
      tableBody.innerHTML = `
        <tr class="border-bottom-glass">
          <td colspan="3" class="py-4 text-center text-secondary">No quiz logs available.</td>
        </tr>
      `;
      return;
    }

    // Sort quizzes: newest first
    const sortedQuizzes = [...this.state.quizzes].reverse();

    tableBody.innerHTML = sortedQuizzes.map(q => `
      <tr class="border-bottom-glass" style="height: 45px; border-bottom: 1px solid rgba(255,255,255,0.05)">
        <td class="py-2 text-light">${q.topicName}</td>
        <td class="py-2">
          <span class="badge ${q.percentage >= 60 ? 'badge-success' : 'badge-danger'}">
            ${q.score}/${q.total} (${q.percentage}%)
          </span>
        </td>
        <td class="py-2 text-secondary small">${new Date(q.date).toLocaleDateString()}</td>
      </tr>
    `).join("");
  }

  /**
   * Renders the top stats banner grid
   */
  renderStatsGrid() {
    const totalTopics = this.state.syllabus ? this.state.syllabus.topics.length : 0;
    const completedTopics = this.state.syllabus ? this.state.syllabus.topics.filter(t => t.completed).length : 0;
    const remainingTopics = totalTopics - completedTopics;
    
    // Calculate progress percentage
    const progressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
    
    // Calculate average quiz score
    let avgQuizScore = 0;
    if (this.state.quizzes && this.state.quizzes.length > 0) {
      const totalScorePercent = this.state.quizzes.reduce((sum, q) => sum + q.percentage, 0);
      avgQuizScore = Math.round(totalScorePercent / this.state.quizzes.length);
    }

    // Days left calculation
    let daysLeft = "N/A";
    if (this.state.profile.examDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const exam = new Date(this.state.profile.examDate);
      exam.setHours(0, 0, 0, 0);
      const diff = exam.getTime() - today.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      daysLeft = days >= 0 ? `${days}` : "Overdue";
    }

    const streakCount = this.state.streak ? this.state.streak.count : 0;

    // Set texts in DOM
    const elCompleted = document.getElementById("stat-completed");
    const elRemaining = document.getElementById("stat-remaining");
    const elProgress = document.getElementById("stat-progress");
    const elAvgScore = document.getElementById("stat-avg-score");
    const elStreak = document.getElementById("stat-streak");
    const elDaysLeft = document.getElementById("stat-days-left");

    if (elCompleted) elCompleted.textContent = completedTopics;
    if (elRemaining) elRemaining.textContent = remainingTopics;
    if (elProgress) {
      elProgress.textContent = `${progressPercent}%`;
      // Update circular progress circle stroke if exists
      const circle = document.querySelector(".progress-ring-circle");
      if (circle) {
        const radius = circle.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        const offset = circumference - (progressPercent / 100) * circumference;
        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        circle.style.strokeDashoffset = offset;
      }
    }
    if (elAvgScore) elAvgScore.textContent = avgQuizScore > 0 ? `${avgQuizScore}%` : "0%";
    if (elStreak) {
      elStreak.innerHTML = `${streakCount} <span class="streak-flame ${streakCount > 0 ? 'active' : ''}">🔥</span>`;
    }
    if (elDaysLeft) elDaysLeft.textContent = daysLeft;
  }

  /**
   * Renders modular subject/chapter performance charts
   */
  renderProgressCharts() {
    const container = document.getElementById("progress-chart-container");
    if (!container) return;

    if (!this.state.syllabus || !this.state.syllabus.topics || this.state.syllabus.topics.length === 0) {
      container.innerHTML = `
        <div class="text-center py-4 text-secondary">
          <p>Please upload a syllabus to view detailed charts.</p>
        </div>
      `;
      return;
    }

    const topics = this.state.syllabus.topics;
    
    // Group progress by Priority
    const priorities = ["high", "medium", "low"];
    let chartHtml = `<h5>Progress by Priority Level</h5><div class="d-grid gap-3 mt-3">`;

    priorities.forEach(priority => {
      const priorityTopics = topics.filter(t => t.priority === priority);
      const total = priorityTopics.length;
      if (total === 0) return;

      const completed = priorityTopics.filter(t => t.completed).length;
      const percent = Math.round((completed / total) * 100);

      let colorClass = "bg-accent";
      if (priority === "high") colorClass = "bg-danger";
      if (priority === "low") colorClass = "bg-success";

      chartHtml += `
        <div>
          <div class="d-flex justify-content-between mb-1">
            <span class="text-capitalize small fw-bold">${priority} Priority (${completed}/${total})</span>
            <span class="small text-secondary fw-bold">${percent}%</span>
          </div>
          <div class="progress-track" style="height: 10px; background: rgba(255,255,255,0.08); border-radius: 5px; overflow: hidden;">
            <div class="${colorClass}" style="width: ${percent}%; height: 100%; transition: width 0.6s ease-in-out;"></div>
          </div>
        </div>
      `;
    });

    chartHtml += `</div>`;
    container.innerHTML = chartHtml;
  }

  /**
   * Identifies the next recommended study session task and presents it
   */
  renderNextStudySession() {
    const container = document.getElementById("next-session-container");
    if (!container) return;

    if (!this.state.syllabus || !this.state.schedule || this.state.schedule.length === 0) {
      container.innerHTML = `
        <div class="p-4 text-center">
          <p class="text-secondary m-0">No active study timetable. Upload your syllabus to begin.</p>
        </div>
      `;
      return;
    }

    // Find the first incomplete topic in chronological schedule
    let nextTopic = null;
    let targetDay = null;

    // Filter schedule days that are today or in future, and check for incomplete topics
    const todayStr = new Date().toISOString().split("T")[0];

    for (const day of this.state.schedule) {
      // Look for a topic in this day that is NOT marked completed in syllabus state
      for (const topicId of day.topicIds) {
        const topic = this.state.syllabus.topics.find(t => t.id === topicId);
        if (topic && !topic.completed) {
          nextTopic = topic;
          targetDay = day;
          break;
        }
      }
      if (nextTopic) break;
    }

    if (!nextTopic) {
      container.innerHTML = `
        <div class="p-4 text-center text-success">
          <span class="fs-2">🎉</span>
          <p class="mt-2 mb-0 fw-bold">All caught up! All topics completed.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="card glass border-accent hover-glow p-4 position-relative overflow-hidden">
        <span class="position-absolute top-0 end-0 m-3 badge badge-${nextTopic.priority === 'high' ? 'danger' : (nextTopic.priority === 'low' ? 'success' : 'accent')}">
          ${nextTopic.priority.toUpperCase()} PRIORITY
        </span>
        <h6 class="text-secondary text-uppercase fw-bold tracking-wider mb-2">Next Study Session</h6>
        <h4 class="mb-3 text-light">${nextTopic.name}</h4>
        <p class="text-secondary small mb-4">
          Scheduled for: <strong>${new Date(targetDay.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</strong>
          ${targetDay.isRevision ? ' (Exam Revision Session)' : ''}
        </p>

        <div class="d-flex flex-wrap gap-2">
          <button class="btn btn-gradient btn-sm next-complete-btn" data-id="${nextTopic.id}">
            Mark Completed
          </button>
          <button class="btn btn-outline-glass btn-sm next-quiz-btn" data-id="${nextTopic.id}">
            Take Quiz
          </button>
        </div>
      </div>
    `;

    // Hook listeners
    container.querySelector(".next-complete-btn").addEventListener("click", () => {
      this.markTopicComplete(nextTopic.id, true);
    });

    container.querySelector(".next-quiz-btn").addEventListener("click", () => {
      window.quizManager.startQuiz(nextTopic.id);
    });
  }

  /**
   * Helper to toggle topic completion
   */
  markTopicComplete(topicId, completedStatus) {
    const state = window.memoryManager.state;
    const topic = state.syllabus.topics.find(t => t.id === topicId);
    
    if (topic) {
      topic.completed = completedStatus;
      if (completedStatus) {
        window.memoryManager.addLog("Memory Reading", `Checked off "${topic.name}" as completed.`);
        window.memoryManager.updateStreak();
      } else {
        window.memoryManager.addLog("Memory Reading", `Unmarked "${topic.name}" as complete.`);
        // Reset score if unchecked
        topic.quizScore = null;
      }
      
      window.memoryManager.saveState();
      
      // Auto replan check
      window.StudyPlanner.checkAndReplan();
      
      // Re-render dashboard
      this.renderAll();
    }
  }

  /**
   * Lists weak topics and dynamically prompts revision plans
   */
  renderWeakTopicsSummary() {
    const container = document.getElementById("weak-topics-container");
    if (!container) return;

    if (!this.state.syllabus || !this.state.syllabus.topics) {
      container.innerHTML = `<p class="text-secondary">No syllabus loaded.</p>`;
      return;
    }

    // Weak topics = quizScore is recorded and < 70%
    const weakTopics = this.state.syllabus.topics.filter(t => t.quizScore !== null && t.quizScore < 70);

    if (weakTopics.length === 0) {
      container.innerHTML = `
        <div class="p-3 text-center border-glass text-success rounded">
          <p class="m-0 small">No weak topics identified yet. Maintain high quiz scores! 🌟</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="alert alert-warning-glass mb-3">
        <strong>Automatic Revision Slots Active:</strong> The final study days will automatically schedule reviews for the following ${weakTopics.length} weak areas.
      </div>
      <div class="d-grid gap-2">
        ${weakTopics.map(topic => `
          <div class="d-flex justify-content-between align-items-center p-2 border-glass rounded bg-dark-glass">
            <div>
              <span class="small text-light d-block">${topic.name}</span>
              <span class="badge badge-danger" style="font-size: 0.7rem;">Quiz Score: ${topic.quizScore}%</span>
            </div>
            <button class="btn btn-outline-glass btn-xs text-accent retake-weak-btn" data-id="${topic.id}">
              Retake Quiz
            </button>
          </div>
        `).join("")}
      </div>
    `;

    container.querySelectorAll(".retake-weak-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        window.quizManager.startQuiz(btn.getAttribute("data-id"));
      });
    });
  }

  /**
   * Renders the comprehensive study planner calendar grid on Study Planner Tab
   */
  renderScheduleCalendar() {
    const container = document.getElementById("calendar-schedule-container");
    if (!container) return;

    if (!this.state.schedule || this.state.schedule.length === 0) {
      container.innerHTML = `
        <div class="text-center py-5 text-secondary">
          <h4>No timetable created.</h4>
          <p>Please enter your syllabus and exam metrics on the Syllabus page.</p>
        </div>
      `;
      return;
    }

    let html = `<div class="row g-3">`;

    this.state.schedule.forEach(day => {
      const dayDate = new Date(day.date);
      const isPast = day.date < new Date().toISOString().split("T")[0];
      const isToday = day.date === new Date().toISOString().split("T")[0];

      let dayBorder = "";
      if (isToday) dayBorder = "border-accent shadow-glow";
      else if (day.isRevision) dayBorder = "border-info";

      html += `
        <div class="col-12 col-md-6 col-lg-4">
          <div class="card glass h-100 p-3 ${dayBorder} ${isPast ? 'opacity-70' : ''}">
            <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom-glass">
              <div>
                <span class="fw-bold d-block text-light" style="font-size: 0.95rem;">
                  ${dayDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                ${isToday ? '<span class="badge badge-accent btn-xs">TODAY</span>' : ''}
                ${day.isRevision ? '<span class="badge badge-info btn-xs">REVISION BLOCK</span>' : ''}
              </div>
              <span class="text-secondary small">
                ${day.topicIds.length} Topic(s)
              </span>
            </div>

            <div class="d-grid gap-2 my-2">
              ${day.topicIds.map(topicId => {
                const topic = this.state.syllabus.topics.find(t => t.id === topicId);
                if (!topic) return '';

                const isTaskCompleted = topic.completed;
                const scoreLabel = topic.quizScore !== null ? `<span class="badge badge-accent mt-1">${topic.quizScore}% Quiz</span>` : '';

                return `
                  <div class="topic-item-card p-2 rounded bg-dark-glass ${isTaskCompleted ? 'topic-completed-border' : ''}">
                    <div class="d-flex align-items-start justify-content-between">
                      <div class="form-check m-0">
                        <input class="form-check-input topic-check" type="checkbox" id="check-${day.date}-${topic.id}" data-id="${topic.id}" ${isTaskCompleted ? 'checked' : ''}>
                        <label class="form-check-label small text-light ps-1 ${isTaskCompleted ? 'text-decoration-line-through text-secondary' : ''}" for="check-${day.date}-${topic.id}">
                          ${topic.name}
                        </label>
                      </div>
                      <span class="badge badge-priority badge-${topic.priority}">${topic.priority[0].toUpperCase()}</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-2 pt-1 border-top-glass-light">
                      ${scoreLabel}
                      <button class="btn btn-outline-glass btn-xs ms-auto calendar-quiz-btn" data-id="${topic.id}">
                        Quiz
                      </button>
                    </div>
                  </div>
                `;
              }).join("")}
              ${day.topicIds.length === 0 ? '<p class="text-secondary small text-center my-2">Rest day / Unallocated</p>' : ''}
            </div>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;

    // Bind event listeners for checks and quiz buttons
    container.querySelectorAll(".topic-check").forEach(check => {
      check.addEventListener("change", (e) => {
        const id = e.target.getAttribute("data-id");
        this.markTopicComplete(id, e.target.checked);
      });
    });

    container.querySelectorAll(".calendar-quiz-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        window.quizManager.startQuiz(btn.getAttribute("data-id"));
      });
    });
  }
}

// Export dashboard renderer
window.dashboardRenderer = new DashboardRenderer();
