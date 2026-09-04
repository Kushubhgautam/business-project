import { type ReactNode, useMemo, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Camera,
  CarFront,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  CircleAlert,
  Clock3,
  Compass,
  CreditCard,
  Droplets,
  Dumbbell,
  Eye,
  EyeOff,
  FileText,
  Home as HomeIcon,
  Laptop,
  ListFilter,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Map,
  MapPin,
  Menu,
  MessageCircle,
  Navigation,
  Paintbrush,
  Phone,
  Plus,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Snowflake,
  Sparkles,
  Star,
  Store,
  TrendingUp,
  UserCheck,
  UserRound,
  UsersRound,
  X,
  Zap,
} from 'lucide-react';
import {
  getGetDashboardSummaryQueryKey,
  getGetProviderQueryKey,
  getHealthCheckQueryKey,
  getListBookingsQueryKey,
  useCreateBooking,
  useGetDashboardSummary,
  useGetProvider,
  useHealthCheck,
  useListBookings,
  useListCategories,
  useListNotifications,
  useListProviders,
  useUpdateBookingStatus,
} from '@workspace/api-client-react';
import type {
  Booking,
  BookingStatusInputStatus,
  Category,
  Provider,
  ProviderDetail,
} from '@workspace/api-client-react';
import { AuthProvider, useAuth, DEMO_CUSTOMER, DEMO_PROVIDER } from '@/lib/auth-context';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Link, Route, Switch, Router as WouterRouter, useLocation, useParams } from 'wouter';

const queryClient = new QueryClient();

const navItems = [
  { href: '/discover', label: 'Find an expert', icon: Compass },
  { href: '/dashboard', label: 'My bookings', icon: CalendarDays },
  { href: '/provider-dashboard', label: 'Pro Studio', icon: BriefcaseBusiness },
];

const categoryIcons: Record<string, typeof HomeIcon> = {
  home: HomeIcon,
  cleaning: Sparkles,
  repair: Zap,
  tech: SlidersHorizontal,
  moving: Navigation,
  auto: Store,
  zap: Zap,
  droplets: Droplets,
  snowflake: Snowflake,
  laptop: Laptop,
  'book-open': BookOpen,
  dumbbell: Dumbbell,
  camera: Camera,
  'car-front': CarFront,
  sparkles: Sparkles,
  paintbrush: Paintbrush,
  'shield-check': ShieldCheck,
  smartphone: Smartphone,
};

function initials(name = 'FixNear') {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function money(value = 0) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

function dateLabel(value?: string) {
  if (!value) return 'Date to be confirmed';
  if (!/^\d{4}-\d{2}-\d{2}/.test(value)) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusLabel(status?: string) {
  return (status || 'requested').replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusClass(status?: string) {
  if (status === 'completed') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (status === 'cancelled') return 'bg-red-100 text-red-800 border-red-200';
  if (status === 'on_the_way' || status === 'started') return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-sky-100 text-sky-800 border-sky-200';
}

function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-2.5 transition-transform hover:scale-[1.02]" data-testid="link-logo">
      <span className={`grid size-10 place-items-center rounded-2xl shadow-md transition-shadow group-hover:shadow-lg ${light ? 'bg-gradient-to-tr from-amber-500 to-orange-400 text-slate-950 font-black' : 'gradient-primary text-primary-foreground font-black'}`}>
        <span className="font-display text-2xl font-bold leading-none">f</span>
      </span>
      <div className="flex flex-col">
        <span className={`font-display text-[1.4rem] font-bold tracking-tight leading-none ${light ? 'text-stone-50' : 'text-foreground'}`}>
          fixnear
        </span>
        <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">
          Verified Local Pros
        </span>
      </div>
    </Link>
  );
}

function Avatar({ name, src, size = 'size-10', className = '' }: { name?: string; src?: string; size?: string; className?: string }) {
  return (
    <div className={`grid ${size} shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-amber-100 to-stone-200 text-sm font-bold text-stone-800 shadow-sm ring-1 ring-black/5 ${className}`} data-testid={`avatar-${name || 'user'}`}>
      {src ? <img src={src} alt={name || 'Avatar'} className="size-full object-cover" /> : initials(name)}
    </div>
  );
}

function Button({
  children,
  className = '',
  variant = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'outline' }) {
  const variants = {
    primary: 'gradient-primary text-primary-foreground shadow-[0_8px_20px_rgba(215,75,34,.22)] hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(215,75,34,.32)] active:translate-y-0',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:-translate-y-0.5 shadow-sm active:translate-y-0',
    ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
    outline: 'border border-border bg-card/80 text-foreground hover:border-primary hover:text-primary hover:bg-muted/40 shadow-xs',
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { user, isAuthenticated, logout, switchRole } = useAuth();
  const notificationsQuery = useListNotifications();
  const notifications = notificationsQuery.data || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="noise min-h-[100dvh] flex flex-col bg-background selection:bg-primary selection:text-white">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-xl shadow-xs transition-colors">
        <div className="mx-auto flex h-[4.75rem] max-w-[1280px] items-center justify-between px-5 lg:px-8">
          <Logo />

          <nav className="hidden items-center gap-1.5 md:flex" aria-label="Main navigation">
            {navItems.map((item) => {
              const active = location === item.href || (item.href === '/discover' && location.startsWith('/providers'));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all ${
                    active
                      ? 'bg-muted font-bold text-primary shadow-xs'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
                className="relative rounded-xl border border-border/70 p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Notifications"
                data-testid="button-notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-white shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border bg-card p-4 shadow-xl z-50 animate-rise">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <p className="font-display font-bold text-foreground">Notifications</p>
                    <span className="text-xs text-muted-foreground">{notifications.length} recent</span>
                  </div>
                  <div className="mt-3 grid gap-2.5 max-h-64 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="rounded-xl bg-muted/50 p-2.5 text-xs transition-colors hover:bg-muted">
                        <p className="font-semibold text-foreground">{n.title}</p>
                        <p className="mt-0.5 text-muted-foreground">{n.body}</p>
                        <p className="mt-1 text-[10px] font-mono-app text-primary">{n.time}</p>
                      </div>
                    ))}
                    {!notifications.length && <p className="py-4 text-center text-xs text-muted-foreground">No new notifications</p>}
                  </div>
                </div>
              )}
            </div>

            {/* User Session / Login Button */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
                  className="flex items-center gap-2.5 rounded-2xl border border-border/80 bg-card p-1.5 pr-3 shadow-xs hover:border-primary/50 transition-all"
                  data-testid="button-user-menu"
                >
                  <Avatar name={user.name} src={user.avatar} size="size-8" />
                  <div className="text-left">
                    <p className="text-xs font-bold leading-tight text-foreground">{user.name}</p>
                    <span className="inline-block text-[10px] font-semibold text-primary uppercase tracking-wider">
                      {user.role === 'provider' ? 'Pro Partner' : 'Customer'}
                    </span>
                  </div>
                  <ChevronDown size={14} className="text-muted-foreground" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-border bg-card p-3 shadow-xl z-50 animate-rise">
                    <div className="border-b border-border pb-3 px-2">
                      <p className="font-bold text-sm text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-800">
                        <CheckCircle2 size={11} /> {user.role === 'provider' ? 'Service Partner Account' : 'Verified Customer'}
                      </span>
                    </div>

                    <div className="py-2 grid gap-1">
                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                      >
                        <CalendarDays size={14} /> My Bookings
                      </Link>
                      <Link
                        href="/provider-dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                      >
                        <BriefcaseBusiness size={14} /> Pro Studio
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          switchRole(user.role === 'customer' ? 'provider' : 'customer');
                          setUserMenuOpen(false);
                          setLocation(user.role === 'customer' ? '/provider-dashboard' : '/dashboard');
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-primary hover:bg-muted text-left"
                      >
                        <UserCheck size={14} />
                        Switch to {user.role === 'customer' ? 'Provider View' : 'Customer View'}
                      </button>
                    </div>

                    <div className="border-t border-border pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                          setLocation('/login');
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                        data-testid="button-logout"
                      >
                        <LogOut size={14} /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                data-testid="link-login"
                className="rounded-xl px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Log in
              </Link>
            )}

            <Link
              href="/discover"
              data-testid="link-header-search"
              className="inline-flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:-translate-y-0.5 transition-all"
            >
              <Search size={16} /> Find help
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-xl border border-border p-2.5 text-muted-foreground hover:bg-muted md:hidden"
            data-testid="button-mobile-menu"
            aria-label="Open menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="border-t border-border bg-card px-5 py-4 md:hidden shadow-lg animate-fade">
            {isAuthenticated && user && (
              <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <Avatar name={user.name} src={user.avatar} size="size-10" />
                  <div>
                    <p className="font-bold text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.role === 'provider' ? 'Provider' : 'Customer'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { logout(); setMobileOpen(false); setLocation('/login'); }}
                  className="text-xs font-semibold text-red-600"
                >
                  Logout
                </button>
              </div>
            )}

            <div className="grid gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  data-testid={`link-mobile-${item.href.slice(1)}`}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-semibold text-foreground hover:bg-muted"
                >
                  <item.icon size={18} className="text-primary" />
                  {item.label}
                </Link>
              ))}

              {!isAuthenticated && (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  data-testid="link-mobile-login"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-semibold text-foreground hover:bg-muted"
                >
                  <UserRound size={18} className="text-primary" />
                  Sign In / Register
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/80 bg-stone-900 text-stone-200">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
          <div className="sm:col-span-2">
            <Logo light />
            <p className="mt-4 max-w-sm text-sm leading-6 text-stone-400">
              The modern, dependable neighborhood network. Verified professionals, transparent upfront pricing, and guaranteed satisfaction on every job.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-white/10 px-3 py-1 text-stone-300">⚡ 100% Background-Checked</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-stone-300">🛡️ Payment Escrow</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-stone-300">⭐ 4.9 Avg Rating</span>
            </div>
          </div>
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-orange-400">Explore Services</p>
            <div className="grid gap-2.5 text-sm text-stone-400">
              <Link href="/discover?category=electrician" className="hover:text-white transition-colors">Electricians</Link>
              <Link href="/discover?category=plumber" className="hover:text-white transition-colors">Plumbers</Link>
              <Link href="/discover?category=ac-repair" className="hover:text-white transition-colors">AC & Appliance Repair</Link>
              <Link href="/discover?category=computer-repair" className="hover:text-white transition-colors">Laptop & Tech Support</Link>
              <Link href="/discover?category=cleaning" className="hover:text-white transition-colors">Home Cleaning</Link>
            </div>
          </div>
          <div>
            <p className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-orange-400">For Professionals</p>
            <p className="text-sm leading-6 text-stone-400">
              Grow your neighborhood client base. Keep 90% of every service fee with guaranteed on-time weekly payouts.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-orange-300 hover:text-orange-200"
            >
              Join as a Professional <ArrowRight size={14} />
            </Link>
          </div>
        </div>
        <div className="mx-auto flex max-w-[1280px] flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 px-5 py-6 text-xs text-stone-400 lg:px-8">
          <span>© 2026 FixNear Technologies Inc. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <Link href="/discover" className="hover:text-white">Find Pros</Link>
            <Link href="/login" className="hover:text-white">Login</Link>
            <span className="text-stone-500">Made for modern neighborhoods</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function QueryState({ loading, error, empty, children, retry }: { loading?: boolean; error?: boolean; empty?: boolean; children: ReactNode; retry?: () => void }) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="h-44 animate-pulse rounded-3xl bg-muted/80 border border-border" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50/70 p-8 text-center shadow-xs">
        <CircleAlert className="mx-auto text-red-600 size-8" />
        <h3 className="mt-3 font-display text-xl font-bold text-red-950">Unable to load data</h3>
        <p className="mt-1 text-sm text-red-800/80">Could not retrieve information from the FixNear service. Please try again.</p>
        <Button onClick={retry} variant="outline" className="mt-5 border-red-200 bg-white hover:bg-red-50">
          Try again
        </Button>
      </div>
    );
  }
  if (empty) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center shadow-xs">
        <Compass className="mx-auto text-primary size-9 opacity-80" />
        <h3 className="mt-3 font-display text-xl font-bold">No results found</h3>
        <p className="mt-1 text-sm text-muted-foreground">Try clearing filters or searching for a different trade or service.</p>
      </div>
    );
  }
  return children;
}

