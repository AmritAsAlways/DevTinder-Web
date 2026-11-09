import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { addRequests, removeRequest } from "../utils/requestSlice";
import { useEffect, useState } from "react";

const Requests = () => {
  const requests = useSelector((store) => store.requests);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  const reviewRequest = async (status, _id) => {
    try {
      await axios.post(
        BASE_URL + "/request/review/" + status + "/" + _id,
        {},
        { withCredentials: true }
      );
      dispatch(removeRequest(_id));
    } catch (err) {
      console.error("Failed to review request:", err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await axios.get(BASE_URL + "/user/requests/received", {
        withCredentials: true,
      });
      dispatch(addRequests(res.data.data));
    } catch (err) {
      console.error("Failed to fetch requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [dispatch]);

  // Handle loading state
  if (loading && !requests) {
    return (
      <div className="flex justify-center items-center my-20">
        <h1 className="text-xl font-semibold text-black">Loading requests...</h1>
      </div>
    );
  }

  // Handle empty requests list
  if (!requests || requests.length === 0) {
    return (
      <div className="flex justify-center items-center my-20">
        <h1 className="text-3xl font-bold text-black">No Requests Found</h1>
      </div>
    );
  }

  return (
    <div className="my-10 px-4">
      <h1 className="text-center text-black text-3xl font-bold mb-8 tracking-wide">
        Connection Requests
      </h1>

      <div className="flex flex-col gap-5 max-w-2xl mx-auto">
        {requests.map((request) => {
          // FIXED: Added `skills` to destructuring here 👇
          const { _id, firstName, lastName, photoURL, age, gender, about, skills } =
            request.fromUserId || {};

          return (
            <div
              key={request._id}
              className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-5 rounded-2xl bg-white border-2 border-black shadow-md hover:shadow-xl hover:scale-[1.01] transition-all duration-200"
            >
              <div>
                <img
                  alt="photo"
                  className="w-24 h-24 rounded-full object-cover ring ring-primary ring-offset-base-100 ring-offset-2 shrink-0"
                  src={photoURL}
                />
              </div>
              <div className="text-center sm:text-left flex-1 min-w-0">
                <h2 className="font-bold text-xl break-words">
                  {firstName + " " + lastName}
                </h2>
                {age && gender && (
                  <p className="text-sm text-gray-400 mb-1">
                    {age + " · " + gender}
                  </p>
                )}
                <p className="text-sm text-gray-700 mb-2 break-words line-clamp-3">
                  {about}
                </p>
                {skills?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs uppercase tracking-wide text-gray-400 mb-1.5 font-semibold">
                      Skills:
                    </p>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                      {skills.map((skill, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 max-w-full truncate"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-white/80 shrink-0" />
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex sm:flex-col gap-3 shrink-0">
                {/* Reject — rose/red gradient pill */}
                <button
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-red-600 shadow-md hover:shadow-lg hover:shadow-rose-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                  onClick={() => reviewRequest("rejected", request._id)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                  Reject
                </button>

                {/* Accept — emerald/teal gradient pill */}
                <button
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-md hover:shadow-lg hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                  onClick={() => reviewRequest("accepted", request._id)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Accept
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Requests;