import { Route, Routes } from "react-router-dom";
import Footer from "./components/Footer";
import Header from "./components/Header";
import BookGigPage from "./pages/BookGigPage";
import BookingConfirmedPage from "./pages/BookingConfirmedPage";
import BookingDetailPage from "./pages/BookingDetailPage";
import CreatorDashboardPage from "./pages/CreatorDashboardPage";
import CreatorProfilePage from "./pages/CreatorProfilePage";
import DmThreadPage from "./pages/DmThreadPage";
import GigDetailsPage from "./pages/GigDetailsPage";
import LandingPage from "./pages/LandingPage";
import MarketplacePage from "./pages/MarketplacePage";
import MessagesPage from "./pages/MessagesPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import PostGigPage from "./pages/PostGigPage";
import SavedGigsPage from "./pages/SavedGigsPage";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50 text-slate-900 antialiased selection:bg-violet-600 selection:text-white">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
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
          <Route path="/saved" element={<SavedGigsPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
