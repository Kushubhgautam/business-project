import { Router, type IRouter } from "express";
import {
  CreateBookingBody,
  GetDashboardSummaryResponse,
  GetProviderResponse,
  ListCategoriesResponse,
  ListBookingsResponse,
  ListNotificationsResponse,
  ListProvidersQueryParams,
  ListProvidersResponse,
  UpdateBookingStatusBody,
  UpdateBookingStatusParams,
} from "@workspace/api-zod";

type Provider = {
  id: string;
  name: string;
  title: string;
  avatar: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  experience: string;
  startingPrice: number;
  distance: string;
  availability: string;
  category: string;
  location: string;
  completedJobs: number;
  tags: string[];
};

type Booking = {
  id: string;
  providerId: string;
  providerName: string;
  providerTitle: string;
  providerAvatar: string;
  service: string;
  date: string;
  time: string;
  address: string;
  problem: string;
  paymentMethod: string;
  serviceFee: number;
  platformFee: number;
  total: number;
  status: string;
  eta: string;
  createdAt: string;
};

const categories = [
  { id: "electrician", name: "Electrician", icon: "zap", count: 248, accent: "amber" },
  { id: "plumber", name: "Plumber", icon: "droplets", count: 186, accent: "blue" },
  { id: "ac-repair", name: "AC Repair", icon: "snowflake", count: 124, accent: "cyan" },
  { id: "computer-repair", name: "Computer Repair", icon: "laptop", count: 98, accent: "violet" },
  { id: "tutor", name: "Tutor", icon: "book-open", count: 312, accent: "rose" },
  { id: "fitness", name: "Fitness Trainer", icon: "dumbbell", count: 76, accent: "emerald" },
  { id: "photographer", name: "Photographer", icon: "camera", count: 64, accent: "orange" },
  { id: "mechanic", name: "Mechanic", icon: "car-front", count: 143, accent: "slate" },
  { id: "cleaning", name: "Cleaning", icon: "sparkles", count: 207, accent: "teal" },
  { id: "painter", name: "Painter", icon: "paintbrush", count: 91, accent: "pink" },
  { id: "security", name: "Security Services", icon: "shield-check", count: 48, accent: "indigo" },
  { id: "mobile-repair", name: "Mobile Repair", icon: "smartphone", count: 116, accent: "lime" },
];

const providers: Provider[] = [
  {
    id: "priya-sharma",
    name: "Priya Sharma",
    title: "Certified AC & appliance specialist",
    avatar: "https://i.pravatar.cc/160?img=47",
    verified: true,
    rating: 4.9,
    reviewCount: 128,
    experience: "8 years experience",
    startingPrice: 499,
    distance: "1.2 km away",
    availability: "Available today",
    category: "AC Repair",
    location: "Indiranagar, Bengaluru",
    completedJobs: 342,
    tags: ["AC service", "Gas refill", "Installation"],
  },
  {
    id: "arjun-nair",
    name: "Arjun Nair",
    title: "Master electrician & home automation",
    avatar: "https://i.pravatar.cc/160?img=12",
    verified: true,
    rating: 4.8,
    reviewCount: 94,
    experience: "11 years experience",
    startingPrice: 349,
    distance: "2.4 km away",
    availability: "Available in 30 min",
    category: "Electrician",
    location: "Koramangala, Bengaluru",
    completedJobs: 518,
    tags: ["Wiring", "Smart home", "Emergency"],
  },
  {
    id: "rohan-mehta",
    name: "Rohan Mehta",
    title: "Laptop & Apple device technician",
    avatar: "https://i.pravatar.cc/160?img=11",
    verified: true,
    rating: 4.7,
    reviewCount: 76,
    experience: "6 years experience",
    startingPrice: 399,
    distance: "3.1 km away",
    availability: "Available tomorrow",
    category: "Computer Repair",
    location: "HSR Layout, Bengaluru",
    completedJobs: 271,
    tags: ["MacBook", "Data recovery", "On-site"],
  },
  {
    id: "ananya-iyer",
    name: "Ananya Iyer",
    title: "Math & science tutor for grades 8–12",
    avatar: "https://i.pravatar.cc/160?img=32",
    verified: true,
    rating: 5,
    reviewCount: 62,
    experience: "5 years experience",
    startingPrice: 600,
    distance: "4.6 km away",
    availability: "Slots this week",
    category: "Tutor",
    location: "Jayanagar, Bengaluru",
    completedJobs: 188,
    tags: ["CBSE", "IIT prep", "Online"],
  },
  {
    id: "sameer-khan",
    name: "Sameer Khan",
    title: "Trusted plumbing & bathroom specialist",
    avatar: "https://i.pravatar.cc/160?img=68",
    verified: true,
    rating: 4.8,
    reviewCount: 107,
    experience: "9 years experience",
    startingPrice: 299,
    distance: "1.8 km away",
    availability: "Available today",
    category: "Plumber",
    location: "Whitefield, Bengaluru",
    completedJobs: 409,
    tags: ["Leak repair", "Fixtures", "Emergency"],
  },
  {
    id: "meera-joshi",
    name: "Meera Joshi",
    title: "Strength coach & mobility trainer",
    avatar: "https://i.pravatar.cc/160?img=49",
    verified: true,
    rating: 4.9,
    reviewCount: 43,
    experience: "7 years experience",
    startingPrice: 799,
    distance: "5.2 km away",
    availability: "Available this week",
    category: "Fitness Trainer",
    location: "JP Nagar, Bengaluru",
    completedJobs: 96,
    tags: ["Strength", "Mobility", "Home visits"],
  },
];

