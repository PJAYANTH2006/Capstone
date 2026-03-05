import { useState, useRef, useEffect, useCallback } from 'react';

export const useWebRTC = (socket, roomId) => {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState({}); // { socketId: MediaStream }
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    const peers = useRef({}); // { socketId: RTCPeerConnection }
    const localStreamRef = useRef(null);

    const iceServers = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };

    const cleanupPeer = useCallback((socketId) => {
        if (peers.current[socketId]) {
            peers.current[socketId].close();
            delete peers.current[socketId];
        }
        setRemoteStreams(prev => {
            const next = { ...prev };
            delete next[socketId];
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
                setRemoteStreams(prev => ({
                    ...prev,
                    [peerSocketId]: event.streams[0]
                }));
            }
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                cleanupPeer(peerSocketId);
            }
        };

        return pc;
    }, [socket, cleanupPeer]);

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

            // Notify others that we are starting media
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
        // Close all peer connections
        Object.keys(peers.current).forEach(cleanupPeer);
        socket.emit('stop-media', { roomId });
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    const startScreenShare = async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            setIsScreenSharing(true);

            // Replace video track in all peer connections
            const screenTrack = screenStream.getVideoTracks()[0];

            Object.values(peers.current).forEach(pc => {
                const sender = pc.getSenders().find(s => s.track.kind === 'video');
                if (sender) sender.replaceTrack(screenTrack);
            });

            screenTrack.onended = () => {
                stopScreenShare();
            };

            // Update local stream state (optional, for preview)
            // Note: This replaces the local webcam preview with the screen share
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
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            }
        });

        socket.on('webrtc-ice-candidate', async ({ from, candidate }) => {
            const pc = peers.current[from];
            if (pc) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
        });

        socket.on('user-started-media', ({ from }) => {
            if (localStreamRef.current) {
                initiateCall(from, localStreamRef.current);
            }
        });

        socket.on('user-left', ({ socketId }) => {
            cleanupPeer(socketId);
        });

        return () => {
            socket.off('webrtc-offer');
            socket.off('webrtc-answer');
            socket.off('webrtc-ice-candidate');
            socket.off('user-started-media');
            socket.off('user-left');
        };
    }, [socket, createPeerConnection, initiateCall, cleanupPeer]);

    return {
        localStream,
        remoteStreams,
        isMuted,
        isVideoOff,
        isScreenSharing,
        startMedia,
        stopMedia,
        toggleMute,
        toggleVideo,
        startScreenShare,
        stopScreenShare
    };
};
