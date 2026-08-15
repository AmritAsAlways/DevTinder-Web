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
                          className="badge badge-primary badge-outline text-xs py-2.5 px-3 max-w-full truncate"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex sm:flex-col gap-2 shrink-0">
                <button
                  className="btn btn-outline btn-error btn-sm"
                  onClick={() => reviewRequest("rejected", request._id)}
                >
                  Reject
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => reviewRequest("accepted", request._id)}
                >
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