# PocketLLM

A cross-platform mobile app for running LLMs locally on your device using llama.cpp. Built with React Native and llama.rn.

## Features

- **On-Device AI**: Run language models locally without internet connection
- **Cross-Platform**: Works on both iOS and Android
- **Device-Aware**: Automatically detects device capabilities and recommends appropriate models
- **5-Tier System**: Supports devices from ultra-low spec (<3GB RAM) to premium (8GB+ RAM)
- **Modern UI**: Clean, responsive interface with dark mode support
- **Model Management**: Download models from Hugging Face or import local GGUF files
- **Customizable**: Adjust generation parameters (temperature, top-p, top-k, etc.)
- **Streaming Output**: Real-time token generation display

## Supported Models

### Ultra Low Tier (<3GB RAM)
- SmolLM 135M Instruct
- SmolLM 360M Instruct

### Low Tier (3-4GB RAM)
- Qwen 2.5 0.5B Instruct
- SmolLM 1.7B Instruct

### Medium Tier (4-6GB RAM)
- Phi-3 Mini 4K Instruct
- Gemma 2 2B Instruct

### High Tier (6-8GB RAM)
- Llama 3.2 3B Instruct

### Premium Tier (8GB+ RAM)
- Mistral 7B Instruct v0.3

## Prerequisites

- Node.js 18+ and npm
- React Native development environment setup
  - For Android: Android Studio, JDK 17+, Android SDK
  - For iOS: Xcode 15+, CocoaPods (macOS only)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/sarfaraz-78/PocketLLM.git
cd PocketLLM
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Install iOS dependencies (macOS only):
```bash
cd ios && pod install && cd ..
```

## Running the App

### Android
```bash
npm run android
```

### iOS (macOS only)
```bash
npm run ios
```

## Usage

1. **First Launch**: The app will detect your device capabilities and assign a performance tier
2. **Download a Model**: Go to the Models tab and download a recommended model for your tier
3. **Load the Model**: Tap "Load" on a downloaded model
4. **Start Chatting**: Go to the Chat tab and start a conversation!

## Configuration

### Generation Settings
- **Temperature**: Controls randomness (0-2, default: 0.7)
- **Top P**: Nucleus sampling threshold (0-1, default: 0.9)
- **Top K**: Top-k sampling limit (1-100, default: 40)
- **Max Tokens**: Maximum response length (64-2048, default: 512)
- **Repeat Penalty**: Penalize repetitive text (1-2, default: 1.1)

### System Prompt
Customize the AI's behavior by editing the system prompt in Settings.

## Architecture

### Tech Stack
- **Framework**: React Native 0.79 (New Architecture)
- **Language**: TypeScript
- **Inference**: llama.rn v0.12+
- **State Management**: Zustand
- **Navigation**: React Navigation v7
- **Storage**: AsyncStorage + react-native-fs

### Project Structure
```
src/
  types/           # TypeScript type definitions
  utils/           # Constants, stop words, model recommendations
  inference/       # Device detection, preset manager, llama engine
  store/           # Zustand stores (chat, models, settings)
  services/        # HuggingFace API, file manager
  screens/         # Onboarding, Chat, Models, Settings
  components/      # Reusable UI components
  navigation/      # React Navigation setup
  theme/           # Colors, spacing, typography
```

## Device Tier System

The app automatically optimizes performance based on your device:

| Tier | RAM | Context Size | GPU Layers | KV Cache |
|------|-----|--------------|------------|----------|
| Ultra Low | <3GB | 512 | 0 (CPU) | q4_0 |
| Low | 3-4GB | 1024 | 0 (CPU) | q4_0 |
| Medium | 4-6GB | 2048 | 20 | q8_0 |
| High | 6-8GB | 4096 | 99 | q8_0 |
| Premium | 8GB+ | 8192 | 99 | f16 |

## Low-Spec Optimizations

- **Quantized KV Cache**: q4_0 cache saves ~75% memory
- **Memory-Mapped Loading**: Reduces peak RAM usage
- **Thread Limiting**: Prevents CPU thrashing on weak devices
- **Context Shifting**: Allows longer conversations with limited context
- **Model Validation**: Warns before loading oversized models

## Building for Production

### Android
```bash
cd android
./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

### iOS
Open `ios/PocketLLM.xcworkspace` in Xcode and archive the project.

## Troubleshooting

### Model fails to load
- Check available storage space
- Verify the model file is not corrupted
- Try a smaller model for your device tier

### Slow generation
- Close other apps to free up RAM
- Use a smaller model or lower quantization
- Reduce context size in settings

### App crashes on model load
- Model may be too large for your device
- Try a model from a lower tier
- Restart the app and try again

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT License - see LICENSE file for details

## Acknowledgments

- [llama.cpp](https://github.com/ggerganov/llama.cpp) - LLM inference in C/C++
- [llama.rn](https://github.com/mybigday/llama.rn) - React Native binding for llama.cpp
- [Hugging Face](https://huggingface.co) - Model hosting and community

## Support

For issues and questions, please open an issue on GitHub.
