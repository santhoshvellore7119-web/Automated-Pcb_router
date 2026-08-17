import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000');

    newSocket.on('connect', () => {
      setConnected(true);
      setSocket(newSocket);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      setSocket(null);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return { socket, connected };
};

export default useSocket;