import { Box, ButtonGroup, IconButton, Text } from "@chakra-ui/react";
import { useCallback, useRef, useState } from "react";
import { FaMicrophone, FaStop } from "react-icons/fa";
import { motion } from "framer-motion";

const MotionIconButton = motion(IconButton);

export const MediaRecorderComponent: React.FC<{ onRecordEnd: (blob: Blob) => void }> = ({ onRecordEnd }) => {
  const [status, setStatus] = useState<"idle" | "recording" | "stopped" | "permission_denied">("idle");
  const [mediaBlobUrl, setMediaBlobUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorderRef.current!.mimeType,
        });
        setMediaBlobUrl(URL.createObjectURL(audioBlob));
        onRecordEnd(audioBlob);
        audioChunksRef.current = [];
        setStatus("stopped");
      };
      mediaRecorderRef.current.start();
      setStatus("recording");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setStatus("permission_denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && status === "recording") {
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    }
  };

  return (
    <Box textAlign="center">
      <ButtonGroup>
        {status === "permission_denied" && <Text color="red.500">Permission denied</Text>}
        <MotionIconButton
          variant={status === "recording" ? "solid" : "outline"}
          size="lg"
          borderRadius="full"
          aria-label="Start Recording"
          onClick={status === "recording" ? stopRecording : startRecording}
          animate={{ scale: status === "recording" ? 1.2 : 1 }}
          transition={{ duration: 0.2 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {status === "recording" ? <FaStop /> : <FaMicrophone />}
        </MotionIconButton>
      </ButtonGroup>
      {mediaBlobUrl && <audio ref={audioRef} src={mediaBlobUrl} controls hidden />}
    </Box>
  );
};
