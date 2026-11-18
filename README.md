# LinyaIIT — Smart Campus Queue Management System

**Tagline:** Less Waiting. Better Service. Smarter MSU-IIT.

A mobile-first, zero-backend digital queue management system designed for **Mindanao State University – Iligan Institute of Technology (MSU-IIT)**.

## Features
- **Student Portal:** Generate digital queue tickets across MSU-IIT campus offices (Registrar, Cashier, Admissions, Guidance, Medical Clinic), monitor real-time queue position and estimated waiting time, view local ticket history, and print/save digital passes.
- **Staff Dashboard:** Manage active office queues with FIFO + Priority lane ordering, Call Next, Recall, Mark Completed, Skip Ticket, Requeue, live elapsed service timer, search/filter, and CSV report export.
- **Analytics Dashboard:** Real-time metrics (total tickets, completed, skipped, average waiting time when sufficient data exists) with HTML5 Canvas visualizations.
- **Offline-First & GitHub Pages Ready:** Built strictly with HTML5, CSS3, Vanilla JavaScript, and `localStorage` with multi-tab live synchronization.

## Project Structure
- `index.html` — Application layout and views
- `style.css` — Responsive MSU-IIT Navy (`#132A44`), Blue (`#2685D8`), and Cyan (`#53BECF`) theme with Dark Mode support
- `script.js` — Queue management logic, `localStorage` persistence, audio chimes, CSV export, and Canvas charts
