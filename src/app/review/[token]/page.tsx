"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Star, Check, Waves, Loader2 } from "lucide-react";

interface ReviewData {
  id: string;
  status: string;
  rating: number | null;
  text: string | null;
  platform: string | null;
  completedAt: string | null;
  clientName: string;
  jobName: string;
}

export default function CustomerReviewPage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Form state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/review/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((d: ReviewData) => {
        setData(d);
        if (d.status === "COMPLETED") setSubmitted(true);
        if (d.rating) setRating(d.rating);
        if (d.text) setText(d.text);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [token]);

  const handleSubmit = async () => {
    if (rating < 1) return;
    setSubmitting(true);
    const res = await fetch(`/api/review/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, text }),
    });
    if (res.ok) {
      setSubmitted(true);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-cyan-50">
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading…</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-sky-50 via-white to-cyan-50 px-6 text-center">
        <Waves className="w-12 h-12 text-sky-300 mb-4" />
        <h1 className="text-2xl font-semibold text-slate-800 mb-2">
          Link not valid
        </h1>
        <p className="text-slate-500 max-w-md">
          This review link may have expired. Please contact Persistent Pools if you
          received this in error.
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-sky-50 via-white to-cyan-50 px-6">
        <div className="max-w-md w-full bg-white border border-sky-100 rounded-2xl p-8 md:p-10 text-center shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
            <Check className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-semibold text-slate-800 mb-2">
            Thank you, {data.clientName.split(" ")[0]}
          </h1>
          <p className="text-slate-500 mb-6">
            Your review has been submitted. It means the world to us — and to
            the next family considering Persistent Pools.
          </p>
          {rating > 0 && (
            <div className="flex justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={
                    n <= rating
                      ? "w-6 h-6 fill-yellow-400 text-yellow-400"
                      : "w-6 h-6 text-slate-200"
                  }
                />
              ))}
            </div>
          )}
          {rating === 5 && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-sm text-slate-500 mb-3">
                Loved working with us? Share your experience publicly:
              </p>
              <a
                href="#review-confirmation"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-sky-500 hover:bg-sky-600 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
              >
                Post on Google
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50 py-12 px-6">
      <div className="max-w-lg mx-auto">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-sm">
            PP
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Persistent Pools</p>
            <p className="text-[11px] text-slate-500 leading-tight">
              Pools &amp; Spas
            </p>
          </div>
        </div>

        <div className="bg-white border border-sky-100 rounded-2xl p-6 md:p-10 shadow-sm">
          <div className="text-center mb-8">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-600 font-medium mb-2">
              Thanks for being part of
            </p>
            <h1 className="text-3xl font-light text-slate-800">
              the <span className="font-semibold">Persistent Pools</span> family
            </h1>
            <p className="text-slate-500 text-sm mt-3 max-w-sm mx-auto">
              Hi {data.clientName.split(" ")[0]} — would you take a moment to
              share how the build went? Your feedback shapes our craft.
            </p>
          </div>

          {/* Rating picker */}
          <div className="space-y-2 mb-6">
            <label className="text-sm font-medium text-slate-600 block text-center">
              How would you rate your experience?
            </label>
            <div
              className="flex justify-center gap-1.5"
              onMouseLeave={() => setHoverRating(0)}
            >
              {[1, 2, 3, 4, 5].map((n) => {
                const filled = n <= (hoverRating || rating);
                return (
                  <button
                    key={n}
                    type="button"
                    onMouseEnter={() => setHoverRating(n)}
                    onClick={() => setRating(n)}
                    className="p-1 transition-transform hover:scale-110 cursor-pointer"
                    aria-label={`${n} stars`}
                  >
                    <Star
                      className={
                        filled
                          ? "w-9 h-9 fill-yellow-400 text-yellow-400 drop-shadow-sm"
                          : "w-9 h-9 text-slate-200 hover:text-yellow-200"
                      }
                      strokeWidth={1.5}
                    />
                  </button>
                );
              })}
            </div>
            {rating > 0 && (
              <p className="text-center text-xs text-slate-400 mt-1">
                {["", "Disappointed", "Could be better", "Good", "Great", "Outstanding"][rating]}
              </p>
            )}
          </div>

          {/* Text */}
          <div className="space-y-2 mb-6">
            <label className="text-sm font-medium text-slate-600 block">
              Tell us more <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What stood out about your experience? What could we improve?"
              rows={5}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all resize-none"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={rating < 1 || submitting}
            className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-all shadow-sm hover:shadow-md"
          >
            {submitting ? "Submitting…" : "Submit Review"}
          </button>

          <p className="text-[11px] text-center text-slate-400 mt-4">
            Your review for the{" "}
            <span className="font-medium text-slate-500">{data.jobName}</span>{" "}
            project.
          </p>
        </div>
      </div>
    </div>
  );
}
