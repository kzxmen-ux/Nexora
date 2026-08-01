import { LandingIcon } from "./landing-icon";

type ProductConversationPreviewProps = {
  bookingConfirmed: string;
  clientLabel: string;
  clientMessage: string;
  exampleDisclaimer: string;
  plannedExperienceLabel: string;
  productMessage: string;
  serviceLabel: string;
  timeLabel: string;
};

export function ProductConversationPreview({
  bookingConfirmed,
  clientLabel,
  clientMessage,
  exampleDisclaimer,
  plannedExperienceLabel,
  productMessage,
  serviceLabel,
  timeLabel,
}: ProductConversationPreviewProps) {
  return (
    <div className="relative mx-auto w-full max-w-xl lg:mx-0">
      <div
        aria-hidden="true"
        className="absolute -inset-5 -z-10 rounded-[2.5rem] bg-indigo-100/60 blur-2xl"
      />
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.32)]">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-5 py-4">
          <div className="flex items-center gap-2" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-rose-300" />
            <span className="size-2.5 rounded-full bg-amber-300" />
            <span className="size-2.5 rounded-full bg-emerald-300" />
          </div>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-700">
            {plannedExperienceLabel}
          </span>
        </div>

        <div className="space-y-5 p-5 sm:p-7">
          <div className="flex justify-end">
            <div className="max-w-[88%] rounded-2xl rounded-br-md bg-slate-100 px-4 py-3.5 text-sm leading-6 text-slate-700">
              <p className="mb-1 text-xs font-semibold text-slate-500">
                {clientLabel}
              </p>
              {clientMessage}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-indigo-600 text-xs font-bold text-white">
              O
            </span>
            <div className="max-w-[88%] rounded-2xl rounded-tl-md border border-indigo-100 bg-indigo-50/70 px-4 py-3.5 text-sm leading-6 text-slate-700">
              <p className="mb-1 text-xs font-semibold text-indigo-700">
                Orqelio
              </p>
              {productMessage}
            </div>
          </div>

          <div className="ml-0 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 sm:ml-12">
            <div className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-600 text-white">
                <LandingIcon className="size-5" name="check" />
              </span>
              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  {bookingConfirmed}
                </p>
                <p className="mt-1 text-xs text-emerald-800">
                  {serviceLabel} · {timeLabel}
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="border-t border-slate-100 bg-white px-5 py-3 text-center text-[11px] leading-5 text-slate-500 sm:px-7">
          {exampleDisclaimer}
        </p>
      </div>
    </div>
  );
}