function CategoryIcon({ category, size = 20 }: { category?: Category | string; size?: number }) {
  const key = typeof category === 'string' ? category.toLowerCase() : category?.icon?.toLowerCase();
  const Icon = (key && categoryIcons[key]) || Sparkles;
  return <Icon size={size} />;
}

/* ========================================================================= */
/* HOME PAGE                                                                 */
/* ========================================================================= */
function Home() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState('');
  const categoriesQuery = useListCategories();
  const healthQuery = useHealthCheck({ query: { staleTime: 60000, queryKey: getHealthCheckQueryKey() } });
  const categories = categoriesQuery.data || [];

  return (
    <Shell>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-stone-900 text-stone-50 py-20 lg:py-28">
        <div className="absolute -right-20 -top-32 size-[36rem] rounded-full border-[80px] border-orange-500/10 pointer-events-none" />
        <div className="absolute -left-20 bottom-0 size-[30rem] rounded-full bg-orange-600/15 blur-3xl pointer-events-none" />

        <div className="relative mx-auto grid max-w-[1280px] gap-12 px-5 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:px-8">
          <div className="animate-rise">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-white/5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[.18em] text-orange-300">
              <span className="size-2 rounded-full bg-orange-400 animate-pulse" />
              Verified Local Services
            </div>
            <h1 className="font-display text-5xl font-extrabold leading-[1.04] tracking-[-0.03em] sm:text-6xl lg:text-[4.75rem]">
              The right expert is <span className="text-orange-400 underline decoration-orange-400/50 decoration-wavy decoration-2">already nearby</span>.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-stone-300 sm:text-lg">
              Book vetted electricians, plumbers, technicians, and tutors with transparent quotes, genuine neighborhood ratings, and zero guesswork.
            </p>

            {/* Search Bar */}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setLocation(`/discover${search ? `?search=${encodeURIComponent(search)}` : ''}`);
              }}
              className="mt-9 flex max-w-xl flex-col gap-2.5 rounded-2xl bg-white p-2.5 shadow-2xl sm:flex-row shadow-black/40"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
                <Search size={20} className="shrink-0 text-primary" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Try “AC repair”, “electrician”, or “math tutor”..."
                  data-testid="input-home-search"
                  className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-stone-900 outline-none placeholder:text-stone-400 font-medium"
                />
              </div>
              <Button type="submit" className="px-7 py-3 text-base" data-testid="button-home-search">
                Search nearby <ArrowRight size={17} />
              </Button>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-stone-300">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-orange-400" />
                Identity & Background Checked
              </span>
              <span className="flex items-center gap-1.5">
                <Star size={16} className="text-orange-400 fill-orange-400" />
                4.9/5 from 14,000+ local jobs
              </span>
            </div>
          </div>

          {/* Interactive Live Cards Preview */}
          <div className="relative animate-rise delay-1">
            <div className="relative mx-auto max-w-md rounded-[2.25rem] border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur-md">
              <div className="rounded-[1.75rem] bg-[#f8f5ef] p-6 text-foreground shadow-inner">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono-app text-[11px] font-bold uppercase tracking-[.18em] text-primary">
                      Nearby Specialists
                    </span>
                    <p className="text-xs text-muted-foreground">Available for immediate booking</p>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                    <span className="size-2 rounded-full bg-emerald-500 animate-ping" /> Live
                  </span>
                </div>

                <div className="mt-5 grid gap-3">
                  {[
                    { name: 'Priya Sharma', title: 'AC & Appliance Specialist', dist: '1.2 km away', rating: '4.9', id: 'priya-sharma', img: 'https://i.pravatar.cc/160?img=47' },
                    { name: 'Arjun Nair', title: 'Master Electrician', dist: '2.4 km away', rating: '4.8', id: 'arjun-nair', img: 'https://i.pravatar.cc/160?img=12' },
                    { name: 'Sameer Khan', title: 'Plumbing & Drainage', dist: '1.8 km away', rating: '4.8', id: 'sameer-khan', img: 'https://i.pravatar.cc/160?img=68' },
                  ].map((person, index) => (
                    <Link
                      key={person.id}
                      href={`/providers/${person.id}`}
                      className={`flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card p-3.5 transition-all hover:border-primary/50 hover:shadow-md ${
                        index === 0 ? 'ring-2 ring-orange-400/40 bg-orange-50/30' : ''
                      }`}
                    >
                      <Avatar name={person.name} src={person.img} size="size-11" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-foreground">{person.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{person.title}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono-app text-[11px] font-semibold text-primary">{person.dist}</p>
                        <div className="mt-1 flex items-center justify-end gap-1 text-xs font-bold">
                          <Star size={12} fill="currentColor" className="text-orange-500" />
                          {person.rating}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between rounded-xl bg-stone-900 px-4 py-3 text-xs text-stone-200">
                  <span>Over 48 verified pros in your pin-code</span>
                  <Link href="/discover" className="font-bold text-orange-400 hover:text-orange-300">
                    Explore all <ArrowUpRight size={14} className="ml-1 inline" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="mx-auto max-w-[1280px] px-5 py-20 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono-app text-xs font-bold uppercase tracking-[.18em] text-primary">Browse Services</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">What needs fixing today?</h2>
          </div>
          <Link href="/discover" data-testid="link-browse-all-categories" className="flex items-center gap-1.5 text-sm font-bold text-primary hover:gap-2.5 transition-all">
            Browse all categories <ArrowRight size={16} />
          </Link>
        </div>

        <QueryState loading={categoriesQuery.isLoading} error={!!categoriesQuery.error} empty={!categoriesQuery.isLoading && categories.length === 0} retry={() => categoriesQuery.refetch()}>
          <div className="mt-10 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/discover?category=${encodeURIComponent(category.id)}`}
                data-testid={`card-category-${category.id}`}
                className="group card-hover rounded-2xl border border-border bg-card p-5 shadow-xs hover:border-primary/50 text-center flex flex-col items-center justify-center min-h-[140px]"
              >
                <span className="grid size-12 place-items-center rounded-2xl bg-orange-100/70 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105">
                  <CategoryIcon category={category} size={22} />
                </span>
                <p className="mt-3.5 font-display text-base font-bold text-foreground group-hover:text-primary transition-colors">
                  {category.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{category.count} pros</p>
              </Link>
            ))}
          </div>
        </QueryState>
      </section>

      {/* Why Choose FixNear */}
      <section className="border-y border-border/80 bg-stone-100/70 py-20">
        <div className="mx-auto grid max-w-[1280px] gap-12 px-5 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:px-8">
          <div>
            <p className="font-mono-app text-xs font-bold uppercase tracking-[.18em] text-primary">Built for Trust</p>
            <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight">
              Classifieds made you cautious. We made it certain.
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Every professional on FixNear is vetted for background, skill, and track record before taking their first job. Transparent upfront prices mean no awkward surprises when the bill arrives.
            </p>
            <Link href="/discover" className="mt-7 inline-flex items-center gap-2 font-bold text-primary hover:gap-3 transition-all">
              See verified professionals <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { num: '01', title: 'Verified Backgrounds', desc: 'Govt. ID, police check, and trade references verified.' },
              { num: '02', title: 'Upfront Pricing', desc: 'Clear hourly or fixed rates disclosed before booking.' },
              { num: '03', title: 'Escrow Protection', desc: 'Payment held safely until you confirm the job is done.' },
            ].map((item) => (
              <div key={item.num} className="rounded-3xl border border-border bg-card p-6 shadow-xs card-hover">
                <span className="font-mono-app text-xs font-black text-primary px-2.5 py-1 rounded-md bg-orange-100">
                  {item.num}
                </span>
                <h3 className="mt-8 font-display text-xl font-bold">{item.title}</h3>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Health check marker */}
      <div className="sr-only" data-testid="status-health">
        {healthQuery.data?.status || 'service status pending'}
      </div>
    </Shell>
  );
}

