import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  SkipBack,
  SkipForward,
  RotateCcw,
  CheckCircle,
  Lock,
  Loader2,
} from "lucide-react";

interface VideoQuality {
  label: string;
  url: string;
  width: number;
  height: number;
}

interface VideoPlayerProps {
  lessonId: string;
  lessonTitle: string;
  videoQualities: Record<string, any>;
  thumbnailUrl?: string;
  duration?: number;
  autoPlay?: boolean;
  onProgress?: (currentTime: number, duration: number) => void;
  onComplete?: () => void;
  isPreview?: boolean; // Creator preview vs student view
  hasAccess?: boolean; // Student access control
  className?: string;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  isLoading: boolean;
  showControls: boolean;
  selectedQuality: string;
  playbackRate: number;
}

export default function SecureVideoPlayer({
  lessonId,
  lessonTitle,
  videoQualities,
  thumbnailUrl,
  duration: propDuration,
  autoPlay = false,
  onProgress,
  onComplete,
  isPreview = false,
  hasAccess = true,
  className = "",
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Transform videoQualities to our format
  const qualities: VideoQuality[] = Object.entries(videoQualities || {})
    .map(([key, data]: [string, any]) => ({
      label: key,
      url: data.url || data,
      width: data.width || 0,
      height: data.height || 0,
    }))
    .sort((a, b) => {
      const qualityOrder = { "360p": 1, "720p": 2, "1080p": 3 };
      return (
        (qualityOrder[a.label as keyof typeof qualityOrder] || 0) -
        (qualityOrder[b.label as keyof typeof qualityOrder] || 0)
      );
    });

  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: propDuration || 0,
    volume: 1,
    isMuted: false,
    isFullscreen: false,
    isLoading: true,
    showControls: true,
    selectedQuality:
      qualities.length > 0 ? qualities[qualities.length - 1].label : "",
    playbackRate: 1,
  });

  const [showSettings, setShowSettings] = useState(false);

  // Auto-hide controls
  useEffect(() => {
    const resetControlsTimeout = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }

      setPlayerState((prev) => ({ ...prev, showControls: true }));

      if (playerState.isPlaying) {
        controlsTimeoutRef.current = setTimeout(() => {
          setPlayerState((prev) => ({ ...prev, showControls: false }));
        }, 3000);
      }
    };

    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [playerState.isPlaying]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setPlayerState((prev) => ({
        ...prev,
        duration: video.duration,
        isLoading: false,
      }));
    };

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      const duration = video.duration;

      setPlayerState((prev) => ({ ...prev, currentTime }));
      onProgress?.(currentTime, duration);

      // Mark as complete when 90% watched
      if (currentTime / duration > 0.9 && !video.ended) {
        onComplete?.();
      }
    };

    const handleEnded = () => {
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
      onComplete?.();
    };

    const handleLoadStart = () => {
      setPlayerState((prev) => ({ ...prev, isLoading: true }));
    };

    const handleCanPlay = () => {
      setPlayerState((prev) => ({ ...prev, isLoading: false }));
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("loadstart", handleLoadStart);
    video.addEventListener("canplay", handleCanPlay);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("loadstart", handleLoadStart);
      video.removeEventListener("canplay", handleCanPlay);
    };
  }, [onProgress, onComplete]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!videoRef.current) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlayPause();
          break;
        case "ArrowLeft":
          e.preventDefault();
          seekBy(-10);
          break;
        case "ArrowRight":
          e.preventDefault();
          seekBy(10);
          break;
        case "ArrowUp":
          e.preventDefault();
          adjustVolume(0.1);
          break;
        case "ArrowDown":
          e.preventDefault();
          adjustVolume(-0.1);
          break;
        case "KeyM":
          e.preventDefault();
          toggleMute();
          break;
        case "KeyF":
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, []);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video || !hasAccess) return;

    if (video.paused) {
      video.play();
      setPlayerState((prev) => ({ ...prev, isPlaying: true }));
    } else {
      video.pause();
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
    }
  };

  const seekTo = (time: number) => {
    const video = videoRef.current;
    if (!video || !hasAccess) return;

    video.currentTime = time;
  };

  const seekBy = (seconds: number) => {
    const video = videoRef.current;
    if (!video || !hasAccess) return;

    video.currentTime = Math.max(
      0,
      Math.min(video.duration, video.currentTime + seconds)
    );
  };

  const adjustVolume = (delta: number) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = Math.max(0, Math.min(1, playerState.volume + delta));
    video.volume = newVolume;
    setPlayerState((prev) => ({
      ...prev,
      volume: newVolume,
      isMuted: newVolume === 0,
    }));
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (playerState.isMuted) {
      video.volume = playerState.volume;
      video.muted = false;
      setPlayerState((prev) => ({ ...prev, isMuted: false }));
    } else {
      video.muted = true;
      setPlayerState((prev) => ({ ...prev, isMuted: true }));
    }
  };

  const changeQuality = (quality: string) => {
    const video = videoRef.current;
    if (!video || !hasAccess) return;

    const currentTime = video.currentTime;
    const wasPlaying = !video.paused;

    setPlayerState((prev) => ({
      ...prev,
      selectedQuality: quality,
      isLoading: true,
    }));

    // Change source and restore position
    video.src = qualities.find((q) => q.label === quality)?.url || "";
    video.load();

    video.addEventListener(
      "loadedmetadata",
      () => {
        video.currentTime = currentTime;
        if (wasPlaying) {
          video.play();
        }
        setPlayerState((prev) => ({ ...prev, isLoading: false }));
      },
      { once: true }
    );
  };

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setPlayerState((prev) => ({ ...prev, playbackRate: rate }));
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
      setPlayerState((prev) => ({ ...prev, isFullscreen: true }));
    } else {
      document.exitFullscreen();
      setPlayerState((prev) => ({ ...prev, isFullscreen: false }));
    }
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return "0:00";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgressPercentage = () => {
    return playerState.duration > 0
      ? (playerState.currentTime / playerState.duration) * 100
      : 0;
  };

  // Access control for students
  if (!hasAccess && !isPreview) {
    return (
      <div
        className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}
      >
        <div className="aspect-video flex items-center justify-center">
          {thumbnailUrl && (
            <img
              src={thumbnailUrl}
              alt={lessonTitle}
              className="absolute inset-0 w-full h-full object-cover opacity-30"
            />
          )}
          <div className="text-center text-white z-10">
            <Lock className="w-16 h-16 mx-auto mb-4 opacity-60" />
            <h3 className="text-xl font-semibold mb-2">Premium Content</h3>
            <p className="text-gray-300">
              Enroll in this course to access this lesson
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentQuality = qualities.find(
    (q) => q.label === playerState.selectedQuality
  );

  return (
    <div
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden group ${className}`}
      onMouseMove={() =>
        setPlayerState((prev) => ({ ...prev, showControls: true }))
      }
      onMouseLeave={() =>
        playerState.isPlaying &&
        setPlayerState((prev) => ({ ...prev, showControls: false }))
      }
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={thumbnailUrl}
        preload="metadata"
        autoPlay={autoPlay && hasAccess}
        onClick={togglePlayPause}
        src={currentQuality?.url}
      />

      {/* Loading Overlay */}
      {playerState.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      )}

      {/* Play/Pause Overlay */}
      {!playerState.isPlaying && !playerState.isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 cursor-pointer"
          onClick={togglePlayPause}
        >
          <div className="bg-black bg-opacity-70 rounded-full p-4">
            <Play className="w-12 h-12 text-white fill-white" />
          </div>
        </div>
      )}

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 transition-opacity duration-300 ${
          playerState.showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Progress Bar */}
        <div className="mb-4">
          <div
            className="h-1 bg-gray-600 rounded-full cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = (e.clientX - rect.left) / rect.width;
              seekTo(percent * playerState.duration);
            }}
          >
            <div
              className="h-full bg-red-500 rounded-full"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Play/Pause */}
            <button
              onClick={togglePlayPause}
              className="text-white hover:text-gray-300 transition-colors"
              disabled={!hasAccess}
            >
              {playerState.isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </button>

            {/* Skip Buttons */}
            <button
              onClick={() => seekBy(-10)}
              className="text-white hover:text-gray-300 transition-colors"
              disabled={!hasAccess}
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={() => seekBy(10)}
              className="text-white hover:text-gray-300 transition-colors"
              disabled={!hasAccess}
            >
              <SkipForward className="w-5 h-5" />
            </button>

            {/* Volume */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {playerState.isMuted || playerState.volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>

              <div className="w-20 h-1 bg-gray-600 rounded-full">
                <div
                  className="h-full bg-white rounded-full"
                  style={{
                    width: `${
                      playerState.isMuted ? 0 : playerState.volume * 100
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Time */}
            <div className="text-white text-sm">
              {formatTime(playerState.currentTime)} /{" "}
              {formatTime(playerState.duration)}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Settings */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>

              {showSettings && (
                <div className="absolute bottom-8 right-0 bg-black bg-opacity-90 rounded-lg p-3 min-w-40">
                  {/* Quality Selection */}
                  <div className="mb-3">
                    <div className="text-white text-sm font-medium mb-2">
                      Quality
                    </div>
                    {qualities.map((quality) => (
                      <button
                        key={quality.label}
                        onClick={() => changeQuality(quality.label)}
                        className={`block w-full text-left px-2 py-1 text-sm rounded ${
                          playerState.selectedQuality === quality.label
                            ? "bg-red-600 text-white"
                            : "text-gray-300 hover:bg-gray-700"
                        }`}
                      >
                        {quality.label}
                      </button>
                    ))}
                  </div>

                  {/* Playback Speed */}
                  <div>
                    <div className="text-white text-sm font-medium mb-2">
                      Speed
                    </div>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => changePlaybackRate(rate)}
                        className={`block w-full text-left px-2 py-1 text-sm rounded ${
                          playerState.playbackRate === rate
                            ? "bg-red-600 text-white"
                            : "text-gray-300 hover:bg-gray-700"
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Preview Badge */}
      {isPreview && (
        <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
          Preview Mode
        </div>
      )}
    </div>
  );
}
