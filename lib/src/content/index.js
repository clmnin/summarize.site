import * as DOMPurify from "dompurify";
import html2md from "html-to-md";
import CrossIC from "../../../assets/res/cross.svg";

const randomNumberBetween = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

const onAnimationButtonClick = (container, sparklesCount) => {
  // Letter animation
  container.querySelectorAll('.summarize__animated-letter').forEach((el, i) => {
    el.animate([
      { transform: 'translateY(0px)' },
      { transform: 'translateY(-16px)' },
    ], {
      duration: 200,
      delay: i * 50,
      fill: 'forwards'
    });
  });

  // Sparkle animation
  for (let i = 0; i < sparklesCount; i++) {
    const sparkle = container.querySelector(`.sparkle-${i}`);
    sparkle.animate([
      { transform: 'translate(0px, 0px)', opacity: 0 },
      { transform: `translate(${randomNumberBetween(-100, 100)}px, ${randomNumberBetween(-100, 100)}px)`, opacity: 1 },
    ], {
      duration: 500,
      easing: 'ease-out',
      fill: 'forwards'
    });

    // Add fade-out animation after the previous animation
    sparkle.animate([
      { opacity: 1 },
      { opacity: 0 }
    ], {
      delay: 500, // Delay the start of the fade-out animation by the duration of the previous animation
      duration: 500, // Set the duration for the fade-out animation
      easing: 'ease-in',
      fill: 'forwards'
    });
  }

  // Button scaling animation
  const button = container.querySelector('#summarize__animation-button');
  button.animate([
    { transform: 'scale(1)' },
    { transform: 'scale(0.8)' },
    { transform: 'scale(1)' }
  ], {
    duration: 200,
    fill: 'forwards'
  });
};

// Check given item against blacklist, return null if in blacklist
const blacklist = ["comment"];
function checkAgainstBlacklist(elem, level) {
  if (elem && elem != null) {
    const className = elem.className,
      id = elem.id;

    const isBlackListed = blacklist
      .map((item) => {
        if (
          (typeof className === "string" && className.indexOf(item) >= 0) ||
          (typeof id === "string" && id.indexOf(item) >= 0)
        ) {
          return true;
        }
      })
      .filter((item) => item)[0];

    if (isBlackListed) {
      return null;
    }

    const parent = elem.parentElement;
    if (level > 0 && parent && !parent.isSameNode(document.body)) {
      return checkAgainstBlacklist(parent, --level);
    }
  }

  return elem;
}

let contentSelector;
function getContainer() {
  let selectedContainer;

  if (contentSelector && document.querySelector(contentSelector)) {
    selectedContainer = document.querySelector(contentSelector);
  } else if (document.head.querySelector("meta[name='articleBody'")) {
    selectedContainer = document.createElement("div");
    selectedContainer.innerHTML = DOMPurify.sanitize(
      document.head
        .querySelector("meta[name='articleBody'")
        .getAttribute("content")
    );
  } else {
    const numWordsOnPage = document.body.innerText.match(/\S+/g).length;
    let ps = document.body.querySelectorAll("p");

    // Find the paragraphs with the most words in it
    let pWithMostWords = document.body,
      highestWordCount = 0;

    if (ps.length === 0) {
      ps = document.body.querySelectorAll("div");
    }

    ps.forEach((p) => {
      if (
        checkAgainstBlacklist(p, 3) && // Make sure it's not in our blacklist
        p.offsetHeight !== 0
      ) {
        //  Make sure it's visible on the regular page
        const myInnerText = p.innerText.match(/\S+/g);
        if (myInnerText) {
          const wordCount = myInnerText.length;
          if (wordCount > highestWordCount) {
            highestWordCount = wordCount;
            pWithMostWords = p;
          }
        }
      }

      // Remove elements in JR that were hidden on the original page
      if (p.offsetHeight === 0) {
        p.dataset.simpleDelete = true;
      }
    });

    // Keep selecting more generally until over 2/5th of the words on the page have been selected
    selectedContainer = pWithMostWords;
    let wordCountSelected = highestWordCount;

    while (
      wordCountSelected / numWordsOnPage < 0.4 &&
      selectedContainer != document.body &&
      selectedContainer.parentElement.innerText
    ) {
      selectedContainer = selectedContainer.parentElement;
      wordCountSelected = selectedContainer.innerText.match(/\S+/g).length;
    }

    // Make sure a single p tag is not selected
    if (selectedContainer.tagName === "P") {
      selectedContainer = selectedContainer.parentElement;
    }
  }

  return selectedContainer;
}

