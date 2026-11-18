# LinyaIIT — Smart Campus Queue Management System

**Tagline:** Less Waiting. Better Service. Smarter MSU-IIT.

A mobile-first, zero-backend digital queue management system designed for **Mindanao State University – Iligan Institute of Technology (MSU-IIT)**.

## Features
- **Student Portal (Default Public View):** Generate digital queue tickets across MSU-IIT campus offices (Registrar, Cashier, Admissions, Guidance, Medical Clinic), monitor real-time queue position and estimated waiting time, view local ticket history, and print/save digital passes.
- **Password-Protected Staff & Analytics Portal:** Both **Queue Management** and **Analytics & Reports** are grouped under the protected **Staff & Analytics** tab (default password: `msuiit2026`, configurable in `script.js`) so students cannot access staff controls or analytics.
- **Staff Queue Management:** FIFO + Priority lane ordering, Call Next, Recall, Mark Completed, Skip Ticket, Requeue, live elapsed service timer, search/filter, and CSV report export.
- **Analytics Dashboard:** Real-time metrics (total tickets, completed, skipped, average waiting time when sufficient data exists) with HTML5 Canvas visualizations.

## Project Structure
- `index.html` — Application layout, authentication modal, and views
- `style.css` — Responsive MSU-IIT Navy (`#132A44`), Blue (`#2685D8`), and Cyan (`#53BECF`) theme with Dark Mode support
- `script.js` — Queue management logic, password authentication, `localStorage` persistence, audio chimes, CSV export, and Canvas charts
