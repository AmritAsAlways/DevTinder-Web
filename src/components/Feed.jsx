import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { addFeed } from "../utils/feedSlice";
import { useEffect } from "react";
import UserCard from "./userCard";

const Feed = () => {
  const feed = useSelector((store) => store.feed);
  const dispatch = useDispatch();

  const getFeed = async () => {
    if (feed) return;
    try {
      const res = await axios.get(BASE_URL + "/feed", {
        withCredentials: true,
      });
      dispatch(addFeed(res.data));
    } catch (err) {
      console.log("Feed Error:", err.response?.status, err.response?.data);
    }
  };

  useEffect(() => {
    getFeed();
  }, []);

  if (!feed)
    return (
      <div className="flex flex-col items-center justify-center my-24 gap-4">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-gray-400 text-sm">Finding people for you...</p>
      </div>
    );

  if (feed.length <= 0)
    return (
      <div className="flex flex-col items-center justify-center my-24 gap-2">
        <h1 className="text-3xl font-bold text-black">
          No new users found!
        </h1>
        <p className="text-gray-400 text-sm">
          Check back later for new profiles.
        </p>
      </div>
    );

  return (
    <div className="flex justify-center my-12 px-4">
      <UserCard user={feed[0]} />
    </div>
  );
};

export default Feed;
