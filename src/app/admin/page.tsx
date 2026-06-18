"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, setDoc } from "firebase/firestore";
import {
  Sprout,
  Ticket,
  Trash2,
  Printer,
  Search,
  Lock,
  Unlock,
  TrendingUp,
  Coins,
  MessageSquare,
  Clock,
  LogOut,
  MapPin,
  Phone,
  Truck,
  CheckCircle2,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

interface Booking {
  id: string;
  passId: string;
  name: string;
  phone: string;
  village: string;
  quantity: string;
  vehicle: string;
  dateStr: string;
  timeSlotLabel: string;
  estimatedValue: number;
  createdAt: string;
}

interface Inquiry {
  id: string;
  name: string;
  email: string;
  message: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [activeTab, setActiveTab] = useState<"bookings" | "inquiries" | "rates">("bookings");
  
  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  
  // Rates manager states
  const [ratesBalePrice, setRatesBalePrice] = useState("");
  const [ratesSeedPrice, setRatesSeedPrice] = useState("");
  const [useManualRates, setUseManualRates] = useState(false);
  const [isUpdatingRates, setIsUpdatingRates] = useState(false);

  // Dialog actions
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: "booking" | "inquiry" } | null>(null);
  const [selectedBookingForPass, setSelectedBookingForPass] = useState<Booking | null>(null);

  // Check sessionStorage on mount
  useEffect(() => {
    const authStatus = sessionStorage.getItem("admin_authorized");
    if (authStatus === "true") {
      setIsAuthorized(true);
    }
  }, []);

  // Set real-time Firestore listeners once authorized
  useEffect(() => {
    if (!isAuthorized) return;

    // Listen to bookings
    const bookingsQuery = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
    const unsubscribeBookings = onSnapshot(
      bookingsQuery,
      (snapshot) => {
        const list: Booking[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Booking);
        });
        setBookings(list);
      },
      (error) => {
        console.error("Firestore bookings read error:", error);
        toast.error("Failed to load real-time bookings.");
      }
    );

    // Listen to inquiries
    const inquiriesQuery = query(collection(db, "inquiries"), orderBy("timestamp", "desc"));
    const unsubscribeInquiries = onSnapshot(
      inquiriesQuery,
      (snapshot) => {
        const list: Inquiry[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Inquiry);
        });
        setInquiries(list);
      },
      (error) => {
        console.error("Firestore inquiries read error:", error);
        toast.error("Failed to load real-time inquiries.");
      }
    );

    // Listen to rates settings
    const unsubscribeRates = onSnapshot(
      doc(db, "settings", "rates"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setRatesBalePrice(data.manualBalePrice?.toString() || "");
          setRatesSeedPrice(data.manualSeedPrice?.toString() || "");
          setUseManualRates(!!data.useManualRates);
        }
      },
      (error) => {
        console.error("Firestore rates read error:", error);
      }
    );

    return () => {
      unsubscribeBookings();
      unsubscribeInquiries();
      unsubscribeRates();
    };
  }, [isAuthorized]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPasscode = process.env.NEXT_PUBLIC_ADMIN_PASSCODE || "basaveshwara2026";
    if (passcode === correctPasscode) {
      setIsAuthorized(true);
      sessionStorage.setItem("admin_authorized", "true");
      toast.success("Authorized successfully!");
    } else {
      toast.error("Invalid passcode. Please try again.");
    }
  };

  const handleLogout = () => {
    setIsAuthorized(false);
    setPasscode("");
    sessionStorage.removeItem("admin_authorized");
    toast.info("Logged out.");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { id, type } = deleteTarget;
    
    try {
      if (type === "booking") {
        await deleteDoc(doc(db, "bookings", id));
        toast.success("Booking deleted successfully.");
      } else {
        await deleteDoc(doc(db, "inquiries", id));
        toast.success("Inquiry deleted successfully.");
      }
    } catch (err) {
      console.error("Deletion error:", err);
      toast.error("Failed to delete the entry.");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleSaveRates = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingRates(true);

    const balePriceNum = parseInt(ratesBalePrice);
    const seedPriceNum = parseInt(ratesSeedPrice);

    if (isNaN(balePriceNum) || balePriceNum <= 0) {
      toast.error("Please enter a valid Cotton Bale price.");
      setIsUpdatingRates(false);
      return;
    }
    if (isNaN(seedPriceNum) || seedPriceNum <= 0) {
      toast.error("Please enter a valid Cotton Seed price.");
      setIsUpdatingRates(false);
      return;
    }

    try {
      await setDoc(doc(db, "settings", "rates"), {
        manualBalePrice: balePriceNum,
        manualSeedPrice: seedPriceNum,
        useManualRates,
        updatedAt: new Date().toISOString(),
      });
      toast.success("Industry rates updated successfully!");
    } catch (err) {
      console.error("Rates save error:", err);
      toast.error("Failed to update industry rates.");
    } finally {
      setIsUpdatingRates(false);
    }
  };

  // Search filtering
  const filteredBookings = bookings.filter((b) => {
    const query = searchQuery.toLowerCase();
    return (
      b.name.toLowerCase().includes(query) ||
      b.village.toLowerCase().includes(query) ||
      b.phone.includes(query) ||
      b.passId.toLowerCase().includes(query) ||
      b.vehicle.toLowerCase().includes(query)
    );
  });

  const filteredInquiries = inquiries.filter((i) => {
    const query = searchQuery.toLowerCase();
    return (
      i.name.toLowerCase().includes(query) ||
      i.email.toLowerCase().includes(query) ||
      i.message.toLowerCase().includes(query)
    );
  });

  // Calculate metrics
  const totalBookingsCount = bookings.length;
  const totalWeightQuintals = bookings.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
  const totalEstimatedPayout = bookings.reduce((sum, b) => sum + (b.estimatedValue || 0), 0);
  const totalInquiriesCount = inquiries.length;

  // Render Passcode Gate Overlay
  if (!isAuthorized) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background px-4 relative overflow-hidden font-sans select-none">
        {/* Background decorations */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <Card className="w-full max-w-[420px] bg-card/40 backdrop-blur-xl border border-border/60 rounded-3xl p-8 shadow-2xl relative z-10">
          <CardHeader className="text-center pb-6 space-y-2">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-amber-500 flex items-center justify-center shadow-lg mb-2">
              <Sprout className="h-6 w-6 text-white animate-pulse" />
            </div>
            <CardTitle className="text-xl font-extrabold tracking-tight text-white">
              Basaveshwara Control Desk
            </CardTitle>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Administrative credentials required to access live bookings and trade inquiries.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Enter Admin Passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="pl-11 pr-4 py-6 rounded-xl border-border/60 bg-secondary/20 focus-visible:ring-primary font-semibold tracking-wider placeholder:tracking-normal placeholder:font-normal"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full py-6 font-bold text-xs bg-primary text-primary-foreground rounded-xl flex items-center justify-center gap-2 hover:bg-primary/95 transition-all duration-200 border-0 shadow-lg cursor-pointer"
              >
                Authenticate Terminal <Unlock className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground pb-12">
      {/* HEADER BAR */}
      <header className="sticky top-0 z-40 bg-background/60 backdrop-blur-md border-b border-border/40 select-none">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-amber-500 flex items-center justify-center shadow-lg">
              <Sprout className="h-5.5 w-5.5 text-white" />
            </div>
            <div>
              <span className="text-sm font-extrabold tracking-tight text-white block leading-none">BASAVESHWARA</span>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 block">Admin Control Desk</span>
            </div>
          </div>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-1.5 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
          >
            Lock Panel <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      {/* DASHBOARD CONTENT */}
      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-8">
        
        {/* STATS TILES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card/30 backdrop-blur-md border border-border/50 hover:border-emerald-500/20 transition-all duration-300">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
                <Ticket className="h-5.5 w-5.5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Bookings</p>
                <h4 className="text-2xl font-black text-white mt-1">{totalBookingsCount}</h4>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/30 backdrop-blur-md border border-border/50 hover:border-emerald-500/20 transition-all duration-300">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
                <Truck className="h-5.5 w-5.5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Est. Kapas Intake</p>
                <h4 className="text-2xl font-black text-white mt-1">{totalWeightQuintals.toLocaleString()} Qtl</h4>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/30 backdrop-blur-md border border-border/50 hover:border-emerald-500/20 transition-all duration-300">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3.5 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-400">
                <Coins className="h-5.5 w-5.5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Est. Payouts</p>
                <h4 className="text-2xl font-black text-emerald-400 mt-1">₹{totalEstimatedPayout.toLocaleString()}</h4>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/30 backdrop-blur-md border border-border/50 hover:border-emerald-500/20 transition-all duration-300">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3.5 bg-sky-500/10 rounded-2xl border border-sky-500/20 text-sky-400">
                <MessageSquare className="h-5.5 w-5.5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">B2B Inquiries</p>
                <h4 className="text-2xl font-black text-white mt-1">{totalInquiriesCount}</h4>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* WORKSPACE & VIEW TABLE */}
        <Card className="bg-card/20 backdrop-blur-md border border-border/40 rounded-3xl overflow-hidden shadow-xl">
          {/* CONTROL BAR */}
          <div className="p-6 border-b border-border/20 flex flex-col md:flex-row justify-between items-center gap-4 bg-secondary/10">
            {/* Navigation Tabs */}
            <div className="flex bg-secondary/50 p-1.5 rounded-2xl border border-border/20 w-full md:w-auto overflow-x-auto">
              <button
                onClick={() => { setActiveTab("bookings"); setSearchQuery(""); }}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 whitespace-nowrap ${
                  activeTab === "bookings"
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                <Ticket className="h-4 w-4" /> Scale Bookings
              </button>
              <button
                onClick={() => { setActiveTab("inquiries"); setSearchQuery(""); }}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 whitespace-nowrap ${
                  activeTab === "inquiries"
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                <MessageSquare className="h-4 w-4" /> B2B Inquiries
              </button>
              <button
                onClick={() => { setActiveTab("rates"); setSearchQuery(""); }}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 whitespace-nowrap ${
                  activeTab === "rates"
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-white"
                }`}
              >
                <TrendingUp className="h-4 w-4" /> Rates Manager
              </button>
            </div>

            {/* Search Input */}
            {activeTab !== "rates" && (
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={activeTab === "bookings" ? "Search farmer name, village..." : "Search sender name, email..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-5 bg-card/50 border-border/50 text-xs rounded-xl focus-visible:ring-primary"
                />
              </div>
            )}
          </div>

          {/* TABLE CONTAINER */}
          <div className="overflow-x-auto min-h-[400px]">
            {activeTab === "bookings" ? (
              filteredBookings.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/10 hover:bg-transparent">
                      <TableHead className="font-extrabold text-[10px] uppercase text-muted-foreground py-4 pl-6">Pass ID</TableHead>
                      <TableHead className="font-extrabold text-[10px] uppercase text-muted-foreground py-4">Farmer Name</TableHead>
                      <TableHead className="font-extrabold text-[10px] uppercase text-muted-foreground py-4">Village</TableHead>
                      <TableHead className="font-extrabold text-[10px] uppercase text-muted-foreground py-4">Scheduled Date</TableHead>
                      <TableHead className="font-extrabold text-[10px] uppercase text-muted-foreground py-4">Kapas Load</TableHead>
                      <TableHead className="font-extrabold text-[10px] uppercase text-muted-foreground py-4 text-right">Est. Value</TableHead>
                      <TableHead className="font-extrabold text-[10px] uppercase text-muted-foreground py-4 text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((b) => (
                      <TableRow key={b.id} className="border-b border-border/10 hover:bg-secondary/10 transition-colors">
                        <TableCell className="py-4 pl-6 font-bold text-white font-mono">{b.passId}</TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-white/95">{b.name}</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-semibold">
                              <Phone className="h-3 w-3 text-primary" /> {b.phone}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 font-semibold text-muted-foreground">{b.village}</TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-white/95">{b.dateStr}</span>
                            <span className="text-[10px] text-primary font-bold flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {b.timeSlotLabel}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 font-bold text-white">
                          <div className="flex flex-col gap-0.5">
                            <span>{b.quantity} Quintals</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-semibold">
                              <Truck className="h-3 w-3 text-emerald-400" /> {b.vehicle}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 font-extrabold text-emerald-400 text-right">₹{b.estimatedValue.toLocaleString()}</TableCell>
                        <TableCell className="py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              onClick={() => setSelectedBookingForPass(b)}
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white"
                              title="Print Gate Pass"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => setDeleteTarget({ id: b.id, type: "booking" })}
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-white"
                              title="Delete Slot"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Ticket className="h-10 w-10 text-border" />
                  <span className="text-xs font-semibold">No scale bookings found matching your search.</span>
                </div>
              )
            ) : activeTab === "inquiries" ? (
              filteredInquiries.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/10 hover:bg-transparent">
                      <TableHead className="font-extrabold text-[10px] uppercase text-muted-foreground py-4 pl-6">Sender Details</TableHead>
                      <TableHead className="font-extrabold text-[10px] uppercase text-muted-foreground py-4">Inquiry Message</TableHead>
                      <TableHead className="font-extrabold text-[10px] uppercase text-muted-foreground py-4">Submitted Date</TableHead>
                      <TableHead className="font-extrabold text-[10px] uppercase text-muted-foreground py-4 text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInquiries.map((i) => (
                      <TableRow key={i.id} className="border-b border-border/10 hover:bg-secondary/10 transition-colors">
                        <TableCell className="py-4 pl-6">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-white/95">{i.name}</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-semibold">
                              <Mail className="h-3 w-3 text-primary" /> {i.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 max-w-md">
                          <p className="text-xs text-muted-foreground leading-relaxed font-medium whitespace-pre-line bg-secondary/20 border border-border/20 rounded-xl p-3 select-text">
                            {i.message}
                          </p>
                        </TableCell>
                        <TableCell className="py-4 font-semibold text-muted-foreground">
                          {i.timestamp ? new Date(i.timestamp).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short"
                          }) : "N/A"}
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <Button
                            onClick={() => setDeleteTarget({ id: i.id, type: "inquiry" })}
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-white"
                            title="Delete Inquiry"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Mail className="h-10 w-10 text-border" />
                  <span className="text-xs font-semibold">No trade inquiries found matching your search.</span>
                </div>
              )
            ) : (
              /* Rates Manager UI Form */
              <div className="p-8 max-w-4xl mx-auto space-y-8 select-none">
                <div className="border-b border-border/20 pb-4">
                  <h4 className="text-lg font-bold text-white">Industry Pricing Control</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Directly control the buying and selling rates displayed across the Basaveshwara portals.
                  </p>
                </div>

                <form onSubmit={handleSaveRates} className="space-y-6">
                  {/* Toggle Mode */}
                  <div className="bg-secondary/20 border border-border/30 rounded-2xl p-5 flex items-center justify-between">
                    <div className="space-y-1 pr-4">
                      <label htmlFor="useManualRatesToggle" className="text-sm font-bold text-white block cursor-pointer">Manual Rates Override</label>
                      <span className="text-[11px] text-muted-foreground block leading-normal">
                        Enable this to freeze rates on the homepage to your manual entry below. If disabled, the site displays real-time fluctuating market rates.
                      </span>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="useManualRatesToggle"
                        checked={useManualRates}
                        onChange={(e) => setUseManualRates(e.target.checked)}
                        className="h-5 w-5 rounded border-border bg-card text-primary focus:ring-primary cursor-pointer accent-primary"
                      />
                    </div>
                  </div>

                  {/* Pricing Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-widest">
                        Cotton Bale Price (INR / 170kg Bale)
                      </label>
                      <Input
                        type="number"
                        placeholder="e.g. 62000"
                        value={ratesBalePrice}
                        onChange={(e) => setRatesBalePrice(e.target.value)}
                        className="py-6 rounded-xl border-border/60 bg-secondary/15 focus-visible:ring-primary font-bold text-white"
                        required
                        disabled={isUpdatingRates}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-widest">
                        Premium Seed Price (INR / 100kg Quintal)
                      </label>
                      <Input
                        type="number"
                        placeholder="e.g. 3200"
                        value={ratesSeedPrice}
                        onChange={(e) => setRatesSeedPrice(e.target.value)}
                        className="py-6 rounded-xl border-border/60 bg-secondary/15 focus-visible:ring-primary font-bold text-white"
                        required
                        disabled={isUpdatingRates}
                      />
                    </div>
                  </div>

                  {/* PREVIEW CONTAINER */}
                  <div className="border border-border/30 rounded-2xl p-6 bg-card/10 space-y-4">
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-primary" /> Live Website Preview
                    </h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-secondary/10 border border-border/20 rounded-xl p-4">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">Cotton Bales (Selling)</span>
                        <span className="text-lg font-black text-white mt-1 block">
                          ₹{ratesBalePrice ? Number(ratesBalePrice).toLocaleString() : "0"}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-0.5 block">per 170kg Bale</span>
                      </div>

                      <div className="bg-secondary/10 border border-border/20 rounded-xl p-4">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">Cotton Seeds (Selling)</span>
                        <span className="text-lg font-black text-white mt-1 block">
                          ₹{ratesSeedPrice ? Number(ratesSeedPrice).toLocaleString() : "0"}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-0.5 block">per 100kg Quintal</span>
                      </div>

                      <div className="bg-secondary/10 border border-emerald-500/20 rounded-xl p-4 bg-emerald-500/5">
                        <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">Kapas Buying Rate (Farmer)</span>
                        <span className="text-lg font-black text-emerald-400 mt-1 block">
                          ₹{
                            (() => {
                              const bp = parseFloat(ratesBalePrice);
                              const sp = parseFloat(ratesSeedPrice);
                              if (isNaN(bp) || isNaN(sp)) return "0";
                              const lintPerKg = bp / 1.734;
                              const seedPerKg = sp / 100;
                              return Math.round((34 * lintPerKg) + (64 * seedPerKg) - 600).toLocaleString();
                            })()
                          }
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-0.5 block">per 100kg Quintal (Derived)</span>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isUpdatingRates}
                    className="py-6 font-bold text-xs bg-primary text-primary-foreground rounded-xl flex items-center justify-center gap-2 hover:bg-primary/95 transition-all duration-200 border-0 shadow-lg cursor-pointer w-full"
                  >
                    {isUpdatingRates ? "Updating Rates Database..." : "Save & Update Website Rates"}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </Card>
      </main>

      {/* CONFIRM DELETE DIALOG */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-[360px] bg-card border border-border/60 rounded-3xl p-6 shadow-2xl">
          <DialogHeader className="text-center pb-2">
            <DialogTitle className="text-lg font-bold text-white">Confirm Deletion</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Are you sure you want to permanently delete this {deleteTarget?.type}? This action is irreversible and will update Firestore instantly.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 border-t border-border/20 pt-4 mt-2">
            <Button
              onClick={() => setDeleteTarget(null)}
              variant="outline"
              className="flex-1 rounded-xl py-5 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="flex-1 rounded-xl py-5 text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/95"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PRINT GATE PASS DIALOG */}
      {selectedBookingForPass && (
        <Dialog open={!!selectedBookingForPass} onOpenChange={(open) => !open && setSelectedBookingForPass(null)}>
          <DialogContent className="max-w-[450px] bg-card border border-border/60 rounded-3xl p-6 shadow-2xl text-foreground font-sans overflow-hidden">
            {/* Style Inject for Printing */}
            <style jsx global>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                #printable-gate-pass, #printable-gate-pass * {
                  visibility: visible;
                }
                #printable-gate-pass {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  margin: 0;
                  padding: 10px;
                  box-shadow: none;
                  border: none;
                  background: white !important;
                  color: black !important;
                }
                #printable-gate-pass * {
                  color: black !important;
                }
                .print-hidden-button {
                  display: none !important;
                }
              }
            `}</style>

            <div id="printable-gate-pass">
              <DialogHeader className="text-center pb-4 border-b border-border/20">
                <DialogTitle className="text-xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
                  <Ticket className="h-5 w-5 text-primary" /> Basaveshwara Gate Pass
                </DialogTitle>
                <DialogDescription className="text-xs font-medium text-muted-foreground">
                  Ginning Factory Intake Gate Pass
                </DialogDescription>
              </DialogHeader>

              {/* Pass Contents */}
              <div className="py-5 space-y-4 text-xs select-text">
                {/* Receipt details */}
                <div className="flex justify-between items-center bg-secondary/40 border border-border/30 rounded-xl px-4 py-3">
                  <div>
                    <span className="text-[9px] uppercase font-extrabold text-muted-foreground tracking-wider block">Gate Pass ID</span>
                    <span className="text-sm font-black text-white">{selectedBookingForPass.passId}</span>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded text-[10px] font-bold">
                    ACTIVE PASS
                  </Badge>
                </div>

                {/* Grid data */}
                <div className="grid grid-cols-2 gap-y-3.5 gap-x-4">
                  <div>
                    <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-widest block mb-0.5">Farmer Name</span>
                    <span className="font-bold text-white/95">{selectedBookingForPass.name}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-widest block mb-0.5">Contact</span>
                    <span className="font-bold text-white/95">{selectedBookingForPass.phone}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-widest block mb-0.5">Village / Origin</span>
                    <span className="font-bold text-white/95">{selectedBookingForPass.village}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-widest block mb-0.5">Vehicle Type</span>
                    <span className="font-bold text-white/95 flex items-center gap-1">
                      <Truck className="h-3.5 w-3.5 text-primary" /> {selectedBookingForPass.vehicle}
                    </span>
                  </div>
                  <div className="col-span-2 border-t border-border/20 pt-3">
                    <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-widest block mb-0.5">Scheduled Delivery</span>
                    <span className="font-bold text-white/95">{selectedBookingForPass.dateStr}</span>
                    <span className="block text-[10px] font-bold text-primary mt-0.5">{selectedBookingForPass.timeSlotLabel}</span>
                  </div>
                  <div className="col-span-2 border-t border-border/20 pt-3 flex justify-between items-baseline">
                    <div>
                      <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-widest block">Est. Raw Quantity</span>
                      <span className="text-sm font-extrabold text-white">{selectedBookingForPass.quantity} Quintals ({Number(selectedBookingForPass.quantity) * 100} kg)</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-widest block">Est. Market Payout</span>
                      <span className="text-base font-black text-emerald-400">₹{selectedBookingForPass.estimatedValue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Barcode representation */}
                <div className="border-t border-border/20 pt-4 flex flex-col items-center gap-1.5 pb-2">
                  <div className="h-10 flex gap-0.5 items-stretch bg-white/90 p-2 rounded w-full justify-center">
                    {[1,3,2,1,4,2,1,3,2,1,4,1,2,3,1,2,4,1,3,2,1,2,3,4,1,2,1,3,2,1].map((width, idx) => (
                      <div
                        key={idx}
                        className="bg-black"
                        style={{ width: `${width}px` }}
                      />
                    ))}
                  </div>
                  <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground/60">{selectedBookingForPass.passId}</span>
                </div>

                <div className="bg-secondary/20 rounded-xl p-3 border border-border/20 text-[10px] text-muted-foreground leading-relaxed">
                  <span className="font-bold text-white block mb-0.5 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Delivery Instructions:
                  </span>
                  Please arrive at least 15 minutes prior to your allocated slot. Bring a valid photo ID, farmer registration copy, and bank details for instant digital payout.
                </div>
              </div>
            </div>

            {/* Print and Save buttons */}
            <div className="flex gap-3 border-t border-border/20 pt-4 print-hidden-button">
              <Button
                onClick={() => setSelectedBookingForPass(null)}
                variant="outline"
                className="flex-1 rounded-xl py-5 text-xs font-semibold"
              >
                Close Pass
              </Button>
              <Button
                onClick={() => window.print()}
                className="flex-1 rounded-xl py-5 text-xs font-semibold bg-primary text-primary-foreground flex items-center justify-center gap-1.5 border-0 hover:bg-primary/95"
              >
                <Printer className="h-4 w-4" /> Print Pass
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
