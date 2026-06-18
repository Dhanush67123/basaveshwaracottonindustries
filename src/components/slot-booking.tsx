"use client";

import React, { useState } from "react";
import { useLiveRates } from "./live-rates-provider";
import { CalendarIcon, Clock, CheckCircle2, Ticket, Printer, ArrowRight, Truck, User, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

interface GatePassDetails {
  passId: string;
  name: string;
  phone: string;
  village: string;
  quantity: string;
  vehicle: string;
  dateStr: string;
  timeSlotLabel: string;
  estimatedValue: number;
}

export const SlotBooking: React.FC = () => {
  const { rawCottonBuyRate } = useLiveRates();

  // Form States
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [timeSlot, setTimeSlot] = useState<"morning" | "afternoon" | "evening" | "">("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [village, setVillage] = useState("");
  const [quantity, setQuantity] = useState("");
  const [vehicle, setVehicle] = useState("tractor");

  // Gate Pass State
  const [showGatePass, setShowGatePass] = useState(false);
  const [gatePassDetails, setGatePassDetails] = useState<GatePassDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simulated slot remaining capacity
  const [slotCapacities, setSlotCapacities] = useState({
    morning: 3,
    afternoon: 0,
    evening: 7,
  });

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      setSlotCapacities({
        morning: Math.floor(Math.random() * 8),
        afternoon: Math.floor(Math.random() * 4),
        evening: Math.floor(Math.random() * 10),
      });
      setTimeSlot(""); // Reset selection
    }
  };


  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      toast.error("Please select a delivery date.");
      return;
    }
    if (!timeSlot) {
      toast.error("Please select a time slot.");
      return;
    }
    if (!name || !phone || !village || !quantity) {
      toast.error("Please fill in all details.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Booking slot and generating Gate Pass...");

    try {
      // Generate dynamic gate pass
      const passId = `WG-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
      const estimatedValue = Math.round(Number(quantity) * rawCottonBuyRate);
      const formattedDate = date ? date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "";

      const timeSlotLabel = {
        morning: "Morning Shift (08:00 AM - 12:00 PM)",
        afternoon: "Afternoon Shift (12:00 PM - 04:00 PM)",
        evening: "Evening Shift (04:00 PM - 08:00 PM)",
      }[timeSlot];

      const details = {
        passId,
        name,
        phone,
        village,
        quantity,
        vehicle: vehicle.toUpperCase(),
        dateStr: formattedDate,
        timeSlotLabel,
        estimatedValue,
        createdAt: new Date().toISOString(),
      };

      // Save to Firebase Firestore if configured
      if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        await addDoc(collection(db, "bookings"), details);
      } else {
        console.warn("Firebase config missing. Gate Pass created locally.");
      }

      setGatePassDetails(details);
      setShowGatePass(true);
      toast.success("Delivery Slot booked successfully! Gate Pass generated.", {
        id: toastId,
      });

      // Subtract from capacity
      setSlotCapacities(prev => ({
        ...prev,
        [timeSlot]: Math.max(0, prev[timeSlot as keyof typeof prev] - 1)
      }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to book slot. Please try again.", {
        id: toastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-card/40 backdrop-blur-md border border-border/60 rounded-2xl p-6 relative overflow-hidden shadow-2xl transition-all duration-300 hover:border-primary/30" id="slot-booking">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-2.5 bg-secondary/80 rounded-xl border border-border/40 text-primary">
          <Clock className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white leading-tight">Book Delivery Slot</h3>
          <p className="text-muted-foreground text-xs font-medium">Skip the long queue at the ginning factory gates</p>
        </div>
      </div>

      <form onSubmit={handleBooking} className="space-y-4 relative z-10">
        {/* Date and Time selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-widest">
              Delivery Date
            </label>
            <Popover>
              <PopoverTrigger
                className="w-full justify-start text-left font-semibold text-xs py-3 px-4 rounded-xl border border-border/60 bg-secondary/20 hover:bg-secondary/40 text-white flex items-center cursor-pointer select-none h-11"
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                {date ? date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : <span>Pick a date</span>}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card border-border shadow-2xl" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateSelect}
                  disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))}
                  className="bg-card"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-widest">
              Vehicle Type
            </label>
            <div className="grid grid-cols-3 gap-2 h-10">
              {["tractor", "truck", "auto"].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVehicle(v)}
                  className={`flex flex-col items-center justify-center rounded-xl border text-[10px] font-bold capitalize transition-all duration-200 ${
                    vehicle === v
                      ? "bg-primary/10 border-primary/45 text-white"
                      : "bg-secondary/20 border-border/50 text-muted-foreground hover:bg-secondary/80 hover:text-white"
                  }`}
                >
                  <Truck className="h-3.5 w-3.5 mb-0.5 text-primary" />
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Time slots */}
        <div>
          <label className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-widest block mb-2">
            Available Time Slots
          </label>
          <div className="grid grid-cols-3 gap-2">
            {/* Morning */}
            <button
              type="button"
              disabled={slotCapacities.morning === 0}
              onClick={() => setTimeSlot("morning")}
              className={`p-2.5 text-center rounded-xl border flex flex-col justify-between h-18 transition-all duration-200 ${
                timeSlot === "morning"
                  ? "bg-primary/15 border-primary/50 text-white"
                  : slotCapacities.morning === 0
                  ? "bg-red-500/5 border-red-500/10 text-muted-foreground opacity-50 cursor-not-allowed"
                  : "bg-secondary/20 border-border/50 text-muted-foreground hover:bg-secondary/40 hover:text-white"
              }`}
            >
              <span className="text-[10px] font-bold block">Morning</span>
              <span className="text-[9px] font-medium block text-muted-foreground mt-0.5">08:00 - 12:00</span>
              <Badge variant="outline" className={`mt-1.5 px-1 py-0.5 text-[8px] border-0 mx-auto font-bold ${
                slotCapacities.morning === 0
                  ? "bg-red-500/10 text-red-400"
                  : "bg-emerald-500/10 text-emerald-400"
              }`}>
                {slotCapacities.morning === 0 ? "Full" : `${slotCapacities.morning} Left`}
              </Badge>
            </button>

            {/* Afternoon */}
            <button
              type="button"
              disabled={slotCapacities.afternoon === 0}
              onClick={() => setTimeSlot("afternoon")}
              className={`p-2.5 text-center rounded-xl border flex flex-col justify-between h-18 transition-all duration-200 ${
                timeSlot === "afternoon"
                  ? "bg-primary/15 border-primary/50 text-white"
                  : slotCapacities.afternoon === 0
                  ? "bg-red-500/5 border-red-500/10 text-muted-foreground opacity-50 cursor-not-allowed"
                  : "bg-secondary/20 border-border/50 text-muted-foreground hover:bg-secondary/40 hover:text-white"
              }`}
            >
              <span className="text-[10px] font-bold block">Afternoon</span>
              <span className="text-[9px] font-medium block text-muted-foreground mt-0.5">12:00 - 16:00</span>
              <Badge variant="outline" className={`mt-1.5 px-1 py-0.5 text-[8px] border-0 mx-auto font-bold ${
                slotCapacities.afternoon === 0
                  ? "bg-red-500/10 text-red-400"
                  : "bg-emerald-500/10 text-emerald-400"
              }`}>
                {slotCapacities.afternoon === 0 ? "Full" : `${slotCapacities.afternoon} Left`}
              </Badge>
            </button>

            {/* Evening */}
            <button
              type="button"
              disabled={slotCapacities.evening === 0}
              onClick={() => setTimeSlot("evening")}
              className={`p-2.5 text-center rounded-xl border flex flex-col justify-between h-18 transition-all duration-200 ${
                timeSlot === "evening"
                  ? "bg-primary/15 border-primary/50 text-white"
                  : slotCapacities.evening === 0
                  ? "bg-red-500/5 border-red-500/10 text-muted-foreground opacity-50 cursor-not-allowed"
                  : "bg-secondary/20 border-border/50 text-muted-foreground hover:bg-secondary/40 hover:text-white"
              }`}
            >
              <span className="text-[10px] font-bold block">Evening</span>
              <span className="text-[9px] font-medium block text-muted-foreground mt-0.5">16:00 - 20:00</span>
              <Badge variant="outline" className={`mt-1.5 px-1 py-0.5 text-[8px] border-0 mx-auto font-bold ${
                slotCapacities.evening === 0
                  ? "bg-red-500/10 text-red-400"
                  : "bg-emerald-500/10 text-emerald-400"
              }`}>
                {slotCapacities.evening === 0 ? "Full" : `${slotCapacities.evening} Left`}
              </Badge>
            </button>
          </div>
        </div>

        {/* Farmer details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-widest flex items-center gap-1">
              <User className="h-3 w-3 text-primary" /> Farmer Full Name
            </label>
            <Input
              type="text"
              placeholder="e.g. Ramesh Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="py-5 rounded-xl bg-secondary/20 border-border/60 text-xs font-semibold placeholder:text-muted-foreground/60 text-white focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary/80"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-widest flex items-center gap-1">
              Contact Mobile
            </label>
            <Input
              type="tel"
              placeholder="e.g. +91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="py-5 rounded-xl bg-secondary/20 border-border/60 text-xs font-semibold placeholder:text-muted-foreground/60 text-white focus-visible:ring-primary focus-visible:ring-offset-0"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-widest flex items-center gap-1">
              <MapPin className="h-3 w-3 text-primary" /> Farmer&apos;s Village
            </label>
            <Input
              type="text"
              placeholder="e.g. Adilabad Region"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              className="py-5 rounded-xl bg-secondary/20 border-border/60 text-xs font-semibold placeholder:text-muted-foreground/60 text-white focus-visible:ring-primary focus-visible:ring-offset-0"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-widest">
              Estimated Cotton Quantity (Quintals)
            </label>
            <Input
              type="number"
              placeholder="e.g. 50"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="py-5 rounded-xl bg-secondary/20 border-border/60 text-xs font-semibold placeholder:text-muted-foreground/60 text-white focus-visible:ring-primary focus-visible:ring-offset-0"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-4 py-6 font-bold text-xs bg-primary text-primary-foreground rounded-xl flex items-center justify-center gap-2 hover:bg-primary/95 transition-all duration-200 border-0 active:scale-98 cursor-pointer shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Booking Slot..." : "Confirm & Issue Gate Pass"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      {/* The Printable Digital Gate Pass modal! */}
      {gatePassDetails && (
        <Dialog open={showGatePass} onOpenChange={setShowGatePass}>
          <DialogContent className="max-w-[450px] bg-card border border-border/60 rounded-3xl p-6 shadow-2xl text-foreground font-sans overflow-hidden">
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
                  <span className="text-sm font-black text-white">{gatePassDetails.passId}</span>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded text-[10px] font-bold">
                  ACTIVE PASS
                </Badge>
              </div>

              {/* Grid data */}
              <div className="grid grid-cols-2 gap-y-3.5 gap-x-4">
                <div>
                  <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-widest block mb-0.5">Farmer Name</span>
                  <span className="font-bold text-white/95">{gatePassDetails.name}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-widest block mb-0.5">Contact</span>
                  <span className="font-bold text-white/95">{gatePassDetails.phone}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-widest block mb-0.5">Village / Origin</span>
                  <span className="font-bold text-white/95">{gatePassDetails.village}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-widest block mb-0.5">Vehicle Type</span>
                  <span className="font-bold text-white/95 flex items-center gap-1">
                    <Truck className="h-3.5 w-3.5 text-primary" /> {gatePassDetails.vehicle}
                  </span>
                </div>
                <div className="col-span-2 border-t border-border/20 pt-3">
                  <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-widest block mb-0.5">Scheduled Delivery</span>
                  <span className="font-bold text-white/95">{gatePassDetails.dateStr}</span>
                  <span className="block text-[10px] font-bold text-primary mt-0.5">{gatePassDetails.timeSlotLabel}</span>
                </div>
                <div className="col-span-2 border-t border-border/20 pt-3 flex justify-between items-baseline">
                  <div>
                    <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-widest block">Est. Raw Quantity</span>
                    <span className="text-sm font-extrabold text-white">{gatePassDetails.quantity} Quintals ({Number(gatePassDetails.quantity) * 100} kg)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-semibold text-muted-foreground tracking-widest block">Est. Market Payout</span>
                    <span className="text-base font-black text-emerald-400">₹{gatePassDetails.estimatedValue.toLocaleString()}</span>
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
                <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground/60">{gatePassDetails.passId}</span>
              </div>

              <div className="bg-secondary/20 rounded-xl p-3 border border-border/20 text-[10px] text-muted-foreground leading-relaxed">
                <span className="font-bold text-white block mb-0.5 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Delivery Instructions:
                </span>
                Please arrive at least 15 minutes prior to your allocated slot. Bring a valid photo ID, farmer registration copy, and bank details for instant digital payout.
              </div>
            </div>

            {/* Print and Save buttons */}
            <div className="flex gap-3 border-t border-border/20 pt-4">
              <Button
                onClick={() => setShowGatePass(false)}
                variant="outline"
                className="flex-1 rounded-xl py-5 text-xs font-semibold"
              >
                Close Pass
              </Button>
              <Button
                onClick={handlePrint}
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
};
