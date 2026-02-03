import { lazy, Suspense, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import LoadingScreen from "@/components/ui/LoadingScreen";
import NotFound from "@/pages/not-found";
// Lazy load public pages to reduce initial bundle size
const Home = lazy(() => import('@/pages/home'));
const Artists = lazy(() => import('@/pages/artists'));
// Import artist detail eagerly to avoid lazy-chunk resolution issues
import ArtistDetailPage from '@/pages/artists/[slug]';
const Events = lazy(() => import('@/pages/events'));
const Shop = lazy(() => import('@/pages/shop'));
const Checkout = lazy(() => import('@/pages/checkout'));
const Confirmation = lazy(() => import('@/pages/confirmation'));
const Podcast = lazy(() => import('@/pages/podcasts/index'));
const Knowledge = lazy(() => import('@/pages/knowledge'));
const Contact = lazy(() => import('@/pages/contact'));
const Auth = lazy(() => import('@/pages/auth'));
const Releases = lazy(() => import('@/pages/releases/index'));
// Removed tickets page
import { Helmet } from "react-helmet";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { ProtectedAdminRoute } from "./lib/protected-admin-route";

// Lazy load the authenticated pages
const Profile = lazy(() => import('./pages/profile'));
const Favorites = lazy(() => import('./pages/favorites'));
const Settings = lazy(() => import('./pages/settings'));
const Orders = lazy(() => import('./pages/orders'));

// Lazy load admin pages
const AdminDashboard = lazy(() => import('./pages/admin/dashboard'));

// Admin Artists pages
const AdminArtists = lazy(() => import('./pages/admin/artists'));
const AdminNewArtist = lazy(() => import('./pages/admin/artists/new'));
const AdminEditArtist = lazy(() => import('./pages/admin/artists/[id]/edit'));

// Admin Events pages
const AdminEvents = lazy(() => import('./pages/admin/events'));
const AdminNewEvent = lazy(() => import('./pages/admin/events/new'));
const AdminEditEvent = lazy(() => import('./pages/admin/events/[id]/edit'));

// Ticket pages
const TicketPurchase = lazy(() => import('./pages/tickets/purchase'));
const MyTickets = lazy(() => import('./pages/tickets/my-tickets'));
const TicketScanner = lazy(() => import('./pages/admin/tickets/scanner'));

// Admin Podcasts pages
const AdminPodcasts = lazy(() => import('./pages/admin/podcasts'));
const AdminNewPodcast = lazy(() => import('./pages/admin/podcasts/new'));
const AdminEditPodcast = lazy(() => import('./pages/admin/podcasts/[id]/edit'));
const SinglePodcastPage = lazy(() => import('./pages/podcasts/[slug]'));

// Admin Articles pages
const AdminArticles = lazy(() => import('./pages/admin/articles'));
const AdminNewArticle = lazy(() => import('./pages/admin/articles/new'));
const AdminEditArticle = lazy(() => import('./pages/admin/articles/[id]/edit'));

// Admin Users pages
const AdminUsers = lazy(() => import('./pages/admin/users'));

// Admin Products pages
const AdminProducts = lazy(() => import('./pages/admin/products'));
const AdminNewProduct = lazy(() => import('./pages/admin/products/new'));
const AdminEditProduct = lazy(() => import('./pages/admin/products/[id]/edit'));

// Admin Gallery pages
const AdminGallery = lazy(() => import('./pages/admin/gallery'));

// Admin Releases pages
const AdminReleases = lazy(() => import('./pages/admin/releases/index'));

// Admin Contact pages
const AdminContact = lazy(() => import('./pages/admin/contact'));

// Admin Orders pages
const AdminCODOrders = lazy(() => import('./pages/admin/orders'));

// Admin Streams pages
const AdminStreams = lazy(() => import('./pages/admin/streams'));
const AdminNewStream = lazy(() => import('./pages/admin/streams/new'));
const AdminEditStream = lazy(() => import('./pages/admin/streams/[id]/edit'));

// Streams page
const Streams = lazy(() => import('./pages/streams'));

// Serious Izuran page
const SeriousIzuran = lazy(() => import('./pages/serious-izuran'));

// Helper function to convert lazy components to proper components
const LazyComponentWrapper = (Component: React.LazyExoticComponent<any>) => {
  return (props: any) => <Component {...props} />;
};

// Loading component for suspense fallback
const PageLoading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-amber-500"></div>
  </div>
);

// Import Layout
import Layout from "@/components/layout/Layout";

// Determine if a component already includes Header/Footer
const hasHeaderAndFooter = (Component: React.ComponentType<any>): boolean => {
  // Check if the component source code includes Navbar/Footer imports
  // This is a simplified implementation - you might need to enhance it
  const componentString = Component.toString();
  return componentString.includes('Navbar') || componentString.includes('Header') || 
         componentString.includes('Footer');
};

