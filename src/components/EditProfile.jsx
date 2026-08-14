import { useState } from "react";
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
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const [showToast, setShowToast] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("photo", file);

    setUploading(true);
    setError("");
    try {
      const res = await axios.post(BASE_URL + "/profile/upload-photo", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      // only update local preview state — DB/Redux update happens on Save
      setPhotoURL(res?.data?.photoURL);
    } catch (err) {
      setError(err.response?.data || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    //Clear Errors
    setError("");
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
          skills: skills
            .split(",")
            .map((skill) => skill.trim())
            .filter((skill) => skill !== ""),
        },
        { withCredentials: true },
      );
      dispatch(addUser(res?.data?.data));
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    } catch (err) {
      setError(err.response.data);
    }
  };

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
                  className="input input-bordered input-sm w-full"
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
                  className="input input-bordered input-sm w-full"
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
                    value={age}
                    className="input input-bordered input-sm w-full"
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
              <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">
                About
              </p>
              <fieldset className="fieldset w-full">
                <textarea
                  className="textarea textarea-bordered w-full h-24"
                  placeholder="Tell us about yourself..."
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                ></textarea>
                <div className="label py-1">
                  <span className="label-text-alt text-gray-500">Optional</span>
                </div>
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
                className="input input-bordered input-sm w-full"
                onChange={(e) => setSkills(e.target.value)}
                placeholder="React, Node.js, MongoDB..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate each skill with a comma
              </p>
            </div>

            {error && (
              <p className="text-red-500 text-sm mt-3 break-words">
                {typeof error === "string" ? error : JSON.stringify(error)}
              </p>
            )}

            <div className="card-actions justify-center mt-5">
              <button
                className="btn btn-primary w-full"
                onClick={saveProfile}
              >
                Save Profile
              </button>
            </div>
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
              skills: skills
                .split(",")
                .map((skill) => skill.trim())
                .filter((skill) => skill !== ""),
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
