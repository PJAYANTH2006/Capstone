import { useState, useRef, useEffect, useCallback } from 'react';

export const useWebRTC = (socket, roomId) => {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState({}); // { socketId: MediaStream }
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [activeSpeakerIds, setActiveSpeakerIds] = useState(new Set());

    const peers = useRef({}); // { socketId: RTCPeerConnection }
    const localStreamRef = useRef(null);
    const audioContext = useRef(null);
    const analysers = useRef({}); // { socketId: AnalyserNode }

    const iceServers = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };

    const setupVolumeDetection = useCallback((stream, socketId) => {
        if (!audioContext.current) {
            audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
        }

        const source = audioContext.current.createMediaStreamSource(stream);
        const analyser = audioContext.current.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analysers.current[socketId] = analyser;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const checkVolume = () => {
            if (!analysers.current[socketId]) return;
            analyser.getByteFrequencyData(dataArray);
            const volume = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;

            if (volume > 20) { // Threshold for "talking"
                setActiveSpeakerIds(prev => new Set(prev).add(socketId));
            } else {
                setActiveSpeakerIds(prev => {
                    if (prev.has(socketId)) {
                        const next = new Set(prev);
                        next.delete(socketId);
                        return next;
                    }
                    return prev;
                });
            }
            requestAnimationFrame(checkVolume);
        };
        checkVolume();
    }, []);

    const cleanupPeer = useCallback((socketId) => {
        if (peers.current[socketId]) {
            peers.current[socketId].close();
            delete peers.current[socketId];
        }
        if (analysers.current[socketId]) {
            delete analysers.current[socketId];
        }
        setRemoteStreams(prev => {
            const next = { ...prev };
            delete next[socketId];
            return next;
        });
        setActiveSpeakerIds(prev => {
            const next = new Set(prev);
            next.delete(socketId);
            return next;
        });
    }, []);

    const createPeerConnection = useCallback((peerSocketId, stream) => {
        const pc = new RTCPeerConnection(iceServers);
        peers.current[peerSocketId] = pc;

        if (stream) {
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
        }

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('webrtc-ice-candidate', { to: peerSocketId, candidate: event.candidate });
            }
        };

        pc.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                const remoteStream = event.streams[0];
                setRemoteStreams(prev => ({
                    ...prev,
                    [peerSocketId]: remoteStream
                }));
                setupVolumeDetection(remoteStream, peerSocketId);
            }
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                cleanupPeer(peerSocketId);
            }
        };

        return pc;
    }, [socket, cleanupPeer, setupVolumeDetection]);

    const initiateCall = useCallback(async (peerSocketId, stream) => {
        const pc = createPeerConnection(peerSocketId, stream);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc-offer', { to: peerSocketId, offer });
    }, [createPeerConnection, socket]);

    const startMedia = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
            localStreamRef.current = stream;

            // Setup volume detection for local stream
            setupVolumeDetection(stream, 'local');

            socket.emit('start-media', { roomId });
            return stream;
        } catch (err) {
            console.error('Error accessing media devices:', err);
            return null;
        }
    };

    const stopMedia = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            setLocalStream(null);
            localStreamRef.current = null;
        }
        if (analysers.current['local']) delete analysers.current['local'];
        Object.keys(peers.current).forEach(cleanupPeer);
        socket.emit('stop-media', { roomId });
    };

    const toggleMute = useCallback((forceState) => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                const newState = forceState !== undefined ? !forceState : !audioTrack.enabled;
                audioTrack.enabled = newState;
                setIsMuted(!audioTrack.enabled);
            }
        }
    }, []);

    const toggleVideo = useCallback(() => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    }, []);

    const sendModeratorCommand = (command, targetId) => {
        socket.emit('moderator-command', { roomId, command, targetId });
    };

    const startScreenShare = async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            setIsScreenSharing(true);
            const screenTrack = screenStream.getVideoTracks()[0];
            Object.values(peers.current).forEach(pc => {
                const sender = pc.getSenders().find(s => s.track.kind === 'video');
                if (sender) sender.replaceTrack(screenTrack);
            });
            screenTrack.onended = () => stopScreenShare();
        } catch (err) {
            console.error('Error starting screen share:', err);
        }
    };

    const stopScreenShare = async () => {
        setIsScreenSharing(false);
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            Object.values(peers.current).forEach(pc => {
                const sender = pc.getSenders().find(s => s.track.kind === 'video');
                if (sender) sender.replaceTrack(videoTrack);
            });
        }
    };

    useEffect(() => {
        if (!socket) return;

        socket.on('webrtc-offer', async ({ from, offer }) => {
            const pc = createPeerConnection(from, localStreamRef.current);
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('webrtc-answer', { to: from, answer });
        });

        socket.on('webrtc-answer', async ({ from, answer }) => {
            const pc = peers.current[from];
            if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on('webrtc-ice-candidate', async ({ from, candidate }) => {
            const pc = peers.current[from];
            if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
        });

        socket.on('user-started-media', ({ from }) => {
            if (localStreamRef.current) initiateCall(from, localStreamRef.current);
        });

        socket.on('moderator-command', ({ command }) => {
            if (command === 'mute') toggleMute(true);
            if (command === 'end-call') stopMedia();
        });

        socket.on('user-left', ({ socketId }) => cleanupPeer(socketId));

        return () => {
            socket.off('webrtc-offer');
            socket.off('webrtc-answer');
            socket.off('webrtc-ice-candidate');
            socket.off('user-started-media');
            socket.off('moderator-command');
            socket.off('user-left');
        };
    }, [socket, createPeerConnection, initiateCall, cleanupPeer, toggleMute]);

    return {
        localStream,
        remoteStreams,
        isMuted,
        isVideoOff,
        isScreenSharing,
        activeSpeakerIds,
        startMedia,
        stopMedia,
        toggleMute,
        toggleVideo,
        startScreenShare,
        stopScreenShare,
        sendModeratorCommand
    };
};
