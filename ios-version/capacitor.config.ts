import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // TODO: 替换为你自己的 Bundle ID（需与 Apple 开发者账号一致）
  appId: 'com.pinyinlearning.app',
  appName: '拼音乐园',
  webDir: 'dist',
  ios: {
    // 允许在 WKWebView 中以内联方式播放音频
    contentInset: 'always',
  },
};

export default config;