function getContentOfArticle() {
  let pageSelectedContainer = getContainer();

  const pattern1 = /<a\b[^>]*>(.*?)<\/a>/gi;
  pageSelectedContainer.innerHTML = DOMPurify.sanitize(
    pageSelectedContainer.innerHTML.replace(pattern1, "")
  );
  const pattern2 = new RegExp("<br/?>[ \r\ns]*<br/?>", "g");
  pageSelectedContainer.innerHTML = DOMPurify.sanitize(
    pageSelectedContainer.innerHTML.replace(pattern2, "</p><p>")
  );

  let content = DOMPurify.sanitize(pageSelectedContainer.innerHTML);
  content = html2md(content);
  return content;
}

function addStylesheet(doc, link, classN) {
  const path = chrome.runtime.getURL(link),
    styleLink = document.createElement("link");

  styleLink.setAttribute("rel", "stylesheet");
  styleLink.setAttribute("type", "text/css");
  styleLink.setAttribute("href", path);

  if (classN) styleLink.className = classN;

  doc.appendChild(styleLink);

  const style = document.createElement("style");
  style.textContent = `
    :host {
      all: initial;
    }
    .summarize-gpt-container * {
      font-family: sans-serif;
      line-height: normal;
      font-size: 16px;
    }
  `;
  doc.appendChild(style);
}

function copyTextToClipboard(text) {
  var copyButton = document.querySelector("#copy-button");
  navigator.clipboard.writeText(text).then(function () {
    copyButton.textContent = 'Copied';
  }, function () {
    copyButton.textContent = 'Failed';
  });
}

const ce = ({ props, tag, children, name }, elementsObj) => {
  const elm = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === "style") {
      Object.entries(v).forEach(([k2, v2]) => {
        elm.style[k2] = v2;
      });
    } else {
      elm[k] = v;
    }
  });
  if (children) {
    children.forEach((x) => {
      if (x) {
        const child = ce(x, elementsObj);
        elm.appendChild(child);
      }
    });
  }
  if (name && elementsObj) {
    // eslint-disable-next-line no-param-reassign
    elementsObj[name] = elm;
  }
  return elm;
};

function createContainer() {
  return ce({
    tag: "div",
    props: { className: "summarize-gpt-container" },
    children: [
      {
        tag: "div",
        props: { className: "sumz-min-w-[30%] sumz-max-h-[80%] sumz-max-w-[30%] sumz-fixed sumz-right-4 sumz-top-8 sumz-flex sumz-flex-col sumz-items-center sumz-justify-center sumz-rounded-lg sumz-bg-white sumz-shadow-md" },
        children: [
          // heading
          {
            tag: "div",
            props: { className: "sumz-flex sumz-h-[40px] sumz-w-full sumz-items-center sumz-justify-between sumz-rounded-t-lg sumz-bg-gray-200 sumz-px-4" },
            children: [
              {
                tag: "div",
                props: { id: "summarize__heading-text", className: "sumz-text-xl sumz-font-black sumz-animate-text sumz-bg-gradient-to-r sumz-from-teal-500 sumz-via-purple-500 sumz-to-orange-500 sumz-bg-clip-text sumz-text-transparent" },
              },
              { tag: "img", props: { id: "summarize__close-button", className: "sumz-h-[24px] sumz-w-6 sumz-cursor-pointer sumz-rounded-lg hover:sumz-bg-sky-200", src: CrossIC, alt: "close" } }
            ],
          },
          // divider
          { tag: "div", props: { className: "sumz-w-full sumz-h-1 sumz-bg-gray-300" } },
          // body
          {
            tag: "div",
            props: { className: "sumz-h-full sumz-w-full sumz-overflow-y-auto sumz-px-4 sumz-py-4" },
            children: [
              {
                tag: "div",
                props: { id: "summarize__body", className: "sumz-text-3-xl sumz-mb-2 sumz-flex sumz-flex-col sumz-whitespace-pre-line sumz-text-gray-700" },
              },
            ],
          },
          // divider
          { tag: "div", props: { className: "sumz-w-full sumz-h-1 sumz-bg-gray-200" } },
          // footer
          {
            tag: "div",
            props: { className: "sumz-m-2" },
            children: [
              {
                tag: "div",
                props: { className: "sumz-flex sumz-h-[32px] sumz-w-full sumz-items-center sumz-justify-center" },
                children: [
                  {
                    tag: "div",
                    props: {
                      className: "sumz-text-lg sumz-font-bold sumz-text-gray-600",
                      innerText: "Help Us"
                    },
                  },
                  {
                    tag: "button",
                    props: {
                      id: "summarize__animation-button",
                      onclick: () => window.open('https://tally.so/r/woD2eP', "_blank"),
                      className: "sumz-rounded-full sumz-border-2 sumz-border-sky-600 sumz-m-2 sumz-px-1 sumz-py-1 sumz-text-lg sumz-text-sky-600 sumz-transition-colors hover:sumz-bg-sky-100",
                    },
                    children: [
                      {
                        tag: "span",
                        props: {
                          className: "sumz-pointer-events-none sumz-absolute sumz-inset-0 -sumz-z-10 sumz-block",
                          id: "summarize__sparkles-container"
                        },
                      },
                      {
                        tag: "span",
                        props: {
                          className: "sumz-block sumz-h-[16px] sumz-overflow-hidden sumz-z-10",
                          id: "summarize__letters-container"
                        },
                      },
                    ],
                  }
                ],
              },
              {
                tag: "div",
                props: {
                  className: "sumz-text-sm sumz-text-gray-600 sumz-pt-2",
                  innerText: "Share Your Feedback & Ideas for Summarize and Beyond"
                }
              }
            ],
          }
        ],
      },
    ],
  });
}

