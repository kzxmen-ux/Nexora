"use client";

import { useActionState } from "react";

import { acceptInvitationAction } from "../actions/invitations";
import type { InvitationActionState } from "../invitations/types";

const INITIAL_STATE: InvitationActionState = { status: "idle" };

export function InvitationAcceptanceForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(
    acceptInvitationAction,
    INITIAL_STATE,
  );

  return (
    <form action={formAction} className="mt-6">
      <input name="token" type="hidden" value={token} />
      {state.message ? (
        <p
          className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}
      <button
        className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Accepting…" : "Accept administrator invitation"}
      </button>
    </form>
  );
}
