/*
 * TodayAppointmentsCard.jsx  (refactored)
 * -------------------------------------------------------------------
 * Dashboard card that fetches today’s appointment count directly from
 * the API — no Zustand store.  Keeps its own local loading / error
 * state and re-fetches whenever the `date` prop changes.
 *
 * Author: Arkar Phyo
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import api from "@/services/api";

export default function TodayAppointmentsCard({ date }) {
  // ---------------------------------------------------------------------
  // Resolve target date (yyyy-mm-dd)
  // ---------------------------------------------------------------------
  const targetDate = date || new Date().toISOString().split("T")[0];

  // ---------------------------------------------------------------------
  // Local state: count / loading / error
  // ---------------------------------------------------------------------
  const [count,   setCount]   = useState(null); // number | null
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null); // string | null

  // ---------------------------------------------------------------------
  // Fetch count whenever date changes
  // ---------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    const fetchCount = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/ab/count/${targetDate}`);
        if (!cancelled) setCount(res.data?.count ?? 0);
      } catch (err) {
        if (!cancelled) {
          const msg = err?.response?.data?.message || err.message || "Failed to fetch count";
          setError(msg);
          setCount(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCount();
    return () => {
      cancelled = true; // prevent state updates after unmount
    };
  }, [targetDate]);

  const isLoading = loading || count == null;
  const linkHref  = `/appointments?date=${targetDate}`;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
        <CardDescription>{targetDate}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-3xl font-bold">{isLoading ? "--" : count}</span>
          <div className="rounded-full bg-primary/10 p-2">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
        </div>
        {/* Static 100% progress bar to match design */}
        <Progress value={100} className="mt-4 h-2" />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </CardContent>

      <CardFooter className="pt-1">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="w-full justify-between"
          disabled={isLoading || !!error}
        >
          <Link to={linkHref}>
            <span>View Schedule</span>
            <Clock className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}