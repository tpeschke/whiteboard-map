import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

import config from './config'

import { Excalidraw } from '@excalidraw/excalidraw';
import { socket } from './socket'
import axios from 'axios';

export default function App() {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [sendData, setSendData] = useState(false);
  const [pointerLastState, setPointerLastState] = useState(null);
  const [initialData, setInitialData] = useState({})
  const [showLoading, setShowLoading] = useState(true)

  function makeid() {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let counter = 0;
    while (counter < 25) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
      counter += 1;
    }
    return result
  }
  const [userId, setUserId] = useState(makeid())

  const handleKeyPress = useCallback((event) => {
    if (event.ctrlKey) {
      if (event.key.toLowerCase() === 'v') {
        setSendData(true)
      }
    } else if (event.key.toLowerCase() === 'delete') {
      setSendData(true)
    }
  }, [setSendData]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('keypress', handleKeyPress);
    window.addEventListener('keyup', handleKeyPress);

    axios.get(config.backendURL + '/loadMap').then(({ data }) => {
      setInitialData({ elements: data })
      setShowLoading(false)
    })

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('keypress', handleKeyPress);
      window.removeEventListener('keyup', handleKeyPress);
    }
  }, [handleKeyPress]);

  const updateWithSocketChange = (data) => {
    if (excalidrawAPI && data.userId !== userId) {
      excalidrawAPI.updateScene({ elements: data.elements });
    }
  }
  socket.on('whiteboard-frontend', updateWithSocketChange)

  const captureChange = (elements, state) => {
    if (sendData) {
      socket.emit('whiteboard-listener', { userId, elements })
      setSendData(false)
    }
  }

  const capturePointerUp = (pointerInfo) => {
    if (pointerInfo.button === 'up') {
      if (pointerLastState === 'down') {
        setSendData(true)
      }
    }
    setPointerLastState(pointerInfo.button)
  }

  return (
    <>
      {showLoading && <div>Loading</div>}
      {!showLoading &&
        <Excalidraw
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          gridModeEnabled={true}
          onChange={captureChange}
          onPointerUpdate={capturePointerUp}
          initialData={initialData}
        />
      }
    </>
  );
}