import { Box, ButtonGroup, IconButton, Text } from "@chakra-ui/react";
import { useCallback, useRef, useState } from "react";
import { FaMicrophone, FaPause, FaPlay, FaStop } from "react-icons/fa";
import { motion } from "framer-motion";

const MotionIconButton = motion(IconButton);

type RecordingStatus =
  | "idle"
  | "recording"
  | "paused"
  | "stopped"
  | "permission_denied";

interface UseReactMediaRecorderProps {
  audio?: boolean;
  onStop?: (blob: Blob) => void;
}

interface UseReactMediaRecorderReturn {
  status: RecordingStatus;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  mediaBlobUrl: string | null;
  pauseRecording: () => void;
  resumeRecording: () => void;
  reset: () => void;
}

const useReactMediaRecorder = ({
  audio = true,
  onStop,
}: UseReactMediaRecorderProps): UseReactMediaRecorderReturn => {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [mediaBlobUrl, setMediaBlobUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setMediaBlobUrl(null);
    audioChunksRef.current = [];
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio });
      streamRef.current = stream;

      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorderRef.current!.mimeType,
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        setMediaBlobUrl(audioUrl);

        if (onStop) {
          onStop(audioBlob);
        }

        audioChunksRef.current = [];
        setStatus("stopped");
      };

      mediaRecorderRef.current.start();
      setStatus("recording");
    } catch (error) {
      console.error("Error accessing microphone:", error);

      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setStatus("permission_denied");
      } else {
        setStatus("idle");
      }
    }
  }, [audio, onStop]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && ["recording", "paused"].includes(status)) {
      mediaRecorderRef.current.stop();

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    }
  }, [status]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && status === "recording") {
      mediaRecorderRef.current.pause();
      setStatus("paused");
    }
  }, [status]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && status === "paused") {
      mediaRecorderRef.current.resume();
      setStatus("recording");
    }
  }, [status]);

  return {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    pauseRecording,
    resumeRecording,
    reset,
  };
};

export const MediaRecorderComponent: React.FC<{
  onRecordEnd: (blob: Blob) => void;
}> = ({ onRecordEnd }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    pauseRecording,
    resumeRecording,
    reset,
  } = useReactMediaRecorder({
    audio: true,
    onStop: (blob) => onRecordEnd(blob),
  });
  const [isPlayingFinishedAudio, setIsPlayingFinishedAudio] = useState(false);
  const isRecording = status === "recording";
  const isPaused = status === "paused";
  const isStopped = status === "stopped";

  return (
    <Box
      width="full"
      borderWidth={2}
      borderStyle="dashed"
      borderColor={isRecording ? "blue.500" : "whiteAlpha.200"}
      borderRadius="lg"
      p={8}
      textAlign="center"
      transition="border-color 0.2s ease-in-out"
      cursor="pointer"
      bg={"whiteAlpha.100"}
      _hover={{
        borderColor: "blue.500",
      }}
    >
      <ButtonGroup gap={4}>
        {status === "permission_denied" && (
          <Text color="red.500">Permission denied to record audio</Text>
        )}
        {isRecording ? (
          <MotionIconButton
            variant="outline"
            size="lg"
            borderRadius="full"
            aria-label="Pause Recording"
            onClick={pauseRecording}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FaPause />
          </MotionIconButton>
        ) : isPaused ? (
          <MotionIconButton
            variant="outline"
            size="lg"
            borderRadius="full"
            aria-label="Resume Recording"
            onClick={resumeRecording}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FaMicrophone />
          </MotionIconButton>
        ) : (
          !isStopped && (
            <MotionIconButton
              variant="solid"
              size="lg"
              borderRadius="full"
              aria-label="Start Recording"
              onClick={startRecording}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaMicrophone />
            </MotionIconButton>
          )
        )}
        {isStopped &&
          (!isPlayingFinishedAudio ? (
            <MotionIconButton
              variant="solid"
              size="lg"
              borderRadius="full"
              aria-label="Play Recording"
              onClick={() => {
                setIsPlayingFinishedAudio(true);
                audioRef.current?.play();
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaPlay />
            </MotionIconButton>
          ) : (
            <MotionIconButton
              variant="outline"
              size="lg"
              borderRadius="full"
              onClick={() => {
                setIsPlayingFinishedAudio(false);
                audioRef.current?.pause();
              }}
              aria-label="Pause Playback"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaPause />
            </MotionIconButton>
          ))}
        {(isRecording || isPaused) && (
          <MotionIconButton
            variant="ghost"
            size="lg"
            colorScheme="red"
            borderRadius="full"
            aria-label="Stop Recording"
            onClick={stopRecording}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FaStop />
          </MotionIconButton>
        )}
      </ButtonGroup>

      {mediaBlobUrl && <audio ref={audioRef} src={mediaBlobUrl} controls hidden />}
    </Box>
  );
};
