import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
//using link we added the functionality then when we click on the devtinder it takes us to the 
//"/" route and if we click on profilebutton in the profile it takes us to the "/profile" page 


const Navbar = () => {
  const user = useSelector((store) => store.user); //this function is used to subscribe to the store

  return (
    <div>
      <div className="navbar bg-base-300 shadow-sm">
        <div className="flex-1">
          <Link to="/" className="btn btn-ghost text-xl">
            👩‍💻 DevTinder
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {user && <p className="px-4">Welcome, {user.firstName}</p>}
          <div className="dropdown dropdown-end mx-10">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-circle avatar"
            >
              {user && (
                <div className="w-10 rounded-full">
                  <img alt="user photo" src={user.photoURL} />
                </div>
              )}
            </div>
            <ul
              tabIndex="-1"
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
                <a>Logout</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
