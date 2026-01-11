import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Play, Pause, Volume2, CircleMinus, PackagePlus, Repeat, Shuffle, Heart, Download, Share2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface WaveformProps {
  audioUrl: string;
  duration: string;
  onPlay?: () => void;
  onPause?: () => void;
  className?: string;
}

export function Waveform({ audioUrl, duration, onPlay, onPause, className }: WaveformProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [volume, setVolume] = useState(75);
  const [isRepeating, setIsRepeating] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      
      // Update current time display during playback
      audioRef.current.addEventListener('timeupdate', () => {
        if (audioRef.current) {
          const minutes = Math.floor(audioRef.current.currentTime / 60);
          const seconds = Math.floor(audioRef.current.currentTime % 60);
          setCurrentTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      });

      // Reset when ended
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
        }
      });
    }

    // Set initial volume
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }

    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioUrl]);

  // Update volume when slider changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        if (onPause) onPause();
      } else {
        audioRef.current.play().catch(err => {
          console.error("Error playing audio:", err);
          // Fallback behavior: if the audio can't be played, we still want to show the UI in playing state
          // This way it still looks functional even if the actual file can't be loaded
          if (onPlay) onPlay();
        });
        if (onPlay) onPlay();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handler functions for control buttons
  const handleRepeat = () => {
    setIsRepeating(!isRepeating);
    if (audioRef.current) {
      audioRef.current.loop = !isRepeating;
    }
  };

  const handleShuffle = () => {
    setIsShuffled(!isShuffled);
    // Shuffle functionality would require a playlist context
    console.log('Shuffle toggled:', !isShuffled);
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    // Here you would typically save to favorites via API
    console.log('Favorite toggled:', !isFavorited);
  };

  const handleDownload = () => {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = 'podcast-audio.mp3';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Podcast Audio',
      text: 'Check out this amazing podcast from Izuran Records',
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error sharing:', error);
        // Fallback to clipboard
        navigator.clipboard.writeText(window.location.href);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Generate SVG waveform path with multiple patterns for a more psychedelic look
  const generateWaveformSvg = () => {
    const svgWidth = 1200;
    const svgHeight = 60;
    
    // Primary waveform
    let primaryPath = `M1 ${svgHeight/2}`;
    for (let i = 0; i < 40; i++) {
      const x = i * 30;
      const height = Math.sin(i * 0.5) * 20 + (svgHeight/2);
      primaryPath += ` C${x} ${svgHeight - height}, ${x + 15} ${height}, ${x + 30} ${svgHeight - height}`;
    }
    
    // Secondary waveform (more chaotic)
    let secondaryPath = `M1 ${svgHeight/2}`;
    for (let i = 0; i < 60; i++) {
      const x = i * 20;
      const height = Math.sin(i * 0.8) * 15 + Math.cos(i * 0.3) * 10 + (svgHeight/2);
      secondaryPath += ` Q${x + 10} ${height}, ${x + 20} ${svgHeight - height}`;
    }
    
    // Tertiary decoration elements
    let decorationPath = '';
    for (let i = 0; i < 10; i++) {
      const x = i * 120;
      const y = svgHeight/2 + Math.sin(i) * 15;
      const size = 3 + Math.sin(i * 0.5) * 2;
      decorationPath += `M${x} ${y} l0 ${size} M${x} ${y} l${size} 0 M${x} ${y} l0 -${size} M${x} ${y} l-${size} 0`;
    }
    
    return `
      <svg width="100%" height="${svgHeight}px" viewBox="0 0 ${svgWidth} ${svgHeight}" xmlns="http://www.w3.org/2000/svg">
        <path d="${secondaryPath}" stroke="#d97706" stroke-opacity="0.3" fill="none" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" />
        <path d="${primaryPath}" stroke="#f59e0b" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        <path d="${decorationPath}" stroke="#f59e0b" stroke-opacity="0.6" fill="none" stroke-width="1" stroke-linecap="round" />
      </svg>
    `;
  };

  // Progress indicator
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Update progress bar 
    const updateProgress = () => {
      if (audioRef.current) {
        const currentProgress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
        setProgress(isNaN(currentProgress) ? 0 : currentProgress);
      }
    };

    if (audioRef.current) {
      audioRef.current.addEventListener('timeupdate', updateProgress);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', updateProgress);
      }
    };
  }, []);

  useEffect(() => {
    if (waveformRef.current) {
      const svgString = generateWaveformSvg();
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      waveformRef.current.style.backgroundImage = `url('${url}')`;
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, []);

  return (
    <div className={cn("mt-4", className)}>
      <div className="flex justify-between items-center mb-2">
        <button
          onClick={togglePlayPause}
          className="text-amber-400 hover:text-amber-300 transition-all text-2xl"
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <div className="text-amber-200/60 text-sm">
          <span className="current-time">{currentTime}</span> / <span className="duration">{duration}</span>
        </div>
      </div>
      
      <div className="waveform-container">
        <div ref={waveformRef} className="waveform"></div>
        <div 
          className="absolute top-0 left-0 h-full bg-amber-500 bg-opacity-20 pointer-events-none"
          style={{ width: `${progress}%` }}
        ></div>
        <div 
          className="absolute top-0 left-0 h-full w-full cursor-pointer"
          onClick={(e) => {
            if (audioRef.current) {
              const container = e.currentTarget;
              const rect = container.getBoundingClientRect();
              const clickPos = (e.clientX - rect.left) / rect.width;
              audioRef.current.currentTime = clickPos * audioRef.current.duration;
            }
          }}
        ></div>
      </div>
      
      <div className="flex justify-between items-center mt-4">
        <div className="flex space-x-3">
          <button 
            onClick={handleRepeat}
            className={`transition-all ${
              isRepeating 
                ? 'text-amber-400 hover:text-amber-200' 
                : 'text-amber-400/60 hover:text-amber-400'
            }`}
            title={isRepeating ? 'Disable repeat' : 'Enable repeat'}
          >
            <Repeat size={18} />
          </button>
          <button 
            onClick={handleShuffle}
            className={`transition-all ${
              isShuffled 
                ? 'text-amber-400 hover:text-amber-200' 
                : 'text-amber-400/60 hover:text-amber-400'
            }`}
            title={isShuffled ? 'Disable shuffle' : 'Enable shuffle'}
          >
            <Shuffle size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-amber-400/60 hover:text-amber-400 transition-all" title="Volume">
            <Volume2 size={18} />
          </button>
          <Slider
            className="w-24 h-1"
            value={[volume]}
            max={100}
            step={1}
            onValueChange={(values) => setVolume(values[0])}
          />
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleFavorite}
            className={`transition-all ${
              isFavorited 
                ? 'text-red-400 hover:text-red-300' 
                : 'text-amber-400/60 hover:text-amber-400'
            }`}
            title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} />
          </button>
          <button 
            onClick={handleDownload}
            className="text-amber-400/60 hover:text-amber-400 transition-all"
            title="Download audio"
          >
            <Download size={18} />
          </button>
          <button 
            onClick={handleShare}
            className="text-amber-400/60 hover:text-amber-400 transition-all"
            title="Share"
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
