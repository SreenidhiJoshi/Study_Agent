/**
 * Planner Engine (planner.js)
 * Implements the core AI Study Planner scheduling algorithm,
 * including prioritization, revision slot booking, and automatic replanning.
 */

class StudyPlanner {
  /**
   * Generates a study plan based on user settings, syllabus topics, and current date.
   * Saves results directly to memoryManager state.
   */
  static generateSchedule() {
    const state = window.memoryManager.state;
    const profile = state.profile;
    const syllabus = state.syllabus;

    if (!syllabus || !syllabus.topics || syllabus.topics.length === 0) {
      window.memoryManager.addLog("Planning Error", "Cannot generate schedule: No syllabus topics found.");
      return false;
    }

    if (!profile.examDate) {
      window.memoryManager.addLog("Planning Error", "Cannot generate schedule: Target exam date not set.");
      return false;
    }

    window.memoryManager.addLog("Planning Core", `Initializing planner for subject "${syllabus.subject}"...`);

    // 1. Calculate study days available
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const exam = new Date(profile.examDate);
    exam.setHours(0, 0, 0, 0);

    const timeDiff = exam.getTime() - today.getTime();
    const totalDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    if (totalDays <= 0) {
      window.memoryManager.addLog("Guardrails", "Blocking schedule generation: Target exam date is today or in the past.");
      return false;
    }

    window.memoryManager.addLog("Reasoning", `Total calendar days until exam: ${totalDays} day(s).`);

    // Reserve last 2 days for revision before exam, if available
    let studyDaysCount = totalDays;
    let revisionDaysCount = 0;

    if (totalDays > 3) {
      studyDaysCount = totalDays - 2;
      revisionDaysCount = 2;
      window.memoryManager.addLog("Reasoning", `Allocated scheduling window: ${studyDaysCount} days for new topics, 2 days reserved for exam revision.`);
    } else {
      window.memoryManager.addLog("Reasoning", "Exam is too close. Using all remaining days for study and skipping revision block.");
    }

    // 2. Fetch and categorize topics
    // Filter incomplete topics to schedule
    const incompleteTopics = syllabus.topics.filter(t => !t.completed);
    const completedTopics = syllabus.topics.filter(t => t.completed);

    window.memoryManager.addLog("Memory Reading", `Retrieved progress: ${completedTopics.length}/${syllabus.topics.length} topics completed.`);

    // 3. Sort incomplete topics by priority (High > Medium > Low)
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    const sortedTopics = [...incompleteTopics].sort((a, b) => {
      return (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2);
    });

    const highCount = sortedTopics.filter(t => t.priority === "high").length;
    const medCount = sortedTopics.filter(t => t.priority === "medium").length;
    const lowCount = sortedTopics.filter(t => t.priority === "low").length;
    window.memoryManager.addLog("Prioritizing", `Prioritized topics to study: ${highCount} High, ${medCount} Medium, ${lowCount} Low.`);

    // 4. Validate with Guardrails
    const guardrailResult = window.StudyGuardrails.validatePlan(
      sortedTopics.length,
      studyDaysCount,
      profile.availableHours
    );
    window.memoryManager.addLog("Guardrails", `Validation completed. Status: ${guardrailResult.message}`);

    // If danger/unrealistic, log the recommendations to agent thinking console
    if (guardrailResult.severity === "danger") {
      window.memoryManager.addLog("Guardrails Alert", `System warning generated: ${guardrailResult.details}`);
      guardrailResult.recommendations.forEach(rec => {
        window.memoryManager.addLog("Recommendation", `💡 Suggestion: ${rec}`);
      });
    }

    // 5. Generate date-wise slots
    const newSchedule = [];
    let currentTopicIndex = 0;

    // Daily limit based on study hours
    const maxTopicsPerDay = Math.max(1, Math.floor(profile.availableHours / window.StudyGuardrails.HOURS_PER_TOPIC));
    window.memoryManager.addLog("Reasoning", `Configuring daily slots: Capped at maximum of ${maxTopicsPerDay} topic(s) per day.`);

    // Create dates
    for (let i = 0; i < totalDays; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      const dateStr = targetDate.toISOString().split("T")[0];

      // Check if this date falls within the revision window (last revisionDaysCount days before exam)
      const isRevisionDay = (i >= totalDays - revisionDaysCount);

      if (isRevisionDay) {
        // Revision days get weak performance topics or general reviews
        newSchedule.push({
          date: dateStr,
          topicIds: [], // populate with weak topics later
          completed: [],
          isRevision: true
        });
      } else {
        // Regular study day
        const dayTopics = [];
        for (let t = 0; t < maxTopicsPerDay; t++) {
          if (currentTopicIndex < sortedTopics.length) {
            dayTopics.push(sortedTopics[currentTopicIndex].id);
            currentTopicIndex++;
          }
        }

        newSchedule.push({
          date: dateStr,
          topicIds: dayTopics,
          completed: [],
          isRevision: false
        });
      }
    }

    // If there are left over topics that didn't fit due to hours/guardrails capacity,
    // we must distribute them anyway (or keep them unscheduled and alert), but to be helpful
    // we overflow-distribute them to dates, marking them overloaded so guardrails flag it
    if (currentTopicIndex < sortedTopics.length) {
      window.memoryManager.addLog("Guardrails", `Capacity overflow: ${sortedTopics.length - currentTopicIndex} topics could not fit inside recommended daily hours.`);
      
      // Distribute overflow topics across non-revision days
      let studyDayIdx = 0;
      while (currentTopicIndex < sortedTopics.length && studyDaysCount > 0) {
        const scheduleDay = newSchedule[studyDayIdx % studyDaysCount];
        scheduleDay.topicIds.push(sortedTopics[currentTopicIndex].id);
        currentTopicIndex++;
        studyDayIdx++;
      }
    }

    // 6. Populate Revision Days
    // Revision topics are topics already studied that scored < 70% in quizzes,
    // or high-priority topics that were recently completed.
    const weakTopics = syllabus.topics.filter(t => t.completed && t.quizScore !== null && t.quizScore < 70);
    const revisionTopicIds = weakTopics.map(t => t.id);

    if (revisionTopicIds.length > 0) {
      window.memoryManager.addLog("Reasoning", `Found ${weakTopics.length} weak topics (quiz score < 70%). Adding to revision sessions.`);
      
      // Distribute weak topics evenly across revision days
      let revDayIdx = 0;
      revisionTopicIds.forEach(topicId => {
        const revScheduleDays = newSchedule.filter(s => s.isRevision);
        if (revScheduleDays.length > 0) {
          const revDay = revScheduleDays[revDayIdx % revScheduleDays.length];
          revDay.topicIds.push(topicId);
          revDayIdx++;
        }
      });
    } else {
      window.memoryManager.addLog("Reasoning", "No weak performance topics found yet. Revision window will cover general key topics.");
      // Fallback: Add high priority topics for review
      const highPriorityIds = syllabus.topics.filter(t => t.priority === "high").slice(0, 4).map(t => t.id);
      let revDayIdx = 0;
      highPriorityIds.forEach(topicId => {
        const revScheduleDays = newSchedule.filter(s => s.isRevision);
        if (revScheduleDays.length > 0) {
          const revDay = revScheduleDays[revDayIdx % revScheduleDays.length];
          if (!revDay.topicIds.includes(topicId)) {
            revDay.topicIds.push(topicId);
            revDayIdx++;
          }
        }
      });
    }

    // Save generated schedule to memory
    state.schedule = newSchedule;
    window.memoryManager.saveState();
    window.memoryManager.addLog("Planning Core", "Personalized study timetable generated successfully!");

    return true;
  }

