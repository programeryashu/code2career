import { Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import BookingConfirmedPage from "./pages/BookingConfirmedPage";
import BookingDetailPage from "./pages/BookingDetailPage";
import BookGigPage from "./pages/BookGigPage";
import CreatorProfilePage from "./pages/CreatorProfilePage";
import DmThreadPage from "./pages/DmThreadPage";
import MessagesPage from "./pages/MessagesPage";
import CreatorDashboardPage from "./pages/CreatorDashboardPage";
import GigDetailsPage from "./pages/GigDetailsPage";
import MarketplacePage from "./pages/MarketplacePage";
import MyBookingsPage from "./pages/MyBookingsPage";
import PostGigPage from "./pages/PostGigPage";

export default function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <Routes>
          <Route path="/" element={<MarketplacePage />} />
          <Route path="/gigs/new" element={<PostGigPage />} />
          <Route path="/gigs/:id" element={<GigDetailsPage />} />
          <Route path="/gigs/:id/book" element={<BookGigPage />} />
          <Route path="/bookings/:id/confirmed" element={<BookingConfirmedPage />} />
          <Route path="/bookings/:id" element={<BookingDetailPage />} />
          <Route path="/dashboard" element={<CreatorDashboardPage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/dm/:threadId" element={<DmThreadPage />} />
          <Route path="/creators/:id" element={<CreatorProfilePage />} />
        </Routes>
      </main>
      <footer className="mx-auto w-full max-w-5xl px-4 pb-8 text-center text-xs text-slate-400">
        SkillSwap — student creators turn skills into opportunities · Hackathon
        submission
      </footer>
    </div>
  );
}
