import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");

  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 9);
    navigate(`/room/${newRoomId}`);
  };

  const handleJoinRoom = () => {
    if (roomId.trim() !== "") {
      navigate(`/room/${roomId}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Audio Chat Room</h1>
      <div className="space-y-4">
        <button className="btn btn-primary w-48" onClick={handleCreateRoom}>
          Create Room
        </button>
        <div>
          <input
            type="text"
            placeholder="Enter Room ID"
            className="input input-bordered w-64"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button className="btn btn-secondary ml-2" onClick={handleJoinRoom}>
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