  /**
   * Checks if student has missed past deadlines, and automatically replans
   * the timetable starting from today.
   */
  static checkAndReplan() {
    const state = window.memoryManager.state;
    if (!state.schedule || state.schedule.length === 0) return;

    const todayStr = new Date().toISOString().split("T")[0];
    let missedTasksCount = 0;

    // Check if there are any incomplete tasks in the past days
    state.schedule.forEach(day => {
      if (day.date < todayStr && !day.isRevision) {
        day.topicIds.forEach(topicId => {
          // Find topic completion status
          const topic = state.syllabus.topics.find(t => t.id === topicId);
          if (topic && !topic.completed && !day.completed.includes(topicId)) {
            missedTasksCount++;
          }
        });
      }
    });

    if (missedTasksCount > 0) {
      window.memoryManager.addLog("Memory Adaptation", `Detected ${missedTasksCount} incomplete task(s) from past dates.`);
      window.memoryManager.addLog("Memory Adaptation", "Initiating automatic replanning sequence to rescue schedule...");
      
      // Re-run schedule builder! Since it pulls all incomplete topics and maps
      // them from today forward, it automatically absorbs missed tasks and pushes
      // them into future slots.
      const success = this.generateSchedule();
      if (success) {
        window.memoryManager.addLog("Memory Adaptation", "Replanning complete. Schedule re-optimized based on current progress.");
      }
      return true;
    }

    return false;
  }
}

// Export planner
window.StudyPlanner = StudyPlanner;