async function run() {
  const container = createContainer();

  let root = document.createElement('div');
  root.id = "summarize-root";
  document.body.appendChild(root);

  let shadowRoot = root.attachShadow({ mode: 'open' });

  // Appending the styles to the shadow root
  if (!shadowRoot.querySelector(".summarize-styles"))
    addStylesheet(shadowRoot, "styles.css", "summarize-styles");

  shadowRoot.appendChild(container);

  // Adding styles to position the root
  root.style.position = 'fixed';
  root.style.zIndex = '9999'; // Make sure it's on top of other elements

  const innerContainerHeading = container.querySelector("#summarize__heading-text");
  innerContainerHeading.innerHTML = '<p>Summarized <a href="https://chat.openai.com/chat" target="_blank" class="sumz-text-sm">by ChatGPT</a></p>';

  const innerContainerBody = container.querySelector("#summarize__body");
  innerContainerBody.innerHTML = '<p>Waiting for ChatGPT response...</p>';

  const closeButton = container.querySelector("#summarize__close-button");
  closeButton.addEventListener("click", function () {
    document.body.removeChild(root);
  });

  // animated button
  const letters = ["I", "n", "n", "o", "v", "a", "t", "e"];
  const lettersContainer = container.querySelector("#summarize__letters-container");

  // Add letters dynamically
  letters.forEach((letter, index) => {
    const letterSpan = document.createElement("span");
    letterSpan.setAttribute("data-letter", letter);
    letterSpan.className = "summarize__animated-letter sumz-relative sumz-inline-block sumz-h-[16px] sumz-leading-[16px] after:sumz-absolute after:sumz-left-0 after:sumz-top-full after:sumz-h-[16px] after:sumz-content-[attr(data-letter)]";
    letterSpan.textContent = letter;
    lettersContainer.appendChild(letterSpan);
  });
  // Add sparkles dynamically
  const sparklesCount = 10;
  const sparklesContainer = container.querySelector("#summarize__sparkles-container");
  const sparkleCssClass = Array('sumz-fill-sky-600', 'sumz-fill-emerald-600', 'sumz-fill-indigo-600', 'sumz-fill-rose-600', 'sumz-fill-amber-600');

  for (let i = 0; i < sparklesCount; i++) {
    const sparkleSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    sparkleSvg.classList.add(`sumz-absolute`, `sumz-left-1/2`, `sumz-top-1/2`, `sumz-opacity-0`, `sparkle-${i}`);
    sparkleSvg.setAttribute("viewBox", "0 0 122 117");
    const dimention = randomNumberBetween(10, 16);
    sparkleSvg.setAttribute("width", `${dimention}`);
    sparkleSvg.setAttribute("height", `${dimention}`);

    const sparklePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const sprinkleColor = sparkleCssClass[Math.floor(Math.random() * sparkleCssClass.length)];
    sparkleSvg.classList.add(sprinkleColor);
    sparklePath.setAttribute("d", "M64.39,2,80.11,38.76,120,42.33a3.2,3.2,0,0,1,1.83,5.59h0L91.64,74.25l8.92,39a3.2,3.2,0,0,1-4.87,3.4L61.44,96.19,27.09,116.73a3.2,3.2,0,0,1-4.76-3.46h0l8.92-39L1.09,47.92A3.2,3.2,0,0,1,3,42.32l39.74-3.56L58.49,2a3.2,3.2,0,0,1,5.9,0Z");

    sparkleSvg.appendChild(sparklePath);
    sparklesContainer.appendChild(sparkleSvg);
  }
  lettersContainer.addEventListener("mouseenter", function () {
    onAnimationButtonClick(container, sparklesCount);
  });

  let content;
  let selection = window.getSelection();

  if (selection.isCollapsed) {
    content = getContentOfArticle();
  } else {
    content = selection.toString();
  }

  const port = chrome.runtime.connect();
  port.onMessage.addListener(function (msg) {
    if (msg.answer) {
      innerContainerBody.innerHTML = msg.answer;
    } else if (msg.error === "UNAUTHORIZED") {
      innerContainerBody.innerHTML =
        '<p>Please login at <a href="https://chat.openai.com" target="_blank">chat.openai.com</a></p>';
    } else {
      innerContainerBody.innerHTML = "<p>Failed to load response from ChatGPT</p>";
    }
  });
  port.postMessage({ content });
}

run();
