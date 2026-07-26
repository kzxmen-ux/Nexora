import Link from "next/link";

import type { Organization } from "../types";

type WorkspaceSection = "administrators" | "integrations" | "overview";

type OrganizationWorkspaceNavigationProps = {
  activeSection: WorkspaceSection;
  organization: Organization;
};

export function OrganizationWorkspaceNavigation({
  activeSection,
  organization,
}: OrganizationWorkspaceNavigationProps) {
  const basePath = `/app/organizations/${organization.id}`;
  const links = [
    { href: basePath, label: "Overview", section: "overview" as const },
    {
      href: `${basePath}/integrations`,
      label: "Integrations",
      section: "integrations" as const,
    },
    ...(organization.role === "owner"
      ? [
          {
            href: `${basePath}/administrators`,
            label: "Administrators",
            section: "administrators" as const,
          },
        ]
      : []),
  ];

  return (
    <header>
      <Link
        className="text-sm font-semibold text-indigo-700 hover:text-indigo-900"
        href="/app"
      >
        ← All organizations
      </Link>

      <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
            Organization workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {organization.name}
          </h1>
        </div>
        <span className="rounded-full bg-indigo-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-indigo-700">
          {organization.role}
        </span>
      </div>

      <nav
        aria-label="Organization workspace"
        className="mt-7 flex flex-wrap gap-2 border-b border-slate-200 pb-3"
      >
        {links.map((link) => {
          const active = link.section === activeSection;

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                  : "rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-white hover:text-slate-950"
              }
              href={link.href}
              key={link.section}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
