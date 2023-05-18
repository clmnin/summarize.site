import * as DOMPurify from "dompurify";
import html2md from "html-to-md";
import CrossIC from "../../../assets/res/cross.svg";

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
      display: block;
      font-size: 16px;
      --summarize-color-white: #fff;
      --summarize-color-gray-2: #fafafa;
      --summarize-color-divider: #eeeeee;
      --summarize-color-black: #222;
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
        props: { className: "min-h-lg min-w-sm duration-400 fixed right-4 top-8 z-50 flex max-h-lg max-w-sm flex-col items-center justify-center rounded-lg bg-white shadow-md transition-all ease-in-out" },
        children: [
          {
            tag: "div",
            props: { className: "flex h-12 w-full items-center justify-between rounded-t-lg bg-gray-200 px-4" },
            children: [
              {
                tag: "div",
                props: { id: "summarize__heading-text", className: "text-5-xl font-bold text-black" },
              },
              { tag: "img", props: { id: "summarize__close-button", className: "h-6 w-6 cursor-pointer", src: CrossIC, alt: "close" } }
            ],
          },
          { tag: "div", props: { className: "w-full h-1 bg-gray-300" } },
          {
            tag: "div",
            props: { className: "w-full h-full px-4 py-4 overflow-y-auto" },
            children: [
              {
                tag: "div",
                props: { id: "summarize__body", className: "flex flex-col text-3-xl text-gray-700 mb-2 whitespace-pre-line" },
              },
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
  root.style.top = '10px';
  root.style.right = '10px';
  root.style.zIndex = '9999'; // Make sure it's on top of other elements

  const innerContainerHeading = container.querySelector("#summarize__heading-text");
  innerContainerHeading.innerHTML = '<p>Summarized by <a href="https://chat.openai.com/chat" target="_blank">ChatGPT</a></p>';

  const innerContainerBody = container.querySelector("#summarize__body");
  innerContainerBody.innerHTML = '<p>Waiting for ChatGPT response...</p>';

  const closeButton = container.querySelector("#summarize__close-button");
  closeButton.addEventListener("click", function () {
    document.body.removeChild(root);
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
