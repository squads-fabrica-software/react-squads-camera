import React, { useEffect, useState } from 'react';
import './App.css';

interface Devices {
  label: string;
  deviceId: string;
}

const App = (): JSX.Element => {
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [devices, setDevices] = useState(undefined as unknown as Devices[]);
  const [message, setMessage] = useState('Obtendo Devices');
  const [selectedDevice, setSelectedDevice] = useState(undefined as unknown as Devices);

  useEffect(() => {
    if (!loadingDevices && !devices) {
      setLoadingDevices(true);
      const mediaDevices: MediaDeviceInfo[] = [];
      navigator.mediaDevices.enumerateDevices().then((data: MediaDeviceInfo[]) => {
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < data.length; i++) {
          const device = data[i];
          if (data[i].kind === 'videoinput') {
            mediaDevices.push(device);
          }
        }
        const devicesNew: Devices[] = [];
        const { userAgent } = navigator;
        setMessage(userAgent);
        if (
          (userAgent.match(/iPad/i) ||
            userAgent.match(/iPhone/i) ||
            userAgent.match(/AppleWebKit/i)) &&
          !userAgent.match(/Android/)
        ) {
          devicesNew.push({
            label: 'Frontal',
            deviceId: 'user',
          });

          devicesNew.push({
            label: 'Traseira',
            deviceId: 'environment',
          });
        } else {
          devicesNew.push({
            label: 'Frontal',
            deviceId: mediaDevices[0].deviceId,
          });
          if (mediaDevices.length > 1) {
            devicesNew.push({
              label: 'Traseira',
              deviceId: mediaDevices[mediaDevices.length - 1].deviceId,
            });
          }
        }

        setDevices(devicesNew);
      });
    }

    if (devices) {
      setLoadingDevices(false);
      if (devices.length > 0) {
        // setMessage('Devices encontrados');
      } else {
        setMessage('Nenhuma camera encontrada');
      }
    }
  }, [loadingDevices, devices, message]);

  const checkPermission = (): void => {
    let constraints: MediaTrackConstraints = {
      advanced: [
        {
          deviceId: selectedDevice.deviceId,
        },
      ],
    };
    if (selectedDevice.deviceId === 'user' || selectedDevice.deviceId === 'environment') {
      constraints = {
        advanced: [
          {
            facingMode: selectedDevice.deviceId,
          },
        ],
      };
    }
    navigator.mediaDevices
      .getUserMedia({ audio: false, video: constraints })
      .then(stream => {
        const video = document.querySelector('#video') as HTMLVideoElement;
        if (video) {
          video.srcObject = stream;
          video.play();
        }
      })
      .catch(err => {
        setMessage(err.name);
      });
  };

  useEffect(() => {
    if (selectedDevice && selectedDevice.deviceId !== '...') {
      checkPermission();
    } else {
      navigator.mediaDevices
        .getUserMedia({ audio: false, video: true })
        .then(stream => {
          stream.getTracks().forEach(track => {
            if (track.readyState === 'live') {
              track.stop();
            }
          });
          stream.getVideoTracks().forEach(track => {
            track.stop();
          });
          const video = document.querySelector('#video') as HTMLVideoElement;
          if (video) {
            const videoStream = video.srcObject as MediaStream;
            if (videoStream) {
              videoStream.getTracks().forEach(track => {
                track.stop();
              });
            }
            video.pause();
            video.currentTime = 0;
            video.srcObject = null;
          }
        })
        .catch(err => {
          setMessage(err.name);
        });
    }
  }, [selectedDevice]);

  const changeDeviceSelected = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    if (e.target.value !== '...') {
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < devices.length; i++) {
        const device = devices[i];
        if (device.deviceId === e.target.value) {
          setSelectedDevice(device);
          break;
        }
      }
    } else {
      setSelectedDevice(undefined as unknown as MediaDeviceInfo);
    }
  };
  return (
    <div className="App">
      <header className="App-header">
        <p>{message}</p>
        {devices && devices.length > 0 && (
          <p>
            <select onChange={e => changeDeviceSelected(e)}>
              <option>...</option>
              {devices.map(data => (
                <option key={data.deviceId} value={data.deviceId}>
                  {data.label}
                </option>
              ))}
            </select>
          </p>
        )}
        <p id="div_video">
          <video id="video" playsInline></video>
        </p>
      </header>
    </div>
  );
};
export default App;
