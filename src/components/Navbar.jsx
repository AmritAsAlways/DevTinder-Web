import axios from "axios";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/constants";
import { removeUser } from "../utils/userSlice";
//using link we added the functionality then when we click on the devtinder it takes us to the
//"/" route and if we click on profilebutton in the profile it takes us to the "/profile" page

const Navbar = () => {
  const user = useSelector((store) => store.user); //this function is used to subscribe to the store
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post(BASE_URL + "/logout", {}, { withCredentials: true }); //run logic of the logout i.e clear cookies
      dispatch(removeUser()); //remove user from the redux store
      return navigate("/login"); //redirect it to login page
    } catch (err) {
      //error logic may be redirected to the err page
    }
  };

  return (
    <div>
      <div className="navbar bg-base-300 shadow-sm">
        <div className="flex-1">
          <Link to={user ? "/" : "/login"} className="btn btn-ghost text-xl">
            👩‍💻 DevTinder
          </Link>
        </div>
        {user && (
          <div className="flex items-center gap-2">
            <p className="px-4">Welcome, {user.firstName}</p>

            <div className="dropdown dropdown-end mx-10">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle avatar"
              >
                <div className="w-10 rounded-full">
                  <img alt="user photo" src={user.photoURL} />
                </div>
              </div>

              <ul
                tabIndex={-1}
                className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
              >
                <li>
                  <Link to="/profile" className="justify-between">
                    Profile
                    <span className="badge">New</span>
                  </Link>
                </li>
                <li>
                  <a>Settings</a>
                </li>
                <li>
                  <a onClick={handleLogout}>Logout</a>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
