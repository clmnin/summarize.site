import * as DOMPurify from 'dompurify';
import html2md from 'html-to-md'
import CrossIC from './cross.svg';

// Check given item against blacklist, return null if in blacklist
const blacklist = ["comment"];
function checkAgainstBlacklist(elem, level) {
  if (elem && elem != null) {
    const className = elem.className,
      id = elem.id;

    const isBlackListed = blacklist.map(item => {
      if ((typeof className === "string" && className.indexOf(item) >= 0)
        || (typeof id === "string" && id.indexOf(item) >= 0)
      ) {
        return true;
      }
    }).filter(item => item)[0];

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
    selectedContainer.innerHTML = DOMPurify.sanitize(document.head.querySelector("meta[name='articleBody'").getAttribute("content"));
  } else {
    const numWordsOnPage = document.body.innerText.match(/\S+/g).length;
    let ps = document.body.querySelectorAll("p");

    // Find the paragraphs with the most words in it
    let pWithMostWords = document.body,
      highestWordCount = 0;

    if (ps.length === 0) {
      ps = document.body.querySelectorAll("div");
    }

    ps.forEach(p => {
      if (checkAgainstBlacklist(p, 3) // Make sure it's not in our blacklist
        && p.offsetHeight !== 0) { //  Make sure it's visible on the regular page
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

    while (wordCountSelected / numWordsOnPage < 0.4
      && selectedContainer != document.body
      && selectedContainer.parentElement.innerText) {
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
  pageSelectedContainer.innerHTML = DOMPurify.sanitize(pageSelectedContainer.innerHTML.replace(pattern1, ""));
  const pattern2 = new RegExp("<br/?>[ \r\n\s]*<br/?>", "g");
  pageSelectedContainer.innerHTML = DOMPurify.sanitize(pageSelectedContainer.innerHTML.replace(pattern2, "</p><p>"));

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

  if (classN)
    styleLink.className = classN;

  doc.head.appendChild(styleLink);
}

const ce = ({
  props, tag, children, name,
}, elementsObj) => {
  const elm = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => {
    if (k === 'style') {
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
    tag: 'div',
    props: { className: 'summarize-gpt-container' },
    children: [{
      tag: 'div',
      props: { className: 'summarize__main-body' },
      children: [{
        tag: 'div',
        props: { className: 'summarize__main-body__top-bar' },
        children: [{
          tag: 'div',
          props: { className: 'summarize__main-body__top-bar__rhs' },
          children: [{
            tag: 'div',
            props: { className: 'summarize__main-body__top-bar__rhs__element' },
            children: [{
              tag: 'div',
              props: {
                onclick: () => {
                  const element = document.querySelector('.summarize-gpt-container');
                  element.parentNode.removeChild(element);
                },
                className: 'summarize__main-body__top-bar__rhs__element__closeButton',
              },
              children: [{ tag: 'img', props: { src: CrossIC }, },],
            }]
          }]
        }]
      }, {
        tag: 'div',
        props: { className: 'summarize__content-container' },
        children: [{
          tag: 'div',
          props: { className: 'summarize__content-outer-container' },
          children: [{
            tag: 'div',
            props: { className: 'summarize__content-inner-container' },
            children: []
          }]
        }],
      }]
    }]
  })
}

async function run() {
  if (!document.head.querySelector(".summarize-styles")) addStylesheet(document, "styles.css", "summarize-styles");
  const container = createContainer();
  document.body.appendChild(container);

  const innerContainer = container.querySelector(".summarize__content-inner-container");
  innerContainer.innerHTML = '<p class="loading">Waiting for ChatGPT response...</p>';

  const content = getContentOfArticle();

  const port = chrome.runtime.connect();
  port.onMessage.addListener(function (msg) {
    if (msg.answer) {
      innerContainer.innerHTML = '<p><span class="prefix">Summary by ChatGPT:</span><pre></pre></p>';
      innerContainer.querySelector("pre").textContent = msg.answer;
    } else if (msg.error === "UNAUTHORIZED") {
      innerContainer.innerHTML =
        '<p>Please login at <a href="https://chat.openai.com" target="_blank">chat.openai.com</a> first</p>';
    } else {
      innerContainer.innerHTML = "<p>Failed to load response from ChatGPT</p>";
    }
  });
  port.postMessage({ content });


}

run();