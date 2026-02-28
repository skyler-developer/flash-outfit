import type { UserConfigExport } from "@tarojs/cli"

export default {
  // 修复 Zustand 5.x 在微信小程序开发模式下 "create is not a function" 的 Taro 已知问题
  // 见 https://github.com/NervJS/taro/issues/17350
  mini: {
    debugReact: true,
  },
  h5: {},
} satisfies UserConfigExport<"vite">;