const detailByProvider: Record<string, Record<string, unknown>> = {
  "priya-sharma": {
    about:
      "I help Bengaluru homes stay cool, quiet, and energy-efficient. From a quick filter clean to a full split AC installation, every job comes with clear pricing and a 30-day service warranty.",
    services: [
      { name: "AC diagnosis & service", description: "Inspection, filter clean and performance check", duration: "45–60 min", price: 499 },
      { name: "Gas refill", description: "Leak check and refrigerant top-up", duration: "60–90 min", price: 1499 },
      { name: "AC installation", description: "Safe installation with alignment and testing", duration: "2–3 hours", price: 2499 },
    ],
    portfolio: [
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1631545806609-7f7d5c2b6d02?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1581092919535-7146ff1a590d?auto=format&fit=crop&w=800&q=80",
    ],
    reviews: [
      { author: "Rahul Verma", rating: 5, text: "Arrived on time, explained the issue clearly, and the AC is finally quiet again.", date: "2 days ago", avatar: "https://i.pravatar.cc/80?img=14" },
      { author: "Nandini Rao", rating: 5, text: "Transparent pricing and very neat work. Would book Priya again.", date: "1 week ago", avatar: "https://i.pravatar.cc/80?img=44" },
    ],
    availableDates: ["Today", "Tomorrow", "Sat, 12 Oct", "Sun, 13 Oct"],
  },
};

const now = new Date().toISOString();
let bookings: Booking[] = [
  {
    id: "FX-2481",
    providerId: "priya-sharma",
    providerName: "Priya Sharma",
    providerTitle: "Certified AC & appliance specialist",
    providerAvatar: "https://i.pravatar.cc/160?img=47",
    service: "AC diagnosis & service",
    date: "Today, 4 Oct",
    time: "4:30 PM",
    address: "24, 12th Main, Indiranagar, Bengaluru",
    problem: "AC is making a rattling noise and not cooling the bedroom.",
    paymentMethod: "Pay after service",
    serviceFee: 499,
    platformFee: 49,
    total: 548,
    status: "on_the_way",
    eta: "Arriving in 18 min",
    createdAt: now,
  },
  {
    id: "FX-2390",
    providerId: "arjun-nair",
    providerName: "Arjun Nair",
    providerTitle: "Master electrician & home automation",
    providerAvatar: "https://i.pravatar.cc/160?img=12",
    service: "Ceiling fan installation",
    date: "Sat, 12 Oct",
    time: "11:00 AM",
    address: "24, 12th Main, Indiranagar, Bengaluru",
    problem: "Install a new ceiling fan in the living room.",
    paymentMethod: "UPI",
    serviceFee: 699,
    platformFee: 69,
    total: 768,
    status: "accepted",
    eta: "Confirmed",
    createdAt: now,
  },
];

const router: IRouter = Router();

router.get("/categories", (_req, res) => {
  res.json(ListCategoriesResponse.parse(categories));
});

