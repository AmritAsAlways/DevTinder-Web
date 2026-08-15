import React, { useState } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { addUser } from "../utils/userSlice";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/constants";
import { removeFeed } from "../utils/feedSlice";

const Login = () => {
  const navigate = useNavigate();
  const [emailId, setEmailId] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoginForm, setIsLoginForm] = useState(true);
  const dispatch = useDispatch();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(
        BASE_URL + "/signup",
        { firstName, lastName, emailId, password },
        { withCredentials: true },
      );
      dispatch(addUser(res.data.data));
      navigate("/profile");
    } catch (err) {
      setError(err?.response?.data || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(
        BASE_URL + "/login",
        { emailId, password },
        { withCredentials: true },
      );
      dispatch(removeFeed());
      dispatch(addUser(res.data));
      navigate("/");
    } catch (err) {
      setError(err?.response?.data || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading) return;
    isLoginForm ? handleLogin() : handleSignUp();
  };

  const toggleForm = () => {
    setError("");
    setIsLoginForm((value) => !value);
  };

  return (
    <div className="flex justify-center my-20 px-4">
      <div className="card bg-base-300 w-96 shadow-xl">
        <form className="card-body" onSubmit={handleSubmit}>
          <h2 className="card-title justify-center text-2xl">
            {isLoginForm ? "Login" : "Sign Up"}
          </h2>

          {!isLoginForm && (
            <>
              <label className="form-control w-full max-w-xs my-2">
                <div className="label">
                  <legend className="fieldset-legend">First Name</legend>
                </div>
                <input
                  type="text"
                  required
                  value={firstName}
                  className="input input-bordered w-full max-w-xs"
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </label>

              <label className="form-control w-full max-w-xs my-2">
                <div className="label">
                  <legend className="fieldset-legend">Last Name</legend>
                </div>
                <input
                  type="text"
                  value={lastName}
                  className="input input-bordered w-full max-w-xs"
                  onChange={(e) => setLastName(e.target.value)}
                />
              </label>
            </>
          )}

          <fieldset className="fieldset my-2">
            <legend className="fieldset-legend">Email Id</legend>
            <input
              type="email"
              required
              className="input"
              value={emailId}
              onChange={(e) => setEmailId(e.target.value)}
            />
          </fieldset>

          <fieldset className="fieldset my-2">
            <legend className="fieldset-legend">Password</legend>
            <input
              type="password"
              required
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </fieldset>

          {error && (
            <p className="text-red-500 text-sm break-all">
              {typeof error === "string" ? error : JSON.stringify(error)}
            </p>
          )}

          <div className="card-actions justify-center m-2">
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : isLoginForm ? (
                "Login"
              ) : (
                "Sign Up"
              )}
            </button>
          </div>

          <p
            className="m-auto cursor-pointer py-2 text-sm text-gray-400 hover:text-primary transition"
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
