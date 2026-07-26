"use client";

import { useActionState } from "react";

import {
  removeAdministratorAction,
  revokeInvitationAction,
} from "../actions/invitations";
import type { InvitationActionState } from "../invitations/types";

const INITIAL_STATE: InvitationActionState = { status: "idle" };

type AdministratorActionButtonProps =
  | {
      invitationId: string;
      mode: "revoke";
      organizationId: string;
      userId?: never;
    }
  | {
      invitationId?: never;
      mode: "remove";
      organizationId: string;
      userId: string;
    };

export function AdministratorActionButton(
  props: AdministratorActionButtonProps,
) {
  const action =
    props.mode === "revoke"
      ? revokeInvitationAction
      : removeAdministratorAction;
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  return (
    <form action={formAction}>
      <input
        name="organizationId"
        type="hidden"
        value={props.organizationId}
      />
      {props.mode === "revoke" ? (
        <input name="invitationId" type="hidden" value={props.invitationId} />
      ) : (
        <input name="userId" type="hidden" value={props.userId} />
      )}
      <button
        className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending
          ? "Working…"
          : props.mode === "revoke"
            ? "Revoke"
            : "Remove"}
      </button>
      {state.message ? (
        <p
          className={
            state.status === "success"
              ? "mt-2 text-xs text-emerald-700"
              : "mt-2 text-xs text-rose-700"
          }
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
