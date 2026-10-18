# Quantaid Frontend

React + TypeScript + Vite frontend for the Quantaid learning platform. Quantaid is an AI-powered platform designed to bridge the educational gap in early quantum computing instruction by delivering personalized feedback and adaptive learning experiences.

## Deployed Site

[https://quantaid.org](https://quantaid.org)

## Backend

This app talks to the [FastAPI backend](https://github.com/AB-102/quantaid-backend) at the origin in `VITE_BACKEND_URL` (without `/api`; the app adds it). Locally that's `http://localhost:8000`.

## Development

Requires Node.js 20.19 or newer (Vite 8).

```bash
git clone https://github.com/AB-102/quantaid-frontend.git
cd quantaid-frontend/frontend
npm install
cp .env.example .env  # Fill in the necessary keys in .env
npm run dev           # Start dev server with HMR
npm run build         # Type-check and production build
npm run test:run      # Run the tests once
npm run lint          # Lint
```

## Project Structure

```
src/
  api.ts            Axios instance for the backend (cookies, 401 → sign-out)
  AuthContext.tsx   Signed-in state, ProtectedRoute, AdminRoute
  constants/        Shared constants (theme colors, form options)
  types/            TypeScript interfaces (quiz, lesson, course, profile)
  hooks/            Custom React hooks
  components/
    common/         Shared UI (Reading, QuizProgressBar, FeedbackModal)
    layout/         Sidebar, DashboardHeader
    auth/           Login (Google sign-in)
    dashboard/      Dashboard, CourseCard, CourseDetailView, LessonView
    quiz/           Quiz, Questions, QuizFooter, QuizResultsScreen, settings dropdown
    profile/        Profile modal, ProfileCreation wizard, DefaultStep, step configs
    admin/          AdminDashboard, ContentManager, LessonEditor
    chat/           GlobalChat
    tutorial/       TutorialPopup
  test/             Test setup and helpers
  assets/           Images, videos, icons
```

## License

MIT License

## Citation

If you use Quantaid in an academic work, please cite:

> Kevin Hernandez, Tirthak Patel.  
> *Enhancing Early Quantum Computing Education with QuantumAiEd: Bridging the Educational Gap.*  
> SIGCSETS 2025: Proceedings of the 56th ACM Technical Symposium on Computer Science Education V. 2, p. 1755.  
> [https://doi.org/10.1145/3641555.3705028](https://doi.org/10.1145/3641555.3705028)  
> Published: February 18, 2025. ACM.
