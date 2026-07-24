export type AuthActionState = {
  fieldErrors?: Partial<
    Record<"email" | "password" | "passwordConfirmation", string>
  >;
  message: string;
  status: "idle" | "error" | "success";
};

type Credentials = {
  email: string;
  password: string;
};

type PasswordConfirmation = {
  password: string;
  passwordConfirmation: string;
};

type ValidationResult<T> =
  | { data: T; success: true }
  | { state: AuthActionState; success: false };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MINIMUM_PASSWORD_LENGTH = 8;
const MAXIMUM_PASSWORD_LENGTH = 128;

export const INITIAL_AUTH_ACTION_STATE: AuthActionState = {
  message: "",
  status: "idle",
};

function readFormValue(
  formData: FormData,
  name: string,
  trim = true,
): string {
  const value = formData.get(name);

  if (typeof value !== "string") {
    return "";
  }

  return trim ? value.trim() : value;
}

export function validateEmail(
  formData: FormData,
): ValidationResult<{ email: string }> {
  const email = readFormValue(formData, "email").toLowerCase();

  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return {
      state: {
        fieldErrors: { email: "Enter a valid email address." },
        message: "Check the highlighted field.",
        status: "error",
      },
      success: false,
    };
  }

  return { data: { email }, success: true };
}

export function validateCredentials(
  formData: FormData,
): ValidationResult<Credentials> {
  const emailResult = validateEmail(formData);
  const password = readFormValue(formData, "password", false);
  const fieldErrors: AuthActionState["fieldErrors"] = {};

  if (!emailResult.success) {
    fieldErrors.email = emailResult.state.fieldErrors?.email;
  }

  if (!password) {
    fieldErrors.password = "Enter your password.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      state: {
        fieldErrors,
        message: "Check the highlighted fields.",
        status: "error",
      },
      success: false,
    };
  }

  return {
    data: {
      email: emailResult.success ? emailResult.data.email : "",
      password,
    },
    success: true,
  };
}

export function validatePasswordConfirmation(
  formData: FormData,
): ValidationResult<PasswordConfirmation> {
  const password = readFormValue(formData, "password", false);
  const passwordConfirmation = readFormValue(
    formData,
    "passwordConfirmation",
    false,
  );
  const fieldErrors: AuthActionState["fieldErrors"] = {};

  if (
    password.length < MINIMUM_PASSWORD_LENGTH ||
    password.length > MAXIMUM_PASSWORD_LENGTH
  ) {
    fieldErrors.password = `Use ${MINIMUM_PASSWORD_LENGTH} to ${MAXIMUM_PASSWORD_LENGTH} characters.`;
  }

  if (!passwordConfirmation) {
    fieldErrors.passwordConfirmation = "Confirm your password.";
  } else if (password !== passwordConfirmation) {
    fieldErrors.passwordConfirmation = "Passwords do not match.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      state: {
        fieldErrors,
        message: "Check the highlighted fields.",
        status: "error",
      },
      success: false,
    };
  }

  return {
    data: { password, passwordConfirmation },
    success: true,
  };
}
