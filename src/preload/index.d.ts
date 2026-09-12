import type { mainApi } from "./index";

declare global {
  interface Window {
    mainApi: typeof mainApi;
  }
}
