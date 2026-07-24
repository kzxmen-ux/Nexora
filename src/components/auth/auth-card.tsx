import type { ReactNode } from "react";

type AuthCardProps = {
  children: ReactNode;
  description: string;
  footer?: ReactNode;
  title: string;
};

export function AuthCard({
  children,
  description,
  footer,
  title,
}: AuthCardProps) {
  return (
    <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-950/5 sm:p-9">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          {title}
        </h1>
        <p className="mt-3 leading-7 text-slate-600">{description}</p>
      </div>

      <div className="mt-8">{children}</div>

      {footer ? (
        <div className="mt-7 border-t border-slate-100 pt-6 text-center text-sm text-slate-600">
          {footer}
        </div>
      ) : null}
    </section>
  );
}
