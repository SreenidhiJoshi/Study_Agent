# AI Study Planner Agent

## Overview

AI Study Planner Agent is an intelligent web-based study assistant designed to help students prepare effectively for examinations. Instead of generating a simple subject-wise timetable, the agent creates a personalized study schedule based on the uploaded syllabus, available study hours, subject priorities, and exam date.

The application follows an agentic workflow where it analyzes user inputs, plans study sessions, tracks progress, adapts schedules, and evaluates learning through quizzes. The project demonstrates the concepts of planning, memory, reasoning, guardrails, and evaluation without relying on external APIs or cloud services.

---

## Problem Statement

Students often struggle to organize large syllabi, prioritize important topics, monitor their learning progress, and revise efficiently before examinations. Traditional timetable applications create static schedules that do not adapt when students miss planned study sessions.

The AI Study Planner Agent addresses these challenges by automatically generating and continuously updating personalized study plans while monitoring progress and encouraging effective learning through quizzes.

---

## Objectives

* Generate personalized study schedules based on syllabus topics.
* Break down subjects into individual topics instead of assigning entire subjects.
* Adapt the timetable whenever study sessions are missed.
* Track completed topics and learning progress.
* Conduct quizzes after each completed topic.
* Schedule revision sessions before examinations.
* Provide an interactive dashboard for monitoring performance.

---

## Features

###  Syllabus Upload

* Upload syllabus files (TXT/PDF/DOCX).
* Automatically extract units and topics.

###  Smart Study Planner

* Generates topic-wise study plans.
* Considers:

  * Exam date
  * Daily study hours
  * Subject priority
  * Remaining syllabus

###  Agent Memory

* Stores completed topics using Local Storage.
* Remembers quiz scores.
* Maintains study history.
* Automatically updates future schedules.

###  Agent Reasoning

Displays the internal planning process such as:

* Reading syllabus
* Analyzing remaining days
* Prioritizing difficult topics
* Generating study schedule
* Updating progress

###  Quiz Module

* Topic-wise quizzes
* Local JSON-based question bank
* Automatic scoring
* Performance tracking

###  Dashboard

Displays:

* Completed topics
* Remaining topics
* Progress percentage
* Average quiz score
* Study streak
* Days remaining until examination

###  Revision Planner

* Automatically schedules revision sessions.
* Prioritizes weak topics based on quiz scores.

###  Guardrails

Prevents unrealistic study plans by:

* Limiting excessive daily workload
* Suggesting balanced schedules
* Warning users about insufficient preparation time

---

## Technology Stack

### Frontend

* HTML5
* CSS3
* JavaScript (ES6)

### Storage

* Browser Local Storage

### Data Format

* JSON

---

## Project Structure

```text
study-agent/
│
├── index.html
├── styles.css
├── js/
│   ├── main.js
│   ├── planner.js
│   ├── parser.js
│   ├── memory.js
│   ├── quiz.js
│   ├── dashboard.js
│   └── guardrails.js
│
├── data/
│   ├── questions.json
│   └── sample_syllabus.txt
│
└── README.md
```

---

## Agent Workflow

1. Student uploads the syllabus.
2. Agent extracts units and topics.
3. Student enters:

   * Exam date
   * Study hours per day
   * Subject priorities
4. Agent generates a personalized study schedule.
5. Student marks topics as completed.
6. Agent updates future plans automatically.
7. Student takes quizzes.
8. Dashboard displays progress.
9. Agent schedules revision sessions before the examination.

---

## Agent Capabilities

* Planning
* Memory
* Reasoning
* Adaptation
* Evaluation
* Progress Tracking
* Guardrails

---

## Future Enhancements

* Multi-user support
* Calendar integration
* AI-generated quiz questions
* Cloud synchronization
* Email reminders
* Mobile application
* Voice assistant support

---

## Conclusion

AI Study Planner Agent demonstrates how agent-based systems can improve student learning by combining intelligent planning, adaptive scheduling, long-term memory, evaluation, and progress tracking. The project showcases the core principles of agentic engineering while remaining lightweight, easy to use, and completely frontend-based without requiring external APIs.
