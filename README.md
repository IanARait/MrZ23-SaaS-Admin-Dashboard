# FlowBoard — SaaS Admin Dashboard

A premium, production-style SaaS admin dashboard built for a Frontend Developer portfolio. Manage your business from one powerful workspace.

## Overview

FlowBoard is a fully functional admin dashboard featuring 16+ pages, dark/light mode, responsive design, interactive data visualization, CRUD operations, and a complete design system — all built with vanilla HTML, CSS, and JavaScript.

## Features

- **16+ Pages** — Dashboard, Analytics, Users, Customers, Projects, Tasks, Invoices, Transactions, Products, Messages, Calendar, Reports, Notifications, Settings, Profile, Help
- **Authentication** — Login, Register, Forgot Password, Reset Password (simulated)
- **Dark/Light Mode** — Full theme support with 6 accent color presets
- **Responsive Design** — Works on 320px to 1920px+ screens
- **Data Visualization** — Chart.js powered charts (line, bar, doughnut, multi-line)
- **Kanban Board** — Drag-and-drop task management
- **Global Search** — Ctrl+K command palette across all data
- **DataTable Component** — Search, sort, filter, paginate, bulk actions, CSV export
- **CRUD Operations** — Create, read, update, delete for users, customers, projects, tasks, invoices, products
- **Modals & Drawers** — Reusable modal and side-panel systems
- **Toast Notifications** — Success, error, warning, info toasts
- **Calendar** — Month/week views with event management
- **Messages** — Real-time chat interface
- **Settings** — Profile, Security, Notifications, Appearance, Billing
- **Accessibility** — Semantic HTML, ARIA labels, keyboard navigation, focus states
- **LocalStorage Persistence** — All data persists across page refreshes
- **Demo Mode** — Reset button to restore original mock data

## Tech Stack

| Technology | Usage |
|------------|-------|
| HTML5 | Semantic markup |
| CSS3 | Custom properties, Grid, Flexbox, animations |
| Vanilla JS ES6+ | Application logic, components, data layer |
| Chart.js 4.x | Data visualization |
| Font Awesome 6.5 | Icons |
| Google Fonts | Inter + Plus Jakarta Sans |
| LocalStorage | Data persistence |

**No frameworks. No build tools. No backend.**

## How to Run

1. Clone or download the project
2. Open `index.html` in a browser
3. Login with demo credentials:
   - **Email:** `admin@flowboard.test`
   - **Password:** `password`

## Project Structure

```
SaaS-Admin-Dashboard/
├── index.html                  # Redirects to dashboard
├── 404.html                    # Not found page
├── auth/
│   ├── login.html              # Login page
│   ├── register.html           # Registration page
│   ├── forgot-password.html    # Password recovery
│   └── reset-password.html     # Password reset
├── pages/
│   ├── dashboard.html          # Main dashboard
│   ├── analytics.html          # Analytics & metrics
│   ├── users.html              # User management
│   ├── customers.html          # Customer management
│   ├── projects.html           # Project management
│   ├── tasks.html              # Kanban task board
│   ├── invoices.html           # Invoice management
│   ├── transactions.html       # Financial transactions
│   ├── products.html           # Product catalog
│   ├── messages.html           # Team messaging
│   ├── calendar.html           # Event calendar
│   ├── notifications.html      # Notification center
│   ├── reports.html            # Business reports
│   ├── settings.html           # Account settings
│   ├── profile.html            # User profile
│   └── help.html               # Help center
├── css/
│   ├── variables.css           # Design tokens
│   ├── reset.css               # CSS reset
│   ├── global.css              # Layout & shell
│   ├── components.css          # Reusable components
│   ├── dashboard.css           # Dashboard styles
│   ├── tables.css              # DataTable styles
│   ├── forms.css               # Form styles
│   ├── responsive.css          # Breakpoints
│   └── animations.css          # Keyframes
├── js/
│   ├── storage.js              # Mock data engine + localStorage
│   ├── theme.js                # Dark/light/accent/density
│   ├── auth.js                 # Auth page helpers
│   ├── toast.js                # Toast notifications
│   ├── modal.js                # Modal & drawer system
│   ├── charts.js               # Chart.js wrapper
│   ├── app.js                  # App shell + DataTable component
│   └── pages/                  # Page-specific logic
│       ├── dashboard.js
│       ├── analytics.js
│       ├── users.js
│       ├── customers.js
│       ├── projects.js
│       ├── tasks.js
│       ├── invoices.js
│       ├── transactions.js
│       ├── products.js
│       ├── messages.js
│       ├── calendar.js
│       ├── reports.js
│       └── settings.js
└── assets/
    └── favicon.svg
```

## Mock Data

The app generates deterministic mock data on first load:
- 100 Users
- 50 Customers
- 30 Projects
- 150 Tasks
- 50 Invoices
- 100 Transactions
- 50 Products
- 30 Notifications
- 20 Conversations
- 20 Calendar Events

All data uses realistic names, companies, and relationships. Data persists in LocalStorage and can be reset via the "Reset Data" button.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Improvements

- Real-time notifications with WebSocket
- PDF invoice generation
- Multi-language support
- Real OAuth integration
- Image upload for products/users
- Drag-and-drop file uploads
- Advanced analytics with date range picker

## License

Built as a portfolio demonstration project.
