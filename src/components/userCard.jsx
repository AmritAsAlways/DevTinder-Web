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
                  className="badge badge-primary badge-outline text-xs py-2.5 px-3 max-w-full truncate bg-blue-500"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {!preview && (
          <div className="card-actions justify-center gap-4 mt-5">
            <button
              className="btn btn-outline btn-error btn-circle btn-lg"
              aria-label="Ignore"
              onClick={() => handleSendRequest("ignored", _id)}
            >
              ✕
            </button>
            <button
              className="btn btn-circle btn-lg bg-pink-600 hover:bg-pink-700 text-white border-none"
              aria-label="Interested"
              onClick={() => handleSendRequest("interested", _id)}
            >
              ♥
            </button>
          </div>
        )}
      </div>      
    </div>
  );
};
export default UserCard;
