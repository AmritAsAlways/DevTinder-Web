import React, { useState, useMemo } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { addUser } from "../utils/userSlice";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/constants";
import { removeFeed } from "../utils/feedSlice";
import { passwordRules } from "../utils/passwordRules";

const cleanServerError = (raw) => {
  const message =
    typeof raw === "string"
      ? raw
      : raw == null
        ? ""
        : JSON.stringify(raw);

  if (/^\s*<(?:!DOCTYPE|html)/i.test(message)) {
    return "Something went wrong on the server. Please try again.";
  }

  return message
    .replace(/^some error occured\s*/i, "")
    .replace(/^something went wrong\s*/i, "")
    .trim();
};

const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const fieldLabels = {
  firstName: "First name",
  lastName: "Last name",
  emailId: "Email",
  password: "Password",
  age: "Age",
  server: "Error",
};

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [emailId, setEmailId] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [age, setAge] = useState("");

  const [isLoginForm, setIsLoginForm] = useState(true);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const fieldErrors = useMemo(() => {
    const errors = {};

    if (!emailId) {
      errors.emailId = "Email is required.";
    } else if (!isValidEmail(emailId)) {
      errors.emailId = "Enter a valid email address.";
    }

    if (!password) {
      errors.password = "Password is required.";
    } else if (!isLoginForm) {
      const failedRules = passwordRules.filter(
        (rule) => !rule.test(password)
      );

      if (failedRules.length) {
        errors.password = "Password doesn't meet the requirements below.";
      }
    }

    if (!isLoginForm) {
      const first = firstName.trim();
      const last = lastName.trim();

      if (!first) {
        errors.firstName = "First name is required.";
      } else if (first.length < 3 || first.length > 100) {
        errors.firstName = "First name must be 3-100 characters.";
      }

      if (!last) {
        errors.lastName = "Last name is required.";
      } else if (last.length < 2 || last.length > 100) {
        errors.lastName = "Last name must be 2-100 characters.";
      }

      if (!age) {
        errors.age = "Age is required.";
      } else if (
        !Number.isInteger(Number(age)) ||
        Number(age) < 18 ||
        Number(age) > 100
      ) {
        errors.age = "Age must be between 18 and 100.";
      }
    }

    return errors;
  }, [isLoginForm, firstName, lastName, emailId, password, age]);

  const hasFieldErrors = Object.keys(fieldErrors).length > 0;

  const allErrors = {
    ...(attemptedSubmit ? fieldErrors : {}),
    ...(serverError ? { server: serverError } : {}),
  };

  const isInvalid = (field) =>
    attemptedSubmit && Boolean(fieldErrors[field]);

  const handleSignUp = async () => {
    setServerError("");
    setLoading(true);

    try {
      const res = await axios.post(
        BASE_URL + "/signup",
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          emailId,
          password,
          age: Number(age),
        },
        { withCredentials: true }
      );

      dispatch(addUser(res.data.data));
      navigate("/profile");
    } catch (err) {
      setServerError(
        cleanServerError(err?.response?.data) || "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setServerError("");
    setLoading(true);

    try {
      const res = await axios.post(
        BASE_URL + "/login",
        { emailId, password },
        { withCredentials: true }
      );

      dispatch(removeFeed());
      dispatch(addUser(res.data));
      navigate("/");
    } catch (err) {
      setServerError(
        cleanServerError(err?.response?.data) || "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (loading) return;

    setAttemptedSubmit(true);

    if (hasFieldErrors) return;

    isLoginForm ? handleLogin() : handleSignUp();
  };

  const toggleForm = () => {
    setServerError("");
    setAttemptedSubmit(false);
    setAge("");
    setIsLoginForm((value) => !value);
  };

  return (
    <div className="flex justify-center my-20 px-4">
      <div className="card bg-white border-2 border-black w-96 shadow-xl">
        <form className="card-body" onSubmit={handleSubmit} noValidate>
          <h2 className="card-title justify-center text-2xl">
            {isLoginForm ? "Login" : "Sign Up"}
          </h2>

          {!isLoginForm && (
            <>
              <fieldset className="fieldset my-2">
                <legend className="fieldset-legend">First Name</legend>
                <input
                  type="text"
                  value={firstName}
                  className={`input input-bordered w-full ${
                    isInvalid("firstName") ? "input-error" : ""
                  }`}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </fieldset>

              <fieldset className="fieldset my-2">
                <legend className="fieldset-legend">Last Name</legend>
                <input
                  type="text"
                  value={lastName}
                  className={`input input-bordered w-full ${
                    isInvalid("lastName") ? "input-error" : ""
                  }`}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </fieldset>

              <fieldset className="fieldset my-2">
                <legend className="fieldset-legend">Age</legend>
                <input
                  type="number"
                  placeholder="Enter your age"
                  min="18"
                  max="100"
                  value={age}
                  className={`input input-bordered w-full ${
                    isInvalid("age") ? "input-error" : ""
                  }`}
                  onChange={(e) => setAge(e.target.value)}
                />
              </fieldset>
            </>
          )}

          <fieldset className="fieldset my-2">
            <legend className="fieldset-legend">Email Id</legend>
            <input
              type="email"
              required
              value={emailId}
              className={`input ${
                isInvalid("emailId") ? "input-error" : ""
              }`}
              onChange={(e) => setEmailId(e.target.value)}
            />
          </fieldset>

          <fieldset className="fieldset my-2">
            <legend className="fieldset-legend">Password</legend>
            <input
              type="password"
              required
              value={password}
              className={`input ${
                isInvalid("password") ? "input-error" : ""
              }`}
              onChange={(e) => setPassword(e.target.value)}
            />
          </fieldset>

          {!isLoginForm && password && (
            <ul className="text-xs -mt-1 mb-1 space-y-0.5">
              {passwordRules.map((rule) => {
                const passed = rule.test(password);

                return (
                  <li
                    key={rule.label}
                    className={`flex items-center gap-1.5 ${
                      passed ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    <span>{passed ? "✓" : "○"}</span>
                    {rule.label}
                  </li>
                );
              })}
            </ul>
          )}

          {Object.keys(allErrors).length > 0 && (
            <div className="error-window relative flex gap-2.5 rounded-xl border-2 border-black bg-red-600 text-white px-3.5 py-3 mt-1 shadow-md">
              <svg
                className="w-5 h-5 mt-0.5 flex-shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.72-1.36 3.486 0l6.516 11.59c.75 1.334-.213 2.98-1.742 2.98H3.483c-1.53 0-2.492-1.646-1.743-2.98l6.517-11.59zM11 14a1 1 0 11-2 0 1 1 0 012 0zm-.25-6.75a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5z"
                  clipRule="evenodd"
                />
              </svg>

              <div className="flex-1 min-w-0 text-sm">
                {Object.keys(allErrors).length > 1 ? (
                  <>
                    <p className="font-bold mb-1.5">
                      Please fix the following
                    </p>
                    <ul className="space-y-1">
                      {Object.entries(allErrors).map(([field, message]) => (
                        <li key={field} className="flex gap-1.5 leading-snug">
                          <span className="mt-[7px] w-1 h-1 rounded-full bg-white/80 flex-shrink-0" />
                          <span className="break-words">
                            <span className="font-semibold">
                              {fieldLabels[field] || field}:
                            </span>{" "}
                            {message}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="leading-snug break-words">
                    {Object.values(allErrors)[0]}
                  </p>
                )}
              </div>

              {serverError && (
                <button
                  type="button"
                  aria-label="Dismiss"
                  className="flex-shrink-0 self-start text-white/80 hover:text-white text-base leading-none px-1 -mr-1 -mt-0.5"
                  onClick={() => setServerError("")}
                >
                  ✕
                </button>
              )}
            </div>
          )}

          <div className="card-actions justify-center m-2">
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : isLoginForm ? (
                "Login"
              ) : (
                "Sign Up"
              )}
            </button>
          </div>

          <p
            className="m-auto cursor-pointer py-2 text-sm text-gray-600 hover:text-primary transition"
            onClick={toggleForm}
          >
            {isLoginForm
              ? "New User? Signup Here"
              : "Existing User? Login Here"}
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
