import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // TODO: 替换为你自己的 Bundle ID（需与 Apple 开发者账号一致）
  appId: 'com.pinyinlearning.app',
  appName: '我爱学习',
  webDir: 'dist',
  ios: {
    // 安全区已由 CSS（viewport-fit=cover + env(safe-area-inset-*)）处理，
    // 不要再让 WKWebView 加原生 contentInset：'always' 会给 scrollView 顶部
    // 加一段 inset 并产生外层滚动，横竖屏切换后 contentOffset 与 inset 失步，
    // 使整块网页内容被下移约一个安全区高度——表现为汉字描红手写墨迹相对手指
    // 向下漂移（漂移量恰等于顶部留白）。保持默认 'never'。
    contentInset: 'never',
    // 本应用自行用 .app-shell(100dvh, overflow:hidden) + .page-main(overflow-y:auto)
    // 管理内部滚动，不需要 WKWebView 外层整页滚动。禁用它可彻底消除上面的转屏漂移。
    scrollEnabled: false,
  },
};

export default config;