router.get("/providers", (req, res) => {
  const { search, category, location, verified } = ListProvidersQueryParams.parse(req.query);
  const normalizedSearch = search?.toLowerCase().trim();
  const filtered = providers.filter((provider) => {
    const matchesSearch =
      !normalizedSearch ||
      [provider.name, provider.title, provider.category, ...provider.tags].some((value) =>
        value.toLowerCase().includes(normalizedSearch),
      );
    const matchesCategory = !category || provider.category.toLowerCase() === category.toLowerCase();
    const matchesLocation = !location || provider.location.toLowerCase().includes(location.toLowerCase());
    const matchesVerified = verified === undefined || !verified || provider.verified;
    return matchesSearch && matchesCategory && matchesLocation && matchesVerified;
  });
  res.json(ListProvidersResponse.parse(filtered));
});

router.get("/providers/:providerId", (req, res) => {
  const provider = providers.find((item) => item.id === req.params.providerId);
  if (!provider) {
    res.status(404).json({ error: "Provider not found" });
    return;
  }
  const detail = { ...provider, ...(detailByProvider[provider.id] ?? detailByProvider["priya-sharma"]) };
  res.json(GetProviderResponse.parse(detail));
});

router.get("/bookings", (_req, res) => {
  res.json(ListBookingsResponse.parse(bookings));
});

router.post("/bookings", (req, res) => {
  const input = CreateBookingBody.parse(req.body);
  const provider = providers.find((item) => item.id === input.providerId) ?? providers[0];
  const serviceFee = provider.startingPrice;
  const platformFee = Math.round(serviceFee * 0.1);
  const booking: Booking = {
    id: `FX-${Math.floor(1000 + Math.random() * 8999)}`,
    providerId: provider.id,
    providerName: provider.name,
    providerTitle: provider.title,
    providerAvatar: provider.avatar,
    service: input.service,
    date: input.date,
    time: input.time,
    address: input.address,
    problem: input.problem,
    paymentMethod: input.paymentMethod,
    serviceFee,
    platformFee,
    total: serviceFee + platformFee,
    status: "requested",
    eta: "Waiting for confirmation",
    createdAt: new Date().toISOString(),
  };
  bookings = [booking, ...bookings];
  res.status(201).json(booking);
});

router.patch("/bookings/:bookingId/status", (req, res) => {
  const params = UpdateBookingStatusParams.parse(req.params);
  const { status } = UpdateBookingStatusBody.parse(req.body);
  const booking = bookings.find((item) => item.id === params.bookingId);
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  booking.status = status;
  booking.eta =
    status === "on_the_way"
      ? "Arriving in 18 min"
      : status === "accepted"
        ? "Confirmed"
        : status === "completed"
          ? "Service completed"
          : booking.eta;
  res.json(booking);
});

router.get("/dashboard/summary", (_req, res) => {
  const activeBooking = bookings.find((booking) => ["requested", "accepted", "on_the_way", "started"].includes(booking.status)) ?? bookings[0];
  const upcomingBooking = bookings.find((booking) => booking.id !== activeBooking.id) ?? bookings[0];
  const summary = {
    activeBooking,
    upcomingBooking,
    completedServices: 18,
    totalSpending: 12740,
    savedProfessionals: 6,
    monthlySpending: [
      { label: "May", value: 1450 },
      { label: "Jun", value: 2300 },
      { label: "Jul", value: 1850 },
      { label: "Aug", value: 3120 },
      { label: "Sep", value: 2480 },
      { label: "Oct", value: 1540 },
    ],
    serviceUsage: [
      { label: "Home", value: 42 },
      { label: "Learning", value: 24 },
      { label: "Repair", value: 20 },
      { label: "Wellness", value: 14 },
    ],
  };
  res.json(GetDashboardSummaryResponse.parse(summary));
});

router.get("/notifications", (_req, res) => {
  res.json(
    ListNotificationsResponse.parse([
      { id: "n1", title: "Priya is on the way", body: "Your AC service is arriving in about 18 minutes.", time: "2 min ago", read: false, type: "booking" },
      { id: "n2", title: "Booking confirmed", body: "Arjun accepted your fan installation request.", time: "Yesterday", read: true, type: "success" },
      { id: "n3", title: "How did it go?", body: "Leave a review for your recent plumbing service.", time: "3 days ago", read: true, type: "review" },
    ]),
  );
});

export default router;