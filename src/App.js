import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const SERVER_URL = "https://meeting-server-kv18.onrender.com";

const VoiceConference = () => {
  const [peers, setPeers] = useState([]);
  const [stream, setStream] = useState(null);
  const socketRef = useRef();
  const peersRef = useRef([]);

  const configuration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" }, // Бесплатный STUN-сервер Google
      {
        urls: "turn:your-turn-server.com", // TURN-сервер
        username: "your-username",
        credential: "your-credential",
      },
    ],
  };

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
    const peer = new RTCPeerConnection(configuration); // Добавим STUN/TURN ниже
    const audioRef = React.createRef();

    peer.ontrack = (e) => {
      if (audioRef.current) {
        audioRef.current.srcObject = e.streams[0];
      }
    };

    stream.getTracks().forEach((track) => peer.addTrack(track, stream));

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current.emit("signal", {
          signal: e.candidate,
          to: userToSignal,
        });
      }
    };

    return { peer, audioRef };
  };

  return (
    <div>
      <h2>Voice Conference</h2>
      {stream && <audio controls autoPlay muted src={stream} />}
      {peers.map(({ audioRef }, index) => (
        <audio key={index} ref={audioRef} autoPlay />
      ))}
    </div>
  );
};

export default VoiceConference;
