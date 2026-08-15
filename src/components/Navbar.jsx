import axios from "axios";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/constants";
import { removeUser } from "../utils/userSlice";
import { removeFeed } from "../utils/feedSlice";
import { removeConnections } from "../utils/connectionSlice";
import { clearRequests } from "../utils/requestSlice";
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
      dispatch(removeFeed());
      dispatch(removeConnections());
      dispatch(clearRequests());
      return navigate("/login"); //redirect it to login page
    } catch (err) {
      //error logic may be redirected to the err page
    }
  };

  return (
    <div>
      <div className="navbar bg-black text-white border-b-2 border-white shadow-sm">
        <div className="flex-1">
          <Link to={user ? "/" : "/login"} className="btn bg-linear-to-r from-[#FD2B7B] to-[#FF7158] border-none text-2xl text-white shadow-none">
            👩‍💻 DevTinder
          </Link>
        </div>
        {user && (
          <div className="flex items-center gap-2">
            <p className="px-4 text-white text-lg">Welcome, {user.firstName}</p>

            <div className="dropdown dropdown-end mx-10">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle avatar"
              >
                <div className="w-10 rounded-full border-2 border-green-500">
                  <img alt="user photo" src={user.photoURL} />
                </div>
              </div>

              <ul
                tabIndex={-1}
                className="menu menu-sm dropdown-content bg-black text-white border-2 border-white rounded-box z-1 mt-3 w-52 p-2 shadow text-base"
              >
                <li>
                  <Link to="/profile" className="justify-between hover:bg-white hover:text-black transition-colors">
                    Profile
                  </Link>
                </li>
                <li>
                  <Link to="/connections" className="hover:bg-white hover:text-black transition-colors">Connections</Link>
                </li>
                <li>
                  <Link to="/requests" className="hover:bg-white hover:text-black transition-colors">Requests</Link>
                </li>
                <li>
                  <a onClick={handleLogout} className="hover:bg-white hover:text-black transition-colors">Logout</a>
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
