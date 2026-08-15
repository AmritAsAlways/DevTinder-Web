import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useEffect } from "react";
import { connect, useDispatch, useSelector } from "react-redux";
import { addConnections } from "../utils/connectionSlice";
import { Link } from "react-router-dom";

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

  if (connections.length === 0)
    return (
      <div className="flex justify-center items-center my-20">
        <h1 className="text-3xl font-bold text-black">
          No Connections Found
        </h1>
      </div>
    );

  return (
    <div className="my-10 px-4">
      <h1 className="text-center text-black text-3xl font-bold mb-8 tracking-wide">
        Connections
      </h1>

      <div className="flex flex-col gap-5 max-w-2xl mx-auto">
        {connections.map((connection) => {
          const { _id, firstName, lastName, photoURL, age, gender, about, skills } =
            connection;

          return (
            <div
              key={_id}
              className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-5 rounded-2xl bg-white border-2 border-black shadow-md hover:shadow-xl hover:scale-[1.01] transition-all duration-200"
            >
              <img
                alt="photo"
                className="w-24 h-24 rounded-full object-cover ring ring-primary ring-offset-base-100 ring-offset-2 shrink-0"
                src={photoURL}
              />

              <div className="text-center sm:text-left flex-1 min-w-0">
                <h2 className="font-bold text-xl break-all">
                  {firstName + " " + lastName}
                </h2>
                {age && gender && (
                  <p className="text-sm text-gray-400 mb-1">
                    {age + " · " + gender}
                  </p>
                )}
                {about && (
                  <p className="text-sm text-gray-700 mb-2 break-all line-clamp-3">
                    {about}
                  </p>
                )}

                {skills?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-1.5 font-semibold">
                      Skills:
                    </p>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                      {skills.map((skill, i) => (
                        <span
                          key={i}
                          className="badge badge-primary badge-outline text-xs py-2.5 px-3 max-w-full truncate"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="shrink-0">
                <Link
                  to={"/chat/" + connection._id}
                  className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white border-none"
                >
                  Chat
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default Connections;
