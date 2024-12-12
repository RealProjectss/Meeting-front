import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const SERVER_URL = "http://localhost:8000";

const VoiceConference = () => {
  const [peers, setPeers] = useState([]);
  const [stream, setStream] = useState(null);
  const socketRef = useRef();
  const peersRef = useRef([]);

  useEffect(() => {
    socketRef.current = io(SERVER_URL);

    navigator.mediaDevices.getUserMedia({ audio: true }).then((userStream) => {
      setStream(userStream);

      socketRef.current.on("signal", ({ from, signal }) => {
        const peer = peersRef.current.find((p) => p.peerID === from);
        if (peer) {
          peer.peer.signal(signal);
        }
      });

      socketRef.current.emit("join-room");

      socketRef.current.on("user-joined", (userId) => {
        const peer = createPeer(userId, socketRef.current.id, userStream);
        peersRef.current.push({
          peerID: userId,
          peer,
        });
        setPeers((prevPeers) => [...prevPeers, peer]);
      });

      socketRef.current.on("receive-returned-signal", ({ signal, id }) => {
        const peer = peersRef.current.find((p) => p.peerID === id);
        peer.peer.signal(signal);
      });
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const createPeer = (userToSignal, callerID, stream) => {
    const peer = new RTCPeerConnection();

    stream.getTracks().forEach((track) => peer.addTrack(track, stream));

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current.emit("signal", {
          signal: peer.localDescription,
          to: userToSignal,
        });
      }
    };

    return peer;
  };

  return (
    <div>
      <h2>Voice Conference</h2>
      {stream && <audio controls autoPlay muted src={stream} />}
      {peers.map((peer, index) => (
        <audio key={index} autoPlay ref={peer.audioRef} />
      ))}
    </div>
  );
};

export default VoiceConference;
