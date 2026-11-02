"use client";

import { useState } from "react";

type State = { status: "idle" | "loading" } | { status: "done"; text: string } | { status: "failed" };

/** The first command on the page, run for real: a reader sees a quote before they open a terminal. */
export function TryCurl() {
  const [state, setState] = useState<State>({ status: "idle" });

  const run = async () => {
    setState({ status: "loading" });
    try {
      const response = await fetch("https://api.shuoshuotw.xyz/v1/quotes/random?format=text");
      if (!response.ok) throw new Error(String(response.status));
      setState({ status: "done", text: await response.text() });
    } catch {
      setState({ status: "failed" });
    }
  };

  return (
    <div className="try-curl not-prose">
      <button type="button" className="try-button" disabled={state.status === "loading"} onClick={() => void run()}>
        {state.status === "idle" ? "在這裡執行" : "再抽一句"}
      </button>
      <output className="try-output">
        {state.status === "done" && state.text}
        {state.status === "failed" && "沒有連上 API，請稍後再試。"}
      </output>
    </div>
  );
}
