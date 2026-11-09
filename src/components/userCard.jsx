import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useDispatch } from "react-redux";
import { removeUserFromFeed } from "../utils/feedSlice";

const UserCard = ({ user, preview = false }) => {
  const { _id, firstName, lastName, photoURL, age, gender, about, skills } =
    user;
  const dispatch = useDispatch();

  const handleSendRequest = async (status, userId) => {
    try {
      const res = await axios.post(
        BASE_URL + "/request/send/" + status + "/" + userId,
        {},
        { withCredentials: true },
      );
      dispatch(removeUserFromFeed(userId));
    } catch (err) {}
  };

  return (
    <div className="card bg-white border-2 border-black w-80 sm:w-96 shadow-2xl overflow-hidden rounded-2xl">
      <figure className="relative">
        <img src={photoURL} alt="photo" className="w-full h-80 object-cover" />
        {/* gradient overlay with name/age on top of the photo, tinder-style */}
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/20 to-transparent px-4 pt-10 pb-3">
          <h2 className="text-white text-2xl font-bold drop-shadow">
            {firstName + " " + lastName}
            {age ? <span className="font-normal text-xl">, {age}</span> : null}
          </h2>
          {gender && <p className="text-white/80 text-sm">{gender}</p>}
        </div>
      </figure>

      <div className="card-body p-5">
        <p className="text-xs uppercase tracking-wide text-gray-400 mb-1.5 font-semibold">
              About:
            </p>
        {about && (
          <p
            className={`text-sm text-black break-all ${
              preview ? "" : "line-clamp-3"
            }`}
          >
            {about}
          </p>
        )}

        {skills?.length > 0 && (
          <div className="mt-2">
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-1.5 font-semibold">
              Skills:
            </p>
            <div className="flex flex-wrap gap-2">
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

        {!preview && (
          <div className="card-actions justify-center gap-6 mt-5">
            {/* Ignore — outlined, fills red on hover */}
            <button
              className="w-16 h-16 rounded-full flex items-center justify-center bg-white border-2 border-rose-500 text-rose-500 shadow-lg hover:bg-rose-500 hover:text-white hover:scale-110 hover:shadow-rose-400/50 active:scale-95 transition-all duration-200"
              aria-label="Ignore"
              onClick={() => handleSendRequest("ignored", _id)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="26"
                height="26"
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
            </button>

            {/* Interested — solid pink/rose gradient, filled heart */}
            <button
              className="w-16 h-16 rounded-full flex items-center justify-center text-white bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg hover:shadow-pink-500/50 hover:scale-110 active:scale-95 transition-all duration-200"
              aria-label="Interested"
              onClick={() => handleSendRequest("interested", _id)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12.001 4.529c2.349-2.532 6.15-2.532 8.498 0 2.349 2.531 2.349 6.638 0 9.17L12.001 22 3.501 13.7c-2.349-2.532-2.349-6.639 0-9.17 2.348-2.532 6.15-2.532 8.5 0z" />
              </svg>
            </button>
          </div>
        )}
      </div>      
    </div>
  );
};
export default UserCard;