/* ========================================================================= */
/* PROVIDER CARD COMPONENT                                                   */
/* ========================================================================= */
function ProviderCard({ provider }: { provider: Provider }) {
  return (
    <div
      data-testid={`card-provider-${provider.id}`}
      className="group card-hover rounded-3xl border border-border bg-card p-5 shadow-xs hover:border-primary/40 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start gap-4">
          <Avatar name={provider.name} src={provider.avatar} size="size-14" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-display text-lg font-bold leading-tight group-hover:text-primary transition-colors">
                  {provider.name}
                </h3>
                <p className="mt-0.5 truncate text-xs text-muted-foreground font-medium">{provider.title}</p>
              </div>
              {provider.verified && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800 shrink-0 flex items-center gap-1">
                  <ShieldCheck size={13} /> Verified
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="flex items-center gap-1 font-bold text-foreground">
                <Star size={13} fill="currentColor" className="text-orange-500" />
                {provider.rating.toFixed(1)} <span className="font-normal text-muted-foreground">({provider.reviewCount})</span>
              </span>
              <span className="text-muted-foreground flex items-center gap-1">
                <MapPin size={12} /> {provider.distance}
              </span>
              <span className="text-emerald-700 font-semibold">{provider.availability}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {provider.tags.map((tag) => (
            <span key={tag} className="rounded-lg bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-border/80 pt-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-muted-foreground">Starts at</span>
          <p className="font-mono-app text-sm font-bold text-foreground">{money(provider.startingPrice)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/providers/${provider.id}`}
            className="rounded-xl border border-border px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted"
          >
            View Profile
          </Link>
          <Link
            href={`/bookings/new?providerId=${provider.id}`}
            className="rounded-xl gradient-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:-translate-y-0.5"
          >
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* DISCOVER / SEARCH PAGE                                                    */
/* ========================================================================= */
function Discover() {
  const [location, setLocation] = useLocation();
  const params = new URLSearchParams(location.split('?')[1] || '');
  const [search, setSearch] = useState(params.get('search') || '');
  const [category, setCategory] = useState(params.get('category') || '');
  const [verified, setVerified] = useState(false);
  const [mode, setMode] = useState<'list' | 'map'>('list');
  const [selectedMapProvider, setSelectedMapProvider] = useState<Provider | null>(null);

  const categoriesQuery = useListCategories();
  const providerParams = useMemo(
    () => ({
      search: search || undefined,
      category: category || undefined,
      location: undefined,
      verified: verified || undefined,
    }),
    [search, category, verified],
  );

  const providersQuery = useListProviders(providerParams);
  const providers = providersQuery.data || [];

  const applySearch = (event: React.FormEvent) => {
    event.preventDefault();
    setLocation(
      `/discover?${new URLSearchParams({
        ...(search ? { search } : {}),
        ...(category ? { category } : {}),
      }).toString()}`,
    );
  };

  return (
    <Shell>
      <div className="mx-auto max-w-[1280px] px-5 py-8 lg:px-8 lg:py-12">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="font-mono-app text-xs font-bold uppercase tracking-[.18em] text-primary">Neighborhood Network</p>
            <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
              Find Verified Local Experts
            </h1>
            <p className="mt-2 text-muted-foreground">Search skilled professionals nearby ready to help with your home or project.</p>
          </div>

          {/* View mode toggle */}
          <div className="flex rounded-2xl border border-border bg-card p-1 shadow-xs self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setMode('list')}
              data-testid="button-view-list"
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                mode === 'list' ? 'bg-primary text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ListFilter size={16} /> List View
            </button>
            <button
              type="button"
              onClick={() => setMode('map')}
              data-testid="button-view-map"
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                mode === 'map' ? 'bg-primary text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Map size={16} /> Interactive Map
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <form onSubmit={applySearch} className="mt-8 grid gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs md:grid-cols-[1.5fr_1fr_auto]">
          <div className="flex items-center gap-3 rounded-xl bg-muted/60 px-3.5">
            <Search size={19} className="text-primary" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by specialty, service, or pro's name..."
              data-testid="input-discover-search"
              className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground font-medium"
            />
          </div>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            data-testid="select-discover-category"
            className="rounded-xl bg-muted/60 px-3.5 py-3 text-sm font-semibold outline-none cursor-pointer"
          >
            <option value="">All Services & Trades</option>
            {(categoriesQuery.data || []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <Button type="submit" data-testid="button-discover-search" className="px-6">
            <Search size={16} /> Search
          </Button>
        </form>

        {/* Quick Filter Badges */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {(categoriesQuery.data || []).slice(0, 6).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(category === item.id ? '' : item.id)}
                data-testid={`button-filter-${item.id}`}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  category === item.id
                    ? 'border-primary bg-primary text-white shadow-xs'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground'
                }`}
              >
                <CategoryIcon category={item} size={13} />
                {item.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setVerified(!verified)}
              data-testid="button-filter-verified"
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                verified ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-border bg-card text-muted-foreground hover:border-primary/50'
              }`}
            >
              <ShieldCheck size={14} /> Verified only
            </button>
            {(search || category || verified) && (
              <button
                type="button"
                onClick={() => { setSearch(''); setCategory(''); setVerified(false); }}
                data-testid="button-clear-filters"
                className="text-xs font-bold text-primary hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* View Mode: Map vs List */}
        {mode === 'map' ? (
          <div className="relative mt-8 min-h-[560px] overflow-hidden rounded-3xl border border-border bg-[#e5ece1] shadow-inner">
            {/* Map Grid Backdrop */}
            <div
              className="absolute inset-0 opacity-60"
              style={{
                backgroundImage:
                  'linear-gradient(28deg, transparent 46%, rgba(86,112,92,.25) 47%, rgba(86,112,92,.25) 48%, transparent 49%), linear-gradient(110deg, transparent 49%, rgba(86,112,92,.2) 50%, transparent 51%), linear-gradient(0deg, transparent 79%, rgba(245,239,227,.9) 80%, rgba(245,239,227,.9) 83%, transparent 84%)',
                backgroundSize: '240px 190px, 180px 220px, 100% 160px',
              }}
            />

            {/* Interactive Pins */}
            {providers.map((p, idx) => {
              const leftPos = `${20 + (idx * 15) % 65}%`;
              const topPos = `${22 + (idx * 22) % 55}%`;
              const isSelected = selectedMapProvider?.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedMapProvider(p)}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 cursor-pointer ${
                    isSelected ? 'z-30 scale-125' : 'z-20 hover:scale-110'
                  }`}
                  style={{ left: leftPos, top: topPos }}
                >
                  <div
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-bold shadow-xl border-2 ${
                      isSelected
                        ? 'bg-stone-950 text-white border-orange-400 ring-4 ring-orange-400/30'
                        : 'bg-white text-stone-900 border-white hover:bg-orange-50'
                    }`}
                  >
                    <MapPin size={15} className="text-primary" />
                    <span className="text-xs">{p.name.split(' ')[0]}</span>
                    <span className="font-mono-app text-[10px] text-primary">{money(p.startingPrice)}</span>
                  </div>
                </button>
              );
            })}

            {/* Floating Info / Selected Provider Popup Card */}
            {selectedMapProvider && (
              <div className="absolute bottom-6 left-6 right-6 sm:right-auto sm:w-96 rounded-3xl border border-white/80 bg-card/95 p-5 shadow-2xl backdrop-blur-md z-40 animate-rise">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={selectedMapProvider.name} src={selectedMapProvider.avatar} size="size-12" />
                    <div>
                      <h4 className="font-display font-bold text-base">{selectedMapProvider.name}</h4>
                      <p className="text-xs text-muted-foreground">{selectedMapProvider.title}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedMapProvider(null)}
                    className="text-muted-foreground hover:text-foreground p-1"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs border-t border-border pt-3">
                  <span className="flex items-center gap-1 font-bold">
                    <Star size={13} fill="currentColor" className="text-orange-500" />
                    {selectedMapProvider.rating} ({selectedMapProvider.reviewCount} reviews)
                  </span>
                  <span className="font-mono-app font-bold text-primary">From {money(selectedMapProvider.startingPrice)}</span>
                </div>

                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/providers/${selectedMapProvider.id}`}
                    className="flex-1 rounded-xl border border-border py-2 text-center text-xs font-bold hover:bg-muted"
                  >
                    Profile
                  </Link>
                  <Link
                    href={`/bookings/new?providerId=${selectedMapProvider.id}`}
                    className="flex-1 rounded-xl gradient-primary py-2 text-center text-xs font-bold text-white shadow-xs"
                  >
                    Book
                  </Link>
                </div>
              </div>
            )}

            <div className="absolute top-5 left-5 rounded-2xl border border-white/70 bg-card/90 px-4 py-2.5 shadow-md backdrop-blur">
              <p className="font-display text-sm font-bold">{providers.length} verified pros on map</p>
              <p className="text-[11px] text-muted-foreground">Click any pin to inspect & book</p>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-bold text-foreground">
                {providers.length} verified experts near you
              </p>
            </div>

            <QueryState
              loading={providersQuery.isLoading}
              error={!!providersQuery.error}
              empty={!providersQuery.isLoading && providers.length === 0}
              retry={() => providersQuery.refetch()}
            >
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {providers.map((provider) => (
                  <ProviderCard key={provider.id} provider={provider} />
                ))}
              </div>
            </QueryState>
          </div>
        )}
      </div>
    </Shell>
  );
}