// Wrapper for pages that should use the standard layout
const withLayout = (Component: React.ComponentType<any>) => {
  // Check if the component already has a header/footer
  const alreadyHasLayout = hasHeaderAndFooter(Component);
  
  return (props: any) => (
    <Layout includeHeader={!alreadyHasLayout} includeFooter={!alreadyHasLayout}>
      <Component {...props} />
    </Layout>
  );
};

function Router() {
  const [location] = useLocation();

  // Scroll to top when navigating (navbar: Home, Artists, Events, Shop, etc.)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location]);

  return (
    <Suspense fallback={<PageLoading />}>
      <Switch>
        {/* Public Routes with Layout */}
        <Route path="/" component={withLayout(Home)} />
        <Route path="/artists" component={withLayout(Artists)} />
        <Route path="/artists/:slug" component={withLayout(ArtistDetailPage)} />
        <Route path="/events" component={withLayout(Events)} />
        <Route path="/events/:slug" component={withLayout(lazy(() => import('./pages/events/[slug]')))} />
        <Route path="/shop" component={withLayout(Shop)} />
        <Route path="/shop/:slug" component={withLayout(lazy(() => import('./pages/shop/[slug]')))} />
        <Route path="/checkout" component={withLayout(Checkout)} />
        <Route path="/confirmation" component={withLayout(Confirmation)} />
        <Route path="/podcasts" component={withLayout(Podcast)} />
        <Route path="/podcasts/:slug" component={withLayout(SinglePodcastPage)} />
        <Route path="/serious-izuran" component={withLayout(SeriousIzuran)} />
        <Route path="/streams" component={withLayout(Streams)} />
        <Route path="/knowledge" component={withLayout(Knowledge)} />
        <Route path="/knowledge/:slug" component={withLayout(lazy(() => import('./pages/knowledge/[slug]')))} />
        <Route path="/contact" component={withLayout(Contact)} />
        <Route path="/releases" component={withLayout(Releases)} />
        <Route path="/auth" component={withLayout(Auth)} />
        
        {/* User Routes with Layout */}
        <Route path="/profile" component={withLayout(LazyComponentWrapper(Profile))} />
        <Route path="/favorites" component={withLayout(LazyComponentWrapper(Favorites))} />
        <Route path="/settings" component={withLayout(LazyComponentWrapper(Settings))} />
        <Route path="/orders" component={withLayout(LazyComponentWrapper(Orders))} />
        
        {/* Ticket Routes */}
        <Route path="/tickets/purchase/:eventId" component={withLayout(LazyComponentWrapper(TicketPurchase))} />
        <Route path="/tickets/my-tickets" component={withLayout(LazyComponentWrapper(MyTickets))} />
        
        {/* Admin Routes */}
        <ProtectedAdminRoute path="/admin" component={LazyComponentWrapper(AdminDashboard)} />
        <ProtectedAdminRoute path="/admin/dashboard" component={LazyComponentWrapper(AdminDashboard)} />
        
        {/* Admin Artist Routes */}
        <ProtectedAdminRoute path="/admin/artists" component={LazyComponentWrapper(AdminArtists)} />
        <ProtectedAdminRoute path="/admin/artists/new" component={LazyComponentWrapper(AdminNewArtist)} />
        <ProtectedAdminRoute path="/admin/artists/:id/edit" component={LazyComponentWrapper(AdminEditArtist)} />
        
        {/* Admin Event Routes */}
        <ProtectedAdminRoute path="/admin/events" component={LazyComponentWrapper(AdminEvents)} />
        <ProtectedAdminRoute path="/admin/events/new" component={LazyComponentWrapper(AdminNewEvent)} />
        <ProtectedAdminRoute path="/admin/events/:id/edit" component={LazyComponentWrapper(AdminEditEvent)} />
        
        {/* Admin Podcast Routes */}
        <ProtectedAdminRoute path="/admin/podcasts" component={LazyComponentWrapper(AdminPodcasts)} />
        <ProtectedAdminRoute path="/admin/podcasts/new" component={LazyComponentWrapper(AdminNewPodcast)} />
        <ProtectedAdminRoute path="/admin/podcasts/:id/edit" component={LazyComponentWrapper(AdminEditPodcast)} />
        
        {/* Admin Article Routes */}
        <ProtectedAdminRoute path="/admin/articles" component={LazyComponentWrapper(AdminArticles)} />
        <ProtectedAdminRoute path="/admin/articles/new" component={LazyComponentWrapper(AdminNewArticle)} />
        <ProtectedAdminRoute path="/admin/articles/:id/edit" component={LazyComponentWrapper(AdminEditArticle)} />
        
        {/* Admin Users Routes */}
        <ProtectedAdminRoute path="/admin/users" component={LazyComponentWrapper(AdminUsers)} />
        
        {/* Admin Products Routes */}
        <ProtectedAdminRoute path="/admin/products" component={LazyComponentWrapper(AdminProducts)} />
        <ProtectedAdminRoute path="/admin/products/new" component={LazyComponentWrapper(AdminNewProduct)} />
        <ProtectedAdminRoute path="/admin/products/:id/edit" component={LazyComponentWrapper(AdminEditProduct)} />
        
        {/* Admin Gallery Routes */}
        <ProtectedAdminRoute path="/admin/gallery" component={LazyComponentWrapper(AdminGallery)} />
        
        {/* Admin Releases Routes */}
        <ProtectedAdminRoute path="/admin/releases" component={LazyComponentWrapper(AdminReleases)} />
        
        {/* Admin Contact Routes */}
        <ProtectedAdminRoute path="/admin/contact" component={LazyComponentWrapper(AdminContact)} />
        
        {/* Admin Streams Routes */}
        <ProtectedAdminRoute path="/admin/streams" component={LazyComponentWrapper(AdminStreams)} />
        <ProtectedAdminRoute path="/admin/streams/new" component={LazyComponentWrapper(AdminNewStream)} />
        <ProtectedAdminRoute path="/admin/streams/:id/edit" component={LazyComponentWrapper(AdminEditStream)} />
        
        {/* Admin COD Orders Routes */}
        <ProtectedAdminRoute path="/admin/orders/cod" component={LazyComponentWrapper(AdminCODOrders)} />
        
        {/* Admin Ticket Scanner Route */}
        <ProtectedAdminRoute path="/admin/tickets/scanner" component={LazyComponentWrapper(TicketScanner)} />
        
        {/* 404 Route */}
        <Route component={withLayout(NotFound)} />
      </Switch>
    </Suspense>
  );
}

