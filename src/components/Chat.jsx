import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { createSocketConnection } from "../utils/socket";

const Chat = () => {
  // targetUserId comes from the route param, e.g. /chat/:targetUserId
  const { targetUserId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((store) => store.user);
  const userId = user?._id;

  const [messages, setMessages] = useState([]); // full chat history + live messages
  const [newMessage, setNewMessage] = useState(""); // controlled input value
  const [targetUser, setTargetUser] = useState(null); // the OTHER person's profile (name/photo) for the header
  const [isTyping, setIsTyping] = useState(false); // whether the other person is currently typing

  const socketRef = useRef(null); // holds the live socket connection across renders
  const typingTimeoutRef = useRef(null); // used to auto-clear "typing" after a pause
  const scrollRef = useRef(null); // empty div at the bottom of the message list, used to auto-scroll

  // ---- Load existing chat history + who we're chatting with ----
  useEffect(() => {
    const fetchChat = async () => {
      const res = await axios.get(BASE_URL + "/chat/" + targetUserId, {
        withCredentials: true,
      });

      // normalize each message: senderId may come populated (an object) or
      // as a raw id depending on the route, so always reduce it to just the id
      const formatted = res.data.messages.map((m) => ({
        senderId: m.senderId?._id || m.senderId,
        text: m.text,
        createdAt: m.createdAt,
      }));

      setMessages(formatted);
      setTargetUser(res.data.targetUser); // name/photo of the person we're chatting with
    };
    fetchChat();
  }, [targetUserId]);

  // ---- Connect to the socket server and listen for live events ----
  useEffect(() => {
    if (!userId) return; // wait until we know who's logged in

    const socket = createSocketConnection();
    socketRef.current = socket;

    // tell the server "put me in the room for this conversation"
    socket.emit("joinChat", { userId, targetUserId });

    // a new message arrived in real time (from either user)
    socket.on("messageReceived", ({ senderId, text, createdAt }) => {
      setMessages((prev) => [...prev, { senderId, text, createdAt }]);
    });

    // the OTHER user started typing
    socket.on("userTyping", ({ userId: typingUserId }) => {
      if (typingUserId === targetUserId) setIsTyping(true);
    });

    // the OTHER user stopped typing (paused, or sent the message)
    socket.on("userStoppedTyping", ({ userId: typingUserId }) => {
      if (typingUserId === targetUserId) setIsTyping(false);
    });

    // cleanup: disconnect the socket when leaving the chat page
    return () => socket.disconnect();
  }, [userId, targetUserId]);

  // ---- Auto-scroll to the latest message whenever messages or typing status change ----
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ---- Called on every keystroke in the input box ----
  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    // tell the other user "I'm typing"
    socketRef.current?.emit("typing", { userId, targetUserId });

    // debounce: if the user pauses for 1.5s, tell the other user "I stopped"
    // (clearing any previous timer first so we don't fire multiple times)
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("stopTyping", { userId, targetUserId });
    }, 1500);
  };

  // ---- Send the typed message ----
  const sendMessage = () => {
    if (!newMessage.trim()) return; // ignore empty/whitespace-only messages

    socketRef.current.emit("sendMessage", {
      userId,
      targetUserId,
      text: newMessage,
    });

    // immediately clear the typing indicator once the message is sent
    socketRef.current.emit("stopTyping", { userId, targetUserId });
    clearTimeout(typingTimeoutRef.current);

    setNewMessage("");
  };

  // ---- Formats a timestamp like "3:45 PM" for display under each bubble ----
  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ---- Formats a date for the day-divider shown between messages ----
  // Returns "Today", "Yesterday", or a full date like "14 August 2026"
  const formatDateDivider = (dateStr) => {
    if (!dateStr) return "";
    const msgDate = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    // compare only the calendar day (ignore time) using toDateString
    if (msgDate.toDateString() === today.toDateString()) return "Today";
    if (msgDate.toDateString() === yesterday.toDateString()) return "Yesterday";

    return msgDate.toLocaleDateString([], {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    // Full-height chat shell instead of a small centered box — reads more
    // like an actual messaging app and uses the vertical space you have.
    <div className="flex justify-center px-2 sm:px-4 py-4">
      <div className="flex flex-col w-full max-w-2xl h-[calc(100vh-9rem)] rounded-3xl overflow-hidden border-2 border-black shadow-2xl bg-white">
        {/* ---------- Header ---------- */}
        <div className="flex items-center gap-3 px-4 py-3 border-b-2 border-black bg-white backdrop-blur-sm">
          {/* back button returns to the connections list */}
          <button
            onClick={() => navigate("/connections")}
            aria-label="Back to connections"
            className="btn btn-ghost btn-circle btn-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {targetUser?.photoURL && (
            <img
              src={targetUser.photoURL}
              alt={targetUser.firstName}
              className="w-10 h-10 rounded-full object-cover ring ring-primary/40 ring-offset-2 ring-offset-base-200"
            />
          )}

          <div className="min-w-0">
            <p className="font-bold truncate text-black">
              {targetUser
                ? targetUser.firstName + " " + targetUser.lastName
                : "Loading..."}
            </p>
            {/* fixed height so the header doesn't jump as typing appears/disappears */}
            <p className="text-xs text-primary h-4">
              {isTyping ? "typing..." : ""}
            </p>
          </div>
        </div>

        {/* ---------- Message list ---------- */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-1 chat-scroll">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center gap-1 opacity-60">
              <p className="text-lg font-semibold">No messages yet</p>
              <p className="text-sm text-gray-400">
                Say hi to {targetUser?.firstName || "them"} 👋
              </p>
            </div>
          )}

          {messages.map((m, i) => {
            const isOwn = m.senderId === userId;

            // show a date divider before this message if it's the first message
            // overall, or if its calendar day differs from the previous message's
            const prevMsg = messages[i - 1];
            const showDateDivider =
              !prevMsg ||
              new Date(prevMsg.createdAt).toDateString() !==
                new Date(m.createdAt).toDateString();

            // only show the small avatar next to the FIRST message of a
            // consecutive run from the other person, like real chat apps —
            // avoids repeating the photo next to every single bubble
            const nextMsg = messages[i + 1];
            const isLastOfGroup =
              !nextMsg || nextMsg.senderId !== m.senderId || showDateDivider;

            return (
              <div key={i}>
                {showDateDivider && (
                  <div className="flex justify-center my-4">
                    <span className="text-xs text-gray-600 bg-white border border-black px-3 py-1 rounded-full">
                      {formatDateDivider(m.createdAt)}
                    </span>
                  </div>
                )}

                <div
                  className={`chat message-in ${
                    isOwn ? "chat-end" : "chat-start"
                  }`}
                >
                  {/* small avatar for the other person, only under the last
                      bubble of their consecutive message group */}
                  {!isOwn && (
                    <div className="chat-image avatar">
                      <div className="w-8 h-8 rounded-full">
                        {isLastOfGroup && targetUser?.photoURL && (
                          <img src={targetUser.photoURL} alt="" />
                        )}
                      </div>
                    </div>
                  )}

                  <div
                    className={`chat-bubble border-2 border-black ${
                      isOwn
                        ? "bg-green-600 text-white"
                        : "bg-white text-black"
                    }`}
                  >
                    {m.text}
                  </div>

                  {isLastOfGroup && (
                    <div className="chat-footer text-[11px] text-gray-600 mt-1">
                      {formatTime(m.createdAt)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* ---------- Typing indicator: animated 3-dot bubble, shown as
              if the other person is "speaking", instead of plain text ---------- */}
          {isTyping && (
            <div className="chat chat-start">
              <div className="chat-image avatar">
                <div className="w-8 h-8 rounded-full">
                  {targetUser?.photoURL && (
                    <img src={targetUser.photoURL} alt="" />
                  )}
                </div>
              </div>
              <div className="chat-bubble border-2 border-black bg-white text-black flex items-center gap-1 py-3">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}

          {/* invisible anchor div — scrollIntoView on this keeps the latest message in view */}
          <div ref={scrollRef} />
        </div>

        {/* ---------- Input box ---------- */}
        <div className="p-3 border-t-2 border-black bg-white">
          <div className="flex items-center gap-2 bg-white border-2 border-black rounded-full pl-4 pr-1.5 py-1.5">
            <input
              className="flex-1 bg-transparent outline-none text-sm text-black placeholder:text-gray-500"
              value={newMessage}
              onChange={handleTyping}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..."
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              aria-label="Send message"
              className="btn btn-primary btn-circle btn-sm disabled:opacity-40"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Scoped styles: message entrance animation, typing dots, and a
          slimmer scrollbar for the message list. Kept local to this
          component instead of touching global CSS. */}
      <style>{`
        .message-in {
          animation: messageIn 0.25s ease-out;
        }
        @keyframes messageIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: currentColor;
          opacity: 0.6;
          animation: typingBounce 1.2s infinite ease-in-out;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.15s; }
        .typing-dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-4px); opacity: 1; }
        }

        .chat-scroll::-webkit-scrollbar { width: 6px; }
        .chat-scroll::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.2);
          border-radius: 9999px;
        }

        @media (prefers-reduced-motion: reduce) {
          .message-in { animation: none; }
          .typing-dot { animation: none; }
        }
      `}</style>
    </div>
  );
};

export default Chat;