/* ========================================================================= */
/* PROVIDER DETAIL PAGE & REVIEW MODAL                                       */
/* ========================================================================= */
function ProviderDetailPage() {
  const params = useParams<{ providerId: string }>();
  const [, setLocation] = useLocation();
  const providerQuery = useGetProvider(params.providerId || '', {
    query: { enabled: !!params.providerId, queryKey: getGetProviderQueryKey(params.providerId || '') },
  });
  const provider = providerQuery.data as ProviderDetail | undefined;

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [localReviews, setLocalReviews] = useState<Array<{ author: string; rating: number; text: string; date: string }>>([]);

  const addReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;
    const newRev = {
      author: reviewAuthor.trim() || 'Neighborhood Neighbor',
      rating: reviewRating,
      text: reviewText.trim(),
      date: 'Just now',
    };
    setLocalReviews([newRev, ...localReviews]);
    setReviewText('');
    setReviewModalOpen(false);
  };

  const allReviews = [...localReviews, ...(provider?.reviews || [])];

  return (
    <Shell>
      <div className="mx-auto max-w-[1180px] px-5 py-8 lg:px-8 lg:py-12">
        <Link
          href="/discover"
          data-testid="link-back-discover"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={16} /> Back to all specialists
        </Link>

        <QueryState
          loading={providerQuery.isLoading}
          error={!!providerQuery.error}
          empty={!providerQuery.isLoading && !provider}
          retry={() => providerQuery.refetch()}
        >
          {provider && (
            <>
              {/* Header Hero Card */}
              <div className="mt-6 rounded-[2.25rem] border border-border bg-card p-6 shadow-xs sm:p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                  <Avatar name={provider.name} src={provider.avatar} size="size-28" className="rounded-3xl shadow-md text-3xl" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{provider.name}</h1>
                      {provider.verified && (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 flex items-center gap-1">
                          <ShieldCheck size={14} /> Background Verified
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-base text-muted-foreground font-medium">{provider.title}</p>
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                      <span className="flex items-center gap-1.5 font-bold">
                        <Star size={16} fill="currentColor" className="text-orange-500" />
                        {provider.rating.toFixed(1)} <span className="font-normal text-muted-foreground">({provider.reviewCount} verified reviews)</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin size={16} /> {provider.location} · {provider.distance}
                      </span>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock3 size={16} /> {provider.experience}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-start gap-2.5 sm:items-end border-t border-border pt-4 sm:border-0 sm:pt-0">
                    <span className="text-xs uppercase font-bold text-muted-foreground">Rates start at</span>
                    <span className="font-mono-app text-3xl font-bold text-foreground">{money(provider.startingPrice)}</span>
                    <Button
                      onClick={() => setLocation(`/bookings/new?providerId=${provider.id}`)}
                      data-testid="button-book-provider"
                      className="px-6 py-3"
                    >
                      Book {provider.name.split(' ')[0]} <ArrowRight size={16} />
                    </Button>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-border">
                  {provider.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-muted px-3.5 py-1.5 text-xs font-semibold text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Body Content */}
              <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
                <div className="grid gap-8">
                  {/* About Section */}
                  <section className="rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-xs">
                    <h2 className="font-display text-2xl font-bold">About {provider.name.split(' ')[0]}</h2>
                    <p className="mt-3 leading-7 text-muted-foreground">{provider.about}</p>
                    <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-6 text-center">
                      <div className="rounded-2xl bg-muted/50 p-3">
                        <p className="font-mono-app text-2xl font-bold text-primary">{provider.completedJobs}+</p>
                        <p className="mt-1 text-xs text-muted-foreground font-semibold">Jobs Completed</p>
                      </div>
                      <div className="rounded-2xl bg-muted/50 p-3">
                        <p className="font-mono-app text-2xl font-bold text-primary">{provider.experience}</p>
                        <p className="mt-1 text-xs text-muted-foreground font-semibold">Field Experience</p>
                      </div>
                      <div className="rounded-2xl bg-muted/50 p-3">
                        <p className="font-mono-app text-2xl font-bold text-primary">{provider.rating}</p>
                        <p className="mt-1 text-xs text-muted-foreground font-semibold">Average Rating</p>
                      </div>
                    </div>
                  </section>

                  {/* Services & Pricing */}
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-display text-2xl font-bold">Available Services & Estimates</h2>
                      <span className="text-xs font-bold text-muted-foreground">All prices inclusive of tax</span>
                    </div>
                    <div className="grid gap-3.5">
                      {provider.services.map((service) => (
                        <div
                          key={service.name}
                          className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between gap-3 sm:flex-row sm:items-center card-hover"
                        >
                          <div>
                            <h3 className="font-display text-lg font-bold">{service.name}</h3>
                            <p className="mt-1 text-xs text-muted-foreground">{service.description}</p>
                            <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                              <Clock3 size={13} /> {service.duration}
                            </span>
                          </div>
                          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                            <span className="font-mono-app text-lg font-bold text-primary">{money(service.price)}</span>
                            <Button
                              onClick={() =>
                                setLocation(`/bookings/new?providerId=${provider.id}&service=${encodeURIComponent(service.name)}`)
                              }
                              data-testid={`button-book-service-${service.name.replaceAll(' ', '-').toLowerCase()}`}
                              className="px-4 py-2 text-xs"
                            >
                              Choose Service <ArrowRight size={14} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Reviews Section */}
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-display text-2xl font-bold">Client Reviews ({allReviews.length})</h2>
                      <Button variant="outline" onClick={() => setReviewModalOpen(true)} className="text-xs">
                        <Sparkles size={14} className="text-primary" /> Write a Review
                      </Button>
                    </div>

                    <div className="grid gap-3.5">
                      {allReviews.map((review, i) => (
                        <div key={`${review.author}-${i}`} className="rounded-2xl border border-border bg-card p-5 shadow-xs">
                          <div className="flex items-start gap-3">
                            <Avatar name={review.author} size="size-9" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <p className="font-bold text-sm">{review.author}</p>
                                <span className="text-xs text-muted-foreground">{dateLabel(review.date)}</span>
                              </div>
                              <div className="mt-1 flex gap-0.5">
                                {Array.from({ length: 5 }).map((_, index) => (
                                  <Star
                                    key={index}
                                    size={13}
                                    fill={index < review.rating ? 'currentColor' : 'none'}
                                    className={index < review.rating ? 'text-orange-500' : 'text-border'}
                                  />
                                ))}
                              </div>
                              <p className="mt-2.5 text-sm leading-6 text-stone-700">“{review.text}”</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Sidebar Sticky Box */}
                <aside className="h-fit rounded-3xl border border-border bg-stone-900 p-6 text-stone-100 lg:sticky lg:top-24 shadow-xl">
                  <p className="font-mono-app text-xs font-bold uppercase tracking-[.18em] text-orange-400">Guaranteed Service</p>
                  <h3 className="mt-2 font-display text-2xl font-bold text-stone-50">Book with FixNear Guarantee</h3>
                  <p className="mt-3 text-xs leading-6 text-stone-300">
                    Your payment is held safely until the professional completes the job to your satisfaction.
                  </p>

                  <div className="mt-6 space-y-3 text-xs text-stone-300 border-t border-white/10 pt-5">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 size={16} className="text-emerald-400" />
                      Free cancellation up to 2 hours prior
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 size={16} className="text-emerald-400" />
                      30-day workmanship re-fix warranty
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 size={16} className="text-emerald-400" />
                      24/7 dedicated support team
                    </div>
                  </div>

                  <Button
                    onClick={() => setLocation(`/bookings/new?providerId=${provider.id}`)}
                    className="mt-7 w-full py-3.5 text-base"
                    data-testid="button-book-aside"
                  >
                    Select time & book <ArrowRight size={16} />
                  </Button>
                </aside>
              </div>

              {/* Write Review Modal */}
              {reviewModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade">
                  <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl animate-rise">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <h3 className="font-display text-lg font-bold">Review {provider.name}</h3>
                      <button type="button" onClick={() => setReviewModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                        <X size={18} />
                      </button>
                    </div>
                    <form onSubmit={addReview} className="mt-4 grid gap-4">
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase">Your Rating</label>
                        <div className="mt-1 flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className="p-1 text-orange-500 hover:scale-110 transition-transform"
                            >
                              <Star size={24} fill={star <= reviewRating ? 'currentColor' : 'none'} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <label className="grid gap-1.5 text-sm font-semibold">
                        Your Name
                        <input
                          value={reviewAuthor}
                          onChange={(e) => setReviewAuthor(e.target.value)}
                          placeholder="e.g. Alex C."
                          className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                        />
                      </label>
                      <label className="grid gap-1.5 text-sm font-semibold">
                        Your Feedback
                        <textarea
                          required
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          placeholder="How did the service go? Was the professional on time and thorough?"
                          rows={3}
                          className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary resize-none"
                        />
                      </label>
                      <div className="flex gap-2 justify-end mt-2">
                        <Button type="button" variant="outline" onClick={() => setReviewModalOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Submit Review</Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </QueryState>
      </div>
    </Shell>
  );
}

/* ========================================================================= */
/* BOOKING CREATION PAGE                                                     */
/* ========================================================================= */
function BookingNew() {
  const [location, setLocation] = useLocation();
  const params = new URLSearchParams(location.split('?')[1] || '');
  const providerId = params.get('providerId') || '';
  const initialService = params.get('service') || '';

  const providerQuery = useGetProvider(providerId, {
    query: { enabled: !!providerId, queryKey: getGetProviderQueryKey(providerId) },
  });
  const createBooking = useCreateBooking();
  const provider = providerQuery.data as ProviderDetail | undefined;

  const [service, setService] = useState(initialService);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [address, setAddress] = useState('');
  const [problem, setProblem] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Card ending in 4242');

  useEffect(() => {
    if (provider && !service && provider.services.length > 0) {
      setService(provider.services[0].name);
    }
  }, [provider, service]);

  const selectedService = provider?.services.find((item) => item.name === service);
  const fee = selectedService?.price || provider?.startingPrice || 499;
  const platformFee = Math.round(fee * 0.08);
  const total = fee + platformFee;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!providerId || !service || !date || !time || !address) return;

    createBooking.mutate(
      {
        data: {
          providerId,
          service,
          date,
          time,
          address,
          problem,
          paymentMethod,
        },
      },
      {
        onSuccess: (booking) => {
          queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          setLocation(`/bookings/${booking.id}`);
        },
      },
    );
  };

  return (
    <Shell>
      <div className="mx-auto max-w-[1080px] px-5 py-8 lg:px-8 lg:py-12">
        <Link
          href={providerId ? `/providers/${providerId}` : '/discover'}
          data-testid="link-back-booking"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={16} /> Back
        </Link>

        <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="font-mono-app text-xs font-bold uppercase tracking-[.18em] text-primary">Easy Booking</p>
            <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">Schedule Your Service</h1>
            <p className="mt-2 text-muted-foreground">Select appointment timing and provide service location details.</p>

            <QueryState
              loading={providerQuery.isLoading}
              error={!!providerQuery.error}
              empty={!providerQuery.isLoading && !provider}
              retry={() => providerQuery.refetch()}
            >
              {provider && (
                <form onSubmit={submit} className="mt-8 grid gap-5">
                  <section className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs flex items-center gap-4">
                    <Avatar name={provider.name} src={provider.avatar} size="size-14" />
                    <div>
                      <p className="font-display text-lg font-bold">{provider.name}</p>
                      <p className="text-xs text-muted-foreground">{provider.title}</p>
                    </div>
                    <span className="ml-auto rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 flex items-center gap-1">
                      <ShieldCheck size={13} /> Verified Pro
                    </span>
                  </section>

                  <section className="rounded-3xl border border-border bg-card p-6 shadow-xs">
                    <h2 className="font-display text-xl font-bold">1. Select Service Package</h2>
                    <label className="mt-4 grid gap-2 text-sm font-semibold">
                      Service Type
                      <select
                        required
                        value={service}
                        onChange={(event) => setService(event.target.value)}
                        data-testid="select-booking-service"
                        className="rounded-xl border border-input bg-background px-3.5 py-3 font-medium outline-none focus:border-primary cursor-pointer"
                      >
                        {provider.services.map((item) => (
                          <option key={item.name} value={item.name}>
                            {item.name} — {money(item.price)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="mt-4 grid gap-2 text-sm font-semibold">
                      Describe the problem (optional)
                      <textarea
                        value={problem}
                        onChange={(event) => setProblem(event.target.value)}
                        placeholder="e.g. AC cooling is low, makes rattling noise when turned on"
                        data-testid="textarea-booking-problem"
                        rows={3}
                        className="rounded-xl border border-input bg-background px-3.5 py-3 font-normal outline-none focus:border-primary resize-none"
                      />
                    </label>
                  </section>

                  <section className="rounded-3xl border border-border bg-card p-6 shadow-xs">
                    <h2 className="font-display text-xl font-bold">2. When & Where</h2>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <label className="grid gap-2 text-sm font-semibold">
                        Preferred Date
                        <input
                          required
                          type="date"
                          value={date}
                          onChange={(event) => setDate(event.target.value)}
                          data-testid="input-booking-date"
                          className="rounded-xl border border-input bg-background px-3.5 py-3 font-medium outline-none focus:border-primary cursor-pointer"
                        />
                      </label>
                      <label className="grid gap-2 text-sm font-semibold">
                        Arrival Time Slot
                        <select
                          required
                          value={time}
                          onChange={(event) => setTime(event.target.value)}
                          data-testid="select-booking-time"
                          className="rounded-xl border border-input bg-background px-3.5 py-3 font-medium outline-none focus:border-primary cursor-pointer"
                        >
                          <option value="">Choose arrival window</option>
                          <option>9:00 AM – 11:00 AM</option>
                          <option>11:00 AM – 1:00 PM</option>
                          <option>2:00 PM – 4:00 PM</option>
                          <option>4:00 PM – 6:00 PM</option>
                        </select>
                      </label>
                    </div>

                    <label className="mt-4 grid gap-2 text-sm font-semibold">
                      Service Address
                      <input
                        required
                        value={address}
                        onChange={(event) => setAddress(event.target.value)}
                        placeholder="House / Flat No., Street, Area, Pin Code"
                        data-testid="input-booking-address"
                        className="rounded-xl border border-input bg-background px-3.5 py-3 font-medium outline-none focus:border-primary"
                      />
                    </label>
                  </section>

                  <section className="rounded-3xl border border-border bg-card p-6 shadow-xs">
                    <h2 className="font-display text-xl font-bold">3. Payment Preference</h2>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label
                        className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-sm font-semibold transition-all ${
                          paymentMethod === 'Card ending in 4242' ? 'border-primary bg-orange-50/50 shadow-xs' : 'border-border'
                        }`}
                      >
                        <input
                          type="radio"
                          name="pay"
                          checked={paymentMethod === 'Card ending in 4242'}
                          onChange={() => setPaymentMethod('Card ending in 4242')}
                          data-testid="radio-payment-card"
                        />
                        <CreditCard size={18} className="text-primary" />
                        <div>
                          <p>Card ending in 4242</p>
                          <p className="text-[11px] text-muted-foreground">Pre-authorized, charged after work</p>
                        </div>
                      </label>

                      <label
                        className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-sm font-semibold transition-all ${
                          paymentMethod === 'Cash' ? 'border-primary bg-orange-50/50 shadow-xs' : 'border-border'
                        }`}
                      >
                        <input
                          type="radio"
                          name="pay"
                          checked={paymentMethod === 'Cash'}
                          onChange={() => setPaymentMethod('Cash')}
                          data-testid="radio-payment-cash"
                        />
                        <Check size={18} className="text-primary" />
                        <div>
                          <p>Pay After Service</p>
                          <p className="text-[11px] text-muted-foreground">UPI or Cash directly to the pro</p>
                        </div>
                      </label>
                    </div>
                  </section>

                  <Button
                    type="submit"
                    disabled={createBooking.isPending}
                    className="w-full py-4 text-base font-bold shadow-lg"
                    data-testid="button-confirm-booking"
                  >
                    {createBooking.isPending ? (
                      <>
                        <LoaderCircle size={18} className="animate-spin" /> Confirming Booking…
                      </>
                    ) : (
                      <>
                        Confirm Booking ({money(total)}) <ArrowRight size={18} />
                      </>
                    )}
                  </Button>

                  {createBooking.error && (
                    <p className="text-center text-sm font-semibold text-red-600" data-testid="status-booking-error">
                      Unable to complete booking. Please verify details and submit again.
                    </p>
                  )}
                </form>
              )}
            </QueryState>
          </div>

          {/* Estimate Breakdown Sidebar */}
          <aside className="h-fit rounded-3xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-24">
            <p className="font-mono-app text-xs font-bold uppercase tracking-[.18em] text-primary">Summary</p>
            <h3 className="mt-2 font-display text-xl font-bold">{service || 'Service Package'}</h3>
            <div className="mt-6 space-y-3 border-b border-border pb-5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Fee</span>
                <span className="font-semibold">{money(fee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Protection & Guarantee (8%)</span>
                <span className="font-semibold">{money(platformFee)}</span>
              </div>
            </div>
            <div className="mt-4 flex justify-between font-display text-2xl font-bold">
              <span>Estimated Total</span>
              <span className="text-primary">{money(total)}</span>
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs leading-5 text-muted-foreground">
              <ShieldCheck size={18} className="shrink-0 text-emerald-600" />
              FixNear Escrow: No payment released until you sign off on the job.
            </p>
          </aside>
        </div>
      </div>
    </Shell>
  );
}

/* ========================================================================= */
/* LIVE BOOKING STATUS & SIMULATED CHAT DRAWER                               */
/* ========================================================================= */
function BookingStatus() {
  const params = useParams<{ bookingId: string }>();
  const bookingsQuery = useListBookings();
  const updateStatus = useUpdateBookingStatus();
  const booking = (bookingsQuery.data || []).find((item) => item.id === params.bookingId);
  const [, setLocation] = useLocation();

  const steps: BookingStatusInputStatus[] = ['requested', 'accepted', 'on_the_way', 'started', 'completed'];
  const currentIndex = Math.max(0, steps.indexOf((booking?.status || 'requested') as BookingStatusInputStatus));

  // Interactive Live Chat Modal State
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'pro'; text: string; time: string }>>([
    { sender: 'pro', text: 'Hi! I received your booking. Please let me know if there are specific instructions.', time: '10 mins ago' },
  ]);
  const [chatInput, setChatInput] = useState('');

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = { sender: 'user' as const, text: chatInput.trim(), time: 'Just now' };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');

    // Simulate instant provider response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'pro',
          text: 'Understood! I will be there as scheduled with all necessary parts and equipment.',
          time: 'Just now',
        },
      ]);
    }, 1000);
  };

  const advance = () => {
    if (!booking || currentIndex >= steps.length - 1) return;
    const nextStep = steps[currentIndex + 1];
    updateStatus.mutate(
      { bookingId: booking.id, data: { status: nextStep } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        },
      },
    );
  };

  return (
    <Shell>
      <div className="mx-auto max-w-[920px] px-5 py-8 lg:px-8 lg:py-12">
        <Link
          href="/dashboard"
          data-testid="link-back-dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={16} /> Back to My Bookings
        </Link>

        <QueryState
          loading={bookingsQuery.isLoading}
          error={!!bookingsQuery.error}
          empty={!bookingsQuery.isLoading && !booking}
          retry={() => bookingsQuery.refetch()}
        >
          {booking && (
            <>
              <div className="mt-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="font-mono-app text-xs font-bold uppercase tracking-[.18em] text-primary">
                    Order ID: {booking.id}
                  </p>
                  <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">Live Service Tracking</h1>
                  <p className="mt-1 text-muted-foreground">Real-time status updates for your service request.</p>
                </div>
                <span
                  className={`w-fit rounded-full px-3.5 py-1.5 text-xs font-bold border ${statusClass(booking.status)}`}
                  data-testid="status-booking"
                >
                  {statusLabel(booking.status)}
                </span>
              </div>

              <div className="mt-8 rounded-[2.25rem] border border-border bg-card p-6 shadow-xs sm:p-8">
                {/* Pro info banner */}
                <div className="flex items-center gap-4 border-b border-border pb-6">
                  <Avatar name={booking.providerName} src={booking.providerAvatar} size="size-14" />
                  <div>
                    <p className="font-display text-xl font-bold">{booking.providerName}</p>
                    <p className="text-xs text-muted-foreground">{booking.providerTitle}</p>
                  </div>
                  <Link
                    href={`/providers/${booking.providerId}`}
                    data-testid="link-booking-provider"
                    className="ml-auto text-xs font-bold text-primary hover:underline"
                  >
                    View profile
                  </Link>
                </div>

                <div className="mt-8 grid gap-8 md:grid-cols-[1.2fr_1fr]">
                  {/* Progress Stepper */}
                  <div>
                    <h3 className="font-display text-lg font-bold mb-6">Service Progress</h3>
                    <div className="relative">
                      {steps.map((step, index) => (
                        <div key={step} className="relative flex gap-4 pb-7 last:pb-0">
                          <div
                            className={`relative z-10 grid size-8 shrink-0 place-items-center rounded-full border-2 transition-all ${
                              index <= currentIndex
                                ? 'bg-primary text-white border-primary shadow-xs'
                                : 'bg-muted text-muted-foreground border-border'
                            }`}
                          >
                            {index < currentIndex ? (
                              <Check size={14} />
                            ) : index === currentIndex ? (
                              <span className="size-2 rounded-full bg-current animate-pulse" />
                            ) : (
                              <span className="size-1.5 rounded-full bg-current" />
                            )}
                          </div>
                          {index < steps.length - 1 && (
                            <span
                              className={`absolute left-[15px] top-8 h-full w-0.5 ${
                                index < currentIndex ? 'bg-primary' : 'bg-border'
                              }`}
                            />
                          )}
                          <div>
                            <p className={`text-sm font-bold ${index <= currentIndex ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {statusLabel(step)}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {index === 0
                                ? 'Request dispatched to pro.'
                                : index === 1
                                ? 'Professional accepted the job.'
                                : index === 2
                                ? 'Specialist is en route.'
                                : index === 3
                                ? 'Inspection & work in progress.'
                                : 'Service completed & verified.'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8">
                      <Button
                        onClick={advance}
                        disabled={updateStatus.isPending || currentIndex >= steps.length - 1}
                        data-testid="button-advance-booking"
                        className="w-full sm:w-auto"
                      >
                        {updateStatus.isPending
                          ? 'Updating…'
                          : currentIndex >= steps.length - 1
                          ? '✓ Service Complete'
                          : `Simulate: Advance to ${statusLabel(steps[currentIndex + 1])}`}{' '}
                        <ArrowRight size={16} />
                      </Button>
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="rounded-2xl bg-muted/50 p-6 border border-border/80 flex flex-col justify-between">
                    <div>
                      <p className="font-mono-app text-xs font-bold uppercase tracking-[.18em] text-primary">Appointment Info</p>
                      <div className="mt-4 space-y-4 text-xs">
                        <div className="flex gap-3">
                          <CalendarDays size={16} className="text-primary shrink-0" />
                          <div>
                            <p className="font-bold text-foreground">{dateLabel(booking.date)}</p>
                            <p className="text-muted-foreground">{booking.time}</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <MapPin size={16} className="text-primary shrink-0" />
                          <p className="text-muted-foreground leading-5">{booking.address}</p>
                        </div>
                        <div className="flex gap-3">
                          <FileText size={16} className="text-primary shrink-0" />
                          <p className="text-muted-foreground leading-5">{booking.service}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 border-t border-border pt-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Fee</p>
                          <p className="font-mono-app text-2xl font-bold text-foreground">{money(booking.total)}</p>
                        </div>
                        <span className="rounded-md bg-white px-2 py-1 text-[10px] font-bold text-stone-600 border border-border">
                          {booking.paymentMethod}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={() => setChatOpen(true)} data-testid="button-message-provider">
                  <MessageCircle size={16} /> Chat with Professional
                </Button>
                <Button variant="outline" onClick={() => setLocation(`/providers/${booking.providerId}`)}>
                  View Profile
                </Button>
              </div>

              {/* Chat Modal */}
              {chatOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade">
                  <div className="flex flex-col w-full max-w-lg h-[520px] rounded-3xl border border-border bg-card shadow-2xl overflow-hidden animate-rise">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-border p-4 bg-muted/40">
                      <div className="flex items-center gap-3">
                        <Avatar name={booking.providerName} src={booking.providerAvatar} size="size-10" />
                        <div>
                          <p className="font-bold text-sm leading-none">{booking.providerName}</p>
                          <p className="text-[11px] text-emerald-600 font-semibold mt-1">● Online for this booking</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => setChatOpen(false)} className="text-muted-foreground hover:text-foreground">
                        <X size={18} />
                      </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50/50">
                      {messages.map((m, idx) => (
                        <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs ${
                              m.sender === 'user'
                                ? 'bg-primary text-white shadow-xs rounded-br-none'
                                : 'bg-card border border-border text-foreground shadow-xs rounded-bl-none'
                            }`}
                          >
                            <p>{m.text}</p>
                            <p className={`mt-1 text-[9px] ${m.sender === 'user' ? 'text-white/75' : 'text-muted-foreground'} text-right`}>
                              {m.time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Input */}
                    <form onSubmit={sendChatMessage} className="flex items-center gap-2 border-t border-border p-3 bg-card">
                      <input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Type a message to your specialist..."
                        className="flex-1 rounded-xl border border-input bg-background px-3.5 py-2 text-xs outline-none focus:border-primary"
                      />
                      <Button type="submit" className="p-2.5">
                        <Send size={14} />
                      </Button>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </QueryState>
      </div>
    </Shell>
  );
}

/* ========================================================================= */
/* CUSTOMER DASHBOARD                                                        */
/* ========================================================================= */
function Dashboard() {
  const summaryQuery = useGetDashboardSummary();
  const bookingsQuery = useListBookings();
  const notificationsQuery = useListNotifications();
  const { user } = useAuth();

  const summary = summaryQuery.data;
  const bookings = bookingsQuery.data || [];

  const summaryStats = [
    { label: 'Completed Services', value: summary?.completedServices || 18, Icon: BriefcaseBusiness },
    { label: 'Total Spending', value: money(summary?.totalSpending || 12740), Icon: CreditCard },
    { label: 'Saved Professionals', value: summary?.savedProfessionals || 6, Icon: UsersRound },
    { label: 'Active Bookings', value: bookings.filter((b) => b.status !== 'completed').length, Icon: TrendingUp },
  ];

  return (
    <Shell>
      <div className="mx-auto max-w-[1280px] px-5 py-8 lg:px-8 lg:py-12">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono-app text-xs font-bold uppercase tracking-[.18em] text-primary">Customer Portal</p>
            <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'Alex'}
            </h1>
            <p className="mt-1 text-muted-foreground">Manage your home repairs, active visits, and past service history.</p>
          </div>
          <Link
            href="/discover"
            data-testid="link-dashboard-find"
            className="inline-flex w-fit items-center gap-2 rounded-xl gradient-primary px-5 py-3 text-sm font-bold text-white shadow-md hover:-translate-y-0.5"
          >
            <Plus size={17} /> Book a New Service
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryStats.map(({ label, value, Icon }) => (
            <div key={label} className="rounded-3xl border border-border bg-card p-6 shadow-xs card-hover">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-muted-foreground uppercase">{label}</p>
                <span className="grid size-10 place-items-center rounded-2xl bg-orange-100 text-primary">
                  <Icon size={18} />
                </span>
              </div>
              <p className="mt-4 font-display text-3xl font-extrabold text-foreground">{value}</p>
            </div>
          ))}
        </div>

        {/* Bookings Queue and Spending Rhythm */}
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_.7fr]">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl font-bold">Your Bookings Queue</h2>
              <Link href="/discover" className="text-xs font-bold text-primary hover:underline">
                Find another expert
              </Link>
            </div>

            <div className="grid gap-3.5">
              {bookings.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/bookings/${booking.id}`}
                  className="rounded-3xl border border-border bg-card p-5 shadow-xs hover:border-primary/50 card-hover flex flex-col justify-between gap-3 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-3.5">
                    <Avatar name={booking.providerName} src={booking.providerAvatar} size="size-12" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-display text-base font-bold">{booking.service}</p>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${statusClass(booking.status)}`}>
                          {statusLabel(booking.status)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {booking.providerName} · {dateLabel(booking.date)} · {booking.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 border-t border-border pt-3 sm:border-0 sm:pt-0">
                    <span className="font-mono-app font-bold text-foreground">{money(booking.total)}</span>
                    <span className="text-xs font-bold text-primary flex items-center gap-1">
                      Track <ArrowRight size={13} />
                    </span>
                  </div>
                </Link>
              ))}

              {!bookings.length && (
                <div className="rounded-3xl border border-dashed border-border p-10 text-center">
                  <p className="text-sm text-muted-foreground">You don't have any bookings yet.</p>
                  <Link href="/discover" className="mt-3 inline-block font-bold text-sm text-primary">
                    Find an expert now
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* Spending & Notifications Aside */}
          <aside className="space-y-6">
            <div className="rounded-3xl border border-border bg-stone-900 p-6 text-stone-100 shadow-lg">
              <div className="flex items-center justify-between">
                <p className="font-mono-app text-xs font-bold uppercase tracking-[.18em] text-orange-400">Monthly Spending</p>
                <TrendingUp size={18} className="text-orange-400" />
              </div>

              <div className="mt-7 flex h-36 items-end gap-2.5">
                {(summary?.monthlySpending || []).map((point) => (
                  <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-lg bg-orange-400/80 transition-all hover:bg-orange-300"
                      style={{
                        height: `${Math.max(15, Math.min(100, (point.value / 3200) * 100))}%`,
                      }}
                    />
                    <span className="font-mono-app text-[10px] text-stone-400">{point.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-bold">Recent Updates</h3>
                <Bell size={16} className="text-primary" />
              </div>
              <div className="space-y-3">
                {(notificationsQuery.data || []).map((n) => (
                  <div key={n.id} className="rounded-2xl bg-muted/50 p-3 text-xs">
                    <p className="font-bold text-foreground">{n.title}</p>
                    <p className="text-muted-foreground mt-0.5">{n.body}</p>
                    <p className="mt-1 text-[10px] font-mono-app text-primary">{n.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Shell>
  );
}

/* ========================================================================= */
/* PROVIDER DASHBOARD (PRO STUDIO)                                           */
/* ========================================================================= */
function ProviderDashboard() {
  const bookingsQuery = useListBookings();
  const updateStatus = useUpdateBookingStatus();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isAvailable, setIsAvailable] = useState(true);

  const bookings = bookingsQuery.data || [];
  const openBookings = bookings.filter((b) => b.status !== 'completed' && b.status !== 'cancelled');

  const advanceBooking = (booking: Booking) => {
    const nextStatus =
      booking.status === 'requested'
        ? 'accepted'
        : booking.status === 'accepted'
        ? 'on_the_way'
        : booking.status === 'on_the_way'
        ? 'started'
        : 'completed';

    updateStatus.mutate(
      { bookingId: booking.id, data: { status: nextStatus as BookingStatusInputStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        },
      },
    );
  };

  return (
    <Shell>
      <div className="mx-auto max-w-[1280px] px-5 py-8 lg:px-8 lg:py-12">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono-app text-xs font-bold uppercase tracking-[.18em] text-primary">Pro Studio</span>
              <button
                type="button"
                onClick={() => setIsAvailable(!isAvailable)}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border transition-colors ${
                  isAvailable ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-stone-200 text-stone-700 border-stone-300'
                }`}
              >
                {isAvailable ? '● Receiving Leads' : '⏸️ Paused'}
              </button>
            </div>
            <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">
              {user?.role === 'provider' ? `${user.name}'s Studio` : 'Professional Studio'}
            </h1>
            <p className="mt-1 text-muted-foreground">Manage your incoming customer jobs, dispatch status, and client payouts.</p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => bookings[0] && setLocation(`/providers/${bookings[0].providerId}`)}
              data-testid="button-provider-profile"
            >
              <UserRound size={16} /> View Public Profile
            </Button>
          </div>
        </div>

        {/* Metrics Overview */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-stone-900 p-6 text-stone-100 shadow-xl">
            <p className="text-xs uppercase font-bold text-stone-400">Total Monthly Earnings</p>
            <p className="mt-4 font-display text-3xl font-extrabold text-stone-50">
              {money(bookings.reduce((sum, b) => sum + b.serviceFee, 0))}
            </p>
            <p className="mt-1 text-xs text-orange-400">Paid out every Monday to registered bank</p>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs card-hover">
            <p className="text-xs uppercase font-bold text-muted-foreground">Active Work Queue</p>
            <p className="mt-4 font-display text-3xl font-extrabold text-foreground">{openBookings.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">Require your attention or dispatch</p>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs card-hover">
            <p className="text-xs uppercase font-bold text-muted-foreground">Pro Rating</p>
            <p className="mt-4 font-display text-3xl font-extrabold text-foreground flex items-center gap-2">
              4.9 <Star size={24} fill="currentColor" className="text-orange-500" />
            </p>
            <p className="mt-1 text-xs text-muted-foreground">From 128 verified customer reviews</p>
          </div>
        </div>

        {/* Work Queue */}
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_.7fr]">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl font-bold">Incoming Jobs Queue</h2>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold">
                {openBookings.length} pending
              </span>
            </div>

            <div className="grid gap-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="rounded-3xl border border-border bg-card p-6 shadow-xs card-hover">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="flex gap-4">
                      <Avatar name="Customer" size="size-12" />
                      <div>
                        <p className="font-display text-lg font-bold">{booking.service}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {dateLabel(booking.date)} · {booking.time} · {booking.address}
                        </p>
                        <p className="mt-2 text-xs leading-5 text-stone-600 bg-muted/40 p-2.5 rounded-xl">
                          📝 Notes: {booking.problem || 'Standard inspection and maintenance'}
                        </p>
                      </div>
                    </div>
                    <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold border ${statusClass(booking.status)}`}>
                      {statusLabel(booking.status)}
                    </span>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">Your Net Payout</span>
                      <p className="font-mono-app text-base font-bold text-primary">{money(booking.serviceFee)}</p>
                    </div>

                    {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                      <Button
                        onClick={() => advanceBooking(booking)}
                        disabled={updateStatus.isPending}
                        data-testid={`button-provider-advance-${booking.id}`}
                        className="px-4 py-2 text-xs"
                      >
                        {booking.status === 'requested'
                          ? 'Accept Request'
                          : booking.status === 'accepted'
                          ? 'Mark On The Way'
                          : booking.status === 'on_the_way'
                          ? 'Mark Work Started'
                          : 'Complete Service'}{' '}
                        <ArrowRight size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Pro Tips Aside */}
          <aside className="h-fit rounded-3xl border border-border bg-stone-100 p-6">
            <p className="font-mono-app text-xs font-bold uppercase tracking-[.18em] text-primary">Partner Standards</p>
            <h3 className="mt-2 font-display text-xl font-bold">Maintaining Top Status</h3>
            <div className="mt-5 space-y-3 text-xs leading-5 text-muted-foreground">
              <div className="flex gap-2.5 rounded-2xl bg-white p-3.5 border border-border">
                <Clock3 size={18} className="text-primary shrink-0" />
                <p>Respond to customer inquiries within 15 minutes for maximum ranking.</p>
              </div>
              <div className="flex gap-2.5 rounded-2xl bg-white p-3.5 border border-border">
                <ShieldCheck size={18} className="text-primary shrink-0" />
                <p>Always show your FixNear badge before entering a client premise.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Shell>
  );
}

/* ========================================================================= */
/* REDESIGNED, ROBUST LOGIN & SIGN-UP PAGE                                   */
/* ========================================================================= */
function Login() {
  const [, setLocation] = useLocation();
  const { login, register, loginAsDemo } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [role, setRole] = useState<'customer' | 'provider'>('customer');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        const res = await login(email, password, role);
        if (!res.success) {
          setErrorMsg(res.error || 'Failed to sign in. Check your email/password.');
          setLoading(false);
          return;
        }
        setSuccessMsg('Welcome back! Redirecting…');
        setTimeout(() => {
          setLocation(role === 'provider' ? '/provider-dashboard' : '/dashboard');
        }, 600);
      } else {
        const res = await register({ name, email, password, role, phone });
        if (!res.success) {
          setErrorMsg(res.error || 'Could not complete registration.');
          setLoading(false);
          return;
        }
        setSuccessMsg('Account created successfully! Welcome to FixNear.');
        setTimeout(() => {
          setLocation(role === 'provider' ? '/provider-dashboard' : '/dashboard');
        }, 600);
      }
    } catch {
      setErrorMsg('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoRole: 'customer' | 'provider') => {
    loginAsDemo(demoRole);
    setLocation(demoRole === 'provider' ? '/provider-dashboard' : '/dashboard');
  };

  return (
    <div className="noise min-h-[100dvh] bg-stone-900 text-stone-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="mx-auto grid w-full max-w-[1120px] overflow-hidden rounded-[2.5rem] border border-white/10 bg-stone-950 shadow-2xl lg:grid-cols-[1fr_1.1fr]">
        {/* Left Branding / Value Proposition Column */}
        <div className="relative hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 border-r border-white/10">
          <div className="absolute top-0 left-0 size-80 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

          <div>
            <Logo light />
            <div className="mt-14">
              <span className="font-mono-app text-xs font-bold uppercase tracking-[.18em] text-orange-400">
                A Smarter Neighborhood Network
              </span>
              <h2 className="mt-4 font-display text-4xl font-extrabold leading-[1.08] text-white">
                Reliable help without the usual headaches.
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-7 text-stone-300">
                Whether you need a quick repair or provide skilled services, FixNear provides secure transactions, verified ratings, and genuine accountability.
              </p>
            </div>
          </div>

          <div className="mt-12 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <p className="text-xs italic text-stone-300">
                “FixNear took the lottery out of finding a contractor. Priya arrived right on time with the exact tools needed.”
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs font-bold text-orange-300">
                <span>Rohan V.</span>
                <span className="text-stone-500">•</span>
                <span className="text-stone-400 font-normal">Indiranagar</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-stone-400 pt-2 border-t border-white/10">
              <span>Over 18 cities</span>
              <span>100% ID Verified</span>
              <span>Escrow Protected</span>
            </div>
          </div>
        </div>

        {/* Right Form Card Column */}
        <div className="flex items-center justify-center bg-card p-6 sm:p-10 text-foreground">
          <div className="w-full max-w-md">
            <div className="lg:hidden mb-8">
              <Logo />
            </div>

            {/* Mode Switcher: Sign In vs Create Account */}
            <div className="flex rounded-2xl bg-muted p-1 shadow-inner">
              <button
                type="button"
                onClick={() => { setMode('signin'); setErrorMsg(''); }}
                className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer ${
                  mode === 'signin' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setErrorMsg(''); }}
                className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer ${
                  mode === 'signup' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Create Account
              </button>
            </div>

            <div className="mt-6">
              <h3 className="font-display text-2xl font-extrabold tracking-tight">
                {mode === 'signin' ? 'Welcome back' : 'Get started with FixNear'}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {mode === 'signin'
                  ? 'Enter your credentials to access your account'
                  : 'Join your local network as a customer or service partner'}
              </p>
            </div>

            {/* Role Switcher Pill */}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('customer')}
                data-testid="button-role-customer"
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all cursor-pointer ${
                  role === 'customer'
                    ? 'border-primary bg-orange-50 text-primary shadow-xs'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                <UserRound size={15} /> I Need Help
              </button>
              <button
                type="button"
                onClick={() => setRole('provider')}
                data-testid="button-role-provider"
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all cursor-pointer ${
                  role === 'provider'
                    ? 'border-primary bg-orange-50 text-primary shadow-xs'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                <BriefcaseBusiness size={15} /> I Provide Help
              </button>
            </div>

            {/* Error / Success Alerts */}
            {errorMsg && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 flex items-center gap-2 animate-fade">
                <CircleAlert size={16} className="shrink-0" />
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 flex items-center gap-2 animate-fade">
                <CheckCircle2 size={16} className="shrink-0" />
                {successMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-5 grid gap-3.5">
              {mode === 'signup' && (
                <label className="grid gap-1.5 text-xs font-bold text-foreground">
                  Full Name
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Chen"
                    data-testid="input-signup-name"
                    className="rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary font-medium"
                  />
                </label>
              )}

              <label className="grid gap-1.5 text-xs font-bold text-foreground">
                Email Address
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  data-testid="input-login-email"
                  className="rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary font-medium"
                />
              </label>

              {mode === 'signup' && (
                <label className="grid gap-1.5 text-xs font-bold text-foreground">
                  Phone Number
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    data-testid="input-signup-phone"
                    className="rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary font-medium"
                  />
                </label>
              )}

              <label className="grid gap-1.5 text-xs font-bold text-foreground">
                Password
                <div className="relative">
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    data-testid="input-login-password"
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary pr-10 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <Button type="submit" disabled={loading} className="mt-2 py-3 text-sm font-bold shadow-md" data-testid="button-login">
                {loading ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" /> Processing…
                  </>
                ) : (
                  <>
                    {mode === 'signin' ? 'Sign In' : 'Create Account'} <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </form>

            {/* Quick Demo Sign In Box */}
            <div className="mt-6 border-t border-border pt-5">
              <p className="text-center font-mono-app text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                ⚡ Instant 1-Click Demo Testing
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('customer')}
                  data-testid="button-demo-customer"
                  className="rounded-xl border border-border bg-muted/40 p-2.5 text-left text-xs hover:border-primary/50 hover:bg-orange-50/40 transition-all cursor-pointer"
                >
                  <p className="font-bold text-foreground">Alex Chen</p>
                  <p className="text-[11px] text-muted-foreground">Demo Customer</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('provider')}
                  data-testid="button-demo-provider"
                  className="rounded-xl border border-border bg-muted/40 p-2.5 text-left text-xs hover:border-primary/50 hover:bg-orange-50/40 transition-all cursor-pointer"
                >
                  <p className="font-bold text-foreground">Priya Sharma</p>
                  <p className="text-[11px] text-muted-foreground">Demo AC/Pro Specialist</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* ROUTER & ROOT APP                                                         */
/* ========================================================================= */
function Router() {
  const [location] = useLocation();
  return (
    <ErrorBoundary resetKey={location}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/discover" component={Discover} />
        <Route path="/providers/:providerId" component={ProviderDetailPage} />
        <Route path="/bookings/new" component={BookingNew} />
        <Route path="/bookings/:bookingId" component={BookingStatus} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/provider-dashboard" component={ProviderDashboard} />
        <Route path="/login" component={Login} />
        <Route component={NotFound} />
      </Switch>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;