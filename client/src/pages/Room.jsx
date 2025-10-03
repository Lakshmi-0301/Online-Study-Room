// src/pages/Room.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";

function Room() {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await API.get(`/rooms/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRoom(res.data);
      } catch (err) {
        setError(err.response?.data?.msg || "Failed to load room");
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomId]);

  if (loading) return <p>Loading room...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!room) return <p>No room data available.</p>;

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h2>{room.name}</h2>
      <p>{room.description}</p>
      <p>
        Capacity: {room.members.length}/{room.capacity}
      </p>

      {/* Later we’ll plug in these sections */}
      <div style={{ marginTop: "2rem" }}>
        <h3>Members</h3>
        <ul>
          {room.members.map((m) => (
            <li key={m._id}>{m.username}</li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3>Chat</h3>
        <p>[Chat messages will go here]</p>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3>Notes</h3>
        <p>[Collaborative notes will go here]</p>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3>Video Co-Watch</h3>
        <p>[Video player will go here]</p>
      </div>
    </div>
  );
}

export default Room;
