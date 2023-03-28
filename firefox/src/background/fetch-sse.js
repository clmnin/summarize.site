import { createParser } from "eventsource-parser";
import { streamAsyncIterable } from "./stream-async-iterable.js";

export async function fetchSSE(resource, options) {
  const { onMessage, onError, ...fetchOptions } = options;
  const resp = await fetch(resource, fetchOptions).catch((err) => onError(err));
  const parser = createParser((event) => {
    if (event.type === "event") {
      onMessage(event.data);
    }
  });
  for await (const chunk of streamAsyncIterable(resp.body)) {
    const str = new TextDecoder().decode(chunk);
    parser.feed(str);
  }
}
