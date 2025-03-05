import "./App.css";
import { MediaRecorderComponent } from "./components/MediaRecord";
import { ChakraProvider } from "@chakra-ui/react";
import { defaultSystem } from "@chakra-ui/react";

function App() {
  return (
    <ChakraProvider value={defaultSystem}>
      <h1>Media Recorder</h1>
      <MediaRecorderComponent onRecordEnd={console.log} />
    </ChakraProvider>
  );
}

export default App;
