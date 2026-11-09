import { useState, useMemo, useEffect } from "react";
import UserCard from "./userCard";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useDispatch } from "react-redux";
import { addUser } from "../utils/userSlice";
import { passwordRules } from "../utils/passwordRules";

// Cleans up the raw "Something went wrong ..." prefix the backend adds to
// every thrown error, so the UI shows just the actual message. Also guards
// against ever showing raw HTML (e.g. if an unhandled server error somehow
// slips through as an HTML error page) instead of a normal error string.
const cleanServerError = (raw) => {
  const message = typeof raw === "string" ? raw : JSON.stringify(raw);
  if (/^\s*<(!DOCTYPE|html)/i.test(message)) {
    return "Something went wrong on the server. Please try again.";
  }
  return message.replace(/^something went wrong\s*/i, "").trim();
};

const EditProfile = ({ user }) => {
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [photoURL, setPhotoURL] = useState(user.photoURL);
  const [age, setAge] = useState(user.age || "");
  const [gender, setGender] = useState(user.gender || "Others"); // default to Others when unset
  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const [about, setAbout] = useState(user.about || "");
  const [skills, setSkills] = useState(user.skills?.join(", ") || "");
  const [saveError, setSaveError] = useState(""); // error returned by the server on submit (POST /profile/edit)
  const [photoUploadError, setPhotoUploadError] = useState(""); // error returned by the server on photo upload
  const dispatch = useDispatch();
  const [showToast, setShowToast] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ---------------------------------------------------------------------
  // Change password — separate section, separate API call (PATCH /profile/password),
  // but errors are shown in the SAME unified error window as everything else.
  // ---------------------------------------------------------------------
  const [currPassword, setCurrPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordServerError, setPasswordServerError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showPasswordToast, setShowPasswordToast] = useState(false);

  // the skills input is a comma-separated string in the UI, but the backend
  // expects an actual array — this same parsed array is reused for both
  // validation below and the payload sent on save
  const skillsArray = skills
    .split(",")
    .map((skill) => skill.trim())
    .filter((skill) => skill !== "");

  // a fresh server-side save error is only relevant to the form state it was
  // returned for — clear it the moment the person changes anything, so it
  // doesn't linger and permanently clutter the error window
  useEffect(() => {
    setSaveError("");
  }, [firstName, lastName, photoURL, age, gender, about, skills]);

  // same idea for the password section — a stale server error shouldn't
  // linger once the person starts typing again
  useEffect(() => {
    setPasswordServerError("");
  }, [currPassword, newPassword]);

  // ---------------------------------------------------------------------
  // Live client-side validation — mirrors, field for field, the exact
  // rules the backend actually enforces (validators.js and the Mongoose
  // schema). Recomputed on every render via useMemo so it always reflects
  // the current form values as the user types.
  // ---------------------------------------------------------------------
  const fieldErrors = useMemo(() => {
    const errors = {};

    // firstName: required, 3–100 chars
    if (!firstName || firstName.trim().length === 0) {
      errors.firstName = "First name is required.";
    } else if (firstName.length < 3 || firstName.length > 100) {
      errors.firstName = `First name must be 3–100 characters (currently ${firstName.length}).`;
    }

    // lastName: required, 2–100 chars
    if (!lastName || lastName.trim().length === 0) {
      errors.lastName = "Last name is required.";
    } else if (lastName.length < 2 || lastName.length > 100) {
      errors.lastName = `Last name must be 2–100 characters (currently ${lastName.length}).`;
    }

    // about: capped at 500 CHARACTERS (not words) by the backend
    if (about && about.length > 500) {
      errors.about = `About must be 500 characters or fewer (currently ${about.length}).`;
    }

    // photoURL: must be a valid URL
    if (photoURL) {
      try {
        new URL(photoURL);
      } catch {
        errors.photoURL = "Photo must be a valid URL.";
      }
    }

    // skills: capped at 10 entries total, and each individual skill must
    // be 1–10 characters (the backend's isSkillsValid check)
    if (skillsArray.length > 10) {
      errors.skills = `You can list at most 10 skills (currently ${skillsArray.length}).`;
    } else {
      const oversizedSkills = skillsArray.filter((skill) => skill.length > 10);
      if (oversizedSkills.length > 0) {
        errors.skills = `Each skill must be 10 characters or fewer — too long: ${oversizedSkills.join(", ")}.`;
      }
    }

    // age: required, must be a number between 18 and 100
    if (age === "" || age === null || age === undefined) {
      errors.age = "Age is required.";
    } else if (isNaN(Number(age))) {
      errors.age = "Age must be a number.";
    } else if (Number(age) < 18) {
      errors.age = "Age must be 18 or older.";
    } else if (Number(age) > 100) {
      errors.age = "Age must be 100 or younger.";
    }

    // gender: only male/female/others allowed. The dropdown UI already
    // restricts this to valid options, but validated here too in case
    // that ever changes.
    if (
      gender &&
      !["male", "female", "others"].includes(gender.toLowerCase())
    ) {
      errors.gender = "Gender must be Male, Female, or Others.";
    }

    return errors;
  }, [firstName, lastName, about, photoURL, skillsArray, age, gender]);

  // Live validation for the change-password section — only kicks in once
  // the person has actually started filling it in, so the box doesn't show
  // "required" errors for a section nobody's touched yet.
  const passwordFieldErrors = useMemo(() => {
    const errors = {};
    if (!currPassword && !newPassword) return errors;

    if (!currPassword) {
      errors.currPassword = "Current password is required.";
    }

    if (!newPassword) {
      errors.newPassword = "New password is required.";
    } else {
      const failedRules = passwordRules.filter((rule) => !rule.test(newPassword));
      if (failedRules.length > 0) {
        errors.newPassword = "New password doesn't meet the requirements below.";
      }
    }

    return errors;
  }, [currPassword, newPassword]);

  // Errors that must be fixed before the profile can be saved — client-side
  // validation problems plus a failed photo upload (a stale/broken photo
  // shouldn't be saved silently).
  const blockingProfileErrors = {
    ...fieldErrors,
    ...(photoUploadError ? { photo: photoUploadError } : {}),
  };
  const hasBlockingProfileErrors = Object.keys(blockingProfileErrors).length > 0;

  // Errors that must be fixed before the password can be changed.
  const hasBlockingPasswordErrors = Object.keys(passwordFieldErrors).length > 0;

  // Everything shown in the single error window: blocking errors from both
  // sections, plus the last server response from either action (each clears
  // as soon as the person edits the relevant fields again).
  const allErrors = {
    ...blockingProfileErrors,
    ...passwordFieldErrors,
    ...(saveError ? { server: saveError } : {}),
    ...(passwordServerError ? { passwordServer: passwordServerError } : {}),
  };
  const hasErrors = Object.keys(allErrors).length > 0;
  const hasAnyBlockingErrors = hasBlockingProfileErrors || hasBlockingPasswordErrors;

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("photo", file);

    setUploading(true);
    setPhotoUploadError(""); // clear any previous upload error before retrying
    try {
      const res = await axios.post(BASE_URL + "/profile/upload-photo", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      // only update local preview state — DB/Redux update happens on Save
      setPhotoURL(res?.data?.photoURL);
    } catch (err) {
      const message = err.response?.data || "Upload failed";
      setPhotoUploadError(cleanServerError(message));
    } finally {
      setUploading(false);
    }
  };

  // Uses the default avatar, hosted on Cloudinary (the backend uploads the
  // stock photo there on first request and reuses the same asset after)
  // rather than pointing straight at the original external image URL.
  const handleUseDefaultPhoto = async () => {
    setUploading(true);
    setPhotoUploadError("");
    try {
      const res = await axios.get(BASE_URL + "/profile/default-photo", {
        withCredentials: true,
      });
      setPhotoURL(res?.data?.photoURL);
    } catch (err) {
      const message = err.response?.data || "Couldn't load the default photo";
      setPhotoUploadError(cleanServerError(message));
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    // safety net: even though the Save button is disabled while blocking
    // errors exist, don't let a save fire if this is somehow called anyway
    if (hasBlockingProfileErrors) return;

    setSaveError("");
    try {
      const res = await axios.patch(
        BASE_URL + "/profile/edit",
        {
          firstName,
          lastName,
          photoURL,
          age,
          gender,
          about,
          skills: skillsArray,
        },
        { withCredentials: true },
      );
      dispatch(addUser(res?.data?.data));
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    } catch (err) {
      setSaveError(cleanServerError(err.response?.data) || "Something went wrong");
    }
  };

  const changePassword = async () => {
    // same safety net as saveProfile
    if (hasBlockingPasswordErrors) return;

    setPasswordServerError("");
    setPasswordSaving(true);
    try {
      await axios.patch(
        BASE_URL + "/profile/password",
        { currpassword: currPassword, newpassword: newPassword },
        { withCredentials: true },
      );
      setCurrPassword("");
      setNewPassword("");
      setShowPasswordToast(true);
      setTimeout(() => {
        setShowPasswordToast(false);
      }, 3000);
    } catch (err) {
      setPasswordServerError(
        cleanServerError(err.response?.data) || "Something went wrong",
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  // field labels used in the single error window
  const fieldLabels = {
    firstName: "First name",
    lastName: "Last name",
    about: "About",
    photoURL: "Photo URL",
    skills: "Skills",
    age: "Age",
    gender: "Gender",
    photo: "Photo upload",
    server: "Save failed",
    currPassword: "Current password",
    newPassword: "New password",
    passwordServer: "Password update failed",
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row justify-center items-start gap-8 my-10 px-4 max-w-5xl mx-auto">
        {/* ---------- Form Card ---------- */}
        <div className="card bg-white border-2 border-black shadow-xl w-full lg:w-105">
          <div className="card-body">
            <h2 className="card-title justify-center text-2xl mb-2">
              Edit Profile
            </h2>

            {/* Photo section */}
            <div className="flex flex-col items-center gap-2 py-2 border-b-2 border-black mb-4">
              {photoURL && (
                <img
                  src={photoURL}
                  alt="preview"
                  className="w-24 h-24 rounded-full object-cover ring ring-primary ring-offset-base-300 ring-offset-2"
                />
              )}
              <input
                type="file"
                accept="image/*"
                className="file-input file-input-bordered file-input-sm w-full max-w-xs mt-2"
                onChange={handlePhotoChange}
                disabled={uploading}
              />
              <button
                type="button"
                className="btn btn-outline btn-xs mt-1"
                onClick={handleUseDefaultPhoto}
                disabled={uploading}
              >
                Use default photo
              </button>
              {uploading && (
                <span className="text-xs text-gray-400">Uploading...</span>
              )}
            </div>

            {/* Basic info */}
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-wide text-black font-semibold">
                Basic Info
              </p>

              <label className="form-control w-full">
                <div className="label py-1">
                  <span className="label-text">First Name</span>
                </div>
                <input
                  type="text"
                  value={firstName}
                  className={`input input-bordered input-sm w-full ${
                    allErrors.firstName ? "input-error" : ""
                  }`}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </label>

              <label className="form-control w-full">
                <div className="label py-1">
                  <span className="label-text">Last Name</span>
                </div>
                <input
                  type="text"
                  value={lastName}
                  className={`input input-bordered input-sm w-full ${
                    allErrors.lastName ? "input-error" : ""
                  }`}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </label>

              <div className="flex gap-3">
                <label className="form-control flex-1">
                  <div className="label py-1">
                    <span className="label-text">Age</span>
                  </div>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={age}
                    className={`input input-bordered input-sm w-full ${
                      allErrors.age ? "input-error" : ""
                    }`}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </label>

                <label className="form-control flex-1">
                  <div className="label py-1">
                    <span className="label-text">Gender</span>
                  </div>
                  <div
                    className={`dropdown w-full ${isGenderOpen ? "dropdown-open" : ""}`}
                  >
                    <div
                      tabIndex={0}
                      role="button"
                      className="btn btn-outline btn-sm w-full justify-between font-normal"
                      onClick={() => setIsGenderOpen(true)}
                      onBlur={() => setIsGenderOpen(false)}
                    >
                      {gender || "Select"}
                    </div>
                    <ul
                      tabIndex={0}
                      className="dropdown-content menu bg-base-100 rounded-box z-50 w-full p-2 shadow"
                    >
                      <li>
                        <button
                          onClick={() => {
                            setGender("Male");
                            setIsGenderOpen(false);
                          }}
                        >
                          Male
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => {
                            setGender("Female");
                            setIsGenderOpen(false);
                          }}
                        >
                          Female
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => {
                            setGender("Others");
                            setIsGenderOpen(false);
                          }}
                        >
                          Others
                        </button>
                      </li>
                    </ul>
                  </div>
                </label>
              </div>
            </div>

            {/* About */}
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wide text-black font-semibold mb-2">
                About
              </p>
              <fieldset className="fieldset w-full">
                <textarea
                  className={`textarea textarea-bordered w-full h-24 ${
                    allErrors.about ? "textarea-error" : ""
                  }`}
                  placeholder="Tell us about yourself..."
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                ></textarea>
                <div className="label py-1 flex justify-between">
                  <span className="label-text-alt text-gray-500">
                    Optional
                  </span>
                  {/* live character counter — turns red past the 500 limit */}
                  <span
                    className={`label-text-alt ${
                      about.length > 500 ? "text-error" : "text-gray-500"
                    }`}
                  >
                    {about.length}/500
                  </span>
                </div>
              </fieldset>
            </div>

            {/* Skills */}
            <div className="mt-2 rounded-xl p-3">
              <p className="text-xs uppercase tracking-wide  mb-1.5 font-semibold">
                Skills
              </p>
              <input
                type="text"
                value={skills}
                className={`input input-bordered input-sm w-full bg-white ${
                  allErrors.skills ? "input-error" : ""
                }`}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="React, Node.js, MongoDB..."
              />
              <p
                className={`text-xs mt-1 ${
                  skillsArray.length > 10 ? "text-errorr" : "text-gray-500"
                }`}
              >
                Separate each skill with a comma — {skillsArray.length}/10 skills
              </p>
            </div>

            {/* Change Password */}
            <div className="mt-4 pt-4 border-t-2 border-black">
              <p className="text-xs uppercase tracking-wide text-black font-semibold mb-2">
                Change Password
              </p>

              <label className="form-control w-full mb-2">
                <div className="label py-1">
                  <span className="label-text">Current Password</span>
                </div>
                <input
                  type="password"
                  value={currPassword}
                  className={`input input-bordered input-sm w-full ${
                    allErrors.currPassword ? "input-error" : ""
                  }`}
                  onChange={(e) => setCurrPassword(e.target.value)}
                />
              </label>

              <label className="form-control w-full">
                <div className="label py-1">
                  <span className="label-text">New Password</span>
                </div>
                <input
                  type="password"
                  value={newPassword}
                  className={`input input-bordered input-sm w-full ${
                    allErrors.newPassword ? "input-error" : ""
                  }`}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </label>

              {/* Live password requirements checklist — same rules used at signup */}
              {newPassword && (
                <ul className="text-xs mt-1 mb-1 space-y-0.5">
                  {passwordRules.map((rule) => {
                    const passed = rule.test(newPassword);
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

              <button
                type="button"
                className="btn btn-outline btn-sm w-full mt-2"
                onClick={changePassword}
                disabled={hasBlockingPasswordErrors || passwordSaving || (!currPassword && !newPassword)}
              >
                {passwordSaving ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  "Update Password"
                )}
              </button>
            </div>

            {/* ---------- Single unified error window ---------- */}
            {/* Every problem — live validation issues, a failed photo
                upload, and the last server-side save error — is listed
                together here, in one place, instead of scattered across
                separate boxes. */}
            {hasErrors && (
              <div className="error-window mt-5 w-full rounded-xl border-2 border-black bg-white shadow-md overflow-hidden">
                <div className="flex items-center gap-2 bg-red-600 px-4 py-2.5">
                  <svg
                    className="w-5 h-5 text-white flex-shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.72-1.36 3.486 0l6.516 11.59c.75 1.334-.213 2.98-1.742 2.98H3.483c-1.53 0-2.492-1.646-1.743-2.98l6.517-11.59zM11 14a1 1 0 11-2 0 1 1 0 012 0zm-.25-6.75a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="font-bold text-white text-sm">
                    {hasAnyBlockingErrors
                      ? "Can't save — fix the following"
                      : "There was a problem"}
                  </p>
                </div>
                <ul className="p-4 space-y-2">
                  {Object.entries(allErrors).map(([field, message]) => (
                    <li
                      key={field}
                      className="flex items-start gap-2 text-sm text-black break-words"
                    >
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-600 flex-shrink-0"></span>
                      <span className="flex-1">
                        <span className="font-semibold">
                          {fieldLabels[field] || field}:
                        </span>{" "}
                        {message}
                      </span>
                      {(field === "server" || field === "passwordServer") && (
                        <button
                          type="button"
                          aria-label="Dismiss"
                          className="flex-shrink-0 text-gray-400 hover:text-black text-sm leading-none px-1"
                          onClick={() =>
                            field === "server"
                              ? setSaveError("")
                              : setPasswordServerError("")
                          }
                        >
                          ✕
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="card-actions justify-center mt-5">
              <button
                className="btn btn-primary w-full"
                onClick={saveProfile}
                disabled={hasBlockingProfileErrors}
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>

        {/* ---------- Live Preview ---------- */}
        <div className="w-full lg:w-auto flex flex-col items-center gap-3 lg:sticky lg:top-10">
          <p className="text-xs uppercase tracking-wide text-black font-semibold self-center lg:self-start">
            Preview
          </p>
          <UserCard
            preview
            user={{
              firstName,
              lastName,
              photoURL,
              age,
              gender,
              about,
              skills: skillsArray,
            }}
          />
        </div>
      </div>

      {showToast && (
        <div className="toast toast-top toast-center">
          <div className="alert alert-success bg-green-600">
            <span>Profile saved successfully.</span>
          </div>
        </div>
      )}

      {showPasswordToast && (
        <div className="toast toast-top toast-center">
          <div className="alert alert-success bg-green-600">
            <span>Password updated successfully.</span>
          </div>
        </div>
      )}
    </>
  );
};
export default EditProfile;
