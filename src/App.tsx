import { Route, Routes } from "react-router-dom";
import Footer from "./components/Footer";
import Header from "./components/Header";
import { PageTransition } from "./components/Motion";
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
    <div className="flex min-h-screen flex-col bg-[#FAFAF8] text-slate-900 antialiased selection:bg-violet-600 selection:text-white dark:bg-[#0b0b10] dark:text-zinc-100">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Routes>
          <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
          <Route path="/marketplace" element={<PageTransition><MarketplacePage /></PageTransition>} />
          <Route path="/gigs/new" element={<PageTransition><PostGigPage /></PageTransition>} />
          <Route path="/gigs/:id" element={<PageTransition><GigDetailsPage /></PageTransition>} />
          <Route path="/gigs/:id/book" element={<PageTransition><BookGigPage /></PageTransition>} />
          <Route path="/bookings/:id/confirmed" element={<PageTransition><BookingConfirmedPage /></PageTransition>} />
          <Route path="/bookings/:id" element={<PageTransition><BookingDetailPage /></PageTransition>} />
          <Route path="/dashboard" element={<PageTransition><CreatorDashboardPage /></PageTransition>} />
          <Route path="/my-bookings" element={<PageTransition><MyBookingsPage /></PageTransition>} />
          <Route path="/messages" element={<PageTransition><MessagesPage /></PageTransition>} />
          <Route path="/dm/:threadId" element={<PageTransition><DmThreadPage /></PageTransition>} />
          <Route path="/creators/:id" element={<PageTransition><CreatorProfilePage /></PageTransition>} />
          <Route path="/saved" element={<PageTransition><SavedGigsPage /></PageTransition>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
