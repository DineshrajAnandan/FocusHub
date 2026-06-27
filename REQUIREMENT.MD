Design a modern web application called FocusTube.

Product Vision

FocusTube helps users consume YouTube intentionally instead of endlessly scrolling.

The app acts as a personal learning and content consumption manager.

Users should add videos, playlists, and learning resources into organized categories before watching them.

The goal is to reduce distractions and increase focused learning.


⸻

Target Users

* Software engineers
* Students
* Lifelong learners
* People struggling with YouTube distraction
* Users preparing for certifications, interviews, fitness goals, hobbies, etc.

⸻

Primary User Problem

Users open YouTube to learn something but end up:

* Watching unrelated videos
* Following recommendations
* Losing hours scrolling
* Forgetting saved videos
* Not tracking learning progress

FocusTube should become the user’s trusted watch queue.

⸻

Core Features

Authentication

Support:

* Google Login (OAuth)

After login:

* Create user profile
* Sync data to Google account

⸻

Dashboard

Display:

Today’s Queue

Videos planned for today.

Show:

* Thumbnail
* Title
* Category
* Duration
* Status

Statuses:

* Planned
* In Progress
* Completed
* Skipped

⸻

Learning Progress

Cards showing:

* Videos completed this week
* Hours watched
* Categories progressing
* Current streak

⸻

Focus Score

Calculate:

* Planned videos watched
* Unplanned videos watched
* Weekly consistency

Show score from 0–100.

⸻

Categories

Users can create custom categories.

Examples:

* AI Certifications
* FAANG Interview Prep
* Startup Ideas
* Guitar
* Gym & Fitness
* Programming
* Productivity
* Personal Finance

Each category should have:

* Name
* Color
* Icon
* Description

⸻

Video Management

Users can add videos by:

Method 1

Paste YouTube URL.

Example:

https://youtube.com/watch?v=xxxxx

Fetch automatically:

* Thumbnail
* Title
* Channel
* Duration

⸻

Method 3

Import from Watch Later.

⸻

Method 4

Import from Playlist.

⸻

Playlist Management

Users can:

* Import YouTube playlist
* Create custom playlists

Example:

AI Learning Path

Contains:

* Prompt Engineering
* RAG
* Vector Databases
* MCP
* AI Agents

Display:

* Total videos
* Total duration
* Completion percentage

⸻

Watch Queue

A dedicated page.

Supports:

* Drag-and-drop ordering
* Priorities

Priority levels:

* High
* Medium
* Low

Users can schedule videos.

Example:

Monday:

* RAG Tutorial

Tuesday:

* System Design

Wednesday:

* Guitar Practice

⸻

Focus Mode

Most important feature.

When user clicks Watch:

Open embedded YouTube player.

Hide:

* Recommendations
* Comments
* Sidebar
* Related Videos

Only show:

* Video
* Notes
* Progress

Goal:

Remove distractions.

⸻

Notes System

While watching:

Users can create:

* Notes
* Highlights
* Action items

Example:

Video:
“System Design Interview”

Notes:

* Consistent hashing
* Read replication
* Write sharding

⸻

Learning Paths

Users can create structured plans.

Example:

FAANG Preparation

Week 1:

* Arrays
* Strings

Week 2:

* Trees
* Graphs

Week 3:

* System Design

Track completion.

⸻

Smart Recommendations

Instead of YouTube recommendations:

Suggest from user’s backlog.

Example:

You completed:

* RAG Basics

Suggested next:

* Advanced RAG
* MCP
* Agent Architectures

⸻

Search

Global search across:

* Categories
* Videos
* Notes
* Playlists

⸻


Google Integration

Use Google APIs.

Google Sheets

Store:

* Videos
* Categories
* Progress

as backup.

⸻

Google Drive

Export:

* Notes
* Learning plans

⸻

YouTube Data API

Fetch:

* Video metadata
* Playlist metadata
* Channel metadata

⸻

Mobile Experience

Design mobile-first responsive layouts.

Create screens for:

* Dashboard
* Queue
* Video Player
* Notes
* Analytics
* Settings

⸻

UI Design Requirements

Style:

* Clean
* Minimal
* Productivity-focused

Inspiration:

* Notion
* Linear
* Todoist
* Readwise

Colors:

* Light mode
* Dark mode

Typography:

* Modern sans-serif

Components:

* Cards
* Tables
* Kanban boards
* Progress indicators
* Analytics charts

⸻

Deliverables

Generate:

1. User personas
2. User journeys
3. Information architecture
4. Sitemap
5. Wireframes
6. High-fidelity UI mockups
7. Design system
8. Component library
9. Database schema
10. API design
11. ER diagrams
12. Responsive mobile designs
13. Accessibility guidelines
14. Developer handoff specifications

⸻

Suggested Tech Stack

Frontend:

* React
* TypeScript
* Vite
* Tailwind CSS
* Shadcn UI

Backend:

* users google sheet and google drive as data store

Authentication:

* Google OAuth

Integrations:

* YouTube Data API v3
* Google Sheets API
* Google Drive API

⸻

Future Features

* Browser extension to save videos with one click
* AI-generated video summaries
* AI-generated notes
* Learning goal tracking
* Daily learning planner
* Pomodoro timer
* Content consumption budget (e.g., max 60 minutes/day)
* Block unplanned YouTube videos
* Chrome extension that redirects YouTube homepage to FocusTube queue

This last feature (redirecting YouTube homepage and recommendations into your planned queue) is likely what will make the biggest difference in reducing distraction.