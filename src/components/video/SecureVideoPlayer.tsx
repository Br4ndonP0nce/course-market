// src/components/video/SecureVideoPlayer.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface VideoPlayerProps {
  lessonId: string;
  onProgress?: (currentTime: number, duration: number) => void;
  onComplete?: () => void;
  autoPlay?: boolean;
  startTime?: number; // Resume from specific time
}

interface VideoData {
  signedUrl: string;
  quality: string;
  availableQualities: string[];
  duration: number;
  thumbnailUrl?: string;
  expiresIn: number;
}

export function SecureVideoPlayer({
  lessonId,
  onProgress,
  onComplete,
  autoPlay = false,
  startTime = 0,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(startTime);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentQuality, setCurrentQuality] = useState<string>("720p");

  // URL refresh handling
  const [urlExpiry, setUrlExpiry] = useState<Date | null>(null);

  // Load video data and signed URL
  const loadVideo = async (quality: string = currentQuality) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/lessons/${lessonId}/signed-url?quality=${quality}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 202) {
          setError(
            "Video is still processing. Please try again in a few minutes."
          );
        } else if (response.status === 403) {
          setError("You need to purchase this course to watch this video.");
        } else {
          setError(errorData.error || "Failed to load video");
        }
        return;
      }

      const data = await response.json();
      setVideoData(data);
      setCurrentQuality(data.quality);
      setUrlExpiry(new Date(Date.now() + data.expiresIn * 1000));

      // Auto-refresh URL before expiry
      setTimeout(() => {
        if (videoRef.current && !videoRef.current.paused) {
          refreshVideoUrl();
        }
      }, (data.expiresIn - 300) * 1000); // Refresh 5 minutes before expiry
    } catch (err) {
      console.error("Error loading video:", err);
      setError("Failed to load video");
    } finally {
      setLoading(false);
    }
  };

  const refreshVideoUrl = async () => {
    if (!videoRef.current) return;

    const currentVideoTime = videoRef.current.currentTime;
    const wasPlaying = !videoRef.current.paused;

    await loadVideo(currentQuality);

    // Restore playback position
    if (videoRef.current) {
      videoRef.current.currentTime = currentVideoTime;
      if (wasPlaying) {
        videoRef.current.play();
      }
    }
  };

  // Initialize video
  useEffect(() => {
    loadVideo();
  }, [lessonId]);

  // Auto-play and start time
  useEffect(() => {
    if (videoData && videoRef.current) {
      const video = videoRef.current;

      video.currentTime = startTime;

      if (autoPlay) {
        video.play().catch((err) => {
          console.log("Autoplay prevented:", err);
        });
      }
    }
  }, [videoData, autoPlay, startTime]);

  // Video event handlers
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setCurrentTime(startTime);
      videoRef.current.currentTime = startTime;
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;

      setCurrentTime(current);
      onProgress?.(current, total);

      // Mark as complete when 90% watched
      if (current / total >= 0.9) {
        onComplete?.();
      }
    }
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleSeek = (newTime: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = newTime[0];
      setCurrentTime(newTime[0]);
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    const vol = newVolume[0];
    setVolume(vol);
    setIsMuted(vol === 0);
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const changeQuality = async (quality: string) => {
    if (quality === currentQuality) return;

    const currentVideoTime = videoRef.current?.currentTime || 0;
    const wasPlaying = videoRef.current && !videoRef.current.paused;

    await loadVideo(quality);

    // Restore playback state
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = currentVideoTime;
        if (wasPlaying) {
          videoRef.current.play();
        }
      }
    }, 100);
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const resetTimeout = () => {
      clearTimeout(timeout);
      setShowControls(true);
      timeout = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };

    if (isPlaying) {
      resetTimeout();

      const handleMouseMove = () => resetTimeout();
      document.addEventListener("mousemove", handleMouseMove);

      return () => {
        clearTimeout(timeout);
        document.removeEventListener("mousemove", handleMouseMove);
      };
    } else {
      setShowControls(true);
    }
  }, [isPlaying]);

  if (loading) {
    return (
      <div className="relative w-full aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading video...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative w-full aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-center text-white max-w-md">
          <div className="text-red-400 mb-4">⚠️</div>
          <p className="mb-4">{error}</p>
          {error.includes("processing") && (
            <Button
              variant="outline"
              onClick={() => loadVideo()}
              className="text-white border-white hover:bg-white hover:text-gray-900"
            >
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (!videoData) {
    return (
      <div className="relative w-full aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
        <p className="text-white">No video data available</p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group">
      <video
        ref={videoRef}
        src={videoData.signedUrl}
        poster={videoData.thumbnailUrl}
        className="w-full h-full object-contain"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={onComplete}
        playsInline
        preload="metadata"
        // Disable right-click and download
        onContextMenu={(e) => e.preventDefault()}
        controlsList="nodownload"
      />

      {/* Click overlay for play/pause */}
      <div
        className="absolute inset-0 flex items-center justify-center cursor-pointer"
        onClick={togglePlayPause}
      >
        {!isPlaying && showControls && (
          <div className="bg-black bg-opacity-50 rounded-full p-4">
            <Play className="h-12 w-12 text-white ml-1" />
          </div>
        )}
      </div>

      {/* Controls overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Progress bar */}
        <div className="mb-4">
          <Slider
            value={[currentTime]}
            max={duration}
            step={1}
            onValueChange={handleSeek}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-white mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlayPause}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>

              <div className="w-20">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Quality selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white hover:bg-opacity-20"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  {currentQuality}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {videoData.availableQualities.map((quality) => (
                  <DropdownMenuItem
                    key={quality}
                    onClick={() => changeQuality(quality)}
                    className={currentQuality === quality ? "bg-blue-100" : ""}
                  >
                    {quality}
                    {currentQuality === quality && " ✓"}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* URL expiry warning */}
      {urlExpiry &&
        new Date() > new Date(urlExpiry.getTime() - 10 * 60 * 1000) && (
          <div className="absolute top-4 right-4 bg-yellow-500 text-black px-3 py-1 rounded text-sm">
            Session expires soon
          </div>
        )}
    </div>
  );
}
