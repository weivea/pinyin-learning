/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Azure Speech 资源 key。仅在联网 TTS 时使用。 */
  readonly VITE_AZURE_SPEECH_KEY?: string;
  /** Azure Speech 资源端点，形如 https://<resource>.cognitiveservices.azure.com/ */
  readonly VITE_AZURE_SPEECH_ENDPOINT?: string;
  /** 可选：覆盖默认音色 zh-CN-XiaoxiaoNeural。 */
  readonly VITE_AZURE_SPEECH_VOICE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
