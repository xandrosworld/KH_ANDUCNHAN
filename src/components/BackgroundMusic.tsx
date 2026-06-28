import { useCallback, useEffect, useRef, useState } from 'react';
import { Music } from 'lucide-react';

/**
 * BackgroundMusic - floating toggle (bottom-right).
 *
 * Loads the track list from /api/music, shuffles it into a queue,
 * and avoids playing the same song twice in a row.
 */

interface Track {
  name: string;
  url: string;
}

const STORAGE_KEY = 'gf_music_pref'; // 'on' | 'off'
const MUSIC_ENDPOINT = '/api/music';

const shuffleTracks = (tracks: Track[]) => {
  const shuffled = [...tracks];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const BackgroundMusic = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tracksRef = useRef<Track[]>([]);
  const queueRef = useRef<Track[]>([]);
  const lastTrackUrlRef = useRef('');
  const [playing, setPlaying] = useState(false);
  const [visible, setVisible] = useState(false);

  const hasTriedAutoPlay = useRef(false);

  const refillQueue = useCallback(() => {
    const tracks = tracksRef.current;
    if (tracks.length === 0) return;

    const nextQueue = shuffleTracks(tracks);

    if (nextQueue.length > 1 && nextQueue[0]?.url === lastTrackUrlRef.current) {
      const swapIndex = nextQueue.findIndex((track) => track.url !== lastTrackUrlRef.current);
      if (swapIndex > 0) {
        [nextQueue[0], nextQueue[swapIndex]] = [nextQueue[swapIndex], nextQueue[0]];
      }
    }

    queueRef.current = nextQueue;
  }, []);

  const takeNextTrack = useCallback((): Track | null => {
    if (tracksRef.current.length === 0) return null;
    if (queueRef.current.length === 0) refillQueue();
    return queueRef.current.shift() ?? null;
  }, [refillQueue]);

  const playTrack = useCallback((track: Track): Promise<void> => {
    const audio = audioRef.current;
    if (!audio) return Promise.resolve();

    lastTrackUrlRef.current = track.url;
    audio.src = track.url;
    audio.load();

    return audio.play().then(() => {
      setPlaying(true);
    }).catch((error) => {
      setPlaying(false);
      throw error;
    });
  }, []);

  const playNext = useCallback((): Promise<void> => {
    const track = takeNextTrack();
    if (!track) return Promise.resolve();
    return playTrack(track);
  }, [playTrack, takeNextTrack]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setPlaying(false);
  }, []);

  const resume = useCallback(() => {
    void playNext().catch(() => {});
  }, [playNext]);

  useEffect(() => {
    const audio = new Audio();
    audio.volume = 0.35;
    audio.preload = 'none';
    audioRef.current = audio;

    const onEnded = () => {
      void playNext().catch(() => {});
    };

    audio.addEventListener('ended', onEnded);

    const EVENTS = ['click', 'touchstart', 'keydown', 'pointerdown'];

    function cleanup() {
      EVENTS.forEach((evt) => document.removeEventListener(evt, onInteraction));
    }

    function onInteraction() {
      if (hasTriedAutoPlay.current) { cleanup(); return; }
      if (localStorage.getItem(STORAGE_KEY) === 'off') { cleanup(); return; }
      if (tracksRef.current.length === 0) return;

      hasTriedAutoPlay.current = true;
      cleanup();

      audio.pause();

      // Create the Audio object inside the gesture handler for browser autoplay rules.
      const freshAudio = new Audio();
      freshAudio.volume = 0.35;
      freshAudio.preload = 'none';
      freshAudio.addEventListener('ended', onEnded);
      audioRef.current = freshAudio;

      void playNext().catch(() => {
        hasTriedAutoPlay.current = false;
      });
    }

    if (localStorage.getItem(STORAGE_KEY) !== 'off') {
      EVENTS.forEach((evt) =>
        document.addEventListener(evt, onInteraction, { passive: true }),
      );
    }

    const fetchTracks = async () => {
      try {
        const res = await fetch(`${MUSIC_ENDPOINT}?v=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        const rawTracks: Track[] = json?.data?.tracks || json?.tracks || [];
        if (rawTracks.length === 0) return;

        const tracks = rawTracks.map((track) => ({
          ...track,
          url: track.url.replace(/^https?:\/\/[^/]+/, ''),
        }));

        tracksRef.current = tracks;
        queueRef.current = [];
        setVisible(true);
      } catch {
        // Music is optional when the endpoint is unavailable.
      }
    };

    void fetchTracks();

    return () => {
      cleanup();
      audio.removeEventListener('ended', onEnded);

      const currentAudio = audioRef.current;
      currentAudio?.removeEventListener('ended', onEnded);
      currentAudio?.pause();
      currentAudio?.removeAttribute('src');
      currentAudio?.load();
      audioRef.current = null;
    };
  }, [playNext]);

  const toggle = useCallback(() => {
    if (playing) {
      pause();
      localStorage.setItem(STORAGE_KEY, 'off');
    } else {
      resume();
      localStorage.setItem(STORAGE_KEY, 'on');
    }
  }, [playing, pause, resume]);

  useEffect(() => {
    const handler = () => toggle();
    window.addEventListener('toggle-music', handler);
    return () => window.removeEventListener('toggle-music', handler);
  }, [toggle]);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes musicBar {
          0%   { height: 3px; }
          100% { height: 14px; }
        }
        @keyframes musicGlow {
          0%, 100% { box-shadow: 0 0 8px rgba(246,211,122,0.2), 0 0 0 0 rgba(246,211,122,0.15); }
          50% { box-shadow: 0 0 14px rgba(246,211,122,0.35), 0 0 0 4px rgba(246,211,122,0); }
        }
        @keyframes noteFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
      `}</style>
      <button
        id="bg-music-toggle"
        onClick={toggle}
        aria-label={playing ? 'Mute background music' : 'Play background music'}
        className={`fixed bottom-[50%] right-3 lg:bottom-[100px] lg:right-6 z-[9999] hidden lg:flex items-center justify-center rounded-full border-2 backdrop-blur-xl cursor-pointer transition-all duration-300 hover:scale-105 ${
          playing
            ? 'h-11 w-11 border-[#F6D37A]/50 bg-[#0D0E12]/90 text-[#F6D37A]'
            : 'h-12 w-12 border-[#F6D37A]/40 bg-gradient-to-br from-[#1A1610] to-[#0D0E12] text-[#F6D37A]'
        }`}
        style={{ animation: playing ? 'musicGlow 2.5s ease-in-out infinite' : 'musicGlow 3s ease-in-out infinite' }}
      >
        {playing ? (
          <span className="flex items-end gap-[2.5px] h-[16px]">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                style={{
                  width: '2.5px',
                  borderRadius: '2px',
                  background: 'linear-gradient(to top, #B88717, #F6D37A)',
                  animation: `musicBar 0.5s ease-in-out ${i * 0.1}s infinite alternate`,
                }}
              />
            ))}
          </span>
        ) : (
          <Music size={20} style={{ animation: 'noteFloat 2s ease-in-out infinite' }} />
        )}
      </button>
    </>
  );
};

export default BackgroundMusic;
