import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { createSocketConnection } from "../utils/socket";

const Chat = () => {
  const { targetUserId } = useParams();
  const user = useSelector((store) => store.user);
  const userId = user?._id;

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const socketRef = useRef(null);

  // load old messages
  useEffect(() => {
    const fetchChat = async () => {
      const res = await axios.get(BASE_URL + "/chat/" + targetUserId, {
        withCredentials: true,
      });
      const formatted = res.data.messages.map((m) => ({
        senderId: m.senderId?._id || m.senderId,
        text: m.text,
      }));
      setMessages(formatted);
    };
    fetchChat();
  }, [targetUserId]);

  // connect socket
  useEffect(() => {
    if (!userId) return;
    const socket = createSocketConnection();
    socketRef.current = socket;

    socket.emit("joinChat", { userId, targetUserId });

    socket.on("messageReceived", ({ senderId, text }) => {
      setMessages((prev) => [...prev, { senderId, text }]);
    });

    return () => socket.disconnect();
  }, [userId, targetUserId]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    socketRef.current.emit("sendMessage", { userId, targetUserId, text: newMessage });
    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-[70vh] max-w-xl mx-auto my-10 border rounded-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`chat ${m.senderId === userId ? "chat-end" : "chat-start"}`}
          >
            <div className="chat-bubble">{m.text}</div>
          </div>
        ))}
      </div>
      <div className="p-3 flex gap-2 border-t">
        <input
          className="input input-bordered flex-1"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
        />
        <button className="btn btn-primary" onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;