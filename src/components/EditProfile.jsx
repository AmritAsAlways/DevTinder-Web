import { useState, useMemo } from "react";
import UserCard from "./UserCard";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useDispatch } from "react-redux";
import { addUser } from "../utils/userSlice";

const EditProfile = ({ user }) => {
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [photoURL, setPhotoURL] = useState(user.photoURL);
  const [age, setAge] = useState(user.age || "");
  const [gender, setGender] = useState(user.gender || "");
  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const [about, setAbout] = useState(user.about || "");
  const [skills, setSkills] = useState(user.skills?.join(", ") || "");
  const [saveError, setSaveError] = useState(""); // error returned by the server on submit (POST /profile/edit)
  const [photoUploadError, setPhotoUploadError] = useState(""); // error returned by the server on photo upload
  const dispatch = useDispatch();
  const [showToast, setShowToast] = useState(false);
  const [uploading, setUploading] = useState(false);

  // the skills input is a comma-separated string in the UI, but the backend
  // expects an actual array — this same parsed array is reused for both
  // validation below and the payload sent on save
  const skillsArray = skills
    .split(",")
    .map((skill) => skill.trim())
    .filter((skill) => skill !== "");

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

    // lastName: only checked if present, but must be 3–100 chars if so
    if (lastName && (lastName.length < 3 || lastName.length > 100)) {
      errors.lastName = `Last name must be 3–100 characters (currently ${lastName.length}).`;
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

    // skills: capped at 10 entries total (not a length-per-skill limit)
    if (skillsArray.length > 10) {
      errors.skills = `You can list at most 10 skills (currently ${skillsArray.length}).`;
    }

    // age: Mongoose schema requires a Number >= 18 (only if provided)
    if (age !== "" && age !== null && age !== undefined) {
      if (isNaN(Number(age))) {
        errors.age = "Age must be a number.";
      } else if (Number(age) < 18) {
        errors.age = "Age must be 18 or older.";
      }
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
  }, [firstName, lastName, about, photoURL, skillsArray.length, age, gender]);

  // combine the live field-validation errors with any server-side photo
  // upload error, so BOTH kinds show up in the same single panel and BOTH
  // are equally capable of hiding the Save button
  const allErrors = {
    ...fieldErrors,
    ...(photoUploadError ? { photo: photoUploadError } : {}),
  };
  const hasErrors = Object.keys(allErrors).length > 0;

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
      setPhotoUploadError(
        typeof message === "string" ? message : JSON.stringify(message),
      );
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    // safety net: even though the Save button is hidden while hasErrors is
    // true, don't let a save fire if this is somehow called anyway
    if (hasErrors) return;

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
      setSaveError(err.response.data);
    }
  };

  // small red helper text shown directly under a field when it's invalid
  const FieldError = ({ field }) =>
    allErrors[field] ? (
      <p className="text-error text-xs mt-1">{allErrors[field]}</p>
    ) : null;

  return (
    <>
      <div className="flex flex-col lg:flex-row justify-center items-start gap-8 my-10 px-4 max-w-5xl mx-auto">
        {/* ---------- Form Card ---------- */}
        <div className="card bg-base-300 shadow-xl w-full lg:w-[420px]">
          <div className="card-body">
            <h2 className="card-title justify-center text-2xl mb-2">
              Edit Profile
            </h2>

            {/* Photo section */}
            <div className="flex flex-col items-center gap-2 py-2 border-b border-base-100/40 mb-4">
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
              {uploading && (
                <span className="text-xs text-gray-400">Uploading...</span>
              )}
              {/* photo upload failure (bad file type, too large, server error, etc.) */}
              <FieldError field="photo" />
              {/* the current photoURL itself not being a valid link */}
              <FieldError field="photoURL" />
            </div>

            {/* Basic info */}
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
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
                <FieldError field="firstName" />
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
                <FieldError field="lastName" />
              </label>

              <div className="flex gap-3">
                <label className="form-control flex-1">
                  <div className="label py-1">
                    <span className="label-text">Age</span>
                  </div>
                  <input
                    type="number"
                    min="18"
                    value={age}
                    className={`input input-bordered input-sm w-full ${
                      allErrors.age ? "input-error" : ""
                    }`}
                    onChange={(e) => setAge(e.target.value)}
                  />
                  <FieldError field="age" />
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
                  <FieldError field="gender" />
                </label>
              </div>
            </div>

            {/* About */}
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">
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
                <FieldError field="about" />
              </fieldset>
            </div>

            {/* Skills */}
            <div className="mt-2">
              <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">
                Skills
              </p>
              <input
                type="text"
                value={skills}
                className={`input input-bordered input-sm w-full ${
                  allErrors.skills ? "input-error" : ""
                }`}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="React, Node.js, MongoDB..."
              />
              <p
                className={`text-xs mt-1 ${
                  skillsArray.length > 10 ? "text-error" : "text-gray-500"
                }`}
              >
                Separate each skill with a comma — {skillsArray.length}/10 skills
              </p>
              <FieldError field="skills" />
            </div>

            {saveError && (
              <p className="text-red-500 text-sm mt-3 break-words">
                {typeof saveError === "string"
                  ? saveError
                  : JSON.stringify(saveError)}
              </p>
            )}

            {/* ---------- Validation summary + Save button area ---------- */}
            {/* While ANY field (including a failed photo upload) is
                invalid, the Save button is replaced entirely by an error
                panel listing every current problem — the button only
                reappears once every error clears. */}
            {hasErrors ? (
              <div className="alert alert-error flex-col items-start mt-5 text-sm">
                <p className="font-bold mb-1">
                  Can't save — fix the following before continuing:
                </p>
                <ul className="list-disc list-inside space-y-1 w-full">
                  {Object.entries(allErrors).map(([field, message]) => (
                    <li key={field} className="break-words">
                      <span className="font-semibold capitalize">
                        {field}:
                      </span>{" "}
                      {message}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="card-actions justify-center mt-5">
                <button
                  className="btn btn-primary w-full"
                  onClick={saveProfile}
                >
                  Save Profile
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ---------- Live Preview ---------- */}
        <div className="w-full lg:w-auto flex flex-col items-center gap-3 lg:sticky lg:top-10">
          <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold self-center lg:self-start">
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
          <div className="alert alert-success">
            <span>Profile saved successfully.</span>
          </div>
        </div>
      )}
    </>
  );
};
export default EditProfile;