function AppContent({ isLoading, setIsInitialLoading, handleLoadingComplete }: {
  isLoading: boolean;
  setIsInitialLoading: (v: boolean) => void;
  handleLoadingComplete: () => void;
}) {
  // Let LoadingScreen run its full animation - don't short-circuit for logged-in users
  return (
    <>
      <LoadingScreen isLoading={isLoading} onLoadingComplete={handleLoadingComplete} />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 1, ease: "easeInOut" }}
      >
        <Router />
      </motion.div>
    </>
  );
}

function App() {
  // Check if this is the first visit or a homepage reload
  const [isInitialLoading, setIsInitialLoading] = useState(() => {
    const hasVisited = localStorage.getItem('izuran_has_visited');
    const currentPath = window.location.pathname;
    
    // Show loading screen if:
    // 1. First time visiting the site, OR
    // 2. Reloading the homepage (/)
    if (!hasVisited || currentPath === '/') {
      return true;
    }
    
    // Don't show loading screen for other routes
    return false;
  });
  
  // Separate loading state for navigation (disabled for now)
  const [isNavigating, setIsNavigating] = useState(false);
  const [prevPathname, setPrevPathname] = useState('');
  
  // Combined loading state for the LoadingScreen component
  const isLoading = isInitialLoading;
  
  // Monitor route changes and handle homepage reloads
  useEffect(() => {
    // Just track the current pathname for reference
    const handleRouteChange = (pathname: string) => {
      if (pathname !== prevPathname) {
        setPrevPathname(pathname);
      }
    };
    
    // Add event listener for route changes
    const unlisten = window.addEventListener('popstate', () => {
      handleRouteChange(window.location.pathname);
    });
    
    // Handle page unloads - use pagehide instead of beforeunload for bfcache compatibility
    // Only clear localStorage on actual unload (not bfcache)
    const handlePageHide = (event: PageTransitionEvent) => {
      // Only clear localStorage if NOT restored from bfcache (actual unload)
      if (!event.persisted) {
        const currentPath = window.location.pathname;
        if (currentPath === '/') {
          // If reloading homepage, remove the visited flag to show loading screen
          localStorage.removeItem('izuran_has_visited');
        }
      }
    };
    
    // Add event listener for page unloads (bfcache-compatible)
    window.addEventListener('pagehide', handlePageHide);
    
    // Capture initial path
    setPrevPathname(window.location.pathname);
    
    // Cleanup
    return () => {
      window.removeEventListener('popstate', unlisten as any);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [prevPathname]);

  // Loading screen will control its own timing via onLoadingComplete callback
  // No need for a separate timer here

  // Function to handle when loading animation completes
  const handleLoadingComplete = () => {
    // Set initial loading to false when LoadingScreen completes
    setIsInitialLoading(false);
    
    // Mark that the user has visited the site
    localStorage.setItem('izuran_has_visited', 'true');
    
    // Add any additional cleanup or post-load initialization here
    document.body.style.overflow = "visible";
    
    // Set a flag to indicate we're coming from the loading screen
    sessionStorage.setItem('fromLoadingScreen', 'true');
    
    // Ensure we're at the top of the page after loading - multiple attempts for reliability
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Additional scroll to top after delays to ensure it sticks
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 100);
    
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 300);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <Helmet>
              <meta charSet="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />

              <meta name="theme-color" content="#000000" />
              <meta name="description" content="Izuran - Record Label & Event Promoter rooted in Amazigh culture and esoteric knowledge" />
              <title>Izuran - Record Label & Event Promoter</title>
            </Helmet>
            
            <AppContent
              isLoading={isLoading}
              setIsInitialLoading={setIsInitialLoading}
              handleLoadingComplete={handleLoadingComplete}
            />
            
            <Toaster />
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
