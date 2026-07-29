import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useEffect } from "react";
import { connect, useDispatch, useSelector } from "react-redux";
import { addConnections } from "../utils/connectionSlice";

const Connections = () => {
  const connections = useSelector((store) => store.connections);
  const dispatch = useDispatch();
  const fetchConnections = async () => {
    try {
      const res = await axios.get(BASE_URL + "/user/connections", {
        withCredentials: true,
      });
      dispatch(addConnections(res.data.data));
    } catch (err) {
      // Handle Error Case
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  if (!connections) return;

  if (connections.length === 0) return <h1> No Connections Found</h1>;

  return (
  <div className="max-w-5xl mx-auto px-4 py-10">
    <h1 className="text-4xl font-bold text-center mb-10">
      🤝 My Connections
    </h1>

    <div className="space-y-6">
      {connections.map((connection) => {
        const { _id, firstName, lastName, photoURL, age, gender, about } =
          connection;

        return (
          <div
            key={_id}
            className="card bg-base-300 shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            <div className="card-body flex flex-col md:flex-row items-center gap-6">

              {/* Profile Image */}
              <img
                src={photoURL}
                alt={firstName}
                className="w-28 h-28 rounded-full object-cover border-4 border-primary"
              />

              {/* User Info */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold">
                  {firstName} {lastName}
                </h2>

                {age && gender && (
                  <div className="badge badge-outline badge-primary mt-2">
                    {age} years • {gender}
                  </div>
                )}

                <p className="mt-4 text-base-content/80">
                  {about}
                </p>
              </div>

              {/* Status */}
              <div>
                <button className="btn btn-success btn-outline">
                  ✓ Connected
                </button>
              </div>

            </div>
          </div>
        );
      })}
    </div>
  </div>
);
};
export default Connections;
