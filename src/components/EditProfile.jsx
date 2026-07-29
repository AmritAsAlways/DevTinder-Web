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
  const [age, setAge] = useState(user.age);
  const [gender, setGender] = useState(user.gender);
  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const [about, setAbout] = useState(user.about);
  const [skills, setSkills] = useState(user.skills?.join(", ") || "");
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const [showToast, setShowToast] = useState(false);

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
      <div className="flex justify-center my-10">
        <div className="flex justify-center mx-10">
          <div className="card bg-base-300 w-96 shadow-xl">
            <div className="card-body">
              <h2 className="card-title justify-center">Edit Profile</h2>
              <div>
                <label className="form-control w-full max-w-xs my-2">
                  <div className="label">
                    <span className="label-text">First Name:</span>
                  </div>
                  <input
                    type="text"
                    value={firstName}
                    className="input input-bordered w-full max-w-xs"
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </label>
                <label className="form-control w-full max-w-xs my-2">
                  <label className="form-control w-full max-w-xs my-2">
                    <div className="label">
                      <span className="label-text">Last Name:</span>
                    </div>
                    <input
                      type="text"
                      value={lastName}
                      className="input input-bordered w-full max-w-xs"
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </label>
                  <div className="label">
                    <span className="label-text">Photo URL :</span>
                  </div>
                  <input
                    type="text"
                    value={photoURL}
                    className="input input-bordered w-full max-w-xs"
                    onChange={(e) => setPhotoURL(e.target.value)}
                  />
                </label>
                <label className="form-control w-full max-w-xs my-2">
                  <div className="label">
                    <span className="label-text">Age:</span>
                  </div>
                  <input
                    type="text"
                    value={age}
                    className="input input-bordered w-full max-w-xs"
                    onChange={(e) => setAge(e.target.value)}
                  />
                </label>
                <label className="form-control w-full max-w-xs my-2">
                  <div className="label">
                    <span className="label-text">Gender</span>
                  </div>

                  <div
                    className={`dropdown w-full ${isGenderOpen ? "dropdown-open" : ""}`}
                  >
                    <div
                      tabIndex={0}
                      role="button"
                      className="btn btn-outline w-full justify-between"
                      onClick={() => setIsGenderOpen(true)}
                      onBlur={() => setIsGenderOpen(false)}
                    >
                      {gender || "Select Gender"}
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
                <fieldset className="fieldset w-full max-w-xs my-2">
                  <legend className="fieldset-legend">About</legend>
                  <textarea
                    className="textarea h-24"
                    placeholder="Tell us about yourself..."
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                  ></textarea>
                  <div className="label">Optional</div>
                </fieldset>
                <label className="form-control w-full max-w-xs my-2">
                  <div className="label">
                    <span className="label-text">Skills:</span>
                  </div>
                  <input
                    type="text"
                    value={skills}
                    className="input input-bordered w-full max-w-xs"
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder=""
                  />
                </label>
              </div>
              <p className="text-red-500">{error}</p>
              <div className="card-actions justify-center m-2">
                <button className="btn btn-primary" onClick={saveProfile}>
                  Save Profile
                </button>
              </div>
            </div>
          </div>
        </div>
        <UserCard
          user={{ firstName, lastName, photoURL, age, gender, about }}
        />
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
